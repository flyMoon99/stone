import { Request, Response, NextFunction } from 'express'
import { createSuccessResponse, createErrorResponse, HTTP_STATUS } from '@stone/shared'
import {
  createAdmin,
  getAdminList,
  getAdminById,
  updateAdmin,
  batchUpdateAdminStatus
} from '../services/adminService'
import {
  validateCreateUser,
  validateUpdateUser,
  validatePagination,
  validateId,
  validateAdminListQuery
} from '../utils/validation'
import { logger } from '../utils/logger'

// 创建管理员
export const createAdminController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 验证请求数据
    const { error, value } = validateCreateUser(req.body)
    if (error) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json(
        createErrorResponse(error.details?.[0]?.message || 'Validation error', HTTP_STATUS.BAD_REQUEST)
      )
    }

    // 创建管理员
    const admin = await createAdmin(value)
    
    res.status(HTTP_STATUS.CREATED).json(
      createSuccessResponse(admin, 'Admin created successfully')
    )
    return
  } catch (error) {
    logger.error('Create admin error:', error)
    
    const message = error instanceof Error ? error.message : 'Failed to create admin'
    const statusCode = message === 'Account already exists' ? HTTP_STATUS.BAD_REQUEST : HTTP_STATUS.INTERNAL_SERVER_ERROR
    
    res.status(statusCode).json(createErrorResponse(message, statusCode))
    return
  }
}

// 获取管理员列表
export const getAdminListController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 验证查询参数
    const { error, value } = validateAdminListQuery(req.query)
    if (error) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json(
        createErrorResponse(error.details?.[0]?.message || 'Validation error', HTTP_STATUS.BAD_REQUEST)
      )
    }

    // 获取管理员列表
    const result = await getAdminList(value)
    
    res.json(createSuccessResponse(result, 'Admin list retrieved successfully'))
    return
  } catch (error) {
    logger.error('Get admin list error:', error)
    next(error)
    return
  }
}

// 获取管理员详情
export const getAdminByIdController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 验证ID参数
    const { error, value } = validateId(req.params)
    if (error) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json(
        createErrorResponse(error.details?.[0]?.message || 'Validation error', HTTP_STATUS.BAD_REQUEST)
      )
    }

    // 获取管理员详情
    const admin = await getAdminById(value.id)
    
    if (!admin) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(
        createErrorResponse('Admin not found', HTTP_STATUS.NOT_FOUND)
      )
    }

    res.json(createSuccessResponse(admin, 'Admin retrieved successfully'))
    return
  } catch (error) {
    logger.error('Get admin error:', error)
    next(error)
    return
  }
}

// 更新管理员
export const updateAdminController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 验证ID参数
    const { error: idError, value: idValue } = validateId(req.params)
    if (idError) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json(
        createErrorResponse(idError.details?.[0]?.message || 'Validation error', HTTP_STATUS.BAD_REQUEST)
      )
    }

    // 验证更新数据
    const { error: updateError, value: updateValue } = validateUpdateUser(req.body)
    if (updateError) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json(
        createErrorResponse(updateError.details?.[0]?.message || 'Validation error', HTTP_STATUS.BAD_REQUEST)
      )
    }

    // 更新管理员
    const admin = await updateAdmin(idValue.id, updateValue)
    
    res.json(createSuccessResponse(admin, 'Admin updated successfully'))
    return
  } catch (error) {
    logger.error('Update admin error:', error)
    
    const message = error instanceof Error ? error.message : 'Failed to update admin'
    const statusCode = ['Admin not found', 'Account already exists'].includes(message) 
      ? HTTP_STATUS.BAD_REQUEST 
      : HTTP_STATUS.INTERNAL_SERVER_ERROR
    
    res.status(statusCode).json(createErrorResponse(message, statusCode))
    return
  }
}

// 批量更新管理员状态
export const batchUpdateAdminStatusController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { ids, status } = req.body

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json(
        createErrorResponse('IDs array is required', HTTP_STATUS.BAD_REQUEST)
      )
    }

    if (!['ACTIVE', 'INACTIVE'].includes(status)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json(
        createErrorResponse('Invalid status', HTTP_STATUS.BAD_REQUEST)
      )
    }

    // 批量更新状态
    const count = await batchUpdateAdminStatus(ids, status)
    
    res.json(createSuccessResponse({ count }, `${count} admins status updated successfully`))
    return
  } catch (error) {
    logger.error('Batch update admin status error:', error)
    next(error)
    return
  }
}
