<script setup lang="ts">
import { onMounted, ref, computed, watch } from 'vue'
import { NCard, NCalendar, NBadge } from 'naive-ui'
import { useLogStore } from '../../stores/log'
import { timestampToLocalDate, localDateToTimestamp } from '../../utils/date'

const props = defineProps<{ practiceId: number; selectedDate: string }>()
const emit = defineEmits<{ (e: 'select', date: string): void }>()
const logStore = useLogStore()

onMounted(() => logStore.fetch(props.practiceId))

watch(() => props.practiceId, (id) => logStore.fetch(id))

const calendarValue = computed(() => localDateToTimestamp(props.selectedDate))

const logDates = computed(() => {
  const set = new Set<string>()
  for (const log of logStore.logs) {
    set.add(log.date)
  }
  return set
})

function isLogDate(timestamp: number): boolean {
  return logDates.value.has(timestampToLocalDate(timestamp))
}

function handleUpdateValue(timestamp: number) {
  emit('select', timestampToLocalDate(timestamp))
}
</script>

<template>
  <NCard size="small" style="margin-bottom: 16px">
    <NCalendar :value="calendarValue" #default="{ year, month, date }" @update:value="handleUpdateValue">
      <NBadge v-if="isLogDate(new Date(year, month - 1, date).getTime())" dot processing type="success" />
    </NCalendar>
  </NCard>
</template>
