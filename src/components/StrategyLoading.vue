<template>
  <section :class="['strategy-loader', `strategy-loader-${mode}`]" role="status" aria-live="polite">
    <div :class="['strategy-loader-visual', { 'has-feature-icon': iconType }]" aria-hidden="true">
      <span class="strategy-loader-orbit strategy-loader-orbit-outer"></span>
      <span class="strategy-loader-orbit strategy-loader-orbit-inner"></span>
      <span v-if="!iconType" class="strategy-loader-core">{{ monogram }}</span>
      <span v-else class="strategy-loader-feature-icon">
        <FeaturePageIcon :type="iconType" :size="featureIconSize" />
      </span>
      <span class="strategy-loader-node strategy-loader-node-one"></span>
      <span class="strategy-loader-node strategy-loader-node-two"></span>
      <span class="strategy-loader-node strategy-loader-node-three"></span>
      <span class="strategy-loader-node strategy-loader-node-four"></span>
    </div>

    <div class="strategy-loader-copy">
      <h2 class="strategy-loader-title">{{ title }}</h2>
      <p v-if="description" class="strategy-loader-description">{{ description }}</p>
    </div>

    <div class="strategy-loader-progress" aria-hidden="true">
      <span></span>
    </div>

    <div v-if="mode === 'page' && steps.length" class="strategy-loader-steps" aria-hidden="true">
      <span v-for="step in steps" :key="step">{{ step }}</span>
    </div>
  </section>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import FeaturePageIcon from '@/components/FeaturePageIcon.vue'

  const props = withDefaults(
      defineProps<{
          title?: string
          description?: string
          monogram?: string
          mode?: 'page' | 'panel' | 'inline'
          steps?: string[]
          iconType?: string
      }>(),
      {
          title: '正在同步数据',
          description: '连接云端数据，请稍候',
          monogram: 'DATA',
          mode: 'page',
          steps: () => ['连接数据', '整理指标', '生成视图']
      }
  )

  const featureIconSize = computed(() => {
      if (props.mode === 'inline') return 32
      if (props.mode === 'panel') return 44
      return 52
  })
</script>

