<template>
  <div class="strategy-center">
    <header class="center-header">
      <router-link class="home-link" to="/home">← 返回首页</router-link>
      <div class="center-heading"><h1><FeaturePageIcon type="strategy-observation" />策略中心</h1><p>理解规则，观察表现，找到适合自己的策略。</p></div>
      <nav class="strategy-navigation" aria-label="策略切换">
        <router-link v-for="item in comparisonStrategies" :key="item.id" :to="`/strategies/${item.slug}`" :style="{ '--strategy-color': item.color }">{{ item.name }}</router-link>
        <router-link class="compare-link" to="/strategies/compare">策略对比</router-link>
      </nav>
    </header>
    <router-view />
  </div>
</template>

<script setup lang="ts">
import { comparisonStrategies } from '@/utils/strategyCatalog'
</script>

<style scoped>
.strategy-center {
  min-height: 100vh;
  padding: 3rem 1rem;
  box-sizing: border-box;
  color: #fff;
  background: radial-gradient(circle at 15% 50%, #1a2a4a, transparent 40%),
    radial-gradient(circle at 85% 50%, #1a205a, transparent 40%), #121212;
  background-attachment: fixed;
  font-family: 'Noto Sans SC', sans-serif;
}
.center-header { max-width: 960px; margin: 0 auto; text-align: center; }
.home-link { display: inline-block; margin-bottom: 1rem; color: #b0c4de; text-decoration: none; font-size: 0.9rem; }
.home-link:hover { color: #0af; }
.center-heading { margin-bottom: 2rem; }
h1 { display: flex; justify-content: center; align-items: center; gap: 0.75rem; font-size: 2.5rem; margin: 0 0 0.5rem; font-weight: 700; }
.center-heading p { margin: 0; color: #b0c4de; font-size: 1.1rem; line-height: 1.7; }
.strategy-navigation { display: flex; gap: 8px; overflow-x: auto; border-bottom: 1px solid #2a3443; padding-bottom: 12px; }
.strategy-navigation a { flex-shrink: 0; padding: 12px 18px; color: #aebbd0; text-decoration: none; border: 1px solid transparent; border-radius: 10px; font-size: 14px; }
.strategy-navigation a:hover { background: #202a38; color: #fff; }
.strategy-navigation .router-link-active { background: #202a38; border-color: var(--strategy-color, #88aaff); color: #fff; }
.strategy-navigation .compare-link { margin-left: auto; color: #a8c8ff; }
.strategy-center :deep(.page-wrapper) { background: transparent; padding: 2rem 0 0; min-height: 0; }
.strategy-center :deep(.main-container) { max-width: 960px; }
.strategy-center :deep(.comparison-page) { max-width: 960px; padding: 2rem 0 0; }
.strategy-center :deep(.page-header .back-button) { display: none; }
@media (max-width: 640px) {
  .strategy-center { padding: 2rem 0.75rem; }
  h1 { font-size: 2rem; }
  .center-heading p { font-size: 0.95rem; }
  .strategy-navigation a { padding: 10px 13px; }
}
</style>
