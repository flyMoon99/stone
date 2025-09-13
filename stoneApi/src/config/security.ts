// 安全配置
export const SECURITY_CONFIG = {
  // 密码安全配置
  PASSWORD: {
    // 最小长度
    MIN_LENGTH: 8,
    // 最大长度
    MAX_LENGTH: 128,
    // 必须包含大写字母
    REQUIRE_UPPERCASE: true,
    // 必须包含小写字母
    REQUIRE_LOWERCASE: true,
    // 必须包含数字
    REQUIRE_NUMBERS: true,
    // 必须包含特殊字符
    REQUIRE_SPECIAL_CHARS: true,
    // 特殊字符列表
    SPECIAL_CHARS: '!@#$%^&*()_+-=[]{}|;:,.<>?',
    // 密码历史记录数量（防止重复使用）
    HISTORY_COUNT: 5,
    // 密码过期天数
    EXPIRY_DAYS: 90,
    // bcrypt加密轮数
    BCRYPT_ROUNDS: 12
  },

  // JWT安全配置
  JWT: {
    // 访问token过期时间（秒）
    ACCESS_TOKEN_EXPIRY: 15 * 60, // 15分钟
    // 刷新token过期时间（秒）
    REFRESH_TOKEN_EXPIRY: 7 * 24 * 60 * 60, // 7天
    // 发行者
    ISSUER: 'stone-api',
    // 受众
    AUDIENCE: 'stone-admin',
    // 算法
    ALGORITHM: 'HS256',
    // 时钟容差（秒）
    CLOCK_TOLERANCE: 30
  },

  // 登录安全配置
  LOGIN: {
    // 最大失败尝试次数
    MAX_FAILED_ATTEMPTS: 5,
    // 账户锁定时间（分钟）
    LOCKOUT_DURATION: 30,
    // 登录尝试窗口时间（分钟）
    ATTEMPT_WINDOW: 15,
    // 是否启用验证码
    ENABLE_CAPTCHA: false,
    // 验证码阈值（失败次数）
    CAPTCHA_THRESHOLD: 3
  },

  // 会话安全配置
  SESSION: {
    // 会话超时时间（分钟）
    TIMEOUT: 30,
    // 最大并发会话数
    MAX_CONCURRENT_SESSIONS: 3,
    // 会话固定保护
    REGENERATE_SESSION_ID: true,
    // 安全cookie设置
    SECURE_COOKIES: process.env.NODE_ENV === 'production',
    // HttpOnly cookie
    HTTP_ONLY_COOKIES: true,
    // SameSite设置
    SAME_SITE: 'strict' as const
  },

  // 输入验证配置
  INPUT_VALIDATION: {
    // 最大请求体大小（字节）
    MAX_BODY_SIZE: 10 * 1024 * 1024, // 10MB
    // 最大字符串长度
    MAX_STRING_LENGTH: 1000,
    // 最大数组长度
    MAX_ARRAY_LENGTH: 100,
    // 允许的文件类型
    ALLOWED_FILE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
    // 最大文件大小（字节）
    MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
    // XSS过滤
    ENABLE_XSS_FILTER: true,
    // SQL注入防护
    ENABLE_SQL_INJECTION_FILTER: true
  },

  // 访问控制配置
  ACCESS_CONTROL: {
    // 默认拒绝策略
    DEFAULT_DENY: true,
    // 权限缓存时间（分钟）
    PERMISSION_CACHE_TTL: 5,
    // 角色缓存时间（分钟）
    ROLE_CACHE_TTL: 10,
    // 权限检查超时时间（毫秒）
    PERMISSION_CHECK_TIMEOUT: 1000,
    // 最大权限检查深度
    MAX_PERMISSION_DEPTH: 10
  },

  // 审计日志配置
  AUDIT_LOG: {
    // 是否启用审计日志
    ENABLED: true,
    // 日志级别
    LEVEL: 'info',
    // 敏感操作列表
    SENSITIVE_OPERATIONS: [
      'login',
      'logout',
      'password_change',
      'role_assignment',
      'permission_grant',
      'user_creation',
      'user_deletion',
      'role_creation',
      'role_deletion',
      'permission_creation',
      'permission_deletion'
    ],
    // 日志保留天数
    RETENTION_DAYS: 365,
    // 是否记录IP地址
    LOG_IP_ADDRESS: true,
    // 是否记录用户代理
    LOG_USER_AGENT: true
  },

  // 加密配置
  ENCRYPTION: {
    // 对称加密算法
    SYMMETRIC_ALGORITHM: 'aes-256-gcm',
    // 密钥长度
    KEY_LENGTH: 32,
    // IV长度
    IV_LENGTH: 16,
    // 标签长度
    TAG_LENGTH: 16,
    // 密钥派生迭代次数
    PBKDF2_ITERATIONS: 100000,
    // 盐长度
    SALT_LENGTH: 32
  },

  // 网络安全配置
  NETWORK: {
    // 信任的代理
    TRUSTED_PROXIES: ['127.0.0.1', '::1'],
    // 允许的来源
    ALLOWED_ORIGINS: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173'],
    // 最大请求大小
    MAX_REQUEST_SIZE: '10mb',
    // 请求超时时间（毫秒）
    REQUEST_TIMEOUT: 30000,
    // 是否启用HTTPS重定向
    FORCE_HTTPS: process.env.NODE_ENV === 'production'
  },

  // 安全头配置
  SECURITY_HEADERS: {
    // Content Security Policy
    CSP: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"]
      }
    },
    // X-Frame-Options
    FRAME_OPTIONS: 'DENY',
    // X-Content-Type-Options
    CONTENT_TYPE_OPTIONS: 'nosniff',
    // X-XSS-Protection
    XSS_PROTECTION: '1; mode=block',
    // Referrer-Policy
    REFERRER_POLICY: 'strict-origin-when-cross-origin',
    // Permissions-Policy
    PERMISSIONS_POLICY: {
      camera: [],
      microphone: [],
      geolocation: [],
      payment: []
    }
  }
}

