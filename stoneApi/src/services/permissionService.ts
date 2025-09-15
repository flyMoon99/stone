import { PermissionType, Prisma, Permission } from '@prisma/client'
import { PaginationParams, createPaginationResponse } from '@stone/shared'
import { prisma } from '../utils/database'
import { logger } from '../utils/logger'

// 权限创建数据类型
export interface CreatePermissionData {
  key: string
  name: string
  type: PermissionType
  parentId?: string
  path?: string
  method?: string
  order?: number
  enabled?: boolean
}

// 权限更新数据类型
export interface UpdatePermissionData {
  name?: string
  type?: PermissionType
  parentId?: string
  path?: string
  method?: string
  order?: number
  enabled?: boolean
}

// 权限查询参数类型
export interface PermissionQueryParams extends PaginationParams {
  type?: PermissionType
  enabled?: boolean
  parentId?: string
  keyword?: string
}

// 权限树节点类型
export interface PermissionTreeNode extends Permission {
  children?: PermissionTreeNode[]
}

// 创建权限
export async function createPermission(data: CreatePermissionData): Promise<Permission> {
  // 检查权限key是否已存在
  const existingPermission = await prisma.permission.findUnique({
    where: { key: data.key }
  })

  if (existingPermission) {
    throw new Error('权限标识已存在')
  }

  // 如果有父权限，检查父权限是否存在
  if (data.parentId) {
    const parentPermission = await prisma.permission.findUnique({
      where: { id: data.parentId }
    })

    if (!parentPermission) {
      throw new Error('父权限不存在')
    }
  }

  // 创建权限
  const permission = await prisma.permission.create({
    data: {
      key: data.key,
      name: data.name,
      type: data.type,
      parentId: data.parentId,
      path: data.path,
      method: data.method,
      order: data.order ?? 0,
      enabled: data.enabled ?? true
    }
  })

  logger.info(`Permission created: ${permission.name} (${permission.id})`)
  return permission
}

// 获取权限列表
export async function getPermissionList(params: PermissionQueryParams) {
  const { page, pageSize, type, enabled, parentId, keyword } = params
  const skip = (page - 1) * pageSize

  // 构建查询条件
  const where: any = {}
  
  if (type) {
    where.type = type
  }
  
  if (enabled !== undefined) {
    where.enabled = enabled
  }
  
  if (parentId !== undefined) {
    where.parentId = parentId
  }
  
  if (keyword) {
    where.OR = [
      { key: { contains: keyword, mode: 'insensitive' } },
      { name: { contains: keyword, mode: 'insensitive' } },
      { path: { contains: keyword, mode: 'insensitive' } }
    ]
  }

  // 查询数据
  const [permissions, total] = await Promise.all([
    prisma.permission.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: [
        { order: 'asc' },
        { createdAt: 'desc' }
      ],
      include: {
        permissions: {
          select: {
            id: true,
            name: true
          }
        },
        _count: {
          select: {
            other_permissions: true,
            role_permissions: true
          }
        }
      }
    }),
    prisma.permission.count({ where })
  ])

  return createPaginationResponse(permissions, total, page, pageSize)
}

