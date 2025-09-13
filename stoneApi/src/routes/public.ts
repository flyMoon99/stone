import { Router } from 'express'
import { createSuccessResponse } from '@stone/shared'

const router = Router()

// 健康检查接口
router.get('/health', (req, res) => {
  const healthData = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  }
  
  res.json(createSuccessResponse(healthData, 'Service is healthy'))
})

// 获取系统信息
router.get('/info', (req, res) => {
  const systemInfo = {
    name: 'Stone API',
    version: '1.0.0',
    description: '基石项目后端API服务',
    environment: process.env.NODE_ENV || 'development',
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch
  }
  
  res.json(createSuccessResponse(systemInfo, 'System information retrieved successfully'))
})

export default router
