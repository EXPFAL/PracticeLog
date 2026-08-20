<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { NTabs, NTabPane, NPageHeader, NButton, NSpace, NSkeleton, NResult } from 'naive-ui'
import { usePracticeStore } from '../stores/practice'
import { useKnowledgeStore } from '../stores/knowledge'
import PracticeForm from '../components/practice/PracticeForm.vue'
import MaterialUpload from '../components/practice/MaterialUpload.vue'
import KnowledgeList from '../components/knowledge/KnowledgeList.vue'
import StudyPlan from '../components/knowledge/StudyPlan.vue'
import DailyLogEditor from '../components/log/DailyLogEditor.vue'
import LogCalendar from '../components/log/LogCalendar.vue'
import DailyCheckin from '../components/knowledge/DailyCheckin.vue'
import ProjectArchiveForm from '../components/project/ProjectArchiveForm.vue'
import { formatLocalDate, isPracticeTab, inferPracticeTab, type PracticeTab } from '../utils/date'

const route = useRoute()
const router = useRouter()
const practiceStore = usePracticeStore()
const knowledgeStore = useKnowledgeStore()
const loading = ref(true)
const notFound = ref(false)
const activeTab = ref<PracticeTab>('prepare')
const selectedLogDate = ref(formatLocalDate())
const syncingQuery = ref(false)

const practiceId = Number(route.params.id)

function tabFromQuery(): PracticeTab | null {
  return isPracticeTab(route.query.tab) ? route.query.tab : null
}

function dateFromQuery(): string | null {
  const d = route.query.date
  return typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : null
}

async function resolveDefaultTab(): Promise<PracticeTab> {
  const fromQuery = tabFromQuery()
  if (fromQuery) return fromQuery

  const [items, logs, projects] = await Promise.all([
    window.api.knowledgeList(practiceId),
    window.api.logList(practiceId),
    window.api.projectList(practiceId)
  ])
  knowledgeStore.items = items
  return inferPracticeTab({
    knowledgeCount: items.length,
    logCount: logs.length,
    endDate: practiceStore.current?.end_date ?? null,
    hasArchive: projects.length > 0
  })
}

function writeQuery(tab: PracticeTab, date: string) {
  syncingQuery.value = true
  const query: Record<string, string> = { tab }
  if (tab === 'today') query.date = date
  router.replace({ query }).finally(() => {
    syncingQuery.value = false
  })
}

function handleKeydown(e: KeyboardEvent) {
  if (e.ctrlKey || e.metaKey) {
    if (e.key === '1') { activeTab.value = 'today'; e.preventDefault() }
    if (e.key === '2') { activeTab.value = 'prepare'; e.preventDefault() }
    if (e.key === '3') { activeTab.value = 'review'; e.preventDefault() }
  }
}

watch(activeTab, (tab) => {
  if (syncingQuery.value) return
  writeQuery(tab, selectedLogDate.value)
})

watch(selectedLogDate, (date) => {
  if (syncingQuery.value || activeTab.value !== 'today') return
  writeQuery('today', date)
})

watch(() => [route.query.tab, route.query.date], () => {
  if (syncingQuery.value) return
  const tab = tabFromQuery()
  if (tab) activeTab.value = tab
  const date = dateFromQuery()
  if (date) selectedLogDate.value = date
})

onMounted(async () => {
  window.addEventListener('keydown', handleKeydown)
  const practice = await practiceStore.getById(practiceId)
  if (!practice) {
    notFound.value = true
    loading.value = false
    return
  }
  const qDate = dateFromQuery()
  if (qDate) selectedLogDate.value = qDate
  activeTab.value = await resolveDefaultTab()
  if (!tabFromQuery()) writeQuery(activeTab.value, selectedLogDate.value)
  loading.value = false
})

onUnmounted(() => window.removeEventListener('keydown', handleKeydown))
</script>

<template>
  <div>
    <NPageHeader @back="router.push('/practices')">
      <template #title>
        {{ practiceStore.current?.title || '实践详情' }}
      </template>
      <template #extra>
        <NSpace>
          <NButton size="small" @click="router.push({ path: '/export', query: { practiceId: String(practiceId) } })">导出</NButton>
        </NSpace>
      </template>
    </NPageHeader>

    <NResult v-if="notFound" status="404" title="实践不存在" description="该实践记录可能已被删除。" style="margin-top: 48px;">
      <template #footer>
        <NButton type="primary" @click="router.push('/practices')">返回列表</NButton>
      </template>
    </NResult>

    <template v-else-if="loading">
      <NSkeleton text :repeat="6" style="margin-top: 16px" />
    </template>

    <template v-else>
      <NTabs v-model:value="activeTab" type="line" animated style="margin-top: 16px">
        <NTabPane name="today" tab="今日 (Ctrl+1)">
          <LogCalendar :practice-id="practiceId" :selected-date="selectedLogDate" @select="selectedLogDate = $event" />
          <DailyCheckin :practice-id="practiceId" />
          <DailyLogEditor :practice-id="practiceId" :date="selectedLogDate" @select-date="selectedLogDate = $event" />
        </NTabPane>

        <NTabPane name="prepare" tab="准备 (Ctrl+2)">
          <PracticeForm :practice-id="practiceId" />
          <MaterialUpload :practice-id="practiceId" />
          <KnowledgeList :practice-id="practiceId" />
          <div style="margin-top: 16px">
            <StudyPlan :practice-id="practiceId" />
          </div>
        </NTabPane>

        <NTabPane name="review" tab="复盘 (Ctrl+3)">
          <ProjectArchiveForm :practice-id="practiceId" />
        </NTabPane>
      </NTabs>
    </template>
  </div>
</template>
