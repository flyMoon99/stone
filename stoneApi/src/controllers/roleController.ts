import { Request, Response, NextFunction } from 'express'
import { createSuccessResponse, createErrorResponse, HTTP_STATUS } from '@stone/shared'
import {
  createRole,
  getRoleList,
  getRoleById,
  updateRole,
  deleteRole,
  batchUpdateRoleStatus,
  getAvailableRoles,
  assignPermissionsToRole,
  getRolePermissions
} from '../services/roleService'
import {
  validateCreateRole,
  validateUpdateRole,
  validatePagination,
  validateId,
  validateRoleListQuery,
  validateAssignPermissions,
  validateBatchUpdateStatus
} from '../utils/validation'
import { logger } from '../utils/logger'

// 创建角色
export const createRoleController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 验证请求数据
    const { error, value } = validateCreateRole(req.body)
    if (error) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json(
        createErrorResponse(error.details?.[0]?.message || 'Validation error', HTTP_STATUS.BAD_REQUEST)
      )
    }

    // 创建角色
    const role = await createRole(value)
    
    res.status(HTTP_STATUS.CREATED).json(
      createSuccessResponse(role, 'Role created successfully')
    )
    return
  } catch (error) {
    logger.error('Create role error:', error)
    
    const message = error instanceof Error ? error.message : 'Failed to create role'
    const statusCode = ['角色编码已存在', '角色名称已存在'].includes(message) 
      ? HTTP_STATUS.BAD_REQUEST 
      : HTTP_STATUS.INTERNAL_SERVER_ERROR
    
    res.status(statusCode).json(createErrorResponse(message, statusCode))
    return
  }
}

// 获取角色列表
export const getRoleListController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 验证查询参数
    const { error, value } = validateRoleListQuery(req.query)
    if (error) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json(
        createErrorResponse(error.details?.[0]?.message || 'Validation error', HTTP_STATUS.BAD_REQUEST)
      )
    }

    // 获取角色列表
    const result = await getRoleList(value)
    
    res.json(createSuccessResponse(result, 'Role list retrieved successfully'))
    return
  } catch (error) {
    logger.error('Get role list error:', error)
    next(error)
    return
  }
}

// 获取角色详情
export const getRoleByIdController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 验证ID参数
    const { error, value } = validateId(req.params)
    if (error) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json(
        createErrorResponse(error.details?.[0]?.message || 'Validation error', HTTP_STATUS.BAD_REQUEST)
      )
    }

    // 获取角色详情
    const role = await getRoleById(value.id)
    
    if (!role) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(
        createErrorResponse('Role not found', HTTP_STATUS.NOT_FOUND)
      )
    }

    res.json(createSuccessResponse(role, 'Role retrieved successfully'))
    return
  } catch (error) {
    logger.error('Get role error:', error)
    next(error)
    return
  }
}

// 更新角色
export const updateRoleController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 验证ID参数
    const { error: idError, value: idValue } = validateId(req.params)
    if (idError) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json(
        createErrorResponse(idError.details?.[0]?.message || 'Validation error', HTTP_STATUS.BAD_REQUEST)
      )
    }

    // 验证更新数据
    const { error: updateError, value: updateValue } = validateUpdateRole(req.body)
    if (updateError) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json(
        createErrorResponse(updateError.details?.[0]?.message || 'Validation error', HTTP_STATUS.BAD_REQUEST)
      )
    }

    // 更新角色
    const role = await updateRole(idValue.id, updateValue)
    
    res.json(createSuccessResponse(role, 'Role updated successfully'))
    return
  } catch (error) {
    logger.error('Update role error:', error)
    
    const message = error instanceof Error ? error.message : 'Failed to update role'
    const statusCode = ['角色不存在', '角色名称已存在'].includes(message) 
      ? HTTP_STATUS.BAD_REQUEST 
      : HTTP_STATUS.INTERNAL_SERVER_ERROR
    
    res.status(statusCode).json(createErrorResponse(message, statusCode))
    return
  }
}