// 安全验证函数
export class SecurityValidator {
  // 验证密码强度
  static validatePassword(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = []
    const config = SECURITY_CONFIG.PASSWORD

    if (password.length < config.MIN_LENGTH) {
      errors.push(`密码长度至少${config.MIN_LENGTH}位`)
    }

    if (password.length > config.MAX_LENGTH) {
      errors.push(`密码长度不能超过${config.MAX_LENGTH}位`)
    }

    if (config.REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) {
      errors.push('密码必须包含大写字母')
    }

    if (config.REQUIRE_LOWERCASE && !/[a-z]/.test(password)) {
      errors.push('密码必须包含小写字母')
    }

    if (config.REQUIRE_NUMBERS && !/\d/.test(password)) {
      errors.push('密码必须包含数字')
    }

    if (config.REQUIRE_SPECIAL_CHARS) {
      const specialCharsRegex = new RegExp(`[${config.SPECIAL_CHARS.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}]`)
      if (!specialCharsRegex.test(password)) {
        errors.push('密码必须包含特殊字符')
      }
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  // 验证输入长度
  static validateInputLength(input: string, maxLength: number = SECURITY_CONFIG.INPUT_VALIDATION.MAX_STRING_LENGTH): boolean {
    return input.length <= maxLength
  }

  // 检测XSS攻击
  static detectXSS(input: string): boolean {
    const xssPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
      /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
      /<embed\b[^>]*>/gi,
      /<link\b[^>]*>/gi,
      /<meta\b[^>]*>/gi
    ]

    return xssPatterns.some(pattern => pattern.test(input))
  }

  // 检测SQL注入
  static detectSQLInjection(input: string): boolean {
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
      /(\b(OR|AND)\s+\d+\s*=\s*\d+)/gi,
      /('|(\\')|(;)|(--)|(\s)|(\||(\*)))/gi,
      /(\b(WAITFOR|DELAY)\b)/gi,
      /(\b(BENCHMARK|SLEEP)\b)/gi
    ]

