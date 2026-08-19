<script setup lang="ts">
import { NResult, NButton } from 'naive-ui'
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<template>
  <NResult status="404" title="页面不存在" description="你访问的页面不存在或已被移除。" style="margin-top: 80px;">
    <template #footer>
      <NButton type="primary" @click="router.push('/')">返回首页</NButton>
    </template>
  </NResult>
</template>
