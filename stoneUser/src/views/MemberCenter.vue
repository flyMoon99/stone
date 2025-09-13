<template>
  <div class="member-container">
    <!-- 导航栏 -->
    <header class="header">
      <nav class="nav">
        <div class="nav-brand">
          <img src="/logo-icon-120px.svg" alt="基石" class="logo" />
          <span class="brand-text">基石 - 会员中心</span>
        </div>
        <div class="nav-actions">
          <n-dropdown 
            :options="userMenuOptions" 
            @select="handleUserMenuSelect"
            size="small"
            :show-arrow="true"
          >
            <n-button text class="user-menu-trigger">
              <n-icon :size="16" class="mr-1">
                <PersonOutline />
              </n-icon>
              <span class="username">{{ authStore.user?.account }}</span>
              <n-icon :size="14" class="ml-1">
                <ChevronDownOutline />
              </n-icon>
            </n-button>
          </n-dropdown>
        </div>
      </nav>
    </header>

    <!-- 主要内容 -->
    <main class="main">
      <div class="container">
        <!-- 欢迎区域 -->
        <section class="welcome-section">
          <div class="welcome-card">
            <div class="welcome-content">
              <h1 class="welcome-title">
                欢迎回来，{{ authStore.user?.account }}！
              </h1>
              <p class="welcome-subtitle">
                您已成功登录会员中心
              </p>
              <div class="welcome-info">
                <div class="info-item">
                  <span class="info-label">账户状态：</span>
                  <n-tag :type="statusTagType" size="small">
                    {{ statusText }}
                  </n-tag>
                </div>
                <div class="info-item">
                  <span class="info-label">注册时间：</span>
                  <span class="info-value">{{ formatDate(authStore.user?.createdAt) }}</span>
                </div>
                <div class="info-item" v-if="authStore.user?.lastLoginAt">
                  <span class="info-label">上次登录：</span>
                  <span class="info-value">{{ formatDate(authStore.user?.lastLoginAt) }}</span>
                </div>
              </div>
            </div>
            <div class="welcome-avatar">
              <n-avatar :size="80" color="#18a058">
                <n-icon :size="40">
                  <PersonOutline />
                </n-icon>
              </n-avatar>
            </div>
          </div>
        </section>

        <!-- 功能区域 -->
        <section class="features-section">
          <h2 class="section-title">会员功能</h2>
          <div class="features-grid">
            <div class="feature-card">
              <n-icon :size="32" color="#18a058">
                <PersonCircleOutline />
              </n-icon>
              <h3>个人资料</h3>
              <p>查看和编辑您的个人信息</p>
              <n-button type="primary" ghost @click="showProfileModal = true">
                查看详情
              </n-button>
            </div>
            
            <div class="feature-card">
              <n-icon :size="32" color="#2080f0">
                <SettingsOutline />
              </n-icon>
              <h3>账户设置</h3>
              <p>管理您的账户安全设置</p>
              <n-button type="primary" ghost disabled>
                即将开放
              </n-button>
            </div>
            
            <div class="feature-card">
              <n-icon :size="32" color="#f0a020">
                <DocumentTextOutline />
              </n-icon>
              <h3>使用记录</h3>
              <p>查看您的系统使用记录</p>
              <n-button type="primary" ghost disabled>
                即将开放
              </n-button>
            </div>
            
            <div class="feature-card">
              <n-icon :size="32" color="#d03050">
                <HelpCircleOutline />
              </n-icon>
              <h3>帮助支持</h3>
              <p>获取系统使用帮助和支持</p>
              <n-button type="primary" ghost disabled>
                即将开放
              </n-button>
            </div>
          </div>
        </section>
      </div>
    </main>

    <!-- 个人资料模态框 -->
    <n-modal v-model:show="showProfileModal" preset="card" title="个人资料" style="width: 500px">
      <div class="profile-content">
        <div class="profile-item">
          <span class="profile-label">账户名：</span>
          <span class="profile-value">{{ authStore.user?.account }}</span>
        </div>
        <div class="profile-item">
          <span class="profile-label">用户ID：</span>
          <span class="profile-value">{{ authStore.user?.id }}</span>
        </div>
        <div class="profile-item">
          <span class="profile-label">账户状态：</span>
          <n-tag :type="statusTagType" size="small">
            {{ statusText }}
          </n-tag>
        </div>
        <div class="profile-item">
          <span class="profile-label">注册时间：</span>
          <span class="profile-value">{{ formatDate(authStore.user?.createdAt) }}</span>
        </div>
        <div class="profile-item">
          <span class="profile-label">更新时间：</span>
          <span class="profile-value">{{ formatDate(authStore.user?.updatedAt) }}</span>
        </div>
        <div class="profile-item" v-if="authStore.user?.lastLoginAt">
          <span class="profile-label">上次登录：</span>
          <span class="profile-value">{{ formatDate(authStore.user?.lastLoginAt) }}</span>
        </div>
      </div>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, h } from 'vue'
