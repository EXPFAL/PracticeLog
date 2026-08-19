import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { DailyLog } from '../types'

export const useLogStore = defineStore('log', () => {
  const logs = ref<DailyLog[]>([])
  const loading = ref(false)

  async function fetch(practiceId: number) {
    loading.value = true
    try {
      logs.value = await window.api.logList(practiceId)
    } finally {
      loading.value = false
    }
  }

  async function create(data: { practice_id: number; date: string; what_done?: string; problems?: string; solutions?: string; reflection?: string }) {
    const id = await window.api.logCreate(data)
    await fetch(data.practice_id)
    return id
  }

  return { logs, loading, fetch, create }
})
