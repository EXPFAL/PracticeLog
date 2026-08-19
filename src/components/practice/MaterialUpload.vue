<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { NCard, NList, NListItem, NButton, NInput, NTag, NSpace, NPopconfirm, NDivider, useMessage } from 'naive-ui'
import type { Material } from '../../types'

const props = defineProps<{ practiceId: number }>()
const message = useMessage()
const materials = ref<Material[]>([])
const urlInput = ref('')
const adding = ref(false)
const dragging = ref(false)

onMounted(refresh)

async function refresh() {
  materials.value = await window.api.materialList(props.practiceId)
}

async function handleAddUrl() {
  if (!urlInput.value.trim()) return
  adding.value = true
  try {
    const url = urlInput.value.trim()
    const isGithub = url.includes('github.com')
    const id = await window.api.materialAdd({
      practice_id: props.practiceId,
      name: url.split('/').pop() || url,
      type: isGithub ? 'github' : 'url',
      path_or_url: url
    })
    urlInput.value = ''
    await refresh()
    message.success('添加成功')
  } catch (e: unknown) {
    message.error(String(e))
  } finally {
    adding.value = false
  }
}

async function handleFileSelect() {
  const paths = await window.api.openFile()
  if (!paths) return
  await addFiles(paths)
}

async function addFiles(paths: string[]) {
  adding.value = true
  try {
    for (const filePath of paths) {
      const name = filePath.split(/[/\\]/).pop() || filePath
      const ext = name.split('.').pop()?.toLowerCase()
      const isSupported = ['pdf', 'txt', 'md', 'rst', 'log', 'csv'].includes(ext ?? '')

      const id = await window.api.materialAdd({
        practice_id: props.practiceId,
        name,
        type: 'file',
        path_or_url: filePath
      })

      if (isSupported) {
        try {
          await window.api.materialExtract(id, filePath)
        } catch (extractErr) {
          console.warn('文本提取失败:', extractErr)
        }
      }
    }
    await refresh()
    message.success(`已添加 ${paths.length} 个文件`)
  } catch (e: unknown) {
    message.error(String(e))
  } finally {
    adding.value = false
  }
}

function handleDragOver(e: DragEvent) {
  e.preventDefault()
  e.stopPropagation()
  dragging.value = true
}

function handleDragLeave(e: DragEvent) {
  e.preventDefault()
  e.stopPropagation()
  dragging.value = false
}

function handleDrop(e: DragEvent) {
  e.preventDefault()
  e.stopPropagation()
  dragging.value = false

  const files = e.dataTransfer?.files
  if (!files || files.length === 0) return

  // Electron 中 file.path 是本地路径
  const paths: string[] = []
  for (let i = 0; i < files.length; i++) {
    const file = files[i] as File & { path?: string }
    if (file.path) paths.push(file.path)
  }
  if (paths.length > 0) addFiles(paths)
}

async function handleExtract(mat: Material) {
  try {
    await window.api.materialExtract(mat.id, mat.path_or_url)
    await refresh()
    message.success('文本提取完成')
  } catch (e: unknown) {
    message.error(String(e))
  }
}

async function handleDelete(id: number) {
  await window.api.materialDelete(id)
  await refresh()
  message.success('已删除')
}
</script>

<template>
  <NDivider />
  <NCard title="资料管理" size="small">
    <NSpace vertical :size="12">
      <!-- 拖拽区域 -->
      <div
        :class="['drop-zone', { 'drop-zone--active': dragging }]"
        @dragover="handleDragOver"
        @dragleave="handleDragLeave"
        @drop="handleDrop"
      >
        <div class="drop-zone__content">
          <div style="font-size: 24px; margin-bottom: 8px">📄</div>
          <div style="font-size: 14px; color: var(--n-text-color-2)">拖拽文件到这里上传</div>
          <div style="font-size: 12px; color: var(--n-text-color-3); margin-top: 4px">支持 PDF / TXT / MD 等文档</div>
        </div>
      </div>

      <!-- URL 输入 + 按钮 -->
      <NSpace>
        <NInput v-model:value="urlInput" placeholder="输入 URL 或 GitHub 仓库地址" style="width: 340px" @keyup.enter="handleAddUrl" />
        <NButton type="primary" :loading="adding" @click="handleAddUrl">添加链接</NButton>
        <NButton :loading="adding" @click="handleFileSelect">选择文件</NButton>
      </NSpace>

      <!-- 资料列表 -->
      <NList v-if="materials.length > 0" bordered>
        <NListItem v-for="mat in materials" :key="mat.id">
          <NSpace align="center" justify="space-between" style="width: 100%">
            <div>
              <strong>{{ mat.name }}</strong>
              <NTag size="small" :type="mat.type === 'github' ? 'success' : mat.type === 'url' ? 'info' : 'default'" style="margin-left: 8px">
                {{ mat.type }}
              </NTag>
              <div style="font-size: 12px; color: #999; margin-top: 4px">{{ mat.path_or_url }}</div>
              <div v-if="mat.extracted_text" style="font-size: 12px; color: #52c41a; margin-top: 2px">
                ✓ 已提取文本 ({{ mat.extracted_text.length }} 字符)
              </div>
            </div>
            <NSpace>
              <NButton v-if="mat.type === 'file' && !mat.extracted_text" size="small" @click="handleExtract(mat)">
                提取文本
              </NButton>
              <NPopconfirm @positive-click="handleDelete(mat.id)">
                <template #trigger>
                  <NButton size="small" type="error" quaternary>删除</NButton>
                </template>
                确认删除？
              </NPopconfirm>
            </NSpace>
          </NSpace>
        </NListItem>
      </NList>
    </NSpace>
  </NCard>
</template>

<style scoped>
.drop-zone {
  border: 2px dashed var(--n-border-color, #d9d9d9);
  border-radius: 8px;
  padding: 24px;
  text-align: center;
  transition: all 0.2s;
  cursor: pointer;
}
.drop-zone:hover,
.drop-zone--active {
  border-color: #18a058;
  background: #f0faf5;
}
.drop-zone__content {
  pointer-events: none;
}
</style>
