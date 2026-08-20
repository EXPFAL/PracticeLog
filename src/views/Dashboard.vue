<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { NCard, NGrid, NGi, NList, NListItem, NTag, NButton, NEmpty, NSkeleton, NSpace } from 'naive-ui'
import { useRouter } from 'vue-router'
import { usePracticeStore } from '../stores/practice'
import { formatLocalDate, inferPracticeTab } from '../utils/date'
import type { DailyLog, KnowledgeItem, Practice } from '../types'

const router = useRouter()
const practiceStore = usePracticeStore()
const recentLogs = ref<DailyLog[]>([])
const allKnowledge = ref<KnowledgeItem[]>([])
const allLogs = ref<DailyLog[]>([])
const archiveCounts = ref<Record<number, number>>({})
const loading = ref(true)

const today = formatLocalDate()

onMounted(async () => {
  try {
    await practiceStore.fetchAll()
    const [items, recent, logs] = await Promise.all([
      window.api.knowledgeListAll(),
      window.api.logRecent(8),
      window.api.logListAll()
    ])
    allKnowledge.value = items
    recentLogs.value = recent
    allLogs.value = logs

    const counts: Record<number, number> = {}
    await Promise.all(practiceStore.practices.map(async (p) => {
      const projects = await window.api.projectList(p.id)
      counts[p.id] = projects.length
    }))
    archiveCounts.value = counts
  } catch (e) {
    console.error('Dashboard load error:', e)
  } finally {
    loading.value = false
  }
})

function isActivePractice(p: Practice): boolean {
  if (p.end_date && today > p.end_date) return false
  return true
}

const activePractices = computed(() =>
  practiceStore.practices.filter(isActivePractice)
)

function knowledgeCount(practiceId: number) {
  return allKnowledge.value.filter(i => i.practice_id === practiceId).length
}

function logCount(practiceId: number) {
  return allLogs.value.filter(l => l.practice_id === practiceId).length
}

function hasTodayLog(practiceId: number) {
  return allLogs.value.some(l => l.practice_id === practiceId && l.date === today)
}

function continuePractice(p: Practice) {
  const tab = inferPracticeTab({
    knowledgeCount: knowledgeCount(p.id),
    logCount: logCount(p.id),
    endDate: p.end_date,
    hasArchive: (archiveCounts.value[p.id] ?? 0) > 0
  })
  const query: Record<string, string> = { tab }
  if (tab === 'today') query.date = today
  router.push({ path: `/practice/${p.id}`, query })
}

function openLog(log: DailyLog) {
  router.push({
    path: `/practice/${log.practice_id}`,
    query: { tab: 'today', date: log.date }
  })
}

function practiceTitle(practiceId: number) {
  return practiceStore.practices.find(p => p.id === practiceId)?.title ?? `实践 #${practiceId}`
}

const mastered = computed(() => allKnowledge.value.filter(i => i.status === '已掌握').length)
const totalItems = computed(() => allKnowledge.value.length)
const masteryRate = computed(() => totalItems.value > 0 ? Math.round((mastered.value / totalItems.value) * 100) : 0)
</script>

<template>
  <div>
    <NSpace justify="space-between" align="center" style="margin-bottom: 20px">
      <h2 style="margin: 0">今天做什么</h2>
      <NButton type="primary" size="small" @click="router.push({ path: '/practices', query: { new: '1' } })">
        新建实践
      </NButton>
    </NSpace>

    <template v-if="loading">
      <NGrid :cols="1" :y-gap="16">
        <NGi><NCard><NSkeleton text :repeat="4" /></NCard></NGi>
        <NGi><NCard><NSkeleton text :repeat="3" /></NCard></NGi>
      </NGrid>
    </template>

    <template v-else>
      <NEmpty
        v-if="practiceStore.practices.length === 0"
        description="还没有实践。先建一条，再上传资料或从项目生成学习清单。"
        style="margin: 48px 0"
      >
        <template #extra>
          <NButton type="primary" @click="router.push({ path: '/practices', query: { new: '1' } })">新建实践</NButton>
        </template>
      </NEmpty>

      <template v-else>
        <NCard title="进行中的实践" style="margin-bottom: 20px">
          <NEmpty v-if="activePractices.length === 0" description="没有进行中的实践（可能都已结束）">
            <template #extra>
              <NButton size="small" @click="router.push('/practices')">去实践列表</NButton>
            </template>
          </NEmpty>
          <NList v-else bordered>
            <NListItem v-for="p in activePractices" :key="p.id">
              <div style="display: flex; justify-content: space-between; align-items: center; gap: 12px; width: 100%">
                <div style="flex: 1; min-width: 0">
                  <strong>{{ p.title }}</strong>
                  <div style="font-size: 12px; color: var(--n-text-color-3); margin-top: 4px">
                    {{ p.location || '未设置地点' }}
                    <template v-if="p.start_date"> · {{ p.start_date }}</template>
                  </div>
                </div>
                <NSpace align="center" :size="8">
                  <NTag v-if="hasTodayLog(p.id)" size="small" type="success">今日已记</NTag>
                  <NTag v-else size="small" type="warning">今日未记</NTag>
                  <NButton size="small" type="primary" @click="continuePractice(p)">继续</NButton>
                </NSpace>
              </div>
            </NListItem>
          </NList>
        </NCard>

        <NGrid :cols="2" :x-gap="16" :y-gap="16" style="margin-bottom: 20px">
          <NGi>
            <NCard title="最近日志">
              <NEmpty v-if="recentLogs.length === 0" description="还没有日志，点「继续」写今天的" />
              <NList v-else bordered>
                <NListItem
                  v-for="log in recentLogs"
                  :key="log.id"
                  role="link"
                  tabindex="0"
                  style="cursor: pointer"
                  :aria-label="'打开日志 ' + log.date"
                  @click="openLog(log)"
                  @keydown.enter="openLog(log)"
                >
                  <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px">
                    <span style="font-size: 13px; color: var(--n-text-color-2)">{{ practiceTitle(log.practice_id) }}</span>
                    <NTag size="small" type="info">{{ log.date }}</NTag>
                  </div>
                  <div v-if="log.what_done" style="font-size: 13px; margin-top: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap">
                    {{ log.what_done }}
                  </div>
                </NListItem>
              </NList>
            </NCard>
          </NGi>
          <NGi>
            <NCard title="学习进度（概览）">
              <template #header-extra>
                <NButton size="tiny" quaternary @click="router.push('/stats')">看统计</NButton>
              </template>
              <div style="font-size: 14px; line-height: 1.8">
                掌握率
                <span style="font-size: 24px; font-weight: 700; margin-left: 8px">{{ masteryRate }}%</span>
                <span style="font-size: 13px; color: var(--n-text-color-3); margin-left: 8px">
                  （{{ mastered }}/{{ totalItems }}）
                </span>
              </div>
              <div style="font-size: 13px; color: var(--n-text-color-2); margin-top: 8px">
                共 {{ practiceStore.practices.length }} 条实践 · 详细分布在「统计」页
              </div>
            </NCard>
          </NGi>
        </NGrid>
      </template>
    </template>
  </div>
</template>
