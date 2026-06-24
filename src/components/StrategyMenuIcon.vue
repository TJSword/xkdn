<template>
  <svg class="strategy-menu-icon" viewBox="0 0 48 48" fill="none" aria-hidden="true">
    <g v-if="type === 'all-weather'" class="icon-glyph icon-glyph-fill">
      <path d="M24 15 33 24 24 33 15 24Z" />
      <circle cx="24" cy="24" r="3.2" class="icon-cutout" />
    </g>

    <g v-else-if="type === 'convertible-bond'" class="convertible-glyph">
      <path class="convertible-flow convertible-flow-top" d="M14 12c7-5 17-4 23 2" />
      <path class="convertible-flow convertible-flow-top" d="m33.5 13.5 3.8.8-.7-3.8" />
      <path class="convertible-flow convertible-flow-bottom" d="M36 36c-7 5-17 4-23-2" />
      <path class="convertible-flow convertible-flow-bottom" d="m16.5 34.5-3.8-.8.7 3.8" />

      <g class="convertible-bond-paper">
        <rect x="9.5" y="15" width="18" height="22" rx="4" />
        <circle cx="15" cy="22" r="2.2" />
        <path d="M19 20.5h5M19 23.5h4M13 29h11M13 33h8" />
      </g>

      <g class="convertible-equity-chart">
        <path d="M30 34V27M35 34V22M40 34V17" />
        <path class="convertible-trend" d="m29 25 5-5 4 1 3-6" />
        <path class="convertible-trend" d="m38 15 3-.2-.2 3" />
      </g>

      <circle class="convertible-spark convertible-spark-one" cx="31" cy="11" r="1.2" />
      <circle class="convertible-spark convertible-spark-two" cx="42" cy="27" r="1" />
    </g>

    <g v-else-if="type === 'rights'" class="rights-glyph">
      <g class="rights-bond-ticket">
        <path d="M28 9h8.5a3 3 0 0 1 3 3v17H28Z" />
        <path d="M32 14h3.5M32 18h3.5" />
        <path class="rights-ticket-mark" d="m34 22 2.5 2.5L34 27l-2.5-2.5Z" />
      </g>

      <g class="rights-stock-card">
        <rect x="8.5" y="14" width="26" height="24" rx="5" />
        <path class="rights-stock-line" d="m13 29 5-5 4 3 7-8" />
        <path class="rights-stock-line" d="m25.5 19 3.8-.2-.2 3.8" />
        <path class="rights-stock-base" d="M13 33h16" />
      </g>

      <g class="rights-embedded-value">
        <path d="m31 27 5 5-5 5-5-5Z" />
        <circle cx="31" cy="32" r="1.45" />
      </g>

      <g class="rights-ranking">
        <circle cx="11" cy="42" r="1" />
        <circle cx="17.5" cy="42" r="1" />
        <circle cx="24" cy="42" r="1" />
        <circle cx="30.5" cy="42" r="1" />
        <circle cx="37" cy="42" r="1" />
      </g>
    </g>

    <g v-else-if="type === 'momentum'" class="momentum-glyph">
      <path class="momentum-base" d="M9 38h31" />
      <rect class="momentum-bar momentum-bar-one" x="12" y="29" width="5" height="9" rx="1.5" />
      <rect class="momentum-bar momentum-bar-two" x="21" y="24" width="5" height="14" rx="1.5" />
      <rect class="momentum-bar momentum-bar-three" x="30" y="17" width="5" height="21" rx="1.5" />
      <path class="momentum-leader" d="m10 30 10-9 7 3 11-13" />
      <path class="momentum-leader" d="m33 11 5-.2-.2 5" />
      <circle class="momentum-spark" cx="38" cy="11" r="2" />
    </g>

    <g v-else-if="type === 'micro-cap'" class="micro-cap-glyph">
      <path class="micro-cap-frame" d="M9 17v-6h6M33 11h6v6M39 31v6h-6M15 37H9v-6" />
      <circle
        v-for="(point, index) in microCapPoints"
        :key="point"
        :class="['micro-cap-node', { selected: [1, 3, 4, 6, 8].includes(index) }]"
        :cx="point[0]"
        :cy="point[1]"
        r="2.35"
      />
      <path class="micro-cap-weight" d="M15 41h18M20 41l2-3h4l2 3" />
    </g>

    <g v-else-if="type === 'portfolio-lab'" class="portfolio-lab-glyph">
      <path class="lab-connector" d="M10 13h8l4 7M38 13h-8l-4 7M24 8v10" />
      <circle class="lab-input lab-input-one" cx="9" cy="13" r="2.5" />
      <circle class="lab-input lab-input-two" cx="39" cy="13" r="2.5" />
      <circle class="lab-input lab-input-three" cx="24" cy="7" r="2.5" />
      <g class="lab-flask">
        <path d="M19 16h10M21 16v8l-7 11a3 3 0 0 0 2.5 4.5h15A3 3 0 0 0 34 35l-7-11v-8" />
        <path class="lab-liquid" d="M17 32c4-2 10 2 14-1l3 5a2 2 0 0 1-2 3H16a2 2 0 0 1-2-3Z" />
        <circle class="lab-bubble lab-bubble-one" cx="22" cy="34" r="1.4" />
        <circle class="lab-bubble lab-bubble-two" cx="28" cy="36" r="1" />
      </g>
    </g>

    <g v-else-if="type === 'lof-monitor'" class="lof-glyph">
      <path class="lof-axis" d="M9 38h31M10 11v27" />
      <path class="lof-market-line" d="m11 30 6-8 6 4 7-11 9 3" />
      <path class="lof-nav-line" d="m11 34 7-5 6 2 7-7 8-2" />
      <path class="lof-spread" d="M33 17v6M30.5 17h5M30.5 23h5" />
      <circle class="lof-market-point" cx="30" cy="15" r="2" />
      <circle class="lof-nav-point" cx="31" cy="24" r="2" />
    </g>

    <g v-else-if="type === 'tools'" class="tools-glyph">
      <rect class="tools-panel" x="9" y="10" width="30" height="28" rx="6" />
      <path class="tools-track" d="M15 18h18M15 24h18M15 30h18" />
      <circle class="tools-knob tools-knob-one" cx="21" cy="18" r="2.7" />
      <circle class="tools-knob tools-knob-two" cx="29" cy="24" r="2.7" />
      <circle class="tools-knob tools-knob-three" cx="23" cy="30" r="2.7" />
      <path class="tools-balance" d="M16 42h16M24 38v4" />
    </g>

    <g v-else-if="type === 'wealth-map'" class="wealth-map-glyph">
      <path class="wealth-map-shape" d="m11 15 8-5 7 3 6-1 6 7-4 5 2 7-8 7-7-3-7 2-4-8 3-6Z" />
      <path class="wealth-route" d="M15 30c4-7 8 3 12-4 2-3 4-5 8-5" />
      <circle class="wealth-stop wealth-stop-one" cx="15" cy="30" r="2" />
      <circle class="wealth-stop wealth-stop-two" cx="26" cy="27" r="2" />
      <g class="wealth-pin">
        <path d="M35 14a5 5 0 0 1 5 5c0 4-5 8-5 8s-5-4-5-8a5 5 0 0 1 5-5Z" />
        <circle cx="35" cy="19" r="1.5" />
      </g>
    </g>

    <g v-else-if="type === 'ledger'" class="ledger-glyph">
      <path class="ledger-page ledger-page-back" d="M15 8h22a3 3 0 0 1 3 3v27H15Z" />
      <rect class="ledger-page ledger-page-front" x="8" y="13" width="27" height="27" rx="4" />
      <path class="ledger-binding" d="M13 19h-3M13 25h-3M13 31h-3" />
      <path class="ledger-axis" d="M15 34V22M15 34h15" />
      <path class="ledger-line" d="m16 31 4-4 3 2 6-7" />
      <circle class="ledger-dot ledger-dot-one" cx="20" cy="27" r="1.5" />
      <circle class="ledger-dot ledger-dot-two" cx="29" cy="22" r="1.5" />
    </g>

    <g v-else-if="type === 'notification'" class="notification-glyph">
      <path class="notification-wave notification-wave-left" d="M13 18c-3 4-3 8 0 12" />
      <path class="notification-wave notification-wave-right" d="M35 18c3 4 3 8 0 12" />
      <path class="notification-bell" d="M17 31h14l-2-3v-7a5 5 0 0 0-10 0v7Z" />
      <path class="notification-clapper" d="M21 34a3 3 0 0 0 6 0" />
      <circle class="notification-signal" cx="24" cy="13" r="2" />
      <path class="notification-check" d="m20.5 24 2.2 2.2 4.8-5" />
    </g>

    <g v-else-if="type === 'admin-center'" class="admin-center-glyph">
      <rect class="admin-panel" x="9" y="11" width="30" height="26" rx="5" />
      <path class="admin-panel-line" d="M15 18h11M15 24h7M15 30h10" />
      <circle class="admin-user-dot" cx="33" cy="18" r="2.6" />
      <path class="admin-user-arc" d="M28.5 27c1.1-3.2 7.9-3.2 9 0" />
      <path class="admin-shield" d="M24 39c-4-1.8-6-4.2-6-7.5v-3l6-2 6 2v3c0 3.3-2 5.7-6 7.5Z" />
      <path class="admin-check" d="m21.5 32 1.8 1.8 3.4-4" />
    </g>

    <g v-else class="about-glyph">
      <path class="about-back-card" d="M15 9h22a3 3 0 0 1 3 3v23" />
      <rect class="about-front-card" x="8" y="14" width="27" height="25" rx="5" />
      <circle class="about-info-dot" cx="21.5" cy="21" r="2" />
      <path class="about-info-line" d="M21.5 27v6M18.5 33h6" />
      <path class="about-spark" d="M38 7v5M35.5 9.5h5" />
    </g>
  </svg>
