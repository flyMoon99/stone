import { Request, Response, NextFunction } from 'express'
import { createErrorResponse, HTTP_STATUS } from '@stone/shared'
import { 
  checkUserPermission, 
  checkUserAnyPermission, 
  checkUserAllPermissions,
  getUserPermissions 
} from '../services/userPermissionService'
import { logger } from '../utils/logger'

// 权限检查选项
export interface PermissionOptions {
  permissions: string | string[]
  mode?: 'any' | 'all' // 默认为 'any'
  skipSuperAdmin?: boolean // 是否跳过超级管理员检查，默认为 false
}

// 动态权限检查中间件工厂函数
export function requirePermission(options: PermissionOptions) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // 检查用户是否已认证
      if (!req.admin?.id) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json(
          createErrorResponse('Authentication required', HTTP_STATUS.UNAUTHORIZED)
        )
      }

      const userId = req.admin.id
      const { permissions, mode = 'any', skipSuperAdmin = false } = options

      // 如果不跳过超级管理员检查，且用户是超级管理员，则直接通过
      if (!skipSuperAdmin && req.admin.type === 'SUPER_ADMIN') {
        logger.debug(`Super admin access granted: ${req.admin.account} (${userId})`)
        return next()
      }

      // 标准化权限为数组
      const permissionArray = Array.isArray(permissions) ? permissions : [permissions]

      let hasPermission = false

      // 根据模式检查权限
      if (mode === 'all') {
        hasPermission = await checkUserAllPermissions(userId, permissionArray)
      } else {
        hasPermission = await checkUserAnyPermission(userId, permissionArray)
      }

      if (!hasPermission) {
        logger.warn(`Permission denied: ${req.admin.account} (${userId}) - Required: ${permissionArray.join(', ')} (${mode})`)
        return res.status(HTTP_STATUS.FORBIDDEN).json(
          createErrorResponse('Insufficient permissions', HTTP_STATUS.FORBIDDEN)
        )
      }

      logger.debug(`Permission granted: ${req.admin.account} (${userId}) - ${permissionArray.join(', ')} (${mode})`)
      next()
    } catch (error) {
      logger.error('Permission check error:', error)
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
        createErrorResponse('Permission check failed', HTTP_STATUS.INTERNAL_SERVER_ERROR)
      )
    }
  }
}

// 便捷的权限检查中间件
export const requireAnyPermission = (permissions: string | string[]) => {
  return requirePermission({ permissions, mode: 'any' })
}

export const requireAllPermissions = (permissions: string | string[]) => {
  return requirePermission({ permissions, mode: 'all' })
}

// 资源权限检查中间件（基于路径和方法）
export function requireResourcePermission(resource: string, action?: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // 检查用户是否已认证
      if (!req.admin?.id) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json(
          createErrorResponse('Authentication required', HTTP_STATUS.UNAUTHORIZED)
        )
      }

      const userId = req.admin.id

      // 超级管理员直接通过
      if (req.admin.type === 'SUPER_ADMIN') {
        logger.debug(`Super admin resource access granted: ${req.admin.account} (${userId})`)
        return next()
      }

      // 根据HTTP方法确定操作类型
      const httpMethod = req.method.toLowerCase()
      const actionType = action || getActionFromMethod(httpMethod)
      
      // 构建权限key
      const permissionKey = `${resource}.${actionType}`

      // 检查权限
      const hasPermission = await checkUserPermission(userId, permissionKey)

      if (!hasPermission) {
        logger.warn(`Resource permission denied: ${req.admin.account} (${userId}) - ${permissionKey}`)
        return res.status(HTTP_STATUS.FORBIDDEN).json(
          createErrorResponse('Insufficient permissions for this resource', HTTP_STATUS.FORBIDDEN)
        )
      }

      logger.debug(`Resource permission granted: ${req.admin.account} (${userId}) - ${permissionKey}`)
      next()
    } catch (error) {
      logger.error('Resource permission check error:', error)
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
        createErrorResponse('Resource permission check failed', HTTP_STATUS.INTERNAL_SERVER_ERROR)
      )
    }
  }
}

// 根据HTTP方法获取操作类型
function getActionFromMethod(method: string): string {
  switch (method) {
    case 'get':
      return 'read'
    case 'post':
      return 'create'
    case 'put':
    case 'patch':
      return 'update'
    case 'delete':
      return 'delete'
    default:
      return 'read'
  }
}

