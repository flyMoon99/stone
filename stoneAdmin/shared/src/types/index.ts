// 通用响应接口
export interface ApiResponse<T = any> {
  success: boolean
  data: T
  message: string
  code?: number
  timestamp: number
}

// 分页接口
export interface PaginationParams {
  page: number
  pageSize: number
}

export interface PaginationResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// 用户状态枚举
export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE'
}

// 管理员类型枚举
export enum AdminType {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN'
}

// 管理员接口
export interface Admin {
  id: string
  account: string
  type: AdminType
  createdAt: Date
  status: UserStatus
  lastLoginAt?: Date
}

// 会员接口
export interface Member {
  id: string
  account: string
  createdAt: Date
  status: UserStatus
  lastLoginAt?: Date
}

// JWT载荷接口
export interface JwtPayload {
  id: string
  account: string
  type?: AdminType
  iat?: number
  exp?: number
}

// 登录请求接口
export interface LoginRequest {
  account: string
  password: string
}

// 登录响应接口
export interface LoginResponse {
  token: string
  refreshToken?: string
  user: Admin | Member
}

// 标签页接口
export interface TabItem {
  id: string
  title: string
  path: string
  component: string
  params?: Record<string, any>
  query?: Record<string, any>
  cache?: any
  closable: boolean
  icon?: string
  keepAlive: boolean
}

// 标签页Store接口
export interface TabStore {
  tabs: TabItem[]
  activeTabId: string
  maxTabs: number
  cacheMap: Map<string, any>
}

// 日期格式化类型
export type DateFormatOptions = {
  year?: 'numeric' | '2-digit'
  month?: 'numeric' | '2-digit' | 'long' | 'short' | 'narrow'
  day?: 'numeric' | '2-digit'
  hour?: 'numeric' | '2-digit'
  minute?: 'numeric' | '2-digit'
  second?: 'numeric' | '2-digit'
}
