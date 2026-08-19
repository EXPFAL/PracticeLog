<script setup lang="ts">
import { ref, computed } from 'vue'
import { NCard, NCheckbox, NSpace, NButton, NDivider, NTag, useMessage } from 'naive-ui'
import { useKnowledgeStore } from '../../stores/knowledge'
import type { KnowledgeItem } from '../../types'

const props = defineProps<{ items: KnowledgeItem[]; practiceId: number }>()
const knowledgeStore = useKnowledgeStore()
const message = useMessage()

const today = new Date().toISOString().slice(0, 10)
const checked = ref<Set<number>>(new Set())
const confirming = ref(false)

const unmastered = computed(() => props.items.filter(i => i.status !== '已掌握'))

function toggle(id: number) {
  if (checked.value.has(id)) {
    checked.value.delete(id)
  } else {
    checked.value.add(id)
  }
}

async function handleConfirmCheckin() {
  confirming.value = true
  try {
    for (const id of checked.value) {
      const item = props.items.find(i => i.id === id)
      if (item && item.status === '未学') {
        await knowledgeStore.update(id, { status: '学习中' })
      }
    }
    message.success(`已打卡 ${checked.value.size} 项`)
    checked.value.clear()
  } catch (e: unknown) {
    message.error('打卡失败: ' + String(e))
  } finally {
    confirming.value = false
  }
}
</script>

<template>
  <NCard v-if="unmastered.length > 0" title="每日打卡" size="small" style="margin-bottom: 16px">
    <template #header-extra>
      <span style="font-size: 12px; color: var(--n-text-color-3)">{{ today }}</span>
    </template>
    <NSpace vertical :size="4">
      <NCheckbox
        v-for="item in unmastered"
        :key="item.id"
        :checked="checked.has(item.id)"
        :disabled="confirming"
        @update:checked="toggle(item.id)"
      >
        {{ item.concept }}
        <NTag v-if="item.status === '学习中'" size="tiny" type="warning" style="margin-left: 4px">学习中</NTag>
      </NCheckbox>
    </NSpace>
    <NDivider style="margin: 12px 0" />
    <NButton size="small" type="primary" :disabled="checked.size === 0" :loading="confirming" @click="handleConfirmCheckin">
      确认打卡 ({{ checked.size }})
    </NButton>
  </NCard>
</template>
