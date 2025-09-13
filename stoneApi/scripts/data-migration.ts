#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { logger } from '../src/utils/logger'

const prisma = new PrismaClient()

interface MigrationResult {
  success: boolean
  message: string
  details?: any
}

class DataMigrationService {
  // 迁移现有管理员到RBAC系统
  async migrateAdminsToRBAC(): Promise<MigrationResult> {
    try {
      logger.info('🔄 开始迁移现有管理员到RBAC系统...')

      // 获取所有现有管理员
      const admins = await prisma.admin.findMany({
        where: {
          // 排除已经有角色分配的管理员
          admin_roles: {
            none: {}
          }
        }
      })

      if (admins.length === 0) {
        return {
          success: true,
          message: '没有需要迁移的管理员',
          details: { migratedCount: 0 }
        }
      }

      // 获取默认角色
      const defaultRole = await prisma.role.findFirst({
        where: { code: 'admin' }
      })

      if (!defaultRole) {
        return {
          success: false,
          message: '找不到默认admin角色，请先运行种子数据脚本'
        }
      }

      let migratedCount = 0

      // 为每个管理员分配默认角色
      for (const admin of admins) {
        try {
          // 跳过超级管理员，他们不需要角色分配
          if (admin.type === 'SUPER_ADMIN') {
            continue
          }

          await prisma.adminRole.create({
            data: {
              adminId: admin.id,
              roleId: defaultRole.id
            }
          })

          migratedCount++
          logger.info(`✅ 已为管理员 ${admin.account} 分配默认角色`)
        } catch (error) {
          logger.warn(`⚠️ 为管理员 ${admin.account} 分配角色失败:`, error)
        }
      }

      return {
        success: true,
        message: `成功迁移 ${migratedCount} 个管理员到RBAC系统`,
        details: { 
          totalAdmins: admins.length,
          migratedCount,
          skippedSuperAdmins: admins.filter(a => a.type === 'SUPER_ADMIN').length
        }
      }
    } catch (error) {
      logger.error('❌ 管理员RBAC迁移失败:', error)
      return {
        success: false,
        message: `迁移失败: ${error instanceof Error ? error.message : '未知错误'}`
      }
    }
  }

  // 迁移旧的权限数据
  async migrateLegacyPermissions(): Promise<MigrationResult> {
    try {
      logger.info('🔄 开始迁移旧权限数据...')

      // 检查是否有旧的权限表或字段需要迁移
      // 这里假设有一个旧的admin_permissions表
      const legacyPermissionsExist = await this.checkTableExists('admin_permissions')

      if (!legacyPermissionsExist) {
        return {
          success: true,
          message: '没有发现旧权限数据需要迁移',
          details: { migratedCount: 0 }
        }
      }

      // 如果存在旧权限表，进行迁移
      // 这里是示例逻辑，实际需要根据具体的旧数据结构调整
      const legacyPermissions = await prisma.$queryRaw`
        SELECT * FROM admin_permissions WHERE migrated = false OR migrated IS NULL
      ` as any[]

      let migratedCount = 0

      for (const legacyPerm of legacyPermissions) {
        try {
          // 根据旧权限数据创建新的角色权限关联
          // 这里需要根据实际的数据结构进行映射
          const permission = await prisma.permission.findFirst({
            where: { key: legacyPerm.permission_key }
          })

          const role = await prisma.role.findFirst({
            where: { code: legacyPerm.role_code }
          })

          if (permission && role) {
            await prisma.rolePermission.upsert({
              where: {
                roleId_permissionId: {
                  roleId: role.id,
                  permissionId: permission.id
                }
              },
              update: {},
              create: {
                roleId: role.id,
                permissionId: permission.id
              }
            })

            // 标记为已迁移
            await prisma.$executeRaw`
              UPDATE admin_permissions SET migrated = true WHERE id = ${legacyPerm.id}
            `

            migratedCount++
          }
        } catch (error) {
          logger.warn(`⚠️ 迁移权限记录失败:`, error)
        }
      }

      return {
        success: true,
        message: `成功迁移 ${migratedCount} 条权限记录`,
        details: { 
          totalLegacyPermissions: legacyPermissions.length,
          migratedCount
        }
      }
    } catch (error) {
      logger.error('❌ 权限数据迁移失败:', error)
      return {
        success: false,
        message: `迁移失败: ${error instanceof Error ? error.message : '未知错误'}`
      }
    }
  }

