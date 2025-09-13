import request from 'supertest'
import { app } from '../../src/app'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

describe('RBAC Integration Tests', () => {
  let superAdminToken: string
  let adminToken: string
  let userManagerToken: string

  beforeAll(async () => {
    // 获取各种角色的token
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
    
    const userManagerLogin = await request(app)
      .post('/api/admin/login')
      .send({
        account: 'usermanager',
        password: 'Admin123!'
      })

    superAdminToken = superAdminLogin.body.data.token
    adminToken = adminLogin.body.data.token
    userManagerToken = userManagerLogin.body.data.token
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  describe('Authentication Tests', () => {
    test('should login successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/api/admin/login')
        .send({
          account: 'admin',
          password: 'Admin123!'
        })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.token).toBeDefined()
      expect(response.body.data.user.account).toBe('admin')
    })

    test('should fail login with invalid credentials', async () => {
      const response = await request(app)
        .post('/api/admin/login')
        .send({
          account: 'admin',
          password: 'wrongpassword'
        })

      expect(response.status).toBe(401)
      expect(response.body.success).toBe(false)
    })
  })

  describe('Role Management Tests', () => {
    test('super admin should access role management', async () => {
      const response = await request(app)
        .get('/api/rbac/roles')
        .set('Authorization', `Bearer ${superAdminToken}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(Array.isArray(response.body.data.items)).toBe(true)
    })

    test('regular admin should be denied role management access', async () => {
      const response = await request(app)
        .get('/api/rbac/roles')
        .set('Authorization', `Bearer ${adminToken}`)

      expect(response.status).toBe(403)
      expect(response.body.success).toBe(false)
    })

    test('should create new role with super admin', async () => {
      const response = await request(app)
        .post('/api/rbac/roles')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          name: 'Test Role',
          code: 'test_role',
          description: 'A test role for integration testing'
        })

      expect(response.status).toBe(201)
      expect(response.body.success).toBe(true)
      expect(response.body.data.name).toBe('Test Role')
      expect(response.body.data.code).toBe('test_role')
    })

    test('should update role with super admin', async () => {
      // First create a role
      const createResponse = await request(app)
        .post('/api/rbac/roles')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          name: 'Update Test Role',
          code: 'update_test_role',
          description: 'Role for update testing'
        })

      const roleId = createResponse.body.data.id

      // Then update it
      const updateResponse = await request(app)
        .put(`/api/rbac/roles/${roleId}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          name: 'Updated Test Role',
          description: 'Updated description'
        })

      expect(updateResponse.status).toBe(200)
      expect(updateResponse.body.success).toBe(true)
      expect(updateResponse.body.data.name).toBe('Updated Test Role')
    })
  })

  describe('Permission Management Tests', () => {
    test('super admin should access permission management', async () => {
      const response = await request(app)
        .get('/api/rbac/permissions')
        .set('Authorization', `Bearer ${superAdminToken}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(Array.isArray(response.body.data.items)).toBe(true)
    })

    test('should get permission tree', async () => {
      const response = await request(app)
        .get('/api/rbac/permissions/tree')
        .set('Authorization', `Bearer ${superAdminToken}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(Array.isArray(response.body.data)).toBe(true)
    })

    test('should create new permission', async () => {
      const response = await request(app)
        .post('/api/rbac/permissions')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          key: 'test.permission',
          name: 'Test Permission',
          type: 'ACTION',
          order: 100
        })

      expect(response.status).toBe(201)
      expect(response.body.success).toBe(true)
      expect(response.body.data.key).toBe('test.permission')
      expect(response.body.data.name).toBe('Test Permission')
    })
  })

  describe('User Permission Management Tests', () => {
    test('should get user permissions', async () => {
      // Get admin user ID first
      const adminProfile = await request(app)
        .get('/api/admin/profile')
        .set('Authorization', `Bearer ${adminToken}`)

      const userId = adminProfile.body.data.id

      const response = await request(app)
        .get(`/api/rbac/users/${userId}/permissions`)
        .set('Authorization', `Bearer ${superAdminToken}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.roles).toBeDefined()
      expect(response.body.data.permissionKeys).toBeDefined()
    })

    test('should get user roles', async () => {
      // Get admin user ID first
      const adminProfile = await request(app)
        .get('/api/admin/profile')
        .set('Authorization', `Bearer ${adminToken}`)

      const userId = adminProfile.body.data.id

      const response = await request(app)
        .get(`/api/rbac/users/${userId}/roles`)
        .set('Authorization', `Bearer ${superAdminToken}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(Array.isArray(response.body.data)).toBe(true)
    })

    test('should assign roles to user', async () => {
      // Get user manager user ID
      const userManagerProfile = await request(app)
        .get('/api/admin/profile')
        .set('Authorization', `Bearer ${userManagerToken}`)

      const userId = userManagerProfile.body.data.id

      // Get available roles
      const rolesResponse = await request(app)
        .get('/api/rbac/roles/available')
        .set('Authorization', `Bearer ${superAdminToken}`)

      const roles = rolesResponse.body.data
      const userManagerRole = roles.find((role: any) => role.code === 'user_manager')

      const response = await request(app)
        .post(`/api/rbac/users/${userId}/roles`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          roleIds: [userManagerRole.id]
        })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
    })
  })

  describe('Permission Checking Tests', () => {
    test('should check user permission', async () => {
      // Get admin user ID
      const adminProfile = await request(app)
        .get('/api/admin/profile')
        .set('Authorization', `Bearer ${adminToken}`)

      const userId = adminProfile.body.data.id

      const response = await request(app)
        .post(`/api/rbac/users/${userId}/check-permission`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          permission: 'user.list'
        })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(typeof response.body.data.hasPermission).toBe('boolean')
    })

    test('should check multiple permissions (any)', async () => {
      // Get admin user ID
      const adminProfile = await request(app)
        .get('/api/admin/profile')
        .set('Authorization', `Bearer ${adminToken}`)

      const userId = adminProfile.body.data.id

      const response = await request(app)
        .post(`/api/rbac/users/${userId}/check-any-permission`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          permissions: ['user.list', 'user.create']
        })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(typeof response.body.data.hasPermission).toBe('boolean')
    })
  })

  describe('Authorization Middleware Tests', () => {
    test('should deny access without token', async () => {
      const response = await request(app)
        .get('/api/rbac/roles')

      expect(response.status).toBe(401)
      expect(response.body.success).toBe(false)
    })

    test('should deny access with invalid token', async () => {
      const response = await request(app)
        .get('/api/rbac/roles')
        .set('Authorization', 'Bearer invalid-token')

      expect(response.status).toBe(401)
      expect(response.body.success).toBe(false)
    })

    test('should allow super admin access to all endpoints', async () => {
      const endpoints = [
        '/api/rbac/roles',
        '/api/rbac/permissions',
        '/api/admin/admins'
      ]

      for (const endpoint of endpoints) {
        const response = await request(app)
          .get(endpoint)
          .set('Authorization', `Bearer ${superAdminToken}`)

        expect(response.status).not.toBe(403)
      }
    })
  })

  describe('Data Validation Tests', () => {
    test('should validate role creation data', async () => {
      const response = await request(app)
        .post('/api/rbac/roles')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          name: '', // Invalid: empty name
          code: 'invalid-code-with-spaces', // Invalid: contains spaces
          description: 'Test description'
        })

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
    })

    test('should validate permission creation data', async () => {
      const response = await request(app)
        .post('/api/rbac/permissions')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          key: '', // Invalid: empty key
          name: 'Test Permission',
          type: 'INVALID_TYPE' // Invalid: not in enum
        })

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
    })
  })

  describe('Performance Tests', () => {
    test('should handle multiple concurrent requests', async () => {
      const requests = Array(10).fill(null).map(() =>
        request(app)
          .get('/api/rbac/roles')
          .set('Authorization', `Bearer ${superAdminToken}`)
      )

      const responses = await Promise.all(requests)

      responses.forEach(response => {
        expect(response.status).toBe(200)
        expect(response.body.success).toBe(true)
      })
    })

    test('should respond within acceptable time limits', async () => {
      const startTime = Date.now()

      const response = await request(app)
        .get('/api/rbac/permissions/tree')
        .set('Authorization', `Bearer ${superAdminToken}`)

      const endTime = Date.now()
      const responseTime = endTime - startTime

      expect(response.status).toBe(200)
      expect(responseTime).toBeLessThan(1000) // Should respond within 1 second
    })
  })
})
