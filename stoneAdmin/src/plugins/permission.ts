import type { App } from 'vue'
import { usePermissionChecker } from '@/utils/permission'
import permissionDirectives from '@/directives/permission'
import PermissionGuard from '@/components/PermissionGuard.vue'

// 权限插件
export default {
  install(app: App) {
    // 注册权限指令
    app.directive('permission', permissionDirectives.permission)
    app.directive('role', permissionDirectives.role)
    app.directive('auth', permissionDirectives.auth)
    
    // 注册权限组件
    app.component('PermissionGuard', PermissionGuard)
    
    // 全局属性：权限检查器
    app.config.globalProperties.$permission = usePermissionChecker()
    
    // 提供权限检查器（用于组合式API）
    app.provide('permissionChecker', usePermissionChecker())
  }
}
