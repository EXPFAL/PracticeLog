<script setup lang="ts">
import { ref, watch, computed, onMounted, onUnmounted } from 'vue'
import { NCard, NForm, NFormItem, NInput, NButton, NSpace, NList, NListItem, NTag, NSelect, NPopconfirm, NCollapse, NCollapseItem, useMessage, useDialog } from 'naive-ui'
import { MdEditor } from 'md-editor-v3'
import 'md-editor-v3/lib/style.css'
import { useLogStore } from '../../stores/log'

const props = defineProps<{
  practiceId: number
  date: string
}>()
const emit = defineEmits<{ (e: 'selectDate', date: string): void }>()
const logStore = useLogStore()
const message = useMessage()
const dialog = useDialog()

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
const useMarkdown = ref(false)
const showAllLogs = ref(false)
const extraExpanded = ref<string[]>([])

const formHasContent = computed(() =>
  !!(form.value.what_done.trim() || form.value.problems.trim() || form.value.solutions.trim() || form.value.reflection.trim())
)

function applyTemplate(val: string) {
  const tpl = templates.find(t => t.value === val)
  if (!tpl || tpl.value === 'blank') return

  const apply = () => {
    form.value.what_done = tpl.what_done
    form.value.problems = tpl.problems
    form.value.solutions = tpl.solutions
    form.value.reflection = tpl.reflection
    extraExpanded.value = ['extra']
  }

  if (formHasContent.value) {
    dialog.warning({
      title: '套用模板会覆盖当前内容',
      content: '当前已填写的日志会被模板替换。',
      positiveText: '覆盖',
      negativeText: '取消',
      onPositiveClick: apply,
      onNegativeClick: () => { selectedTemplate.value = 'blank' }
    })
    return
  }
  apply()
}

const isEditing = computed(() => logStore.logs.some(l => l.date === props.date))

function handleKeydown(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault()
    handleSave()
  }
}
onMounted(() => window.addEventListener('keydown', handleKeydown))
onUnmounted(() => window.removeEventListener('keydown', handleKeydown))

function loadFormForDate(dateStr: string) {
  const existing = logStore.logs.find(l => l.date === dateStr)
  if (existing) {
    form.value.what_done = existing.what_done ?? ''
    form.value.problems = existing.problems ?? ''
    form.value.solutions = existing.solutions ?? ''
    form.value.reflection = existing.reflection ?? ''
    extraExpanded.value = (existing.problems || existing.solutions || existing.reflection) ? ['extra'] : []
  } else {
    form.value = { what_done: '', problems: '', solutions: '', reflection: '' }
    selectedTemplate.value = 'blank'
    extraExpanded.value = []
  }
}

watch(() => props.date, (dateStr) => {
  loadFormForDate(dateStr)
}, { immediate: true })

watch(() => logStore.logs, () => {
  loadFormForDate(props.date)
})

async function handleDeleteLog(id: number) {
  await logStore.remove(id, props.practiceId)
  message.success('日志已删除')
}

async function handleSave() {
  if (!form.value.what_done.trim() && !form.value.problems.trim()) {
    message.warning('请至少填写「做了什么」或「遇到的问题」')
    return
  }
  await logStore.create({
    practice_id: props.practiceId,
    date: props.date,
    ...form.value
  })
  message.success('日志已保存')
}
</script>

<template>
  <NCard title="今日日志" size="small">
    <template #header-extra>
      <NSpace align="center" :size="8">
        <span style="font-size: 13px; color: var(--n-text-color-2)">{{ date }}</span>
        <NTag v-if="isEditing" type="warning" size="small">编辑已有日志</NTag>
        <NTag v-else type="info" size="small">还未写</NTag>
      </NSpace>
    </template>
    <NForm label-placement="top">
      <NSpace>
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
        <MdEditor v-if="useMarkdown" v-model="form.what_done" :preview="false" style="width: 100%;" />
        <NInput v-else v-model:value="form.what_done" type="textarea" :rows="3" placeholder="写一句今天做了什么…" />
      </NFormItem>

      <NCollapse v-model:expanded-names="extraExpanded">
        <NCollapseItem title="问题 / 解决 / 反思（可选）" name="extra">
          <NFormItem label="遇到什么问题">
            <NInput v-model:value="form.problems" type="textarea" :rows="2" placeholder="报错、不理解的概念..." />
          </NFormItem>
          <NFormItem label="怎么解决的">
            <NInput v-model:value="form.solutions" type="textarea" :rows="2" placeholder="搜索、问人、文档..." />
          </NFormItem>
          <NFormItem label="今日反思">
            <MdEditor v-if="useMarkdown" v-model="form.reflection" :preview="false" style="width: 100%;" />
            <NInput v-else v-model:value="form.reflection" type="textarea" :rows="2" placeholder="学到了什么、明天计划..." />
          </NFormItem>
        </NCollapseItem>
      </NCollapse>

      <NFormItem style="margin-top: 12px">
        <NButton type="primary" @click="handleSave">保存日志 (Ctrl+S)</NButton>
      </NFormItem>
    </NForm>

    <NList v-if="logStore.logs.length > 0" bordered style="margin-top: 16px">
      <NListItem v-for="log in logStore.logs.slice(0, showAllLogs ? undefined : 10)" :key="log.id">
        <NSpace justify="space-between" align="center">
          <NTag type="info" size="small" style="cursor: pointer" @click="$emit('selectDate', log.date)">{{ log.date }}</NTag>
          <NPopconfirm @positive-click="handleDeleteLog(log.id)">
            <template #trigger>
              <NButton size="tiny" type="error" quaternary>删除</NButton>
            </template>
            确认删除 {{ log.date }} 的日志？
          </NPopconfirm>
        </NSpace>
        <div v-if="log.what_done" style="margin-top: 4px; font-size: 13px">{{ log.what_done }}</div>
        <div v-if="log.problems" style="margin-top: 2px; font-size: 12px; color: var(--n-color-error, #e88)">❓ {{ log.problems }}</div>
      </NListItem>
      <NListItem v-if="logStore.logs.length > 10 && !showAllLogs">
        <NButton quaternary size="small" @click="showAllLogs = true">
          显示全部 {{ logStore.logs.length }} 条日志
        </NButton>
      </NListItem>
    </NList>
  </NCard>
</template>
