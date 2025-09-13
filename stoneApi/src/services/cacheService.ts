import { PERFORMANCE_CONFIG } from '../config/performance'

// 缓存项接口
interface CacheItem<T> {
  data: T
  timestamp: number
  ttl: number
}

// 内存缓存服务
export class MemoryCacheService {
  private static instance: MemoryCacheService
  private cache: Map<string, CacheItem<any>> = new Map()
  private cleanupInterval: NodeJS.Timeout

  private constructor() {
    // 启动清理定时器
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 60000) // 每分钟清理一次过期缓存
  }

  static getInstance(): MemoryCacheService {
    if (!MemoryCacheService.instance) {
      MemoryCacheService.instance = new MemoryCacheService()
    }
    return MemoryCacheService.instance
  }

  // 设置缓存
  set<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): void {
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      ttl
    }
    this.cache.set(key, item)
  }

  // 获取缓存
  get<T>(key: string): T | null {
    const item = this.cache.get(key)
    
    if (!item) {
      return null
    }

    // 检查是否过期
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key)
      return null
    }

    return item.data as T
  }

  // 删除缓存
  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  // 清空所有缓存
  clear(): void {
    this.cache.clear()
  }

  // 检查缓存是否存在
  has(key: string): boolean {
    const item = this.cache.get(key)
    
    if (!item) {
      return false
    }

    // 检查是否过期
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key)
      return false
    }

    return true
  }

  // 获取缓存统计信息
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    }
  }

  // 清理过期缓存
  private cleanup(): void {
    const now = Date.now()
    const expiredKeys: string[] = []

    for (const [key, item] of this.cache) {
      if (now - item.timestamp > item.ttl) {
        expiredKeys.push(key)
      }
    }

    expiredKeys.forEach(key => this.cache.delete(key))

    if (expiredKeys.length > 0) {
      console.log(`Cleaned up ${expiredKeys.length} expired cache items`)
    }
  }

  // 销毁缓存服务
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }
    this.cache.clear()
  }
}

// 权限缓存服务
export class PermissionCacheService {
  private cache: MemoryCacheService

  constructor() {
    this.cache = MemoryCacheService.getInstance()
  }

  // 缓存用户权限
  cacheUserPermissions(userId: string, permissions: any): void {
    const key = `user_permissions:${userId}`
    this.cache.set(key, permissions, PERFORMANCE_CONFIG.CACHE.USER_PERMISSION_TTL)
  }

  // 获取用户权限缓存
  getUserPermissions(userId: string): any | null {
    const key = `user_permissions:${userId}`
    return this.cache.get(key)
  }

  // 缓存用户角色
  cacheUserRoles(userId: string, roles: any[]): void {
    const key = `user_roles:${userId}`
    this.cache.set(key, roles, PERFORMANCE_CONFIG.CACHE.ROLE_TTL)
  }

  // 获取用户角色缓存
  getUserRoles(userId: string): any[] | null {
    const key = `user_roles:${userId}`
    return this.cache.get(key)
  }

  // 缓存权限树
  cachePermissionTree(tree: any[]): void {
    const key = 'permission_tree'
    this.cache.set(key, tree, PERFORMANCE_CONFIG.CACHE.PERMISSION_TTL)
  }

  // 获取权限树缓存
  getPermissionTree(): any[] | null {
    const key = 'permission_tree'
    return this.cache.get(key)
  }

  // 缓存菜单权限
  cacheMenuPermissions(userId: string, menuPermissions: any[]): void {
    const key = `menu_permissions:${userId}`
    this.cache.set(key, menuPermissions, PERFORMANCE_CONFIG.CACHE.MENU_PERMISSION_TTL)
  }

  // 获取菜单权限缓存
  getMenuPermissions(userId: string): any[] | null {
    const key = `menu_permissions:${userId}`
    return this.cache.get(key)
  }

  // 缓存角色权限
  cacheRolePermissions(roleId: string, permissions: any[]): void {
    const key = `role_permissions:${roleId}`
    this.cache.set(key, permissions, PERFORMANCE_CONFIG.CACHE.PERMISSION_TTL)
  }

  // 获取角色权限缓存
  getRolePermissions(roleId: string): any[] | null {
    const key = `role_permissions:${roleId}`
    return this.cache.get(key)
  }

