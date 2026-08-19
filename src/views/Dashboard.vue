<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { NCard, NGrid, NGi, NStatistic, NList, NListItem, NTag, NButton, NEmpty, NSpin } from 'naive-ui'
import { useRouter } from 'vue-router'
import { usePracticeStore } from '../stores/practice'
import type { DailyLog, KnowledgeItem } from '../types'

const router = useRouter()
const practiceStore = usePracticeStore()
const recentLogs = ref<DailyLog[]>([])
const allKnowledge = ref<KnowledgeItem[]>([])
const loading = ref(true)

onMounted(async () => {
  await practiceStore.fetchAll()
  loading.value = false
})

const practiceCount = computed(() => practiceStore.practices.length)

async function openPractice(id: number) {
  router.push(`/practice/${id}`)
}
</script>

<template>
  <div>
    <h2 style="margin-bottom: 24px">PracticeLog — 实践学习助手</h2>

    <NSpin :show="loading">
      <NGrid :cols="3" :x-gap="16" :y-gap="16" style="margin-bottom: 24px">
        <NGi>
          <NCard>
            <NStatistic label="实践记录" :value="practiceCount" />
          </NCard>
        </NGi>
        <NGi>
          <NCard>
            <NStatistic label="最近日志" :value="recentLogs.length" />
          </NCard>
        </NGi>
        <NGi>
          <NCard>
            <NStatistic label="学习条目" :value="allKnowledge.length" />
          </NCard>
        </NGi>
      </NGrid>

      <NCard title="最近实践" style="margin-bottom: 24px">
        <template v-if="practiceStore.practices.length === 0" #header-extra>
          <NButton type="primary" size="small" @click="router.push('/practices')">新建实践</NButton>
        </template>
        <NEmpty v-if="practiceStore.practices.length === 0" description="还没有实践记录" />
        <NList v-else bordered hoverable>
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
              <div>
                <NTag v-if="p.start_date" size="small" type="info">{{ p.start_date }}</NTag>
              </div>
            </div>
          </NListItem>
        </NList>
      </NCard>
    </NSpin>
  </div>
</template>
