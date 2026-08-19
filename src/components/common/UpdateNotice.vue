<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { NAlert, NButton, NSpace, NProgress, useMessage } from 'naive-ui'

const message = useMessage()
const showNotice = ref(false)
const downloaded = ref(false)
const downloading = ref(false)
const progress = ref(0)
const newVersion = ref('')

onMounted(() => {
  window.api.onUpdateAvailable((info: { version: string }) => {
    newVersion.value = info.version
    showNotice.value = true
  })

  window.api.onUpdateProgress((p: { percent: number }) => {
    progress.value = Math.round(p.percent)
  })

  window.api.onUpdateDownloaded(() => {
    downloaded.value = true
    downloading.value = false
  })
})

async function handleDownload() {
  downloading.value = true
  try {
    await window.api.updateDownload()
  } catch (e: unknown) {
    message.error('下载失败: ' + String(e))
    downloading.value = false
  }
}

function handleInstall() {
  window.api.updateInstall()
}
</script>

<template>
  <NAlert
    v-if="showNotice"
    :title="`新版本 v${newVersion} 可用`"
    :type="downloaded ? 'success' : 'info'"
    closable
    style="margin-bottom: 16px;"
    @close="showNotice = false"
  >
    <template v-if="downloaded">
      <p>新版本已下载完成，重启即可更新。</p>
      <NButton type="primary" size="small" @click="handleInstall" style="margin-top: 8px;">
        立即重启更新
      </NButton>
    </template>
    <template v-else-if="downloading">
      <NProgress :percentage="progress" :show-indicator="true" style="margin-top: 8px;" />
    </template>
    <template v-else>
      <NSpace>
        <NButton type="primary" size="small" @click="handleDownload">下载更新</NButton>
        <NButton size="small" quaternary @click="showNotice = false">稍后再说</NButton>
      </NSpace>
    </template>
  </NAlert>
</template>
