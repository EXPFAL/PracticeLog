<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { NCard, NButton, NSpace, NEmpty, NSpin, NDivider, useMessage } from 'naive-ui'
import { useProjectStore } from '../../stores/project'
import AiGenerateButton from '../common/AiGenerateButton.vue'
import FolderPicker from './FolderPicker.vue'
import ProjectCard from './ProjectCard.vue'

const props = defineProps<{ practiceId: number }>()
const projectStore = useProjectStore()
const message = useMessage()
const projectPath = ref('')
const generating = ref(false)

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

async function handleDelete(id: number) {
  await projectStore.remove(id)
  message.success('已删除')
}
</script>

<template>
  <div>
    <NCard title="项目复盘" size="small">
      <NSpace vertical :size="16">
        <FolderPicker v-model="projectPath" />
        <AiGenerateButton label="AI 生成复盘草稿" :loading="generating" @click="handleGenerate" />
      </NSpace>
    </NCard>

    <NSpin :show="projectStore.loading">
      <NEmpty v-if="projectStore.projects.length === 0 && !projectStore.loading" description="还没有项目复盘记录" style="margin-top: 24px" />

      <ProjectCard
        v-for="proj in projectStore.projects"
        :key="proj.id"
        :project="proj"
        @delete="handleDelete"
      />
    </NSpin>
  </div>
</template>
