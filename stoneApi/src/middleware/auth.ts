import { Request, Response, NextFunction } from 'express'
import { createErrorResponse, HTTP_STATUS, ERROR_CODES, JwtPayload } from '@stone/shared'
import { verifyAdminToken, verifyMemberToken } from '../utils/jwt'
import { logger } from '../utils/logger'

// 扩展Request接口以包含用户信息
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload
      admin?: JwtPayload
      member?: JwtPayload
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
