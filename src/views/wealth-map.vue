<template>
  <div class="page-wrapper">
    <div class="main-container">
      <!-- 1. 页面标题 -->
      <div class="page-header">
        <router-link to="/home" class="back-button"> ← 返回主页 </router-link>
        <h1 class="main-title">
          <FeaturePageIcon class="title-icon" type="wealth-map" />
          财富版图
        </h1>
        <p class="subtitle">
          将您的资产目标具象化，一步步点亮属于你的商业帝国。
        </p>
      </div>

      <!-- 2. 一体化工具卡片 -->
      <div v-if="!isLoading" class="map-tool-card">
        <!-- 卡片头部：包含控制器和统计信息 -->
        <div class="card-header-section">
          <!-- 左侧：控制器 -->
          <div class="control-area">
            <div class="area-title">
              <h3>财富控制器</h3>
            </div>
            <div class="control-panel">
              <div class="input-row">
                <div class="control-group">
                  <label for="target-amount">我的目标总额 (元)</label>
                  <input id="target-amount" v-model.number="targetAmount" type="number" class="control-input" />
                </div>
                <div class="control-group">
                  <label for="current-asset">我拥有的资产 (元)</label>
                  <input id="current-asset" v-model.number="currentAsset" type="number" class="control-input" />
                </div>
              </div>
              <!-- CHANGED: 滑块被按钮替换 -->
              <div class="control-group">
                <button class="light-up-button" @click="startLightUpAnimation" :disabled="isAnimating">
                  {{ isAnimating ? '点亮中...' : '一键点亮版图' }}
                </button>
              </div>
            </div>
          </div>

          <!-- 右侧：统计 -->
          <div class="stats-area">
            <div class="area-title">
              <h3>版图统计</h3>
              <button class="how-to-play-button" @click="openHowToPlayModal" title="玩法说明">?</button>
            </div>
            <div class="stats-panel">
              <div class="stat-item">
                <span class="stat-label">已点亮城市</span>
                <!-- CHANGED: 显示动画过程中的数量 -->
                <span class="stat-value">{{ animatedLitCount }} / {{ allCities.length }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">已花费资产</span>
                <span class="stat-value">¥ {{ animatedSpentAsset.toLocaleString() }}</span>
              </div>
              <div class="stat-item next-target">
                <span class="stat-label">下一个目标</span>
                <span v-if="nextTargetInfo && showNextTarget" class="stat-value highlight">
                  点亮 <strong>{{ nextTargetInfo.name }}</strong> 还需 <strong>{{ nextTargetInfo.needed.toLocaleString() }}</strong> 元
                </span>
                <span v-else-if="!nextTargetInfo && showNextTarget" class="stat-value">恭喜！已点亮全国！🎉</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 卡片主体：地图 -->
        <div class="map-wrapper">
          <div ref="mapContainer" class="map-container"></div>
        </div>
      </div>

      <StrategyLoading
        v-else
        title="正在绘制财富版图"
        description="加载城市数据与目标进度"
        monogram="MAP"
        icon-type="wealth-map"
        :steps="['城市数据', '目标进度', '版图渲染']"
      />
    </div>

    <!-- 玩法说明模态框 (无变化) -->
    <Transition name="modal-fade">
      <div v-if="isHowToPlayVisible" class="modal-backdrop" @click="closeHowToPlayModal">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h3>玩法说明</h3>
            <button class="modal-close-button" @click="closeHowToPlayModal">×</button>
          </div>
          <div class="modal-body">
            <p>本工具旨在提供一种趣味性的方式来观察您的财富增长。</p>
            <h4>城市定价</h4>
            <p>每个城市的“点亮价格”是根据其在全国GDP中的占比，按比例分配您的总目标金额得出的。GDP越高的城市，点亮它所需的价格也越高。</p>
            <h4>点亮顺序</h4>
            <p>我们采用“价值洼地优先”原则。您的资产将按照价格从低到高的顺序，自动为您“收购”并点亮城市。点击按钮，见证您的财富帝国扩张吧！</p>
            <button class="modal-action-button" @click="closeHowToPlayModal">我明白了</button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted, onUnmounted, computed, watch, nextTick } from 'vue'
  import mapboxgl from 'mapbox-gl'
  import axios from 'axios'

  // --- 类型与配置 (保留你的) ---
  mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || ''

  // --- 状态管理 (保留你的，并新增动画状态) ---
  const isLoading = ref(true)
  const targetAmount = ref(3000000)
  const currentAsset = ref(1500000)
  const allCities = ref<any[]>([])
  const sortedCities = ref<any[]>([])
  const cityDataMap = ref<Map<string, any>>(new Map())
  const mapContainer = ref<HTMLElement | null>(null)
  const map: any = ref(null)
  const isHowToPlayVisible = ref(false)
  const originalFeatures = ref<any[]>([])

  // --- NEW: 动画相关状态 ---
  const isAnimating = ref(false)
  const animationInterval = ref<number | null>(null)
  const currentlyLitCityNames = ref(new Set<string>()) // 地图实时响应这个集合
  const flashingCityName = ref<string | null>(null) // 控制闪烁效果的城市名
  const animatedLitCount = ref(0) // 动画过程中的计数值
  const animatedSpentAsset = ref(0) // 动画过程中的花费值
  const showNextTarget = ref(false)
  // --- 核心计算逻辑 (目标状态) ---
  const finalLitResult = computed(() => {
      // 这个计算属性现在用来确定动画的“最终目标”
      const targetLitCities: any[] = []
      let accumulatedCost = 0
      for (const city of sortedCities.value) {
          if (accumulatedCost + city.price <= currentAsset.value) {
              accumulatedCost += city.price
              targetLitCities.push(city)
          } else {
              break
          }
      }
      return {
          cities: targetLitCities,
          spentAsset: accumulatedCost
      }
  })

  const nextTargetInfo = computed(() => {
      const litCityNames = new Set(finalLitResult.value.cities.map(c => c.name))
      const nextCity = sortedCities.value.find(city => !litCityNames.has(city.name))

      if (nextCity) {
          const needed = nextCity.price - (currentAsset.value - finalLitResult.value.spentAsset)
          return { name: nextCity.name, needed: Math.max(0, needed) }
      }
      return null
  })

  // --- 弹窗控制 (逻辑不变) ---
  const openHowToPlayModal = () => (isHowToPlayVisible.value = true)
  const closeHowToPlayModal = () => (isHowToPlayVisible.value = false)

  // --- 数据处理与价格计算 (逻辑不变) ---
  const calculateCityPrices = () => {
      if (originalFeatures.value.length === 0) return
      const totalGdp = originalFeatures.value.reduce(
          (sum, feature) => sum + (feature.properties.gdp || 0),
          0
      )
      if (totalGdp === 0) return
      const calculatedCities = originalFeatures.value.map(feature => {
          const { name, adcode, gdp } = feature.properties
          const price = Math.round((gdp / totalGdp) * targetAmount.value)
          return { id: adcode.toString(), name, price }
      })
      allCities.value = calculatedCities
      cityDataMap.value.clear()
      calculatedCities.forEach(city => cityDataMap.value.set(city.name, city))
      sortedCities.value = [...calculatedCities].sort((a, b) => {
          if (a.price !== b.price) return a.price - b.price
          return a.name.localeCompare(b.name)
      })
  }

  // --- NEW: 动画核心函数 ---
  const startLightUpAnimation = () => {
      if (isAnimating.value) return
      if (animationInterval.value) clearInterval(animationInterval.value)

      isAnimating.value = true
      currentlyLitCityNames.value.clear()
      animatedLitCount.value = 0
      animatedSpentAsset.value = 0
      updateMapColors() // 强制地图更新到全暗状态

      const targetCitiesToAnimate = finalLitResult.value.cities
      let currentIndex = 0

      animationInterval.value = window.setInterval(() => {
          if (currentIndex >= targetCitiesToAnimate.length) {
              if (animationInterval.value) clearInterval(animationInterval.value)
              isAnimating.value = false
              showNextTarget.value = true
              return
          }

          const cityToLight = targetCitiesToAnimate[currentIndex]

          flashingCityName.value = cityToLight.name
          setTimeout(() => {
              if (flashingCityName.value === cityToLight.name) {
                  flashingCityName.value = null
              }
          }, 500) // 闪烁持续时间

          currentlyLitCityNames.value.add(cityToLight.name)
          animatedLitCount.value++
          animatedSpentAsset.value += cityToLight.price

          currentIndex++
      }, 100) // 每100毫秒点亮一个城市
  }

  // --- Mapbox 地图逻辑 (保留你的，并增加闪烁层) ---
  const initMap = (geojsonData: any) => {
      // console.log(mapContainer.value)
      if (mapContainer.value) {
          map.value = new mapboxgl.Map({
              container: mapContainer.value,
              style: 'mapbox://styles/onism9/cl9pb1m9p005l15mguhkgj31a', // 保留你的style
              center: [108.2451284167924, 36.128637864942434],
              zoom: 3.5
          })
          map.value.on('load', () => {
              if (!map.value) return
              map.value.addSource('china-cities', { type: 'geojson', data: geojsonData })
              map.value.addLayer({
                  id: 'city-fills',
                  type: 'fill',
                  source: 'china-cities',
                  paint: { 'fill-color': '#333', 'fill-opacity': 0.7 }
              })
              // NEW: 闪烁效果层
              map.value.addLayer({
                  id: 'city-flash',
                  type: 'fill',
                  source: 'china-cities',
                  paint: { 'fill-color': '#ffffff', 'fill-opacity': 0 }
              })
              map.value.addLayer({
                  id: 'city-borders',
                  type: 'line',
                  source: 'china-cities',
                  paint: { 'line-color': 'rgba(255, 255, 255, 0.2)', 'line-width': 1 }
              })

              // map.value.on('moveend', () => {
              //     if (!map.value) return
              //     const center = map.value.getCenter()
              //     const zoom = map.value.getZoom()
              //     const bearing = map.value.getBearing()
              //     const pitch = map.value.getPitch()

              //     console.log({
              //         center: [center.lng, center.lat],
              //         zoom: parseFloat(zoom.toFixed(2)),
              //         bearing: parseFloat(bearing.toFixed(2)),
              //         pitch: parseFloat(pitch.toFixed(2))
              //     })
              // })
              updateMapColors()
              setupMapInteractions()
          })
      }
  }

  const updateMapColors = () => {
      if (!map.value || !map.value.isStyleLoaded()) return

      // 更新基础颜色
      const fillColorExpression = [
          'case',
          ['in', ['get', 'name'], ['literal', Array.from(currentlyLitCityNames.value)]],
          '#2dd4bf',
          '#333'
      ]
      map.value.setPaintProperty('city-fills', 'fill-color', fillColorExpression)

      // NEW: 更新闪烁层透明度
      const flashOpacityExpression = [
          'case',
          ['==', ['get', 'name'], flashingCityName.value || ''],
          0.8,
          0
      ]
      map.value.setPaintProperty('city-flash', 'fill-opacity', flashOpacityExpression)
  }

  const setupMapInteractions = () => {
      if (!map.value) return
      const popup = new mapboxgl.Popup({
          closeButton: false,
          closeOnClick: false,
          className: 'custom-popup'
      })
      map.value.on('mousemove', 'city-fills', (e: any) => {
          if (e.features?.length) {
              if (map.value) map.value.getCanvas().style.cursor = 'pointer'
              const cityName = e.features[0].properties?.name
              const cityInfo = cityDataMap.value.get(cityName)
              let popupContent = `<strong>${cityName}</strong>`
              if (cityInfo) popupContent += `<br/>点亮价格: ${cityInfo.price.toLocaleString()} 元`
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              popup.setLngLat(e.lngLat).setHTML(popupContent).addTo(map.value!)
          }
      })
      map.value.on('mouseleave', 'city-fills', () => {
          if (map.value) map.value.getCanvas().style.cursor = ''
          popup.remove()
      })
  }
  // --- 生命周期 (保留你的) ---
  onMounted(async () => {
      try {
          const response = await axios.get('./static/citys.json')
          const geojsonData = response.data
          originalFeatures.value = geojsonData.features as any[]
          calculateCityPrices()

          // 关键：在这里将 isLoading 设为 false，以触发 DOM 渲染
          isLoading.value = false
      } catch (error) {
          // console.error('加载财富版图数据失败:', error)
          isLoading.value = false
      }
  })

  onUnmounted(() => {
      if (animationInterval.value) clearInterval(animationInterval.value)
      map.value?.remove()
  })
  watch(isLoading, (newIsLoading, oldIsLoading) => {
      // 我们只关心从 true -> false 的变化
      if (newIsLoading === false && oldIsLoading === true) {
          // isLoading 变为 false 意味着 v-if="!isLoading" 的块已经被渲染
          // nextTick 确保 DOM 元素已完全可用
          nextTick(() => {
              // 在这里获取 geojsonData 并初始化地图
              // 由于 geojsonData 只加载一次，我们可以从 originalFeatures 重新构建它
              const geojsonData = {
                  type: 'FeatureCollection',
                  features: originalFeatures.value
              }
              initMap(geojsonData)
          })
      }
  })
  // --- 侦听器 ---
  watch([currentlyLitCityNames, flashingCityName], updateMapColors, { deep: true })

  const resetAnimationState = () => {
      if (isAnimating.value) {
          if (animationInterval.value) clearInterval(animationInterval.value)
          isAnimating.value = false
      }
      currentlyLitCityNames.value.clear()
      animatedLitCount.value = 0
      animatedSpentAsset.value = 0
      showNextTarget.value = false

      updateMapColors() // 立即将地图重置为全暗
  }

  watch(targetAmount, newValue => {
      calculateCityPrices()
      if (currentAsset.value > newValue) {
          currentAsset.value = newValue
      } else {
          resetAnimationState()
      }
  })

  watch(currentAsset, resetAnimationState)
