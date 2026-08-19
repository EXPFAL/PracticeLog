<script setup lang="ts">
import { onMounted, ref, provide } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { NTabs, NTabPane, NPageHeader, NButton, NSpace, NSpin, useMessage } from 'naive-ui'
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

const practiceId = Number(route.params.id)

provide('practiceId', practiceId)

onMounted(async () => {
  await practiceStore.getById(practiceId)
  loading.value = false
})
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

    <NSpin :show="loading">
      <NTabs v-model:value="activeTab" type="line" animated style="margin-top: 16px">
        <NTabPane name="config" tab="配置">
          <PracticeForm :practice-id="practiceId" />
          <MaterialUpload :practice-id="practiceId" />
        </NTabPane>

        <NTabPane name="knowledge" tab="学习清单">
          <KnowledgeList :practice-id="practiceId" />
        </NTabPane>

        <NTabPane name="log" tab="每日日志">
          <LogCalendar :practice-id="practiceId" />
          <DailyLogEditor :practice-id="practiceId" />
        </NTabPane>

        <NTabPane name="project" tab="项目复盘">
          <ProjectArchiveForm :practice-id="practiceId" />
        </NTabPane>
      </NTabs>
    </NSpin>
  </div>
</template>
