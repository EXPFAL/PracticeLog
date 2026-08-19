<script setup lang="ts">
import { ref } from 'vue'
import { NSpace, NTag, NButton, NSelect, NInput, NPopconfirm, useMessage } from 'naive-ui'
import { useKnowledgeStore } from '../../stores/knowledge'
import type { KnowledgeItem } from '../../types'

const props = defineProps<{ item: KnowledgeItem; practiceId: number }>()
const knowledgeStore = useKnowledgeStore()
const message = useMessage()
const editing = ref(false)
const editNote = ref(props.item.note ?? '')

const statusOptions = [
  { label: '⬜ 未学', value: '未学' },
  { label: '🔄 学习中', value: '学习中' },
  { label: '✅ 已掌握', value: '已掌握' }
]

async function handleStatusChange(status: string) {
  await knowledgeStore.update(props.item.id, { status: status as KnowledgeItem['status'] })
}

async function handleSaveNote() {
  await knowledgeStore.update(props.item.id, { note: editNote.value || null, ai_generated: 0 })
  editing.value = false
  message.success('笔记已保存')
}

async function handleDelete() {
  await knowledgeStore.remove(props.item.id, props.practiceId)
  message.success('已删除')
}
</script>

<template>
  <div style="padding: 8px 0; border-bottom: 1px solid #f0f0f0">
    <NSpace justify="space-between" align="flex-start">
      <div style="flex: 1">
        <NSpace align="center" :size="8">
          <strong>{{ item.concept }}</strong>
          <NTag v-if="item.ai_generated" size="tiny" type="warning">AI</NTag>
        </NSpace>
        <div v-if="item.one_line_explain" style="font-size: 13px; color: #666; margin-top: 4px">
          {{ item.one_line_explain }}
        </div>
        <div v-if="item.resource" style="font-size: 12px; color: #999; margin-top: 2px">
          📚 {{ item.resource }}
        </div>
        <div v-if="editing" style="margin-top: 8px">
          <NInput v-model:value="editNote" type="textarea" :rows="2" placeholder="写点笔记..." />
          <NSpace style="margin-top: 4px">
            <NButton size="tiny" type="primary" @click="handleSaveNote">保存</NButton>
            <NButton size="tiny" @click="editing = false">取消</NButton>
          </NSpace>
        </div>
        <div v-else-if="item.note" style="font-size: 12px; color: #1890ff; margin-top: 4px; cursor: pointer" @click="editing = true">
          📝 {{ item.note }}
        </div>
      </div>
      <NSpace :size="4">
        <NSelect
          :value="item.status"
          :options="statusOptions"
          size="tiny"
          style="width: 110px"
          @update:value="handleStatusChange"
        />
        <NButton v-if="!editing && !item.note" size="tiny" quaternary @click="editing = true">笔记</NButton>
        <NPopconfirm @positive-click="handleDelete">
          <template #trigger>
            <NButton size="tiny" type="error" quaternary>删</NButton>
          </template>
          确认删除？
        </NPopconfirm>
      </NSpace>
    </NSpace>
  </div>
</template>
