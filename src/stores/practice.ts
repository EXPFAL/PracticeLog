import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Practice } from '../types'

export const usePracticeStore = defineStore('practice', () => {
  const practices = ref<Practice[]>([])
  const current = ref<Practice | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchAll() {
    loading.value = true
    error.value = null
    try {
      practices.value = await window.api.practiceList()
    } catch (e) {
      error.value = String(e)
    } finally {
      loading.value = false
    }
  }

  async function create(data: Omit<Practice, 'id' | 'created_at'>) {
    const id = await window.api.practiceCreate(data)
    await fetchAll()
    return id
  }

  async function update(id: number, data: Partial<Omit<Practice, 'id' | 'created_at'>>) {
    await window.api.practiceUpdate(id, data)
    await fetchAll()
    if (current.value?.id === id) {
      current.value = { ...current.value, ...data } as Practice
    }
  }

  async function remove(id: number) {
    await window.api.practiceDelete(id)
    await fetchAll()
    if (current.value?.id === id) current.value = null
  }

  async function getById(id: number) {
    const found = practices.value.find(p => p.id === id)
    if (found) {
      current.value = found
      return found
    }
    await fetchAll()
    current.value = practices.value.find(p => p.id === id) ?? null
    return current.value
  }

  return { practices, current, loading, error, fetchAll, create, update, remove, getById }
})
