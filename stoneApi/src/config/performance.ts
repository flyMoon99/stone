// 性能优化配置
export const PERFORMANCE_CONFIG = {
  // 缓存配置
  CACHE: {
    // 权限缓存时间（毫秒）
    PERMISSION_TTL: 5 * 60 * 1000, // 5分钟
    // 角色缓存时间（毫秒）
    ROLE_TTL: 10 * 60 * 1000, // 10分钟
    // 用户权限缓存时间（毫秒）
    USER_PERMISSION_TTL: 3 * 60 * 1000, // 3分钟
    // 菜单权限缓存时间（毫秒）
    MENU_PERMISSION_TTL: 15 * 60 * 1000, // 15分钟
  },

  // 数据库查询优化
  DATABASE: {
    // 分页默认大小
    DEFAULT_PAGE_SIZE: 20,
    // 最大分页大小
    MAX_PAGE_SIZE: 100,
    // 查询超时时间（毫秒）
    QUERY_TIMEOUT: 10000, // 10秒
    // 连接池配置
    CONNECTION_POOL: {
      min: 2,
      max: 10,
      acquireTimeoutMillis: 60000,
      createTimeoutMillis: 30000,
      destroyTimeoutMillis: 5000,
      idleTimeoutMillis: 30000,
      reapIntervalMillis: 1000,
      createRetryIntervalMillis: 200,
    }
  },

  // API响应优化
  API: {
    // 响应压缩
    COMPRESSION: {
      enabled: true,
      threshold: 1024, // 1KB
      level: 6
    },
    // 请求限制
    RATE_LIMIT: {
      windowMs: 15 * 60 * 1000, // 15分钟
      max: 1000, // 每个IP最多1000个请求
      message: 'Too many requests from this IP'
    },
    // 响应时间监控
    RESPONSE_TIME: {
      enabled: true,
      digits: 3,
      header: 'X-Response-Time',
      suffix: true
    }
  },

  // 权限检查优化
  PERMISSION: {
    // 批量权限检查大小限制
    BATCH_CHECK_LIMIT: 50,
    // 权限树深度限制
    MAX_TREE_DEPTH: 10,
    // 并发权限检查限制
    CONCURRENT_CHECK_LIMIT: 20
  },

  // 内存使用优化
  MEMORY: {
    // 垃圾回收配置
    GC: {
      // 强制垃圾回收间隔（毫秒）
      FORCE_GC_INTERVAL: 30 * 60 * 1000, // 30分钟
      // 内存使用阈值（字节）
      MEMORY_THRESHOLD: 500 * 1024 * 1024, // 500MB
    },
    // 对象池配置
    OBJECT_POOL: {
      enabled: true,
      maxSize: 100
    }
  },

  // 日志优化
  LOGGING: {
    // 日志级别
    LEVEL: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
    // 性能日志
    PERFORMANCE_LOG: {
      enabled: true,
      threshold: 1000, // 记录超过1秒的操作
    },
    // 访问日志
    ACCESS_LOG: {
      enabled: true,
      format: 'combined'
    }
  }
}

// 性能监控指标
export const PERFORMANCE_METRICS = {
  // 响应时间阈值（毫秒）
  RESPONSE_TIME_THRESHOLDS: {
    EXCELLENT: 100,
    GOOD: 300,
    ACCEPTABLE: 1000,
    POOR: 3000
  },

  // 内存使用阈值
  MEMORY_THRESHOLDS: {
    LOW: 100 * 1024 * 1024,    // 100MB
    MEDIUM: 300 * 1024 * 1024, // 300MB
    HIGH: 500 * 1024 * 1024,   // 500MB
    CRITICAL: 800 * 1024 * 1024 // 800MB
  },

  // CPU使用阈值
  CPU_THRESHOLDS: {
    LOW: 30,      // 30%
    MEDIUM: 60,   // 60%
    HIGH: 80,     // 80%
    CRITICAL: 95  // 95%
  }
}

