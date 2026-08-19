<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { NCard, NGrid, NGi, NStatistic, NList, NListItem, NTag, NButton, NEmpty, NSpin, NSpace, useMessage } from 'naive-ui'
import { useRouter } from 'vue-router'
import { usePracticeStore } from '../stores/practice'
import ProgressPie from '../components/common/ProgressPie.vue'
import type { DailyLog, KnowledgeItem } from '../types'

const router = useRouter()
const practiceStore = usePracticeStore()
const message = useMessage()
const recentLogs = ref<DailyLog[]>([])
const allKnowledge = ref<KnowledgeItem[]>([])
const loading = ref(true)
const backingUp = ref(false)

onMounted(async () => {
  await practiceStore.fetchAll()

  // Fetch knowledge stats across all practices
  const allLogs: DailyLog[] = []
  const allItems: KnowledgeItem[] = []
  for (const p of practiceStore.practices) {
    try {
      const items = await window.api.knowledgeList(p.id)
      allItems.push(...items)
      const logs = await window.api.logList(p.id)
      allLogs.push(...logs)
    } catch { /* ignore */ }
  }
  allKnowledge.value = allItems
  recentLogs.value = allLogs.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5)
  loading.value = false
})

const practiceCount = computed(() => practiceStore.practices.length)
const mastered = computed(() => allKnowledge.value.filter(i => i.status === '已掌握').length)
const learning = computed(() => allKnowledge.value.filter(i => i.status === '学习中').length)
const unlearned = computed(() => allKnowledge.value.filter(i => i.status === '未学').length)

async function openPractice(id: number) {
  router.push(`/practice/${id}`)
}

async function handleBackup() {
  backingUp.value = true
  try {
    const path = await window.api.dbBackup()
    message.success(`备份成功: ${path}`)
  } catch (e: unknown) {
    message.error('备份失败: ' + String(e))
  } finally {
    backingUp.value = false
  }
}
</script>

<template>
  <div>
    <NSpace justify="space-between" align="center" style="margin-bottom: 24px">
      <h2>PracticeLog — 实践学习助手</h2>
      <NButton :loading="backingUp" @click="handleBackup">备份数据库</NButton>
    </NSpace>

    <NSpin :show="loading">
      <NGrid :cols="2" :x-gap="16" :y-gap="16" style="margin-bottom: 24px">
        <NGi>
          <NCard>
            <NStatistic label="实践记录" :value="practiceCount" />
          </NCard>
        </NGi>
        <NGi>
          <NCard title="学习进度">
            <ProgressPie :mastered="mastered" :learning="learning" :unlearned="unlearned" />
          </NCard>
        </NGi>
      </NGrid>

      <NGrid :cols="2" :x-gap="16" :y-gap="16" style="margin-bottom: 24px">
        <NGi>
          <NCard title="最近日志" v-if="recentLogs.length > 0">
            <NList bordered>
              <NListItem v-for="log in recentLogs" :key="log.id">
                <div style="display: flex; justify-content: space-between; align-items: center">
                  <NTag size="small" type="info">{{ log.date }}</NTag>
                </div>
                <div v-if="log.what_done" style="font-size: 13px; margin-top: 4px">{{ log.what_done }}</div>
              </NListItem>
            </NList>
          </NCard>
        </NGi>
        <NGi>
          <NCard title="最近实践">
            <template v-if="practiceStore.practices.length === 0" #header-extra>
              <NButton type="primary" size="small" @click="router.push('/practices')">新建</NButton>
            </template>
            <NEmpty v-if="practiceStore.practices.length === 0" description="还没有实践记录" />
            <NList v-else bordered>
              <NListItem
                v-for="p in practiceStore.practices.slice(0, 5)"
                :key="p.id"
                style="cursor: pointer"
                @click="openPractice(p.id)"
              >
                <div style="display: flex; justify-content: space-between; align-items: center">
                  <div>
                    <strong>{{ p.title }}</strong>
                    <div style="font-size: 12px; color: #999; margin-top: 4px">
                      {{ p.location || '未设置地点' }}
                      <template v-if="p.advisor"> · {{ p.advisor }}</template>
                    </div>
                  </div>
                  <NTag v-if="p.start_date" size="small" type="info">{{ p.start_date }}</NTag>
                </div>
              </NListItem>
            </NList>
          </NCard>
        </NGi>
      </NGrid>
    </NSpin>
  </div>
</template>
