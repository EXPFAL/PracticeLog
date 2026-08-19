<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { NCard, NButton, NSpace, NEmpty, NSpin, NDrawer, NDrawerContent, NForm, NFormItem, NInput, useMessage } from 'naive-ui'
import { useProjectStore } from '../../stores/project'
import AiGenerateButton from '../common/AiGenerateButton.vue'
import FolderPicker from './FolderPicker.vue'
import ProjectCard from './ProjectCard.vue'
import type { ProjectArchive } from '../../types'

const props = defineProps<{ practiceId: number }>()
const projectStore = useProjectStore()
const message = useMessage()
const projectPath = ref('')
const generating = ref(false)
const showCreateDrawer = ref(false)
const editingId = ref<number | null>(null)
const drawerTitle = computed(() => editingId.value ? '编辑项目复盘' : '手动创建项目复盘')

const createForm = ref({
  name: '',
  local_path: '',
  tech_stack: '',
  role: '',
  summary: '',
  real_involvement: '',
  problems_solved: '',
  lessons: '',
  unknowns: '',
  interview_script: ''
})

onMounted(() => projectStore.fetch(props.practiceId))

async function handleGenerate() {
  if (!projectPath.value.trim()) {
    message.warning('请先选择项目文件夹')
    return
  }
  generating.value = true
  try {
    await projectStore.generate(props.practiceId, projectPath.value)
    message.success('AI 复盘草稿已生成')
  } catch (e: unknown) {
    message.error(String(e))
  } finally {
    generating.value = false
  }
}

function resetForm() {
  createForm.value = { name: '', local_path: '', tech_stack: '', role: '', summary: '', real_involvement: '', problems_solved: '', lessons: '', unknowns: '', interview_script: '' }
}

function fillForm(proj: ProjectArchive) {
  createForm.value = {
    name: proj.name,
    local_path: proj.local_path ?? '',
    tech_stack: proj.tech_stack ?? '',
    role: proj.role ?? '',
    summary: proj.summary ?? '',
    real_involvement: proj.real_involvement ?? '',
    problems_solved: proj.problems_solved ?? '',
    lessons: proj.lessons ?? '',
    unknowns: proj.unknowns ?? '',
    interview_script: proj.interview_script ?? ''
  }
}

function openCreate() {
  editingId.value = null
  resetForm()
  showCreateDrawer.value = true
}

function openEdit(proj: ProjectArchive) {
  editingId.value = proj.id
  fillForm(proj)
  showCreateDrawer.value = true
}

function closeDrawer() {
  showCreateDrawer.value = false
  editingId.value = null
}

function onDrawerShow(show: boolean) {
  if (!show) editingId.value = null
}

async function handleSave() {
  if (!createForm.value.name.trim()) {
    message.warning('请输入项目名称')
    return
  }
  const data = {
    name: createForm.value.name.trim(),
    local_path: createForm.value.local_path || null,
    tech_stack: createForm.value.tech_stack || null,
    role: createForm.value.role || null,
    summary: createForm.value.summary || null,
    real_involvement: createForm.value.real_involvement || null,
    problems_solved: createForm.value.problems_solved || null,
    lessons: createForm.value.lessons || null,
    unknowns: createForm.value.unknowns || null,
    interview_script: createForm.value.interview_script || null,
    ai_generated: 0
  }
  if (editingId.value) {
    await projectStore.update(editingId.value, data)
    message.success('已更新')
  } else {
    await window.api.projectCreate({ practice_id: props.practiceId, ...data })
    await projectStore.fetch(props.practiceId)
    message.success('创建成功')
  }
  closeDrawer()
}

async function handleDelete(id: number) {
  await projectStore.remove(id, props.practiceId)
  message.success('已删除')
}
</script>

<template>
  <div>
    <NCard title="项目复盘" size="small">
      <NSpace vertical :size="16">
        <FolderPicker v-model="projectPath" />
        <NSpace>
          <AiGenerateButton label="AI 生成复盘草稿" :loading="generating" @click="handleGenerate" />
          <NButton @click="openCreate">手动创建</NButton>
        </NSpace>
      </NSpace>
    </NCard>

    <NSpin :show="projectStore.loading">
      <NEmpty v-if="projectStore.projects.length === 0 && !projectStore.loading" description="还没有项目复盘记录" style="margin-top: 24px" />

      <ProjectCard
        v-for="proj in projectStore.projects"
        :key="proj.id"
        :project="proj"
        @edit="openEdit"
        @delete="handleDelete"
      />
    </NSpin>

    <NDrawer v-model:show="showCreateDrawer" :title="drawerTitle" :width="450" placement="right" @update:show="onDrawerShow">
      <NDrawerContent title="手动创建项目复盘">
        <NForm label-placement="top">
          <NFormItem label="项目名称" required>
            <NInput v-model:value="createForm.name" />
          </NFormItem>
          <NFormItem label="项目路径">
            <NInput v-model:value="createForm.local_path" placeholder="本地文件夹路径" />
          </NFormItem>
          <NFormItem label="技术栈">
            <NInput v-model:value="createForm.tech_stack" placeholder="如：Vue 3 + TypeScript + Electron" />
          </NFormItem>
          <NFormItem label="我的角色">
            <NInput v-model:value="createForm.role" />
          </NFormItem>
          <NFormItem label="项目总结">
            <NInput v-model:value="createForm.summary" type="textarea" :rows="2" />
          </NFormItem>
          <NFormItem label="真实参与度">
            <NInput v-model:value="createForm.real_involvement" type="textarea" :rows="2" placeholder="诚实标注参与程度" />
          </NFormItem>
          <NFormItem label="解决的问题">
            <NInput v-model:value="createForm.problems_solved" type="textarea" :rows="2" />
          </NFormItem>
          <NFormItem label="学到的东西">
            <NInput v-model:value="createForm.lessons" type="textarea" :rows="2" />
          </NFormItem>
          <NFormItem label="还不懂的">
            <NInput v-model:value="createForm.unknowns" type="textarea" :rows="2" />
          </NFormItem>
          <NFormItem label="面试话术">
            <NInput v-model:value="createForm.interview_script" type="textarea" :rows="3" />
          </NFormItem>
        </NForm>
        <template #footer>
          <NSpace>
            <NButton @click="closeDrawer">取消</NButton>
            <NButton type="primary" @click="handleSave">{{ editingId ? '保存' : '创建' }}</NButton>
          </NSpace>
        </template>
      </NDrawerContent>
    </NDrawer>
  </div>
</template>
