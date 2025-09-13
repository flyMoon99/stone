import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { LoginRequest, LoginResponse, Admin } from '@stone/shared'
import { STORAGE_KEYS } from '@stone/shared'
import { adminLogin, getAdminProfile } from '@/utils/api'

export const useAuthStore = defineStore('auth', () => {
  // 状态
  const token = ref<string | null>(null)
  const refreshToken = ref<string | null>(null)
  const user = ref<Admin | null>(null)
  const isLoading = ref(false)
  const isInitialized = ref(false)

  // 计算属性
  const isAuthenticated = computed(() => !!token.value && !!user.value)
  const isSuperAdmin = computed(() => user.value?.type === 'SUPER_ADMIN')

  // 从本地存储加载认证信息
  const loadAuth = async (): Promise<boolean> => {
    if (isInitialized.value) return isAuthenticated.value
    
    const savedToken = localStorage.getItem(STORAGE_KEYS.ADMIN_TOKEN)
    const savedRefreshToken = localStorage.getItem(STORAGE_KEYS.ADMIN_REFRESH_TOKEN)
    
    if (savedToken) {
      token.value = savedToken
      refreshToken.value = savedRefreshToken
      // 验证token有效性并获取用户信息
      const success = await fetchUserProfile()
      isInitialized.value = true
      return success
    }
    
    isInitialized.value = true
    return false
  }

  // 登录
  const login = async (loginData: LoginRequest): Promise<void> => {
    try {
      isLoading.value = true
      const response = await adminLogin(loginData)
      
      if (response.success) {
        const { token: newToken, refreshToken: newRefreshToken, user: userData } = response.data
        
        // 保存认证信息
        token.value = newToken
        refreshToken.value = newRefreshToken || null
        user.value = userData as Admin
        
        localStorage.setItem(STORAGE_KEYS.ADMIN_TOKEN, newToken)
        if (newRefreshToken) {
          localStorage.setItem(STORAGE_KEYS.ADMIN_REFRESH_TOKEN, newRefreshToken)
        }
        
        return Promise.resolve()
      } else {
        return Promise.reject(new Error(response.message))
      }
    } catch (error: any) {
      // 提取后端返回的错误信息
      let errorMessage = '登录失败'
      
      if (error.response?.data?.message) {
        // 后端返回的错误信息
        errorMessage = error.response.data.message
      } else if (error.message) {
        // axios或其他错误
        errorMessage = error.message
      }
      
      // 将英文错误信息转换为中文
      if (errorMessage === 'Invalid credentials') {
        errorMessage = '用户名或密码错误'
      } else if (errorMessage === 'Account is disabled') {
        errorMessage = '账户已被禁用'
      }
      
      return Promise.reject(new Error(errorMessage))
    } finally {
      isLoading.value = false
    }
  }

  // 登出
  const logout = () => {
    token.value = null
    refreshToken.value = null
    user.value = null
    isInitialized.value = true
    localStorage.removeItem(STORAGE_KEYS.ADMIN_TOKEN)
    localStorage.removeItem(STORAGE_KEYS.ADMIN_REFRESH_TOKEN)
  }

  // 获取用户信息
  const fetchUserProfile = async (): Promise<boolean> => {
    if (!token.value) {
      return false
    }

    try {
      const response = await getAdminProfile()
      
      if (response.success) {
        const userData = response.data
        
        // 手动构造Admin对象，处理日期类型转换
        const adminUser: Admin = {
          id: userData.id,
          account: userData.account,
          type: userData.type,
          createdAt: new Date(userData.createdAt),
          status: userData.status,
          lastLoginAt: userData.lastLoginAt ? new Date(userData.lastLoginAt) : undefined
        }
        
        user.value = adminUser
        return true
      } else {
        // Token可能已过期，清除认证信息
        token.value = null
        refreshToken.value = null
        user.value = null
        localStorage.removeItem(STORAGE_KEYS.ADMIN_TOKEN)
        localStorage.removeItem(STORAGE_KEYS.ADMIN_REFRESH_TOKEN)
        return false
      }
    } catch (error) {
      // 获取用户信息失败，清除认证信息
      token.value = null
      refreshToken.value = null
      user.value = null
      localStorage.removeItem(STORAGE_KEYS.ADMIN_TOKEN)
      localStorage.removeItem(STORAGE_KEYS.ADMIN_REFRESH_TOKEN)
      return false
    }
  }

  // 更新用户信息
  const updateUser = (userData: Partial<Admin>) => {
    if (user.value) {
      user.value = { ...user.value, ...userData }
    }
  }

  // 检查权限
  const hasPermission = (permission: string): boolean => {
    if (!user.value) return false
    
    // 超级管理员拥有所有权限
    if (user.value.type === 'SUPER_ADMIN') return true
    
    // 这里可以扩展更复杂的权限检查逻辑
    return true
  }

  // 不在这里初始化，改为在路由守卫中按需初始化

  return {
    // 状态
    token,
    refreshToken,
    user,
    isLoading,
    isInitialized,
    
    // 计算属性
    isAuthenticated,
    isSuperAdmin,
    
    // 方法
    login,
    logout,
    fetchUserProfile,
    updateUser,
    hasPermission,
    loadAuth
  }
})
