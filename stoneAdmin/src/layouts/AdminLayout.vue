<template>
  <div class="admin-layout">
    <!-- 顶部导航栏 -->
    <header class="admin-header">
      <div class="header-left">
        <!-- 侧边栏切换按钮 -->
        <n-button 
          text 
          @click="toggleSidebar"
          class="sidebar-toggle"
        >
          <n-icon :size="20">
            <MenuOutline />
          </n-icon>
        </n-button>
        
        <!-- Logo和标题 -->
        <div class="header-brand">
          <img src="/logo-icon-120px.svg" alt="基石" class="header-logo" />
          <span class="header-title">基石管理后台</span>
        </div>
      </div>

      <!-- 页面标题 -->
      <div class="header-center">
        <h1 class="page-title">{{ currentPageTitle }}</h1>
      </div>

      <div class="header-right">
        <!-- 全屏切换 -->
        <n-button 
          text 
          @click="toggleFullscreen"
          class="header-action"
        >
          <n-icon :size="18">
            <ScanOutline v-if="!isFullscreen" />
            <ContractOutline v-else />
          </n-icon>
        </n-button>

        <!-- 用户菜单 -->
        <n-dropdown 
          :options="userMenuOptions" 
          @select="handleUserMenuSelect"
        >
          <div class="user-info">
            <n-avatar :size="32" color="#1890ff">
              <n-icon :size="18">
                <PersonOutline />
              </n-icon>
            </n-avatar>
            <div class="user-details">
              <div class="user-name">{{ authStore.user?.account }}</div>
              <div class="user-role">{{ getRoleText(authStore.user?.type) }}</div>
            </div>
            <n-icon :size="16" class="user-arrow">
              <ChevronDownOutline />
            </n-icon>
          </div>
        </n-dropdown>
      </div>
    </header>

    <!-- 主要内容区域 -->
    <div class="admin-content">
      <!-- 侧边栏 -->
      <aside :class="['admin-sidebar', { collapsed: sidebarCollapsed }]">
        <AdminSidebar :collapsed="sidebarCollapsed" />
      </aside>

      <!-- 主内容区 -->
      <main class="admin-main">
        <!-- 标签页栏 -->
        <TabsBar />
        
        <!-- 页面内容 -->
        <div class="admin-view">
          <router-view v-slot="{ Component, route }">
            <keep-alive :include="keepAliveComponents">
              <component :is="Component" :key="route.path" />
            </keep-alive>
          </router-view>
        </div>
      </main>
    </div>

    <!-- 移动端遮罩层 -->
    <div 
      v-if="showMobileMask" 
      class="mobile-mask"
      @click="closeSidebar"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, h } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { 
  MenuOutline,
  ScanOutline,
  ContractOutline,
  PersonOutline,
  ChevronDownOutline,
  SettingsOutline,
  LogOutOutline,
  PersonCircleOutline
} from '@vicons/ionicons5'
import { useMessage } from 'naive-ui'
import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'
import { useTabsStore } from '@/stores/tabs'
import TabsBar from '@/components/TabsBar.vue'
import AdminSidebar from '@/components/AdminSidebar.vue'

const router = useRouter()
const route = useRoute()
const message = useMessage()
const authStore = useAuthStore()
const themeStore = useThemeStore()
const tabsStore = useTabsStore()

// 响应式数据
const sidebarCollapsed = ref(false)
const isFullscreen = ref(false)
const isMobile = ref(false)

// 计算属性
const showMobileMask = computed(() => {
  return isMobile.value && !sidebarCollapsed.value
})

const keepAliveComponents = computed(() => {
  return tabsStore.activeTabs
    .filter(tab => tab.keepAlive)
    .map(tab => tab.component)
})

// 当前页面标题
const currentPageTitle = computed(() => {
  return route.meta.title as string || '管理后台'
})

// 用户菜单选项
const iconStyle = { fontSize: '14px', width: '14px', height: '14px', verticalAlign: 'middle' }
const userMenuOptions = [
  {
    label: '个人资料',
    key: 'profile',
    icon: () => h(PersonCircleOutline, { style: iconStyle })
  },
  {
    label: '系统设置',
    key: 'settings',
    icon: () => h(SettingsOutline, { style: iconStyle }),
    disabled: !authStore.isSuperAdmin
  },
  {
    type: 'divider',
    key: 'd1'
  },
  {
    label: '退出登录',
    key: 'logout',
    icon: () => h(LogOutOutline, { style: iconStyle })
  }
]

