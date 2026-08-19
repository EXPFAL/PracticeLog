<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { NSelect, NButton, NCard, NCode, NSpace, NEmpty, useMessage } from 'naive-ui'
import { usePracticeStore } from '../stores/practice'

const practiceStore = usePracticeStore()
const message = useMessage()
const selectedId = ref<number | null>(null)
const preview = ref('')
const exporting = ref(false)

onMounted(() => practiceStore.fetchAll())

const options = computed(() =>
  practiceStore.practices.map(p => ({ label: p.title, value: p.id }))
)

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
        </NSpace>
      </NSpace>
    </NCard>

    <NCard v-if="preview" title="预览" style="margin-top: 16px">
      <NCode :code="preview" language="markdown" />
    </NCard>

    <NEmpty v-if="!selectedId" description="选择一个实践记录以导出" style="margin-top: 48px" />
  </div>
</template>
