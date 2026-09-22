import { onUnmounted, ref, watch } from 'vue'
import { useUserStore } from '@/store/user'
import { callCloudFunction } from '@/services/cloudFunction'

export function useEtfRotation() {
    const userStore = useUserStore()
    const settings = ref({ holding: '', threshold: 0.5, version: 0, previousHolding: '', switchedAt: 0, enabled: true, dismissed: false })
    const storageError = ref('')
    const ready = ref(false)
    let key = ''
    let generation = 0
    function readPreference() {
        try { settings.value.enabled = localStorage.getItem(key) !== 'false' }
        catch { storageError.value = '本机通知偏好读取失败' }
    }
    async function reload() {
        const requestGeneration = generation
        if (!key) return
        try {
            const response = await callCloudFunction({ name: 'etfRotation', data: { action: 'get' } })
            if (requestGeneration !== generation) return
            const result = response.result
            if (!result?.success) throw new Error(result?.message || '策略配置读取失败')
            const changed = settings.value.version !== result.data.version
            Object.assign(settings.value, result.data)
            if (changed) settings.value.dismissed = false
            ready.value = true
            storageError.value = ''
        } catch (error: any) { if (requestGeneration === generation) { ready.value = false; storageError.value = error.message } }
    }
    watch(() => userStore.userInfo?.uid, uid => {
        generation++
        key = uid ? `etf-rotation-alert:v2:${uid}` : ''
        settings.value = { holding: '', threshold: 0.5, version: 0, previousHolding: '', switchedAt: 0, enabled: true, dismissed: false }
        ready.value = false
        if (key) { readPreference(); reload() }
    }, { immediate: true })
    async function update(patch: { enabled?: boolean; dismissed?: boolean }) {
        if (!key) return
        try {
            if ('enabled' in patch) localStorage.setItem(key, String(patch.enabled))
            Object.assign(settings.value, patch)
        } catch { storageError.value = '本机通知偏好保存失败' }
    }
    function sync(event: StorageEvent) { if (event.key === key) readPreference() }
    window.addEventListener('storage', sync)
    onUnmounted(() => { generation++; window.removeEventListener('storage', sync) })
    return { settings, update, storageError, ready, reload }
}
