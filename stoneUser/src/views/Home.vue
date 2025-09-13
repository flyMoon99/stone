<template>
  <div class="home-container">
    <!-- 导航栏 -->
    <header class="header">
      <nav class="nav">
        <div class="nav-brand">
          <img src="/logo-icon-120px.svg" alt="基石" class="logo" />
          <span class="brand-text">基石</span>
        </div>
        <div class="nav-menu">
          <router-link to="/" class="nav-link">首页</router-link>
          <router-link to="/about" class="nav-link">关于我们</router-link>
          <div class="nav-actions">
            <n-button 
              v-if="!authStore.isAuthenticated"
              type="primary" 
              @click="$router.push('/login')"
            >
              会员登录
            </n-button>
            <n-dropdown 
              v-else
              :options="userMenuOptions" 
              @select="handleUserMenuSelect"
            >
              <n-button text>
                <n-icon :size="18" class="mr-1">
                  <PersonOutline />
                </n-icon>
                {{ authStore.user?.account }}
              </n-button>
            </n-dropdown>
            <n-button 
              text 
              @click="themeStore.toggleTheme"
              class="ml-2"
            >
              <n-icon :size="20">
                <SunnyOutline v-if="themeStore.isDark" />
                <MoonOutline v-else />
              </n-icon>
            </n-button>
          </div>
        </div>
      </nav>
    </header>

    <!-- 主要内容 -->
    <main class="main">
      <!-- 英雄区域 -->
      <section class="hero">
        <div class="hero-content">
          <h1 class="hero-title">基石项目</h1>
          <p class="hero-subtitle">现代化的管理系统解决方案</p>
          <p class="hero-description">
            基于 Vue 3 + TypeScript + Naive UI 构建的企业级管理系统，
            提供完整的用户管理、权限控制和系统监控功能。
          </p>
          <div class="hero-actions">
            <n-button 
              type="primary" 
              size="large"
              @click="$router.push('/login')"
            >
              立即体验
            </n-button>
            <n-button 
              size="large"
              @click="$router.push('/about')"
            >
              了解更多
            </n-button>
          </div>
        </div>
        <div class="hero-image">
          <img src="/logo-full-300px.svg" alt="基石项目" />
        </div>
      </section>

      <!-- 特性介绍 -->
      <section class="features">
        <div class="container">
          <h2 class="section-title">核心特性</h2>
          <div class="features-grid">
            <div class="feature-card">
              <n-icon :size="48" color="#18a058">
                <ShieldCheckmarkOutline />
              </n-icon>
              <h3>安全可靠</h3>
              <p>采用JWT双Token认证机制，确保系统安全性</p>
            </div>
            <div class="feature-card">
              <n-icon :size="48" color="#2080f0">
                <SpeedometerOutline />
              </n-icon>
              <h3>高性能</h3>
              <p>基于现代前端技术栈，提供流畅的用户体验</p>
            </div>
            <div class="feature-card">
              <n-icon :size="48" color="#f0a020">
                <ExtensionPuzzleOutline />
              </n-icon>
              <h3>易扩展</h3>
              <p>模块化设计，支持快速定制和功能扩展</p>
            </div>
            <div class="feature-card">
              <n-icon :size="48" color="#d03050">
                <PhonePortraitOutline />
              </n-icon>
              <h3>响应式</h3>
              <p>完美适配各种设备，随时随地访问系统</p>
            </div>
          </div>
        </div>
      </section>
    </main>

    <!-- 页脚 -->
    <footer class="footer">
      <div class="container">
        <div class="footer-content">
          <div class="footer-brand">
            <img src="/logo-icon-120px.svg" alt="基石" class="footer-logo" />
            <span class="footer-text">基石项目</span>
          </div>
          <div class="footer-info">
            <p>&copy; 2024 基石项目. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { h } from 'vue'
import { useRouter } from 'vue-router'
import { 
  PersonOutline,
  SunnyOutline,
  MoonOutline,
  ShieldCheckmarkOutline,
  SpeedometerOutline,
  ExtensionPuzzleOutline,
  PhonePortraitOutline,
  LogOutOutline,
  PersonCircleOutline
} from '@vicons/ionicons5'
import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'

const router = useRouter()
const authStore = useAuthStore()
const themeStore = useThemeStore()

// 用户菜单选项
const userMenuOptions = [
  {
    label: '会员中心',
    key: 'member-center',
    icon: () => h(PersonCircleOutline)
  },
  {
    label: '退出登录',
    key: 'logout',
    icon: () => h(LogOutOutline)
  }
]

// 处理用户菜单选择
const handleUserMenuSelect = (key: string) => {
  switch (key) {
    case 'member-center':
      router.push('/member')
      break
    case 'logout':
      authStore.logout()
      router.push('/')
      break
  }
}
</script>

<style scoped>
.home-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
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
  font-size: 20px;
  font-weight: 600;
  color: #333;
}

.nav-menu {
  display: flex;
  align-items: center;
  gap: 24px;
}

.nav-link {
  color: #666;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.3s;
}

.nav-link:hover,
.nav-link.router-link-active {
  color: #18a058;
}

.nav-actions {
  display: flex;
  align-items: center;
}

.main {
  flex: 1;
}

.hero {
  max-width: 1200px;
  margin: 0 auto;
  padding: 80px 24px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 60px;
  align-items: center;
}

.hero-content {
  max-width: 500px;
}

.hero-title {
  font-size: 48px;
  font-weight: 700;
  color: #333;
  margin-bottom: 16px;
}

.hero-subtitle {
  font-size: 24px;
  color: #666;
  margin-bottom: 24px;
}

.hero-description {
  font-size: 16px;
  color: #888;
  line-height: 1.6;
  margin-bottom: 32px;
}

.hero-actions {
  display: flex;
  gap: 16px;
}

.hero-image {
  text-align: center;
}

.hero-image img {
  max-width: 100%;
  height: auto;
}

.features {
  background: #f8f9fa;
  padding: 80px 0;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
}

.section-title {
  font-size: 36px;
  font-weight: 600;
  text-align: center;
  color: #333;
  margin-bottom: 60px;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 40px;
}

.feature-card {
  background: white;
  padding: 40px 24px;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s, box-shadow 0.3s;
}

.feature-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.feature-card h3 {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin: 16px 0 12px;
}

.feature-card p {
  color: #666;
  line-height: 1.6;
}

.footer {
  background: #333;
  color: white;
  padding: 40px 0;
}

.footer-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.footer-brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.footer-logo {
  width: 24px;
  height: 24px;
  filter: brightness(0) invert(1);
}

.footer-text {
  font-weight: 600;
}

.footer-info p {
  color: #ccc;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .hero {
    grid-template-columns: 1fr;
    gap: 40px;
    padding: 40px 24px;
    text-align: center;
  }
  
  .hero-title {
    font-size: 36px;
  }
  
  .nav-menu {
    gap: 16px;
  }
  
  .nav-link {
    display: none;
  }
  
  .features-grid {
    grid-template-columns: 1fr;
  }
  
  .footer-content {
    flex-direction: column;
    gap: 16px;
    text-align: center;
  }
}
</style>
