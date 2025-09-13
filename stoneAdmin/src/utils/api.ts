import axios from 'axios'
import type { AxiosResponse } from 'axios'
import type { 
  ApiResponse, 
  LoginRequest, 
  LoginResponse, 
  Admin,
  Member,
  PaginationParams
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
    const token = localStorage.getItem(STORAGE_KEYS.ADMIN_TOKEN)
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
  async (error) => {
    const originalRequest = error.config
    
    // 处理401未授权错误
    if (error.response?.status === HTTP_STATUS.UNAUTHORIZED) {
      // 如果是登录接口的401错误，不要自动跳转，让组件处理错误信息
      const isLoginRequest = error.config?.url?.includes('/login')
      const isRefreshRequest = error.config?.url?.includes('/refresh-token')
      
      if (!isLoginRequest && !isRefreshRequest && !originalRequest._retry) {
        originalRequest._retry = true
        
        // 尝试使用refresh token刷新access token
        const refreshToken = localStorage.getItem(STORAGE_KEYS.ADMIN_REFRESH_TOKEN)
        if (refreshToken) {
          try {
            const response = await api.post('/admin/refresh-token', { refreshToken })
            if (response.data.success) {
              const { token: newToken } = response.data.data
              localStorage.setItem(STORAGE_KEYS.ADMIN_TOKEN, newToken)
              originalRequest.headers.Authorization = `Bearer ${newToken}`
              return api(originalRequest)
            }
          } catch (refreshError) {
            // refresh token也失效了，清除所有token
            localStorage.removeItem(STORAGE_KEYS.ADMIN_TOKEN)
            localStorage.removeItem(STORAGE_KEYS.ADMIN_REFRESH_TOKEN)
            window.location.href = '/login'
            return Promise.reject(refreshError)
          }
        }
        
        // 没有refresh token，直接跳转到登录页
        localStorage.removeItem(STORAGE_KEYS.ADMIN_TOKEN)
        localStorage.removeItem(STORAGE_KEYS.ADMIN_REFRESH_TOKEN)
        window.location.href = '/login'
      }
    }
    
    return Promise.reject(error)
  }
)

// 管理员认证相关API
export const adminLogin = async (data: LoginRequest): Promise<ApiResponse<LoginResponse>> => {
  const response = await api.post('/admin/login', data)
  return response.data
}

export const getAdminProfile = async (): Promise<ApiResponse<Admin>> => {
  const response = await api.get('/admin/profile')
  return response.data
}

// 管理员管理API
export const getAdminList = async (params?: PaginationParams & {
  status?: string
  type?: string
}): Promise<ApiResponse> => {
  const response = await api.get('/admin/admins', { params })
  return response.data
}

export const getAdminById = async (id: string): Promise<ApiResponse<Admin>> => {
  const response = await api.get(`/admin/admins/${id}`)
  return response.data
}

export const createAdmin = async (data: {
  account: string
  password: string
  type?: string
}): Promise<ApiResponse<Admin>> => {
  const response = await api.post('/admin/admins', data)
  return response.data
}

export const updateAdmin = async (id: string, data: {
  account?: string
  password?: string
  type?: string
  status?: string
}): Promise<ApiResponse<Admin>> => {
  const response = await api.put(`/admin/admins/${id}`, data)
  return response.data
}

export const batchUpdateAdminStatus = async (data: {
  ids: string[]
  status: string
}): Promise<ApiResponse> => {
  const response = await api.patch('/admin/admins/batch-status', data)
  return response.data
}

// 会员管理API
export const getMemberList = async (params?: PaginationParams & {
  status?: string
}): Promise<ApiResponse> => {
  const response = await api.get('/admin/members', { params })
  return response.data
}

export const searchMembers = async (params?: PaginationParams & {
  keyword?: string
  status?: string
}): Promise<ApiResponse> => {
  const response = await api.get('/admin/members/search', { params })
  return response.data
}

export const getMemberById = async (id: string): Promise<ApiResponse<Member>> => {
  const response = await api.get(`/admin/members/${id}`)
  return response.data
}

export const createMember = async (data: {
  account: string
  password: string
}): Promise<ApiResponse<Member>> => {
  const response = await api.post('/admin/members', data)
  return response.data
}

export const updateMember = async (id: string, data: {
  account?: string
  password?: string
  status?: string
}): Promise<ApiResponse<Member>> => {
  const response = await api.put(`/admin/members/${id}`, data)
  return response.data
}

export const batchUpdateMemberStatus = async (data: {
  ids: string[]
  status: string
}): Promise<ApiResponse> => {
  const response = await api.patch('/admin/members/batch-status', data)
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
