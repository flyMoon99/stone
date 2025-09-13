<template>
  <div class="tabs-bar">
    <div class="tabs-container" ref="tabsContainer">
      <div 
        v-for="tab in tabsStore.activeTabs" 
        :key="tab.id"
        :class="['tab-item', { active: tab.id === tabsStore.activeTabId }]"
        @click="handleTabClick(tab)"
        @contextmenu.prevent="handleContextMenu(tab, $event)"
      >
        <n-icon v-if="tab.icon" :size="14" class="tab-icon">
          <component :is="getIcon(tab.icon)" />
        </n-icon>
        <span class="tab-title">{{ tab.title }}</span>
        <n-icon 
          v-if="tab.closable" 
          :size="14" 
          class="tab-close"
          @click.stop="handleTabClose(tab.id)"
        >
          <CloseOutline />
        </n-icon>
      </div>
    </div>
    
    <!-- 标签页操作按钮 -->
    <div class="tabs-actions">
      <n-dropdown 
        :options="tabMenuOptions" 
        @select="handleTabMenuSelect"
        trigger="click"
      >
        <n-button text size="small">
          <n-icon :size="16">
            <ChevronDownOutline />
          </n-icon>
        </n-button>
      </n-dropdown>
    </div>

    <!-- 右键菜单 -->
    <n-dropdown
      placement="bottom-start"
      trigger="manual"
      :x="contextMenuX"
      :y="contextMenuY"
      :options="contextMenuOptions"
      :show="showContextMenu"
      :on-clickoutside="closeContextMenu"
      @select="handleContextMenuSelect"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, h } from 'vue'
import { useRouter } from 'vue-router'
import { 
  CloseOutline, 
  ChevronDownOutline,
  RefreshOutline,
  CloseCircleOutline,
  RemoveOutline,
  GridOutline
} from '@vicons/ionicons5'
import { useTabsStore } from '@/stores/tabs'
import type { TabItem } from '@stone/shared'

const router = useRouter()
const tabsStore = useTabsStore()

// 响应式数据
const tabsContainer = ref<HTMLElement>()
const showContextMenu = ref(false)
const contextMenuX = ref(0)
const contextMenuY = ref(0)
const contextMenuTab = ref<TabItem | null>(null)

// 获取图标组件
const getIcon = (iconName: string) => {
  // 这里可以根据图标名称返回对应的图标组件
  // 简化处理，返回默认图标
  return GridOutline
}

// 图标样式
const iconStyle = { fontSize: '14px', width: '14px', height: '14px', verticalAlign: 'middle' }

// 标签页菜单选项
const tabMenuOptions = computed(() => [
  {
    label: '关闭当前标签页',
    key: 'close-current',
    icon: () => h(CloseOutline, { style: iconStyle }),
    disabled: !tabsStore.activeTab?.closable
  },
  {
    label: '关闭其他标签页',
    key: 'close-others',
    icon: () => h(RemoveOutline, { style: iconStyle }),
    disabled: tabsStore.activeTabs.filter(tab => tab.closable).length <= 1
  },
  {
    label: '关闭所有标签页',
    key: 'close-all',
    icon: () => h(CloseCircleOutline, { style: iconStyle }),
    disabled: tabsStore.activeTabs.filter(tab => tab.closable).length === 0
  },
  {
    type: 'divider',
    key: 'd1'
  },
  {
    label: '刷新当前页面',
    key: 'refresh',
    icon: () => h(RefreshOutline, { style: iconStyle })
  }
])

// 右键菜单选项
const contextMenuOptions = computed(() => {
  if (!contextMenuTab.value) return []
  
  const tab = contextMenuTab.value
  return [
    {
      label: '刷新',
      key: 'refresh',
      icon: () => h(RefreshOutline, { style: iconStyle })
    },
    {
      type: 'divider',
      key: 'd1'
    },
    {
      label: '关闭',
      key: 'close',
      icon: () => h(CloseOutline, { style: iconStyle }),
      disabled: !tab.closable
    },
    {
      label: '关闭其他',
      key: 'close-others',
      icon: () => h(RemoveOutline, { style: iconStyle }),
      disabled: tabsStore.activeTabs.filter(t => t.closable && t.id !== tab.id).length === 0
    },
    {
      label: '关闭右侧',
      key: 'close-right',
      icon: () => h(RemoveOutline, { style: iconStyle }),
      disabled: !hasTabsOnRight(tab.id)
    },
    {
      label: '关闭所有',
      key: 'close-all',
      icon: () => h(CloseCircleOutline, { style: iconStyle }),
      disabled: tabsStore.activeTabs.filter(t => t.closable).length === 0
    }
  ]
})

// 检查右侧是否有可关闭的标签页
const hasTabsOnRight = (tabId: string): boolean => {
  const tabIndex = tabsStore.activeTabs.findIndex(tab => tab.id === tabId)
  if (tabIndex === -1) return false
  
  return tabsStore.activeTabs
    .slice(tabIndex + 1)
    .some(tab => tab.closable)
}

// 处理标签页点击
const handleTabClick = (tab: TabItem) => {
  if (tab.id !== tabsStore.activeTabId) {
    tabsStore.switchTab(tab.id)
    router.push(tab.path)
  }
}

// 处理标签页关闭
const handleTabClose = async (tabId: string) => {
  const tab = tabsStore.activeTabs.find(t => t.id === tabId)
  if (!tab || !tab.closable) return
  
  // 先检查是否是当前激活的标签页
  const isCurrentTab = tabId === tabsStore.activeTabId
  
  // 关闭标签页
  tabsStore.closeTab(tabId)
  
  // 如果关闭的是当前标签页，需要跳转到新的激活标签页
  if (isCurrentTab && tabsStore.activeTab) {
    try {
      await router.push(tabsStore.activeTab.path)
    } catch (error) {
      // 处理导航失败的情况
      console.warn('Navigation failed after tab close:', error)
    }
  }
}

