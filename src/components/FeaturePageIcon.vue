<template>
  <span
    :class="['feature-page-icon', `feature-page-icon-${type}`]"
    :style="{ '--feature-page-icon-size': `${size}px` }"
    aria-hidden="true"
  >
    <AllWeatherMenuIcon v-if="type === 'all-weather'" :size="size" />
    <StrategyMenuIcon v-else :type="type" />
  </span>
</template>

<script setup lang="ts">
  import AllWeatherMenuIcon from '@/components/AllWeatherMenuIcon.vue'
  import StrategyMenuIcon from '@/components/StrategyMenuIcon.vue'

  withDefaults(
      defineProps<{
          type: string
          size?: number
      }>(),
      {
          size: 52
      }
  )
</script>

<style scoped>
  .feature-page-icon {
      display: inline-grid;
      width: var(--feature-page-icon-size);
      height: var(--feature-page-icon-size);
      color: var(--menu-accent, #60a5fa);
      filter: drop-shadow(0 0 9px color-mix(in srgb, currentcolor 30%, transparent));
      flex: 0 0 auto;
      place-items: center;
  }

  .feature-page-icon :deep(.strategy-menu-icon) {
      width: var(--feature-page-icon-size);
      height: var(--feature-page-icon-size);
  }

  .feature-page-icon-convertible-bond {
      --menu-accent: #add8e6;
  }

  .feature-page-icon-strategy-observation {
      --menu-accent: #60a5fa;
  }

  .feature-page-icon-bond-market {
      --menu-accent: #f59e0b;
  }

  .feature-page-icon-rights {
      --menu-accent: #ef4444;
  }

  .feature-page-icon-momentum {
      --menu-accent: #ff5722;
  }

  .feature-page-icon-micro-cap {
      --menu-accent: #f0e68c;
  }

  .feature-page-icon-high-dividend {
      --menu-accent: #d4af37;
  }

  .feature-page-icon-portfolio-lab {
      --menu-accent: #6366f1;
  }

  .feature-page-icon-lof-monitor {
      --menu-accent: #0af;
  }

  .feature-page-icon-tools {
      --menu-accent: #8a2be2;
  }

  .feature-page-icon-wealth-map {
      --menu-accent: #2dd4bf;
  }

  .feature-page-icon-ledger {
      --menu-accent: #4ecdc4;
  }

  .feature-page-icon-admin-center {
      --menu-accent: #60a5fa;
  }

  .feature-page-icon-about {
      --menu-accent: #ffc107;
  }

</style>
