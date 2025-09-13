import { PrismaClient, AdminType, UserStatus, PermissionType } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 开始数据库种子数据初始化...')

  // ==================== 创建角色 ====================
  console.log('📋 创建系统角色...')
  
  const superAdminRole = await prisma.role.upsert({
    where: { code: 'super_admin' },
    update: {},
    create: {
      name: '超级管理员',
      code: 'super_admin',
      description: '拥有系统所有权限的超级管理员',
      status: true,
    },
  })

  const adminRole = await prisma.role.upsert({
    where: { code: 'admin' },
    update: {},
    create: {
      name: '系统管理员',
      code: 'admin',
      description: '拥有大部分管理权限的系统管理员',
      status: true,
    },
  })

  const userManagerRole = await prisma.role.upsert({
    where: { code: 'user_manager' },
    update: {},
    create: {
      name: '用户管理员',
      code: 'user_manager',
      description: '负责用户管理的管理员',
      status: true,
    },
  })

  console.log('✅ 角色创建完成')

  // ==================== 创建权限 ====================
  console.log('🔐 创建系统权限...')

  // 系统管理权限
  const systemMenuPermission = await prisma.permission.upsert({
    where: { key: 'system' },
    update: {},
    create: {
      key: 'system',
      name: '系统管理',
      type: PermissionType.MENU,
      order: 1,
      enabled: true,
    },
  })

  const systemConfigPermission = await prisma.permission.upsert({
    where: { key: 'system.config' },
    update: {},
    create: {
      key: 'system.config',
      name: '系统配置',
      type: PermissionType.PAGE,
      parentId: systemMenuPermission.id,
      order: 1,
      enabled: true,
    },
  })

  // 用户管理权限
  const userMenuPermission = await prisma.permission.upsert({
    where: { key: 'user' },
    update: {},
    create: {
      key: 'user',
      name: '用户管理',
      type: PermissionType.MENU,
      order: 2,
      enabled: true,
    },
  })

  const userListPermission = await prisma.permission.upsert({
    where: { key: 'user.list' },
    update: {},
    create: {
      key: 'user.list',
      name: '用户列表',
      type: PermissionType.PAGE,
      parentId: userMenuPermission.id,
      path: '/admin/users',
      order: 1,
      enabled: true,
    },
  })

  const userCreatePermission = await prisma.permission.upsert({
    where: { key: 'user.create' },
    update: {},
    create: {
      key: 'user.create',
      name: '创建用户',
      type: PermissionType.ACTION,
      parentId: userListPermission.id,
      order: 1,
      enabled: true,
    },
  })

  const userUpdatePermission = await prisma.permission.upsert({
    where: { key: 'user.update' },
    update: {},
    create: {
      key: 'user.update',
      name: '编辑用户',
      type: PermissionType.ACTION,
      parentId: userListPermission.id,
      order: 2,
      enabled: true,
    },
  })

  const userDeletePermission = await prisma.permission.upsert({
    where: { key: 'user.delete' },
    update: {},
    create: {
      key: 'user.delete',
      name: '删除用户',
      type: PermissionType.ACTION,
      parentId: userListPermission.id,
      order: 3,
      enabled: true,
    },
  })

  // 角色管理权限
  const roleMenuPermission = await prisma.permission.upsert({
    where: { key: 'role' },
    update: {},
    create: {
      key: 'role',
      name: '角色管理',
      type: PermissionType.MENU,
      order: 3,
      enabled: true,
    },
  })

  const roleListPermission = await prisma.permission.upsert({
    where: { key: 'role.list' },
    update: {},
    create: {
      key: 'role.list',
      name: '角色列表',
      type: PermissionType.PAGE,
      parentId: roleMenuPermission.id,
      path: '/admin/roles',
      order: 1,
      enabled: true,
    },
  })

  const roleCreatePermission = await prisma.permission.upsert({
    where: { key: 'role.create' },
    update: {},
    create: {
      key: 'role.create',
      name: '创建角色',
      type: PermissionType.ACTION,
      parentId: roleListPermission.id,
      order: 1,
      enabled: true,
    },
  })

  const roleUpdatePermission = await prisma.permission.upsert({
    where: { key: 'role.update' },
    update: {},
    create: {
      key: 'role.update',
      name: '编辑角色',
      type: PermissionType.ACTION,
      parentId: roleListPermission.id,
      order: 2,
      enabled: true,
    },
  })

  const roleDeletePermission = await prisma.permission.upsert({
    where: { key: 'role.delete' },
    update: {},
    create: {
      key: 'role.delete',
      name: '删除角色',
      type: PermissionType.ACTION,
      parentId: roleListPermission.id,
      order: 3,
      enabled: true,
    },
  })

  console.log('✅ 权限创建完成')

  // ==================== 分配角色权限 ====================
  console.log('🔗 分配角色权限...')

  // 超级管理员拥有所有权限
  const allPermissions = await prisma.permission.findMany()
  for (const permission of allPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: superAdminRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: superAdminRole.id,
        permissionId: permission.id,
      },
    })
  }

  // 系统管理员权限（除了系统配置）
  const adminPermissions = allPermissions.filter(p => p.key !== 'system.config')
  for (const permission of adminPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: adminRole.id,
        permissionId: permission.id,
      },
    })
  }

  // 用户管理员只有用户相关权限
  const userPermissions = allPermissions.filter(p => p.key.startsWith('user'))
  for (const permission of userPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: userManagerRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: userManagerRole.id,
        permissionId: permission.id,
      },
    })
  }

  console.log('✅ 角色权限分配完成')

  // ==================== 创建管理员用户 ====================
  console.log('👤 创建管理员用户...')

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

  // 分配超级管理员角色
  await prisma.adminRole.upsert({
    where: {
      adminId_roleId: {
        adminId: superAdmin.id,
        roleId: superAdminRole.id,
      },
    },
    update: {},
    create: {
      adminId: superAdmin.id,
      roleId: superAdminRole.id,
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

  // 分配系统管理员角色
  await prisma.adminRole.upsert({
    where: {
      adminId_roleId: {
        adminId: testAdmin.id,
        roleId: adminRole.id,
      },
    },
    update: {},
    create: {
      adminId: testAdmin.id,
      roleId: adminRole.id,
    },
  })

  console.log('✅ 创建测试管理员:', testAdmin)

  // 创建用户管理员
  const userManagerPassword = await bcrypt.hash('usermanager123', 10)
  
  const userManager = await prisma.admin.upsert({
    where: { account: 'usermanager' },
    update: {
      password: userManagerPassword,
    },
    create: {
      account: 'usermanager',
      password: userManagerPassword,
      type: AdminType.ADMIN,
      status: UserStatus.ACTIVE,
    },
  })

  // 分配用户管理员角色
  await prisma.adminRole.upsert({
    where: {
      adminId_roleId: {
        adminId: userManager.id,
        roleId: userManagerRole.id,
      },
    },
    update: {},
    create: {
      adminId: userManager.id,
      roleId: userManagerRole.id,
    },
  })

  console.log('✅ 创建用户管理员:', userManager)

  // ==================== 创建测试会员 ====================
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

  // ==================== 创建系统日志 ====================
  await prisma.systemLog.create({
    data: {
      userId: superAdmin.id,
      userType: 'admin',
      action: 'SEED_DATA',
      resource: 'database',
      details: {
        message: 'RBAC权限系统种子数据初始化完成',
        timestamp: new Date().toISOString(),
        roles: 3,
        permissions: allPermissions.length,
        admins: 3
      },
      ip: '127.0.0.1',
      userAgent: 'Prisma Seed Script'
    }
  })

  console.log('🎉 RBAC权限系统种子数据初始化完成!')
  console.log('📊 统计信息:')
  console.log(`   - 角色数量: 3`)
  console.log(`   - 权限数量: ${allPermissions.length}`)
  console.log(`   - 管理员数量: 3`)
  console.log(`   - 会员数量: 1`)
}

main()
  .catch((e) => {
    console.error('❌ 种子数据初始化失败:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
