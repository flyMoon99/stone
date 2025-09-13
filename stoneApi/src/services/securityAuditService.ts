import { PrismaClient } from '@prisma/client'
import { logger } from '../utils/logger'
import { SecurityEvent, SecurityEventType, SECURITY_CONFIG, SECURITY_MONITORING } from '../config/security'

const prisma = new PrismaClient()

// 安全审计日志接口
interface AuditLog {
  id?: string
  eventType: SecurityEventType
  userId?: string
  userAccount?: string
  ipAddress?: string
  userAgent?: string
  requestPath?: string
  requestMethod?: string
  requestBody?: any
  responseStatus?: number
  timestamp: Date
  severity: 'low' | 'medium' | 'high' | 'critical'
  details?: any
  resolved?: boolean
  resolvedAt?: Date
  resolvedBy?: string
}

// 安全威胁检测结果
interface ThreatDetectionResult {
  isThreat: boolean
  threatType?: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  confidence: number
  details?: any
}

export class SecurityAuditService {
  private static instance: SecurityAuditService
  private eventBuffer: SecurityEvent[] = []
  private suspiciousIPs: Map<string, { count: number; lastSeen: Date }> = new Map()

  static getInstance(): SecurityAuditService {
    if (!SecurityAuditService.instance) {
      SecurityAuditService.instance = new SecurityAuditService()
    }
    return SecurityAuditService.instance
  }

  // 记录安全事件
  async logSecurityEvent(event: SecurityEvent): Promise<void> {
    try {
      // 添加到事件缓冲区
      this.eventBuffer.push(event)

      // 创建审计日志记录
      const auditLog: AuditLog = {
        eventType: event.type,
        userId: event.userId,
        userAccount: event.userAccount,
        ipAddress: event.ipAddress,
        userAgent: event.userAgent,
        timestamp: event.timestamp,
        severity: event.severity,
        details: event.details
      }

      // 保存到数据库（如果有审计日志表）
      if (SECURITY_CONFIG.AUDIT_LOG.ENABLED) {
        await this.saveAuditLog(auditLog)
      }

      // 记录到日志文件
      logger.warn(`Security Event: ${event.type}`, {
        userId: event.userId,
        userAccount: event.userAccount,
        ipAddress: event.ipAddress,
        severity: event.severity,
        details: event.details
      })

      // 实时威胁检测
      await this.detectThreats(event)

      // 清理旧的事件缓冲区
      this.cleanupEventBuffer()

    } catch (error) {
      logger.error('Failed to log security event:', error)
    }
  }

  // 保存审计日志到数据库
  private async saveAuditLog(auditLog: AuditLog): Promise<void> {
    try {
      // 这里假设有一个audit_logs表
      // 实际实现中需要根据数据库schema调整
      await prisma.$executeRaw`
        INSERT INTO audit_logs (
          event_type, user_id, user_account, ip_address, user_agent,
          request_path, request_method, response_status, timestamp,
          severity, details
        ) VALUES (
          ${auditLog.eventType}, ${auditLog.userId}, ${auditLog.userAccount},
          ${auditLog.ipAddress}, ${auditLog.userAgent}, ${auditLog.requestPath},
          ${auditLog.requestMethod}, ${auditLog.responseStatus}, ${auditLog.timestamp},
          ${auditLog.severity}, ${JSON.stringify(auditLog.details)}
        )
      `
    } catch (error) {
      // 如果审计日志表不存在，只记录到文件
      logger.debug('Audit log table not available, logging to file only')
    }
  }

  // 威胁检测
  private async detectThreats(event: SecurityEvent): Promise<void> {
    const detectionResults: ThreatDetectionResult[] = []

    // 1. 检测暴力破解攻击
    if (event.type === SecurityEventType.LOGIN_FAILURE) {
      const bruteForceResult = this.detectBruteForceAttack(event)
      if (bruteForceResult.isThreat) {
        detectionResults.push(bruteForceResult)
      }
    }

    // 2. 检测异常访问模式
    if (event.ipAddress) {
      const anomalyResult = this.detectAccessAnomaly(event)
      if (anomalyResult.isThreat) {
        detectionResults.push(anomalyResult)
      }
    }

    // 3. 检测权限提升尝试
    if (event.type === SecurityEventType.PERMISSION_DENIED) {
      const escalationResult = this.detectPrivilegeEscalation(event)
      if (escalationResult.isThreat) {
        detectionResults.push(escalationResult)
      }
    }

    // 4. 检测注入攻击
    if (event.type === SecurityEventType.SQL_INJECTION_ATTEMPT || 
        event.type === SecurityEventType.XSS_ATTEMPT) {
      const injectionResult = this.detectInjectionAttack(event)
      if (injectionResult.isThreat) {
        detectionResults.push(injectionResult)
      }
    }

    // 处理检测到的威胁
    for (const result of detectionResults) {
      await this.handleThreatDetection(event, result)
    }
  }

