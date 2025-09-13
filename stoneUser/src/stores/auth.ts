import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { LoginRequest, LoginResponse, Member } from '@stone/shared'
import { STORAGE_KEYS } from '@stone/shared'
import { memberLogin, getMemberProfile } from '@/utils/api'

export const useAuthStore = defineStore('auth', () => {
  // 状态
  const token = ref<string | null>(null)
  const user = ref<Member | null>(null)
  const isLoading = ref(false)

  // 计算属性
  const isAuthenticated = computed(() => !!token.value && !!user.value)

  // 从本地存储加载认证信息
  const loadAuth = async (): Promise<void> => {
    const savedToken = localStorage.getItem(STORAGE_KEYS.MEMBER_TOKEN)
    if (savedToken) {
      token.value = savedToken
      // 验证token有效性并获取用户信息
      await fetchUserProfile()
    }
  }

  // 登录
  const login = async (loginData: LoginRequest): Promise<void> => {
    try {
      isLoading.value = true
      const response = await memberLogin(loginData)
      
      if (response.success) {
        const { token: newToken, user: userData } = response.data
        
        // 保存认证信息
        token.value = newToken
        user.value = userData as Member
        localStorage.setItem(STORAGE_KEYS.MEMBER_TOKEN, newToken)
        
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
    user.value = null
    localStorage.removeItem(STORAGE_KEYS.MEMBER_TOKEN)
  }

  // 获取用户信息
  const fetchUserProfile = async (): Promise<void> => {
    if (!token.value) return

    try {
      const response = await getMemberProfile()
      if (response.success) {
        user.value = response.data
      } else {
        // Token可能已过期，清除认证信息
        logout()
      }
    } catch (error: any) {
      // 只有在401未授权错误时才清除认证信息
      if (error?.response?.status === 401) {
        logout()
      }
    }
  }

  // 更新用户信息
  const updateUser = (userData: Partial<Member>) => {
    if (user.value) {
      user.value = { ...user.value, ...userData }
    }
  }

  // 在非测试环境下自动加载认证信息
  if (typeof window !== 'undefined' && !window.location.href.includes('test')) {
    loadAuth()
  }

  return {
    // 状态
    token,
    user,
    isLoading,
    
    // 计算属性
    isAuthenticated,
    
    // 方法
    login,
    logout,
    fetchUserProfile,
    updateUser,
    loadAuth
  }
})