// 获取权限树结构
export async function getPermissionTree(): Promise<PermissionTreeNode[]> {
  // 获取所有启用的权限
  const permissions = await prisma.permission.findMany({
    where: { enabled: true },
    orderBy: [
      { order: 'asc' },
      { createdAt: 'asc' }
    ]
  })

  // 构建树结构
  const permissionMap = new Map<string, PermissionTreeNode>()
  const rootPermissions: PermissionTreeNode[] = []
  const orphanedPermissions: PermissionTreeNode[] = []

  // 初始化所有权限节点
  permissions.forEach(permission => {
    permissionMap.set(permission.id, { ...permission, children: [] })
  })

  // 按层级排序，确保父权限先处理
  const sortedPermissions = [...permissions].sort((a, b) => {
    if (!a.parentId && b.parentId) return -1
    if (a.parentId && !b.parentId) return 1
    // 按order字段排序
    if (a.order !== b.order) return a.order - b.order
    return 0
  })

  // 构建父子关系
  sortedPermissions.forEach(permission => {
    const node = permissionMap.get(permission.id)!
    
    if (permission.parentId) {
      const parent = permissionMap.get(permission.parentId)
      if (parent) {
        parent.children!.push(node)
        logger.debug(`Permission: ${permission.name} -> Parent: ${parent.name}`)
      } else {
        // 父权限不存在，记录为孤立权限
        console.warn(`Permission ${permission.name} (${permission.id}) has missing parent ${permission.parentId}`)
        // 为孤立权限添加标识
        (node as any).isOrphaned = true
        orphanedPermissions.push(node)
      }
    } else {
      rootPermissions.push(node)
    }
  })

  // 将孤立权限添加到根级别
  orphanedPermissions.forEach(permission => {
    rootPermissions.push(permission)
  })

  // 递归排序子权限
  const sortChildren = (permissions: PermissionTreeNode[]): PermissionTreeNode[] => {
    return permissions.sort((a, b) => {
      // 孤立权限排在后面
      const aOrphaned = (a as any).isOrphaned
      const bOrphaned = (b as any).isOrphaned
      if (aOrphaned && !bOrphaned) return 1
      if (!aOrphaned && bOrphaned) return -1
      
      // 按order字段排序
      if (a.order !== b.order) return a.order - b.order
      return a.name.localeCompare(b.name)
    }).map(permission => ({
      ...permission,
      children: permission.children ? sortChildren(permission.children) : []
    }))
  }

  const result = sortChildren(rootPermissions)
  logger.debug(`Built permission tree with ${result.length} root permissions, ${orphanedPermissions.length} orphaned`)
  
  return result
}

// 获取权限详情
export async function getPermissionById(id: string) {
  const permission = await prisma.permission.findUnique({
    where: { id },
    include: {
      permissions: {
        select: {
          id: true,
          name: true
        }
      },
      other_permissions: {
        select: {
          id: true,
          key: true,
          name: true,
          type: true,
          enabled: true
        },
        orderBy: { order: 'asc' }
      },
      role_permissions: {
        include: {
          roles: {
            select: {
              id: true,
              name: true,
              code: true
            }
          }
        }
      },
      _count: {
        select: {
          other_permissions: true,
          role_permissions: true
        }
      }
    }
  })

  return permission
}

// 更新权限
export async function updatePermission(id: string, data: UpdatePermissionData): Promise<Permission> {
  // 检查权限是否存在
  const existingPermission = await prisma.permission.findUnique({
    where: { id }
  })

  if (!existingPermission) {
    throw new Error('权限不存在')
  }

  // 如果更新父权限，检查是否会造成循环引用
  if (data.parentId && data.parentId !== existingPermission.parentId) {
    const isCircular = await checkCircularReference(id, data.parentId)
    if (isCircular) {
      throw new Error('不能设置为自己的子权限作为父权限')
    }
  }

  // 更新权限
  const updatedPermission = await prisma.permission.update({
    where: { id },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.type && { type: data.type }),
      ...(data.parentId !== undefined && { parentId: data.parentId }),
      ...(data.path !== undefined && { path: data.path }),
      ...(data.method !== undefined && { method: data.method }),
      ...(data.order !== undefined && { order: data.order }),
      ...(data.enabled !== undefined && { enabled: data.enabled })
    }
  })

  logger.info(`Permission updated: ${updatedPermission.name} (${updatedPermission.id})`)
  return updatedPermission
}

// 删除权限
export async function deletePermission(id: string): Promise<void> {
  // 检查权限是否存在
  const existingPermission = await prisma.permission.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          other_permissions: true,
          role_permissions: true
        }
      }
    }
  })

  if (!existingPermission) {
    throw new Error('权限不存在')
  }

  // 检查是否有子权限
  if (existingPermission._count.other_permissions > 0) {
    throw new Error('该权限下还有子权限，无法删除')
  }

  // 检查是否有角色使用此权限
  if (existingPermission._count.role_permissions > 0) {
    throw new Error('该权限正在被角色使用，无法删除')
  }

  // 删除权限
  await prisma.permission.delete({
    where: { id }
  })

  logger.info(`Permission deleted: ${existingPermission.name} (${existingPermission.id})`)
}