// 获取角色文本
const getRoleText = (type?: string): string => {
  switch (type) {
    case 'SUPER_ADMIN':
      return '超级管理员'
    case 'ADMIN':
      return '管理员'
    default:
      return '用户'
  }
}

// 切换侧边栏
const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value
  
  // 保存状态到本地存储
  localStorage.setItem('stone-admin-sidebar-collapsed', sidebarCollapsed.value.toString())
}

// 关闭侧边栏（移动端）
const closeSidebar = () => {
  if (isMobile.value) {
    sidebarCollapsed.value = true
  }
}

// 切换全屏
const toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen()
    isFullscreen.value = true
  } else {
    document.exitFullscreen()
    isFullscreen.value = false
  }
}

// 处理全屏状态变化
const handleFullscreenChange = () => {
  isFullscreen.value = !!document.fullscreenElement
}

// 处理窗口大小变化
const handleResize = () => {
  isMobile.value = window.innerWidth <= 768
  
  // 移动端默认收起侧边栏
  if (isMobile.value && !sidebarCollapsed.value) {
    sidebarCollapsed.value = true
  }
}

// 处理用户菜单选择
const handleUserMenuSelect = (key: string) => {
  switch (key) {
    case 'profile':
      // 跳转到个人资料页面
      router.push('/profile')
      break
    case 'settings':
      // 跳转到系统设置页面
      router.push('/settings')
      break
    case 'logout':
      // 退出登录
      authStore.logout()
      message.success('已退出登录')
      router.push('/login')
      break
  }
}

// 初始化
const init = async () => {
  // 加载侧边栏状态
  const savedCollapsed = localStorage.getItem('stone-admin-sidebar-collapsed')
  if (savedCollapsed !== null) {
    sidebarCollapsed.value = savedCollapsed === 'true'
  }
  
  // 检查屏幕尺寸
  handleResize()
  
  // 初始化标签页
  tabsStore.init()
  
  // 直接添加当前路由到标签页（不等待认证状态）
  if (route.name !== 'Login' && route.meta?.requiresAuth) {
    tabsStore.addTab(route)
  }
}

onMounted(async () => {
  await init()
  
  // 添加事件监听器
  window.addEventListener('resize', handleResize)
  document.addEventListener('fullscreenchange', handleFullscreenChange)
})

onUnmounted(() => {
  // 移除事件监听器
  window.removeEventListener('resize', handleResize)
  document.removeEventListener('fullscreenchange', handleFullscreenChange)
})
</script>

<style scoped>
.admin-layout {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f7fa;
}

.admin-header {
  height: 60px;
  background: white;
  border-bottom: 1px solid #e8e8e8;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  position: relative;
  z-index: 100;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.sidebar-toggle {
  padding: 8px;
}

.header-brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-logo {
  width: 28px;
  height: 28px;
}

.header-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.header-center {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}

.page-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-action {
  padding: 8px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.user-info:hover {
  background: #f5f7fa;
}

.user-details {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.user-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  line-height: 1.2;
}

.user-role {
  font-size: 12px;
  color: #666;
  line-height: 1.2;
}

.user-arrow {
  color: #999;
}

.admin-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.admin-sidebar {
  width: 240px;
  background: white;
  border-right: 1px solid #e8e8e8;
  overflow-y: auto;
  transition: width 0.3s ease;
  flex-shrink: 0;
}

.admin-sidebar.collapsed {
  width: 64px;
}

.admin-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.admin-view {
  flex: 1;
  padding: 16px;
  overflow: auto;
  background: #f5f7fa;
}

.mobile-mask {
  position: fixed;
  top: 60px;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: 99;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .admin-header {
    padding: 0 16px;
  }
  
  .header-title {
    display: none;
  }
  
  .page-title {
    font-size: 14px;
  }
  
  .user-details {
    display: none;
  }
  
  .admin-sidebar {
    position: fixed;
    left: -240px;
    top: 60px;
    height: calc(100vh - 60px);
    z-index: 100;
    transition: left 0.3s ease;
  }
  
  .admin-sidebar:not(.collapsed) {
    left: 0;
  }
  
  .admin-view {
    padding: 12px;
  }
}

@media (max-width: 480px) {
  .admin-header {
    padding: 0 12px;
  }
  
  .header-brand {
    gap: 8px;
  }
  
  .header-logo {
    width: 24px;
    height: 24px;
  }
  
  .admin-view {
    padding: 8px;
  }
}
</style>
