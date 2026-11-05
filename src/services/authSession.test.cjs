const assert = require('node:assert/strict')
const test = require('node:test')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ts = require('typescript')
const { createRouter, createMemoryHistory } = require('vue-router')

function setup() {
    let listener
    let sdkSession = { user: { uid: 'test-user' } }
    const auth = {
        getLoginState: async () => sdkSession,
        hasLoginState: () => sdkSession,
        onLoginStateChanged: async callback => { listener = callback }
    }
    const modules = { '@/lib/cloudbase': { auth } }
    function load(name, filename) {
        const module = { exports: {} }
        modules[name] = module.exports
        const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, filename), 'utf8'), {
            compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }
        }).outputText
        vm.runInNewContext(code, { exports: module.exports, require: key => modules[key], console, Promise, Set, setTimeout: callback => setTimeout(callback, 30), clearTimeout })
        return module.exports
    }
    load('@/services/authTimeout', 'authTimeout.ts')
    const session = load('@/services/authSession', 'authSession.ts')
    const expired = load('@/services/authExpired', 'authExpired.ts')
    const router = createRouter({
        history: createMemoryHistory(),
        routes: [
            { path: '/', redirect: '/home' },
            { path: '/home', component: {}, meta: { requiresAuth: true } },
            { path: '/login', component: {} },
            { path: '/permission-unavailable', name: 'PermissionUnavailable', component: {} }
        ]
    })
    let pendingSync
    const userStore = {
        userInfo: null,
        hasSyncedInCurrentApp: false,
        clearLocalUser() { this.userInfo = null },
        refreshUserInfo() {
            if (!pendingSync) pendingSync = Promise.resolve().then(() => expired.handleAuthExpired('credentials not found'))
            return pendingSync
        }
    }
    modules['@/store/user'] = { useUserStore: () => userStore }
    modules['@/router'] = { default: router }
    const source = fs.readFileSync(path.join(__dirname, '../router/index.ts'), 'utf8')
    const guard = source.slice(source.indexOf('router.beforeEach('), source.indexOf('function checkCapability'))
    vm.runInNewContext(guard, {
        router, useUserStore: () => userStore, ...session, ...expired, console,
        checkCapability: (to, store, next) => next()
    })
    return { session, auth, router, userStore, modules, load, signIn() { listener(sdkSession) } }
}

test('expired credentials settle on login instead of waiting on the same user request', async () => {
    const { router } = setup()
    let timer
    try {
        const result = await Promise.race([
            router.push('/home').then(() => 'settled'),
            new Promise(resolve => { timer = setTimeout(() => resolve('stuck'), 300) })
        ])
        assert.equal(result, 'settled')
        assert.equal(router.currentRoute.value.path, '/login')
    } finally {
        clearTimeout(timer)
    }
})

test('invalidated credentials cannot be restored by verification; a new sign-in works', async () => {
    const { session, signIn } = setup()
    await session.initializeAuthSession()
    session.invalidateAuthSession()
    assert.equal(session.getAuthSession(), null)
    assert.equal(await session.verifyAuthSession(), null)
    assert.equal(await session.initializeAuthSession(), null)
    signIn()
    assert.equal(session.getAuthSession(), null)
    await session.completeAuthSignIn()
    assert.equal(session.getAuthSession().user.uid, 'test-user')
})

test('an in-flight verification cannot restore a session invalidated while awaiting the SDK', async () => {
    const { session, auth } = setup()
    await session.initializeAuthSession()
    let finish
    auth.getLoginState = () => new Promise(resolve => { finish = resolve })
    const checking = session.verifyAuthSession()
    session.invalidateAuthSession()
    finish({ user: { uid: 'test-user' } })
    assert.equal(await checking, null)
    assert.equal(session.getAuthSession(), null)
})

test('an SDK event during initialization still completes initialization and enables sign-in events', async () => {
    const { session, auth, signIn } = setup()
    let finish
    auth.getLoginState = () => new Promise(resolve => { finish = resolve })
    const events = []
    session.subscribeAuthSession(event => events.push(event.type))
    const initializing = session.initializeAuthSession()
    signIn()
    finish({ user: { uid: 'test-user' } })
    await initializing
    session.invalidateAuthSession()
    signIn()
    auth.getLoginState = async () => ({ user: { uid: 'test-user' } })
    await session.completeAuthSignIn()
    assert.deepEqual(events, ['initial', 'sign_in'])
})

test('hanging initialization reaches an error page and explicit retry recovers', async () => {
    const { session, auth, router } = setup()
    let finish
    auth.getLoginState = () => new Promise(resolve => { finish = resolve })
    await router.push('/home')
    assert.equal(router.currentRoute.value.name, 'PermissionUnavailable')
    assert.equal(router.currentRoute.value.query.redirect, '/home')
    finish({ user: { uid: 'old' } })
    await Promise.resolve()
    assert.equal(session.getAuthSession(), null)
    auth.getLoginState = async () => null
    await session.retryAuthSession()
    await router.push('/home')
    assert.equal(router.currentRoute.value.path, '/login')
})

test('a delayed SDK callback during expiry cannot recreate the navigation deadlock', async () => {
    const { session, router, signIn } = setup()
    await session.initializeAuthSession()
    const navigating = router.push('/home')
    queueMicrotask(() => queueMicrotask(signIn))
    await navigating
    assert.equal(router.currentRoute.value.path, '/login')
    signIn()
    assert.equal(session.getAuthSession(), null)
    assert.equal(await session.retryAuthSession(), null)
})

test('profile timeout releases the shared request so retry succeeds and late data cannot overwrite it', async () => {
    const { session, userStore, router, modules, load } = setup()
    await session.initializeAuthSession()
    let finishOld
    modules.pinia = { defineStore: (id, options) => options }
    modules['@/services/cloudFunction'] = { callCloudFunction: () => new Promise(resolve => { finishOld = resolve }) }
    const definition = load('user-under-test', '../store/user.ts').useUserStore
    const realStore = { ...definition.state(), ...definition.actions }
    userStore.refreshUserInfo = () => realStore.refreshUserInfo()
    await router.push('/home')
    assert.equal(router.currentRoute.value.name, 'PermissionUnavailable')
    modules['@/services/cloudFunction'].callCloudFunction = async () => ({ result: { uid: 'test-user', capabilities: ['app:read'] } })
    await realStore.refreshUserInfo()
    finishOld({ result: { uid: 'stale-user' } })
    await Promise.resolve()
    assert.equal(realStore.userInfo.uid, 'test-user')
    assert.equal(realStore.hasSyncedInCurrentApp, true)
})

test('bootstrap mounts immediately without waiting for a network request', async () => {
    const source = fs.readFileSync(path.join(__dirname, '../main.ts'), 'utf8')
    const bootstrap = source.slice(source.indexOf('const bootstrap ='), source.indexOf('void bootstrap'))
    let mounted = false
    const context = {
        install() {}, createPinia: () => ({}), useUserStore: () => ({}),
        subscribeAuthSession() {}, router: {}, console,
        initializeAuthSession: () => new Promise(() => {})
    }
    vm.createContext(context)
    vm.runInContext(ts.transpile(`${bootstrap}\nglobalThis.run = bootstrap`, { target: ts.ScriptTarget.ES2020 }), context)
    await context.run({ use() {}, mount() { mounted = true } })
    assert.equal(mounted, true)
})
