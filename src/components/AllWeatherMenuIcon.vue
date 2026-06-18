<template>
  <span
    :class="['all-weather-visual-icon', { 'is-animated': animated }]"
    :style="{ '--all-weather-icon-size': `${size}px` }"
    aria-hidden="true"
  >
    <span class="all-weather-visual-orbit all-weather-visual-orbit-outer"></span>
    <span class="all-weather-visual-orbit all-weather-visual-orbit-inner"></span>
    <span class="all-weather-visual-core"></span>
    <span class="all-weather-visual-dot all-weather-visual-dot-stock"></span>
    <span class="all-weather-visual-dot all-weather-visual-dot-bond"></span>
    <span class="all-weather-visual-dot all-weather-visual-dot-gold"></span>
    <span class="all-weather-visual-dot all-weather-visual-dot-cash"></span>
  </span>
</template>

<script setup lang="ts">
  withDefaults(
      defineProps<{
          size?: number
          animated?: boolean
      }>(),
      {
          size: 42,
          animated: false
      }
  )
</script>

<style scoped>
  .all-weather-visual-icon {
      position: relative;
      display: block;
      width: var(--all-weather-icon-size);
      height: var(--all-weather-icon-size);
      filter: drop-shadow(0 0 8px rgb(0 170 255 / 22%));
  }

  .all-weather-visual-orbit,
  .all-weather-visual-core,
  .all-weather-visual-dot {
      position: absolute;
      display: block;
      border-radius: 50%;
  }

  .all-weather-visual-orbit {
      inset: 2.4%;
      border: 1px solid rgb(104 208 255 / 45%);
      transition: transform 0.8s cubic-bezier(0.2, 0.8, 0.2, 1), border-color 0.25s ease;
      transform: rotate(var(--all-weather-outer-rotation, 0deg));
  }

  .all-weather-visual-orbit::after {
      position: absolute;
      top: -2px;
      left: 50%;
      width: max(4px, 9.5%);
      height: max(4px, 9.5%);
      background: #9be8ff;
      border-radius: 50%;
      box-shadow: 0 0 8px #0af;
      content: '';
      transform: translateX(-50%);
  }

  .all-weather-visual-orbit-inner {
      inset: 19%;
      border-style: dashed;
      border-color: rgb(82 227 189 / 50%);
      transition-duration: 1s;
      transform: rotate(var(--all-weather-inner-rotation, 0deg));
  }

  .all-weather-visual-core {
      inset: 35.7%;
      background: conic-gradient(from 45deg, #62d8ff, #168cff, #52e3bd, #62d8ff);
      border-radius: 28%;
      box-shadow: 0 0 var(--all-weather-core-glow, 12px) rgb(68 205 255 / 58%);
      transition: transform 0.6s ease, box-shadow 0.25s ease;
      transform: rotate(var(--all-weather-core-rotation, 45deg)) scale(var(--all-weather-core-scale, 1));
  }

  .all-weather-visual-dot {
      width: 12%;
      height: 12%;
      background: currentcolor;
      box-shadow: 0 0 7px currentcolor;
      transition: transform 0.3s ease, opacity 0.3s ease;
      transform: scale(var(--all-weather-dot-scale, 1));
  }

  .all-weather-visual-dot-stock {
      top: 17%;
      right: 14%;
      color: #53d4ff;
  }

  .all-weather-visual-dot-bond {
      right: 7%;
      bottom: 24%;
      color: #52e3bd;
  }

  .all-weather-visual-dot-gold {
      bottom: 7%;
      left: 24%;
      color: #ffd166;
  }

  .all-weather-visual-dot-cash {
      top: 31%;
      left: 5%;
      color: #9ca9ff;
  }

  .all-weather-visual-icon.is-animated .all-weather-visual-orbit-outer {
      animation: all-weather-loader-spin 3.4s linear infinite;
  }

  .all-weather-visual-icon.is-animated .all-weather-visual-orbit-inner {
      animation: all-weather-loader-spin 2.5s linear infinite reverse;
  }

  .all-weather-visual-icon.is-animated .all-weather-visual-dot {
      animation: all-weather-loader-pulse 1.6s ease-in-out infinite;
  }

  @keyframes all-weather-loader-spin {
      to {
          transform: rotate(360deg);
      }
  }

  @keyframes all-weather-loader-pulse {
      50% {
          opacity: 0.55;
          transform: scale(0.78);
      }
  }

  @media (prefers-reduced-motion: reduce) {
      .all-weather-visual-icon.is-animated .all-weather-visual-orbit,
      .all-weather-visual-icon.is-animated .all-weather-visual-dot {
          animation-duration: 6s;
      }
  }
</style>