  // 检测暴力破解攻击
  private detectBruteForceAttack(event: SecurityEvent): ThreatDetectionResult {
    if (!event.ipAddress) {
      return { isThreat: false, severity: 'low', confidence: 0 }
    }

    const threshold = SECURITY_MONITORING.ANOMALY_THRESHOLDS.RAPID_LOGIN_FAILURES
    const recentFailures = this.eventBuffer.filter(e => 
      e.type === SecurityEventType.LOGIN_FAILURE &&
      e.ipAddress === event.ipAddress &&
      Date.now() - e.timestamp.getTime() < threshold.timeWindow
    )

    if (recentFailures.length >= threshold.count) {
      return {
        isThreat: true,
        threatType: 'brute_force_attack',
        severity: 'high',
        confidence: 0.9,
        details: {
          failureCount: recentFailures.length,
          timeWindow: threshold.timeWindow,
          ipAddress: event.ipAddress
        }
      }
    }

    return { isThreat: false, severity: 'low', confidence: 0 }
  }

  // 检测异常访问模式
  private detectAccessAnomaly(event: SecurityEvent): ThreatDetectionResult {
    if (!event.ipAddress) {
      return { isThreat: false, severity: 'low', confidence: 0 }
    }

    const threshold = SECURITY_MONITORING.ANOMALY_THRESHOLDS.UNUSUAL_ACCESS_PATTERN
    const oneMinuteAgo = Date.now() - 60 * 1000

    const recentEvents = this.eventBuffer.filter(e => 
      e.ipAddress === event.ipAddress &&
      e.timestamp.getTime() > oneMinuteAgo
    )

    const requestsPerMinute = recentEvents.length
    const uniqueEndpoints = new Set(recentEvents.map(e => e.details?.endpoint)).size

    if (requestsPerMinute > threshold.requestsPerMinute || 
        uniqueEndpoints > threshold.uniqueEndpointsPerMinute) {
      return {
        isThreat: true,
        threatType: 'unusual_access_pattern',
        severity: 'medium',
        confidence: 0.7,
        details: {
          requestsPerMinute,
          uniqueEndpoints,
          ipAddress: event.ipAddress
        }
      }
    }

    return { isThreat: false, severity: 'low', confidence: 0 }
  }

  // 检测权限提升尝试
  private detectPrivilegeEscalation(event: SecurityEvent): ThreatDetectionResult {
    const threshold = SECURITY_MONITORING.ANOMALY_THRESHOLDS.PERMISSION_FAILURES
    const recentDenials = this.eventBuffer.filter(e => 
      e.type === SecurityEventType.PERMISSION_DENIED &&
      e.userId === event.userId &&
      Date.now() - e.timestamp.getTime() < threshold.timeWindow
    )

    if (recentDenials.length >= threshold.count) {
      return {
        isThreat: true,
        threatType: 'privilege_escalation_attempt',
        severity: 'high',
        confidence: 0.8,
        details: {
          denialCount: recentDenials.length,
          userId: event.userId,
          timeWindow: threshold.timeWindow
        }
      }
    }

    return { isThreat: false, severity: 'low', confidence: 0 }
  }

  // 检测注入攻击
  private detectInjectionAttack(event: SecurityEvent): ThreatDetectionResult {
    return {
      isThreat: true,
      threatType: event.type === SecurityEventType.SQL_INJECTION_ATTEMPT ? 'sql_injection' : 'xss_attack',
      severity: 'high',
      confidence: 0.95,
      details: {
        attackType: event.type,
        payload: event.details?.payload,
        endpoint: event.details?.endpoint
      }
    }
  }

