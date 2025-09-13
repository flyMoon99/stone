import { Admin, Member, AdminType, UserStatus } from '@prisma/client'
import { LoginRequest, LoginResponse } from '@stone/shared'
import { prisma } from '../utils/database'
import { verifyPassword } from '../utils/password'
import { generateAdminToken, generateMemberToken, generateAdminRefreshToken } from '../utils/jwt'
import { logger } from '../utils/logger'

// 管理员登录服务
export async function adminLogin(loginData: LoginRequest): Promise<LoginResponse> {
  const { account, password } = loginData

  // 查找管理员
  const admin = await prisma.admin.findUnique({
    where: { account }
  })

  if (!admin) {
    throw new Error('用户名或密码错误')
  }

  // 检查账户状态
  if (admin.status !== UserStatus.ACTIVE) {
    throw new Error('账户已被禁用')
  }

  // 验证密码
  const isPasswordValid = await verifyPassword(password, admin.password)
  if (!isPasswordValid) {
    throw new Error('用户名或密码错误')
  }

  // 更新最后登录时间
  await prisma.admin.update({
    where: { id: admin.id },
    data: { lastLoginAt: new Date() }
  })

  // 生成Token
  const token = generateAdminToken({
    id: admin.id,
    account: admin.account,
    type: admin.type
  })

  const refreshToken = generateAdminRefreshToken({
    id: admin.id,
    account: admin.account
  })

  // 记录登录日志
  await prisma.systemLog.create({
    data: {
      userId: admin.id,
      userType: 'admin',
      action: 'LOGIN',
      resource: 'auth',
      details: {
        account: admin.account,
        type: admin.type,
        loginTime: new Date().toISOString()
      }
    }
  })

  logger.info(`Admin login successful: ${admin.account} (${admin.id})`)

  return {
    token,
    refreshToken,
    user: {
      id: admin.id,
      account: admin.account,
      type: admin.type,
      createdAt: admin.createdAt,
      status: admin.status,
      lastLoginAt: admin.lastLoginAt
    }
  }
}

// 会员登录服务
export async function memberLogin(loginData: LoginRequest): Promise<LoginResponse> {
  const { account, password } = loginData

  // 查找会员
  const member = await prisma.member.findUnique({
    where: { account }
  })

  if (!member) {
    throw new Error('用户名或密码错误')
  }

  // 检查账户状态
  if (member.status !== UserStatus.ACTIVE) {
    throw new Error('账户已被禁用')
  }

  // 验证密码
  const isPasswordValid = await verifyPassword(password, member.password)
  if (!isPasswordValid) {
    throw new Error('用户名或密码错误')
  }

  // 更新最后登录时间
  await prisma.member.update({
    where: { id: member.id },
    data: { lastLoginAt: new Date() }
  })

  // 生成Token
  const token = generateMemberToken({
    id: member.id,
    account: member.account
  })

  // 记录登录日志
  await prisma.systemLog.create({
    data: {
      userId: member.id,
      userType: 'member',
      action: 'LOGIN',
      resource: 'auth',
      details: {
        account: member.account,
        loginTime: new Date().toISOString()
      }
    }
  })

  logger.info(`Member login successful: ${member.account} (${member.id})`)

  return {
    token,
    user: {
      id: member.id,
      account: member.account,
      createdAt: member.createdAt,
      status: member.status,
      lastLoginAt: member.lastLoginAt
    }
  }
}

// 获取管理员信息
export async function getAdminProfile(adminId: string): Promise<Admin | null> {
  return await prisma.admin.findUnique({
    where: { id: adminId },
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

// 获取会员信息
export async function getMemberProfile(memberId: string): Promise<Member | null> {
  return await prisma.member.findUnique({
    where: { id: memberId },
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
