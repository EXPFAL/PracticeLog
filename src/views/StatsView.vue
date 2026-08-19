<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { NCard, NGrid, NGi, NStatistic, NSkeleton, NTag, NSpace, NProgress, NList, NListItem, NEmpty } from 'naive-ui'
import { usePracticeStore } from '../stores/practice'
import ProgressPie from '../components/common/ProgressPie.vue'
import type { KnowledgeItem, DailyLog } from '../types'

const practiceStore = usePracticeStore()
const loading = ref(true)
const allKnowledge = ref<KnowledgeItem[]>([])
const allLogs = ref<DailyLog[]>([])

onMounted(async () => {
  try {
    await practiceStore.fetchAll()
    const [items, logs] = await Promise.all([
      window.api.knowledgeListAll(),
      window.api.logListAll()
    ])
    allKnowledge.value = items
    allLogs.value = logs
  } catch (e) {
    console.error('Stats load error:', e)
  } finally {
    loading.value = false
  }
})

const mastered = computed(() => allKnowledge.value.filter(i => i.status === '已掌握').length)
const learning = computed(() => allKnowledge.value.filter(i => i.status === '学习中').length)
const unlearned = computed(() => allKnowledge.value.filter(i => i.status === '未学').length)
const total = computed(() => allKnowledge.value.length)
const masteredPct = computed(() => total.value ? Math.round(mastered.value / total.value * 100) : 0)

const weeklyLogs = computed(() => {
  const d = new Date(); d.setDate(d.getDate() - 7)
  const cutoff = d.toISOString().slice(0, 10)
  return allLogs.value.filter(l => l.date >= cutoff)
})

const monthlyLogs = computed(() => {
  const d = new Date(); d.setDate(d.getDate() - 30)
  const cutoff = d.toISOString().slice(0, 10)
  return allLogs.value.filter(l => l.date >= cutoff)
})

const practiceStats = computed(() => {
  return practiceStore.practices.map(p => {
    const items = allKnowledge.value.filter(i => i.practice_id === p.id)
    const logs = allLogs.value.filter(l => l.practice_id === p.id)
    const m = items.filter(i => i.status === '已掌握').length
    const l = items.filter(i => i.status === '学习中').length
    const u = items.filter(i => i.status === '未学').length
    return { practice: p, mastered: m, learning: l, unlearned: u, total: items.length, logCount: logs.length }
  }).sort((a, b) => b.total - a.total)
})

const topMastered = computed(() => allKnowledge.value.filter(i => i.status === '已掌握').slice(0, 10))

const activityByDate = computed(() => {
  const map = new Map<string, number>()
  for (const log of allLogs.value) {
    map.set(log.date, (map.get(log.date) || 0) + 1)
  }
  return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0])).slice(0, 14)
})
</script>

<template>
  <div>
    <h2 style="margin-bottom: 24px">统计分析</h2>

    <template v-if="loading">
      <NGrid :cols="4" :x-gap="16" :y-gap="16">
        <NGi v-for="i in 4" :key="i"><NCard><NSkeleton text :repeat="2" /></NCard></NGi>
      </NGrid>
    </template>

    <template v-else>
      <NGrid :cols="4" :x-gap="16" :y-gap="16" style="margin-bottom: 24px">
        <NGi><NCard><NStatistic label="实践总数" :value="practiceStore.practices.length" /></NCard></NGi>
        <NGi><NCard><NStatistic label="知识点总数" :value="total" /></NCard></NGi>
        <NGi><NCard><NStatistic label="本周日志" :value="weeklyLogs.length" /></NCard></NGi>
        <NGi><NCard><NStatistic label="本月日志" :value="monthlyLogs.length" /></NCard></NGi>
      </NGrid>

      <NGrid :cols="2" :x-gap="16" :y-gap="16" style="margin-bottom: 24px">
        <NGi>
          <NCard title="学习进度总览">
            <ProgressPie :mastered="mastered" :learning="learning" :unlearned="unlearned" />
            <div style="margin-top: 16px;">
              <div style="font-size: 13px; margin-bottom: 4px;">掌握率 {{ masteredPct }}%</div>
              <NProgress :percentage="masteredPct" :show-indicator="false" />
            </div>
          </NCard>
        </NGi>
        <NGi>
          <NCard title="近期活跃度（近14天）">
            <div v-if="activityByDate.length === 0" style="color: var(--n-text-color-3); font-size: 13px;">暂无活动记录</div>
            <div v-else style="display: flex; flex-wrap: wrap; gap: 4px;">
              <NTag v-for="[date, count] in activityByDate" :key="date" :type="count >= 3 ? 'success' : count >= 1 ? 'info' : 'default'" size="small">
                {{ date.slice(5) }} ({{ count }})
              </NTag>
            </div>
          </NCard>
        </NGi>
      </NGrid>

      <NCard title="各实践进度" style="margin-bottom: 24px">
        <NList v-if="practiceStats.length > 0" bordered>
          <NListItem v-for="stat in practiceStats" :key="stat.practice.id">
            <NSpace justify="space-between" align="center" style="width: 100%;">
              <div>
                <strong>{{ stat.practice.title }}</strong>
                <div style="font-size: 12px; color: var(--n-text-color-3);">{{ stat.logCount }} 条日志</div>
              </div>
              <NSpace :size="16">
                <span style="font-size: 12px; color: var(--n-color-success);">{{ stat.mastered }} 已掌握</span>
                <span style="font-size: 12px; color: var(--n-color-warning);">{{ stat.learning }} 学习中</span>
                <span style="font-size: 12px; color: var(--n-color-error);">{{ stat.unlearned }} 未学</span>
                <NProgress v-if="stat.total > 0" :percentage="Math.round(stat.mastered / stat.total * 100)" :show-indicator="false" style="width: 80px;" />
              </NSpace>
            </NSpace>
          </NListItem>
        </NList>
        <NEmpty v-else description="暂无实践数据" />
      </NCard>

      <NCard v-if="topMastered.length > 0" title="已掌握的知识点">
        <NList bordered>
          <NListItem v-for="item in topMastered" :key="item.id">
            <strong>{{ item.concept }}</strong>
            <div v-if="item.one_line_explain" style="font-size: 13px; color: var(--n-text-color-2); margin-top: 2px;">{{ item.one_line_explain }}</div>
          </NListItem>
        </NList>
      </NCard>
    </template>
  </div>
</template>
