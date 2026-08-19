import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { DailyLog } from '../types'

export const useLogStore = defineStore('log', () => {
  const logs = ref<DailyLog[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetch(practiceId: number) {
    loading.value = true
    error.value = null
    try {
      logs.value = await window.api.logList(practiceId)
    } catch (e) {
      error.value = String(e)
    } finally {
      loading.value = false
    }
  }

  async function create(data: { practice_id: number; date: string; what_done?: string; problems?: string; solutions?: string; reflection?: string }) {
    const id = await window.api.logCreate(data)
    await fetch(data.practice_id)
    return id
  }

  async function remove(id: number, practiceId: number) {
    await window.api.logDelete(id)
    await fetch(practiceId)
  }

  return { logs, loading, error, fetch, create, remove }
})
