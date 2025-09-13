import { PrismaClient } from '@prisma/client'
import { 
  getUserPermissions, 
  assignRolesToUser, 
  checkUserPermission,
  checkUserAnyPermission,
  checkUserAllPermissions
} from '../../src/services/userPermissionService'
import { 
  createRole, 
  updateRole, 
  deleteRole, 
  getRoleById 
} from '../../src/services/roleService'
import { 
  createPermission, 
  updatePermission, 
  deletePermission, 
  getPermissionTree 
} from '../../src/services/permissionService'
import { permissionCache } from '../../src/services/cacheService'

const prisma = new PrismaClient()

describe('RBAC Unit Tests', () => {
  let testUserId: string
  let testRoleId: string
  let testPermissionId: string

  beforeAll(async () => {
    // 创建测试用户
    const testUser = await prisma.admin.create({
      data: {
        account: 'unittest_user',
        password: 'hashedpassword',
        type: 'ADMIN',
        status: 'ACTIVE'
      }
    })
    testUserId = testUser.id
  })

  afterAll(async () => {
    // 清理测试数据
    try {
      if (testPermissionId) {
        await prisma.permission.delete({ where: { id: testPermissionId } })
      }
      if (testRoleId) {
        await prisma.role.delete({ where: { id: testRoleId } })
      }
      await prisma.admin.delete({ where: { id: testUserId } })
    } catch (error) {
      console.log('Cleanup error (expected):', error)
    }
    await prisma.$disconnect()
  })

  beforeEach(() => {
    // 清除缓存
    permissionCache.clearUserCache(testUserId)
  })

  describe('Role Service Tests', () => {
    test('should create a new role', async () => {
      const roleData = {
        name: 'Test Role',
        code: 'test_role',
        description: 'A test role for unit testing'
      }

      const role = await createRole(roleData)
      testRoleId = role.id

      expect(role.name).toBe(roleData.name)
      expect(role.code).toBe(roleData.code)
      expect(role.description).toBe(roleData.description)
      expect(role.status).toBe(true)
    })

    test('should get role by id', async () => {
      const role = await getRoleById(testRoleId)

      expect(role).toBeTruthy()
      expect(role?.id).toBe(testRoleId)
      expect(role?.name).toBe('Test Role')
    })

    test('should update role', async () => {
      const updateData = {
        name: 'Updated Test Role',
        description: 'Updated description'
      }

      const updatedRole = await updateRole(testRoleId, updateData)

      expect(updatedRole.name).toBe(updateData.name)
      expect(updatedRole.description).toBe(updateData.description)
    })

    test('should handle role not found', async () => {
      const nonExistentId = 'non-existent-id'
      
      await expect(getRoleById(nonExistentId)).resolves.toBeNull()
    })
  })

  describe('Permission Service Tests', () => {
    test('should create a new permission', async () => {
      const permissionData = {
        key: 'test.permission',
        name: 'Test Permission',
        type: 'ACTION' as const,
        order: 100
      }

      const permission = await createPermission(permissionData)
      testPermissionId = permission.id

      expect(permission.key).toBe(permissionData.key)
      expect(permission.name).toBe(permissionData.name)
      expect(permission.type).toBe(permissionData.type)
      expect(permission.enabled).toBe(true)
    })

    test('should get permission tree', async () => {
      const tree = await getPermissionTree()

      expect(Array.isArray(tree)).toBe(true)
      expect(tree.length).toBeGreaterThan(0)
      
      // 检查树结构
      const hasChildren = tree.some(item => item.children && item.children.length > 0)
      expect(hasChildren).toBe(true)
    })

    test('should update permission', async () => {
      const updateData = {
        name: 'Updated Test Permission',
        enabled: false
      }

      const updatedPermission = await updatePermission(testPermissionId, updateData)

      expect(updatedPermission.name).toBe(updateData.name)
      expect(updatedPermission.enabled).toBe(updateData.enabled)
    })
  })

  describe('User Permission Service Tests', () => {
    test('should assign roles to user', async () => {
      await assignRolesToUser(testUserId, [testRoleId])

      // 验证角色分配
      const userRoles = await prisma.adminRole.findMany({
        where: { adminId: testUserId }
      })

      expect(userRoles.length).toBe(1)
      expect(userRoles[0]?.roleId).toBe(testRoleId)
    })

    test('should get user permissions', async () => {
      const userPermissions = await getUserPermissions(testUserId)

      expect(userPermissions).toBeTruthy()
      expect(userPermissions?.userId).toBe(testUserId)
      expect(Array.isArray(userPermissions?.roles)).toBe(true)
      expect(Array.isArray(userPermissions?.permissions)).toBe(true)
      expect(Array.isArray(userPermissions?.permissionKeys)).toBe(true)
    })

    test('should cache user permissions', async () => {
      // 第一次调用
      const startTime1 = Date.now()
      await getUserPermissions(testUserId)
      const endTime1 = Date.now()
      const firstCallTime = endTime1 - startTime1

      // 第二次调用（应该从缓存获取）
      const startTime2 = Date.now()
      await getUserPermissions(testUserId)
      const endTime2 = Date.now()
      const secondCallTime = endTime2 - startTime2

      // 缓存调用应该更快
      expect(secondCallTime).toBeLessThan(firstCallTime)
    })

    test('should check user permission', async () => {
      // 先分配权限给角色
      await prisma.rolePermission.create({
        data: {
          roleId: testRoleId,
          permissionId: testPermissionId
        }
      })

      const hasPermission = await checkUserPermission(testUserId, 'test.permission')
      expect(hasPermission).toBe(true)

      const hasNonExistentPermission = await checkUserPermission(testUserId, 'non.existent.permission')
      expect(hasNonExistentPermission).toBe(false)
    })

    test('should check user any permission', async () => {
      const hasAnyPermission = await checkUserAnyPermission(testUserId, ['test.permission', 'another.permission'])
      expect(hasAnyPermission).toBe(true)

      const hasNonePermission = await checkUserAnyPermission(testUserId, ['non.existent1', 'non.existent2'])
      expect(hasNonePermission).toBe(false)
    })

    test('should check user all permissions', async () => {
      const hasAllPermissions = await checkUserAllPermissions(testUserId, ['test.permission'])
      expect(hasAllPermissions).toBe(true)

      const hasAllMultiplePermissions = await checkUserAllPermissions(testUserId, ['test.permission', 'another.permission'])
      expect(hasAllMultiplePermissions).toBe(false)
    })
  })

  describe('Cache Service Tests', () => {
    test('should cache and retrieve user permissions', () => {
      const mockPermissions = {
        userId: testUserId,
        userAccount: 'test_user',
        roles: [],
        permissions: [],
        permissionKeys: ['test.permission']
      }

      permissionCache.cacheUserPermissions(testUserId, mockPermissions)
      const cachedPermissions = permissionCache.getUserPermissions(testUserId)

      expect(cachedPermissions).toEqual(mockPermissions)
    })

    test('should clear user cache', () => {
      const mockPermissions = {
        userId: testUserId,
        userAccount: 'test_user',
        roles: [],
        permissions: [],
        permissionKeys: ['test.permission']
      }

      permissionCache.cacheUserPermissions(testUserId, mockPermissions)
      permissionCache.clearUserCache(testUserId)
      
      const cachedPermissions = permissionCache.getUserPermissions(testUserId)
      expect(cachedPermissions).toBeNull()
    })

    test('should get cache statistics', () => {
      const mockPermissions = {
        userId: testUserId,
        userAccount: 'test_user',
        roles: [],
        permissions: [],
        permissionKeys: ['test.permission']
      }

      permissionCache.cacheUserPermissions(testUserId, mockPermissions)
      const stats = permissionCache.getCacheStats()

      expect(stats.total).toBeGreaterThan(0)
      expect(stats.userPermissions).toBeGreaterThan(0)
    })
  })

  describe('Error Handling Tests', () => {
    test('should handle non-existent user in getUserPermissions', async () => {
      const nonExistentUserId = 'non-existent-user-id'
      const result = await getUserPermissions(nonExistentUserId)
      
      expect(result).toBeNull()
    })

    test('should handle invalid role assignment', async () => {
      const invalidRoleId = 'invalid-role-id'
      
      await expect(assignRolesToUser(testUserId, [invalidRoleId]))
        .rejects.toThrow('部分角色不存在或已禁用')
    })

    test('should handle duplicate role creation', async () => {
      const duplicateRoleData = {
        name: 'Duplicate Role',
        code: 'test_role', // 使用已存在的code
        description: 'Duplicate test role'
      }

      await expect(createRole(duplicateRoleData))
        .rejects.toThrow()
    })

    test('should handle duplicate permission creation', async () => {
      const duplicatePermissionData = {
        key: 'test.permission', // 使用已存在的key
        name: 'Duplicate Permission',
        type: 'ACTION' as const
      }

      await expect(createPermission(duplicatePermissionData))
        .rejects.toThrow()
    })
  })

  describe('Performance Tests', () => {
    test('should handle multiple concurrent permission checks', async () => {
      const promises = Array(20).fill(null).map(() =>
        checkUserPermission(testUserId, 'test.permission')
      )

      const startTime = Date.now()
      const results = await Promise.all(promises)
      const endTime = Date.now()

      const totalTime = endTime - startTime
      const averageTime = totalTime / promises.length

      expect(results.every(result => result === true)).toBe(true)
      expect(averageTime).toBeLessThan(50) // 平均每次检查应少于50ms
    })

    test('should optimize permission tree retrieval', async () => {
      const iterations = 5
      const times: number[] = []

      for (let i = 0; i < iterations; i++) {
        const startTime = Date.now()
        await getPermissionTree()
        const endTime = Date.now()
        times.push(endTime - startTime)
      }

      const averageTime = times.reduce((sum, time) => sum + time, 0) / times.length
      expect(averageTime).toBeLessThan(200) // 平均应少于200ms
    })
  })

  describe('Data Validation Tests', () => {
    test('should validate role data', async () => {
      const invalidRoleData = {
        name: '', // 空名称
        code: 'invalid code with spaces', // 包含空格的代码
        description: 'Test'
      }

      await expect(createRole(invalidRoleData))
        .rejects.toThrow()
    })

    test('should validate permission data', async () => {
      const invalidPermissionData = {
        key: '', // 空键
        name: 'Test Permission',
        type: 'INVALID_TYPE' as any // 无效类型
      }

      await expect(createPermission(invalidPermissionData))
        .rejects.toThrow()
    })
  })
})
