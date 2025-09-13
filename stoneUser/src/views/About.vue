<template>
  <div class="about-container">
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
          <n-button 
            v-if="!authStore.isAuthenticated"
            type="primary" 
            @click="$router.push('/login')"
          >
            会员登录
          </n-button>
          <n-button 
            v-else
            @click="$router.push('/member')"
          >
            会员中心
          </n-button>
        </div>
      </nav>
    </header>

    <!-- 主要内容 -->
    <main class="main">
      <div class="container">
        <!-- 项目介绍 -->
        <section class="intro-section">
          <div class="intro-content">
            <h1 class="page-title">关于基石项目</h1>
            <p class="page-subtitle">
              基石项目是一个现代化的企业级管理系统解决方案，
              采用最新的前端技术栈构建，为企业提供完整的用户管理和系统监控功能。
            </p>
          </div>
          <div class="intro-image">
            <img src="/logo-full-300px.svg" alt="基石项目" />
          </div>
        </section>

        <!-- 技术栈 -->
        <section class="tech-section">
          <h2 class="section-title">技术栈</h2>
          <div class="tech-grid">
            <div class="tech-category">
              <h3>前端技术</h3>
              <div class="tech-list">
                <div class="tech-item">
                  <n-tag type="info">Vue 3</n-tag>
                  <span>渐进式JavaScript框架</span>
                </div>
                <div class="tech-item">
                  <n-tag type="info">TypeScript</n-tag>
                  <span>类型安全的JavaScript超集</span>
                </div>
                <div class="tech-item">
                  <n-tag type="info">Vite</n-tag>
                  <span>下一代前端构建工具</span>
                </div>
                <div class="tech-item">
                  <n-tag type="info">Naive UI</n-tag>
                  <span>Vue 3组件库</span>
                </div>
                <div class="tech-item">
                  <n-tag type="info">Pinia</n-tag>
                  <span>Vue状态管理库</span>
                </div>
              </div>
            </div>

            <div class="tech-category">
              <h3>后端技术</h3>
              <div class="tech-list">
                <div class="tech-item">
                  <n-tag type="success">Node.js</n-tag>
                  <span>JavaScript运行时环境</span>
                </div>
                <div class="tech-item">
                  <n-tag type="success">Express</n-tag>
                  <span>Web应用框架</span>
                </div>
                <div class="tech-item">
                  <n-tag type="success">Prisma</n-tag>
                  <span>现代数据库工具包</span>
                </div>
                <div class="tech-item">
                  <n-tag type="success">PostgreSQL</n-tag>
                  <span>开源关系型数据库</span>
                </div>
                <div class="tech-item">
                  <n-tag type="success">JWT</n-tag>
                  <span>JSON Web Token认证</span>
                </div>
              </div>
            </div>

            <div class="tech-category">
              <h3>开发工具</h3>
              <div class="tech-list">
                <div class="tech-item">
                  <n-tag type="warning">pnpm</n-tag>
                  <span>高效的包管理器</span>
                </div>
                <div class="tech-item">
                  <n-tag type="warning">ESLint</n-tag>
                  <span>代码质量检查工具</span>
                </div>
                <div class="tech-item">
                  <n-tag type="warning">Prettier</n-tag>
                  <span>代码格式化工具</span>
                </div>
                <div class="tech-item">
                  <n-tag type="warning">Docker</n-tag>
                  <span>容器化部署</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- 项目特性 -->
        <section class="features-section">
          <h2 class="section-title">项目特性</h2>
          <div class="features-list">
            <div class="feature-item">
              <n-icon :size="24" color="#18a058">
                <CheckmarkCircleOutline />
              </n-icon>
              <div class="feature-content">
                <h4>Monorepo架构</h4>
                <p>统一仓库管理多个服务，提高开发效率和代码复用性</p>
              </div>
            </div>
            
            <div class="feature-item">
              <n-icon :size="24" color="#18a058">
                <CheckmarkCircleOutline />
              </n-icon>
              <div class="feature-content">
                <h4>双JWT认证</h4>
                <p>管理员和会员分离的认证机制，确保系统安全性</p>
              </div>
            </div>
            
            <div class="feature-item">
              <n-icon :size="24" color="#18a058">
                <CheckmarkCircleOutline />
              </n-icon>
              <div class="feature-content">
                <h4>自定义标签页管理</h4>
                <p>基于Pinia的标签页管理器，支持状态持久化</p>
              </div>
            </div>
            
            <div class="feature-item">
              <n-icon :size="24" color="#18a058">
                <CheckmarkCircleOutline />
              </n-icon>
              <div class="feature-content">
                <h4>响应式设计</h4>
                <p>完美适配各种设备，提供一致的用户体验</p>
              </div>
            </div>
            
            <div class="feature-item">
              <n-icon :size="24" color="#18a058">
                <CheckmarkCircleOutline />
              </n-icon>
              <div class="feature-content">
                <h4>Docker部署</h4>
                <p>支持容器化部署，简化运维和扩展</p>
              </div>
            </div>
            
            <div class="feature-item">
              <n-icon :size="24" color="#18a058">
                <CheckmarkCircleOutline />
              </n-icon>
              <div class="feature-content">
                <h4>完整的测试覆盖</h4>
                <p>单元测试和E2E测试，确保代码质量</p>
              </div>
            </div>
          </div>
        </section>

        <!-- 项目信息 -->
        <section class="info-section">
          <h2 class="section-title">项目信息</h2>
          <div class="info-grid">
            <div class="info-card">
              <h4>版本信息</h4>
              <p>当前版本：v1.0.0</p>
              <p>发布日期：2024年</p>
            </div>
            
            <div class="info-card">
              <h4>开源协议</h4>
              <p>Apache License 2.0</p>
              <p>自由使用和修改</p>
            </div>
            
            <div class="info-card">
              <h4>技术支持</h4>
              <p>提供完整的技术文档</p>
              <p>持续更新和维护</p>
            </div>
          </div>
        </section>
      </div>
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
import { CheckmarkCircleOutline } from '@vicons/ionicons5'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
</script>

