<template>
  <div class="permission-example">
    <n-card title="权限控制组件和指令使用示例">
      <n-space vertical :size="24">
        
        <!-- 权限组件示例 -->
        <n-card title="PermissionGuard 组件示例" size="small">
          <n-space vertical>
            <!-- 基础权限检查 -->
            <div>
              <h4>基础权限检查：</h4>
              <PermissionGuard permission="user.create">
                <n-button type="primary">创建用户（需要 user.create 权限）</n-button>
              </PermissionGuard>
            </div>

            <!-- 多权限检查（任意） -->
            <div>
              <h4>多权限检查（任意）：</h4>
              <PermissionGuard 
                :permissions="['user.create', 'user.update']" 
                permission-mode="any"
              >
                <n-button type="info">编辑用户（需要 user.create 或 user.update 权限）</n-button>
              </PermissionGuard>
            </div>

            <!-- 多权限检查（全部） -->
            <div>
              <h4>多权限检查（全部）：</h4>
              <PermissionGuard 
                :permissions="['user.create', 'user.update']" 
                permission-mode="all"
              >
                <n-button type="warning">高级操作（需要 user.create 和 user.update 权限）</n-button>
              </PermissionGuard>
            </div>

            <!-- 角色检查 -->
            <div>
              <h4>角色检查：</h4>
              <PermissionGuard role="admin">
                <n-button type="error">管理员操作（需要 admin 角色）</n-button>
              </PermissionGuard>
            </div>

            <!-- 反向检查 -->
            <div>
              <h4>反向检查：</h4>
              <PermissionGuard permission="user.create" reverse>
                <n-alert type="warning" title="权限不足" show-icon>
                  您没有创建用户的权限
                </n-alert>
              </PermissionGuard>
            </div>

            <!-- 带回退内容 -->
            <div>
              <h4>带回退内容：</h4>
              <PermissionGuard 
                permission="nonexistent.permission" 
                show-fallback 
                fallback-type="alert"
                fallback-message="您没有访问此功能的权限"
              >
                <n-button type="success">受保护的功能</n-button>
              </PermissionGuard>
            </div>
          </n-space>
        </n-card>

        <!-- 权限指令示例 -->
        <n-card title="权限指令示例" size="small">
          <n-space vertical>
            <!-- v-permission 指令 -->
            <div>
              <h4>v-permission 指令：</h4>
              <n-space>
                <n-button v-permission="'user.create'" type="primary">
                  创建用户
                </n-button>
                <n-button v-permission="['user.update', 'user.delete']" type="warning">
                  编辑/删除用户
                </n-button>
                <n-button 
                  v-permission="{ permissions: ['user.create', 'user.update'], permissionMode: 'all' }" 
                  type="info"
                >
                  需要多个权限
                </n-button>
              </n-space>
            </div>

            <!-- v-role 指令 -->
            <div>
              <h4>v-role 指令：</h4>
              <n-space>
                <n-button v-role="'admin'" type="primary">
                  管理员功能
                </n-button>
                <n-button v-role="['admin', 'user_manager']" type="info">
                  管理员或用户管理员功能
                </n-button>
              </n-space>
            </div>

            <!-- v-auth 指令 -->
            <div>
              <h4>v-auth 指令：</h4>
              <n-space>
                <n-button v-auth type="success">
                  已登录用户可见
                </n-button>
                <n-button v-auth.reverse type="error">
                  未登录用户可见
                </n-button>
              </n-space>
            </div>

            <!-- 指令修饰符示例 -->
            <div>
              <h4>指令操作类型：</h4>
              <n-space>
                <n-button 
                  v-permission="{ permission: 'user.create', action: 'show' }" 
                  type="primary"
                >
                  显示/隐藏（默认）
                </n-button>
                <n-button 
                  v-permission="{ permission: 'nonexistent.permission', action: 'disable' }" 
                  type="warning"
                >
                  禁用按钮
                </n-button>
                <n-button 
                  v-permission="{ permission: 'nonexistent.permission', action: 'hide' }" 
                  type="info"
                >
                  隐藏（保留空间）
                </n-button>
              </n-space>
            </div>
          </n-space>
        </n-card>

        <!-- 组合式API示例 -->
        <n-card title="组合式API示例" size="small">
          <n-space vertical>
            <div>
              <h4>权限检查结果：</h4>
              <n-space vertical>
                <div>用户创建权限: {{ hasUserCreatePermission ? '✅' : '❌' }}</div>
                <div>管理员角色: {{ hasAdminRole ? '✅' : '❌' }}</div>
                <div>超级管理员: {{ isSuperAdmin ? '✅' : '❌' }}</div>
                <div>已认证: {{ isAuthenticated ? '✅' : '❌' }}</div>
              </n-space>
            </div>

            <div>
              <h4>动态权限检查：</h4>
              <n-space>
                <n-button @click="checkCustomPermission" type="primary">
                  检查自定义权限
                </n-button>
                <n-button @click="refreshPermissions" type="info">
                  刷新权限
                </n-button>
              </n-space>
            </div>
          </n-space>
        </n-card>

        <!-- 实际应用示例 -->
        <n-card title="实际应用示例" size="small">
          <n-space vertical>
            <!-- 表格操作按钮 -->
            <div>
              <h4>表格操作按钮：</h4>
              <n-space>
                <PermissionGuard permission="user.create">
                  <n-button type="primary" size="small">
                    <n-icon><PersonAddOutline /></n-icon>
                    添加用户
                  </n-button>
                </PermissionGuard>
                
                <PermissionGuard :permissions="['user.update', 'user.delete']">
                  <n-button type="warning" size="small">
                    <n-icon><CreateOutline /></n-icon>
                    批量操作
                  </n-button>
                </PermissionGuard>
              </n-space>
            </div>

            <!-- 菜单项 -->
            <div>
              <h4>菜单项控制：</h4>
              <n-menu mode="horizontal">
                <n-menu-item key="dashboard">
                  首页
                </n-menu-item>
                <n-menu-item key="users" v-permission="'user.list'">
                  用户管理
                </n-menu-item>
                <n-menu-item key="roles" v-role="'admin'">
                  角色管理
                </n-menu-item>
                <n-menu-item key="system" v-role="'SUPER_ADMIN'">
                  系统设置
                </n-menu-item>
              </n-menu>
            </div>

            <!-- 表单字段 -->
            <div>
              <h4>表单字段控制：</h4>
              <n-form>
                <n-form-item label="用户名">
                  <n-input placeholder="用户名" />
                </n-form-item>
                <n-form-item label="角色" v-permission="'user.assign_role'">
                  <n-select placeholder="选择角色" />
                </n-form-item>
                <n-form-item label="状态" v-role="'admin'">
                  <n-switch />
                </n-form-item>
              </n-form>
            </div>
          </n-space>
        </n-card>
      </n-space>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { PersonAddOutline, CreateOutline } from '@vicons/ionicons5'
import { useMessage } from 'naive-ui'
import { usePermissionChecker } from '@/utils/permission'
import { usePermissionStore } from '@/stores/permission'

const message = useMessage()
const permissionChecker = usePermissionChecker()
const permissionStore = usePermissionStore()

// 权限检查示例
const hasUserCreatePermission = computed(() => permissionChecker.hasPermission('user.create'))
const hasAdminRole = computed(() => permissionChecker.hasRole('admin'))
const isSuperAdmin = computed(() => permissionChecker.isSuperAdmin())
const isAuthenticated = computed(() => permissionChecker.isAuthenticated())

// 自定义权限检查
const checkCustomPermission = () => {
  const result = permissionChecker.check({
    permissions: ['user.create', 'user.update'],
    permissionMode: 'all'
  })
  
  message.info(`自定义权限检查结果: ${result ? '通过' : '失败'}`)
}

// 刷新权限
const refreshPermissions = async () => {
  try {
    await permissionStore.refreshPermissions()
    message.success('权限刷新成功')
  } catch (error) {
    message.error('权限刷新失败')
  }
}
</script>

<style scoped>
.permission-example {
  padding: 16px;
}

.permission-example h4 {
  margin: 8px 0;
  color: #333;
  font-size: 14px;
}
</style>
