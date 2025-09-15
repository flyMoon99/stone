import Joi from 'joi'
import { LoginRequest } from '@stone/shared'

// 登录请求验证
export const loginSchema = Joi.object({
  account: Joi.string()
    .min(3)
    .max(50)
    .required()
    .messages({
      'string.empty': '账户不能为空',
      'string.min': '账户长度至少3位',
      'string.max': '账户长度不能超过50位',
      'any.required': '账户是必填项'
    }),
  password: Joi.string()
    .min(6)
    .max(100)
    .required()
    .messages({
      'string.empty': '密码不能为空',
      'string.min': '密码长度至少6位',
      'string.max': '密码长度不能超过100位',
      'any.required': '密码是必填项'
    })
})

// 创建用户验证
export const createUserSchema = Joi.object({
  account: Joi.string()
    .min(3)
    .max(50)
    .required()
    .messages({
      'string.empty': '账户不能为空',
      'string.min': '账户长度至少3位',
      'string.max': '账户长度不能超过50位',
      'any.required': '账户是必填项'
    }),
  password: Joi.string()
    .min(8)
    .max(100)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .required()
    .messages({
      'string.empty': '密码不能为空',
      'string.min': '密码长度至少8位',
      'string.max': '密码长度不能超过100位',
      'string.pattern.base': '密码必须包含大小写字母和数字',
      'any.required': '密码是必填项'
    }),
  type: Joi.string()
    .valid('SUPER_ADMIN', 'ADMIN')
    .optional()
    .messages({
      'any.only': '管理员类型只能是SUPER_ADMIN或ADMIN'
    })
})

// 更新用户验证
export const updateUserSchema = Joi.object({
  account: Joi.string()
    .min(3)
    .max(50)
    .optional()
    .messages({
      'string.empty': '账户不能为空',
      'string.min': '账户长度至少3位',
      'string.max': '账户长度不能超过50位'
    }),
  password: Joi.string()
    .min(8)
    .max(100)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .optional()
    .messages({
      'string.empty': '密码不能为空',
      'string.min': '密码长度至少8位',
      'string.max': '密码长度不能超过100位',
      'string.pattern.base': '密码必须包含大小写字母和数字'
    }),
  status: Joi.string()
    .valid('ACTIVE', 'INACTIVE')
    .optional()
    .messages({
      'any.only': '状态只能是ACTIVE或INACTIVE'
    }),
  type: Joi.string()
    .valid('SUPER_ADMIN', 'ADMIN')
    .optional()
    .messages({
      'any.only': '管理员类型只能是SUPER_ADMIN或ADMIN'
    })
})

// 分页参数验证
export const paginationSchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .default(1)
    .messages({
      'number.base': '页码必须是数字',
      'number.integer': '页码必须是整数',
      'number.min': '页码最小为1'
    }),
  pageSize: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(10)
    .messages({
      'number.base': '每页数量必须是数字',
      'number.integer': '每页数量必须是整数',
      'number.min': '每页数量最小为1',
      'number.max': '每页数量最大为100'
    })
}).unknown(true) // 允许额外的查询参数

// ID参数验证
export const idSchema = Joi.object({
  id: Joi.string()
    .required()
    .messages({
      'string.empty': 'ID不能为空',
      'any.required': 'ID是必填项'
    })
})

// 管理员列表查询验证
export const adminListQuerySchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .default(1)
    .messages({
      'number.base': '页码必须是数字',
      'number.integer': '页码必须是整数',
      'number.min': '页码最小为1'
    }),
  pageSize: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(10)
    .messages({
      'number.base': '每页数量必须是数字',
      'number.integer': '每页数量必须是整数',
      'number.min': '每页数量最小为1',
      'number.max': '每页数量最大为100'
    }),
  status: Joi.string()
    .valid('ACTIVE', 'INACTIVE')
    .optional()
    .messages({
      'any.only': '状态只能是ACTIVE或INACTIVE'
    }),
  type: Joi.string()
    .valid('SUPER_ADMIN', 'ADMIN')
    .optional()
    .messages({
      'any.only': '管理员类型只能是SUPER_ADMIN或ADMIN'
    })
})

// 验证函数
export function validateLoginRequest(data: any) {
  return loginSchema.validate(data)
}

export function validateCreateUser(data: any) {
  return createUserSchema.validate(data)
}

export function validateUpdateUser(data: any) {
  return updateUserSchema.validate(data)
}

export function validatePagination(data: any) {
  return paginationSchema.validate(data)
}

export function validateId(data: any) {
  return idSchema.validate(data)
}

export function validateAdminListQuery(data: any) {
  return adminListQuerySchema.validate(data)
}

// ==================== RBAC验证模式 ====================

