<template>
  <n-config-provider :theme="theme" :locale="zhCN" :date-locale="dateZhCN">
    <n-loading-bar-provider>
      <n-dialog-provider>
        <n-notification-provider>
          <n-message-provider>
            <router-view />
            <n-global-style />
          </n-message-provider>
        </n-notification-provider>
      </n-dialog-provider>
    </n-loading-bar-provider>
  </n-config-provider>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { 
  NConfigProvider, 
  NLoadingBarProvider, 
  NDialogProvider, 
  NNotificationProvider, 
  NMessageProvider,
  NGlobalStyle,
  darkTheme,
  zhCN,
  dateZhCN
} from 'naive-ui'
import { useThemeStore } from '@/stores/theme'

const themeStore = useThemeStore()

// 主题配置
const theme = computed(() => {
  return themeStore.isDark ? darkTheme : null
})
</script>

<style>
#app {
  width: 100%;
  height: 100vh;
}
</style>
