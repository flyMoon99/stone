import request from 'supertest'
import { app } from '../../src/app'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()

describe('RBAC Security Tests', () => {
  let superAdminToken: string
  let adminToken: string
  let testUserId: string
  let testRoleId: string

  beforeAll(async () => {
    // 获取测试tokens
    const superAdminLogin = await request(app)
      .post('/api/admin/login')
      .send({
        account: 'admin',
        password: 'Admin123!'
      })

    const adminLogin = await request(app)
      .post('/api/admin/login')
      .send({
        account: 'testadmin',
        password: 'Admin123!'
      })

    superAdminToken = superAdminLogin.body.data.token
    adminToken = adminLogin.body.data.token

    // 创建测试用户和角色
    const testUser = await prisma.admin.create({
      data: {
        account: 'security_test_user',
        password: await bcrypt.hash('TestPassword123!', 10),
        type: 'ADMIN',
        status: 'ACTIVE'
      }
    })
    testUserId = testUser.id

    const testRole = await prisma.role.create({
      data: {
        name: 'Security Test Role',
        code: 'security_test_role',
        description: 'Role for security testing'
      }
    })
    testRoleId = testRole.id
  })

  afterAll(async () => {
    // 清理测试数据
    try {
      await prisma.role.delete({ where: { id: testRoleId } })
      await prisma.admin.delete({ where: { id: testUserId } })
    } catch (error) {
      console.log('Cleanup error (expected):', error)
    }
    await prisma.$disconnect()
  })

  describe('Authentication Security Tests', () => {
    test('should reject login with SQL injection attempts', async () => {
      const sqlInjectionAttempts = [
        "admin'; DROP TABLE admins; --",
        "admin' OR '1'='1",
        "admin' UNION SELECT * FROM admins --",
        "admin'; UPDATE admins SET password='hacked' WHERE account='admin'; --"
      ]

      for (const maliciousAccount of sqlInjectionAttempts) {
        const response = await request(app)
          .post('/api/admin/login')
          .send({
            account: maliciousAccount,
            password: 'Admin123!'
          })

        expect(response.status).toBe(401)
        expect(response.body.success).toBe(false)
      }
    })

    test('should reject login with NoSQL injection attempts', async () => {
      const noSQLInjectionAttempts = [
        { $ne: null },
        { $gt: '' },
        { $regex: '.*' },
        { $where: 'this.account.length > 0' }
      ]

      for (const maliciousAccount of noSQLInjectionAttempts) {
        const response = await request(app)
          .post('/api/admin/login')
          .send({
            account: maliciousAccount,
            password: 'Admin123!'
          })

        expect(response.status).toBe(400)
        expect(response.body.success).toBe(false)
      }
    })

    test('should enforce password complexity requirements', async () => {
      const weakPasswords = [
        '123456',
        'password',
        'admin',
        'qwerty',
        '12345678',
        'abc123',
        'password123'
      ]

      for (const weakPassword of weakPasswords) {
        const response = await request(app)
          .post('/api/admin/admins')
          .set('Authorization', `Bearer ${superAdminToken}`)
          .send({
            account: 'weak_password_test',
            password: weakPassword,
            type: 'ADMIN'
          })

        expect(response.status).toBe(400)
        expect(response.body.success).toBe(false)
        expect(response.body.message).toMatch(/password/i)
      }
    })

    test('should prevent brute force attacks', async () => {
      const maxAttempts = 10
      const responses = []

      // 尝试多次错误登录
      for (let i = 0; i < maxAttempts; i++) {
        const response = await request(app)
          .post('/api/admin/login')
          .send({
            account: 'admin',
            password: 'wrongpassword'
          })
        responses.push(response)
      }

      // 检查是否有适当的限制
      const lastResponse = responses[responses.length - 1]
      expect(lastResponse.status).toBe(429) // Too Many Requests
    })

    test('should validate JWT token integrity', async () => {
      const invalidTokens = [
        'invalid.token.here',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature',
        '',
        'Bearer ',
        'malformed-token',
        jwt.sign({ id: 'fake-id', account: 'fake' }, 'wrong-secret')
      ]

      for (const invalidToken of invalidTokens) {
        const response = await request(app)
          .get('/api/rbac/roles')
          .set('Authorization', `Bearer ${invalidToken}`)

        expect(response.status).toBe(401)
        expect(response.body.success).toBe(false)
      }
    })

    test('should prevent token replay attacks', async () => {
      // 使用过期的token
      const expiredToken = jwt.sign(
        { id: testUserId, account: 'test', exp: Math.floor(Date.now() / 1000) - 3600 },
        process.env.JWT_SECRET || 'test-secret'
      )

      const response = await request(app)
        .get('/api/rbac/roles')
        .set('Authorization', `Bearer ${expiredToken}`)

      expect(response.status).toBe(401)
      expect(response.body.success).toBe(false)
    })
  })

  describe('Authorization Security Tests', () => {
    test('should prevent privilege escalation', async () => {
      // 普通管理员尝试访问超级管理员功能
      const privilegedEndpoints = [
        '/api/rbac/roles',
        '/api/rbac/permissions',
        '/api/admin/admins'
      ]

      for (const endpoint of privilegedEndpoints) {
        const response = await request(app)
          .get(endpoint)
          .set('Authorization', `Bearer ${adminToken}`)

        expect(response.status).toBe(403)
        expect(response.body.success).toBe(false)
      }
    })

    test('should prevent horizontal privilege escalation', async () => {
      // 用户尝试访问其他用户的数据
      const otherUserId = 'other-user-id'

      const response = await request(app)
        .get(`/api/rbac/users/${otherUserId}/permissions`)
        .set('Authorization', `Bearer ${adminToken}`)

      expect(response.status).toBe(403)
      expect(response.body.success).toBe(false)
    })

    test('should validate permission boundaries', async () => {
      // 测试权限边界检查
      const restrictedOperations = [
        { method: 'post', path: '/api/rbac/roles', data: { name: 'Hacker Role', code: 'hacker' } },
        { method: 'delete', path: `/api/rbac/roles/${testRoleId}` },
        { method: 'post', path: '/api/rbac/permissions', data: { key: 'hack.everything', name: 'Hack Everything' } }
      ]

      for (const operation of restrictedOperations) {
        let response
        if (operation.method === 'post') {
          response = await request(app)
            .post(operation.path)
            .set('Authorization', `Bearer ${adminToken}`)
            .send(operation.data)
        } else if (operation.method === 'delete') {
          response = await request(app)
            .delete(operation.path)
            .set('Authorization', `Bearer ${adminToken}`)
        }

        expect(response?.status).toBe(403)
        expect(response?.body.success).toBe(false)
      }
    })

    test('should prevent role manipulation by unauthorized users', async () => {
      // 尝试给自己分配更高权限的角色
      const response = await request(app)
        .post(`/api/rbac/users/${testUserId}/roles`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          roleIds: [testRoleId]
        })

      expect(response.status).toBe(403)
      expect(response.body.success).toBe(false)
    })
  })

  describe('Input Validation Security Tests', () => {
    test('should sanitize XSS attempts in role creation', async () => {
      const xssPayloads = [
        '<script>alert("XSS")</script>',
        'javascript:alert("XSS")',
        '<img src="x" onerror="alert(\'XSS\')">',
        '"><script>alert("XSS")</script>',
        '\'; DROP TABLE roles; --'
      ]

      for (const xssPayload of xssPayloads) {
        const response = await request(app)
          .post('/api/rbac/roles')
          .set('Authorization', `Bearer ${superAdminToken}`)
          .send({
            name: xssPayload,
            code: 'xss_test_role',
            description: 'XSS test role'
          })

        expect(response.status).toBe(400)
        expect(response.body.success).toBe(false)
      }
    })

    test('should validate input length limits', async () => {
      const longString = 'a'.repeat(1000)

      const response = await request(app)
        .post('/api/rbac/roles')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          name: longString,
          code: longString,
          description: longString
        })

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
    })

    test('should prevent path traversal attacks', async () => {
      const pathTraversalAttempts = [
        '../../../etc/passwd',
        '..\\..\\..\\windows\\system32\\config\\sam',
        '....//....//....//etc/passwd',
        '%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd'
      ]

      for (const maliciousPath of pathTraversalAttempts) {
        const response = await request(app)
          .get(`/api/rbac/roles/${maliciousPath}`)
          .set('Authorization', `Bearer ${superAdminToken}`)

        expect(response.status).toBe(400)
        expect(response.body.success).toBe(false)
      }
    })

    test('should validate JSON payload structure', async () => {
      const malformedPayloads = [
        '{"name": "test", "code": }', // 无效JSON
        '{"name": null, "code": null}', // null值
        '{"name": "", "code": ""}', // 空字符串
        '{"name": 123, "code": true}', // 错误类型
        '{}' // 缺少必需字段
      ]

      for (const payload of malformedPayloads) {
        const response = await request(app)
          .post('/api/rbac/roles')
          .set('Authorization', `Bearer ${superAdminToken}`)
          .set('Content-Type', 'application/json')
          .send(payload)

        expect(response.status).toBe(400)
        expect(response.body.success).toBe(false)
      }
    })
  })

  describe('Data Exposure Security Tests', () => {
    test('should not expose sensitive data in API responses', async () => {
      const response = await request(app)
        .get('/api/admin/profile')
        .set('Authorization', `Bearer ${superAdminToken}`)

      expect(response.status).toBe(200)
      expect(response.body.data.password).toBeUndefined()
      expect(response.body.data.refreshToken).toBeUndefined()
    })

    test('should not expose internal system information', async () => {
      const response = await request(app)
        .get('/api/rbac/roles')
        .set('Authorization', `Bearer ${superAdminToken}`)

      expect(response.status).toBe(200)
      
      // 检查响应中不应包含敏感的系统信息
      const responseString = JSON.stringify(response.body)
      expect(responseString).not.toMatch(/password/i)
      expect(responseString).not.toMatch(/secret/i)
      expect(responseString).not.toMatch(/private/i)
      expect(responseString).not.toMatch(/internal/i)
    })

    test('should prevent information disclosure through error messages', async () => {
      // 尝试访问不存在的资源
      const response = await request(app)
        .get('/api/rbac/roles/non-existent-id')
        .set('Authorization', `Bearer ${superAdminToken}`)

      expect(response.status).toBe(404)
      expect(response.body.success).toBe(false)
      
      // 错误消息不应泄露系统内部信息
      expect(response.body.message).not.toMatch(/database/i)
      expect(response.body.message).not.toMatch(/sql/i)
      expect(response.body.message).not.toMatch(/prisma/i)
    })
  })

  describe('Session Security Tests', () => {
    test('should invalidate tokens on logout', async () => {
      // 登录获取token
      const loginResponse = await request(app)
        .post('/api/admin/login')
        .send({
          account: 'security_test_user',
          password: 'TestPassword123!'
        })

      const token = loginResponse.body.data.token

      // 使用token访问受保护资源
      const accessResponse = await request(app)
        .get('/api/admin/profile')
        .set('Authorization', `Bearer ${token}`)

      expect(accessResponse.status).toBe(200)

      // 登出
      const logoutResponse = await request(app)
        .post('/api/admin/logout')
        .set('Authorization', `Bearer ${token}`)

      expect(logoutResponse.status).toBe(200)

      // 尝试使用已登出的token
      const postLogoutResponse = await request(app)
        .get('/api/admin/profile')
        .set('Authorization', `Bearer ${token}`)

      expect(postLogoutResponse.status).toBe(401)
    })

    test('should enforce token expiration', async () => {
      // 创建一个即将过期的token
      const shortLivedToken = jwt.sign(
        { id: testUserId, account: 'test', exp: Math.floor(Date.now() / 1000) + 1 },
        process.env.JWT_SECRET || 'test-secret'
      )

      // 等待token过期
      await new Promise(resolve => setTimeout(resolve, 2000))

      const response = await request(app)
        .get('/api/admin/profile')
        .set('Authorization', `Bearer ${shortLivedToken}`)

      expect(response.status).toBe(401)
      expect(response.body.success).toBe(false)
    })
  })

  describe('Rate Limiting Security Tests', () => {
    test('should enforce API rate limits', async () => {
      const requests = []
      const maxRequests = 100

      // 发送大量请求
      for (let i = 0; i < maxRequests; i++) {
        requests.push(
          request(app)
            .get('/api/public/health')
            .set('X-Forwarded-For', '192.168.1.100') // 模拟同一IP
        )
      }

      const responses = await Promise.all(requests)
      
      // 检查是否有请求被限制
      const rateLimitedResponses = responses.filter(r => r.status === 429)
      expect(rateLimitedResponses.length).toBeGreaterThan(0)
    })

    test('should enforce login attempt limits', async () => {
      const maxAttempts = 5
      const responses = []

      // 多次错误登录尝试
      for (let i = 0; i < maxAttempts + 2; i++) {
        const response = await request(app)
          .post('/api/admin/login')
          .set('X-Forwarded-For', '192.168.1.101') // 模拟同一IP
          .send({
            account: 'admin',
            password: 'wrongpassword'
          })
        responses.push(response)
      }

      // 最后几次请求应该被限制
      const lastResponses = responses.slice(-2)
      expect(lastResponses.some(r => r.status === 429)).toBe(true)
    })
  })

  describe('CORS Security Tests', () => {
    test('should enforce CORS policy', async () => {
      const response = await request(app)
        .options('/api/admin/login')
        .set('Origin', 'https://malicious-site.com')
        .set('Access-Control-Request-Method', 'POST')

      // 应该拒绝来自未授权域的请求
      expect(response.headers['access-control-allow-origin']).not.toBe('https://malicious-site.com')
    })

    test('should allow requests from authorized origins', async () => {
      const response = await request(app)
        .options('/api/admin/login')
        .set('Origin', 'http://localhost:5173')
        .set('Access-Control-Request-Method', 'POST')

      expect(response.headers['access-control-allow-origin']).toBe('http://localhost:5173')
    })
  })

  describe('Content Security Tests', () => {
    test('should set security headers', async () => {
      const response = await request(app)
        .get('/api/public/health')

      // 检查安全头
      expect(response.headers['x-content-type-options']).toBe('nosniff')
      expect(response.headers['x-frame-options']).toBeDefined()
      expect(response.headers['x-xss-protection']).toBeDefined()
    })

    test('should prevent MIME type sniffing', async () => {
      const response = await request(app)
        .get('/api/public/health')

      expect(response.headers['x-content-type-options']).toBe('nosniff')
      expect(response.headers['content-type']).toMatch(/application\/json/)
    })
  })

  describe('Database Security Tests', () => {
    test('should prevent SQL injection in dynamic queries', async () => {
      const maliciousInput = "'; DROP TABLE roles; --"

      const response = await request(app)
        .get(`/api/rbac/roles?search=${encodeURIComponent(maliciousInput)}`)
        .set('Authorization', `Bearer ${superAdminToken}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)

      // 验证表仍然存在
      const rolesStillExist = await prisma.role.findMany()
      expect(rolesStillExist.length).toBeGreaterThan(0)
    })

    test('should use parameterized queries', async () => {
      // 测试参数化查询是否正确处理特殊字符
      const specialCharacters = ["'", '"', ';', '--', '/*', '*/', 'UNION', 'SELECT']

      for (const char of specialCharacters) {
        const response = await request(app)
          .post('/api/rbac/roles')
          .set('Authorization', `Bearer ${superAdminToken}`)
          .send({
            name: `Test Role ${char}`,
            code: `test_role_${Date.now()}`,
            description: `Role with special character: ${char}`
          })

        // 应该正常处理或返回验证错误，而不是数据库错误
        expect([200, 201, 400]).toContain(response.status)
        expect(response.status).not.toBe(500)
      }
    })
  })
})
