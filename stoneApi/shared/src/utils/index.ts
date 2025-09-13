import type { ApiResponse, PaginationResponse } from '../types'

// 创建标准API响应
export function createApiResponse<T>(
  success: boolean,
  data: T,
  message: string,
  code?: number
): ApiResponse<T> {
  return {
    success,
    data,
    message,
    code,
    timestamp: Date.now()
  }
}

// 创建成功响应
export function createSuccessResponse<T>(data: T, message = 'Success'): ApiResponse<T> {
  return createApiResponse(true, data, message)
}

// 创建错误响应
export function createErrorResponse<T = null>(
  message: string,
  code?: number,
  data: T = null as T
): ApiResponse<T> {
  return createApiResponse(false, data, message, code)
}

// 创建分页响应
export function createPaginationResponse<T>(
  items: T[],
  total: number,
  page: number,
  pageSize: number
): PaginationResponse<T> {
  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize)
  }
}

// 生成随机ID
export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

// 格式化日期
export function formatDate(date: Date | string, format = 'YYYY-MM-DD HH:mm:ss'): string {
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  const seconds = String(d.getSeconds()).padStart(2, '0')

  return format
    .replace('YYYY', year.toString())
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds)
}

// 深拷贝对象
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj
  if (obj instanceof Date) return new Date(obj.getTime()) as unknown as T
  if (obj instanceof Array) return obj.map(item => deepClone(item)) as unknown as T
  if (typeof obj === 'object') {
    const clonedObj = {} as T
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key])
      }
    }
    return clonedObj
  }
  return obj
}

// 防抖函数
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), delay)
  }
}

// 节流函数
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0
  return (...args: Parameters<T>) => {
    const now = Date.now()
    if (now - lastCall >= delay) {
      lastCall = now
      func(...args)
    }
  }
}

// 验证邮箱格式
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// 验证手机号格式（中国大陆）
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^1[3-9]\d{9}$/
  return phoneRegex.test(phone)
}

// 生成密码哈希（简单示例，实际应用中应使用bcrypt等库）
export function hashPassword(password: string): string {
  // 这里只是示例，实际应用中应该使用更安全的哈希算法
  if (typeof globalThis !== 'undefined' && 'btoa' in globalThis) {
    return (globalThis as any).btoa(password)
  }
  // Node.js环境需要单独处理
  throw new Error('Password hashing not supported in this environment')
}

// 验证密码强度
export function validatePasswordStrength(password: string): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []
  
  if (password.length < 8) {
    errors.push('密码长度至少8位')
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('密码必须包含大写字母')
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('密码必须包含小写字母')
  }
  
  if (!/\d/.test(password)) {
    errors.push('密码必须包含数字')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}
