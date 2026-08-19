<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { NButton, NCard, NGrid, NGi, NEmpty, NTag, NSpace, NSpin, NPopconfirm, NDrawer, NDrawerContent, NForm, NFormItem, NInput, NDatePicker, useMessage } from 'naive-ui'
import { useRouter } from 'vue-router'
import { usePracticeStore } from '../stores/practice'

const router = useRouter()
const practiceStore = usePracticeStore()
const message = useMessage()
const showCreate = ref(false)
const loading = ref(true)

const form = ref({
  title: '',
  start_date: null as number | null,
  end_date: null as number | null,
  location: '',
  advisor: '',
  direction_tags: '',
  notes: ''
})

onMounted(async () => {
  await practiceStore.fetchAll()
  loading.value = false
})

function formatDate(ts: number | null): string | null {
  if (!ts) return null
  return new Date(ts).toISOString().slice(0, 10)
}

async function handleCreate() {
  if (!form.value.title.trim()) {
    message.warning('请输入实践标题')
    return
  }
  const tags = form.value.direction_tags
    ? JSON.stringify(form.value.direction_tags.split(/[,，、]/).map(s => s.trim()).filter(Boolean))
    : null

  await practiceStore.create({
    title: form.value.title.trim(),
    start_date: formatDate(form.value.start_date),
    end_date: formatDate(form.value.end_date),
    location: form.value.location || null,
    advisor: form.value.advisor || null,
    direction_tags: tags,
    notes: form.value.notes || null
  })
  message.success('创建成功')
  showCreate.value = false
  form.value = { title: '', start_date: null, end_date: null, location: '', advisor: '', direction_tags: '', notes: '' }
}

async function handleDelete(id: number) {
  await practiceStore.remove(id)
  message.success('已删除')
}

function openDetail(id: number) {
  router.push(`/practice/${id}`)
}
</script>

<template>
  <div>
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px">
      <h2>实践列表</h2>
      <NButton type="primary" @click="showCreate = true">新建实践</NButton>
    </div>

    <NSpin :show="loading">
      <NEmpty v-if="!loading && practiceStore.practices.length === 0" description="还没有实践记录，点击右上角新建" />
      <NGrid v-else :cols="2" :x-gap="16" :y-gap="16">
        <NGi v-for="p in practiceStore.practices" :key="p.id">
          <NCard hoverable style="cursor: pointer" @click="openDetail(p.id)">
            <template #header>
              <span @click.stop>{{ p.title }}</span>
            </template>
            <template #header-extra>
              <NPopconfirm @positive-click.stop="handleDelete(p.id)">
                <template #trigger>
                  <NButton size="small" type="error" quaternary @click.stop>删除</NButton>
                </template>
                确认删除「{{ p.title }}」？
              </NPopconfirm>
            </template>
            <NSpace vertical :size="8">
              <div v-if="p.location" style="font-size: 13px; color: #666">📍 {{ p.location }}</div>
              <div v-if="p.advisor" style="font-size: 13px; color: #666">👨‍🏫 {{ p.advisor }}</div>
              <div v-if="p.start_date" style="font-size: 13px; color: #666">📅 {{ p.start_date }} — {{ p.end_date || '进行中' }}</div>
              <NSpace v-if="p.direction_tags" :size="4">
                <NTag v-for="tag in (() => { try { return JSON.parse(p.direction_tags!) } catch { return [] } })()" :key="tag" size="small">
                  {{ tag }}
                </NTag>
              </NSpace>
            </NSpace>
          </NCard>
        </NGi>
      </NGrid>
    </NSpin>

    <NDrawer v-model:show="showCreate" :width="400" placement="right">
      <NDrawerContent title="新建实践">
        <NForm label-placement="top">
          <NFormItem label="标题" required>
            <NInput v-model:value="form.title" placeholder="如：暑期嵌入式实习" />
          </NFormItem>
          <NFormItem label="开始日期">
            <NDatePicker v-model:value="form.start_date" type="date" clearable />
          </NFormItem>
          <NFormItem label="结束日期">
            <NDatePicker v-model:value="form.end_date" type="date" clearable />
          </NFormItem>
          <NFormItem label="地点">
            <NInput v-model:value="form.location" placeholder="如：XX公司/实验室" />
          </NFormItem>
          <NFormItem label="指导老师">
            <NInput v-model:value="form.advisor" />
          </NFormItem>
          <NFormItem label="方向标签（逗号分隔）">
            <NInput v-model:value="form.direction_tags" placeholder="如：具身智能, 边缘计算" />
          </NFormItem>
          <NFormItem label="备注">
            <NInput v-model:value="form.notes" type="textarea" :rows="3" />
          </NFormItem>
        </NForm>
        <template #footer>
          <NSpace>
            <NButton @click="showCreate = false">取消</NButton>
            <NButton type="primary" @click="handleCreate">创建</NButton>
          </NSpace>
        </template>
      </NDrawerContent>
    </NDrawer>
  </div>
</template>
