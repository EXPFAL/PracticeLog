<script setup lang="ts">
import { NConfigProvider, NMessageProvider, NDialogProvider, NLayout, NLayoutSider, NMenu, NIcon, NButton, NInput, darkTheme } from 'naive-ui'
import { h, ref, computed, watch, onErrorCaptured, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { DashboardOutlined, UnorderedListOutlined, ExportOutlined, BulbOutlined, SearchOutlined, BarChartOutlined, SettingOutlined } from '@vicons/antd'
import UpdateNotice from './components/common/UpdateNotice.vue'

const router = useRouter()
const route = useRoute()
const collapsed = ref(false)
const isDark = ref(localStorage.getItem('theme') === 'dark')
const searchQuery = ref('')

const theme = computed(() => isDark.value ? darkTheme : null)

watch(isDark, (val) => {
  localStorage.setItem('theme', val ? 'dark' : 'light')
  document.documentElement.style.colorScheme = val ? 'dark' : 'light'
  window.api.settingsSet({ theme: val ? 'dark' : 'light' }).catch(() => {})
})

// Apply on load
if (isDark.value) {
  document.documentElement.style.colorScheme = 'dark'
}

const menuOptions = [
  { label: '总览', key: '/', icon: () => h(NIcon, null, { default: () => h(DashboardOutlined) }) },
  { label: '实践列表', key: '/practices', icon: () => h(NIcon, null, { default: () => h(UnorderedListOutlined) }) },
  { label: '统计', key: '/stats', icon: () => h(NIcon, null, { default: () => h(BarChartOutlined) }) },
  { label: '导出', key: '/export', icon: () => h(NIcon, null, { default: () => h(ExportOutlined) }) },
  { label: '设置', key: '/settings', icon: () => h(NIcon, null, { default: () => h(SettingOutlined) }) }
]

const activeMenuKey = computed(() => {
  const path = route.path
  if (path.startsWith('/practice/')) return '/practices'
  if (path === '/search') return ''
  return path
})

function handleMenuUpdate(key: string) {
  router.push(key)
}

function handleKeydown(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault()
    const input = document.querySelector('.search-input input') as HTMLInputElement | null
    input?.focus()
  }
}

onMounted(async () => {
  window.addEventListener('keydown', handleKeydown)
  window.api.onMenuNavigate((path) => router.push(path))
  try {
    const s = await window.api.settingsGet()
    isDark.value = s.theme === 'dark'
  } catch { /* keep local cache */ }
})
onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})

const error = ref<Error | null>(null)
onErrorCaptured((err) => {
  error.value = err
  return false
})

function handleSearch() {
  if (searchQuery.value.trim()) {
    router.push({ path: '/search', query: { q: searchQuery.value.trim() } })
  }
}

function handleSearchInput(val: string) {
  searchQuery.value = val
  // Enter 才跳转；输入只更新本地，避免边打字边离开当前页
}
</script>

<template>
  <NConfigProvider :theme="theme">
    <NMessageProvider>
      <NDialogProvider>
        <div v-if="error" style="padding: 48px; text-align: center;">
          <h2 style="color: var(--n-color-error, #d03050);">应用出错了</h2>
          <p style="color: var(--n-text-color-2, #666); margin: 12px 0;">{{ error.message }}</p>
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
              :value="activeMenuKey"
              :collapsed="collapsed"
              :collapsed-width="64"
              :collapsed-icon-size="22"
              :options="menuOptions"
              @update:value="handleMenuUpdate"
            />
            <div style="position: absolute; bottom: 16px; width: 100%; text-align: center;">
              <NButton quaternary circle size="small" aria-label="切换深色模式" @click="isDark = !isDark">
                <template #icon>
                  <NIcon :component="BulbOutlined" />
                </template>
              </NButton>
            </div>
          </NLayoutSider>
          <NLayout content-style="padding: 24px; overflow: auto;">
            <div style="margin-bottom: 16px;">
              <NInput
                :value="searchQuery"
                class="search-input"
                placeholder="搜索... (Ctrl+K)"
                clearable
                @keyup.enter="handleSearch"
                @update:value="handleSearchInput"
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
