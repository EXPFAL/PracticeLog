<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { NCard, NList, NListItem, NButton, NInput, NTag, NSpace, NPopconfirm, useMessage, NDivider } from 'naive-ui'
import type { Material } from '../../types'

const props = defineProps<{ practiceId: number }>()
const message = useMessage()
const materials = ref<Material[]>([])
const urlInput = ref('')
const adding = ref(false)

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
    await window.api.materialAdd({
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
      <NSpace>
        <NInput v-model:value="urlInput" placeholder="输入 URL 或 GitHub 仓库地址" style="width: 400px" />
        <NButton type="primary" :loading="adding" @click="handleAddUrl">添加链接</NButton>
      </NSpace>

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