// 角色检查中间件
export function requireRole(roleCode: string | string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // 检查用户是否已认证
      if (!req.admin?.id) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json(
          createErrorResponse('Authentication required', HTTP_STATUS.UNAUTHORIZED)
        )
      }

      const userId = req.admin.id

      // 超级管理员直接通过
      if (req.admin.type === 'SUPER_ADMIN') {
        logger.debug(`Super admin role access granted: ${req.admin.account} (${userId})`)
        return next()
      }

      // 获取用户权限信息
      const userPermissions = await getUserPermissions(userId)
      
      if (!userPermissions) {
        return res.status(HTTP_STATUS.FORBIDDEN).json(
          createErrorResponse('User permissions not found', HTTP_STATUS.FORBIDDEN)
        )
      }

      // 标准化角色为数组
      const roleCodes = Array.isArray(roleCode) ? roleCode : [roleCode]
      
      // 检查用户是否拥有任一所需角色
      const hasRole = userPermissions.roles.some(role => roleCodes.includes(role.code))

      if (!hasRole) {
        logger.warn(`Role access denied: ${req.admin.account} (${userId}) - Required roles: ${roleCodes.join(', ')}`)
        return res.status(HTTP_STATUS.FORBIDDEN).json(
          createErrorResponse('Insufficient role permissions', HTTP_STATUS.FORBIDDEN)
        )
      }

      logger.debug(`Role access granted: ${req.admin.account} (${userId}) - ${roleCodes.join(', ')}`)
      next()
    } catch (error) {
      logger.error('Role check error:', error)
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
        createErrorResponse('Role check failed', HTTP_STATUS.INTERNAL_SERVER_ERROR)
      )
    }
  }
}

// 条件权限检查中间件
export function requirePermissionIf(
  condition: (req: Request) => boolean,
  permissions: string | string[],
  mode: 'any' | 'all' = 'any'
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // 如果条件不满足，直接通过
    if (!condition(req)) {
      return next()
    }

    // 否则进行权限检查
    return requirePermission({ permissions, mode })(req, res, next)
  }
}

// 权限缓存中间件（可选，用于性能优化）
const permissionCache = new Map<string, { permissions: string[], timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5分钟缓存

export function withPermissionCache(middleware: any) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.admin?.id) {
      return middleware(req, res, next)
    }

    const userId = req.admin.id
    const cacheKey = `user_permissions_${userId}`
    const cached = permissionCache.get(cacheKey)

    // 检查缓存是否有效
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      // 将缓存的权限添加到请求对象中
      req.userPermissions = cached.permissions
      logger.debug(`Using cached permissions for user: ${userId}`)
    } else {
      // 清除过期缓存
      permissionCache.delete(cacheKey)
    }

    return middleware(req, res, next)
  }
}

// 扩展Request接口以包含用户权限信息
declare global {
  namespace Express {
    interface Request {
      userPermissions?: string[]
    }
  }
}

// 批量权限检查中间件（用于复杂的权限逻辑）
export function requireComplexPermission(
  permissionLogic: (userPermissions: string[]) => boolean,
  errorMessage?: string
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // 检查用户是否已认证
      if (!req.admin?.id) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json(
          createErrorResponse('Authentication required', HTTP_STATUS.UNAUTHORIZED)
        )
      }

      const userId = req.admin.id

      // 超级管理员直接通过
      if (req.admin.type === 'SUPER_ADMIN') {
        logger.debug(`Super admin complex permission granted: ${req.admin.account} (${userId})`)
        return next()
      }

      // 获取用户权限信息
      const userPermissions = await getUserPermissions(userId)
      
      if (!userPermissions) {
        return res.status(HTTP_STATUS.FORBIDDEN).json(
          createErrorResponse('User permissions not found', HTTP_STATUS.FORBIDDEN)
        )
      }

      // 执行复杂权限逻辑
      const hasPermission = permissionLogic(userPermissions.permissionKeys)

      if (!hasPermission) {
        const message = errorMessage || 'Complex permission check failed'
        logger.warn(`Complex permission denied: ${req.admin.account} (${userId}) - ${message}`)
        return res.status(HTTP_STATUS.FORBIDDEN).json(
          createErrorResponse(message, HTTP_STATUS.FORBIDDEN)
        )
      }

      logger.debug(`Complex permission granted: ${req.admin.account} (${userId})`)
      next()
    } catch (error) {
      logger.error('Complex permission check error:', error)
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
        createErrorResponse('Complex permission check failed', HTTP_STATUS.INTERNAL_SERVER_ERROR)
      )
    }
  }
}
