<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { NCard, NList, NListItem, NTag, NEmpty, NSpin, NSpace } from 'naive-ui'
import type { SearchResult } from '../types'

const route = useRoute()
const router = useRouter()
const results = ref<SearchResult[]>([])
const loading = ref(false)
const query = ref((route.query.q as string) || '')

const typeLabels: Record<string, { label: string; color: string }> = {
  practice: { label: '实践', color: 'info' },
  knowledge: { label: '知识点', color: 'success' },
  log: { label: '日志', color: 'warning' },
  project: { label: '项目', color: 'error' }
}

async function doSearch(q: string) {
  if (!q.trim()) { results.value = []; return }
  loading.value = true
  try {
    results.value = await window.api.searchQuery(q)
  } catch { results.value = [] }
  loading.value = false
}

watch(() => route.query.q, (q) => {
  query.value = (q as string) || ''
  doSearch(query.value)
}, { immediate: true })

function goToResult(item: SearchResult) {
  router.push(`/practice/${item.practice_id}`)
}
</script>

<template>
  <div>
    <h2 style="margin-bottom: 16px">搜索：{{ query }}</h2>

    <NSpin v-if="loading" />

    <NEmpty v-else-if="results.length === 0 && query" description="没有找到匹配的结果" />

    <NList v-else bordered>
      <NListItem
        v-for="item in results"
        :key="`${item.entity_type}-${item.entity_id}`"
        style="cursor: pointer"
        @click="goToResult(item)"
      >
        <NSpace align="center" :size="8">
          <NTag :type="(typeLabels[item.entity_type]?.color as any) || 'default'" size="small">
            {{ typeLabels[item.entity_type]?.label || item.entity_type }}
          </NTag>
          <strong>{{ item.title }}</strong>
        </NSpace>
        <div v-if="item.snippet" style="font-size: 13px; color: #666; margin-top: 4px;" v-html="item.snippet" />
      </NListItem>
    </NList>
  </div>
</template>
