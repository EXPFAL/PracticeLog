<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { NCard, NCalendar, NBadge } from 'naive-ui'
import { useLogStore } from '../../stores/log'

const props = defineProps<{ practiceId: number }>()
const emit = defineEmits<{ (e: 'select', date: string): void }>()
const logStore = useLogStore()

onMounted(() => logStore.fetch(props.practiceId))

const logDates = computed(() => {
  const set = new Set<string>()
  for (const log of logStore.logs) {
    set.add(log.date)
  }
  return set
})

function isLogDate(timestamp: number): boolean {
  const date = new Date(timestamp).toISOString().slice(0, 10)
  return logDates.value.has(date)
}

function handleUpdateValue(timestamp: number) {
  const date = new Date(timestamp).toISOString().slice(0, 10)
  emit('select', date)
}
</script>

<template>
  <NCard size="small" style="margin-bottom: 16px">
    <NCalendar #default="{ year, month, date }" @update:value="handleUpdateValue">
      <NBadge v-if="isLogDate(new Date(year, month - 1, date).getTime())" dot processing type="success" />
    </NCalendar>
  </NCard>
</template>