// 删除角色
export const deleteRoleController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 验证ID参数
    const { error, value } = validateId(req.params)
    if (error) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json(
        createErrorResponse(error.details?.[0]?.message || 'Validation error', HTTP_STATUS.BAD_REQUEST)
      )
    }

    // 删除角色
    await deleteRole(value.id)
    
    res.json(createSuccessResponse(null, 'Role deleted successfully'))
    return
  } catch (error) {
    logger.error('Delete role error:', error)
    
    const message = error instanceof Error ? error.message : 'Failed to delete role'
    const statusCode = ['角色不存在', '该角色正在被使用，无法删除'].includes(message) 
      ? HTTP_STATUS.BAD_REQUEST 
      : HTTP_STATUS.INTERNAL_SERVER_ERROR
    
    res.status(statusCode).json(createErrorResponse(message, statusCode))
    return
  }
}

// 批量更新角色状态
export const batchUpdateRoleStatusController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 验证请求数据
    const { error, value } = validateBatchUpdateStatus(req.body)
    if (error) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json(
        createErrorResponse(error.details?.[0]?.message || 'Validation error', HTTP_STATUS.BAD_REQUEST)
      )
    }

    // 批量更新状态
    const count = await batchUpdateRoleStatus(value.ids, value.status)
    
    res.json(createSuccessResponse({ count }, `${count} roles status updated successfully`))
    return
  } catch (error) {
    logger.error('Batch update role status error:', error)
    next(error)
    return
  }
}

// 获取可用角色列表
export const getAvailableRolesController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 获取可用角色
    const roles = await getAvailableRoles()
    
    res.json(createSuccessResponse(roles, 'Available roles retrieved successfully'))
    return
  } catch (error) {
    logger.error('Get available roles error:', error)
    next(error)
    return
  }
}

// 分配权限给角色
export const assignPermissionsToRoleController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 验证ID参数
    const { error: idError, value: idValue } = validateId(req.params)
    if (idError) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json(
        createErrorResponse(idError.details?.[0]?.message || 'Validation error', HTTP_STATUS.BAD_REQUEST)
      )
    }

    // 验证权限分配数据
    const { error: assignError, value: assignValue } = validateAssignPermissions(req.body)
    if (assignError) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json(
        createErrorResponse(assignError.details?.[0]?.message || 'Validation error', HTTP_STATUS.BAD_REQUEST)
      )
    }

    // 分配权限
    await assignPermissionsToRole(idValue.id, assignValue.permissionIds)
    
    res.json(createSuccessResponse(null, 'Permissions assigned to role successfully'))
    return
  } catch (error) {
    logger.error('Assign permissions to role error:', error)
    
    const message = error instanceof Error ? error.message : 'Failed to assign permissions'
    const statusCode = ['角色不存在', '部分权限不存在'].includes(message) 
      ? HTTP_STATUS.BAD_REQUEST 
      : HTTP_STATUS.INTERNAL_SERVER_ERROR
    
    res.status(statusCode).json(createErrorResponse(message, statusCode))
    return
  }
}

// 获取角色权限
export const getRolePermissionsController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 验证ID参数
    const { error, value } = validateId(req.params)
    if (error) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json(
        createErrorResponse(error.details?.[0]?.message || 'Validation error', HTTP_STATUS.BAD_REQUEST)
      )
    }

    // 获取角色权限
    const permissions = await getRolePermissions(value.id)
    
    res.json(createSuccessResponse(permissions, 'Role permissions retrieved successfully'))
    return
  } catch (error) {
    logger.error('Get role permissions error:', error)
    
    const message = error instanceof Error ? error.message : 'Failed to get role permissions'
    const statusCode = message === '角色不存在' 
      ? HTTP_STATUS.BAD_REQUEST 
      : HTTP_STATUS.INTERNAL_SERVER_ERROR
    
    res.status(statusCode).json(createErrorResponse(message, statusCode))
    return
  }
}
