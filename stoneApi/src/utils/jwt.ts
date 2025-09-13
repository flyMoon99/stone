import jwt from 'jsonwebtoken'
import { JwtPayload, AdminType } from '@stone/shared'

// JWT配置
const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'admin-secret-key'
const MEMBER_JWT_SECRET = process.env.MEMBER_JWT_SECRET || 'member-secret-key'
const ADMIN_EXPIRES_IN = '7d'
const MEMBER_EXPIRES_IN = '7d'

// 生成管理员Token
export function generateAdminToken(payload: { id: string; account: string; type: AdminType }): string {
  return jwt.sign(payload, ADMIN_JWT_SECRET, { expiresIn: ADMIN_EXPIRES_IN })
}

// 生成会员Token
export function generateMemberToken(payload: { id: string; account: string }): string {
  return jwt.sign(payload, MEMBER_JWT_SECRET, { expiresIn: MEMBER_EXPIRES_IN })
}

// 验证管理员Token
export function verifyAdminToken(token: string): JwtPayload {
  try {
    return jwt.verify(token, ADMIN_JWT_SECRET) as JwtPayload
  } catch (error) {
    throw new Error('Invalid admin token')
  }
}

// 验证会员Token
export function verifyMemberToken(token: string): JwtPayload {
  try {
    return jwt.verify(token, MEMBER_JWT_SECRET) as JwtPayload
  } catch (error) {
    throw new Error('Invalid member token')
  }
}

// 生成刷新Token（仅管理员使用）
export function generateAdminRefreshToken(payload: { id: string; account: string }): string {
  return jwt.sign(payload, ADMIN_JWT_SECRET + '-refresh', { expiresIn: '30d' })
}

// 验证刷新Token
export function verifyAdminRefreshToken(token: string): JwtPayload {
  try {
    return jwt.verify(token, ADMIN_JWT_SECRET + '-refresh') as JwtPayload
  } catch (error) {
    throw new Error('Invalid refresh token')
  }
}

// 从Token中提取载荷（不验证）
export function decodeToken(token: string): JwtPayload | null {
  try {
    return jwt.decode(token) as JwtPayload
  } catch (error) {
    return null
  }
}

// 检查Token是否即将过期（1天内）
export function isTokenExpiringSoon(token: string): boolean {
  const decoded = decodeToken(token)
  if (!decoded || !decoded.exp) return true
  
  const now = Math.floor(Date.now() / 1000)
  const timeUntilExpiry = decoded.exp - now
  const oneDayInSeconds = 24 * 60 * 60
  
  return timeUntilExpiry < oneDayInSeconds
}
