<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { NCard, NButton, NSpace, NTag, NEmpty, useMessage } from 'naive-ui'
import { useKnowledgeStore } from '../../stores/knowledge'
import { formatLocalDate } from '../../utils/date'
import type { KnowledgeItem } from '../../types'

const props = defineProps<{ practiceId: number }>()
const knowledgeStore = useKnowledgeStore()
const message = useMessage()

const today = formatLocalDate()
const unmastered = computed(() => knowledgeStore.items.filter(i => i.status !== '已掌握'))

onMounted(() => {
  if (knowledgeStore.items.length === 0) knowledgeStore.fetch(props.practiceId)
})

watch(() => props.practiceId, (id) => knowledgeStore.fetch(id))

function nextStatus(status: KnowledgeItem['status']): KnowledgeItem['status'] {
  if (status === '未学') return '学习中'
  return '已掌握'
}

async function advance(item: KnowledgeItem) {
  const status = nextStatus(item.status)
  try {
    await knowledgeStore.update(item.id, { status })
    message.success(status === '学习中' ? `开始学习「${item.concept}」` : `已掌握「${item.concept}」`)
  } catch (e: unknown) {
    message.error('更新失败: ' + String(e))
  }
}
</script>

<template>
  <NCard v-if="knowledgeStore.items.length > 0" title="今日打卡" size="small" style="margin-bottom: 16px">
    <template #header-extra>
      <span style="font-size: 12px; color: var(--n-text-color-3)">{{ today }} · 点一次推进状态</span>
    </template>
    <NEmpty v-if="unmastered.length === 0" description="这项实践的知识点都已掌握" size="small" />
    <NSpace v-else vertical :size="8">
      <div
        v-for="item in unmastered"
        :key="item.id"
        style="display: flex; justify-content: space-between; align-items: center; gap: 8px"
      >
        <div>
          {{ item.concept }}
          <NTag v-if="item.status === '学习中'" size="tiny" type="warning" style="margin-left: 4px">学习中</NTag>
          <NTag v-else size="tiny" type="default" style="margin-left: 4px">未学</NTag>
        </div>
        <NButton size="tiny" type="primary" ghost @click="advance(item)">
          {{ item.status === '未学' ? '开始学' : '标为已掌握' }}
        </NButton>
      </div>
    </NSpace>
  </NCard>
</template>
