<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { NCard, NList, NListItem, NTag, NEmpty, NSpace, NSelect } from 'naive-ui'
import type { SearchResult } from '../types'

const route = useRoute()
const router = useRouter()
const results = ref<SearchResult[]>([])
const loading = ref(false)
const query = ref((route.query.q as string) || '')
const entityType = ref<string>('')

const typeLabels: Record<string, { label: string; color: string }> = {
  practice: { label: '实践', color: 'info' },
  knowledge: { label: '知识点', color: 'success' },
  log: { label: '日志', color: 'warning' },
  project: { label: '项目', color: 'error' }
}

const typeOptions = [
  { label: '全部类型', value: '' },
  { label: '实践', value: 'practice' },
  { label: '知识点', value: 'knowledge' },
  { label: '日志', value: 'log' },
  { label: '项目', value: 'project' }
]

async function doSearch() {
  if (!query.value.trim()) { results.value = []; return }
  loading.value = true
  try {
    results.value = await window.api.searchQuery(query.value, undefined, entityType.value || undefined)
  } catch (e) {
    console.error('Search error:', e)
    results.value = []
  }
  loading.value = false
}

watch(() => route.query.q, (q) => {
  query.value = (q as string) || ''
  doSearch()
}, { immediate: true })

watch(entityType, () => doSearch())

function goToResult(item: SearchResult) {
  router.push(`/practice/${item.practice_id}`)
}
</script>

<template>
  <div>
    <NSpace justify="space-between" align="center" style="margin-bottom: 16px">
      <h2>搜索：{{ query }}</h2>
      <NSelect v-model:value="entityType" :options="typeOptions" style="width: 140px" />
    </NSpace>

    <div v-if="loading" style="text-align: center; padding: 24px;">搜索中...</div>

    <NEmpty v-else-if="!query" description="在顶部搜索栏输入关键词开始搜索" style="margin-top: 48px;" />

    <NEmpty v-else-if="results.length === 0" description="没有找到匹配的结果" />

    <NList v-else bordered>
      <NListItem
        v-for="item in results"
        :key="`${item.entity_type}-${item.entity_id}`"
        role="link"
        tabindex="0"
        style="cursor: pointer"
        :aria-label="item.title"
        @click="goToResult(item)"
        @keydown.enter="goToResult(item)"
      >
        <NSpace align="center" :size="8">
          <NTag :type="(typeLabels[item.entity_type]?.color as any) || 'default'" size="small">
            {{ typeLabels[item.entity_type]?.label || item.entity_type }}
          </NTag>
          <strong>{{ item.title }}</strong>
        </NSpace>
        <div v-if="item.snippet" style="font-size: 13px; color: var(--n-text-color-2); margin-top: 4px;" v-html="item.snippet" />
      </NListItem>
    </NList>
  </div>
</template>
