import axios from 'axios'
import type { AxiosResponse } from 'axios'
import type { 
  ApiResponse, 
  LoginRequest, 
  LoginResponse, 
  Member
} from '@stone/shared'
import {
  STORAGE_KEYS,
  HTTP_STATUS 
} from '@stone/shared'

// 创建axios实例
const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    // 添加认证token
    const token = localStorage.getItem(STORAGE_KEYS.MEMBER_TOKEN)
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    return response
  },
  (error) => {
    // 处理401未授权错误
    if (error.response?.status === HTTP_STATUS.UNAUTHORIZED) {
      // 如果是登录接口的401错误，不要自动跳转，让组件处理错误信息
      const isLoginRequest = error.config?.url?.includes('/login')
      
      if (!isLoginRequest) {
        // 非登录接口的401错误，清除token并跳转到登录页
        localStorage.removeItem(STORAGE_KEYS.MEMBER_TOKEN)
        window.location.href = '/login'
      }
    }
    
    return Promise.reject(error)
  }
)

// API方法

// 会员认证相关
export const memberLogin = async (data: LoginRequest): Promise<ApiResponse<LoginResponse>> => {
  const response = await api.post('/member/login', data)
  return response.data
}

export const getMemberProfile = async (): Promise<ApiResponse<Member>> => {
  const response = await api.get('/member/profile')
  return response.data
}

// 公共接口
export const getHealthCheck = async (): Promise<ApiResponse> => {
  const response = await api.get('/public/health')
  return response.data
}

export const getSystemInfo = async (): Promise<ApiResponse> => {
  const response = await api.get('/public/info')
  return response.data
}

// 导出axios实例供其他地方使用
export default api
