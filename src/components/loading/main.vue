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
        <svg width="50px" height="50px">
            <circle
                cx="25"
                cy="25"
                r="20"
                fill="transparent"
                stroke-width="3"
                stroke-dasharray="31.415, 31.415"
                stroke="#02bcfe"
                stroke-linecap="round">
                <animateTransform
                    attributeName="transform"
                    type="rotate"
                    values="0, 25 25;360, 25 25"
                    dur="1.5s"
                    repeatCount="indefinite" />
                <animate
                    attributeName="stroke"
                    values="#02bcfe;#3be6cb;#02bcfe"
                    dur="3s"
                    repeatCount="indefinite" />
            </circle>

            <circle
                cx="25"
                cy="25"
                r="10"
                fill="transparent"
                stroke-width="3"
                stroke-dasharray="15.7, 15.7"
                stroke="#3be6cb"
                stroke-linecap="round">
                <animateTransform
                    attributeName="transform"
                    type="rotate"
                    values="360, 25 25;0, 25 25"
                    dur="1.5s"
                    repeatCount="indefinite" />
                <animate
                    attributeName="stroke"
                    values="#3be6cb;#02bcfe;#3be6cb"
                    dur="3s"
                    repeatCount="indefinite" />
            </circle>
        </svg>
        <div class="loading-tip">
            {{ msgShow.text }}
        </div>
    </div>
</template>

<script setup lang="ts">
const props = defineProps({
    msgShow: {
        type: Object,
        default: () => ({})
    }
})
</script>

<style lang="scss">
.dv-loading {
    position: absolute;
    top: 50%;
    left: 50%;
    z-index: 99999;
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
    flex-direction: column;
    transform: translate(-50%, -50%);

    .loading-tip {
        font-size: 12px;
        color: #fff;
    }
}
</style>
