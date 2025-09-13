import { Member, UserStatus } from '@prisma/client'
import { PaginationParams, createPaginationResponse } from '@stone/shared'
import { prisma } from '../utils/database'
import { hashPassword } from '../utils/password'
import { logger } from '../utils/logger'

// 创建会员
export async function createMember(data: {
  account: string
  password: string
}): Promise<Member> {
  // 检查账户是否已存在
  const existingMember = await prisma.member.findUnique({
    where: { account: data.account }
  })

  if (existingMember) {
    throw new Error('账户名已存在')
  }

  // 加密密码
  const hashedPassword = await hashPassword(data.password)

  // 创建会员
  const member = await prisma.member.create({
    data: {
      account: data.account,
      password: hashedPassword,
      status: UserStatus.ACTIVE
    }
  })

  logger.info(`Member created: ${member.account} (${member.id})`)

  return member
}

// 获取会员列表
export async function getMemberList(params: PaginationParams & {
  status?: UserStatus
}) {
  const { page, pageSize, status } = params
  const skip = (page - 1) * pageSize

  // 构建查询条件
  const where: any = {}
  if (status) where.status = status

  // 查询数据
  const [members, total] = await Promise.all([
    prisma.member.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        account: true,
        createdAt: true,
        updatedAt: true,
        status: true,
        lastLoginAt: true
      }
    }),
    prisma.member.count({ where })
  ])

  return createPaginationResponse(members, total, page, pageSize)
}

// 获取会员详情
export async function getMemberById(id: string) {
  return await prisma.member.findUnique({
    where: { id },
    select: {
      id: true,
      account: true,
      createdAt: true,
      updatedAt: true,
      status: true,
      lastLoginAt: true
    }
  })
}

// 更新会员
export async function updateMember(id: string, data: {
  account?: string
  password?: string
  status?: UserStatus
}) {
  // 检查会员是否存在
  const existingMember = await prisma.member.findUnique({
    where: { id }
  })

  if (!existingMember) {
    throw new Error('会员不存在')
  }

  // 如果更新账户，检查是否重复
  if (data.account && data.account !== existingMember.account) {
    const accountExists = await prisma.member.findUnique({
      where: { account: data.account }
    })

    if (accountExists) {
      throw new Error('账户名已存在')
    }
  }

  // 准备更新数据
  const updateData: any = {}
  if (data.account) updateData.account = data.account
  if (data.status) updateData.status = data.status
  if (data.password) {
    updateData.password = await hashPassword(data.password)
  }

  // 更新会员
  const updatedMember = await prisma.member.update({
    where: { id },
    data: updateData,
    select: {
      id: true,
      account: true,
      createdAt: true,
      updatedAt: true,
      status: true,
      lastLoginAt: true
    }
  })

  logger.info(`Member updated: ${updatedMember.account} (${updatedMember.id})`)

  return updatedMember
}

// 批量更新会员状态
export async function batchUpdateMemberStatus(ids: string[], status: UserStatus): Promise<number> {
  const result = await prisma.member.updateMany({
    where: { id: { in: ids } },
    data: { status }
  })

  logger.info(`Batch updated ${result.count} members status to ${status}`)

  return result.count
}

// 搜索会员
export async function searchMembers(params: PaginationParams & {
  keyword?: string
  status?: UserStatus
}) {
  const { page, pageSize, keyword, status } = params
  const skip = (page - 1) * pageSize

  // 构建查询条件
  const where: any = {}
  if (status) where.status = status
  if (keyword) {
    where.account = {
      contains: keyword,
      mode: 'insensitive'
    }
  }

  // 查询数据
  const [members, total] = await Promise.all([
    prisma.member.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        account: true,
        createdAt: true,
        updatedAt: true,
        status: true,
        lastLoginAt: true
      }
    }),
    prisma.member.count({ where })
  ])

  return createPaginationResponse(members, total, page, pageSize)
}