// 创建角色验证
export const createRoleSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(50)
    .required()
    .messages({
      'string.empty': '角色名称不能为空',
      'string.min': '角色名称至少2位',
      'string.max': '角色名称不能超过50位',
      'any.required': '角色名称是必填项'
    }),
  code: Joi.string()
    .min(2)
    .max(50)
    .pattern(/^[a-zA-Z0-9_]+$/)
    .required()
    .messages({
      'string.empty': '角色编码不能为空',
      'string.min': '角色编码至少2位',
      'string.max': '角色编码不能超过50位',
      'string.pattern.base': '角色编码只能包含字母、数字和下划线',
      'any.required': '角色编码是必填项'
    }),
  description: Joi.string()
    .max(255)
    .optional()
    .allow('')
    .messages({
      'string.max': '角色描述不能超过255位'
    }),
  status: Joi.boolean()
    .optional()
    .messages({
      'boolean.base': '状态必须是布尔值'
    })
})

// 更新角色验证
export const updateRoleSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(50)
    .optional()
    .messages({
      'string.empty': '角色名称不能为空',
      'string.min': '角色名称至少2位',
      'string.max': '角色名称不能超过50位'
    }),
  description: Joi.string()
    .max(255)
    .optional()
    .allow('')
    .messages({
      'string.max': '角色描述不能超过255位'
    }),
  status: Joi.boolean()
    .optional()
    .messages({
      'boolean.base': '状态必须是布尔值'
    })
})

// 角色列表查询验证
export const roleListQuerySchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .default(1),
  pageSize: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(10),
  status: Joi.boolean()
    .optional(),
  keyword: Joi.string()
    .max(100)
    .optional()
    .allow('')
})

// 创建权限验证
export const createPermissionSchema = Joi.object({
  key: Joi.string()
    .min(2)
    .max(100)
    .pattern(/^[a-zA-Z0-9._-]+$/)
    .required()
    .messages({
      'string.empty': '权限标识不能为空',
      'string.min': '权限标识至少2位',
      'string.max': '权限标识不能超过100位',
      'string.pattern.base': '权限标识只能包含字母、数字、点、下划线和横线',
      'any.required': '权限标识是必填项'
    }),
  name: Joi.string()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.empty': '权限名称不能为空',
      'string.min': '权限名称至少2位',
      'string.max': '权限名称不能超过100位',
      'any.required': '权限名称是必填项'
    }),
  type: Joi.string()
    .valid('MENU', 'PAGE', 'API', 'ACTION')
    .required()
    .messages({
      'any.only': '权限类型只能是MENU、PAGE、API或ACTION',
      'any.required': '权限类型是必填项'
    }),
  parentId: Joi.string()
    .optional()
    .allow(null)
    .messages({
      'string.base': '父权限ID必须是字符串'
    }),
  path: Joi.string()
    .max(200)
    .optional()
    .allow('', null) // Allow null for non-API types
    .messages({
      'string.max': '路径不能超过200位'
    }),
  method: Joi.string()
    .max(10)
    .optional()
    .allow('', null) // Allow null for non-API types
    .messages({
      'string.max': '请求方法不能超过10位'
    }),
  order: Joi.number()
    .integer()
    .min(0)
    .optional()
    .messages({
      'number.base': '排序必须是数字',
      'number.integer': '排序必须是整数',
      'number.min': '排序不能小于0'
    }),
  enabled: Joi.boolean()
    .optional()
    .messages({
      'boolean.base': '启用状态必须是布尔值'
    })
})

// 更新权限验证
export const updatePermissionSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(100)
    .optional()
    .messages({
      'string.empty': '权限名称不能为空',
      'string.min': '权限名称至少2位',
      'string.max': '权限名称不能超过100位'
    }),
  type: Joi.string()
    .valid('MENU', 'PAGE', 'API', 'ACTION')
    .optional()
    .messages({
      'any.only': '权限类型只能是MENU、PAGE、API或ACTION'
    }),
  parentId: Joi.string()
    .optional()
    .allow(null)
    .messages({
      'string.base': '父权限ID必须是字符串'
    }),
  path: Joi.string()
    .max(200)
    .optional()
    .allow('', null)
    .messages({
      'string.max': '路径不能超过200位'
    }),
  method: Joi.string()
    .max(10)
    .optional()
    .allow('', null)
    .messages({
      'string.max': '请求方法不能超过10位'
    }),
  order: Joi.number()
    .integer()
    .min(0)
    .optional()
    .messages({
      'number.base': '排序必须是数字',
      'number.integer': '排序必须是整数',
      'number.min': '排序不能小于0'
    }),
  enabled: Joi.boolean()
    .optional()
    .messages({
      'boolean.base': '启用状态必须是布尔值'
    })
})

