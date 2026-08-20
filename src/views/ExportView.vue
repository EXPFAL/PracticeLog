<script setup lang="ts">
import { onMounted, ref, watch, computed } from 'vue'
import { useRoute } from 'vue-router'
import { NSelect, NButton, NCard, NSpace, NEmpty, NSpin, NTabs, NTabPane, useMessage } from 'naive-ui'
import MarkdownIt from 'markdown-it'
import { usePracticeStore } from '../stores/practice'

const route = useRoute()
const practiceStore = usePracticeStore()
const message = useMessage()
const selectedId = ref<number | null>(null)
const markdownText = ref('')
const exporting = ref(false)
const loadingPreview = ref(false)
const batchExporting = ref(false)

const md = new MarkdownIt({ html: false, linkify: true })

const renderedHtml = computed(() => {
  if (!markdownText.value) return ''
  return md.render(markdownText.value)
})

onMounted(async () => {
  await practiceStore.fetchAll()
  const raw = route.query.practiceId
  const id = typeof raw === 'string' ? Number(raw) : NaN
  if (!isNaN(id) && id > 0 && practiceStore.practices.some(p => p.id === id)) {
    selectedId.value = id
  }
})

watch(() => route.query.practiceId, (raw) => {
  const id = typeof raw === 'string' ? Number(raw) : NaN
  if (!isNaN(id) && id > 0 && practiceStore.practices.some(p => p.id === id)) {
    selectedId.value = id
  }
})

const options = computed(() =>
  practiceStore.practices.map(p => ({ label: p.title, value: p.id }))
)

watch(selectedId, async (id) => {
  if (!id) {
    markdownText.value = ''
    return
  }
  loadingPreview.value = true
  try {
    markdownText.value = await window.api.exportMarkdownPreview(id)
  } catch (e: unknown) {
    message.error('预览失败: ' + String(e))
    markdownText.value = ''
  } finally {
    loadingPreview.value = false
  }
})

async function handleExportMarkdown() {
  if (!selectedId.value) return
  exporting.value = true
  try {
    const path = await window.api.exportMarkdown(selectedId.value)
    message.success(`已导出到: ${path}`)
  } catch (e: unknown) {
    message.error(String(e))
  } finally {
    exporting.value = false
  }
}

async function handleExportPdf() {
  if (!selectedId.value) return
  exporting.value = true
  try {
    const path = await window.api.exportPdf(selectedId.value)
    message.success(`已导出到: ${path}`)
  } catch (e: unknown) {
    message.error(String(e))
  } finally {
    exporting.value = false
  }
}

async function handleBatchExport() {
  batchExporting.value = true
  try {
    const paths: string[] = []
    for (const p of practiceStore.practices) {
      const path = await window.api.exportMarkdown(p.id)
      paths.push(path)
    }
    message.success(`已导出 ${paths.length} 个文件到 exports/ 目录`)
  } catch (e: unknown) {
    message.error('批量导出失败: ' + String(e))
  } finally {
    batchExporting.value = false
  }
}
</script>

<template>
  <div>
    <h2 style="margin-bottom: 24px">导出</h2>

    <NCard>
      <NSpace vertical :size="16">
        <NSelect
          v-model:value="selectedId"
          :options="options"
          placeholder="选择要导出的实践"
          clearable
        />
        <NSpace>
          <NButton type="primary" :disabled="!selectedId" :loading="exporting" @click="handleExportMarkdown">
            导出 Markdown
          </NButton>
          <NButton :disabled="!selectedId" :loading="exporting" @click="handleExportPdf">
            导出 PDF
          </NButton>
          <NButton :disabled="practiceStore.practices.length === 0" :loading="batchExporting" @click="handleBatchExport">
            批量导出全部
          </NButton>
        </NSpace>
      </NSpace>
    </NCard>

    <NSpin v-if="loadingPreview" style="margin-top: 24px; display: flex; justify-content: center;" />

    <NCard v-else-if="selectedId && renderedHtml" title="预览" style="margin-top: 16px">
      <NTabs type="line" animated>
        <NTabPane name="rendered" tab="渲染预览">
          <div class="markdown-preview" v-html="renderedHtml" />
        </NTabPane>
        <NTabPane name="source" tab="Markdown 源码">
          <pre style="white-space: pre-wrap; font-size: 13px; line-height: 1.6;">{{ markdownText }}</pre>
        </NTabPane>
      </NTabs>
    </NCard>

    <NEmpty v-if="!selectedId" description="选择一个实践记录以预览和导出" style="margin-top: 48px" />
  </div>
</template>

<style scoped>
.markdown-preview {
  font-size: 14px;
  line-height: 1.8;
  color: inherit;
}
.markdown-preview :deep(h1) {
  font-size: 24px;
  border-bottom: 2px solid var(--n-border-color, #eee);
  padding-bottom: 8px;
  margin-bottom: 16px;
}
.markdown-preview :deep(h2) {
  font-size: 20px;
  margin-top: 24px;
  margin-bottom: 12px;
}
.markdown-preview :deep(h3) {
  font-size: 16px;
  margin-top: 16px;
  margin-bottom: 8px;
}
.markdown-preview :deep(hr) {
  border: none;
  border-top: 1px solid var(--n-border-color, #eee);
  margin: 16px 0;
}
.markdown-preview :deep(blockquote) {
  border-left: 3px solid var(--n-color-success, #18a058);
  margin: 8px 0;
  padding: 4px 12px;
  color: var(--n-text-color-2, #666);
}
.markdown-preview :deep(ul), .markdown-preview :deep(ol) {
  padding-left: 24px;
}
.markdown-preview :deep(li) {
  margin: 4px 0;
}
</style>
