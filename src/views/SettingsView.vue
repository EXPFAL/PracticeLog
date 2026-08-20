<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { NCard, NForm, NFormItem, NInput, NButton, NSpace, NTag, useMessage } from 'naive-ui'

const message = useMessage()
const apiBaseUrl = ref('')
const apiModel = ref('')
const apiKey = ref('')
const apiKeyConfigured = ref(false)
const saving = ref(false)
const backingUp = ref(false)

onMounted(async () => {
  const s = await window.api.settingsGet()
  apiBaseUrl.value = s.apiBaseUrl
  apiModel.value = s.apiModel
  apiKeyConfigured.value = s.apiKeyConfigured
})

async function handleSave() {
  if (!apiBaseUrl.value.trim() || !apiModel.value.trim()) {
    message.warning('请填写 API 地址和模型名称')
    return
  }
  saving.value = true
  try {
    const patch: { apiBaseUrl: string; apiModel: string; apiKey?: string } = {
      apiBaseUrl: apiBaseUrl.value.trim().replace(/\/+$/, ''),
      apiModel: apiModel.value.trim()
    }
    if (apiKey.value.trim()) {
      patch.apiKey = apiKey.value.trim()
    }
    const s = await window.api.settingsSet(patch)
    apiKeyConfigured.value = s.apiKeyConfigured
    apiKey.value = ''
    message.success('设置已保存')
  } catch (e: unknown) {
    message.error('保存失败: ' + String(e))
  } finally {
    saving.value = false
  }
}

async function handleClearKey() {
  await window.api.settingsSet({ apiKey: '' })
  apiKeyConfigured.value = false
  message.success('已清除 API Key')
}

async function handleBackup() {
  backingUp.value = true
  try {
    const path = await window.api.dbBackup()
    message.success(`备份成功: ${path}`)
  } catch (e: unknown) {
    message.error('备份失败: ' + String(e))
  } finally {
    backingUp.value = false
  }
}

async function handleImport() {
  const path = await window.api.dbSelectBackup()
  if (!path) return
  try {
    await window.api.dbImport(path)
    message.success('导入成功，正在刷新...')
    window.location.reload()
  } catch (e: unknown) {
    message.error('导入失败: ' + String(e))
  }
}
</script>

<template>
  <div>
    <h2 style="margin-bottom: 24px">设置</h2>

    <NCard title="AI 配置（OpenAI 兼容 API）" style="margin-bottom: 24px;">
      <NForm label-placement="top">
        <NFormItem label="API 地址" required>
          <NInput
            v-model:value="apiBaseUrl"
            placeholder="https://api.deepseek.com"
            style="max-width: 480px"
          />
        </NFormItem>
        <NFormItem label="模型名称" required>
          <NInput
            v-model:value="apiModel"
            placeholder="deepseek-chat"
            style="max-width: 480px"
          />
        </NFormItem>
        <NFormItem label="API Key">
          <NSpace>
            <NInput
              v-model:value="apiKey"
              type="password"
              show-password-on="click"
              placeholder="sk-...（留空则保持已保存的 Key 不变）"
              style="width: 400px"
            />
            <NButton type="primary" :loading="saving" @click="handleSave">保存</NButton>
            <NButton v-if="apiKeyConfigured" @click="handleClearKey">清除 Key</NButton>
          </NSpace>
        </NFormItem>
        <NFormItem label="状态">
          <NTag :type="apiKeyConfigured ? 'success' : 'warning'">
            {{ apiKeyConfigured ? '已配置' : '未配置' }}
          </NTag>
          <span style="font-size: 12px; color: var(--n-text-color-3); margin-left: 8px;">
            也可通过环境变量 $env:DEEPSEEK_API_KEY 提供
          </span>
        </NFormItem>
      </NForm>
      <p style="font-size: 12px; color: var(--n-text-color-3); margin-top: 8px;">
        API 地址、模型名称和 API Key 保存在本机配置文件（userData/settings.json），不会提交到代码库。
        默认为 DeepSeek，可改为任意 OpenAI 兼容接口。
      </p>
    </NCard>

    <NCard title="数据备份" style="margin-bottom: 24px;">
      <NSpace>
        <NButton :loading="backingUp" @click="handleBackup">备份数据库</NButton>
        <NButton @click="handleImport">导入备份</NButton>
      </NSpace>
      <p style="font-size: 12px; color: var(--n-text-color-3); margin-top: 12px;">
        备份会写入 exports/backup/。导入会覆盖当前数据库，请先自行备份。
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
        <NFormItem label="实践内页签"><NTag size="small">Ctrl + 1/2/3</NTag>（今日 / 准备 / 复盘）</NFormItem>
        <NFormItem label="保存日志"><NTag size="small">Ctrl + S</NTag></NFormItem>
        <NFormItem label="深色模式"><NTag size="small">侧边栏灯泡图标</NTag></NFormItem>
      </NForm>
    </NCard>
  </div>
</template>
