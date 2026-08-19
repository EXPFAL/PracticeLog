<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  mastered: number
  learning: number
  unlearned: number
}>()

const total = computed(() => props.mastered + props.learning + props.unlearned)
const hasData = computed(() => total.value > 0)

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  const start = polarToCartesian(cx, cy, r, endAngle)
  const end = polarToCartesian(cx, cy, r, startAngle)
  const largeArc = endAngle - startAngle > 180 ? 1 : 0
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`
}

function polarToCartesian(cx: number, cy: number, r: number, angle: number) {
  const rad = ((angle - 90) * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

const segments = computed(() => {
  if (!hasData.value) return []
  const data = [
    { value: props.mastered, color: '#18a058', label: '已掌握' },
    { value: props.learning, color: '#f0a020', label: '学习中' },
    { value: props.unlearned, color: '#d03050', label: '未学' }
  ]
  let angle = 0
  const result = []
  for (const item of data) {
    if (item.value === 0) continue
    const sweep = (item.value / total.value) * 360
    result.push({
      ...item,
      path: describeArc(50, 50, 40, angle, angle + sweep),
      pct: Math.round((item.value / total.value) * 100)
    })
    angle += sweep
  }
  return result
})
</script>

<template>
  <div style="display: flex; align-items: center; gap: 16px;">
    <svg v-if="hasData" viewBox="0 0 100 100" width="80" height="80">
      <circle cx="50" cy="50" r="40" fill="none" stroke="#e0e0e0" stroke-width="12" />
      <path
        v-for="(seg, i) in segments"
        :key="i"
        :d="seg.path"
        fill="none"
        :stroke="seg.color"
        stroke-width="12"
        stroke-linecap="round"
      />
      <text x="50" y="47" text-anchor="middle" font-size="14" font-weight="bold" fill="currentColor">
        {{ total }}
      </text>
      <text x="50" y="60" text-anchor="middle" font-size="7" fill="#999">
        总计
      </text>
    </svg>
    <div v-if="hasData" style="font-size: 13px; line-height: 1.8;">
      <div v-for="seg in segments" :key="seg.label">
        <span :style="{ color: seg.color }">●</span>
        {{ seg.label }}: {{ seg.value }} ({{ seg.pct }}%)
      </div>
    </div>
    <div v-else style="font-size: 13px; color: #999;">暂无学习数据</div>
  </div>
</template>
