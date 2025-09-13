import { Request, Response, NextFunction } from 'express'
import { createSuccessResponse, createErrorResponse, HTTP_STATUS } from '@stone/shared'
import {
  createMember,
  getMemberList,
  getMemberById,
  updateMember,
  batchUpdateMemberStatus,
  searchMembers
} from '../services/memberService'
import {
  validateCreateUser,
  validateUpdateUser,
  validatePagination,
  validateId
} from '../utils/validation'
import { logger } from '../utils/logger'

// 创建会员
export const createMemberController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 验证请求数据
    const { error, value } = validateCreateUser(req.body)
    if (error) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json(
        createErrorResponse(error.details?.[0]?.message || 'Validation error', HTTP_STATUS.BAD_REQUEST)
      )
    }

    // 创建会员
    const member = await createMember(value)
    
    res.status(HTTP_STATUS.CREATED).json(
      createSuccessResponse(member, 'Member created successfully')
    )
  } catch (error) {
    logger.error('Create member error:', error)
    
    const message = error instanceof Error ? error.message : 'Failed to create member'
    const statusCode = message === 'Account already exists' ? HTTP_STATUS.BAD_REQUEST : HTTP_STATUS.INTERNAL_SERVER_ERROR
    
    res.status(statusCode).json(createErrorResponse(message, statusCode))
  }
}

// 获取会员列表
export const getMemberListController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 验证分页参数
    const { error, value } = validatePagination(req.query)
    if (error) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json(
        createErrorResponse(error.details?.[0]?.message || 'Validation error', HTTP_STATUS.BAD_REQUEST)
      )
    }

    // 获取查询参数
    const params = {
      ...value,
      status: req.query.status as any
    }

    // 获取会员列表
    const result = await getMemberList(params)
    
    res.json(createSuccessResponse(result, 'Member list retrieved successfully'))
  } catch (error) {
    logger.error('Get member list error:', error)
    next(error)
  }
}

// 搜索会员
export const searchMembersController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 验证分页参数
    const { error, value } = validatePagination(req.query)
    if (error) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json(
        createErrorResponse(error.details?.[0]?.message || 'Validation error', HTTP_STATUS.BAD_REQUEST)
      )
    }

    // 获取查询参数
    const params = {
      ...value,
      keyword: req.query.keyword as string,
      status: req.query.status as any
    }

    // 搜索会员
    const result = await searchMembers(params)
    
    res.json(createSuccessResponse(result, 'Members search completed successfully'))
  } catch (error) {
    logger.error('Search members error:', error)
    next(error)
  }
}

// 获取会员详情
export const getMemberByIdController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 验证ID参数
    const { error, value } = validateId(req.params)
    if (error) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json(
        createErrorResponse(error.details?.[0]?.message || 'Validation error', HTTP_STATUS.BAD_REQUEST)
      )
    }

    // 获取会员详情
    const member = await getMemberById(value.id)
    
    if (!member) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(
        createErrorResponse('Member not found', HTTP_STATUS.NOT_FOUND)
      )
    }

    res.json(createSuccessResponse(member, 'Member retrieved successfully'))
  } catch (error) {
    logger.error('Get member error:', error)
    next(error)
  }
}

// 更新会员
export const updateMemberController = async (req: Request, res: Response, next: NextFunction) => {
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

    // 更新会员
    const member = await updateMember(idValue.id, updateValue)
    
    res.json(createSuccessResponse(member, 'Member updated successfully'))
  } catch (error) {
    logger.error('Update member error:', error)
    
    const message = error instanceof Error ? error.message : 'Failed to update member'
    const statusCode = ['Member not found', 'Account already exists'].includes(message) 
      ? HTTP_STATUS.BAD_REQUEST 
      : HTTP_STATUS.INTERNAL_SERVER_ERROR
    
    res.status(statusCode).json(createErrorResponse(message, statusCode))
  }
}

// 批量更新会员状态
export const batchUpdateMemberStatusController = async (req: Request, res: Response, next: NextFunction) => {
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
    const count = await batchUpdateMemberStatus(ids, status)
    
    res.json(createSuccessResponse({ count }, `${count} members status updated successfully`))
  } catch (error) {
    logger.error('Batch update member status error:', error)
    next(error)
  }
}
