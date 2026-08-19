<script setup lang="ts">
import { NCard, NTag, NSpace, NButton, NPopconfirm, NDivider } from 'naive-ui'
import type { ProjectArchive } from '../../types'

defineProps<{ project: ProjectArchive }>()
defineEmits<{
  (e: 'edit', project: ProjectArchive): void
  (e: 'delete', id: number): void
}>()
</script>

<template>
  <NCard :title="project.name" size="small" style="margin-bottom: 16px">
    <template #header-extra>
      <NSpace :size="4">
        <NTag v-if="project.ai_generated" size="tiny" type="warning">AI 生成</NTag>
        <NButton size="tiny" type="primary" quaternary @click="$emit('edit', project)">编辑</NButton>
        <NPopconfirm @positive-click="$emit('delete', project.id)">
          <template #trigger>
            <NButton size="tiny" type="error" quaternary>删除</NButton>
          </template>
          确认删除？
        </NPopconfirm>
      </NSpace>
    </template>

    <NSpace vertical :size="8">
      <div v-if="project.summary" style="font-size: 14px">{{ project.summary }}</div>
      <div v-if="project.tech_stack" style="font-size: 13px; color: var(--n-text-color-2, #666)">🛠 {{ project.tech_stack }}</div>
      <div v-if="project.role" style="font-size: 13px; color: var(--n-text-color-2, #666)">👤 {{ project.role }}</div>
      <div v-if="project.real_involvement" style="font-size: 13px; color: var(--n-color-warning, #fa8c16)">📊 {{ project.real_involvement }}</div>

      <NDivider v-if="project.problems_solved || project.lessons || project.unknowns" style="margin: 8px 0" />

      <div v-if="project.problems_solved" style="font-size: 13px">
        <strong>解决的问题:</strong> {{ project.problems_solved }}
      </div>
      <div v-if="project.lessons" style="font-size: 13px">
        <strong>学到的:</strong> {{ project.lessons }}
      </div>
      <div v-if="project.unknowns" style="font-size: 13px; color: var(--n-color-error, #f5222d)">
        <strong>还不懂的:</strong> {{ project.unknowns }}
      </div>
      <div v-if="project.interview_script" style="font-size: 13px; background: var(--n-color, #f6f6f6); padding: 8px; border-radius: 4px; border: 1px solid var(--n-border-color, #eee)">
        <strong>面试话术:</strong><br>{{ project.interview_script }}
      </div>
    </NSpace>
  </NCard>
</template>
