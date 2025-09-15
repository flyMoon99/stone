import { Role, UserStatus, Prisma } from '@prisma/client'
import { PaginationParams, createPaginationResponse } from '@stone/shared'
import { prisma } from '../utils/database'
import { logger } from '../utils/logger'

// 角色创建数据类型
export interface CreateRoleData {
  name: string
  code: string
  description?: string
  status?: boolean
}

// 角色更新数据类型
export interface UpdateRoleData {
  name?: string
  description?: string
  status?: boolean
}

// 角色查询参数类型
export interface RoleQueryParams extends PaginationParams {
  status?: boolean
  keyword?: string
}

// 创建角色
export async function createRole(data: CreateRoleData): Promise<Role> {
  // 检查角色编码是否已存在
  const existingRole = await prisma.role.findUnique({
    where: { code: data.code }
  })

  if (existingRole) {
    throw new Error('角色编码已存在')
  }

  // 检查角色名称是否已存在
  const existingName = await prisma.role.findFirst({
    where: { name: data.name }
  })

  if (existingName) {
    throw new Error('角色名称已存在')
  }

  // 创建角色
  const role = await prisma.role.create({
    data: {
      name: data.name,
      code: data.code,
      description: data.description,
      status: data.status ?? true
    }
  })

  logger.info(`Role created: ${role.name} (${role.id})`)
  return role
}

// 获取角色列表
export async function getRoleList(params: RoleQueryParams) {
  const { page, pageSize, status, keyword } = params
  const skip = (page - 1) * pageSize

  // 构建查询条件
  const where: Prisma.RoleWhereInput = {}
  
  if (status !== undefined) {
    where.status = status
  }
  
  if (keyword) {
    where.OR = [
      { name: { contains: keyword, mode: 'insensitive' } },
      { code: { contains: keyword, mode: 'insensitive' } },
      { description: { contains: keyword, mode: 'insensitive' } }
    ]
  }

  // 查询数据
  const [roles, total] = await Promise.all([
    prisma.role.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            admin_roles: true,
            role_permissions: true
          }
        }
      }
    }),
    prisma.role.count({ where })
  ])

  return createPaginationResponse(roles, total, page, pageSize)
}

// 获取角色详情
export async function getRoleById(id: string) {
  const role = await prisma.role.findUnique({
    where: { id },
    include: {
      role_permissions: {
        include: {
          permissions: true
        }
      },
      admin_roles: {
        include: {
          admins: {
            select: {
              id: true,
              account: true,
              type: true,
              status: true
            }
          }
        }
      },
      _count: {
        select: {
          admin_roles: true,
          role_permissions: true
        }
      }
    }
  })

  return role
}

// 更新角色
export async function updateRole(id: string, data: UpdateRoleData): Promise<Role> {
  // 检查角色是否存在
  const existingRole = await prisma.role.findUnique({
    where: { id }
  })

  if (!existingRole) {
    throw new Error('角色不存在')
  }

  // 如果更新名称，检查是否重复
  if (data.name && data.name !== existingRole.name) {
    const nameExists = await prisma.role.findFirst({
      where: { 
        name: data.name,
        id: { not: id }
      }
    })

    if (nameExists) {
      throw new Error('角色名称已存在')
    }
  }

  // 更新角色
  const updatedRole = await prisma.role.update({
    where: { id },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.status !== undefined && { status: data.status })
    }
  })

  logger.info(`Role updated: ${updatedRole.name} (${updatedRole.id})`)
  return updatedRole
}

// 删除角色
export async function deleteRole(id: string): Promise<void> {
  // 检查角色是否存在
  const existingRole = await prisma.role.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          admin_roles: true
        }
      }
    }
  })

  if (!existingRole) {
    throw new Error('角色不存在')
  }

  // 检查是否有管理员使用此角色
  if (existingRole._count.admin_roles > 0) {
    throw new Error('该角色正在被使用，无法删除')
  }

  // 使用事务删除角色和相关的权限关联
  await prisma.$transaction(async (tx) => {
    // 先删除角色权限关联
    await tx.rolePermission.deleteMany({
      where: { roleId: id }
    })
    
    // 再删除角色
    await tx.role.delete({
      where: { id }
    })
  })

  logger.info(`Role deleted: ${existingRole.name} (${existingRole.id})`)
}

// 批量更新角色状态
export async function batchUpdateRoleStatus(ids: string[], status: boolean): Promise<number> {
  const result = await prisma.role.updateMany({
    where: {
      id: { in: ids }
    },
    data: { status }
  })

  logger.info(`Batch updated ${result.count} roles status to ${status}`)
  return result.count
}

// 获取所有可用角色（用于下拉选择）
export async function getAvailableRoles() {
  return await prisma.role.findMany({
    where: { status: true },
    select: {
      id: true,
      name: true,
      code: true,
      description: true
    },
    orderBy: { name: 'asc' }
  })
}

// 分配权限给角色
export async function assignPermissionsToRole(roleId: string, permissionIds: string[]): Promise<void> {
  // 检查角色是否存在
  const role = await prisma.role.findUnique({
    where: { id: roleId }
  })

  if (!role) {
    throw new Error('角色不存在')
  }

  // 检查权限是否存在
  const permissions = await prisma.permission.findMany({
    where: { id: { in: permissionIds } }
  })

  if (permissions.length !== permissionIds.length) {
    throw new Error('部分权限不存在')
  }

  // 使用事务处理权限分配
  await prisma.$transaction(async (tx) => {
    // 删除现有权限关联
    await tx.rolePermission.deleteMany({
      where: { roleId }
    })

    // 创建新的权限关联
    if (permissionIds.length > 0) {
      await tx.rolePermission.createMany({
        data: permissionIds.map(permissionId => ({
          roleId,
          permissionId
        }))
      })
    }
  })

  logger.info(`Assigned ${permissionIds.length} permissions to role: ${role.name} (${roleId})`)
}

// 获取角色的权限列表
export async function getRolePermissions(roleId: string) {
  const roleWithPermissions = await prisma.role.findUnique({
    where: { id: roleId },
    include: {
      role_permissions: {
        include: {
          permissions: true
        }
      }
    }
  })

  if (!roleWithPermissions) {
    throw new Error('角色不存在')
  }

  return roleWithPermissions.role_permissions.map(rp => rp.permissions)
}
