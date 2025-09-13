import { Request, Response, NextFunction } from 'express'
import { createErrorResponse, HTTP_STATUS, ERROR_CODES, JwtPayload } from '@stone/shared'
import { verifyAdminToken, verifyMemberToken } from '../utils/jwt'
import { getUserPermissions } from '../services/userPermissionService'
import { logger } from '../utils/logger'

// 扩展Request接口以包含用户信息
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload
      admin?: JwtPayload
      member?: JwtPayload
      userPermissions?: {
        roles: string[]
        permissions: string[]
      }
    }
  }
}

// 从请求头中提取Token
function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization
  if (!authHeader) return null
  
  const parts = authHeader.split(' ')
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null
  
  return parts[1]
}

// 管理员认证中间件
export const adminAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = extractToken(req)
    
    if (!token) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json(
        createErrorResponse('Access token is required', HTTP_STATUS.UNAUTHORIZED)
      )
    }

    const decoded = verifyAdminToken(token)
    req.user = decoded
    req.admin = decoded
    
    logger.debug(`Admin authenticated: ${decoded.account} (${decoded.id})`)
    next()
  } catch (error) {
    logger.warn(`Admin authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    
    return res.status(HTTP_STATUS.UNAUTHORIZED).json(
      createErrorResponse('Invalid or expired token', HTTP_STATUS.UNAUTHORIZED)
    )
  }
}

// 会员认证中间件
export const memberAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = extractToken(req)
    
    if (!token) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json(
        createErrorResponse('Access token is required', HTTP_STATUS.UNAUTHORIZED)
      )
    }

    const decoded = verifyMemberToken(token)
    req.user = decoded
    req.member = decoded
    
    logger.debug(`Member authenticated: ${decoded.account} (${decoded.id})`)
    next()
  } catch (error) {
    logger.warn(`Member authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    
    return res.status(HTTP_STATUS.UNAUTHORIZED).json(
      createErrorResponse('Invalid or expired token', HTTP_STATUS.UNAUTHORIZED)
    )
  }
}

// 可选认证中间件（Token存在则验证，不存在则跳过）
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = extractToken(req)
    
    if (!token) {
      return next()
    }

    // 尝试验证管理员Token
    try {
      const decoded = verifyAdminToken(token)
      req.user = decoded
      req.admin = decoded
      return next()
    } catch (adminError) {
      // 如果管理员Token验证失败，尝试会员Token
      try {
        const decoded = verifyMemberToken(token)
        req.user = decoded
        req.member = decoded
        return next()
      } catch (memberError) {
        // 两种Token都验证失败，但这是可选认证，所以继续
        logger.debug('Optional auth: Token verification failed for both admin and member')
        return next()
      }
    }
  } catch (error) {
    logger.warn(`Optional authentication error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    next()
  }
}

// 超级管理员权限检查中间件
export const superAdminAuth = async (req: Request, res: Response, next: NextFunction) => {
  // 先进行管理员认证
  adminAuth(req, res, (err) => {
    if (err) return next(err)
    
    // 检查是否为超级管理员
    if (req.admin?.type !== 'SUPER_ADMIN') {
      return res.status(HTTP_STATUS.FORBIDDEN).json(
        createErrorResponse('Super admin access required', HTTP_STATUS.FORBIDDEN)
      )
    }
    
    next()
  })
}

// 增强的管理员认证中间件（包含权限信息加载）
export const adminAuthWithPermissions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = extractToken(req)
    
    if (!token) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json(
        createErrorResponse('Access token is required', HTTP_STATUS.UNAUTHORIZED)
      )
    }

    const decoded = verifyAdminToken(token)
    req.user = decoded
    req.admin = decoded
    
    // 加载用户权限信息
    try {
      const userPermissions = await getUserPermissions(decoded.id)
      if (userPermissions) {
        req.userPermissions = {
          roles: userPermissions.roles.map(role => role.code),
          permissions: userPermissions.permissionKeys
        }
      }
    } catch (permissionError) {
      logger.warn(`Failed to load permissions for user ${decoded.id}:`, permissionError)
      // 权限加载失败不影响认证，但会记录警告
    }
    
    logger.debug(`Admin authenticated with permissions: ${decoded.account} (${decoded.id})`)
    next()
  } catch (error) {
    logger.warn(`Admin authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    
    return res.status(HTTP_STATUS.UNAUTHORIZED).json(
      createErrorResponse('Invalid or expired token', HTTP_STATUS.UNAUTHORIZED)
    )
  }
}

// RBAC权限检查中间件工厂
export const requirePermissions = (permissions: string | string[], mode: 'any' | 'all' = 'any') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // 确保用户已认证
    if (!req.admin?.id) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json(
        createErrorResponse('Authentication required', HTTP_STATUS.UNAUTHORIZED)
      )
    }

    // 超级管理员直接通过
    if (req.admin.type === 'SUPER_ADMIN') {
      return next()
    }

    // 检查是否已加载权限信息
    if (!req.userPermissions) {
      return res.status(HTTP_STATUS.FORBIDDEN).json(
        createErrorResponse('User permissions not loaded', HTTP_STATUS.FORBIDDEN)
      )
    }

    const requiredPermissions = Array.isArray(permissions) ? permissions : [permissions]
    const userPermissions = req.userPermissions.permissions

    let hasPermission = false
    if (mode === 'all') {
      hasPermission = requiredPermissions.every(perm => userPermissions.includes(perm))
    } else {
      hasPermission = requiredPermissions.some(perm => userPermissions.includes(perm))
    }

    if (!hasPermission) {
      logger.warn(`Permission denied: ${req.admin.account} - Required: ${requiredPermissions.join(', ')} (${mode})`)
      return res.status(HTTP_STATUS.FORBIDDEN).json(
        createErrorResponse('Insufficient permissions', HTTP_STATUS.FORBIDDEN)
      )
    }

    next()
  }
}

// 角色检查中间件工厂
export const requireRoles = (roles: string | string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // 确保用户已认证
    if (!req.admin?.id) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json(
        createErrorResponse('Authentication required', HTTP_STATUS.UNAUTHORIZED)
      )
    }

    // 超级管理员直接通过
    if (req.admin.type === 'SUPER_ADMIN') {
      return next()
    }

    // 检查是否已加载权限信息
    if (!req.userPermissions) {
      return res.status(HTTP_STATUS.FORBIDDEN).json(
        createErrorResponse('User permissions not loaded', HTTP_STATUS.FORBIDDEN)
      )
    }

    const requiredRoles = Array.isArray(roles) ? roles : [roles]
    const userRoles = req.userPermissions.roles

    const hasRole = requiredRoles.some(role => userRoles.includes(role))

    if (!hasRole) {
      logger.warn(`Role access denied: ${req.admin.account} - Required roles: ${requiredRoles.join(', ')}`)
      return res.status(HTTP_STATUS.FORBIDDEN).json(
        createErrorResponse('Insufficient role permissions', HTTP_STATUS.FORBIDDEN)
      )
    }

    next()
  }
}
