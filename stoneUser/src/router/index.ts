import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// 路由配置
const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/Home.vue'),
    meta: {
      title: '首页'
    }
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: {
      title: '会员登录',
      requiresGuest: true // 需要未登录状态
    }
  },
  {
    path: '/member',
    name: 'MemberCenter',
    component: () => import('@/views/MemberCenter.vue'),
    meta: {
      title: '会员中心',
      requiresAuth: true // 需要登录
    }
  },
  {
    path: '/about',
    name: 'About',
    component: () => import('@/views/About.vue'),
    meta: {
      title: '关于我们'
    }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFound.vue'),
    meta: {
      title: '页面未找到'
    }
  }
]

// 创建路由实例
const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

// 路由守卫
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  
  // 去除调试输出，保持逻辑
  
  // 首次加载时恢复认证状态
  if (!authStore.token && !authStore.user) {
    await authStore.loadAuth()
  }

  // 如果已有 token 但用户信息尚未加载，主动拉取一次用户信息，避免竞态导致误判
  if (authStore.token && !authStore.user) {
    await authStore.fetchUserProfile()
  }
  
  // 设置页面标题
  if (to.meta.title) {
    document.title = `${to.meta.title} - 基石`
  }

  // 检查认证要求
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    // 需要登录但未登录，跳转到登录页
    next({ name: 'Login', query: { redirect: to.fullPath } })
    return
  }

  if (to.meta.requiresGuest && authStore.isAuthenticated) {
    // 需要未登录状态但已登录，跳转到会员中心
    next({ name: 'MemberCenter' })
    return
  }

  next()
})

export default router
