import { Admin, Role, Permission, PermissionType } from '@prisma/client'
import { prisma } from '../utils/database'
import { logger } from '../utils/logger'
import { permissionCache, Cacheable, CacheEvict } from './cacheService'
import { PERFORMANCE_CONFIG } from '../config/performance'

// 用户权限信息类型
export interface UserPermissionInfo {
  userId: string
  userAccount: string
  roles: {
    id: string
    name: string
    code: string
  }[]
  permissions: {
    id: string
    key: string
    name: string
    type: PermissionType
    path?: string
    method?: string
  }[]
  permissionKeys: string[]
}

// 分配角色给用户
export async function assignRolesToUser(userId: string, roleIds: string[]): Promise<void> {
  // 检查用户是否存在
  const user = await prisma.admin.findUnique({
    where: { id: userId }
  })

  if (!user) {
    throw new Error('用户不存在')
  }

  // 检查角色是否存在
  const roles = await prisma.role.findMany({
    where: { 
      id: { in: roleIds },
      status: true
    }
  })

  if (roles.length !== roleIds.length) {
    throw new Error('部分角色不存在或已禁用')
  }

  // 使用事务处理角色分配
  await prisma.$transaction(async (tx) => {
    // 删除现有角色关联
    await tx.adminRole.deleteMany({
      where: { adminId: userId }
    })

    // 创建新的角色关联
    if (roleIds.length > 0) {
      await tx.adminRole.createMany({
        data: roleIds.map(roleId => ({
          adminId: userId,
          roleId
        }))
      })
    }
  })

  logger.info(`Assigned ${roleIds.length} roles to user: ${user.account} (${userId})`)
}

// 获取用户的所有权限信息
export async function getUserPermissions(userId: string): Promise<UserPermissionInfo | null> {
  // 尝试从缓存获取
  const cachedPermissions = permissionCache.getUserPermissions(userId)
  if (cachedPermissions) {
    logger.debug(`Retrieved user permissions from cache for user: ${userId}`)
    return cachedPermissions
  }

  // 获取用户及其角色和权限信息
  const userWithRolesAndPermissions = await prisma.admin.findUnique({
    where: { id: userId },
    include: {
      admin_roles: {
        include: {
          roles: {
            include: {
              role_permissions: {
                include: {
                  permissions: true
                }
              }
            }
          }
        }
      }
    }
  })

  if (!userWithRolesAndPermissions) {
    return null
  }

  // 提取角色信息
  const roles = userWithRolesAndPermissions.admin_roles.map(ar => ({
    id: ar.roles.id,
    name: ar.roles.name,
    code: ar.roles.code
  }))

  // 提取权限信息（去重）
  const permissionMap = new Map<string, Permission>()
  
  userWithRolesAndPermissions.admin_roles.forEach(ar => {
    ar.roles.role_permissions.forEach(rp => {
      if (rp.permissions.enabled) {
        permissionMap.set(rp.permissions.id, rp.permissions)
      }
    })
  })

  const permissions = Array.from(permissionMap.values()).map(p => ({
    id: p.id,
    key: p.key,
    name: p.name,
    type: p.type,
    parentId: p.parentId,
    path: p.path,
    method: p.method,
    enabled: p.enabled
  }))

  const permissionKeys = permissions.map(p => p.key)

  const userPermissionInfo = {
    userId: userWithRolesAndPermissions.id,
    userAccount: userWithRolesAndPermissions.account,
    roles,
    permissions,
    permissionKeys
  }

  // 缓存用户权限信息
  permissionCache.cacheUserPermissions(userId, userPermissionInfo)
  logger.debug(`Cached user permissions for user: ${userId}`)

  return userPermissionInfo
}

// 检查用户是否有特定权限
export async function checkUserPermission(userId: string, permissionKey: string): Promise<boolean> {
  const userPermissions = await getUserPermissions(userId)
  
  if (!userPermissions) {
    return false
  }

  return userPermissions.permissionKeys.includes(permissionKey)
}

// 检查用户是否有多个权限中的任意一个
export async function checkUserAnyPermission(userId: string, permissionKeys: string[]): Promise<boolean> {
  const userPermissions = await getUserPermissions(userId)
  
  if (!userPermissions) {
    return false
  }

  return permissionKeys.some(key => userPermissions.permissionKeys.includes(key))
}

// 检查用户是否有所有指定权限
export async function checkUserAllPermissions(userId: string, permissionKeys: string[]): Promise<boolean> {
  const userPermissions = await getUserPermissions(userId)
  
  if (!userPermissions) {
    return false
  }

  return permissionKeys.every(key => userPermissions.permissionKeys.includes(key))
}