// 权限列表查询验证
export const permissionListQuerySchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .default(1),
  pageSize: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(10),
  type: Joi.string()
    .valid('MENU', 'PAGE', 'API', 'ACTION')
    .optional(),
  enabled: Joi.boolean()
    .optional(),
  parentId: Joi.string()
    .optional()
    .allow(''),
  keyword: Joi.string()
    .max(100)
    .optional()
    .allow('')
})

// 分配权限验证
export const assignPermissionsSchema = Joi.object({
  permissionIds: Joi.array()
    .items(Joi.string().required())
    .required()
    .messages({
      'array.base': '权限ID列表必须是数组',
      'any.required': '权限ID列表是必填项'
    })
})

// 分配角色验证
export const assignRolesSchema = Joi.object({
  roleIds: Joi.array()
    .items(Joi.string().required())
    .required()
    .messages({
      'array.base': '角色ID列表必须是数组',
      'any.required': '角色ID列表是必填项'
    })
})

// 批量更新状态验证
export const batchUpdateStatusSchema = Joi.object({
  ids: Joi.array()
    .items(Joi.string().required())
    .min(1)
    .required()
    .messages({
      'array.base': 'ID列表必须是数组',
      'array.min': 'ID列表不能为空',
      'any.required': 'ID列表是必填项'
    }),
  status: Joi.alternatives()
    .try(
      Joi.boolean(), // 用于角色和权限
      Joi.string().valid('ACTIVE', 'INACTIVE') // 用于用户
    )
    .required()
    .messages({
      'any.required': '状态是必填项'
    })
})

// 权限检查验证
export const checkPermissionSchema = Joi.object({
  permissionKey: Joi.string()
    .required()
    .messages({
      'string.empty': '权限标识不能为空',
      'any.required': '权限标识是必填项'
    })
})

// 多权限检查验证
export const checkPermissionsSchema = Joi.object({
  permissionKeys: Joi.array()
    .items(Joi.string().required())
    .min(1)
    .required()
    .messages({
      'array.base': '权限标识列表必须是数组',
      'array.min': '权限标识列表不能为空',
      'any.required': '权限标识列表是必填项'
    })
})

// 权限keys验证
export const permissionKeysSchema = Joi.object({
  keys: Joi.array()
    .items(Joi.string().required())
    .min(1)
    .required()
    .messages({
      'array.base': '权限标识列表必须是数组',
      'array.min': '权限标识列表不能为空',
      'any.required': '权限标识列表是必填项'
    })
})

// 添加用户角色验证
export const addUserRoleSchema = Joi.object({
  roleId: Joi.string()
    .required()
    .messages({
      'string.empty': '角色ID不能为空',
      'any.required': '角色ID是必填项'
    })
})

// 批量分配角色验证
export const batchAssignRolesSchema = Joi.object({
  userIds: Joi.array()
    .items(Joi.string().required())
    .min(1)
    .required()
    .messages({
      'array.base': '用户ID列表必须是数组',
      'array.min': '用户ID列表不能为空',
      'any.required': '用户ID列表是必填项'
    }),
  roleIds: Joi.array()
    .items(Joi.string().required())
    .required()
    .messages({
      'array.base': '角色ID列表必须是数组',
      'any.required': '角色ID列表是必填项'
    })
})

// ==================== RBAC验证函数 ====================

export function validateCreateRole(data: any) {
  return createRoleSchema.validate(data)
}

export function validateUpdateRole(data: any) {
  return updateRoleSchema.validate(data)
}

export function validateRoleListQuery(data: any) {
  return roleListQuerySchema.validate(data)
}

export function validateCreatePermission(data: any) {
  return createPermissionSchema.validate(data)
}

export function validateUpdatePermission(data: any) {
  return updatePermissionSchema.validate(data)
}

export function validatePermissionListQuery(data: any) {
  return permissionListQuerySchema.validate(data)
}

export function validateAssignPermissions(data: any) {
  return assignPermissionsSchema.validate(data)
}

export function validateAssignRoles(data: any) {
  return assignRolesSchema.validate(data)
}

export function validateBatchUpdateStatus(data: any) {
  return batchUpdateStatusSchema.validate(data)
}

export function validateCheckPermission(data: any) {
  return checkPermissionSchema.validate(data)
}

export function validateCheckPermissions(data: any) {
  return checkPermissionsSchema.validate(data)
}

export function validatePermissionKeys(data: any) {
  return permissionKeysSchema.validate(data)
}

export function validateAddUserRole(data: any) {
  return addUserRoleSchema.validate(data)
}

export function validateBatchAssignRoles(data: any) {
  return batchAssignRolesSchema.validate(data)
}
