import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { ProjectArchive } from '../types'

export const useProjectStore = defineStore('project', () => {
  const projects = ref<ProjectArchive[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetch(practiceId: number) {
    loading.value = true
    error.value = null
    try {
      projects.value = await window.api.projectList(practiceId)
    } catch (e) {
      error.value = String(e)
    } finally {
      loading.value = false
    }
  }

  async function update(id: number, data: Partial<ProjectArchive>) {
    await window.api.projectUpdate(id, data)
    const idx = projects.value.findIndex(p => p.id === id)
    if (idx >= 0) projects.value[idx] = { ...projects.value[idx], ...data }
  }

  async function remove(id: number, practiceId: number) {
    await window.api.projectDelete(id)
    await fetch(practiceId)
  }

  async function generate(practiceId: number, path: string) {
    const result = await window.api.projectGenerate(practiceId, path)
    await fetch(practiceId)
    return result
  }

  return { projects, loading, error, fetch, update, remove, generate }
})