<style scoped>
  .strategy-loader {
      position: relative;
      display: flex;
      align-items: center;
      overflow: hidden;
      box-sizing: border-box;
      width: 100%;
      color: #fff;
      background:
          radial-gradient(circle at 50% 22%, rgb(0 170 255 / 14%), transparent 34%),
          linear-gradient(145deg, rgb(255 255 255 / 6%), rgb(255 255 255 / 2%));
      border: 1px solid rgb(124 201 255 / 16%);
      border-radius: 18px;
      box-shadow: 0 24px 70px rgb(0 0 0 / 20%);
      backdrop-filter: blur(16px);
      flex-direction: column;
  }

  .strategy-loader::before {
      position: absolute;
      inset: 0;
      background-image:
          linear-gradient(rgb(255 255 255 / 2%) 1px, transparent 1px),
          linear-gradient(90deg, rgb(255 255 255 / 2%) 1px, transparent 1px);
      background-size: 34px 34px;
      content: '';
      mask-image: linear-gradient(to bottom, #000, transparent 80%);
      pointer-events: none;
  }

  .strategy-loader-page {
      justify-content: center;
      padding: 3.5rem 2rem 3rem;
      min-height: 360px;
  }

  .strategy-loader-panel {
      justify-content: center;
      padding: 2rem 1.5rem;
      min-height: 240px;
  }

  .strategy-loader-inline {
      justify-content: center;
      padding: 1.1rem;
      min-height: 112px;
      background: rgb(15 23 42 / 45%);
      border-radius: 12px;
      box-shadow: none;
      flex-direction: row;
      gap: 0.9rem;
  }

  .strategy-loader-visual {
      position: relative;
      z-index: 1;
      margin-bottom: 1.4rem;
      width: 122px;
      height: 122px;
      flex: 0 0 auto;
  }

  .strategy-loader-panel .strategy-loader-visual {
      width: 92px;
      height: 92px;
  }

  .strategy-loader-inline .strategy-loader-visual {
      margin-bottom: 0;
      width: 58px;
      height: 58px;
  }

  .strategy-loader-orbit,
  .strategy-loader-core,
  .strategy-loader-node {
      position: absolute;
      display: block;
      border-radius: 50%;
  }

  .strategy-loader-orbit {
      inset: 0;
      border: 1px solid rgb(103 198 255 / 28%);
  }

  .strategy-loader-orbit::after {
      position: absolute;
      top: -2px;
      left: 50%;
      width: 4px;
      height: 4px;
      background: #7ddcff;
      border-radius: 50%;
      box-shadow: 0 0 12px #0af;
      content: '';
      transform: translateX(-50%);
  }

  .strategy-loader-orbit-outer {
      animation: strategy-loader-spin 3.8s linear infinite;
  }

  .strategy-loader-orbit-inner {
      inset: 19%;
      border-style: dashed;
      border-color: rgb(77 224 190 / 30%);
      animation: strategy-loader-spin 2.8s linear infinite reverse;
  }

  .strategy-loader-core {
      inset: 33%;
      display: grid;
      overflow: hidden;
      font-size: clamp(0.48rem, 1.1vw, 0.7rem);
      color: #e9f8ff;
      background: linear-gradient(145deg, rgb(0 170 255 / 28%), rgb(56 222 189 / 12%));
      border: 1px solid rgb(123 221 255 / 42%);
      box-shadow: 0 0 28px rgb(0 170 255 / 20%), inset 0 0 14px rgb(255 255 255 / 6%);
      font-weight: 700;
      letter-spacing: 0.08em;
      place-items: center;
  }

  .strategy-loader-feature-icon {
      position: absolute;
      inset: 0;
      z-index: 2;
      display: grid;
      filter: drop-shadow(0 0 9px rgb(0 170 255 / 18%));
      animation: strategy-loader-icon-breathe 1.9s ease-in-out infinite;
      place-items: center;
  }

  .strategy-loader-node {
      width: 7%;
      height: 7%;
      background: currentcolor;
      box-shadow: 0 0 12px currentcolor;
      animation: strategy-loader-pulse 1.6s ease-in-out infinite;
  }

  .strategy-loader-node-one {
      top: 14%;
      right: 14%;
      color: #53d4ff;
  }

  .strategy-loader-node-two {
      right: 8%;
      bottom: 20%;
      color: #52e3bd;
      animation-delay: 0.35s;
  }

  .strategy-loader-node-three {
      bottom: 8%;
      left: 23%;
      color: #ffd166;
      animation-delay: 0.7s;
  }

  .strategy-loader-node-four {
      top: 30%;
      left: 5%;
      color: #9ca9ff;
      animation-delay: 1.05s;
  }

  .strategy-loader-copy {
      z-index: 1;
      text-align: center;
  }

  .strategy-loader-inline .strategy-loader-copy {
      text-align: left;
  }

  .strategy-loader-title {
      margin: 0 0 0.45rem;
      font-size: 1.15rem;
      color: #f4f9ff;
      font-weight: 600;
      letter-spacing: 0.03em;
  }

  .strategy-loader-inline .strategy-loader-title {
      margin-bottom: 0.25rem;
      font-size: 0.92rem;
  }

  .strategy-loader-description {
      margin: 0;
      font-size: 0.86rem;
      color: #8fa8c3;
      line-height: 1.5;
  }

  .strategy-loader-inline .strategy-loader-description {
      font-size: 0.74rem;
  }

  .strategy-loader-progress {
      z-index: 1;
      overflow: hidden;
      margin-top: 1.5rem;
      width: min(280px, 72vw);
      height: 3px;
      background: rgb(255 255 255 / 7%);
      border-radius: 999px;
  }

  .strategy-loader-inline .strategy-loader-progress {
      display: none;
  }

  .strategy-loader-progress span {
      display: block;
      width: 42%;
      height: 100%;
      background: linear-gradient(90deg, transparent, #0af 42%, #52e3bd 70%, transparent);
      border-radius: inherit;
      animation: strategy-loader-sweep 1.8s ease-in-out infinite;
  }

  .strategy-loader-steps {
      z-index: 1;
      display: flex;
      justify-content: space-between;
      margin-top: 0.75rem;
      width: min(280px, 72vw);
      font-size: 0.68rem;
      color: #62778e;
      letter-spacing: 0.04em;
  }

  @keyframes strategy-loader-spin {
      to {
          transform: rotate(360deg);
      }
  }

  @keyframes strategy-loader-pulse {
      0%,
      100% {
          opacity: 0.42;
          transform: scale(0.76);
      }

      50% {
          opacity: 1;
          transform: scale(1);
      }
  }

  @keyframes strategy-loader-sweep {
      from {
          transform: translateX(-110%);
      }

      to {
          transform: translateX(340%);
      }
  }

  @keyframes strategy-loader-icon-breathe {
      0%,
      100% {
          opacity: 0.76;
          transform: scale(0.94);
      }

      50% {
          opacity: 1;
          transform: scale(1.05);
      }
  }

  @media (max-width: 640px) {
      .strategy-loader-page {
          padding: 2.5rem 1rem;
          min-height: 320px;
      }

      .strategy-loader-inline {
          padding: 0.85rem;
      }
  }

  @media (prefers-reduced-motion: reduce) {
      .strategy-loader-orbit,
      .strategy-loader-node,
      .strategy-loader-progress span,
      .strategy-loader-feature-icon {
          animation-duration: 5s;
      }
  }
</style>
