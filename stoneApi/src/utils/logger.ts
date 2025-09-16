import winston from 'winston'
import path from 'path'

// 创建日志目录
const logDir = path.join(process.cwd(), 'logs')

// 日志格式
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.prettyPrint()
)

// 控制台格式
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, stack }) => {
    return `${timestamp} [${level}]: ${stack || message}`
  })
)

// 创建logger实例
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'debug',
  format: logFormat,
  transports: [
    // 控制台输出
    new winston.transports.Console({
      format: consoleFormat
    }),
    
    // 文件输出 - 所有日志
    new winston.transports.File({
      filename: path.join(logDir, 'app.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    
    // 文件输出 - 错误日志
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ],
  
  // 未捕获异常处理
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logDir, 'exceptions.log')
    })
  ],
  
  // 未处理的Promise拒绝
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logDir, 'rejections.log')
    })
  ]
})

// 开发环境下不输出到文件
if (process.env.NODE_ENV === 'development') {
  logger.clear()
  logger.add(new winston.transports.Console({
    format: consoleFormat
  }))
}