  // 数据完整性检查和修复
  async validateAndFixDataIntegrity(): Promise<MigrationResult> {
    try {
      logger.info('🔍 开始数据完整性检查...')

      const issues: string[] = []
      const fixes: string[] = []

      // 1. 检查孤立的角色权限关联
      const orphanedRolePermissions = await prisma.rolePermission.findMany({
        where: {
          OR: [
            { role: null },
            { permission: null }
          ]
        },
        include: {
          role: true,
          permission: true
        }
      })

      if (orphanedRolePermissions.length > 0) {
        issues.push(`发现 ${orphanedRolePermissions.length} 个孤立的角色权限关联`)
        
        // 删除孤立的关联
        await prisma.rolePermission.deleteMany({
          where: {
            id: {
              in: orphanedRolePermissions.map(rp => rp.id)
            }
          }
        })
        
        fixes.push(`已删除 ${orphanedRolePermissions.length} 个孤立的角色权限关联`)
      }

      // 2. 检查孤立的用户角色关联
      const orphanedUserRoles = await prisma.adminRole.findMany({
        where: {
          OR: [
            { admin: null },
            { role: null }
          ]
        },
        include: {
          admin: true,
          role: true
        }
      })

      if (orphanedUserRoles.length > 0) {
        issues.push(`发现 ${orphanedUserRoles.length} 个孤立的用户角色关联`)
        
        // 删除孤立的关联
        await prisma.adminRole.deleteMany({
          where: {
            id: {
              in: orphanedUserRoles.map(ur => ur.id)
            }
          }
        })
        
        fixes.push(`已删除 ${orphanedUserRoles.length} 个孤立的用户角色关联`)
      }

      // 3. 检查重复的权限键
      const duplicatePermissions = await prisma.$queryRaw`
        SELECT key, COUNT(*) as count 
        FROM permissions 
        GROUP BY key 
        HAVING COUNT(*) > 1
      ` as any[]

      if (duplicatePermissions.length > 0) {
        issues.push(`发现 ${duplicatePermissions.length} 个重复的权限键`)
        
        for (const dup of duplicatePermissions) {
          const permissions = await prisma.permission.findMany({
            where: { key: dup.key },
            orderBy: { createdAt: 'asc' }
          })

          // 保留最早创建的，删除其他的
          const toDelete = permissions.slice(1)
          if (toDelete.length > 0) {
            await prisma.permission.deleteMany({
              where: {
                id: {
                  in: toDelete.map(p => p.id)
                }
              }
            })
            fixes.push(`已删除权限键 "${dup.key}" 的 ${toDelete.length} 个重复项`)
          }
        }
      }

      // 4. 检查重复的角色代码
      const duplicateRoles = await prisma.$queryRaw`
        SELECT code, COUNT(*) as count 
        FROM roles 
        GROUP BY code 
        HAVING COUNT(*) > 1
      ` as any[]

      if (duplicateRoles.length > 0) {
        issues.push(`发现 ${duplicateRoles.length} 个重复的角色代码`)
        
        for (const dup of duplicateRoles) {
          const roles = await prisma.role.findMany({
            where: { code: dup.code },
            orderBy: { createdAt: 'asc' }
          })

          // 保留最早创建的，删除其他的
          const toDelete = roles.slice(1)
          if (toDelete.length > 0) {
            await prisma.role.deleteMany({
              where: {
                id: {
                  in: toDelete.map(r => r.id)
                }
              }
            })
            fixes.push(`已删除角色代码 "${dup.code}" 的 ${toDelete.length} 个重复项`)
          }
        }
      }

      // 5. 检查无效的权限层级关系
      const invalidHierarchy = await prisma.permission.findMany({
        where: {
          parentId: {
            not: null
          }
        },
        include: {
          parent: true
        }
      })

      const invalidHierarchyItems = invalidHierarchy.filter(p => !p.parent)
      if (invalidHierarchyItems.length > 0) {
        issues.push(`发现 ${invalidHierarchyItems.length} 个无效的权限层级关系`)
        
        // 修复无效的层级关系
        await prisma.permission.updateMany({
          where: {
            id: {
              in: invalidHierarchyItems.map(p => p.id)
            }
          },
          data: {
            parentId: null
          }
        })
        
        fixes.push(`已修复 ${invalidHierarchyItems.length} 个无效的权限层级关系`)
      }

      return {
        success: true,
        message: issues.length === 0 ? '数据完整性检查通过，未发现问题' : '数据完整性检查完成，已修复发现的问题',
        details: {
          issuesFound: issues.length,
          issues,
          fixesApplied: fixes.length,
          fixes
        }
      }
    } catch (error) {
      logger.error('❌ 数据完整性检查失败:', error)
      return {
        success: false,
        message: `检查失败: ${error instanceof Error ? error.message : '未知错误'}`
      }
    }
  }

