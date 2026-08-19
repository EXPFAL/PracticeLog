<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import MarkdownIt from 'markdown-it'
import { NButton, NSpace, NCollapse, NCollapseItem, NTag, NEmpty, NSpin, NDrawer, NDrawerContent, NForm, NFormItem, NInput, NSelect, NTabs, NTabPane, useMessage } from 'naive-ui'
import { useKnowledgeStore } from '../../stores/knowledge'
import AiGenerateButton from '../common/AiGenerateButton.vue'
import KnowledgeItem from './KnowledgeItem.vue'
import DailyCheckin from './DailyCheckin.vue'

const props = defineProps<{ practiceId: number }>()
const knowledgeStore = useKnowledgeStore()
const message = useMessage()
const showAdd = ref(false)
const generatingProject = ref(false)
const studyPlanMd = ref('')
const showPlanDrawer = ref(false)

const md = new MarkdownIt({ html: false, linkify: true })
const renderedPlan = computed(() => studyPlanMd.value ? md.render(studyPlanMd.value) : '')

const form = ref({
  concept: '',
  one_line_explain: '',
  importance: '必问' as '必问' | '加分' | '了解',
  resource: ''
})

onMounted(() => knowledgeStore.fetch(props.practiceId))

const grouped = computed(() => {
  const groups: Record<string, typeof knowledgeStore.items> = { '必问': [], '加分': [], '了解': [] }
  for (const item of knowledgeStore.items) {
    const key = item.importance ?? '了解'
    groups[key].push(item)
  }
  return groups
})

const stats = computed(() => {
  const total = knowledgeStore.items.length
  const mastered = knowledgeStore.items.filter(i => i.status === '已掌握').length
  const learning = knowledgeStore.items.filter(i => i.status === '学习中').length
  return { total, mastered, learning, unlearned: total - mastered - learning }
})

async function handleGenerate() {
  try {
    const count = await knowledgeStore.generate(props.practiceId)
    message.success(`AI 生成了 ${count} 个知识点`)
  } catch (e: unknown) {
    message.error('生成失败: ' + String(e))
  }
}

async function handleGenerateFromProject() {
  const folder = await window.api.openFolder()
  if (!folder) return
  generatingProject.value = true
  try {
    const { count, planMd } = await knowledgeStore.generateFromProject(props.practiceId, folder)
    message.success(`已从项目生成 ${count} 个知识点`)
    if (planMd) {
      studyPlanMd.value = planMd
      showPlanDrawer.value = true
    } else {
      message.warning('知识点已生成，但补课计划为空，请重试')
    }
  } catch (e: unknown) {
    message.error('生成失败: ' + String(e))
  } finally {
    generatingProject.value = false
  }
}

async function copyPlan() {
  try {
    await navigator.clipboard.writeText(studyPlanMd.value)
    message.success('已复制到剪贴板')
  } catch {
    message.error('复制失败，请手动选择文本')
  }
}

async function handleAdd() {
  if (!form.value.concept.trim()) {
    message.warning('请输入概念名称')
    return
  }
  await knowledgeStore.create({
    practice_id: props.practiceId,
    concept: form.value.concept,
    one_line_explain: form.value.one_line_explain || null,
    importance: form.value.importance,
    status: '未学',
    resource: form.value.resource || null,
    note: null,
    order_index: knowledgeStore.items.length,
    ai_generated: 0
  })
  showAdd.value = false
  form.value = { concept: '', one_line_explain: '', importance: '必问', resource: '' }
  message.success('已添加')
}
</script>

