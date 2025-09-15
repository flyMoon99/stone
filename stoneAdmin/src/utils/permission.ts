import { usePermissionStore } from '@/stores/permission'
import { useAuthStore } from '@/stores/auth'

// 权限检查选项
export interface PermissionOptions {
  // 权限检查
  permission?: string
  permissions?: string[]
  permissionMode?: 'any' | 'all'
  
  // 角色检查
  role?: string
  roles?: string[]
  
  // 菜单权限检查
  menu?: string
  
  // 自定义检查函数
  check?: () => boolean
  
  // 反向检查
  reverse?: boolean
}

// 权限检查工具类
export class PermissionChecker {
  private permissionStore = usePermissionStore()
  private authStore = useAuthStore()

  // 检查权限
  check(options: PermissionOptions): boolean {
    // 如果用户未认证，直接返回false
    if (!this.authStore.isAuthenticated) {
      return options.reverse ? true : false
    }

    let result = true

    // 自定义检查函数优先级最高
    if (options.check) {
      result = options.check()
    }
    // 单个权限检查
    else if (options.permission) {
      result = this.permissionStore.hasPermission(options.permission)
    }
    // 多个权限检查
    else if (options.permissions && options.permissions.length > 0) {
      if (options.permissionMode === 'all') {
        result = this.permissionStore.hasAllPermissions(options.permissions)
      } else {
        result = this.permissionStore.hasAnyPermission(options.permissions)
      }
    }
    // 单个角色检查
    else if (options.role) {
      result = this.permissionStore.hasRole(options.role)
    }
    // 多个角色检查
    else if (options.roles && options.roles.length > 0) {
      result = this.permissionStore.hasAnyRole(options.roles)
    }
    // 菜单权限检查
    else if (options.menu) {
      result = this.permissionStore.hasMenuPermission(options.menu)
    }

    // 反向检查
    return options.reverse ? !result : result
  }

  // 检查单个权限
  hasPermission(permission: string): boolean {
    return this.check({ permission })
  }

  // 检查任意权限
  hasAnyPermission(permissions: string[]): boolean {
    return this.check({ permissions, permissionMode: 'any' })
  }

  // 检查所有权限
  hasAllPermissions(permissions: string[]): boolean {
    return this.check({ permissions, permissionMode: 'all' })
  }

  // 检查角色
  hasRole(role: string): boolean {
    return this.check({ role })
  }

  // 检查任意角色
  hasAnyRole(roles: string[]): boolean {
    return this.check({ roles })
  }

  // 检查菜单权限
  hasMenuPermission(menu: string): boolean {
    return this.check({ menu })
  }

  // 检查是否为超级管理员
  isSuperAdmin(): boolean {
    return this.authStore.isSuperAdmin
  }

  // 检查是否已认证
  isAuthenticated(): boolean {
    return this.authStore.isAuthenticated
  }
}

// 创建权限检查器实例
export const createPermissionChecker = (): PermissionChecker => {
  return new PermissionChecker()
}

// 便捷的权限检查函数
export const usePermissionChecker = () => {
  const checker = createPermissionChecker()
  
  return {
    // 权限检查
    hasPermission: (permission: string) => checker.hasPermission(permission),
    hasAnyPermission: (permissions: string[]) => checker.hasAnyPermission(permissions),
    hasAllPermissions: (permissions: string[]) => checker.hasAllPermissions(permissions),
    
    // 角色检查
    hasRole: (role: string) => checker.hasRole(role),
    hasAnyRole: (roles: string[]) => checker.hasAnyRole(roles),
    
    // 菜单权限检查
    hasMenuPermission: (menu: string) => checker.hasMenuPermission(menu),
    
    // 状态检查
    isSuperAdmin: () => checker.isSuperAdmin(),
    isAuthenticated: () => checker.isAuthenticated(),
    
    // 通用检查
    check: (options: PermissionOptions) => checker.check(options)
  }
}

// 权限常量定义
export const PERMISSIONS = {
  // 系统管理
  SYSTEM: {
    MANAGE: 'system.manage',
    CONFIG: 'system.config',
    LOG: 'system.log'
  },
  
  // 用户管理
  USER: {
    LIST: 'user.list',
    CREATE: 'user.create',
    UPDATE: 'user.update',
    DELETE: 'user.delete',
    ASSIGN_ROLE: 'user.assign_role'
  },
  
  // 角色管理
  ROLE: {
    LIST: 'role.list',
    CREATE: 'role.create',
    UPDATE: 'role.update',
    DELETE: 'role.delete',
    ASSIGN_PERMISSION: 'role.assign_permission'
  },
  
  // 权限管理
  PERMISSION: {
    LIST: 'permission.list',
    CREATE: 'permission.create',
    UPDATE: 'permission.update',
    DELETE: 'permission.delete'
  },
  
  // 会员管理
  MEMBER: {
    LIST: 'user.list',
    CREATE: 'user.create',
    UPDATE: 'user.update',
    DELETE: 'user.delete'
  }
} as const

// 角色常量定义
export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'admin',
  USER_MANAGER: 'user_manager'
} as const

// 权限组合定义
export const PERMISSION_GROUPS = {
  // 用户管理权限组
  USER_MANAGEMENT: [
    PERMISSIONS.USER.LIST,
    PERMISSIONS.USER.CREATE,
    PERMISSIONS.USER.UPDATE,
    PERMISSIONS.USER.DELETE,
    PERMISSIONS.USER.ASSIGN_ROLE
  ],
  
  // 角色管理权限组
  ROLE_MANAGEMENT: [
    PERMISSIONS.ROLE.LIST,
    PERMISSIONS.ROLE.CREATE,
    PERMISSIONS.ROLE.UPDATE,
    PERMISSIONS.ROLE.DELETE,
    PERMISSIONS.ROLE.ASSIGN_PERMISSION
  ],
  
  // 权限管理权限组
  PERMISSION_MANAGEMENT: [
    PERMISSIONS.PERMISSION.LIST,
    PERMISSIONS.PERMISSION.CREATE,
    PERMISSIONS.PERMISSION.UPDATE,
    PERMISSIONS.PERMISSION.DELETE
  ],
  
  // 系统管理权限组
  SYSTEM_MANAGEMENT: [
    PERMISSIONS.SYSTEM.MANAGE,
    PERMISSIONS.SYSTEM.CONFIG,
    PERMISSIONS.SYSTEM.LOG
  ]
} as const

// 权限验证装饰器（用于方法）
export function RequirePermission(permission: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value
    
    descriptor.value = function (...args: any[]) {
      const checker = createPermissionChecker()
      
      if (!checker.hasPermission(permission)) {
        console.warn(`Permission denied: ${permission} required for ${propertyKey}`)
        return false
      }
      
      return originalMethod.apply(this, args)
    }
    
    return descriptor
  }
}

// 权限验证装饰器（用于角色）
export function RequireRole(role: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value
    
    descriptor.value = function (...args: any[]) {
      const checker = createPermissionChecker()
      
      if (!checker.hasRole(role)) {
        console.warn(`Role denied: ${role} required for ${propertyKey}`)
        return false
      }
      
      return originalMethod.apply(this, args)
    }
    
    return descriptor
  }
}