  // 处理威胁检测结果
  private async handleThreatDetection(event: SecurityEvent, result: ThreatDetectionResult): Promise<void> {
    logger.warn(`Threat detected: ${result.threatType}`, {
      severity: result.severity,
      confidence: result.confidence,
      details: result.details
    })

    // 自动响应
    if (SECURITY_MONITORING.AUTO_RESPONSE.ENABLE_AUTO_BAN && 
        result.severity === 'high' && 
        result.confidence > 0.8) {
      await this.autoBlockIP(event.ipAddress, result)
    }

    // 发送通知
    if (SECURITY_MONITORING.NOTIFICATIONS.ENABLED) {
      await this.sendSecurityNotification(event, result)
    }

    // 记录威胁事件
    await this.logSecurityEvent({
      type: SecurityEventType.SUSPICIOUS_ACTIVITY,
      userId: event.userId,
      userAccount: event.userAccount,
      ipAddress: event.ipAddress,
      userAgent: event.userAgent,
      timestamp: new Date(),
      severity: result.severity,
      details: {
        originalEvent: event,
        threatDetection: result
      }
    })
  }

  // 自动封禁IP
  private async autoBlockIP(ipAddress?: string, result?: ThreatDetectionResult): Promise<void> {
    if (!ipAddress) return

    try {
      const banDuration = SECURITY_MONITORING.AUTO_RESPONSE.BAN_DURATION * 60 * 1000
      const expiresAt = new Date(Date.now() + banDuration)

      // 这里假设有一个ip_bans表
      await prisma.$executeRaw`
        INSERT INTO ip_bans (ip_address, reason, expires_at, created_at)
        VALUES (${ipAddress}, ${result?.threatType || 'suspicious_activity'}, ${expiresAt}, ${new Date()})
        ON CONFLICT (ip_address) DO UPDATE SET
          expires_at = ${expiresAt},
          reason = ${result?.threatType || 'suspicious_activity'}
      `

      logger.warn(`Auto-blocked IP: ${ipAddress}`, {
        reason: result?.threatType,
        duration: banDuration,
        expiresAt
      })
    } catch (error) {
      logger.error('Failed to auto-block IP:', error)
    }
  }

  // 发送安全通知
  private async sendSecurityNotification(event: SecurityEvent, result: ThreatDetectionResult): Promise<void> {
    // 检查通知级别阈值
    const severityLevels = { low: 1, medium: 2, high: 3, critical: 4 }
    const thresholdLevel = severityLevels[SECURITY_MONITORING.NOTIFICATIONS.NOTIFICATION_THRESHOLD]
    const eventLevel = severityLevels[result.severity]

    if (eventLevel < thresholdLevel) {
      return
    }

    // 防止垃圾通知
    const lastNotificationKey = `${result.threatType}_${event.ipAddress}`
    const lastNotification = this.suspiciousIPs.get(lastNotificationKey)
    const now = new Date()

    if (lastNotification && 
        now.getTime() - lastNotification.lastSeen.getTime() < SECURITY_MONITORING.NOTIFICATIONS.NOTIFICATION_INTERVAL) {
      return
    }

    this.suspiciousIPs.set(lastNotificationKey, { count: 1, lastSeen: now })

    // 构建通知消息
    const notification = {
      title: `Security Alert: ${result.threatType}`,
      severity: result.severity,
      timestamp: event.timestamp,
      details: {
        threatType: result.threatType,
        confidence: result.confidence,
        ipAddress: event.ipAddress,
        userAccount: event.userAccount,
        details: result.details
      }
    }

    // 发送通知（这里可以集成邮件、Slack、钉钉等）
    logger.error('Security notification:', notification)

    // TODO: 实现实际的通知发送逻辑
    // await this.sendEmailNotification(notification)
    // await this.sendWebhookNotification(notification)
  }

  // 清理事件缓冲区
  private cleanupEventBuffer(): void {
    const maxAge = 24 * 60 * 60 * 1000 // 24小时
    const cutoff = Date.now() - maxAge

    this.eventBuffer = this.eventBuffer.filter(event => 
      event.timestamp.getTime() > cutoff
    )

    // 限制缓冲区大小
    const maxSize = 10000
    if (this.eventBuffer.length > maxSize) {
      this.eventBuffer = this.eventBuffer.slice(-maxSize)
    }
  }

