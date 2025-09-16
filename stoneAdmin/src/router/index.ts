import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useTabsStore } from '@/stores/tabs'
import { usePermissionStore } from '@/stores/permission'

// 路由配置
const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: {
      title: '管理员登录',
      requiresGuest: true // 需要未登录状态
    }
  },
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/layouts/AdminLayout.vue'),
    meta: {
      title: '首页',
      requiresAuth: true,
      icon: 'dashboard'
    },
    children: [
      {
        path: '',
        name: 'DashboardHome',
        component: () => import('@/views/Dashboard.vue'),
        meta: {
          title: '首页',
          keepAlive: true
        }
      }
    ]
  },
  {
    path: '/admin',
    component: () => import('@/layouts/AdminLayout.vue'),
    meta: {
      requiresAuth: true
    },
    children: [
      // 管理员管理
      {
        path: 'admins',
        name: 'AdminManagement',
        component: () => import('@/views/admin/AdminManagement.vue'),
        meta: {
          title: '管理员管理',
          requiresAuth: true,
          requiresPermission: 'admin.list', // 需要管理员列表权限
          keepAlive: true
        }
      },
      // 会员管理
      {
        path: 'members',
        name: 'MemberManagement',
        component: () => import('@/views/admin/MemberManagement.vue'),
        meta: {
          title: '会员管理',
          requiresAuth: true,
          keepAlive: true
        }
      },
      // 角色管理
      {
        path: 'roles',
        name: 'RoleManagement',
        component: () => import('@/views/admin/RoleManagement.vue'),
        meta: {
          title: '角色管理',
          requiresAuth: true,
          requiresPermission: 'role.list', // 需要角色列表权限
          keepAlive: true
        }
      },
      // 权限管理
      {
        path: 'permissions',
        name: 'PermissionManagement',
        component: () => import('@/views/admin/PermissionManagement.vue'),
        meta: {
          title: '权限管理',
          requiresAuth: true,
          requiresPermission: 'permission.list', // 需要权限列表权限
          keepAlive: true
        }
      },
      // 用户权限分配
      {
        path: 'user-permissions',
        name: 'UserPermissionManagement',
        component: () => import('@/views/admin/UserPermissionManagement.vue'),
        meta: {
          title: '用户权限分配',
          requiresAuth: true,
          requiresPermission: 'user-permission.list', // 需要用户权限列表权限
          keepAlive: true
        }
      }
    ]
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/layouts/AdminLayout.vue'),
    meta: {
      requiresAuth: true
    },
    children: [
      {
        path: '',
        name: 'ProfileHome',
        component: () => import('@/views/Profile.vue'),
        meta: {
          title: '个人资料',
          requiresAuth: true,
          keepAlive: true
        }
      }
    ]
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
  const tabsStore = useTabsStore()
  const permissionStore = usePermissionStore()
  
  // 确保认证状态已初始化
  if (!authStore.isInitialized) {
    await authStore.loadAuth()
  }
  
  // 如果即将进入登录页，则清空上一次会话的标签
  if (to.name === 'Login') {
    try { tabsStore.clearAll() } catch {}
  }
  
  // 设置页面标题
  if (to.meta.title) {
    document.title = `${to.meta.title} - 基石管理后台`
  }

  // 检查认证要求
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    // 需要登录但未登录，跳转到登录页，并清空标签
    try { tabsStore.clearAll() } catch {}
    next({ name: 'Login', query: { redirect: to.fullPath } })
    return
  }

  if (to.meta.requiresGuest && authStore.isAuthenticated) {
    // 需要未登录状态但已登录，跳转到首页
    next({ name: 'Dashboard' })
    return
  }

  // 检查超级管理员权限
  if (to.meta.requiresSuperAdmin && !authStore.isSuperAdmin) {
    // 需要超级管理员权限但当前用户不是超级管理员
    next({ name: 'Dashboard' })
    return
  }

  // 检查特定权限
  if (to.meta.requiresPermission && !authStore.isSuperAdmin) {
    // 确保权限数据已加载
    if (!permissionStore.isInitialized) {
      await permissionStore.fetchUserPermissions()
    }
    
    // 检查是否有所需权限
    const requiredPermission = to.meta.requiresPermission as string
    if (!permissionStore.hasPermission(requiredPermission)) {
      // 没有所需权限，跳转到首页
      next({ name: 'Dashboard' })
      return
    }
  }

  next()
})

// 路由后置守卫
router.afterEach((to) => {
  const authStore = useAuthStore()
  const tabsStore = useTabsStore()
  
  // 如果用户已登录且不是登录页面，添加到标签页
  if (authStore.isAuthenticated && to.name !== 'Login' && to.meta?.requiresAuth) {
    // 无论是路由跳转还是页面刷新，都确保标签页被正确添加
    tabsStore.addTab(to)
  }
})

export default router