import { NIcon } from 'naive-ui'
import { useRouter } from 'vue-router'
import { 
  PersonOutline,
  PersonCircleOutline,
  SettingsOutline,
  DocumentTextOutline,
  HelpCircleOutline,
  LogOutOutline,
  HomeOutline,
  ChevronDownOutline
} from '@vicons/ionicons5'
import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'
import { formatDate } from '@stone/shared'

const router = useRouter()
const authStore = useAuthStore()
const themeStore = useThemeStore()

// 响应式数据
const showProfileModal = ref(false)

// 用户菜单选项
const userMenuOptions = [
  {
    label: '返回首页',
    key: 'home',
    icon: () => h(NIcon, { size: 14 }, { default: () => h(HomeOutline) })
  },
  {
    label: '个人资料',
    key: 'profile',
    icon: () => h(NIcon, { size: 14 }, { default: () => h(PersonCircleOutline) })
  },
  {
    type: 'divider',
    key: 'd1'
  },
  {
    label: '退出登录',
    key: 'logout',
    icon: () => h(NIcon, { size: 14 }, { default: () => h(LogOutOutline) }),
    props: {
      class: 'logout-option'
    }
  }
]

// 计算属性
const statusText = computed(() => {
  return authStore.user?.status === 'ACTIVE' ? '正常' : '已禁用'
})

const statusTagType = computed(() => {
  return authStore.user?.status === 'ACTIVE' ? 'success' : 'error'
})

// 处理用户菜单选择
const handleUserMenuSelect = (key: string) => {
  switch (key) {
    case 'home':
      router.push('/')
      break
    case 'profile':
      showProfileModal.value = true
      break
    case 'logout':
      authStore.logout()
      router.push('/')
      break
  }
}
</script>

<style scoped>
.member-container {
  min-height: 100vh;
  background: #f5f7fa;
}

.header {
  background: white;
  border-bottom: 1px solid #e0e0e0;
  position: sticky;
  top: 0;
  z-index: 100;
}

.nav {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.nav-brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo {
  width: 32px;
  height: 32px;
}

.brand-text {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.nav-actions {
  display: flex;
  align-items: center;
}

.user-menu-trigger {
  padding: 8px 12px !important;
  border-radius: 6px;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

.user-menu-trigger:hover {
  background-color: #f5f5f5;
  border-color: #e0e0e0;
}

.username {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin: 0 4px;
}

/* 下拉菜单项样式 */
:deep(.n-dropdown-option) {
  display: flex !important;
  align-items: center !important;
  padding: 6px 12px !important;
  font-size: 13px !important;
  min-height: 32px !important;
}

:deep(.n-dropdown-option .n-dropdown-option-body) {
  display: flex !important;
  align-items: center !important;
  width: 100% !important;
}

:deep(.n-dropdown-option .n-dropdown-option-body__prefix) {
  margin-right: 8px !important;
  display: flex !important;
  align-items: center !important;
}

:deep(.n-dropdown-option .n-dropdown-option-body__label) {
  display: flex !important;
  align-items: center !important;
  line-height: 1 !important;
}

/* 退出登录选项特殊样式 */
:deep(.n-dropdown-option.logout-option) {
  color: #e74c3c !important;
}

:deep(.n-dropdown-option.logout-option .n-dropdown-option-body__label) {
  color: #e74c3c !important;
}

:deep(.n-dropdown-option.logout-option .n-icon) {
  color: #e74c3c !important;
}

.main {
  padding: 40px 0;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
}

.welcome-section {
  margin-bottom: 40px;
}

.welcome-card {
  background: white;
  border-radius: 12px;
  padding: 32px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.welcome-content {
  flex: 1;
}

.welcome-title {
  font-size: 28px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.welcome-subtitle {
  color: #666;
  font-size: 16px;
  margin-bottom: 24px;
}

.welcome-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.info-label {
  color: #666;
  font-weight: 500;
  min-width: 80px;
}

.info-value {
  color: #333;
}

.welcome-avatar {
  margin-left: 32px;
}

.features-section {
  margin-bottom: 40px;
}

.section-title {
  font-size: 24px;
  font-weight: 600;
  color: #333;
  margin-bottom: 24px;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
}

.feature-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  text-align: center;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s, box-shadow 0.3s;
}

.feature-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.feature-card h3 {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 16px 0 8px;
}

.feature-card p {
  color: #666;
  margin-bottom: 20px;
  line-height: 1.5;
}

.profile-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.profile-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.profile-item:last-child {
  border-bottom: none;
}

.profile-label {
  color: #666;
  font-weight: 500;
}

.profile-value {
  color: #333;
  font-family: monospace;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .welcome-card {
    flex-direction: column;
    text-align: center;
    gap: 24px;
  }
  
  .welcome-avatar {
    margin-left: 0;
  }
  
  .features-grid {
    grid-template-columns: 1fr;
  }
  
  .profile-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
}
</style>
