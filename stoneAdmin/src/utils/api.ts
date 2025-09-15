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
            try {
              // 延迟加载，避免循环依赖
              const { useTabsStore } = await import('@/stores/tabs')
              useTabsStore().clearAll()
            } catch {}
            window.location.href = '/login'
            return Promise.reject(refreshError)
          }
        }
        
        // 没有refresh token，直接跳转到登录页
        localStorage.removeItem(STORAGE_KEYS.ADMIN_TOKEN)
        localStorage.removeItem(STORAGE_KEYS.ADMIN_REFRESH_TOKEN)
        try {
          const { useTabsStore } = await import('@/stores/tabs')
          useTabsStore().clearAll()
        } catch {}
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

// 角色管理API
export const getRoleList = async (params?: PaginationParams & {
  keyword?: string
  status?: boolean
}): Promise<ApiResponse> => {
  const response = await api.get('/rbac/roles', { params })
  return response.data
}

export const getRoleById = async (id: string): Promise<ApiResponse> => {
  const response = await api.get(`/rbac/roles/${id}`)
  return response.data
}

export const createRole = async (data: {
  name: string
  code: string
  description?: string
}): Promise<ApiResponse> => {
  const response = await api.post('/rbac/roles', data)
  return response.data
}

export const updateRole = async (id: string, data: {
  name?: string
  description?: string
  status?: boolean
}): Promise<ApiResponse> => {
  const response = await api.put(`/rbac/roles/${id}`, data)
  return response.data
}

export const deleteRole = async (id: string): Promise<ApiResponse> => {
  const response = await api.delete(`/rbac/roles/${id}`)
  return response.data
}

export const batchUpdateRoleStatus = async (data: {
  ids: string[]
  status: boolean
}): Promise<ApiResponse> => {
  const response = await api.patch('/rbac/roles/batch-status', data)
  return response.data
}

export const getAvailableRoles = async (): Promise<ApiResponse> => {
  const response = await api.get('/rbac/roles/available')
  return response.data
}

export const assignPermissionsToRole = async (roleId: string, data: {
  permissionIds: string[]
}): Promise<ApiResponse> => {
  const response = await api.post(`/rbac/roles/${roleId}/permissions`, data)
  return response.data
}

export const getRolePermissions = async (roleId: string): Promise<ApiResponse> => {
  const response = await api.get(`/rbac/roles/${roleId}/permissions`)
  return response.data
}

// 权限管理API
export const getPermissionList = async (params?: PaginationParams & {
  name?: string
  key?: string
  type?: string
  enabled?: boolean
}): Promise<ApiResponse> => {
  const response = await api.get('/rbac/permissions', { params })
  return response.data
}

export const getPermissionTree = async (): Promise<ApiResponse> => {
  const response = await api.get('/rbac/permissions/tree')
  return response.data
}

export const getMenuPermissions = async (): Promise<ApiResponse> => {
  const response = await api.get('/rbac/permissions/menu')
  return response.data
}

export const getPermissionById = async (id: string): Promise<ApiResponse> => {
  const response = await api.get(`/rbac/permissions/${id}`)
  return response.data
}

export const createPermission = async (data: {
  key: string
  name: string
  type: string
  parentId?: string
  path?: string
  method?: string
  order?: number
}): Promise<ApiResponse> => {
  const response = await api.post('/rbac/permissions', data)
  return response.data
}

export const updatePermission = async (id: string, data: {
  name?: string
  parentId?: string
  path?: string
  method?: string
  order?: number
  enabled?: boolean
}): Promise<ApiResponse> => {
  const response = await api.put(`/rbac/permissions/${id}`, data)
  return response.data
}

export const deletePermission = async (id: string): Promise<ApiResponse> => {
  const response = await api.delete(`/rbac/permissions/${id}`)
  return response.data
}

export const batchUpdatePermissionStatus = async (data: {
  ids: string[]
  enabled: boolean
}): Promise<ApiResponse> => {
  const response = await api.patch('/rbac/permissions/batch-status', data)
  return response.data
}

// 用户权限管理API
export const assignRolesToUser = async (userId: string, data: {
  roleIds: string[]
}): Promise<ApiResponse> => {
  const response = await api.post(`/rbac/users/${userId}/roles`, data)
  return response.data
}

export const getUserRoles = async (userId: string): Promise<ApiResponse> => {
  const response = await api.get(`/rbac/users/${userId}/roles`)
  return response.data
}

export const addUserRole = async (userId: string, data: {
  roleId: string
}): Promise<ApiResponse> => {
  const response = await api.post(`/rbac/users/${userId}/add-role`, data)
  return response.data
}

export const removeUserRole = async (userId: string, roleId: string): Promise<ApiResponse> => {
  const response = await api.delete(`/rbac/users/${userId}/roles/${roleId}`)
  return response.data
}

export const getUserPermissions = async (userId: string): Promise<ApiResponse> => {
  const response = await api.get(`/rbac/users/${userId}/permissions`)
  return response.data
}

export const getUserMenuPermissions = async (userId: string): Promise<ApiResponse> => {
  const response = await api.get(`/rbac/users/${userId}/menu-permissions`)
  return response.data
}

export const checkUserPermission = async (userId: string, data: {
  permission: string
}): Promise<ApiResponse> => {
  const response = await api.post(`/rbac/users/${userId}/check-permission`, data)
  return response.data
}

export const checkUserAnyPermission = async (userId: string, data: {
  permissions: string[]
}): Promise<ApiResponse> => {
  const response = await api.post(`/rbac/users/${userId}/check-any-permission`, data)
  return response.data
}

export const checkUserAllPermissions = async (userId: string, data: {
  permissions: string[]
}): Promise<ApiResponse> => {
  const response = await api.post(`/rbac/users/${userId}/check-all-permissions`, data)
  return response.data
}

export const batchAssignRolesToUsers = async (data: {
  userIds: string[]
  roleIds: string[]
}): Promise<ApiResponse> => {
  const response = await api.post('/rbac/users/batch-assign-roles', data)
  return response.data
}

export const getUsersByPermission = async (permissionKey: string, params?: PaginationParams): Promise<ApiResponse> => {
  const response = await api.get(`/rbac/permissions/${permissionKey}/users`, { params })
  return response.data
}

export const getUsersByRole = async (roleCode: string, params?: PaginationParams): Promise<ApiResponse> => {
  const response = await api.get(`/rbac/roles/${roleCode}/users`, { params })
  return response.data
}

// 导出axios实例供其他地方使用
export default api