// 批量更新权限状态
export async function batchUpdatePermissionStatus(ids: string[], enabled: boolean): Promise<number> {
  const result = await prisma.permission.updateMany({
    where: {
      id: { in: ids }
    },
    data: { enabled }
  })

  logger.info(`Batch updated ${result.count} permissions status to ${enabled}`)
  return result.count
}

// 获取菜单权限（用于前端菜单生成）
export async function getMenuPermissions(): Promise<PermissionTreeNode[]> {
  const permissions = await prisma.permission.findMany({
    where: { 
      enabled: true,
      type: { in: [PermissionType.MENU, PermissionType.PAGE] }
    },
    orderBy: [
      { order: 'asc' },
      { createdAt: 'asc' }
    ]
  })

  // 构建树结构
  const permissionMap = new Map<string, PermissionTreeNode>()
  const rootPermissions: PermissionTreeNode[] = []
  const orphanedPermissions: PermissionTreeNode[] = []

  // 初始化所有权限节点
  permissions.forEach(permission => {
    permissionMap.set(permission.id, { ...permission, children: [] })
  })

  // 按层级排序，确保父权限先处理
  const sortedPermissions = [...permissions].sort((a, b) => {
    if (!a.parentId && b.parentId) return -1
    if (a.parentId && !b.parentId) return 1
    // 按order字段排序
    if (a.order !== b.order) return a.order - b.order
    return 0
  })

  // 构建父子关系
  sortedPermissions.forEach(permission => {
    const node = permissionMap.get(permission.id)!
    
    if (permission.parentId) {
      const parent = permissionMap.get(permission.parentId)
      if (parent) {
        parent.children!.push(node)
      } else {
        // 父权限不存在，记录为孤立权限
        console.warn(`Menu permission ${permission.name} (${permission.id}) has missing parent ${permission.parentId}`)
        (node as any).isOrphaned = true
        orphanedPermissions.push(node)
      }
    } else {
      rootPermissions.push(node)
    }
  })

  // 将孤立权限添加到根级别
  orphanedPermissions.forEach(permission => {
    rootPermissions.push(permission)
  })

  // 递归排序子权限
  const sortChildren = (permissions: PermissionTreeNode[]): PermissionTreeNode[] => {
    return permissions.sort((a, b) => {
      // 孤立权限排在后面
      const aOrphaned = (a as any).isOrphaned
      const bOrphaned = (b as any).isOrphaned
      if (aOrphaned && !bOrphaned) return 1
      if (!aOrphaned && bOrphaned) return -1
      
      // 按order字段排序
      if (a.order !== b.order) return a.order - b.order
      return a.name.localeCompare(b.name)
    }).map(permission => ({
      ...permission,
      children: permission.children ? sortChildren(permission.children) : []
    }))
  }

  const result = sortChildren(rootPermissions)
  logger.debug(`Built menu permission tree with ${result.length} root permissions, ${orphanedPermissions.length} orphaned`)
  
  return result
}

// 根据权限key获取权限
export async function getPermissionByKey(key: string): Promise<Permission | null> {
  return await prisma.permission.findUnique({
    where: { key }
  })
}

// 根据权限keys批量获取权限
export async function getPermissionsByKeys(keys: string[]): Promise<Permission[]> {
  return await prisma.permission.findMany({
    where: { 
      key: { in: keys },
      enabled: true
    }
  })
}

// 检查循环引用
async function checkCircularReference(permissionId: string, parentId: string): Promise<boolean> {
  if (permissionId === parentId) {
    return true
  }

  const parent = await prisma.permission.findUnique({
    where: { id: parentId },
    select: { parentId: true }
  })

  if (!parent || !parent.parentId) {
    return false
  }

  return await checkCircularReference(permissionId, parent.parentId)
}

// 获取权限的所有子权限（递归）
export async function getPermissionChildren(permissionId: string): Promise<Permission[]> {
  const children = await prisma.permission.findMany({
    where: { parentId: permissionId }
  })

  const allChildren: Permission[] = [...children]

  for (const child of children) {
    const grandChildren = await getPermissionChildren(child.id)
    allChildren.push(...grandChildren)
  }

  return allChildren
}
