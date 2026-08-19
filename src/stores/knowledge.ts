import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { KnowledgeItem } from '../types'

export const useKnowledgeStore = defineStore('knowledge', () => {
  const items = ref<KnowledgeItem[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetch(practiceId: number) {
    loading.value = true
    error.value = null
    try {
      items.value = await window.api.knowledgeList(practiceId)
    } catch (e) {
      error.value = String(e)
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
    await fetch(practiceId)
  }

  async function generate(practiceId: number) {
    const count = await window.api.knowledgeGenerate(practiceId)
    await fetch(practiceId)
    return count
  }

  async function generateFromProject(practiceId: number, path: string) {
    const count = await window.api.knowledgeGenerateFromProject(practiceId, path)
    await fetch(practiceId)
    return count
  }

  return { items, loading, error, fetch, create, update, remove, generate, generateFromProject }
})
