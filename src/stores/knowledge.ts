import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { KnowledgeItem } from '../types'

export const useKnowledgeStore = defineStore('knowledge', () => {
  const items = ref<KnowledgeItem[]>([])
  const loading = ref(false)

  async function fetch(practiceId: number) {
    loading.value = true
    try {
      items.value = await window.api.knowledgeList(practiceId)
    } finally {
      loading.value = false
    }
  }

  async function create(data: Omit<KnowledgeItem, 'id' | 'created_at'>) {
    const id = await window.api.knowledgeCreate(data)
    await fetch(data.practice_id)
    return id
  }

  async function update(id: number, data: Partial<KnowledgeItem>) {
    await window.api.knowledgeUpdate(id, data)
    const idx = items.value.findIndex(i => i.id === id)
    if (idx >= 0) items.value[idx] = { ...items.value[idx], ...data }
  }

  async function remove(id: number, practiceId: number) {
    await window.api.knowledgeDelete(id)
    items.value = items.value.filter(i => i.id !== id)
  }

  async function generate(practiceId: number) {
    const count = await window.api.knowledgeGenerate(practiceId)
    await fetch(practiceId)
    return count
  }

  return { items, loading, fetch, create, update, remove, generate }
})
