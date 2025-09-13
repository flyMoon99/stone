import request from 'supertest'
import { app } from '../../src/app'
import { PrismaClient } from '@prisma/client'
import { performance } from 'perf_hooks'

const prisma = new PrismaClient()

describe('RBAC Performance Tests', () => {
  let superAdminToken: string
  let testUserIds: string[] = []

  beforeAll(async () => {
    // 获取超级管理员token
    const superAdminLogin = await request(app)
      .post('/api/admin/login')
      .send({
        account: 'admin',
        password: 'Admin123!'
      })

    superAdminToken = superAdminLogin.body.data.token

    // 创建测试用户数据
    for (let i = 0; i < 50; i++) {
      const response = await request(app)
        .post('/api/admin/admins')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          account: `testuser${i}`,
          password: 'Test123!',
          type: 'ADMIN'
        })

      if (response.body.success) {
        testUserIds.push(response.body.data.id)
      }
    }
  })

  afterAll(async () => {
    // 清理测试数据
    for (const userId of testUserIds) {
      try {
        await prisma.admin.delete({
          where: { id: userId }
        })
      } catch (error) {
        // 忽略删除错误
      }
    }
    await prisma.$disconnect()
  })

  describe('Permission Checking Performance', () => {
    test('should check permissions efficiently for single user', async () => {
      const userId = testUserIds[0]
      const iterations = 100
      const startTime = performance.now()

      for (let i = 0; i < iterations; i++) {
        await request(app)
          .post(`/api/rbac/users/${userId}/check-permission`)
          .set('Authorization', `Bearer ${superAdminToken}`)
          .send({
            permission: 'user.list'
          })
      }

      const endTime = performance.now()
      const averageTime = (endTime - startTime) / iterations

      console.log(`Average permission check time: ${averageTime.toFixed(2)}ms`)
      expect(averageTime).toBeLessThan(50) // Should be less than 50ms per check
    })

    test('should handle bulk permission checks efficiently', async () => {
      const userIds = testUserIds.slice(0, 10)
      const startTime = performance.now()

      const promises = userIds.map(userId =>
        request(app)
          .post(`/api/rbac/users/${userId}/check-any-permission`)
          .set('Authorization', `Bearer ${superAdminToken}`)
          .send({
            permissions: ['user.list', 'user.create', 'user.update']
          })
      )

      await Promise.all(promises)

      const endTime = performance.now()
      const totalTime = endTime - startTime

      console.log(`Bulk permission check time for ${userIds.length} users: ${totalTime.toFixed(2)}ms`)
      expect(totalTime).toBeLessThan(1000) // Should complete within 1 second
    })
  })

  describe('Role Assignment Performance', () => {
    test('should assign roles efficiently', async () => {
      const userIds = testUserIds.slice(0, 20)
      
      // Get available roles
      const rolesResponse = await request(app)
        .get('/api/rbac/roles/available')
        .set('Authorization', `Bearer ${superAdminToken}`)

      const roles = rolesResponse.body.data
      const adminRole = roles.find((role: any) => role.code === 'admin')

      const startTime = performance.now()

      const promises = userIds.map(userId =>
        request(app)
          .post(`/api/rbac/users/${userId}/roles`)
          .set('Authorization', `Bearer ${superAdminToken}`)
          .send({
            roleIds: [adminRole.id]
          })
      )

      await Promise.all(promises)

      const endTime = performance.now()
      const totalTime = endTime - startTime

      console.log(`Role assignment time for ${userIds.length} users: ${totalTime.toFixed(2)}ms`)
      expect(totalTime).toBeLessThan(2000) // Should complete within 2 seconds
    })

    test('should handle batch role assignment efficiently', async () => {
      const userIds = testUserIds.slice(20, 40)
      
      // Get available roles
      const rolesResponse = await request(app)
        .get('/api/rbac/roles/available')
        .set('Authorization', `Bearer ${superAdminToken}`)

      const roles = rolesResponse.body.data
      const userManagerRole = roles.find((role: any) => role.code === 'user_manager')

      const startTime = performance.now()

      const response = await request(app)
        .post('/api/rbac/users/batch-assign-roles')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          userIds: userIds,
          roleIds: [userManagerRole.id]
        })

      const endTime = performance.now()
      const totalTime = endTime - startTime

      console.log(`Batch role assignment time for ${userIds.length} users: ${totalTime.toFixed(2)}ms`)
      expect(response.status).toBe(200)
      expect(totalTime).toBeLessThan(1500) // Should complete within 1.5 seconds
    })
  })

  describe('Data Retrieval Performance', () => {
    test('should retrieve user permissions efficiently', async () => {
      const userIds = testUserIds.slice(0, 15)
      const startTime = performance.now()

      const promises = userIds.map(userId =>
        request(app)
          .get(`/api/rbac/users/${userId}/permissions`)
          .set('Authorization', `Bearer ${superAdminToken}`)
      )

      const responses = await Promise.all(promises)

      const endTime = performance.now()
      const totalTime = endTime - startTime

      console.log(`User permissions retrieval time for ${userIds.length} users: ${totalTime.toFixed(2)}ms`)
      
      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200)
      })

      expect(totalTime).toBeLessThan(1000) // Should complete within 1 second
    })

    test('should retrieve permission tree efficiently', async () => {
      const iterations = 20
      const startTime = performance.now()

      for (let i = 0; i < iterations; i++) {
        const response = await request(app)
          .get('/api/rbac/permissions/tree')
          .set('Authorization', `Bearer ${superAdminToken}`)

        expect(response.status).toBe(200)
      }

      const endTime = performance.now()
      const averageTime = (endTime - startTime) / iterations

      console.log(`Average permission tree retrieval time: ${averageTime.toFixed(2)}ms`)
      expect(averageTime).toBeLessThan(100) // Should be less than 100ms per request
    })

    test('should handle concurrent permission tree requests', async () => {
      const concurrentRequests = 10
      const startTime = performance.now()

      const promises = Array(concurrentRequests).fill(null).map(() =>
        request(app)
          .get('/api/rbac/permissions/tree')
          .set('Authorization', `Bearer ${superAdminToken}`)
      )

      const responses = await Promise.all(promises)

      const endTime = performance.now()
      const totalTime = endTime - startTime

      console.log(`Concurrent permission tree requests (${concurrentRequests}): ${totalTime.toFixed(2)}ms`)
      
      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200)
      })

      expect(totalTime).toBeLessThan(500) // Should complete within 500ms
    })
  })

  describe('Database Query Performance', () => {
    test('should optimize role queries', async () => {
      const startTime = performance.now()

      // Test role list query with pagination
      const response = await request(app)
        .get('/api/rbac/roles?page=1&pageSize=50')
        .set('Authorization', `Bearer ${superAdminToken}`)

      const endTime = performance.now()
      const queryTime = endTime - startTime

      console.log(`Role list query time: ${queryTime.toFixed(2)}ms`)
      expect(response.status).toBe(200)
      expect(queryTime).toBeLessThan(200) // Should be less than 200ms
    })

    test('should optimize permission queries', async () => {
      const startTime = performance.now()

      // Test permission list query with pagination
      const response = await request(app)
        .get('/api/rbac/permissions?page=1&pageSize=50')
        .set('Authorization', `Bearer ${superAdminToken}`)

      const endTime = performance.now()
      const queryTime = endTime - startTime

      console.log(`Permission list query time: ${queryTime.toFixed(2)}ms`)
      expect(response.status).toBe(200)
      expect(queryTime).toBeLessThan(200) // Should be less than 200ms
    })

    test('should optimize user list queries', async () => {
      const startTime = performance.now()

      // Test admin list query with pagination
      const response = await request(app)
        .get('/api/admin/admins?page=1&pageSize=50')
        .set('Authorization', `Bearer ${superAdminToken}`)

      const endTime = performance.now()
      const queryTime = endTime - startTime

      console.log(`Admin list query time: ${queryTime.toFixed(2)}ms`)
      expect(response.status).toBe(200)
      expect(queryTime).toBeLessThan(300) // Should be less than 300ms
    })
  })

  describe('Memory Usage Tests', () => {
    test('should not cause memory leaks during repeated operations', async () => {
      const initialMemory = process.memoryUsage()
      
      // Perform many operations
      for (let i = 0; i < 100; i++) {
        await request(app)
          .get('/api/rbac/permissions/tree')
          .set('Authorization', `Bearer ${superAdminToken}`)
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc()
      }

      const finalMemory = process.memoryUsage()
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed

      console.log(`Memory increase after 100 operations: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`)
      
      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024)
    })
  })

  describe('Stress Tests', () => {
    test('should handle high load of permission checks', async () => {
      const concurrentUsers = 20
      const checksPerUser = 10
      const userId = testUserIds[0]

      const startTime = performance.now()

      const userPromises = Array(concurrentUsers).fill(null).map(async () => {
        const checkPromises = Array(checksPerUser).fill(null).map(() =>
          request(app)
            .post(`/api/rbac/users/${userId}/check-permission`)
            .set('Authorization', `Bearer ${superAdminToken}`)
            .send({
              permission: 'user.list'
            })
        )
        return Promise.all(checkPromises)
      })

      const results = await Promise.all(userPromises)

      const endTime = performance.now()
      const totalTime = endTime - startTime
      const totalRequests = concurrentUsers * checksPerUser

      console.log(`Stress test: ${totalRequests} permission checks in ${totalTime.toFixed(2)}ms`)
      console.log(`Average: ${(totalTime / totalRequests).toFixed(2)}ms per check`)

      // All requests should succeed
      results.forEach(userResults => {
        userResults.forEach(response => {
          expect(response.status).toBe(200)
        })
      })

      // Should handle the load within reasonable time
      expect(totalTime).toBeLessThan(10000) // Should complete within 10 seconds
    })
  })
})
