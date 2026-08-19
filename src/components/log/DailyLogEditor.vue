<script setup lang="ts">
import { ref, watch } from 'vue'
import { NCard, NDatePicker, NForm, NFormItem, NInput, NButton, NSpace, NList, NListItem, NTag, NSelect, NPopconfirm, useMessage } from 'naive-ui'
import { MdEditor } from 'md-editor-v3'
import 'md-editor-v3/lib/style.css'
import { useLogStore } from '../../stores/log'

const props = defineProps<{
  practiceId: number
  externalDate?: string | null
}>()
const logStore = useLogStore()
const message = useMessage()

const selectedDate = ref<number>(Date.now())
const form = ref({
  what_done: '',
  problems: '',
  solutions: '',
  reflection: ''
})

const templates = [
  { label: '空白', value: 'blank', what_done: '', problems: '', solutions: '', reflection: '' },
  {
    label: '技术日', value: 'tech',
    what_done: '## 今天完成了\n\n- \n- ',
    problems: '遇到的问题：\n- ',
    solutions: '解决方案：\n- ',
    reflection: '## 技术收获\n\n\n## 明天计划\n\n'
  },
  {
    label: '学习日', value: 'learn',
    what_done: '## 学习内容\n\n- 概念：\n- 实践：',
    problems: '不理解的地方：\n- ',
    solutions: '查阅资料后理解：\n- ',
    reflection: '## 核心收获\n\n\n## 还需深入\n\n'
  },
  {
    label: '复盘日', value: 'review',
    what_done: '## 本周完成\n\n- \n- ',
    problems: '卡住的地方：\n- ',
    solutions: '如何突破：\n- ',
    reflection: '## 整体感受\n\n\n## 下周目标\n\n'
  }
]

const selectedTemplate = ref('blank')
const useMarkdown = ref(true)
const showAllLogs = ref(false)

function applyTemplate(val: string) {
  const tpl = templates.find(t => t.value === val)
  if (tpl && tpl.value !== 'blank') {
    form.value.what_done = tpl.what_done
    form.value.problems = tpl.problems
    form.value.solutions = tpl.solutions
    form.value.reflection = tpl.reflection
  }
}

function formatDate(ts: number): string {
  return new Date(ts).toISOString().slice(0, 10)
}

function parseDate(dateStr: string): number {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).getTime()
}

function loadFormForDate(dateStr: string) {
  const existing = logStore.logs.find(l => l.date === dateStr)
  if (existing) {
    form.value.what_done = existing.what_done ?? ''
    form.value.problems = existing.problems ?? ''
    form.value.solutions = existing.solutions ?? ''
    form.value.reflection = existing.reflection ?? ''
  } else {
    form.value = { what_done: '', problems: '', solutions: '', reflection: '' }
    selectedTemplate.value = 'blank'
  }
}

watch(selectedDate, () => {
  loadFormForDate(formatDate(selectedDate.value))
}, { immediate: true })

watch(() => props.externalDate, (newDate) => {
  if (newDate) {
    selectedDate.value = parseDate(newDate)
  }
})

async function handleDeleteLog(id: number) {
  await logStore.remove(id)
  message.success('日志已删除')
}

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
      <NSpace>
        <NFormItem label="日期">
          <NDatePicker v-model:value="selectedDate" type="date" style="width: 200px" />
        </NFormItem>
        <NFormItem label="模板">
          <NSelect
            v-model:value="selectedTemplate"
            :options="templates.map(t => ({ label: t.label, value: t.value }))"
            style="width: 140px"
            @update:value="applyTemplate"
          />
        </NFormItem>
        <NFormItem label="编辑模式">
          <NButton size="small" @click="useMarkdown = !useMarkdown">
            {{ useMarkdown ? 'Markdown' : '纯文本' }}
          </NButton>
        </NFormItem>
      </NSpace>

      <NFormItem label="今天做了什么">
        <MdEditor v-if="useMarkdown" v-model="form.what_done" :preview="true" style="width: 100%;" />
        <NInput v-else v-model:value="form.what_done" type="textarea" :rows="3" placeholder="完成的工作、学习的内容..." />
      </NFormItem>
      <NFormItem label="遇到什么问题">
        <NInput v-model:value="form.problems" type="textarea" :rows="2" placeholder="报错、不理解的概念..." />
      </NFormItem>
      <NFormItem label="怎么解决的">
        <NInput v-model:value="form.solutions" type="textarea" :rows="2" placeholder="搜索、问人、文档..." />
      </NFormItem>
      <NFormItem label="今日反思">
        <MdEditor v-if="useMarkdown" v-model="form.reflection" :preview="true" style="width: 100%;" />
        <NInput v-else v-model:value="form.reflection" type="textarea" :rows="2" placeholder="学到了什么、明天计划..." />
      </NFormItem>
      <NFormItem>
        <NButton type="primary" @click="handleSave">保存日志 (Ctrl+S)</NButton>
      </NFormItem>
    </NForm>

    <NList v-if="logStore.logs.length > 0" bordered style="margin-top: 16px">
      <NListItem v-for="log in logStore.logs.slice(0, showAllLogs ? undefined : 10)" :key="log.id">
        <NSpace justify="space-between" align="center">
          <NTag type="info" size="small" style="cursor: pointer" @click="selectedDate = parseDate(log.date)">{{ log.date }}</NTag>
          <NPopconfirm @positive-click="handleDeleteLog(log.id)">
            <template #trigger>
              <NButton size="tiny" type="error" quaternary>删除</NButton>
            </template>
            确认删除 {{ log.date }} 的日志？
          </NPopconfirm>
        </NSpace>
        <div v-if="log.what_done" style="margin-top: 4px; font-size: 13px">{{ log.what_done }}</div>
        <div v-if="log.problems" style="margin-top: 2px; font-size: 12px; color: #e88">❓ {{ log.problems }}</div>
      </NListItem>
      <NListItem v-if="logStore.logs.length > 10 && !showAllLogs">
        <NButton quaternary size="small" @click="showAllLogs = true">
          显示全部 {{ logStore.logs.length }} 条日志
        </NButton>
      </NListItem>
    </NList>
  </NCard>
</template>
