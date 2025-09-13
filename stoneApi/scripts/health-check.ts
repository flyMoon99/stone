#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client'
import axios from 'axios'
import { performance } from 'perf_hooks'

const prisma = new PrismaClient()

interface HealthCheckResult {
  component: string
  status: 'healthy' | 'unhealthy' | 'warning'
  responseTime?: number
  message?: string
  details?: any
}

class HealthChecker {
  private results: HealthCheckResult[] = []

  async checkDatabase(): Promise<HealthCheckResult> {
    try {
      const startTime = performance.now()
      
      // 检查数据库连接
      await prisma.$queryRaw`SELECT 1`
      
      // 检查RBAC表是否存在且有数据
      const [roleCount, permissionCount, adminCount] = await Promise.all([
        prisma.role.count(),
        prisma.permission.count(),
        prisma.admin.count()
      ])

      const endTime = performance.now()
      const responseTime = endTime - startTime

      if (roleCount === 0 || permissionCount === 0 || adminCount === 0) {
        return {
          component: 'Database',
          status: 'warning',
          responseTime,
          message: 'Database connected but missing seed data',
          details: { roleCount, permissionCount, adminCount }
        }
      }

      return {
        component: 'Database',
        status: 'healthy',
        responseTime,
        message: 'Database connection and RBAC data OK',
        details: { roleCount, permissionCount, adminCount }
      }
    } catch (error) {
      return {
        component: 'Database',
        status: 'unhealthy',
        message: `Database error: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  async checkAPI(): Promise<HealthCheckResult> {
    try {
      const startTime = performance.now()
      
      // 检查健康检查端点
      const response = await axios.get('http://localhost:3000/api/public/health', {
        timeout: 5000
      })

      const endTime = performance.now()
      const responseTime = endTime - startTime

      if (response.status === 200 && response.data.success) {
        return {
          component: 'API',
          status: 'healthy',
          responseTime,
          message: 'API endpoints responding normally',
          details: response.data
        }
      } else {
        return {
          component: 'API',
          status: 'unhealthy',
          message: 'API health check failed',
          details: response.data
        }
      }
    } catch (error) {
      return {
        component: 'API',
        status: 'unhealthy',
        message: `API error: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  async checkAuthentication(): Promise<HealthCheckResult> {
    try {
      const startTime = performance.now()
      
      // 测试登录功能
      const loginResponse = await axios.post('http://localhost:3000/api/admin/login', {
        account: 'admin',
        password: 'Admin123!'
      }, {
        timeout: 5000
      })

      if (!loginResponse.data.success || !loginResponse.data.data.token) {
        return {
          component: 'Authentication',
          status: 'unhealthy',
          message: 'Login failed or no token returned'
        }
      }

      // 测试token验证
      const token = loginResponse.data.data.token
      const profileResponse = await axios.get('http://localhost:3000/api/admin/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        timeout: 5000
      })

      const endTime = performance.now()
      const responseTime = endTime - startTime

      if (profileResponse.data.success) {
        return {
          component: 'Authentication',
          status: 'healthy',
          responseTime,
          message: 'Authentication system working correctly',
          details: {
            user: profileResponse.data.data.account,
            type: profileResponse.data.data.type
          }
        }
      } else {
        return {
          component: 'Authentication',
          status: 'unhealthy',
          message: 'Token validation failed'
        }
      }
    } catch (error) {
      return {
        component: 'Authentication',
        status: 'unhealthy',
        message: `Authentication error: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  async checkRBACSystem(): Promise<HealthCheckResult> {
    try {
      const startTime = performance.now()
      
      // 先登录获取token
      const loginResponse = await axios.post('http://localhost:3000/api/admin/login', {
        account: 'admin',
        password: 'Admin123!'
      })

      if (!loginResponse.data.success) {
        return {
          component: 'RBAC System',
          status: 'unhealthy',
          message: 'Cannot login to test RBAC system'
        }
      }

      const token = loginResponse.data.data.token

      // 测试角色管理
      const rolesResponse = await axios.get('http://localhost:3000/api/rbac/roles', {
        headers: { 'Authorization': `Bearer ${token}` },
        timeout: 5000
      })

      // 测试权限管理
      const permissionsResponse = await axios.get('http://localhost:3000/api/rbac/permissions/tree', {
        headers: { 'Authorization': `Bearer ${token}` },
        timeout: 5000
      })

      // 测试用户权限查询
      const userId = loginResponse.data.data.user.id
      const userPermissionsResponse = await axios.get(`http://localhost:3000/api/rbac/users/${userId}/permissions`, {
        headers: { 'Authorization': `Bearer ${token}` },
        timeout: 5000
      })

      const endTime = performance.now()
      const responseTime = endTime - startTime

      const allSuccessful = [rolesResponse, permissionsResponse, userPermissionsResponse]
        .every(response => response.data.success)

      if (allSuccessful) {
        return {
          component: 'RBAC System',
          status: 'healthy',
          responseTime,
          message: 'RBAC system fully functional',
          details: {
            rolesCount: rolesResponse.data.data.items?.length || rolesResponse.data.data.length,
            permissionsCount: permissionsResponse.data.data.length,
            userHasPermissions: userPermissionsResponse.data.data.permissionKeys.length > 0
          }
        }
      } else {
        return {
          component: 'RBAC System',
          status: 'unhealthy',
          message: 'Some RBAC endpoints failed'
        }
      }
    } catch (error) {
      return {
        component: 'RBAC System',
        status: 'unhealthy',
        message: `RBAC system error: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  async checkPerformance(): Promise<HealthCheckResult> {
    try {
      const startTime = performance.now()
      
      // 登录获取token
      const loginResponse = await axios.post('http://localhost:3000/api/admin/login', {
        account: 'admin',
        password: 'Admin123!'
      })

      const token = loginResponse.data.data.token

      // 执行多个并发请求测试性能
      const concurrentRequests = 10
      const requests = Array(concurrentRequests).fill(null).map(() =>
        axios.get('http://localhost:3000/api/rbac/permissions/tree', {
          headers: { 'Authorization': `Bearer ${token}` },
          timeout: 5000
        })
      )

      await Promise.all(requests)

      const endTime = performance.now()
      const totalTime = endTime - startTime
      const averageTime = totalTime / concurrentRequests

      let status: 'healthy' | 'warning' | 'unhealthy' = 'healthy'
      let message = 'Performance is optimal'

      if (averageTime > 200) {
        status = 'warning'
        message = 'Performance is slower than expected'
      }

      if (averageTime > 500) {
        status = 'unhealthy'
        message = 'Performance is poor'
      }

      return {
        component: 'Performance',
        status,
        responseTime: totalTime,
        message,
        details: {
          concurrentRequests,
          totalTime: `${totalTime.toFixed(2)}ms`,
          averageTime: `${averageTime.toFixed(2)}ms`
        }
      }
    } catch (error) {
      return {
        component: 'Performance',
        status: 'unhealthy',
        message: `Performance test error: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  async runAllChecks(): Promise<HealthCheckResult[]> {
    console.log('🏥 Starting RBAC System Health Check...\n')

    const checks = [
      { name: 'Database', check: () => this.checkDatabase() },
      { name: 'API', check: () => this.checkAPI() },
      { name: 'Authentication', check: () => this.checkAuthentication() },
      { name: 'RBAC System', check: () => this.checkRBACSystem() },
      { name: 'Performance', check: () => this.checkPerformance() }
    ]

    for (const { name, check } of checks) {
      console.log(`🔍 Checking ${name}...`)
      const result = await check()
      this.results.push(result)
      
      const statusIcon = result.status === 'healthy' ? '✅' : 
                        result.status === 'warning' ? '⚠️' : '❌'
      
      console.log(`${statusIcon} ${result.component}: ${result.message}`)
      
      if (result.responseTime) {
        console.log(`   Response Time: ${result.responseTime.toFixed(2)}ms`)
      }
      
      if (result.details) {
        console.log(`   Details:`, result.details)
      }
      
      console.log('')
    }

    return this.results
  }

  generateReport(): void {
    console.log('📊 Health Check Summary')
    console.log('=' .repeat(50))

    const healthy = this.results.filter(r => r.status === 'healthy').length
    const warnings = this.results.filter(r => r.status === 'warning').length
    const unhealthy = this.results.filter(r => r.status === 'unhealthy').length

    console.log(`✅ Healthy: ${healthy}`)
    console.log(`⚠️  Warnings: ${warnings}`)
    console.log(`❌ Unhealthy: ${unhealthy}`)
    console.log('')

    const overallStatus = unhealthy > 0 ? 'CRITICAL' :
                         warnings > 0 ? 'WARNING' : 'HEALTHY'

    console.log(`🎯 Overall System Status: ${overallStatus}`)

    if (unhealthy > 0) {
      console.log('\n🚨 Critical Issues:')
      this.results
        .filter(r => r.status === 'unhealthy')
        .forEach(r => console.log(`   - ${r.component}: ${r.message}`))
    }

    if (warnings > 0) {
      console.log('\n⚠️  Warnings:')
      this.results
        .filter(r => r.status === 'warning')
        .forEach(r => console.log(`   - ${r.component}: ${r.message}`))
    }
  }
}

async function main() {
  const healthChecker = new HealthChecker()
  
  try {
    await healthChecker.runAllChecks()
    healthChecker.generateReport()
  } catch (error) {
    console.error('❌ Health check failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main().catch(console.error)
}

export { HealthChecker }
