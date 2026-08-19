<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { NForm, NFormItem, NInput, NDatePicker, NButton, NSpace, useMessage } from 'naive-ui'
import { usePracticeStore } from '../../stores/practice'

const props = defineProps<{ practiceId: number }>()
const practiceStore = usePracticeStore()
const message = useMessage()

const form = ref({
  title: '',
  start_date: null as number | null,
  end_date: null as number | null,
  location: '',
  advisor: '',
  direction_tags: '',
  notes: ''
})

onMounted(() => {
  if (practiceStore.current) {
    form.value.title = practiceStore.current.title
    form.value.start_date = practiceStore.current.start_date ? new Date(practiceStore.current.start_date).getTime() : null
    form.value.end_date = practiceStore.current.end_date ? new Date(practiceStore.current.end_date).getTime() : null
    form.value.location = practiceStore.current.location ?? ''
    form.value.advisor = practiceStore.current.advisor ?? ''
    form.value.notes = practiceStore.current.notes ?? ''
    try {
      const tags = practiceStore.current.direction_tags ? JSON.parse(practiceStore.current.direction_tags) : []
      form.value.direction_tags = tags.join(', ')
    } catch { form.value.direction_tags = '' }
  }
})

function formatDate(ts: number | null): string | null {
  return ts ? new Date(ts).toISOString().slice(0, 10) : null
}

async function handleSave() {
  const tags = form.value.direction_tags
    ? JSON.stringify(form.value.direction_tags.split(/[,，、]/).map(s => s.trim()).filter(Boolean))
    : null

  await practiceStore.update(props.practiceId, {
    title: form.value.title,
    start_date: formatDate(form.value.start_date),
    end_date: formatDate(form.value.end_date),
    location: form.value.location || null,
    advisor: form.value.advisor || null,
    direction_tags: tags,
    notes: form.value.notes || null
  })
  message.success('保存成功')
}
</script>

<template>
  <NForm label-placement="top" style="max-width: 600px">
    <NFormItem label="标题">
      <NInput v-model:value="form.title" />
    </NFormItem>
    <NSpace>
      <NFormItem label="开始日期">
        <NDatePicker v-model:value="form.start_date" type="date" clearable />
      </NFormItem>
      <NFormItem label="结束日期">
        <NDatePicker v-model:value="form.end_date" type="date" clearable />
      </NFormItem>
    </NSpace>
    <NFormItem label="地点">
      <NInput v-model:value="form.location" />
    </NFormItem>
    <NFormItem label="指导老师">
      <NInput v-model:value="form.advisor" />
    </NFormItem>
    <NFormItem label="方向标签（逗号分隔）">
      <NInput v-model:value="form.direction_tags" />
    </NFormItem>
    <NFormItem label="备注">
      <NInput v-model:value="form.notes" type="textarea" :rows="3" />
    </NFormItem>
    <NFormItem>
      <NButton type="primary" @click="handleSave">保存</NButton>
    </NFormItem>
  </NForm>
</template>