  // 获取安全统计信息
  async getSecurityStats(timeRange: { start: Date; end: Date }): Promise<any> {
    try {
      const stats = {
        totalEvents: 0,
        eventsByType: {} as Record<string, number>,
        eventsBySeverity: {} as Record<string, number>,
        topThreats: [] as any[],
        suspiciousIPs: [] as any[],
        timeRange
      }

      // 从事件缓冲区统计
      const eventsInRange = this.eventBuffer.filter(event => 
        event.timestamp >= timeRange.start && event.timestamp <= timeRange.end
      )

      stats.totalEvents = eventsInRange.length

      // 按类型统计
      eventsInRange.forEach(event => {
        stats.eventsByType[event.type] = (stats.eventsByType[event.type] || 0) + 1
        stats.eventsBySeverity[event.severity] = (stats.eventsBySeverity[event.severity] || 0) + 1
      })

      // 统计可疑IP
      const ipCounts = new Map<string, number>()
      eventsInRange.forEach(event => {
        if (event.ipAddress) {
          ipCounts.set(event.ipAddress, (ipCounts.get(event.ipAddress) || 0) + 1)
        }
      })

      stats.suspiciousIPs = Array.from(ipCounts.entries())
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([ip, count]) => ({ ip, count }))

      return stats
    } catch (error) {
      logger.error('Failed to get security stats:', error)
      throw error
    }
  }

  // 检查IP是否被封禁
  async isIPBlocked(ipAddress: string): Promise<boolean> {
    try {
      const result = await prisma.$queryRaw`
        SELECT COUNT(*) as count FROM ip_bans 
        WHERE ip_address = ${ipAddress} AND expires_at > ${new Date()}
      ` as any[]

      return result[0]?.count > 0
    } catch (error) {
      // 如果表不存在，返回false
      return false
    }
  }

  // 解封IP
  async unblockIP(ipAddress: string, adminId: string): Promise<void> {
    try {
      await prisma.$executeRaw`
        UPDATE ip_bans SET 
          expires_at = ${new Date()},
          resolved = true,
          resolved_at = ${new Date()},
          resolved_by = ${adminId}
        WHERE ip_address = ${ipAddress}
      `

      logger.info(`IP unblocked: ${ipAddress} by admin: ${adminId}`)
    } catch (error) {
      logger.error('Failed to unblock IP:', error)
      throw error
    }
  }

  // 获取审计日志
  async getAuditLogs(params: {
    page?: number
    pageSize?: number
    eventType?: SecurityEventType
    severity?: string
    userId?: string
    ipAddress?: string
    startDate?: Date
    endDate?: Date
  }): Promise<{ logs: AuditLog[]; total: number }> {
    try {
      const page = params.page || 1
      const pageSize = params.pageSize || 50
      const offset = (page - 1) * pageSize

      let whereClause = 'WHERE 1=1'
      const queryParams: any[] = []

      if (params.eventType) {
        whereClause += ` AND event_type = $${queryParams.length + 1}`
        queryParams.push(params.eventType)
      }

      if (params.severity) {
        whereClause += ` AND severity = $${queryParams.length + 1}`
        queryParams.push(params.severity)
      }

      if (params.userId) {
        whereClause += ` AND user_id = $${queryParams.length + 1}`
        queryParams.push(params.userId)
      }

      if (params.ipAddress) {
        whereClause += ` AND ip_address = $${queryParams.length + 1}`
        queryParams.push(params.ipAddress)
      }

      if (params.startDate) {
        whereClause += ` AND timestamp >= $${queryParams.length + 1}`
        queryParams.push(params.startDate)
      }

      if (params.endDate) {
        whereClause += ` AND timestamp <= $${queryParams.length + 1}`
        queryParams.push(params.endDate)
      }

      const logs = await prisma.$queryRaw`
        SELECT * FROM audit_logs 
        ${whereClause}
        ORDER BY timestamp DESC
        LIMIT ${pageSize} OFFSET ${offset}
      ` as AuditLog[]

      const totalResult = await prisma.$queryRaw`
        SELECT COUNT(*) as count FROM audit_logs ${whereClause}
      ` as any[]

      return {
        logs,
        total: totalResult[0]?.count || 0
      }
    } catch (error) {
      logger.error('Failed to get audit logs:', error)
      return { logs: [], total: 0 }
    }
  }
}

// 导出单例实例
export const securityAuditService = SecurityAuditService.getInstance()