  // 备份现有数据
  async backupData(): Promise<MigrationResult> {
    try {
      logger.info('💾 开始备份现有数据...')

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const backupData = {
        timestamp,
        admins: await prisma.admin.findMany(),
        roles: await prisma.role.findMany(),
        permissions: await prisma.permission.findMany(),
        adminRoles: await prisma.adminRole.findMany(),
        rolePermissions: await prisma.rolePermission.findMany()
      }

      // 将备份数据写入文件
      const fs = await import('fs/promises')
      const path = await import('path')
      
      const backupDir = path.join(process.cwd(), 'backups')
      await fs.mkdir(backupDir, { recursive: true })
      
      const backupFile = path.join(backupDir, `rbac-backup-${timestamp}.json`)
      await fs.writeFile(backupFile, JSON.stringify(backupData, null, 2))

      return {
        success: true,
        message: `数据备份成功`,
        details: {
          backupFile,
          recordCounts: {
            admins: backupData.admins.length,
            roles: backupData.roles.length,
            permissions: backupData.permissions.length,
            adminRoles: backupData.adminRoles.length,
            rolePermissions: backupData.rolePermissions.length
          }
        }
      }
    } catch (error) {
      logger.error('❌ 数据备份失败:', error)
      return {
        success: false,
        message: `备份失败: ${error instanceof Error ? error.message : '未知错误'}`
      }
    }
  }

  // 检查表是否存在
  private async checkTableExists(tableName: string): Promise<boolean> {
    try {
      await prisma.$queryRaw`SELECT 1 FROM ${tableName} LIMIT 1`
      return true
    } catch {
      return false
    }
  }

  // 运行所有迁移
  async runAllMigrations(): Promise<MigrationResult[]> {
    const results: MigrationResult[] = []

    logger.info('🚀 开始RBAC数据迁移流程...')

    // 1. 备份数据
    const backupResult = await this.backupData()
    results.push(backupResult)

    if (!backupResult.success) {
      logger.error('❌ 数据备份失败，停止迁移流程')
      return results
    }

    // 2. 数据完整性检查和修复
    const integrityResult = await this.validateAndFixDataIntegrity()
    results.push(integrityResult)

    // 3. 迁移管理员到RBAC
    const adminMigrationResult = await this.migrateAdminsToRBAC()
    results.push(adminMigrationResult)

    // 4. 迁移旧权限数据
    const permissionMigrationResult = await this.migrateLegacyPermissions()
    results.push(permissionMigrationResult)

    logger.info('✅ RBAC数据迁移流程完成')

    return results
  }
}

// 主函数
async function main() {
  const migrationService = new DataMigrationService()

  try {
    const results = await migrationService.runAllMigrations()

    console.log('\n📊 迁移结果汇总:')
    console.log('=' .repeat(50))

    results.forEach((result, index) => {
      const status = result.success ? '✅' : '❌'
      console.log(`${index + 1}. ${status} ${result.message}`)
      
      if (result.details) {
        console.log('   详情:', JSON.stringify(result.details, null, 2))
      }
      console.log('')
    })

    const allSuccessful = results.every(r => r.success)
    console.log(`🎯 总体状态: ${allSuccessful ? '成功' : '部分失败'}`)

  } catch (error) {
    logger.error('❌ 迁移流程异常:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main().catch(console.error)
}

export { DataMigrationService }
