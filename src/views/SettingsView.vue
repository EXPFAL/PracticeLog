<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { NCard, NForm, NFormItem, NInput, NButton, NSpace, NDivider, NTag, NSwitch, useMessage } from 'naive-ui'

const message = useMessage()
const apiKey = ref('')
const apiKeyStatus = ref(false)
const saving = ref(false)

onMounted(async () => {
  const status = await window.api.aiConfigGet()
  apiKeyStatus.value = status.configured
})

async function handleSaveApiKey() {
  if (!apiKey.value.trim()) {
    message.warning('请输入 API Key')
    return
  }
  saving.value = true
  try {
    await window.api.aiConfigSet(apiKey.value.trim())
    apiKeyStatus.value = true
    apiKey.value = ''
    message.success('API Key 已配置（本次会话有效，重启后需通过环境变量设置）')
  } catch (e: unknown) {
    message.error('配置失败: ' + String(e))
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div>
    <h2 style="margin-bottom: 24px">设置</h2>

    <NCard title="AI 配置" style="margin-bottom: 24px;">
      <NForm label-placement="top">
        <NFormItem label="DeepSeek API Key">
          <NSpace>
            <NInput
              v-model:value="apiKey"
              type="password"
              show-password-on="click"
              placeholder="sk-..."
              style="width: 400px"
            />
            <NButton type="primary" :loading="saving" @click="handleSaveApiKey">设置</NButton>
          </NSpace>
        </NFormItem>
        <NFormItem label="状态">
          <NTag :type="apiKeyStatus ? 'success' : 'warning'">
            {{ apiKeyStatus ? '已配置' : '未配置（需通过 $env:DEEPSEEK_API_KEY 或此处设置）' }}
          </NTag>
        </NFormItem>
      </NForm>
      <p style="font-size: 12px; color: var(--n-text-color-3); margin-top: 8px;">
        此处设置的 Key 仅在本次会话生效。持久化请通过 PowerShell 环境变量设置：
        <code>$env:DEEPSEEK_API_KEY = "sk-xxxx"</code>
      </p>
    </NCard>

    <NCard title="数据管理" style="margin-bottom: 24px;">
      <NSpace vertical :size="12">
        <div>
          <strong>数据库位置</strong>
          <p style="font-size: 13px; color: var(--n-text-color-2);">开发模式: E:\Work\PracticeLog\data\practice.db</p>
          <p style="font-size: 13px; color: var(--n-text-color-2);">生产模式: %AppData%\practice-log\data\practice.db</p>
        </div>
        <div>
          <strong>导出目录</strong>
          <p style="font-size: 13px; color: var(--n-text-color-2);">开发模式: E:\Work\PracticeLog\exports\</p>
          <p style="font-size: 13px; color: var(--n-text-color-2);">生产模式: %AppData%\practice-log\exports\</p>
        </div>
      </NSpace>
    </NCard>

    <NCard title="快捷键" style="margin-bottom: 24px;">
      <NForm label-placement="left">
        <NFormItem label="全局搜索"><NTag size="small">Ctrl + K</NTag></NFormItem>
        <NFormItem label="切换标签页"><NTag size="small">Ctrl + 1/2/3/4</NTag></NFormItem>
        <NFormItem label="深色模式"><NTag size="small">侧边栏灯泡图标</NTag></NFormItem>
      </NForm>
    </NCard>
  </div>
</template>