  // 缓存权限检查结果
  cachePermissionCheck(userId: string, permission: string, result: boolean): void {
    const key = `permission_check:${userId}:${permission}`
    this.cache.set(key, result, PERFORMANCE_CONFIG.CACHE.USER_PERMISSION_TTL)
  }

  // 获取权限检查缓存
  getPermissionCheck(userId: string, permission: string): boolean | null {
    const key = `permission_check:${userId}:${permission}`
    return this.cache.get(key)
  }

  // 清除用户相关缓存
  clearUserCache(userId: string): void {
    const patterns = [
      `user_permissions:${userId}`,
      `user_roles:${userId}`,
      `menu_permissions:${userId}`
    ]

    patterns.forEach(pattern => {
      this.cache.delete(pattern)
    })

    // 清除权限检查缓存
    const stats = this.cache.getStats()
    const permissionCheckKeys = stats.keys.filter(key => 
      key.startsWith(`permission_check:${userId}:`)
    )
    
    permissionCheckKeys.forEach(key => this.cache.delete(key))
  }

  // 清除角色相关缓存
  clearRoleCache(roleId?: string): void {
    if (roleId) {
      this.cache.delete(`role_permissions:${roleId}`)
    }
    
    // 清除权限树缓存（因为角色变更可能影响权限树）
    this.cache.delete('permission_tree')
  }

  // 清除权限相关缓存
  clearPermissionCache(): void {
    this.cache.delete('permission_tree')
    
    // 清除所有角色权限缓存
    const stats = this.cache.getStats()
    const rolePermissionKeys = stats.keys.filter(key => 
      key.startsWith('role_permissions:')
    )
    
    rolePermissionKeys.forEach(key => this.cache.delete(key))
  }

  // 获取缓存统计信息
  getCacheStats(): any {
    const stats = this.cache.getStats()
    const categorizedStats = {
      total: stats.size,
      userPermissions: 0,
      userRoles: 0,
      menuPermissions: 0,
      rolePermissions: 0,
      permissionChecks: 0,
      permissionTree: 0,
      other: 0
    }

    stats.keys.forEach(key => {
      if (key.startsWith('user_permissions:')) {
        categorizedStats.userPermissions++
      } else if (key.startsWith('user_roles:')) {
        categorizedStats.userRoles++
      } else if (key.startsWith('menu_permissions:')) {
        categorizedStats.menuPermissions++
      } else if (key.startsWith('role_permissions:')) {
        categorizedStats.rolePermissions++
      } else if (key.startsWith('permission_check:')) {
        categorizedStats.permissionChecks++
      } else if (key === 'permission_tree') {
        categorizedStats.permissionTree++
      } else {
        categorizedStats.other++
      }
    })

    return categorizedStats
  }
}

// 缓存装饰器
export function Cacheable(ttl: number = 5 * 60 * 1000) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value
    const cache = MemoryCacheService.getInstance()

    descriptor.value = async function (...args: any[]) {
      // 生成缓存键
      const cacheKey = `${target.constructor.name}:${propertyKey}:${JSON.stringify(args)}`
      
      // 尝试从缓存获取
      const cachedResult = cache.get(cacheKey)
      if (cachedResult !== null) {
        return cachedResult
      }

      // 执行原方法
      const result = await originalMethod.apply(this, args)
      
      // 缓存结果
      cache.set(cacheKey, result, ttl)
      
      return result
    }

    return descriptor
  }
}

// 缓存失效装饰器
export function CacheEvict(patterns: string[]) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value
    const cache = MemoryCacheService.getInstance()

    descriptor.value = async function (...args: any[]) {
      // 执行原方法
      const result = await originalMethod.apply(this, args)
      
      // 清除相关缓存
      const stats = cache.getStats()
      patterns.forEach(pattern => {
        const keysToDelete = stats.keys.filter(key => {
          // 支持简单的通配符匹配
          const regex = new RegExp(pattern.replace('*', '.*'))
          return regex.test(key)
        })
        
        keysToDelete.forEach(key => cache.delete(key))
      })
      
      return result
    }

    return descriptor
  }
}

// 导出缓存服务实例
export const permissionCache = new PermissionCacheService()
export const memoryCache = MemoryCacheService.getInstance()
