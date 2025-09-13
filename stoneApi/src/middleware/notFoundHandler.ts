import { Request, Response, NextFunction } from 'express'
import { createErrorResponse, HTTP_STATUS, ERROR_CODES } from '@stone/shared'

export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  const errorResponse = createErrorResponse(
    `Route ${req.originalUrl} not found`,
    HTTP_STATUS.NOT_FOUND
  )
  errorResponse.code = HTTP_STATUS.NOT_FOUND
  
  res.status(HTTP_STATUS.NOT_FOUND).json(errorResponse)
}