// 处理右键菜单
const handleContextMenu = (tab: TabItem, event: MouseEvent) => {
  event.preventDefault()
  contextMenuTab.value = tab
  contextMenuX.value = event.clientX
  contextMenuY.value = event.clientY
  showContextMenu.value = true
}

// 关闭右键菜单
const closeContextMenu = () => {
  showContextMenu.value = false
  contextMenuTab.value = null
}

// 处理标签页菜单选择
const handleTabMenuSelect = async (key: string) => {
  switch (key) {
    case 'close-current':
      if (tabsStore.activeTab?.closable) {
        await handleTabClose(tabsStore.activeTabId)
      }
      break
    case 'close-others':
      tabsStore.closeOtherTabs(tabsStore.activeTabId)
      // 确保当前激活的标签页路由得到更新
      if (tabsStore.activeTab) {
        try {
          await router.push(tabsStore.activeTab.path)
        } catch (error) {
          console.warn('Navigation failed after closing other tabs:', error)
        }
      }
      break
    case 'close-all':
      tabsStore.closeAllTabs()
      if (tabsStore.activeTab) {
        try {
          await router.push(tabsStore.activeTab.path)
        } catch (error) {
          console.warn('Navigation failed after closing all tabs:', error)
        }
      }
      break
    case 'refresh':
      if (tabsStore.activeTab) {
        tabsStore.refreshTab(tabsStore.activeTabId)
        // 强制刷新当前路由
        router.go(0)
      }
      break
  }
}

// 处理右键菜单选择
const handleContextMenuSelect = async (key: string) => {
  if (!contextMenuTab.value) return
  
  const tab = contextMenuTab.value
  
  switch (key) {
    case 'refresh':
      tabsStore.refreshTab(tab.id)
      if (tab.id === tabsStore.activeTabId) {
        router.go(0)
      }
      break
    case 'close':
      if (tab.closable) {
        await handleTabClose(tab.id)
      }
      break
    case 'close-others':
      tabsStore.closeOtherTabs(tab.id)
      if (tab.id !== tabsStore.activeTabId) {
        tabsStore.switchTab(tab.id)
        try {
          await router.push(tab.path)
        } catch (error) {
          console.warn('Navigation failed after closing others:', error)
        }
      }
      break
    case 'close-right':
      await closeTabsOnRight(tab.id)
      break
    case 'close-all':
      tabsStore.closeAllTabs()
      if (tabsStore.activeTab) {
        try {
          await router.push(tabsStore.activeTab.path)
        } catch (error) {
          console.warn('Navigation failed after closing all:', error)
        }
      }
      break
  }
  
  closeContextMenu()
}

// 关闭右侧标签页
const closeTabsOnRight = async (tabId: string) => {
  const tabIndex = tabsStore.activeTabs.findIndex(tab => tab.id === tabId)
  if (tabIndex === -1) return
  
  const tabsToClose = tabsStore.activeTabs
    .slice(tabIndex + 1)
    .filter(tab => tab.closable)
  
  // 检查是否需要切换当前激活标签页
  const willCloseActiveTab = tabsToClose.some(tab => tab.id === tabsStore.activeTabId)
  
  // 关闭所有右侧标签页
  tabsToClose.forEach(tab => {
    tabsStore.closeTab(tab.id)
  })
  
  // 如果当前激活标签页被关闭了，切换到指定标签页
  if (willCloseActiveTab) {
    tabsStore.switchTab(tabId)
    const targetTab = tabsStore.activeTabs.find(tab => tab.id === tabId)
    if (targetTab) {
      try {
        await router.push(targetTab.path)
      } catch (error) {
        console.warn('Navigation failed after closing right tabs:', error)
      }
    }
  }
}
</script>

<style scoped>
.tabs-bar {
  height: 40px;
  background: white;
  border-bottom: 1px solid #e8e8e8;
  display: flex;
  align-items: center;
  padding: 0 16px;
  overflow: hidden;
}

.tabs-container {
  flex: 1;
  display: flex;
  align-items: center;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.tabs-container::-webkit-scrollbar {
  display: none;
}

.tab-item {
  display: flex;
  align-items: center;
  height: 32px;
  padding: 0 12px;
  background: #f5f7fa;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  margin-right: 8px;
  cursor: pointer;
  transition: all 0.2s;
  user-select: none;
  white-space: nowrap;
  flex-shrink: 0;
  min-width: 80px;
  max-width: 200px;
}

.tab-item:hover {
  background: #e6f7ff;
  border-color: #91d5ff;
}

.tab-item.active {
  background: #1890ff;
  color: white;
  border-color: #1890ff;
}

.tab-icon {
  margin-right: 4px;
  flex-shrink: 0;
}

.tab-title {
  font-size: 12px;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tab-close {
  margin-left: 4px;
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
}

.tab-close:hover {
  background: rgba(0, 0, 0, 0.1);
}

.tab-item.active .tab-close:hover {
  background: rgba(255, 255, 255, 0.2);
}

.tabs-actions {
  margin-left: 8px;
  flex-shrink: 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .tabs-bar {
    padding: 0 8px;
  }
  
  .tab-item {
    padding: 0 8px;
    margin-right: 4px;
    min-width: 60px;
    max-width: 120px;
  }
  
  .tab-title {
    font-size: 11px;
  }
}
</style>
