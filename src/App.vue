<script setup lang="ts">
import { NConfigProvider, NMessageProvider, NDialogProvider, NLayout, NLayoutSider, NMenu, NIcon, NButton, NInput, NSpace, darkTheme } from 'naive-ui'
import { h, ref, computed, onErrorCaptured, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { DashboardOutlined, UnorderedListOutlined, ExportOutlined, BulbOutlined, SearchOutlined, BarChartOutlined } from '@vicons/antd'
import UpdateNotice from './components/common/UpdateNotice.vue'

const router = useRouter()
const route = useRoute()
const collapsed = ref(false)
const isDark = ref(false)
const searchQuery = ref('')
const searchFocused = ref(false)

const theme = computed(() => isDark.value ? darkTheme : null)

const menuOptions = [
  { label: '总览', key: '/', icon: () => h(NIcon, null, { default: () => h(DashboardOutlined) }) },
  { label: '实践列表', key: '/practices', icon: () => h(NIcon, null, { default: () => h(UnorderedListOutlined) }) },
  { label: '统计', key: '/stats', icon: () => h(NIcon, null, { default: () => h(BarChartOutlined) }) },
  { label: '导出', key: '/export', icon: () => h(NIcon, null, { default: () => h(ExportOutlined) }) }
]

function handleMenuUpdate(key: string) {
  router.push(key)
}

// Global keyboard shortcuts
function handleKeydown(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault()
    const input = document.querySelector('.search-input input') as HTMLInputElement | null
    input?.focus()
  }
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    // Let individual forms handle their own save
    // Only prevent default if no input/textarea is focused
    const active = document.activeElement
    if (active?.tagName !== 'INPUT' && active?.tagName !== 'TEXTAREA') {
      e.preventDefault()
    }
  }
}

onMounted(() => window.addEventListener('keydown', handleKeydown))
onUnmounted(() => window.removeEventListener('keydown', handleKeydown))

// Error boundary
const error = ref<Error | null>(null)
onErrorCaptured((err) => {
  error.value = err
  return false
})

function handleSearch() {
  if (searchQuery.value.trim()) {
    router.push({ path: '/search', query: { q: searchQuery.value.trim() } })
    searchFocused.value = false
  }
}
</script>

<template>
  <NConfigProvider :theme="theme">
    <NMessageProvider>
      <NDialogProvider>
        <div v-if="error" style="padding: 48px; text-align: center;">
          <h2 style="color: #d03050;">应用出错了</h2>
          <p style="color: #666; margin: 12px 0;">{{ error.message }}</p>
          <NButton type="primary" @click="error = null; $router.go(0)">刷新页面</NButton>
        </div>
        <NLayout v-else has-sider style="height: 100vh">
          <NLayoutSider
            bordered
            collapse-mode="width"
            :collapsed-width="64"
            :width="200"
            :collapsed="collapsed"
            show-trigger
            @collapse="collapsed = true"
            @expand="collapsed = false"
          >
            <div style="padding: 16px; text-align: center; font-weight: bold; font-size: 18px">
              {{ collapsed ? 'PL' : 'PracticeLog' }}
            </div>
            <NMenu
              :value="route.path"
              :collapsed="collapsed"
              :collapsed-width="64"
              :collapsed-icon-size="22"
              :options="menuOptions"
              @update:value="handleMenuUpdate"
            />
            <div style="position: absolute; bottom: 16px; width: 100%; text-align: center;">
              <NButton quaternary circle size="small" @click="isDark = !isDark">
                <template #icon>
                  <NIcon :component="BulbOutlined" />
                </template>
              </NButton>
            </div>
          </NLayoutSider>
          <NLayout content-style="padding: 24px; overflow: auto;">
            <div style="margin-bottom: 16px;">
              <NInput
                v-model:value="searchQuery"
                class="search-input"
                placeholder="搜索... (Ctrl+K)"
                clearable
                @keyup.enter="handleSearch"
                @focus="searchFocused = true"
                @blur="searchFocused = false"
              >
                <template #prefix>
                  <NIcon :component="SearchOutlined" />
                </template>
              </NInput>
            </div>
            <UpdateNotice />
            <router-view />
          </NLayout>
        </NLayout>
      </NDialogProvider>
    </NMessageProvider>
  </NConfigProvider>
</template>