<template>
  <div>
    <NSpace justify="space-between" align="center" style="margin-bottom: 16px">
      <NSpace>
        <AiGenerateButton label="AI 生成学习清单" :loading="knowledgeStore.loading" @click="handleGenerate" />
        <NButton :loading="generatingProject" @click="handleGenerateFromProject">从项目文件夹生成</NButton>
        <NButton v-if="studyPlanMd" @click="showPlanDrawer = true">查看补课计划</NButton>
        <NButton @click="showAdd = true">手动添加</NButton>
      </NSpace>
      <NSpace v-if="stats.total > 0">
        <NTag type="default">未学 {{ stats.unlearned }}</NTag>
        <NTag type="warning">学习中 {{ stats.learning }}</NTag>
        <NTag type="success">已掌握 {{ stats.mastered }}</NTag>
        <NTag type="info">共 {{ stats.total }}</NTag>
      </NSpace>
    </NSpace>

    <DailyCheckin v-if="knowledgeStore.items.length > 0" :items="knowledgeStore.items" :practice-id="practiceId" />

    <NSpin :show="knowledgeStore.loading">
      <NEmpty v-if="knowledgeStore.items.length === 0 && !knowledgeStore.loading" description="还没有学习条目，试试 AI 生成" />

      <NCollapse v-else default-expanded-names="必问">
        <NCollapseItem v-for="(items, level) in grouped" :key="level" :name="level" :title="`${level}（${items.length}）`">
          <KnowledgeItem
            v-for="item in items"
            :key="item.id"
            :item="item"
            :practice-id="practiceId"
          />
        </NCollapseItem>
      </NCollapse>
    </NSpin>

    <NDrawer v-model:show="showAdd" :width="400" placement="right">
      <NDrawerContent title="添加知识点">
        <NForm label-placement="top">
          <NFormItem label="概念名称" required>
            <NInput v-model:value="form.concept" />
          </NFormItem>
          <NFormItem label="一句话解释">
            <NInput v-model:value="form.one_line_explain" />
          </NFormItem>
          <NFormItem label="重要性">
            <NSelect v-model:value="form.importance" :options="[
              { label: '必问', value: '必问' },
              { label: '加分', value: '加分' },
              { label: '了解', value: '了解' }
            ]" />
          </NFormItem>
          <NFormItem label="推荐资源">
            <NInput v-model:value="form.resource" />
          </NFormItem>
        </NForm>
        <template #footer>
          <NSpace>
            <NButton @click="showAdd = false">取消</NButton>
            <NButton type="primary" @click="handleAdd">添加</NButton>
          </NSpace>
        </template>
      </NDrawerContent>
    </NDrawer>

    <NDrawer v-model:show="showPlanDrawer" :width="720" placement="right">
      <NDrawerContent :native-scrollbar="false">
        <template #header>
          <NSpace justify="space-between" align="center" style="width: 100%">
            <span style="font-weight: 600; font-size: 16px">补课计划</span>
            <NButton size="small" quaternary @click="copyPlan">复制 Markdown</NButton>
          </NSpace>
        </template>
        <NTabs type="line" animated>
          <NTabPane name="rendered" tab="渲染预览">
            <div class="study-plan-preview" v-html="renderedPlan" />
          </NTabPane>
          <NTabPane name="source" tab="Markdown 源码">
            <pre style="white-space: pre-wrap; font-size: 13px; line-height: 1.6;">{{ studyPlanMd }}</pre>
          </NTabPane>
        </NTabs>
      </NDrawerContent>
    </NDrawer>
  </div>
</template>

<style scoped>
.study-plan-preview :deep(h2) { font-size: 20px; margin-top: 24px; margin-bottom: 12px; color: var(--n-title-text-color); border-bottom: 1px solid var(--n-border-color); padding-bottom: 8px; }
.study-plan-preview :deep(h3) { font-size: 16px; margin-top: 20px; margin-bottom: 8px; color: var(--n-title-text-color); }
.study-plan-preview :deep(h4) { font-size: 14px; margin-top: 16px; margin-bottom: 6px; color: var(--n-title-text-color); }
.study-plan-preview :deep(strong) { color: var(--n-text-color); }
.study-plan-preview :deep(code) { background: var(--n-code-color, rgba(0,0,0,0.06)); padding: 1px 5px; border-radius: 3px; font-size: 13px; }
.study-plan-preview :deep(hr) { border: none; border-top: 1px solid var(--n-border-color); margin: 16px 0; }
.study-plan-preview :deep(ul), .study-plan-preview :deep(ol) { padding-left: 20px; }
.study-plan-preview :deep(li) { margin: 4px 0; line-height: 1.7; }
.study-plan-preview :deep(p) { margin: 8px 0; line-height: 1.7; }
.study-plan-preview :deep(blockquote) { border-left: 3px solid var(--n-color-success, #18a058); margin: 8px 0; padding: 4px 12px; color: var(--n-text-color-2); }
</style>