// 获取用户的菜单权限（用于前端菜单生成）
export async function getUserMenuPermissions(userId: string) {
  const userPermissions = await getUserPermissions(userId)
  
  if (!userPermissions) {
    return []
  }

  // 过滤出菜单和页面权限
  const menuPermissions = userPermissions.permissions.filter(p => 
    p.type === PermissionType.MENU || p.type === PermissionType.PAGE
  )

  // 获取完整的权限信息以构建树结构
  const fullPermissions = await prisma.permission.findMany({
    where: {
      id: { in: menuPermissions.map(p => p.id) },
      enabled: true
    },
    orderBy: [
      { order: 'asc' },
      { createdAt: 'asc' }
    ]
  })

  // 构建树结构
  const permissionMap = new Map()
  const rootPermissions: any[] = []

  // 初始化所有权限节点
  fullPermissions.forEach(permission => {
    permissionMap.set(permission.id, { ...permission, children: [] })
  })

  // 构建父子关系
  fullPermissions.forEach(permission => {
    const node = permissionMap.get(permission.id)
    
    if (permission.parentId && permissionMap.has(permission.parentId)) {
      const parent = permissionMap.get(permission.parentId)
      parent.children.push(node)
    } else if (!permission.parentId) {
      rootPermissions.push(node)
    }
  })

  return rootPermissions
}

// 获取用户的角色列表
export async function getUserRoles(userId: string) {
  const userWithRoles = await prisma.admin.findUnique({
    where: { id: userId },
    include: {
      admin_roles: {
        include: {
          roles: true
        }
      }
    }
  })

  if (!userWithRoles) {
    return []
  }

  // 过滤出启用状态的角色
  return userWithRoles.admin_roles
    .map(ar => ar.roles)
    .filter(role => role.status === true)
}

// 移除用户的角色
export async function removeUserRole(userId: string, roleId: string): Promise<void> {
  // 检查关联是否存在
  const adminRole = await prisma.adminRole.findUnique({
    where: {
      adminId_roleId: {
        adminId: userId,
        roleId: roleId
      }
    }
  })

  if (!adminRole) {
    throw new Error('用户角色关联不存在')
  }

  // 删除角色关联
  await prisma.adminRole.delete({
    where: {
      adminId_roleId: {
        adminId: userId,
        roleId: roleId
      }
    }
  })

  logger.info(`Removed role ${roleId} from user ${userId}`)
}

// 添加用户角色
export async function addUserRole(userId: string, roleId: string): Promise<void> {
  // 检查用户是否存在
  const user = await prisma.admin.findUnique({
    where: { id: userId }
  })

  if (!user) {
    throw new Error('用户不存在')
  }

  // 检查角色是否存在且启用
  const role = await prisma.role.findUnique({
    where: { 
      id: roleId,
      status: true
    }
  })

  if (!role) {
    throw new Error('角色不存在或已禁用')
  }

  // 检查是否已经有此角色
  const existingAdminRole = await prisma.adminRole.findUnique({
    where: {
      adminId_roleId: {
        adminId: userId,
        roleId: roleId
      }
    }
  })

  if (existingAdminRole) {
    throw new Error('用户已拥有此角色')
  }

  // 创建角色关联
  await prisma.adminRole.create({
    data: {
      adminId: userId,
      roleId: roleId
    }
  })

  logger.info(`Added role ${roleId} to user ${userId}`)
}

// 获取拥有特定权限的所有用户
export async function getUsersByPermission(permissionKey: string) {
  const usersWithPermission = await prisma.admin.findMany({
    where: {
      admin_roles: {
        some: {
          roles: {
            role_permissions: {
              some: {
                permissions: {
                  key: permissionKey,
                  enabled: true
                }
              }
            }
          }
        }
      }
    },
    include: {
      admin_roles: {
        include: {
          roles: true
        }
      }
    }
  })

  return usersWithPermission
}

// 获取拥有特定角色的所有用户
export async function getUsersByRole(roleCode: string) {
  const usersWithRole = await prisma.admin.findMany({
    where: {
      admin_roles: {
        some: {
          roles: {
            code: roleCode,
            status: true
          }
        }
      }
    },
    include: {
      admin_roles: {
        include: {
          roles: true
        }
      }
    }
  })

  return usersWithRole
}

// 批量分配角色给多个用户
export async function batchAssignRolesToUsers(userIds: string[], roleIds: string[]): Promise<void> {
  // 检查用户是否存在
  const users = await prisma.admin.findMany({
    where: { id: { in: userIds } }
  })

  if (users.length !== userIds.length) {
    throw new Error('部分用户不存在')
  }

  // 检查角色是否存在
  const roles = await prisma.role.findMany({
    where: { 
      id: { in: roleIds },
      status: true
    }
  })

  if (roles.length !== roleIds.length) {
    throw new Error('部分角色不存在或已禁用')
  }

  // 使用事务批量分配角色
  await prisma.$transaction(async (tx) => {
    for (const userId of userIds) {
      // 删除现有角色关联
      await tx.adminRole.deleteMany({
        where: { adminId: userId }
      })

      // 创建新的角色关联
      if (roleIds.length > 0) {
        await tx.adminRole.createMany({
          data: roleIds.map(roleId => ({
            adminId: userId,
            roleId
          }))
        })
      }
    }
  })

  logger.info(`Batch assigned ${roleIds.length} roles to ${userIds.length} users`)
}