</script>

<style scoped>
  /* --- 新增：页面加载动画定义 --- */
  @keyframes fadeInUp {
      from {
          opacity: 0;
          transform: translateY(20px);
      }

      to {
          opacity: 1;
          transform: translateY(0);
      }
  }

  /* 基本页面布局和头部样式 (无变化) */
  .page-wrapper {
      padding: 2rem 1rem;
      min-height: 100vh;
      font-family: 'Noto Sans SC', sans-serif;
      color: #fff;
      background: radial-gradient(circle at 15% 50%, rgb(45 212 191 / 10%), transparent 40%),
          radial-gradient(circle at 85% 50%, rgb(45 212 191 / 8%), transparent 40%), #121212;
      background-color: #121212;
  }

  .main-container {
      margin: 0 auto;
      max-width: 1200px;
  }

  .page-header {
      margin-bottom: 3rem;
      text-align: center;
      opacity: 0;
      animation: fadeInUp 0.5s ease-out forwards;
  }

  .back-button {
      display: inline-block;
      margin-bottom: 1rem;
      font-size: 0.9rem;
      text-decoration: none;
      color: #b0c4de;
      transition: color 0.3s ease;
  }

  .back-button:hover {
      color: #0af;
  }

  .main-title {
      display: flex;
      justify-content: center;
      align-items: center;
      margin-bottom: 0.5rem;
      font-size: 2.5rem;
      font-weight: 700;
      gap: 1rem;
  }

  .title-icon {
      font-size: 2.8rem;
      color: #2dd4bf;
      text-shadow: 0 0 15px rgb(45 212 191 / 70%);
  }

  .subtitle {
      font-size: 1.1rem;
      color: #b0c4de;
  }

  .map-tool-card {
      display: flex;
      padding: 1.5rem 2rem 2rem;
      background: rgb(255 255 255 / 5%);
      border: 1px solid rgb(255 255 255 / 10%);
      border-radius: 16px;
      opacity: 0;
      backdrop-filter: blur(10px);
      flex-direction: column;
      gap: 1.5rem;
      animation: fadeInUp 0.5s ease-out forwards;
      animation-delay: 0.2s; /* 添加延迟，让它在标题之后出现 */
  }

  .card-header-section {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
      border-bottom: 1px solid rgb(255 255 255 / 10%);
      padding-bottom: 1.5rem;
  }

  .area-title {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
  }

  .area-title h3 {
      padding-left: 1rem;
      margin: 0;
      font-size: 1.4rem;
      font-weight: bold;
      border-left: 4px solid #2dd4bf;
  }

  .how-to-play-button {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 32px;
      height: 32px;
      font-size: 1.2rem;
      color: #fff;
      background: rgb(255 255 255 / 10%);
      border: 1px solid rgb(255 255 255 / 20%);
      border-radius: 50%;
      transition: all 0.3s ease;
      font-weight: bold;
      cursor: pointer;
  }

  .how-to-play-button:hover {
      color: #121212;
      background-color: #2dd4bf;
      transform: scale(1.1);
  }

  .control-panel,
  .stats-panel {
      display: flex;
      flex-direction: column;
      gap: 1.2rem;
  }

  .control-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
  }

  .control-group label {
      font-size: 0.9rem;
      text-align: left;
      color: #b0c4de;
  }

  .control-input {
      padding: 0.75rem;
      width: 100%;
      font-size: 1.1rem;
      color: #fff;
      background-color: rgb(0 0 0 / 30%);
      border: 1px solid rgb(255 255 255 / 20%);
      border-radius: 6px;
      transition: border-color 0.3s, box-shadow 0.3s;
      box-sizing: border-box;
  }

  .control-input:focus {
      border-color: #2dd4bf;
      outline: none;
      box-shadow: 0 0 10px rgb(45 212 191 / 45%);
  }

  .input-row {
      display: flex;
      gap: 1rem; /* 设置两个输入框之间的间距 */
      align-items: flex-end; /* 让输入框底部对齐，更美观 */
  }

  /* 让输入框在行内自动填充空间 */
  .input-row .control-group {
      flex: 1;
  }

  /* 因为按钮现在和输入框行分开了，它的上边距可能会因为gap变化，我们给它一个固定的上边距 */
  .light-up-button {
      margin-top: 0.5rem;
  }

  .stat-item {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      padding-bottom: 1rem;
      font-size: 1rem;
      border-bottom: 1px dashed rgb(255 255 255 / 10%);
  }

  .stat-item:last-child {
      border-bottom: none;
      padding-bottom: 0;
  }

  .stat-label {
      color: #b0c4de;
  }

  .stat-value {
      font-weight: bold;
      font-size: 1.2rem;
      color: #fff;
  }

  .stat-value.highlight strong {
      color: #2dd4bf;
  }

  .map-wrapper {
      overflow: hidden;
      width: 100%;
      height: 65vh;
      background-color: #000;
      border-radius: 12px;
  }

  .map-container {
      width: 100%;
      height: 100%;
  }

  .loading-indicator {
      padding: 5rem 0;
      font-size: 1.2rem;
      text-align: center;
      color: #b0c4de;
  }

  .modal-fade-enter-active,
  .modal-fade-leave-active {
      transition: opacity 0.3s ease;
  }

  .modal-fade-enter-from,
  .modal-fade-leave-to {
      opacity: 0;
  }

  .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      z-index: 1000;
      display: flex;
      justify-content: center;
      align-items: center;
      width: 100%;
      height: 100%;
      background-color: rgb(0 0 0 / 70%);
      backdrop-filter: blur(8px);
  }

  .modal-content {
      padding: 1.5rem 2rem;
      width: 90%;
      max-width: 500px;
      background: #1e1e1e;
      border: 1px solid rgb(255 255 255 / 20%);
      border-radius: 15px;
      box-shadow: 0 10px 30px rgb(0 0 0 / 50%);
  }

  .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 1rem;
      margin-bottom: 1.5rem;
      border-bottom: 1px solid rgb(255 255 255 / 10%);
  }

  .modal-header h3 {
      margin: 0;
      font-size: 1.4rem;
  }

  .modal-close-button {
      font-size: 2rem;
      color: #fff;
      background: transparent;
      border: none;
      cursor: pointer;
      line-height: 1;
  }

  .modal-body {
      line-height: 1.8;
      color: #e0e0e0;
  }

  .modal-body h4 {
      margin-top: 1.5rem;
      margin-bottom: 0.5rem;
      color: #2dd4bf;
  }

  .modal-action-button {
      display: block;
      padding: 0 16px;
      margin-top: 2rem;
      width: 100%;
      min-height: 44px;
      font-size: 0.95rem;
      color: #e8fffd;
      background: linear-gradient(90deg, rgb(56 189 248 / 9%), transparent);
      border: 1px solid rgb(56 189 248 / 72%);
      border-radius: 7px;
      box-shadow: 0 0 0 1px rgb(56 189 248 / 12%), 0 0 16px rgb(56 189 248 / 10%);
      transition: border-color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
      font-weight: 700;
      cursor: pointer;
  }

  .modal-action-button:hover {
      background: linear-gradient(90deg, rgb(56 189 248 / 14%), transparent);
      border-color: #38bdf8;
      box-shadow: 0 0 0 1px rgb(56 189 248 / 20%), 0 0 22px rgb(56 189 248 / 18%);
      transform: translateY(-1px);
  }
  @media (max-width: 900px) {
      .card-header-section {
          grid-template-columns: 1fr;
      }
  }
  @media (max-width: 768px) {
      .main-title {
          font-size: 2rem;
      }

      .map-tool-card {
          padding: 1rem;
      }

      .card-header-section {
          gap: 1rem;
      }
  }

  /* === NEW AND MODIFIED STYLES === */

  /* 点亮按钮样式 */
  .light-up-button {
      padding: 0.8rem 1rem;
      width: 100%;
      font-size: 1.1rem;
      color: #121212; /* 深色文字 */
      background: #2dd4bf;
      border: none;
      border-radius: 8px;
      box-shadow: 0 0 15px rgb(45 212 191 / 30%);
      transition: all 0.3s ease;
      font-weight: 700;
      cursor: pointer;
  }

  .light-up-button:hover:not(:disabled) {
      transform: translateY(-3px);
      box-shadow: 0 4px 20px rgb(45 212 191 / 50%);
  }

  .light-up-button:disabled {
      color: #999;
      background-color: #555;
      box-shadow: none;
      cursor: not-allowed;
      transform: none;
  }

  /* 修复 Mapbox Popup 样式 */
  :deep(.mapboxgl-popup-content) {
      padding: 10px 15px;
      font-family: 'Noto Sans SC', sans-serif;
      color: #e0e0e0; /* 浅灰色文字 */
      background-color: #2c2c2e; /* 深灰色背景 */
      border: 1px solid rgb(255 255 255 / 20%);
      border-radius: 8px;
      box-shadow: 0 5px 15px rgb(0 0 0 / 40%);
  }

  :deep(.mapboxgl-popup-content strong) {
      color: #fff; /* 粗体文字用纯白，增加对比度 */
  }

  :deep(.mapboxgl-popup-anchor-bottom .mapboxgl-popup-tip) {
      border-top-color: #2c2c2e; /* 让小三角颜色和背景一致 */
  }

  :deep(.mapboxgl-popup-anchor-top .mapboxgl-popup-tip) {
      border-bottom-color: #2c2c2e;
  }

  :deep(.mapboxgl-popup-anchor-left .mapbox-popup-tip) {
      border-right-color: #2c2c2e;
  }

  :deep(.mapboxgl-popup-anchor-right .mapbox-popup-tip) {
      border-left-color: #2c2c2e;
  }

  :deep(.mapboxgl-ctrl-bottom-left) {
      display: none;
  }

  :deep(.mapboxgl-ctrl-bottom-right) {
      display: none;
  }

  /* ... 您现有的所有CSS ... */

  /* --- 在 @media (max-width: 900px) 中新增 --- */
  @media (max-width: 900px) {
      .card-header-section {
          grid-template-columns: 1fr;
      }

      /* --- 新增：在中等屏幕上，让两个输入框垂直排列 --- */
      .input-row {
          flex-direction: column;
          align-items: stretch; /* 让子项撑满宽度 */
      }
  }

  /* --- 在 @media (max-width: 768px) 中新增 --- */
  @media (max-width: 768px) {
      /* ... 您已有的其他样式 ... */

      /* --- 新增：适配玩法说明弹窗 --- */
      .modal-content {
          padding: 1.5rem 1.2rem; /* 减小内边距 */
          width: 75%; /* 弹窗宽度占屏幕的90% */
      }

      .modal-header h3 {
          font-size: 1.2rem; /* 减小弹窗标题字号 */
      }

      .modal-body {
          font-size: 0.9rem; /* 减小正文基础字号 */
      }

      .modal-body h4 {
          font-size: 1.05rem; /* 减小弹窗内小标题字号 */
      }

      .modal-action-button {
          padding: 0.9rem; /* 增大按钮内边距，方便点击 */
          font-size: 1rem;
      }
  }
</style>