// 性能优化建议
export const PERFORMANCE_RECOMMENDATIONS = {
  DATABASE: [
    '使用数据库索引优化查询性能',
    '实施查询结果缓存',
    '优化复杂的JOIN查询',
    '使用数据库连接池',
    '定期分析和优化慢查询'
  ],
  
  API: [
    '启用响应压缩',
    '实施API响应缓存',
    '使用CDN加速静态资源',
    '优化JSON序列化',
    '实施请求去重'
  ],
  
  PERMISSION: [
    '缓存用户权限信息',
    '优化权限检查算法',
    '减少不必要的权限查询',
    '使用位运算优化权限计算',
    '实施权限预加载'
  ],
  
  MEMORY: [
    '定期执行垃圾回收',
    '优化对象创建和销毁',
    '使用对象池减少内存分配',
    '监控内存泄漏',
    '优化数据结构使用'
  ]
}

// 性能监控工具
export class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private metrics: Map<string, any> = new Map()

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  // 记录响应时间
  recordResponseTime(endpoint: string, time: number): void {
    const key = `response_time_${endpoint}`
    const existing = this.metrics.get(key) || { count: 0, total: 0, avg: 0, min: Infinity, max: 0 }
    
    existing.count++
    existing.total += time
    existing.avg = existing.total / existing.count
    existing.min = Math.min(existing.min, time)
    existing.max = Math.max(existing.max, time)
    
    this.metrics.set(key, existing)
  }

  // 记录内存使用
  recordMemoryUsage(): void {
    const memUsage = process.memoryUsage()
    this.metrics.set('memory_usage', {
      rss: memUsage.rss,
      heapTotal: memUsage.heapTotal,
      heapUsed: memUsage.heapUsed,
      external: memUsage.external,
      timestamp: Date.now()
    })
  }

  // 记录权限检查性能
  recordPermissionCheck(userId: string, permission: string, time: number): void {
    const key = 'permission_check_performance'
    const existing = this.metrics.get(key) || { count: 0, total: 0, avg: 0 }
    
    existing.count++
    existing.total += time
    existing.avg = existing.total / existing.count
    
    this.metrics.set(key, existing)
  }

  // 获取性能指标
  getMetrics(): Map<string, any> {
    return new Map(this.metrics)
  }

  // 清除指标
  clearMetrics(): void {
    this.metrics.clear()
  }

  // 生成性能报告
  generateReport(): any {
    const report: any = {
      timestamp: new Date().toISOString(),
      metrics: {}
    }

    for (const [key, value] of this.metrics) {
      report.metrics[key] = value
    }

    return report
  }
}

// 性能中间件
export const performanceMiddleware = (req: any, res: any, next: any) => {
  const startTime = Date.now()
  
  res.on('finish', () => {
    const endTime = Date.now()
    const responseTime = endTime - startTime
    
    // 记录响应时间
    const monitor = PerformanceMonitor.getInstance()
    monitor.recordResponseTime(req.path, responseTime)
    
    // 添加响应时间头
    res.set('X-Response-Time', `${responseTime}ms`)
    
    // 记录慢请求
    if (responseTime > PERFORMANCE_CONFIG.LOGGING.PERFORMANCE_LOG.threshold) {
      console.warn(`Slow request: ${req.method} ${req.path} - ${responseTime}ms`)
    }
  })
  
  next()
}

// 内存监控
export const startMemoryMonitoring = () => {
  const monitor = PerformanceMonitor.getInstance()
  
  setInterval(() => {
    monitor.recordMemoryUsage()
    
    const memUsage = process.memoryUsage()
    const heapUsedMB = memUsage.heapUsed / 1024 / 1024
    
    if (heapUsedMB > PERFORMANCE_METRICS.MEMORY_THRESHOLDS.HIGH / 1024 / 1024) {
      console.warn(`High memory usage: ${heapUsedMB.toFixed(2)}MB`)
      
      if (global.gc && heapUsedMB > PERFORMANCE_METRICS.MEMORY_THRESHOLDS.CRITICAL / 1024 / 1024) {
        console.log('Forcing garbage collection...')
        global.gc()
      }
    }
  }, 60000) // 每分钟检查一次
}
