import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import compression from 'compression'
import dotenv from 'dotenv'
import { createApiResponse } from '@stone/shared'
import { logger } from './utils/logger'
import { connectDatabase } from './utils/database'
import { errorHandler } from './middleware/errorHandler'
import { notFoundHandler } from './middleware/notFoundHandler'

// 路由导入
import adminRoutes from './routes/admin'
import memberRoutes from './routes/member'
import publicRoutes from './routes/public'
import rbacRoutes from './routes/rbac'

// 加载环境变量
dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

// 中间件配置
app.use(helmet()) // 安全头
app.use(compression()) // 响应压缩
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true
}))
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// 健康检查
app.get('/health', (req, res) => {
  res.json(createApiResponse(true, { status: 'ok', timestamp: new Date().toISOString() }, 'Service is healthy'))
})

// API路由
app.use('/api/admin', adminRoutes)
app.use('/api/member', memberRoutes)
app.use('/api/public', publicRoutes)
app.use('/api/rbac', rbacRoutes)

// 错误处理中间件
app.use(notFoundHandler)
app.use(errorHandler)

// 启动服务器
async function startServer() {
  try {
    // 连接数据库
    await connectDatabase()
    
    // 启动HTTP服务器
    app.listen(PORT, () => {
      logger.info(`🚀 Stone API Server is running on port ${PORT}`)
      logger.info(`📝 Environment: ${process.env.NODE_ENV || 'development'}`)
      logger.info(`🔗 Health check: http://localhost:${PORT}/health`)
    })
  } catch (error) {
    logger.error('❌ Failed to start server:', error)
    process.exit(1)
  }
}

startServer()

export default app
