// API路径常量
export const API_PATHS = {
  // 管理员相关接口
  ADMIN: {
    LOGIN: '/api/admin/login',
    REFRESH: '/api/admin/refresh',
    PROFILE: '/api/admin/profile',
    LIST: '/api/admin/list',
    CREATE: '/api/admin/create',
    UPDATE: '/api/admin/update',
    DELETE: '/api/admin/delete'
  },
  // 会员相关接口
  MEMBER: {
    LOGIN: '/api/member/login',
    PROFILE: '/api/member/profile',
    LIST: '/api/member/list',
    CREATE: '/api/member/create',
    UPDATE: '/api/member/update',
    DELETE: '/api/member/delete'
  },
  // 公共接口
  PUBLIC: {
    HEALTH: '/api/public/health'
  }
} as const

// HTTP状态码
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500
} as const

// 错误码
export const ERROR_CODES = {
  // 认证相关
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  
  // 用户相关
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  USER_ALREADY_EXISTS: 'USER_ALREADY_EXISTS',
  USER_INACTIVE: 'USER_INACTIVE',
  
  // 通用错误
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  NOT_FOUND: 'NOT_FOUND'
} as const

// JWT配置常量
export const JWT_CONFIG = {
  ADMIN_EXPIRES_IN: '7d',
  MEMBER_EXPIRES_IN: '7d',
  REFRESH_THRESHOLD: '1d'
} as const

// 分页默认配置
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100
} as const

// 标签页配置
export const TAB_CONFIG = {
  MAX_TABS: 10,
  DEFAULT_TAB_ID: '/dashboard',
  CACHE_KEY: 'stone_admin_tabs'
} as const

// 本地存储键名
export const STORAGE_KEYS = {
  ADMIN_TOKEN: 'stone_admin_token',
  ADMIN_REFRESH_TOKEN: 'stone_admin_refresh_token',
  MEMBER_TOKEN: 'stone_member_token',
  TABS_STATE: 'stone_tabs_state',
  USER_PREFERENCES: 'stone_user_preferences'
} as const
