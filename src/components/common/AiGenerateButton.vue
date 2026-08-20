<script setup lang="ts">
import { NButton } from 'naive-ui'

defineProps<{
  label: string
  loading?: boolean
  disabled?: boolean
}>()
defineEmits<{ (e: 'click'): void }>()
</script>

<template>
  <NButton
    type="primary"
    ghost
    :loading="loading"
    :disabled="disabled"
    @click="$emit('click')"
  >
    🤖 {{ label }}
  </NButton>
</template>
