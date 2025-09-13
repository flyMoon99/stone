import { defineStore } from 'pinia'
import { ref, computed, nextTick } from 'vue'
import type { RouteLocationNormalized } from 'vue-router'
import type { TabItem } from '@stone/shared'
import { TAB_CONFIG } from '@stone/shared'

export const useTabsStore = defineStore('tabs', () => {
  // 状态
  const tabs = ref<TabItem[]>([])
  const activeTabId = ref<string>('')
  const cacheMap = ref<Map<string, any>>(new Map())
  // 初始化标识，防止在恢复之前被早期写入覆盖
  const isInitialized = ref<boolean>(false)

  // 计算属性
  const activeTabs = computed(() => tabs.value.filter(tab => tab.id !== ''))
  const maxTabs = computed(() => TAB_CONFIG.MAX_TABS)
  
  // 获取当前激活的标签页
  const activeTab = computed(() => {
    return tabs.value.find(tab => tab.id === activeTabId.value)
  })

  // 从本地存储加载标签页状态
  const loadTabsFromStorage = () => {
    try {
      const savedTabs = localStorage.getItem(TAB_CONFIG.CACHE_KEY)
      if (savedTabs) {
        const parsed = JSON.parse(savedTabs)
        tabs.value = parsed.tabs || []
        activeTabId.value = parsed.activeTabId || TAB_CONFIG.DEFAULT_TAB_ID
      }
    } catch (error) {
      console.warn('Failed to load tabs from storage:', error)
      // 重置为空状态
      tabs.value = []
      activeTabId.value = ''
    }
  }

  // 保存标签页状态到本地存储
  const saveTabsToStorage = () => {
    try {
      const tabsData = {
        tabs: tabs.value,
        activeTabId: activeTabId.value,
        timestamp: Date.now()
      }
      localStorage.setItem(TAB_CONFIG.CACHE_KEY, JSON.stringify(tabsData))
    } catch (error) {
      console.warn('Failed to save tabs to storage:', error)
    }
  }

  // 生成标签页ID
  const generateTabId = (path: string, params?: Record<string, any>): string => {
    if (params && Object.keys(params).length > 0) {
      const paramStr = Object.entries(params)
        .map(([key, value]) => `${key}=${value}`)
        .join('&')
      return `${path}?${paramStr}`
    }
    return path
  }

  // 创建标签页
  const createTab = (route: RouteLocationNormalized): TabItem => {
    const tabId = generateTabId(route.path, route.params)
    
    return {
      id: tabId,
      title: (route.meta?.title as string) || route.name?.toString() || '未命名页面',
      path: route.path,
      component: route.name?.toString() || '',
      params: route.params,
      query: route.query,
      cache: null,
      closable: tabId !== TAB_CONFIG.DEFAULT_TAB_ID, // 默认标签页不可关闭
      icon: route.meta?.icon as string,
      keepAlive: route.meta?.keepAlive !== false // 默认开启缓存
    }
  }

  // 添加标签页
  const addTab = (route: RouteLocationNormalized): void => {
    // 确保在任何写入之前先恢复本地存储中的标签状态
    if (!isInitialized.value) {
      loadTabsFromStorage()
      initDefaultTab()
      isInitialized.value = true
    }
    const tabId = generateTabId(route.path, route.params)
    
    // 检查标签页是否已存在
    const existingTab = tabs.value.find(tab => tab.id === tabId)
    if (existingTab) {
      // 更新现有标签页信息
      existingTab.title = (route.meta?.title as string) || existingTab.title
      existingTab.query = route.query
      activeTabId.value = tabId
      saveTabsToStorage()
      return
    }

    // 检查标签页数量限制
    if (tabs.value.length >= maxTabs.value) {
      // 移除最老的可关闭标签页
      const closableIndex = tabs.value.findIndex(tab => tab.closable)
      if (closableIndex !== -1) {
        const removedTab = tabs.value.splice(closableIndex, 1)[0]
        // 清除缓存
        cacheMap.value.delete(removedTab.id)
      }
    }

    // 创建新标签页
    const newTab = createTab(route)
    tabs.value.push(newTab)
    activeTabId.value = tabId
    
    saveTabsToStorage()
  }

  // 关闭标签页
  const closeTab = (tabId: string): void => {
    const tabIndex = tabs.value.findIndex(tab => tab.id === tabId)
    if (tabIndex === -1) return

    const tab = tabs.value[tabIndex]
    if (!tab.closable) return

    // 如果关闭的是当前激活标签页，需要切换到其他标签页
    if (activeTabId.value === tabId) {
      // 优先切换到右侧标签页，如果没有则切换到左侧
      const nextTab = tabs.value[tabIndex + 1] || tabs.value[tabIndex - 1]
      if (nextTab) {
        activeTabId.value = nextTab.id
      } else {
        // 如果没有其他标签页，确保默认标签页存在并切换到它
        initDefaultTab()
        activeTabId.value = TAB_CONFIG.DEFAULT_TAB_ID
      }
    }

    // 移除标签页
    tabs.value.splice(tabIndex, 1)
    
    // 清除缓存
    cacheMap.value.delete(tabId)
    
    saveTabsToStorage()
  }

  // 关闭其他标签页
  const closeOtherTabs = (keepTabId: string): void => {
    const keepTab = tabs.value.find(tab => tab.id === keepTabId)
    if (!keepTab) return

    // 保留不可关闭的标签页和指定的标签页
    const newTabs = tabs.value.filter(tab => !tab.closable || tab.id === keepTabId)
    
    // 清除被关闭标签页的缓存
    tabs.value.forEach(tab => {
      if (tab.closable && tab.id !== keepTabId) {
        cacheMap.value.delete(tab.id)
      }
    })
    
    tabs.value = newTabs
    activeTabId.value = keepTabId
    
    saveTabsToStorage()
  }

  // 关闭所有可关闭的标签页
  const closeAllTabs = (): void => {
    // 保留不可关闭的标签页
    const newTabs = tabs.value.filter(tab => !tab.closable)
    
    // 清除被关闭标签页的缓存
    tabs.value.forEach(tab => {
      if (tab.closable) {
        cacheMap.value.delete(tab.id)
      }
    })
    
    tabs.value = newTabs
    
    // 切换到默认标签页
    const defaultTab = newTabs.find(tab => tab.id === TAB_CONFIG.DEFAULT_TAB_ID)
    activeTabId.value = defaultTab?.id || (newTabs[0]?.id || '')
    
    saveTabsToStorage()
  }

  // 刷新标签页
  const refreshTab = (tabId: string): void => {
    const tab = tabs.value.find(tab => tab.id === tabId)
    if (!tab) return

    // 清除缓存
    cacheMap.value.delete(tabId)
    
    // 触发组件重新渲染
    tab.cache = null
    
    saveTabsToStorage()
  }

  // 设置标签页缓存
  const setTabCache = (tabId: string, cache: any): void => {
    cacheMap.value.set(tabId, cache)
  }

  // 获取标签页缓存
  const getTabCache = (tabId: string): any => {
    return cacheMap.value.get(tabId)
  }

  // 切换标签页
  const switchTab = (tabId: string): void => {
    const tab = tabs.value.find(tab => tab.id === tabId)
    if (tab) {
      activeTabId.value = tabId
      saveTabsToStorage()
    }
  }

  // 移动标签页位置
  const moveTab = (fromIndex: number, toIndex: number): void => {
    if (fromIndex < 0 || fromIndex >= tabs.value.length || 
        toIndex < 0 || toIndex >= tabs.value.length) {
      return
    }

    const tab = tabs.value.splice(fromIndex, 1)[0]
    tabs.value.splice(toIndex, 0, tab)
    
    saveTabsToStorage()
  }

  // 初始化默认标签页
  const initDefaultTab = (): void => {
    // 检查默认标签页是否已存在
    const existingDefaultTab = tabs.value.find(tab => tab.id === TAB_CONFIG.DEFAULT_TAB_ID)
    
    if (!existingDefaultTab) {
      const defaultTab: TabItem = {
        id: TAB_CONFIG.DEFAULT_TAB_ID,
        title: '首页',
        path: '/dashboard',
        component: 'Dashboard',
        params: {},
        query: {},
        cache: null,
        closable: false,
        icon: 'dashboard',
        keepAlive: true
      }
      
      tabs.value.unshift(defaultTab) // 添加到开头
      if (!activeTabId.value || !tabs.value.find(tab => tab.id === activeTabId.value)) {
        activeTabId.value = TAB_CONFIG.DEFAULT_TAB_ID
      }
      saveTabsToStorage()
    }
  }

  // 清空所有标签页和缓存
  const clearAll = (): void => {
    tabs.value = []
    activeTabId.value = ''
    cacheMap.value.clear()
    localStorage.removeItem(TAB_CONFIG.CACHE_KEY)
  }

  // 初始化
  const init = (): void => {
    loadTabsFromStorage()
    initDefaultTab()
    
    // 确保activeTabId指向一个存在的标签页
    if (!activeTabId.value || !tabs.value.find(tab => tab.id === activeTabId.value)) {
      const defaultTab = tabs.value.find(tab => tab.id === TAB_CONFIG.DEFAULT_TAB_ID)
      activeTabId.value = defaultTab?.id || (tabs.value[0]?.id || TAB_CONFIG.DEFAULT_TAB_ID)
      saveTabsToStorage()
    }
    isInitialized.value = true
  }

  return {
    // 状态
    tabs,
    activeTabId,
    cacheMap,
    
    // 计算属性
    activeTabs,
    activeTab,
    maxTabs,
    
    // 方法
    addTab,
    closeTab,
    closeOtherTabs,
    closeAllTabs,
    refreshTab,
    switchTab,
    moveTab,
    setTabCache,
    getTabCache,
    clearAll,
    init,
    
    // 标志
    isInitialized,
    
    // 内部方法（可选暴露）
    loadTabsFromStorage,
    saveTabsToStorage
  }
})
