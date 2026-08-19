<script setup lang="ts">
import { NConfigProvider, NMessageProvider, NDialogProvider, NLayout, NLayoutSider, NMenu, NIcon, NButton, darkTheme } from 'naive-ui'
import { h, ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { DashboardOutlined, UnorderedListOutlined, ExportOutlined, BulbOutlined } from '@vicons/antd'
import UpdateNotice from './components/common/UpdateNotice.vue'

const router = useRouter()
const route = useRoute()
const collapsed = ref(false)
const isDark = ref(false)

const theme = computed(() => isDark.value ? darkTheme : null)

const menuOptions = [
  { label: '总览', key: '/', icon: () => h(NIcon, null, { default: () => h(DashboardOutlined) }) },
  { label: '实践列表', key: '/practices', icon: () => h(NIcon, null, { default: () => h(UnorderedListOutlined) }) },
  { label: '导出', key: '/export', icon: () => h(NIcon, null, { default: () => h(ExportOutlined) }) }
]

function handleMenuUpdate(key: string) {
  router.push(key)
}
</script>

<template>
  <NConfigProvider :theme="theme">
    <NMessageProvider>
      <NDialogProvider>
        <NLayout has-sider style="height: 100vh">
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
            <UpdateNotice />
            <router-view />
          </NLayout>
        </NLayout>
      </NDialogProvider>
    </NMessageProvider>
  </NConfigProvider>
</template>
