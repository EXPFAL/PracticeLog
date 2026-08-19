import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { ProjectArchive } from '../types'

export const useProjectStore = defineStore('project', () => {
  const projects = ref<ProjectArchive[]>([])
  const loading = ref(false)

  async function fetch(practiceId: number) {
    loading.value = true
    try {
      projects.value = await window.api.projectList(practiceId)
    } finally {
      loading.value = false
    }
  }

  async function update(id: number, data: Partial<ProjectArchive>) {
    await window.api.projectUpdate(id, data)
    const idx = projects.value.findIndex(p => p.id === id)
    if (idx >= 0) projects.value[idx] = { ...projects.value[idx], ...data }
  }

  async function remove(id: number) {
    await window.api.projectDelete(id)
    projects.value = projects.value.filter(p => p.id !== id)
  }

  async function generate(practiceId: number, path: string) {
    const result = await window.api.projectGenerate(practiceId, path)
    await fetch(practiceId)
    return result
  }

  return { projects, loading, fetch, update, remove, generate }
})