    return sqlPatterns.some(pattern => pattern.test(input))
  }

  // 验证文件类型
  static validateFileType(mimeType: string): boolean {
    return SECURITY_CONFIG.INPUT_VALIDATION.ALLOWED_FILE_TYPES.includes(mimeType)
  }

  // 验证文件大小
  static validateFileSize(size: number): boolean {
    return size <= SECURITY_CONFIG.INPUT_VALIDATION.MAX_FILE_SIZE
  }

  // 清理输入数据
  static sanitizeInput(input: string): string {
    return input
      .replace(/[<>]/g, '') // 移除尖括号
      .replace(/['"]/g, '') // 移除引号
      .replace(/[;&|]/g, '') // 移除分号、与符号、管道符
      .trim()
  }

  // 验证IP地址
  static validateIPAddress(ip: string): boolean {
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/
    const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/
    
    return ipv4Regex.test(ip) || ipv6Regex.test(ip)
  }

  // 验证用户代理字符串
  static validateUserAgent(userAgent: string): boolean {
    // 检查用户代理字符串是否合理
    return userAgent.length > 0 && userAgent.length < 500 && !/[<>'"&]/.test(userAgent)
  }
}

// 安全中间件配置
export const SECURITY_MIDDLEWARE_CONFIG = {
  // Helmet配置
  helmet: {
    contentSecurityPolicy: {
      directives: SECURITY_CONFIG.SECURITY_HEADERS.CSP.directives
    },
    frameguard: {
      action: SECURITY_CONFIG.SECURITY_HEADERS.FRAME_OPTIONS.toLowerCase()
    },
    noSniff: true,
    xssFilter: true,
    referrerPolicy: {
      policy: SECURITY_CONFIG.SECURITY_HEADERS.REFERRER_POLICY
    }
  },

  // CORS配置
  cors: {
    origin: SECURITY_CONFIG.NETWORK.ALLOWED_ORIGINS,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    maxAge: 86400 // 24小时
  },

  // 限流配置
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15分钟
    max: 1000, // 每个IP最多1000个请求
    message: {
      success: false,
      message: 'Too many requests from this IP, please try again later.',
      code: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false
  },

  // 慢速攻击防护
  slowDown: {
    windowMs: 15 * 60 * 1000, // 15分钟
    delayAfter: 100, // 100个请求后开始延迟
    delayMs: 500, // 每个请求延迟500ms
    maxDelayMs: 20000 // 最大延迟20秒
  }
}

// 安全事件类型
export enum SecurityEventType {
  LOGIN_SUCCESS = 'login_success',
  LOGIN_FAILURE = 'login_failure',
  LOGIN_BLOCKED = 'login_blocked',
  PASSWORD_CHANGE = 'password_change',
  PERMISSION_DENIED = 'permission_denied',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  XSS_ATTEMPT = 'xss_attempt',
  SQL_INJECTION_ATTEMPT = 'sql_injection_attempt',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  INVALID_TOKEN = 'invalid_token',
  TOKEN_EXPIRED = 'token_expired',
  PRIVILEGE_ESCALATION_ATTEMPT = 'privilege_escalation_attempt'
}

// 安全事件接口
export interface SecurityEvent {
  type: SecurityEventType
  userId?: string
  userAccount?: string
  ipAddress?: string
  userAgent?: string
  timestamp: Date
  details?: any
  severity: 'low' | 'medium' | 'high' | 'critical'
}

// 安全监控配置
export const SECURITY_MONITORING = {
  // 异常检测阈值
  ANOMALY_THRESHOLDS: {
    // 短时间内多次失败登录
    RAPID_LOGIN_FAILURES: {
      count: 10,
      timeWindow: 5 * 60 * 1000 // 5分钟
    },
    // 异常访问模式
    UNUSUAL_ACCESS_PATTERN: {
      requestsPerMinute: 100,
      uniqueEndpointsPerMinute: 50
    },
    // 权限检查失败
    PERMISSION_FAILURES: {
      count: 20,
      timeWindow: 10 * 60 * 1000 // 10分钟
    }
  },

  // 自动响应配置
  AUTO_RESPONSE: {
    // 是否启用自动封禁
    ENABLE_AUTO_BAN: true,
    // 封禁持续时间（分钟）
    BAN_DURATION: 60,
    // 触发封禁的阈值
    BAN_THRESHOLD: {
      suspiciousEvents: 5,
      timeWindow: 15 * 60 * 1000 // 15分钟
    }
  },

  // 通知配置
  NOTIFICATIONS: {
    // 是否启用安全事件通知
    ENABLED: true,
    // 通知级别阈值
    NOTIFICATION_THRESHOLD: 'medium',
    // 通知方式
    METHODS: ['email', 'webhook'],
    // 通知间隔（避免垃圾通知）
    NOTIFICATION_INTERVAL: 5 * 60 * 1000 // 5分钟
  }
}