</template>

<script setup lang="ts">
  defineProps<{
      type: string
  }>()

  const microCapPoints = [
      [18, 18],
      [24, 18],
      [30, 18],
      [18, 24],
      [24, 24],
      [30, 24],
      [18, 30],
      [24, 30],
      [30, 30]
  ]
</script>

<style scoped>
  .strategy-menu-icon {
      display: block;
      overflow: visible;
      width: 48px;
      height: 48px;
      color: var(--menu-accent, #60a5fa);
      filter: drop-shadow(0 0 7px color-mix(in srgb, currentcolor 32%, transparent));
  }

  .ledger-page,
  .ledger-binding,
  .ledger-axis,
  .ledger-line {
      stroke: currentcolor;
      stroke-width: 1.8;
      stroke-linecap: round;
      stroke-linejoin: round;
  }

  .ledger-page {
      fill: color-mix(in srgb, currentcolor 9%, transparent);
      transform: translateY(var(--ledger-page-shift, 0));
      transition: transform 0.25s ease, filter 0.25s ease;
  }

  .ledger-page-back {
      opacity: 0.45;
  }

  .ledger-page-front {
      fill: #121a22;
  }

  .ledger-line {
      filter: drop-shadow(0 0 var(--ledger-line-glow, 2px) currentcolor);
  }

  .ledger-dot {
      fill: currentcolor;
      transform: scale(var(--ledger-dot-scale, 1));
      transform-box: fill-box;
      transform-origin: center;
      transition: transform 0.25s ease;
  }

  .icon-orbit {
      stroke: currentcolor;
      stroke-width: 1;
      opacity: var(--icon-orbit-outer-opacity, 0.34);
      transform: rotate(var(--icon-orbit-outer-rotation, 0deg));
      transform-origin: center;
      transition: opacity 0.25s ease, transform 0.9s cubic-bezier(0.2, 0.8, 0.2, 1);
  }

  .icon-orbit-inner {
      stroke-dasharray: 2 4;
      opacity: var(--icon-orbit-inner-opacity, 0.22);
      transform: rotate(var(--icon-orbit-inner-rotation, 0deg));
      transition-duration: 1.1s;
  }

  .icon-node {
      fill: currentcolor;
      filter: drop-shadow(0 0 3px currentcolor);
      transition: transform 0.3s ease;
      transform: scale(var(--icon-node-scale, 1));
      transform-box: fill-box;
      transform-origin: center;
  }

  .icon-node-two {
      opacity: 0.8;
  }

  .icon-node-three {
      fill: #52e3bd;
  }

  .convertible-glyph {
      filter: drop-shadow(0 0 7px rgb(173 216 230 / 22%));
  }

  .convertible-flow {
      stroke: #a9ddec;
      stroke-width: 1.35;
      stroke-dasharray: 3 2.5;
      stroke-linecap: round;
      stroke-linejoin: round;
      filter: drop-shadow(0 0 3px rgb(169 221 236 / 45%));
      transition: stroke-dashoffset 0.65s ease, opacity 0.25s ease;
  }

  .convertible-flow-top {
      stroke-dashoffset: var(--convertible-flow-top-offset, 0);
  }

  .convertible-flow-bottom {
      stroke: #52e3bd;
      stroke-dashoffset: var(--convertible-flow-bottom-offset, 0);
  }

  .convertible-bond-paper {
      stroke: currentcolor;
      stroke-width: 1.45;
      stroke-linecap: round;
      stroke-linejoin: round;
      fill: rgb(173 216 230 / 7%);
      filter: drop-shadow(0 0 var(--convertible-paper-glow, 2px) currentcolor);
      transition: transform 0.45s ease, filter 0.3s ease;
      transform: translateX(var(--convertible-paper-shift, 0));
  }

  .convertible-bond-paper circle {
      fill: #ffd166;
      stroke: none;
      filter: drop-shadow(0 0 3px rgb(255 209 102 / 55%));
  }

  .convertible-bond-paper path {
      stroke: #c8eef8;
      opacity: 0.76;
  }

  .convertible-equity-chart {
      stroke: #52e3bd;
      stroke-width: 1.7;
      stroke-linecap: round;
      stroke-linejoin: round;
      filter: drop-shadow(0 0 var(--convertible-chart-glow, 3px) rgb(82 227 189 / 65%));
      transition: transform 0.45s ease, filter 0.3s ease;
      transform: translateY(var(--convertible-chart-shift, 0));
  }

  .convertible-trend {
      stroke: #d9f9ff;
      stroke-width: 1.25;
  }

  .convertible-spark {
      fill: #d9f9ff;
      opacity: var(--convertible-spark-opacity, 0.55);
      filter: drop-shadow(0 0 3px #a9ddec);
      transition: opacity 0.25s ease, transform 0.35s ease;
      transform: scale(var(--convertible-spark-scale, 1));
      transform-box: fill-box;
      transform-origin: center;
  }

  .convertible-spark-two {
      fill: #52e3bd;
  }

  .rights-glyph {
      filter: drop-shadow(0 0 7px rgb(239 68 68 / 20%));
  }

  .rights-bond-ticket {
      stroke: #ffd166;
      stroke-width: 1.35;
      stroke-linecap: round;
      stroke-linejoin: round;
      fill: rgb(255 209 102 / 8%);
      filter: drop-shadow(0 0 var(--rights-ticket-glow, 2px) rgb(255 209 102 / 55%));
      transition: transform 0.45s ease, filter 0.3s ease;
      transform: translateY(var(--rights-ticket-shift, 0));
  }

  .rights-ticket-mark {
      fill: rgb(255 209 102 / 20%);
  }

  .rights-stock-card {
      stroke: currentcolor;
      stroke-width: 1.55;
      stroke-linecap: round;
      stroke-linejoin: round;
      fill: rgb(239 68 68 / 9%);
      filter: drop-shadow(0 0 var(--rights-stock-glow, 2px) currentcolor);
      transition: transform 0.45s ease, filter 0.3s ease;
      transform: translateX(var(--rights-stock-shift, 0));
  }

  .rights-stock-line {
      stroke: #ffe9e9;
  }

  .rights-stock-base {
      opacity: 0.45;
  }

  .rights-embedded-value {
      fill: #ffd166;
      stroke: #fff1b7;
      stroke-width: 1;
      filter: drop-shadow(0 0 var(--rights-value-glow, 4px) rgb(255 209 102 / 70%));
      transition: transform 0.4s ease, filter 0.3s ease;
      transform: scale(var(--rights-value-scale, 1));
      transform-origin: 31px 32px;
  }

  .rights-embedded-value circle {
      fill: #7f1d1d;
      stroke: none;
  }

  .rights-ranking {
      fill: currentcolor;
      opacity: 0.42;
  }

  .rights-ranking circle {
      transition: opacity 0.25s ease, transform 0.35s ease;
      transform: translateY(var(--rights-ranking-shift, 0));
      transform-box: fill-box;
      transform-origin: center;
  }

  .rights-ranking circle:nth-child(1) {
      opacity: 0.45;
  }

  .rights-ranking circle:nth-child(2) {
      opacity: 0.58;
  }

  .rights-ranking circle:nth-child(3) {
      opacity: 0.7;
  }

  .rights-ranking circle:nth-child(4) {
      opacity: 0.82;
  }

  .rights-ranking circle:nth-child(5) {
      fill: #ffd166;
      opacity: 1;
      filter: drop-shadow(0 0 3px #ffd166);
  }

  .momentum-base,
  .momentum-leader,
  .micro-cap-frame,
  .micro-cap-weight,
  .lab-connector,
  .lab-flask,
  .lof-axis,
  .lof-market-line,
  .lof-nav-line,
  .lof-spread,
  .tools-panel,
  .tools-track,
  .tools-balance,
  .admin-panel,
  .admin-panel-line,
  .admin-user-arc,
  .admin-shield,
  .admin-check,
  .wealth-map-shape,
  .wealth-route,
  .wealth-pin,
  .about-back-card,
  .about-front-card,
  .about-info-line,
  .about-spark {
      stroke: currentcolor;
      stroke-width: 1.5;
      stroke-linecap: round;
      stroke-linejoin: round;
  }

  .momentum-glyph {
      filter: drop-shadow(0 0 6px rgb(255 87 34 / 20%));
  }

  .momentum-base {
      opacity: 0.35;
  }

  .momentum-bar {
      fill: rgb(255 87 34 / 13%);
      stroke: currentcolor;
      stroke-width: 1.25;
      transition: transform 0.4s ease, filter 0.3s ease;
      transform: translateY(var(--momentum-bar-shift, 0));
      transform-box: fill-box;
      transform-origin: bottom;
  }

  .momentum-bar-two {
      opacity: 0.72;
  }

  .momentum-bar-three {
      fill: rgb(255 209 102 / 13%);
      stroke: #ffd166;
      filter: drop-shadow(0 0 var(--momentum-leader-glow, 2px) #ffd166);
  }

  .momentum-leader {
      stroke: #ffe5d8;
      stroke-width: 1.7;
      filter: drop-shadow(0 0 var(--momentum-line-glow, 2px) currentcolor);
      transition: transform 0.4s ease, filter 0.3s ease;
      transform: translateY(var(--momentum-line-shift, 0));
  }

  .momentum-spark {
      fill: #ffd166;
      opacity: var(--momentum-spark-opacity, 0.65);
      filter: drop-shadow(0 0 4px #ffd166);
      transition: transform 0.35s ease, opacity 0.25s ease;
      transform: scale(var(--momentum-spark-scale, 1));
      transform-box: fill-box;
      transform-origin: center;
  }

  .micro-cap-frame,
  .micro-cap-weight {
      stroke: #f0e68c;
      opacity: 0.55;
  }

  .micro-cap-node {
      fill: rgb(240 230 140 / 24%);
      stroke: currentcolor;
      stroke-width: 1;
      transition: transform 0.35s ease, filter 0.3s ease, opacity 0.25s ease;
      transform: scale(var(--micro-cap-node-scale, 1));
      transform-box: fill-box;
      transform-origin: center;
  }

  .micro-cap-node.selected {
      fill: #f0e68c;
      opacity: var(--micro-cap-selected-opacity, 0.82);
      filter: drop-shadow(0 0 var(--micro-cap-glow, 2px) #f0e68c);
  }

  .lab-connector {
      stroke-dasharray: 2 2.5;
      opacity: 0.55;
      transition: stroke-dashoffset 0.6s ease;
      stroke-dashoffset: var(--lab-flow-offset, 0);
  }

  .lab-input {
      fill: #b9f3ff;
      stroke: currentcolor;
      stroke-width: 1;
      filter: drop-shadow(0 0 var(--lab-input-glow, 2px) currentcolor);
  }

  .lab-input-two {
      fill: #52e3bd;
  }

  .lab-input-three {
      fill: #ffd166;
  }

  .lab-flask {
      fill: rgb(99 102 241 / 7%);
      filter: drop-shadow(0 0 var(--lab-flask-glow, 3px) currentcolor);
      transition: transform 0.4s ease, filter 0.3s ease;
      transform: translateY(var(--lab-flask-shift, 0));
  }

  .lab-liquid {
      fill: rgb(82 227 189 / 28%);
      stroke: #52e3bd;
  }

  .lab-bubble {
      fill: #b9f3ff;
      stroke: none;
      transition: transform 0.4s ease;
      transform: translateY(var(--lab-bubble-shift, 0));
  }

  .lof-axis {
      opacity: 0.3;
  }

  .lof-market-line {
      stroke: #62d8ff;
      stroke-width: 1.8;
      filter: drop-shadow(0 0 var(--lof-market-glow, 2px) #62d8ff);
      transition: transform 0.4s ease, filter 0.3s ease;
      transform: translateY(var(--lof-market-shift, 0));
  }

  .lof-nav-line {
      stroke: #52e3bd;
      stroke-width: 1.65;
      stroke-dasharray: 3 2;
      filter: drop-shadow(0 0 2px rgb(82 227 189 / 50%));
  }

  .lof-spread {
      stroke: #ffd166;
      filter: drop-shadow(0 0 var(--lof-spread-glow, 2px) #ffd166);
  }

  .lof-market-point,
  .lof-nav-point {
      fill: #62d8ff;
      filter: drop-shadow(0 0 3px currentcolor);
      transition: transform 0.35s ease;
      transform: scale(var(--lof-point-scale, 1));
      transform-box: fill-box;
      transform-origin: center;
  }

  .lof-nav-point {
      fill: #52e3bd;
  }

  .tools-panel {
      fill: rgb(138 43 226 / 7%);
      filter: drop-shadow(0 0 var(--tools-panel-glow, 2px) currentcolor);
  }

  .tools-track {
      opacity: 0.55;
  }

  .tools-knob {
      fill: #d8b4fe;
      stroke: #fff;
      stroke-width: 0.8;
      filter: drop-shadow(0 0 var(--tools-knob-glow, 2px) currentcolor);
      transition: transform 0.4s ease;
      transform: translateX(var(--tools-knob-shift, 0));
      transform-box: fill-box;
      transform-origin: center;
  }

  .tools-knob-two {
      --tools-knob-shift: var(--tools-knob-two-shift, 0);
  }

  .tools-knob-three {
      --tools-knob-shift: var(--tools-knob-three-shift, 0);
  }

  .tools-balance {
      stroke: #52e3bd;
      opacity: 0.75;
  }

  .wealth-map-shape {
      fill: rgb(45 212 191 / 8%);
      filter: drop-shadow(0 0 var(--wealth-map-glow, 3px) currentcolor);
  }

  .wealth-route {
      stroke: #b9f3ff;
      stroke-dasharray: 3 2;
      stroke-dashoffset: var(--wealth-route-offset, 0);
      transition: stroke-dashoffset 0.65s ease;
  }

  .wealth-stop {
      fill: #b9f3ff;
      filter: drop-shadow(0 0 3px #b9f3ff);
  }

  .wealth-pin {
      fill: rgb(255 209 102 / 15%);
      stroke: #ffd166;
      filter: drop-shadow(0 0 var(--wealth-pin-glow, 3px) #ffd166);
      transition: transform 0.4s ease, filter 0.3s ease;
      transform: translateY(var(--wealth-pin-shift, 0));
  }

  .wealth-pin circle {
      fill: #ffd166;
      stroke: none;
  }

  .notification-wave,
  .notification-bell,
  .notification-clapper,
  .notification-check {
      stroke: currentcolor;
      stroke-width: 1.6;
      stroke-linecap: round;
      stroke-linejoin: round;
  }

  .notification-wave {
      opacity: 0.48;
      filter: drop-shadow(0 0 3px currentcolor);
      animation: notification-wave-pulse 1.5s ease-in-out infinite;
      transform-origin: center;
  }

  .notification-wave-right {
      animation-delay: 0.25s;
  }

  .notification-bell {
      fill: rgb(96 165 250 / 10%);
      filter: drop-shadow(0 0 5px currentcolor);
      animation: notification-bell-ring 2s ease-in-out infinite;
      transform-origin: 24px 16px;
  }

  .notification-clapper {
      stroke: #52e3bd;
  }

  .notification-signal {
      fill: #ffd166;
      filter: drop-shadow(0 0 4px #ffd166);
      animation: notification-signal-pulse 1.2s ease-in-out infinite;
      transform-box: fill-box;
      transform-origin: center;
  }

  .notification-check {
      stroke: #b9f3ff;
      stroke-width: 1.8;
  }

  .admin-center-glyph {
      filter: drop-shadow(0 0 7px rgb(96 165 250 / 24%));
  }

  .admin-panel {
      fill: rgb(96 165 250 / 8%);
      filter: drop-shadow(0 0 var(--admin-panel-glow, 2px) currentcolor);
      transition: transform 0.35s ease, filter 0.3s ease;
      transform: translateY(var(--admin-panel-shift, 0));
  }

  .admin-panel-line {
      stroke: #d9f9ff;
      opacity: 0.78;
  }

  .admin-user-dot {
      fill: #52e3bd;
      filter: drop-shadow(0 0 var(--admin-user-glow, 3px) rgb(82 227 189 / 65%));
  }

  .admin-user-arc {
      stroke: #52e3bd;
  }

  .admin-shield {
      fill: rgb(255 209 102 / 10%);
      stroke: #ffd166;
      filter: drop-shadow(0 0 var(--admin-shield-glow, 3px) rgb(255 209 102 / 55%));
      transition: transform 0.35s ease, filter 0.3s ease;
      transform: scale(var(--admin-shield-scale, 1));
      transform-origin: 24px 32px;
  }

  .admin-check {
      stroke: #fff7c7;
      stroke-width: 1.4;
  }

  @keyframes notification-wave-pulse {
      50% {
          opacity: 1;
          transform: scale(1.08);
      }
  }

  @keyframes notification-bell-ring {
      0%,
      70%,
      100% {
          transform: rotate(0deg);
      }

      78% {
          transform: rotate(-5deg);
      }

      86% {
          transform: rotate(5deg);
      }

      94% {
          transform: rotate(-2deg);
      }
  }

  @keyframes notification-signal-pulse {
      50% {
          opacity: 0.55;
          transform: scale(0.76);
      }
  }

  .about-back-card {
      opacity: 0.35;
  }

  .about-front-card {
      fill: rgb(255 193 7 / 7%);
      filter: drop-shadow(0 0 var(--about-card-glow, 2px) currentcolor);
  }

  .about-info-dot {
      fill: #ffd166;
      filter: drop-shadow(0 0 3px #ffd166);
  }

  .about-info-line {
      stroke: #fff1b7;
  }

  .about-spark {
      stroke: #52e3bd;
      filter: drop-shadow(0 0 var(--about-spark-glow, 2px) #52e3bd);
      transition: transform 0.4s ease;
      transform: scale(var(--about-spark-scale, 1));
      transform-origin: 38px 9.5px;
  }

  .icon-glyph {
      stroke: currentcolor;
      stroke-width: 1.8;
      stroke-linecap: round;
      stroke-linejoin: round;
      filter: drop-shadow(0 0 var(--icon-glyph-glow, 0) currentcolor);
      transition: transform 0.45s ease, filter 0.25s ease;
      transform: scale(var(--icon-glyph-scale, 1));
      transform-origin: center;
  }

  .icon-glyph-fill {
      fill: currentcolor;
      stroke: none;
  }

  .icon-cutout {
      fill: #101827;
  }

  .icon-detail {
      stroke: #b9f3ff;
      opacity: 0.76;
  }

  .icon-detail-fill {
      fill: #b9f3ff;
      stroke: none;
  }

  .icon-detail-ring {
      stroke: #101827;
      stroke-width: 1;
  }

  @media (prefers-reduced-motion: reduce) {
      .icon-orbit,
      .icon-node,
      .icon-glyph {
          transition-duration: 0.01ms;
      }
  }
</style>
