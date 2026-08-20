<script setup lang="ts">
import { onMounted, ref, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { NTabs, NTabPane, NPageHeader, NButton, NSpace, NSkeleton, NResult } from 'naive-ui'
import { usePracticeStore } from '../stores/practice'
import PracticeForm from '../components/practice/PracticeForm.vue'
import MaterialUpload from '../components/practice/MaterialUpload.vue'
import KnowledgeList from '../components/knowledge/KnowledgeList.vue'
import StudyPlan from '../components/knowledge/StudyPlan.vue'
import DailyLogEditor from '../components/log/DailyLogEditor.vue'
import LogCalendar from '../components/log/LogCalendar.vue'
import ProjectArchiveForm from '../components/project/ProjectArchiveForm.vue'

const route = useRoute()
const router = useRouter()
const practiceStore = usePracticeStore()
const loading = ref(true)
const notFound = ref(false)
const activeTab = ref('config')
const selectedLogDate = ref<string | null>(null)

const practiceId = Number(route.params.id)

function handleKeydown(e: KeyboardEvent) {
  if (e.ctrlKey || e.metaKey) {
    if (e.key === '1') { activeTab.value = 'config'; e.preventDefault() }
    if (e.key === '2') { activeTab.value = 'knowledge'; e.preventDefault() }
    if (e.key === '3') { activeTab.value = 'log'; e.preventDefault() }
    if (e.key === '4') { activeTab.value = 'project'; e.preventDefault() }
    if (e.key === '5') { activeTab.value = 'study'; e.preventDefault() }
  }
}

onMounted(async () => {
  window.addEventListener('keydown', handleKeydown)
  const practice = await practiceStore.getById(practiceId)
  if (!practice) notFound.value = true
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
          <NButton size="small" @click="router.push('/export')">导出</NButton>
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
        <NTabPane name="config" tab="配置 (Ctrl+1)">
          <PracticeForm :practice-id="practiceId" />
          <MaterialUpload :practice-id="practiceId" />
        </NTabPane>

        <NTabPane name="knowledge" tab="学习清单 (Ctrl+2)">
          <KnowledgeList :practice-id="practiceId" />
        </NTabPane>

        <NTabPane name="log" tab="每日日志 (Ctrl+3)">
          <LogCalendar :practice-id="practiceId" @select="selectedLogDate = $event" />
          <DailyLogEditor :practice-id="practiceId" :external-date="selectedLogDate" />
        </NTabPane>

        <NTabPane name="project" tab="项目复盘 (Ctrl+4)">
          <ProjectArchiveForm :practice-id="practiceId" />
        </NTabPane>

        <NTabPane name="study" tab="补课计划 (Ctrl+5)">
          <StudyPlan :practice-id="practiceId" />
        </NTabPane>
      </NTabs>
    </template>
  </div>
</template>
