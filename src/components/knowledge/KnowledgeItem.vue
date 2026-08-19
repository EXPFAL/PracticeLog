<script setup lang="ts">
import { ref } from 'vue'
import { NSpace, NTag, NButton, NSelect, NInput, NPopconfirm, NDrawer, NDrawerContent, NForm, NFormItem, useMessage } from 'naive-ui'
import { useKnowledgeStore } from '../../stores/knowledge'
import type { KnowledgeItem } from '../../types'

const props = defineProps<{ item: KnowledgeItem; practiceId: number }>()
const knowledgeStore = useKnowledgeStore()
const message = useMessage()
const editingNote = ref(false)
const editNote = ref(props.item.note ?? '')
const showEditDrawer = ref(false)
const saving = ref(false)

const editForm = ref({
  concept: props.item.concept,
  one_line_explain: props.item.one_line_explain ?? '',
  importance: props.item.importance ?? '了解' as '必问' | '加分' | '了解',
  resource: props.item.resource ?? '',
  note: props.item.note ?? ''
})

const statusOptions = [
  { label: '⬜ 未学', value: '未学' },
  { label: '🔄 学习中', value: '学习中' },
  { label: '✅ 已掌握', value: '已掌握' }
]

const importanceOptions = [
  { label: '必问', value: '必问' },
  { label: '加分', value: '加分' },
  { label: '了解', value: '了解' }
]

async function handleStatusChange(status: string) {
  await knowledgeStore.update(props.item.id, { status: status as KnowledgeItem['status'] })
}

async function handleSaveNote() {
  await knowledgeStore.update(props.item.id, { note: editNote.value || null, ai_generated: 0 })
  editingNote.value = false
  message.success('笔记已保存')
}

async function handleSaveEdit() {
  saving.value = true
  try {
    await knowledgeStore.update(props.item.id, {
      concept: editForm.value.concept,
      one_line_explain: editForm.value.one_line_explain || null,
      importance: editForm.value.importance,
      resource: editForm.value.resource || null,
      note: editForm.value.note || null,
      ai_generated: 0
    })
    showEditDrawer.value = false
    message.success('已更新')
  } catch (e: unknown) {
    message.error('更新失败: ' + String(e))
  } finally {
    saving.value = false
  }
}

function openEditDrawer() {
  editForm.value = {
    concept: props.item.concept,
    one_line_explain: props.item.one_line_explain ?? '',
    importance: props.item.importance ?? '了解',
    resource: props.item.resource ?? '',
    note: props.item.note ?? ''
  }
  showEditDrawer.value = true
}

async function handleDelete() {
  await knowledgeStore.remove(props.item.id, props.practiceId)
  message.success('已删除')
}
</script>

<template>
  <div style="padding: 8px 0; border-bottom: 1px solid var(--n-border-color, #f0f0f0)">
    <NSpace justify="space-between" align="flex-start">
      <div style="flex: 1; cursor: pointer" role="button" tabindex="0" aria-label="编辑知识点" @click="openEditDrawer" @keydown.enter="openEditDrawer">
        <NSpace align="center" :size="8">
          <strong>{{ item.concept }}</strong>
          <NTag v-if="item.ai_generated" size="tiny" type="warning">AI</NTag>
          <NTag v-if="item.importance" size="tiny" :type="item.importance === '必问' ? 'error' : item.importance === '加分' ? 'warning' : 'default'">
            {{ item.importance }}
          </NTag>
        </NSpace>
        <div v-if="item.one_line_explain" style="font-size: 13px; color: var(--n-text-color-2); margin-top: 4px">
          {{ item.one_line_explain }}
        </div>
        <div v-if="item.resource" style="font-size: 12px; color: var(--n-text-color-3); margin-top: 2px">
          📚 {{ item.resource }}
        </div>
        <div v-if="editingNote" style="margin-top: 8px" @click.stop>
          <NInput v-model:value="editNote" type="textarea" :rows="2" placeholder="写点笔记..." />
          <NSpace style="margin-top: 4px">
            <NButton size="tiny" type="primary" @click="handleSaveNote">保存</NButton>
            <NButton size="tiny" @click="editingNote = false">取消</NButton>
          </NSpace>
        </div>
        <div v-else-if="item.note" style="font-size: 12px; color: var(--n-color-info, #1890ff); margin-top: 4px">
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
        <NButton v-if="!editingNote && !item.note" size="tiny" quaternary @click.stop="editingNote = true">笔记</NButton>
        <NPopconfirm @positive-click="handleDelete">
          <template #trigger>
            <NButton size="tiny" type="error" quaternary @click.stop>删</NButton>
          </template>
          确认删除「{{ item.concept }}」？
        </NPopconfirm>
      </NSpace>
    </NSpace>

    <!-- Full edit drawer -->
    <NDrawer v-model:show="showEditDrawer" :width="400" placement="right">
      <NDrawerContent title="编辑知识点">
        <NForm label-placement="top">
          <NFormItem label="概念名称">
            <NInput v-model:value="editForm.concept" />
          </NFormItem>
          <NFormItem label="一句话解释">
            <NInput v-model:value="editForm.one_line_explain" />
          </NFormItem>
          <NFormItem label="重要性">
            <NSelect v-model:value="editForm.importance" :options="importanceOptions" />
          </NFormItem>
          <NFormItem label="推荐资源">
            <NInput v-model:value="editForm.resource" />
          </NFormItem>
          <NFormItem label="笔记">
            <NInput v-model:value="editForm.note" type="textarea" :rows="4" />
          </NFormItem>
        </NForm>
        <template #footer>
          <NSpace>
            <NButton @click="showEditDrawer = false">取消</NButton>
            <NButton type="primary" :loading="saving" @click="handleSaveEdit">保存</NButton>
          </NSpace>
        </template>
      </NDrawerContent>
    </NDrawer>
  </div>
</template>
