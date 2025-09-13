import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useThemeStore = defineStore('theme', () => {
  // 主题状态
  const isDark = ref(false)

  // 从本地存储加载主题设置
  const loadTheme = () => {
    const savedTheme = localStorage.getItem('stone-web-theme')
    if (savedTheme) {
      isDark.value = savedTheme === 'dark'
    } else {
      // 检测系统主题偏好
      isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches
    }
  }

  // 切换主题
  const toggleTheme = () => {
    isDark.value = !isDark.value
    localStorage.setItem('stone-web-theme', isDark.value ? 'dark' : 'light')
  }

  // 设置主题
  const setTheme = (theme: 'light' | 'dark') => {
    isDark.value = theme === 'dark'
    localStorage.setItem('stone-web-theme', theme)
  }

  // 初始化时加载主题
  loadTheme()

  return {
    isDark,
    toggleTheme,
    setTheme,
    loadTheme
  }
})
