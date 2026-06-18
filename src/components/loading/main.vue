<!--
 * @Author: BoLin
 * @Date: 2022-08-25 15:50:09
 * @LastEditors: BoLin
 * @LastEditTime: 2023-05-16 10:31:11
 * @Description: file content
 * @FilePath: \digital-twin-system-framework\src\components\loading\main.vue
-->
<template>
    <div class="dv-loading" v-show="msgShow.show">
        <StrategyLoading
            mode="panel"
            :title="msgShow.text"
            description="正在处理请求，请稍候"
            monogram="SYNC" />
    </div>
</template>

<script setup lang="ts">
import StrategyLoading from '@/components/StrategyLoading.vue'

const props = defineProps({
    msgShow: {
        type: Object,
        default: () => ({})
    }
})
</script>

<style lang="scss">
.dv-loading {
    position: fixed;
    inset: 0;
    z-index: 99999;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 1.5rem;
    background: rgb(4 9 18 / 72%);
    backdrop-filter: blur(8px);

    :deep(.strategy-loader) {
        max-width: 520px;
    }
}
</style>
