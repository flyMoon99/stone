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
