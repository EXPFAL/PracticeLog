<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { NCard, NGrid, NGi, NStatistic, NList, NListItem, NTag, NButton, NEmpty, NSkeleton, NSpace, useMessage } from 'naive-ui'
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
  try {
    await practiceStore.fetchAll()
    const [items, logs] = await Promise.all([
      window.api.knowledgeListAll(),
      window.api.logRecent(5)
    ])
    allKnowledge.value = items
    recentLogs.value = logs
  } catch (e) {
    console.error('Dashboard load error:', e)
  } finally {
    loading.value = false
  }
})

const practiceCount = computed(() => practiceStore.practices.length)
const totalItems = computed(() => allKnowledge.value.length)
const mastered = computed(() => allKnowledge.value.filter(i => i.status === '已掌握').length)
const learning = computed(() => allKnowledge.value.filter(i => i.status === '学习中').length)
const unlearned = computed(() => allKnowledge.value.filter(i => i.status === '未学').length)
const masteryRate = computed(() => totalItems.value > 0 ? Math.round((mastered.value / totalItems.value) * 100) : 0)

function openPractice(id: number) {
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

async function handleImport() {
  const path = await window.api.dbSelectBackup()
  if (!path) return
  try {
    await window.api.dbImport(path)
    message.success('导入成功，正在刷新...')
    window.location.reload()
  } catch (e: unknown) {
    message.error('导入失败: ' + String(e))
  }
}
</script>

<template>
  <div>
    <NSpace justify="space-between" align="center" style="margin-bottom: 20px">
      <h2 style="margin: 0">总览</h2>
      <NSpace>
        <NButton size="small" @click="handleImport">导入备份</NButton>
        <NButton size="small" :loading="backingUp" @click="handleBackup">备份数据库</NButton>
      </NSpace>
    </NSpace>

    <template v-if="loading">
      <NGrid :cols="2" :x-gap="16" :y-gap="16" style="margin-bottom: 24px">
        <NGi><NCard><NSkeleton text :repeat="2" /></NCard></NGi>
        <NGi><NCard><NSkeleton text :repeat="3" /></NCard></NGi>
      </NGrid>
      <NGrid :cols="2" :x-gap="16" :y-gap="16">
        <NGi><NCard><NSkeleton text :repeat="4" /></NCard></NGi>
        <NGi><NCard><NSkeleton text :repeat="4" /></NCard></NGi>
      </NGrid>
    </template>

    <template v-else>
      <!-- 学习进度 hero -->
      <NCard style="margin-bottom: 20px">
        <NGrid :cols="3" :x-gap="24" :y-gap="16" align-items="center">
          <NGi span="1">
            <ProgressPie :mastered="mastered" :learning="learning" :unlearned="unlearned" />
          </NGi>
          <NGi span="2">
            <div style="font-size: 18px; font-weight: 600; margin-bottom: 12px">学习进度</div>
            <div style="font-size: 13px; color: var(--n-text-color-2, #666); line-height: 2">
              已掌握 <strong style="color: var(--n-color-success, #18a058)">{{ mastered }}</strong>
              &nbsp;·&nbsp; 学习中 <strong style="color: var(--n-color-warning, #f0a020)">{{ learning }}</strong>
              &nbsp;·&nbsp; 未学 <strong style="color: var(--n-color-error, #d03050)">{{ unlearned }}</strong>
            </div>
            <div style="margin-top: 8px; font-size: 14px">
              整体掌握率
              <span style="font-size: 28px; font-weight: 700; margin-left: 10px">{{ masteryRate }}%</span>
              <span style="font-size: 13px; color: var(--n-text-color-3, #999); margin-left: 10px">（{{ mastered }}/{{ totalItems }} 项）</span>
            </div>
          </NGi>
        </NGrid>
      </NCard>

      <!-- 统计条 -->
      <NGrid :cols="3" :x-gap="16" :y-gap="16" style="margin-bottom: 20px">
        <NGi>
          <NCard>
            <NStatistic label="实践记录" :value="practiceCount" />
          </NCard>
        </NGi>
        <NGi>
          <NCard>
            <NStatistic label="学习条目" :value="totalItems" />
          </NCard>
        </NGi>
        <NGi>
          <NCard>
            <NStatistic label="最近日志" :value="recentLogs.length" />
          </NCard>
        </NGi>
      </NGrid>

      <!-- 最近列表 -->
      <NGrid :cols="2" :x-gap="16" :y-gap="16">
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
                role="link"
                tabindex="0"
                style="cursor: pointer"
                :aria-label="'查看实践: ' + p.title"
                @click="openPractice(p.id)"
                @keydown.enter="openPractice(p.id)"
              >
                <div style="display: flex; justify-content: space-between; align-items: center">
                  <div>
                    <strong>{{ p.title }}</strong>
                    <div style="font-size: 12px; color: var(--n-text-color-3); margin-top: 4px">
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
        <NGi>
          <NCard title="最近日志">
            <NEmpty v-if="recentLogs.length === 0" description="还没有日志记录" />
            <NList v-else bordered>
              <NListItem v-for="log in recentLogs" :key="log.id">
                <div style="display: flex; justify-content: space-between; align-items: center">
                  <NTag size="small" type="info">{{ log.date }}</NTag>
                </div>
                <div v-if="log.what_done" style="font-size: 13px; margin-top: 4px">{{ log.what_done }}</div>
              </NListItem>
            </NList>
          </NCard>
        </NGi>
      </NGrid>
    </template>
  </div>
</template>
