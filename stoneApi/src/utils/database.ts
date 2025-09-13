import { PrismaClient } from '@prisma/client'
import { logger } from './logger'

// 创建Prisma客户端实例
const prisma = new PrismaClient({
  log: [
    {
      emit: 'event',
      level: 'query',
    },
    {
      emit: 'event',
      level: 'error',
    },
    {
      emit: 'event',
      level: 'info',
    },
    {
      emit: 'event',
      level: 'warn',
    },
  ],
})

// 监听Prisma事件
prisma.$on('query', (e) => {
  if (process.env.NODE_ENV === 'development') {
    logger.debug('Query: ' + e.query)
    logger.debug('Params: ' + e.params)
    logger.debug('Duration: ' + e.duration + 'ms')
  }
})

prisma.$on('error', (e) => {
  logger.error('Prisma Error: ' + e.message)
})

prisma.$on('info', (e) => {
  logger.info('Prisma Info: ' + e.message)
})

prisma.$on('warn', (e) => {
  logger.warn('Prisma Warning: ' + e.message)
})

// 数据库连接测试
export async function connectDatabase() {
  try {
    await prisma.$connect()
    logger.info('✅ Database connected successfully')
  } catch (error) {
    logger.error('❌ Database connection failed:', error)
    process.exit(1)
  }
}

// 优雅关闭数据库连接
export async function disconnectDatabase() {
  try {
    await prisma.$disconnect()
    logger.info('📴 Database disconnected')
  } catch (error) {
    logger.error('❌ Database disconnection failed:', error)
  }
}

// 处理进程退出
process.on('beforeExit', async () => {
  await disconnectDatabase()
})

process.on('SIGINT', async () => {
  await disconnectDatabase()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  await disconnectDatabase()
  process.exit(0)
})

export { prisma }
export default prisma
