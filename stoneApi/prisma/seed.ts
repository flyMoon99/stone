import { PrismaClient, AdminType, UserStatus, PermissionType } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

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

  console.log('✅ 角色创建完成')

  // ==================== 创建权限 ====================
  console.log('🔐 创建系统权限...')

  // 1. 管理员管理权限
  const adminMenuPermission = await prisma.permission.upsert({
    where: { key: 'admin' },
    update: {},
    create: {
      key: 'admin',
      name: '管理员管理',
      type: PermissionType.MENU,
      order: 1,
      enabled: true,
    },
  })

  const adminListPermission = await prisma.permission.upsert({
    where: { key: 'admin.list' },
    update: {},
    create: {
      key: 'admin.list',
      name: '管理员列表',
      type: PermissionType.PAGE,
      parentId: adminMenuPermission.id,
      path: '/admin/admins',
      order: 1,
      enabled: true,
    },
  })

  const adminCreatePermission = await prisma.permission.upsert({
    where: { key: 'admin.create' },
    update: {},
    create: {
      key: 'admin.create',
      name: '创建管理员',
      type: PermissionType.ACTION,
      parentId: adminListPermission.id,
      order: 1,
      enabled: true,
    },
  })

  const adminUpdatePermission = await prisma.permission.upsert({
    where: { key: 'admin.update' },
    update: {},
    create: {
      key: 'admin.update',
      name: '编辑管理员',
      type: PermissionType.ACTION,
      parentId: adminListPermission.id,
      order: 2,
      enabled: true,
    },
  })

  const adminBatchUpdatePermission = await prisma.permission.upsert({
    where: { key: 'admin.batch_update' },
    update: {},
    create: {
      key: 'admin.batch_update',
      name: '批量启用/禁用管理员',
      type: PermissionType.ACTION,
      parentId: adminListPermission.id,
      order: 3,
      enabled: true,
    },
  })

  const adminDeletePermission = await prisma.permission.upsert({
    where: { key: 'admin.delete' },
    update: {},
    create: {
      key: 'admin.delete',
      name: '删除管理员',
      type: PermissionType.ACTION,
      parentId: adminListPermission.id,
      order: 4,
      enabled: true,
    },
  })

  // 2. 会员管理权限
  const memberMenuPermission = await prisma.permission.upsert({
    where: { key: 'member' },
    update: {},
    create: {
      key: 'member',
      name: '会员管理',
      type: PermissionType.MENU,
      order: 2,
      enabled: true,
    },
  })

  const memberListPermission = await prisma.permission.upsert({
    where: { key: 'member.list' },
    update: {},
    create: {
      key: 'member.list',
      name: '会员列表',
      type: PermissionType.PAGE,
      parentId: memberMenuPermission.id,
      path: '/admin/members',
      order: 1,
      enabled: true,
    },
  })

  const memberCreatePermission = await prisma.permission.upsert({
    where: { key: 'member.create' },
    update: {},
    create: {
      key: 'member.create',
      name: '创建会员',
      type: PermissionType.ACTION,
      parentId: memberListPermission.id,
      order: 1,
      enabled: true,
    },
  })

  const memberUpdatePermission = await prisma.permission.upsert({
    where: { key: 'member.update' },
    update: {},
    create: {
      key: 'member.update',
      name: '编辑会员',
      type: PermissionType.ACTION,
      parentId: memberListPermission.id,
      order: 2,
      enabled: true,
    },
  })

  const memberBatchUpdatePermission = await prisma.permission.upsert({
    where: { key: 'member.batch_update' },
    update: {},
    create: {
      key: 'member.batch_update',
      name: '批量启用/禁用会员',
      type: PermissionType.ACTION,
      parentId: memberListPermission.id,
      order: 3,
      enabled: true,
    },
  })

  const memberViewPermission = await prisma.permission.upsert({
    where: { key: 'member.view' },
    update: {},
    create: {
      key: 'member.view',
      name: '查看会员详情',
      type: PermissionType.ACTION,
      parentId: memberListPermission.id,
      order: 4,
      enabled: true,
    },
  })

  // 3. 角色管理权限
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

  const roleBatchUpdatePermission = await prisma.permission.upsert({
    where: { key: 'role.batch_update' },
    update: {},
    create: {
      key: 'role.batch_update',
      name: '批量启用/禁用角色',
      type: PermissionType.ACTION,
      parentId: roleListPermission.id,
      order: 4,
      enabled: true,
    },
  })

  const roleAssignPermissionPermission = await prisma.permission.upsert({
    where: { key: 'role.assign_permission' },
    update: {},
    create: {
      key: 'role.assign_permission',
      name: '分配权限',
      type: PermissionType.ACTION,
      parentId: roleListPermission.id,
      order: 5,
      enabled: true,
    },
  })

  // 4. 权限管理权限
  const permissionMenuPermission = await prisma.permission.upsert({
    where: { key: 'permission' },
    update: {},
    create: {
      key: 'permission',
      name: '权限管理',
      type: PermissionType.MENU,
      order: 4,
      enabled: true,
    },
  })

  const permissionListPermission = await prisma.permission.upsert({
    where: { key: 'permission.list' },
    update: {},
    create: {
      key: 'permission.list',
      name: '权限列表',
      type: PermissionType.PAGE,
      parentId: permissionMenuPermission.id,
      path: '/admin/permissions',
      order: 1,
      enabled: true,
    },
  })

  const permissionCreatePermission = await prisma.permission.upsert({
    where: { key: 'permission.create' },
    update: {},
    create: {
      key: 'permission.create',
      name: '创建权限',
      type: PermissionType.ACTION,
      parentId: permissionListPermission.id,
      order: 1,
      enabled: true,
    },
  })

  const permissionUpdatePermission = await prisma.permission.upsert({
    where: { key: 'permission.update' },
    update: {},
    create: {
      key: 'permission.update',
      name: '编辑权限',
      type: PermissionType.ACTION,
      parentId: permissionListPermission.id,
      order: 2,
      enabled: true,
    },
  })

  const permissionDeletePermission = await prisma.permission.upsert({
    where: { key: 'permission.delete' },
    update: {},
    create: {
      key: 'permission.delete',
      name: '删除权限',
      type: PermissionType.ACTION,
      parentId: permissionListPermission.id,
      order: 3,
      enabled: true,
    },
  })

  const permissionBatchUpdatePermission = await prisma.permission.upsert({
    where: { key: 'permission.batch_update' },
    update: {},
    create: {
      key: 'permission.batch_update',
      name: '批量启用/禁用权限',
      type: PermissionType.ACTION,
      parentId: permissionListPermission.id,
      order: 4,
      enabled: true,
    },
  })

  // 5. 用户权限分配权限
  const userPermissionMenuPermission = await prisma.permission.upsert({
    where: { key: 'user-permission' },
    update: {},
    create: {
      key: 'user-permission',
      name: '用户权限分配',
      type: PermissionType.MENU,
      order: 5,
      enabled: true,
    },
  })

  const userPermissionListPermission = await prisma.permission.upsert({
    where: { key: 'user-permission.list' },
    update: {},
    create: {
      key: 'user-permission.list',
      name: '用户权限列表',
      type: PermissionType.PAGE,
      parentId: userPermissionMenuPermission.id,
      path: '/admin/user-permissions',
      order: 1,
      enabled: true,
    },
  })

  const userPermissionAssignRolePermission = await prisma.permission.upsert({
    where: { key: 'user-permission.assign_role' },
    update: {},
    create: {
      key: 'user-permission.assign_role',
      name: '分配角色',
      type: PermissionType.ACTION,
      parentId: userPermissionListPermission.id,
      order: 1,
      enabled: true,
    },
  })

  const userPermissionBatchAssignRolePermission = await prisma.permission.upsert({
    where: { key: 'user-permission.batch_assign_role' },
    update: {},
    create: {
      key: 'user-permission.batch_assign_role',
      name: '批量分配角色',
      type: PermissionType.ACTION,
      parentId: userPermissionListPermission.id,
      order: 2,
      enabled: true,
    },
  })

  const userPermissionViewPermission = await prisma.permission.upsert({
    where: { key: 'user-permission.view' },
    update: {},
    create: {
      key: 'user-permission.view',
      name: '查看用户权限',
      type: PermissionType.ACTION,
      parentId: userPermissionListPermission.id,
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
        roles: 1,
        permissions: allPermissions.length,
        admins: 1
      },
      ip: '127.0.0.1',
      userAgent: 'Prisma Seed Script'
    }
  })

  console.log('🎉 RBAC权限系统种子数据初始化完成!')
  console.log('📊 统计信息:')
  console.log(`   - 角色数量: 1`)
  console.log(`   - 权限数量: ${allPermissions.length}`)
  console.log(`   - 管理员数量: 1`)
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
