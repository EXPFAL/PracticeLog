<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { NButton, NCard, NGrid, NGi, NEmpty, NTag, NSpace, NSkeleton, NPopconfirm, NDrawer, NDrawerContent, NForm, NFormItem, NInput, NDatePicker, NSelect, useMessage } from 'naive-ui'
import { useRouter } from 'vue-router'
import { usePracticeStore } from '../stores/practice'

const router = useRouter()
const practiceStore = usePracticeStore()
const message = useMessage()
const showCreate = ref(false)
const loading = ref(true)
const filterTag = ref<string | null>(null)

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

const allTags = computed(() => {
  const tags = new Set<string>()
  for (const p of practiceStore.practices) {
    if (p.direction_tags) {
      try { (JSON.parse(p.direction_tags) as string[]).forEach(t => tags.add(t)) } catch { /* ignore */ }
    }
  }
  return [...tags].map(t => ({ label: t, value: t }))
})

const filteredPractices = computed(() => {
  if (!filterTag.value) return practiceStore.practices
  return practiceStore.practices.filter(p => {
    if (!p.direction_tags) return false
    try { return (JSON.parse(p.direction_tags) as string[]).includes(filterTag.value!) } catch { return false }
  })
})

function formatDate(ts: number | null): string | null {
  return ts ? new Date(ts).toISOString().slice(0, 10) : null
}

function parseTags(tags: string | null): string[] {
  if (!tags) return []
  try { return JSON.parse(tags) as string[] } catch { return [] }
}

async function handleCreate() {
  if (!form.value.title.trim()) { message.warning('请输入实践标题'); return }
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

async function handleDuplicate(id: number) {
  try {
    const newId = await window.api.practiceDuplicate(id)
    await practiceStore.fetchAll()
    message.success('复制成功')
    router.push(`/practice/${newId}`)
  } catch (e: unknown) {
    message.error('复制失败: ' + String(e))
  }
}

function openDetail(id: number) {
  router.push(`/practice/${id}`)
}
</script>

<template>
  <div>
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px">
      <h2>实践列表</h2>
      <NSpace>
        <NSelect v-if="allTags.length > 0" v-model:value="filterTag" :options="allTags" placeholder="按标签筛选" clearable style="width: 160px" />
        <NButton type="primary" @click="showCreate = true">新建实践</NButton>
      </NSpace>
    </div>

    <template v-if="loading">
      <NGrid :cols="2" :x-gap="16" :y-gap="16">
        <NGi v-for="i in 4" :key="i"><NCard><NSkeleton text :repeat="3" /></NCard></NGi>
      </NGrid>
    </template>

    <template v-else>
      <NEmpty v-if="filteredPractices.length === 0" :description="filterTag ? `没有「${filterTag}」相关的实践` : '还没有实践记录，点击右上角新建'" />
      <NGrid v-else :cols="2" :x-gap="16" :y-gap="16">
        <NGi v-for="p in filteredPractices" :key="p.id">
          <NCard hoverable role="button" tabindex="0" style="cursor: pointer" :aria-label="'查看实践: ' + p.title" @click="openDetail(p.id)" @keydown.enter="openDetail(p.id)">
            <template #header>
              <span @click.stop>{{ p.title }}</span>
            </template>
            <template #header-extra>
              <NSpace :size="4">
                <NButton size="small" quaternary @click.stop="handleDuplicate(p.id)">复制</NButton>
                <NPopconfirm @positive-click.stop="handleDelete(p.id)">
                  <template #trigger>
                    <NButton size="small" type="error" quaternary @click.stop>删除</NButton>
                  </template>
                  确认删除「{{ p.title }}」？
                </NPopconfirm>
              </NSpace>
            </template>
            <NSpace vertical :size="8">
              <div v-if="p.location" style="font-size: 13px; color: var(--n-text-color-2)">{{ p.location }}</div>
              <div v-if="p.advisor" style="font-size: 13px; color: var(--n-text-color-2)">{{ p.advisor }}</div>
              <div v-if="p.start_date" style="font-size: 13px; color: var(--n-text-color-2)">{{ p.start_date }} — {{ p.end_date || '进行中' }}</div>
              <NSpace v-if="p.direction_tags" :size="4">
                <NTag
                  v-for="tag in parseTags(p.direction_tags)"
                  :key="tag"
                  size="small"
                  :type="filterTag === tag ? 'success' : 'default'"
                  style="cursor: pointer"
                  tabindex="0"
                  role="button"
                  :aria-label="'筛选标签: ' + tag"
                  @click.stop="filterTag = filterTag === tag ? null : tag"
                  @keydown.enter.stop="filterTag = filterTag === tag ? null : tag"
                >
                  {{ tag }}
                </NTag>
              </NSpace>
            </NSpace>
          </NCard>
        </NGi>
      </NGrid>
    </template>

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
