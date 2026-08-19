<script setup lang="ts">
import { NCard, NTag, NButton, NSpace } from 'naive-ui'
import type { DailyLog } from '../../types'

defineProps<{ log: DailyLog }>()
defineEmits<{ (e: 'click', log: DailyLog): void }>()
</script>

<template>
  <NCard size="small" hoverable style="cursor: pointer" @click="$emit('click', log)">
    <NSpace justify="space-between" align="center">
      <div>
        <NTag type="warning" size="small">{{ log.date }}</NTag>
        <div style="margin-top: 4px; font-size: 13px">{{ log.problems }}</div>
      </div>
      <NButton v-if="log.solutions" size="tiny" quaternary>已解决</NButton>
      <NTag v-else size="tiny" type="error">待解决</NTag>
    </NSpace>
  </NCard>
</template>
