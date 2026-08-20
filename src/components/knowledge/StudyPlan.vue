<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import MarkdownIt from 'markdown-it'
import { NCard, NEmpty, NButton, NSpin, NSpace, useMessage } from 'naive-ui'
import { useKnowledgeStore } from '../../stores/knowledge'

const props = defineProps<{ practiceId: number }>()
const knowledgeStore = useKnowledgeStore()
const message = useMessage()
const loading = ref(true)

const md = new MarkdownIt({ html: false, linkify: true })
const rendered = computed(() => knowledgeStore.studyPlan ? md.render(knowledgeStore.studyPlan) : '')

onMounted(async () => {
  try {
    await knowledgeStore.fetchStudyPlan(props.practiceId)
  } catch (e: unknown) {
    message.error('加载补课计划失败: ' + String(e))
  } finally {
    loading.value = false
  }
})

async function copyPlan() {
  try {
    await navigator.clipboard.writeText(knowledgeStore.studyPlan)
    message.success('已复制到剪贴板')
  } catch {
    message.error('复制失败，请手动选择文本')
  }
}
</script>

<template>
  <NCard size="small">
    <template #header>
      <NSpace justify="space-between" align="center" style="width: 100%">
        <span style="font-weight: 600">补课计划</span>
        <NButton v-if="knowledgeStore.studyPlan" size="small" quaternary @click="copyPlan">复制 Markdown</NButton>
      </NSpace>
    </template>
    <NSpin :show="loading">
      <NEmpty v-if="!loading && !knowledgeStore.studyPlan" description="还没有补课计划。用上方「从项目文件夹生成」会同时写出知识点和 14 天计划">
        <template #extra>
          <span style="font-size: 13px; color: var(--n-text-color-3)">生成后会保存在这里，随时可查看或复制</span>
        </template>
      </NEmpty>
      <div v-else-if="knowledgeStore.studyPlan" class="study-plan-preview" v-html="rendered" />
    </NSpin>
  </NCard>
</template>

<style scoped>
.study-plan-preview :deep(h2) { font-size: 20px; margin-top: 24px; margin-bottom: 12px; color: var(--n-title-text-color); border-bottom: 1px solid var(--n-border-color); padding-bottom: 8px; }
.study-plan-preview :deep(h3) { font-size: 16px; margin-top: 20px; margin-bottom: 8px; color: var(--n-title-text-color); }
.study-plan-preview :deep(h4) { font-size: 14px; margin-top: 16px; margin-bottom: 6px; color: var(--n-title-text-color); }
.study-plan-preview :deep(strong) { color: var(--n-text-color); }
.study-plan-preview :deep(code) { background: var(--n-code-color, rgba(0,0,0,0.06)); padding: 1px 5px; border-radius: 3px; font-size: 13px; }
.study-plan-preview :deep(hr) { border: none; border-top: 1px solid var(--n-border-color); margin: 16px 0; }
.study-plan-preview :deep(ul), .study-plan-preview :deep(ol) { padding-left: 20px; }
.study-plan-preview :deep(li) { margin: 4px 0; line-height: 1.7; }
.study-plan-preview :deep(p) { margin: 8px 0; line-height: 1.7; }
.study-plan-preview :deep(blockquote) { border-left: 3px solid var(--n-color-success, #18a058); margin: 8px 0; padding: 4px 12px; color: var(--n-text-color-2); }
</style>
