const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const source = fs.readFileSync(require('node:path').join(__dirname, 'admin.vue'), 'utf8')

test('较早的用户请求不能覆盖新筛选结果或结束新请求的加载状态', async () => {
  const pending = []
  const ref = value => ({ value })
  const context = {
    usersRequestId: 0, isLoading: ref(false), users: ref([]), totalUsers: ref(0),
    searchPhone: ref(''), currentPage: ref(1), itemsPerPage: ref(10),
    onlyActive: ref(false), sortOrder: ref('asc'), showMessage: () => {},
    callCloudFunction: () => new Promise((resolve, reject) => pending.push({ resolve, reject }))
  }
  vm.createContext(context)
  const fetchSource = source.slice(source.indexOf('  const fetchUsers = () => {'), source.indexOf('  const fetchCookieStatus'))
  assert.ok(fetchSource.includes('usersRequestId'))
  const js = require('typescript').transpileModule(fetchSource, { compilerOptions: { target: 'ES2020' } }).outputText
  vm.runInContext(js + '\nthis.fetchUsers = fetchUsers', context)
  context.fetchUsers()
  context.onlyActive.value = true
  context.fetchUsers()
  pending[0].resolve({ result: { success: true, data: { users: ['old'], total: 210 } } })
  await new Promise(setImmediate)
  assert.equal(context.isLoading.value, true)
  assert.equal(context.users.value.length, 0)
  pending[1].resolve({ result: { success: true, data: { users: ['active'], total: 23 } } })
  await new Promise(setImmediate)
  assert.equal(context.users.value[0], 'active')
  assert.equal(context.totalUsers.value, 23)
  assert.equal(context.isLoading.value, false)
  context.fetchUsers()
  context.fetchUsers()
  pending[3].resolve({ result: { success: true, data: { users: ['latest'], total: 1 } } })
  await new Promise(setImmediate)
  pending[2].reject(new Error('旧请求失败'))
  await new Promise(setImmediate)
  assert.equal(context.users.value[0], 'latest')
})

test('切换筛选和每页条数时重置页码，只发起一次查询', () => {
  let callback
  let calls = 0
  const context = {
    onlyActive: {}, itemsPerPage: {}, currentPage: { value: 5 },
    watch: (_, handler) => { callback = handler }, fetchUsers: () => { calls++ }
  }
  const start = source.indexOf('  watch([onlyActive, itemsPerPage]')
  vm.runInNewContext(source.slice(start, source.indexOf('  watch(searchPhone', start)), context)
  callback()
  assert.equal(context.currentPage.value, 1)
  assert.equal(calls, 0) // 页码监听负责查询
  callback()
  assert.equal(calls, 1)
})
