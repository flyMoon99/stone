import { Request, Response, NextFunction } from 'express'
import { createSuccessResponse, createErrorResponse, HTTP_STATUS } from '@stone/shared'
import { adminLogin, memberLogin, getAdminProfile, getMemberProfile } from '../services/authService'
import { validateLoginRequest } from '../utils/validation'
import { logger } from '../utils/logger'

// 管理员登录
export const adminLoginController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 验证请求数据
    const { error, value } = validateLoginRequest(req.body)
    if (error) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json(
        createErrorResponse(error.details[0].message, HTTP_STATUS.BAD_REQUEST)
      )
    }

    // 执行登录
    const loginResult = await adminLogin(value)
    
    res.json(createSuccessResponse(loginResult, 'Admin login successful'))
  } catch (error) {
    logger.error('Admin login error:', error)
    
    const message = error instanceof Error ? error.message : 'Login failed'
    res.status(HTTP_STATUS.UNAUTHORIZED).json(
      createErrorResponse(message, HTTP_STATUS.UNAUTHORIZED)
    )
  }
}

// 会员登录
export const memberLoginController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 验证请求数据
    const { error, value } = validateLoginRequest(req.body)
    if (error) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json(
        createErrorResponse(error.details[0].message, HTTP_STATUS.BAD_REQUEST)
      )
    }

    // 执行登录
    const loginResult = await memberLogin(value)
    
    res.json(createSuccessResponse(loginResult, 'Member login successful'))
  } catch (error) {
    logger.error('Member login error:', error)
    
    const message = error instanceof Error ? error.message : 'Login failed'
    res.status(HTTP_STATUS.UNAUTHORIZED).json(
      createErrorResponse(message, HTTP_STATUS.UNAUTHORIZED)
    )
  }
}

// 获取管理员个人信息
export const getAdminProfileController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.admin?.id) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json(
        createErrorResponse('Admin not authenticated', HTTP_STATUS.UNAUTHORIZED)
      )
    }

    const admin = await getAdminProfile(req.admin.id)
    
    if (!admin) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(
        createErrorResponse('Admin not found', HTTP_STATUS.NOT_FOUND)
      )
    }

    res.json(createSuccessResponse(admin, 'Admin profile retrieved successfully'))
  } catch (error) {
    logger.error('Get admin profile error:', error)
    next(error)
  }
}

// 获取会员个人信息
export const getMemberProfileController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.member?.id) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json(
        createErrorResponse('Member not authenticated', HTTP_STATUS.UNAUTHORIZED)
      )
    }

    const member = await getMemberProfile(req.member.id)
    
    if (!member) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(
        createErrorResponse('Member not found', HTTP_STATUS.NOT_FOUND)
      )
    }

    res.json(createSuccessResponse(member, 'Member profile retrieved successfully'))
  } catch (error) {
    logger.error('Get member profile error:', error)
    next(error)
  }
}
