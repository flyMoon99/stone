import { Request, Response, NextFunction } from 'express'
import { createErrorResponse, HTTP_STATUS, ERROR_CODES } from '@stone/shared'
import { logger } from '../utils/logger'

export interface ApiError extends Error {
  statusCode?: number
  code?: string
}

export const errorHandler = (
  err: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // 记录错误日志
  logger.error('API Error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  })

  // 默认错误信息
  let statusCode = err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR
  let message = err.message || 'Internal Server Error'
  let code = err.code || ERROR_CODES.INTERNAL_ERROR

  // 处理特定类型的错误
  if (err.name === 'ValidationError') {
    statusCode = HTTP_STATUS.BAD_REQUEST
    code = ERROR_CODES.VALIDATION_ERROR
    message = 'Validation failed'
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = HTTP_STATUS.UNAUTHORIZED
    code = ERROR_CODES.TOKEN_INVALID
    message = 'Invalid token'
  } else if (err.name === 'TokenExpiredError') {
    statusCode = HTTP_STATUS.UNAUTHORIZED
    code = ERROR_CODES.TOKEN_EXPIRED
    message = 'Token expired'
  } else if (err.name === 'CastError') {
    statusCode = HTTP_STATUS.BAD_REQUEST
    code = ERROR_CODES.VALIDATION_ERROR
    message = 'Invalid ID format'
  }

  // 生产环境下隐藏敏感错误信息
  if (process.env.NODE_ENV === 'production' && statusCode === HTTP_STATUS.INTERNAL_SERVER_ERROR) {
    message = 'Something went wrong'
  }

  const errorResponse = createErrorResponse(message, statusCode)
  errorResponse.code = statusCode

  res.status(statusCode).json(errorResponse)
}
