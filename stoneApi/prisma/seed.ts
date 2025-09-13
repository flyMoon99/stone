import { PrismaClient, AdminType, UserStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 开始数据库种子数据初始化...')

  // 创建默认超级管理员
  const hashedPassword = await bcrypt.hash('admin123', 10)
  
  const superAdmin = await prisma.admin.upsert({
    where: { account: 'admin' },
    update: {
      password: hashedPassword,
    },
    create: {
      account: 'admin',
      password: hashedPassword,
      type: AdminType.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
    },
  })

  console.log('✅ 创建超级管理员:', superAdmin)

  // 创建测试普通管理员
  const testAdminPassword = await bcrypt.hash('testadmin123', 10)
  
  const testAdmin = await prisma.admin.upsert({
    where: { account: 'testadmin' },
    update: {
      password: testAdminPassword,
    },
    create: {
      account: 'testadmin',
      password: testAdminPassword,
      type: AdminType.ADMIN,
      status: UserStatus.ACTIVE,
    },
  })

  console.log('✅ 创建测试管理员:', testAdmin)

  // 创建测试会员
  const testMemberPassword = await bcrypt.hash('testmember123', 10)
  
  const testMember = await prisma.member.upsert({
    where: { account: 'testmember' },
    update: {
      password: testMemberPassword,
    },
    create: {
      account: 'testmember',
      password: testMemberPassword,
      status: UserStatus.ACTIVE,
    },
  })

  console.log('✅ 创建测试会员:', testMember)

  // 创建系统日志示例
  await prisma.systemLog.create({
    data: {
      userId: superAdmin.id,
      userType: 'admin',
      action: 'SEED_DATA',
      resource: 'database',
      details: {
        message: '数据库种子数据初始化完成',
        timestamp: new Date().toISOString()
      },
      ip: '127.0.0.1',
      userAgent: 'Prisma Seed Script'
    }
  })

  console.log('🎉 数据库种子数据初始化完成!')
}

main()
  .catch((e) => {
    console.error('❌ 种子数据初始化失败:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
