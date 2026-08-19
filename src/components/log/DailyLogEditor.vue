<script setup lang="ts">
import { ref, watch } from 'vue'
import { NCard, NDatePicker, NForm, NFormItem, NInput, NButton, NSpace, NList, NListItem, NTag, useMessage } from 'naive-ui'
import { useLogStore } from '../../stores/log'

const props = defineProps<{ practiceId: number }>()
const logStore = useLogStore()
const message = useMessage()

const selectedDate = ref<number>(Date.now())
const form = ref({
  what_done: '',
  problems: '',
  solutions: '',
  reflection: ''
})

function formatDate(ts: number): string {
  return new Date(ts).toISOString().slice(0, 10)
}

watch(selectedDate, () => {
  const dateStr = formatDate(selectedDate.value)
  const existing = logStore.logs.find(l => l.date === dateStr)
  if (existing) {
    form.value.what_done = existing.what_done ?? ''
    form.value.problems = existing.problems ?? ''
    form.value.solutions = existing.solutions ?? ''
    form.value.reflection = existing.reflection ?? ''
  } else {
    form.value = { what_done: '', problems: '', solutions: '', reflection: '' }
  }
}, { immediate: true })

async function handleSave() {
  if (!form.value.what_done.trim() && !form.value.problems.trim()) {
    message.warning('请至少填写「做了什么」或「遇到的问题」')
    return
  }
  await logStore.create({
    practice_id: props.practiceId,
    date: formatDate(selectedDate.value),
    ...form.value
  })
  message.success('日志已保存')
}
</script>

<template>
  <NCard title="日志编辑器" size="small">
    <NForm label-placement="top">
      <NFormItem label="日期">
        <NDatePicker v-model:value="selectedDate" type="date" style="width: 200px" />
      </NFormItem>
      <NFormItem label="今天做了什么">
        <NInput v-model:value="form.what_done" type="textarea" :rows="3" placeholder="完成的工作、学习的内容..." />
      </NFormItem>
      <NFormItem label="遇到什么问题">
        <NInput v-model:value="form.problems" type="textarea" :rows="2" placeholder="报错、不理解的概念..." />
      </NFormItem>
      <NFormItem label="怎么解决的">
        <NInput v-model:value="form.solutions" type="textarea" :rows="2" placeholder="搜索、问人、文档..." />
      </NFormItem>
      <NFormItem label="今日反思">
        <NInput v-model:value="form.reflection" type="textarea" :rows="2" placeholder="学到了什么、明天计划..." />
      </NFormItem>
      <NFormItem>
        <NButton type="primary" @click="handleSave">保存日志</NButton>
      </NFormItem>
    </NForm>

    <NList v-if="logStore.logs.length > 0" bordered style="margin-top: 16px">
      <NListItem v-for="log in logStore.logs.slice(0, 10)" :key="log.id">
        <NSpace justify="space-between">
          <NTag type="info" size="small">{{ log.date }}</NTag>
        </NSpace>
        <div v-if="log.what_done" style="margin-top: 4px; font-size: 13px">{{ log.what_done }}</div>
        <div v-if="log.problems" style="margin-top: 2px; font-size: 12px; color: #e88">❓ {{ log.problems }}</div>
      </NListItem>
    </NList>
  </NCard>
</template>
