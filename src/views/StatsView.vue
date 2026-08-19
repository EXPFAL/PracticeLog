<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { NCard, NGrid, NGi, NStatistic, NSkeleton, NList, NListItem, NTag, NSpace, NProgress } from 'naive-ui'
import { usePracticeStore } from '../stores/practice'
import ProgressPie from '../components/common/ProgressPie.vue'
import type { KnowledgeItem, DailyLog, Practice } from '../types'

const practiceStore = usePracticeStore()
const loading = ref(true)
const allKnowledge = ref<KnowledgeItem[]>([])
const allLogs = ref<DailyLog[]>([])

onMounted(async () => {
  await practiceStore.fetchAll()
  const items: KnowledgeItem[] = []
  const logs: DailyLog[] = []
  for (const p of practiceStore.practices) {
    try {
      items.push(...await window.api.knowledgeList(p.id))
      logs.push(...await window.api.logList(p.id))
    } catch { /* ignore */ }
  }
  allKnowledge.value = items
  allLogs.value = logs
  loading.value = false
})

const mastered = computed(() => allKnowledge.value.filter(i => i.status === '已掌握').length)
const learning = computed(() => allKnowledge.value.filter(i => i.status === '学习中').length)
const unlearned = computed(() => allKnowledge.value.filter(i => i.status === '未学').length)
const total = computed(() => allKnowledge.value.length)
const masteredPct = computed(() => total.value ? Math.round(mastered.value / total.value * 100) : 0)

// Weekly log activity (last 7 days)
const weeklyLogs = computed(() => {
  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  return allLogs.value.filter(l => l.date >= weekAgo.toISOString().slice(0, 10))
})

// Monthly activity (last 30 days)
const monthlyLogs = computed(() => {
  const now = new Date()
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  return allLogs.value.filter(l => l.date >= monthAgo.toISOString().slice(0, 10))
})

// Per-practice stats
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

// Top mastered concepts
const topMastered = computed(() =>
  allKnowledge.value
    .filter(i => i.status === '已掌握')
    .slice(0, 10)
)

// Activity heatmap (simplified - just count logs per date)
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
      <!-- Overview cards -->
      <NGrid :cols="4" :x-gap="16" :y-gap="16" style="margin-bottom: 24px">
        <NGi>
          <NCard>
            <NStatistic label="实践总数" :value="practiceStore.practices.length" />
          </NCard>
        </NGi>
        <NGi>
          <NCard>
            <NStatistic label="知识点总数" :value="total" />
          </NCard>
        </NGi>
        <NGi>
          <NCard>
            <NStatistic label="本周日志" :value="weeklyLogs.length" />
          </NCard>
        </NGi>
        <NGi>
          <NCard>
            <NStatistic label="本月日志" :value="monthlyLogs.length" />
          </NCard>
        </NGi>
      </NGrid>

      <NGrid :cols="2" :x-gap="16" :y-gap="16" style="margin-bottom: 24px">
        <!-- Progress overview -->
        <NGi>
          <NCard title="学习进度总览">
            <ProgressPie :mastered="mastered" :learning="learning" :unlearned="unlearned" />
            <div style="margin-top: 16px;">
              <div style="font-size: 13px; margin-bottom: 4px;">掌握率 {{ masteredPct }}%</div>
              <NProgress :percentage="masteredPct" :show-indicator="false" />
            </div>
          </NCard>
        </NGi>

        <!-- Recent activity -->
        <NGi>
          <NCard title="近期活跃度（近14天）">
            <div v-if="activityByDate.length === 0" style="color: #999; font-size: 13px;">暂无活动记录</div>
            <div v-else style="display: flex; flex-wrap: wrap; gap: 4px;">
              <NTag
                v-for="[date, count] in activityByDate"
                :key="date"
                :type="count >= 3 ? 'success' : count >= 1 ? 'info' : 'default'"
                size="small"
              >
                {{ date.slice(5) }} ({{ count }})
              </NTag>
            </div>
          </NCard>
        </NGi>
      </NGrid>

      <!-- Per-practice breakdown -->
      <NCard title="各实践进度" style="margin-bottom: 24px">
        <NList v-if="practiceStats.length > 0" bordered>
          <NListItem v-for="stat in practiceStats" :key="stat.practice.id">
            <NSpace justify="space-between" align="center" style="width: 100%;">
              <div>
                <strong>{{ stat.practice.title }}</strong>
                <div style="font-size: 12px; color: #999;">{{ stat.logCount }} 条日志</div>
              </div>
              <NSpace :size="16">
                <NSpace :size="4" align="center">
                  <span style="font-size: 12px; color: #18a058;">{{ stat.mastered }}</span>
                  <span style="font-size: 11px; color: #999;">已掌握</span>
                </NSpace>
                <NSpace :size="4" align="center">
                  <span style="font-size: 12px; color: #f0a020;">{{ stat.learning }}</span>
                  <span style="font-size: 11px; color: #999;">学习中</span>
                </NSpace>
                <NSpace :size="4" align="center">
                  <span style="font-size: 12px; color: #d03050;">{{ stat.unlearned }}</span>
                  <span style="font-size: 11px; color: #999;">未学</span>
                </NSpace>
                <NProgress
                  v-if="stat.total > 0"
                  :percentage="Math.round(stat.mastered / stat.total * 100)"
                  :show-indicator="false"
                  style="width: 80px;"
                />
              </NSpace>
            </NSpace>
          </NListItem>
        </NList>
        <NEmpty v-else description="暂无实践数据" />
      </NCard>

      <!-- Top mastered -->
      <NCard v-if="topMastered.length > 0" title="已掌握的知识点">
        <NList bordered>
          <NListItem v-for="item in topMastered" :key="item.id">
            <strong>{{ item.concept }}</strong>
            <div v-if="item.one_line_explain" style="font-size: 13px; color: #666; margin-top: 2px;">{{ item.one_line_explain }}</div>
          </NListItem>
        </NList>
      </NCard>
    </template>
  </div>
</template>
