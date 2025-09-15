import { Admin, AdminType, UserStatus } from '@prisma/client'
import { PaginationParams, createPaginationResponse } from '@stone/shared'
import { prisma } from '../utils/database'
import { hashPassword } from '../utils/password'
import { logger } from '../utils/logger'

// 创建管理员
export async function createAdmin(data: {
  account: string
  password: string
  type?: AdminType
}): Promise<Admin> {
  // 检查账户是否已存在
  const existingAdmin = await prisma.admin.findUnique({
    where: { account: data.account }
  })

  if (existingAdmin) {
    throw new Error('账户名已存在')
  }

  // 加密密码
  const hashedPassword = await hashPassword(data.password)

  // 创建管理员
  const admin = await prisma.admin.create({
    data: {
      account: data.account,
      password: hashedPassword,
      type: data.type || AdminType.ADMIN,
      status: UserStatus.ACTIVE
    }
  })

  logger.info(`Admin created: ${admin.account} (${admin.id})`)

  return admin
}

// 获取管理员列表
export async function getAdminList(params: PaginationParams & {
  status?: UserStatus
  type?: AdminType
}) {
  const { page, pageSize, status, type } = params
  const skip = (page - 1) * pageSize

  // 构建查询条件
  const where: any = {}
  if (status) where.status = status
  if (type) where.type = type

  // 查询数据
  const [admins, total] = await Promise.all([
    prisma.admin.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        account: true,
        type: true,
        createdAt: true,
        updatedAt: true,
        status: true,
        lastLoginAt: true,
        admin_roles: {
          select: {
            roles: {
              select: {
                id: true,
                name: true,
                code: true
              }
            }
          }
        }
      }
    }),
    prisma.admin.count({ where })
  ])

  // 处理角色信息，将嵌套的角色数据扁平化
  const processedAdmins = admins.map(admin => ({
    ...admin,
    roles: admin.admin_roles.map(ar => ar.roles),
    admin_roles: undefined // 移除原始的嵌套结构
  }))

  return createPaginationResponse(processedAdmins, total, page, pageSize)
}

// 获取管理员详情
export async function getAdminById(id: string) {
  return await prisma.admin.findUnique({
    where: { id },
    select: {
      id: true,
      account: true,
      type: true,
      createdAt: true,
      updatedAt: true,
      status: true,
      lastLoginAt: true
    }
  })
}

// 更新管理员
export async function updateAdmin(id: string, data: {
  account?: string
  password?: string
  type?: AdminType
  status?: UserStatus
}) {
  // 检查管理员是否存在
  const existingAdmin = await prisma.admin.findUnique({
    where: { id }
  })

  if (!existingAdmin) {
    throw new Error('管理员不存在')
  }

  // 如果更新账户，检查是否重复
  if (data.account && data.account !== existingAdmin.account) {
    const accountExists = await prisma.admin.findUnique({
      where: { account: data.account }
    })

    if (accountExists) {
      throw new Error('账户名已存在')
    }
  }

  // 准备更新数据
  const updateData: any = {}
  if (data.account) updateData.account = data.account
  if (data.type) updateData.type = data.type
  if (data.status) updateData.status = data.status
  if (data.password) {
    updateData.password = await hashPassword(data.password)
  }

  // 更新管理员
  const updatedAdmin = await prisma.admin.update({
    where: { id },
    data: updateData,
    select: {
      id: true,
      account: true,
      type: true,
      createdAt: true,
      updatedAt: true,
      status: true,
      lastLoginAt: true
    }
  })

  logger.info(`Admin updated: ${updatedAdmin.account} (${updatedAdmin.id})`)

  return updatedAdmin
}

// 批量更新管理员状态
export async function batchUpdateAdminStatus(ids: string[], status: UserStatus): Promise<number> {
  const result = await prisma.admin.updateMany({
    where: {
      id: { in: ids },
      type: { not: AdminType.SUPER_ADMIN } // 不能修改超级管理员状态
    },
    data: { status }
  })

  logger.info(`Batch updated ${result.count} admins status to ${status}`)

  return result.count
}
