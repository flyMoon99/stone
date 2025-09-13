import bcrypt from 'bcryptjs'

// 密码加密轮数
const SALT_ROUNDS = 10

// 加密密码
export async function hashPassword(password: string): Promise<string> {
  try {
    const salt = await bcrypt.genSalt(SALT_ROUNDS)
    return await bcrypt.hash(password, salt)
  } catch (error) {
    throw new Error('Password hashing failed')
  }
}

// 验证密码
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hashedPassword)
  } catch (error) {
    throw new Error('Password verification failed')
  }
}

// 生成随机密码
export function generateRandomPassword(length: number = 12): string {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
  let password = ''
  
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length)
    password += charset[randomIndex]
  }
  
  return password
}

// 验证密码强度
export function validatePasswordStrength(password: string): {
  isValid: boolean
  errors: string[]
  score: number
} {
  const errors: string[] = []
  let score = 0
  
  // 长度检查
  if (password.length < 8) {
    errors.push('密码长度至少8位')
  } else if (password.length >= 12) {
    score += 2
  } else {
    score += 1
  }
  
  // 大写字母
  if (!/[A-Z]/.test(password)) {
    errors.push('密码必须包含大写字母')
  } else {
    score += 1
  }
  
  // 小写字母
  if (!/[a-z]/.test(password)) {
    errors.push('密码必须包含小写字母')
  } else {
    score += 1
  }
  
  // 数字
  if (!/\d/.test(password)) {
    errors.push('密码必须包含数字')
  } else {
    score += 1
  }
  
  // 特殊字符
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('密码建议包含特殊字符')
  } else {
    score += 2
  }
  
  // 重复字符检查
  if (/(.)\1{2,}/.test(password)) {
    errors.push('密码不能包含连续重复字符')
    score -= 1
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    score: Math.max(0, score)
  }
}