<style scoped>
.about-container {
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

.main {
  flex: 1;
  padding: 40px 0;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
}

.intro-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 60px;
  align-items: center;
  margin-bottom: 80px;
}

.page-title {
  font-size: 42px;
  font-weight: 700;
  color: #333;
  margin-bottom: 16px;
}

.page-subtitle {
  font-size: 18px;
  color: #666;
  line-height: 1.6;
}

.intro-image {
  text-align: center;
}

.intro-image img {
  max-width: 100%;
  height: auto;
}

.section-title {
  font-size: 32px;
  font-weight: 600;
  color: #333;
  margin-bottom: 40px;
  text-align: center;
}

.tech-section {
  margin-bottom: 80px;
}

.tech-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 40px;
}

.tech-category h3 {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin-bottom: 20px;
}

.tech-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.tech-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
}

.tech-item span {
  color: #666;
  font-size: 14px;
}

.features-section {
  margin-bottom: 80px;
}

.features-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 24px;
}

.feature-item {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 24px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.feature-content h4 {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.feature-content p {
  color: #666;
  line-height: 1.5;
}

.info-section {
  margin-bottom: 80px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 24px;
}

.info-card {
  background: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.info-card h4 {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 16px;
}

.info-card p {
  color: #666;
  margin-bottom: 8px;
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
  .intro-section {
    grid-template-columns: 1fr;
    gap: 40px;
    text-align: center;
  }
  
  .page-title {
    font-size: 32px;
  }
  
  .tech-grid {
    grid-template-columns: 1fr;
  }
  
  .features-list {
    grid-template-columns: 1fr;
  }
  
  .nav-menu {
    gap: 16px;
  }
  
  .nav-link {
    display: none;
  }
  
  .footer-content {
    flex-direction: column;
    gap: 16px;
    text-align: center;
  }
}
</style>
