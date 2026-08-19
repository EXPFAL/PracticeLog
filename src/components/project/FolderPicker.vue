<script setup lang="ts">
import { NSpace, NInput, NButton } from 'naive-ui'

const props = defineProps<{ modelValue: string }>()
const emit = defineEmits<{ (e: 'update:modelValue', value: string): void }>()

async function handleBrowse() {
  const path = await window.api.openFolder()
  if (path) {
    emit('update:modelValue', path)
  }
}
</script>

<template>
  <NSpace>
    <NInput
      :value="props.modelValue"
      placeholder="选择项目文件夹路径"
      style="width: 400px"
      @update:value="(v: string) => emit('update:modelValue', v)"
    />
    <NButton @click="handleBrowse">浏览...</NButton>
  </NSpace>
</template>
