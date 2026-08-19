<script setup lang="ts">
import { onMounted, ref, provide, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { NTabs, NTabPane, NPageHeader, NButton, NSpace, NSkeleton, useMessage } from 'naive-ui'
import { usePracticeStore } from '../stores/practice'
import PracticeForm from '../components/practice/PracticeForm.vue'
import MaterialUpload from '../components/practice/MaterialUpload.vue'
import KnowledgeList from '../components/knowledge/KnowledgeList.vue'
import DailyLogEditor from '../components/log/DailyLogEditor.vue'
import LogCalendar from '../components/log/LogCalendar.vue'
import ProjectArchiveForm from '../components/project/ProjectArchiveForm.vue'

const route = useRoute()
const router = useRouter()
const practiceStore = usePracticeStore()
const message = useMessage()
const loading = ref(true)
const activeTab = ref('config')
const selectedLogDate = ref<string | null>(null)

const practiceId = Number(route.params.id)

provide('practiceId', practiceId)

onMounted(async () => {
  await practiceStore.getById(practiceId)
  loading.value = false
})

// Keyboard shortcuts
function handleKeydown(e: KeyboardEvent) {
  if (e.ctrlKey || e.metaKey) {
    if (e.key === '1') { activeTab.value = 'config'; e.preventDefault() }
    if (e.key === '2') { activeTab.value = 'knowledge'; e.preventDefault() }
    if (e.key === '3') { activeTab.value = 'log'; e.preventDefault() }
    if (e.key === '4') { activeTab.value = 'project'; e.preventDefault() }
  }
}
window.addEventListener('keydown', handleKeydown)
onUnmounted(() => window.removeEventListener('keydown', handleKeydown))
</script>

<template>
  <div>
    <NPageHeader @back="router.push('/practices')">
      <template #title>
        {{ practiceStore.current?.title || '加载中...' }}
      </template>
      <template #extra>
        <NSpace>
          <NButton size="small" @click="router.push('/export')">导出</NButton>
        </NSpace>
      </template>
    </NPageHeader>

    <template v-if="loading">
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
      </NTabs>
    </template>
  </div>
</template>
