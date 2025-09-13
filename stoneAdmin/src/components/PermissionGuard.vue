<template>
  <div v-if="hasAccess">
    <slot />
  </div>
  <div v-else-if="showFallback">
    <slot name="fallback">
      <n-empty 
        v-if="fallbackType === 'empty'"
        :description="fallbackMessage || '暂无权限访问'"
        size="small"
      />
      <n-alert 
        v-else-if="fallbackType === 'alert'"
        type="warning" 
        :title="fallbackMessage || '权限不足'"
        show-icon
      />
      <div 
        v-else-if="fallbackType === 'text'"
        class="permission-fallback-text"
      >
        {{ fallbackMessage || '暂无权限' }}
      </div>
    </slot>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { NEmpty, NAlert } from 'naive-ui'
import { usePermissionStore } from '@/stores/permission'
import { useAuthStore } from '@/stores/auth'

interface Props {
  // 权限检查
  permission?: string
  permissions?: string[]
  permissionMode?: 'any' | 'all'
  
  // 角色检查
  role?: string
  roles?: string[]
  
  // 菜单权限检查
  menu?: string
  
  // 自定义检查函数
  check?: () => boolean
  
  // 反向检查（没有权限时显示）
  reverse?: boolean
  
  // 回退显示
  showFallback?: boolean
  fallbackType?: 'empty' | 'alert' | 'text'
  fallbackMessage?: string
  
  // 自动初始化权限
  autoInit?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  permissionMode: 'any',
  reverse: false,
  showFallback: false,
  fallbackType: 'empty',
  autoInit: true
})

const permissionStore = usePermissionStore()
const authStore = useAuthStore()

// 权限检查逻辑
const hasAccess = computed(() => {
  // 如果用户未认证，直接返回false
  if (!authStore.isAuthenticated) {
    return props.reverse ? true : false
  }

  let result = true

  // 自定义检查函数优先级最高
  if (props.check) {
    result = props.check()
  }
  // 单个权限检查
  else if (props.permission) {
    result = permissionStore.hasPermission(props.permission)
  }
  // 多个权限检查
  else if (props.permissions && props.permissions.length > 0) {
    if (props.permissionMode === 'all') {
      result = permissionStore.hasAllPermissions(props.permissions)
    } else {
      result = permissionStore.hasAnyPermission(props.permissions)
    }
  }
  // 单个角色检查
  else if (props.role) {
    result = permissionStore.hasRole(props.role)
  }
  // 多个角色检查
  else if (props.roles && props.roles.length > 0) {
    result = permissionStore.hasAnyRole(props.roles)
  }
  // 菜单权限检查
  else if (props.menu) {
    result = permissionStore.hasMenuPermission(props.menu)
  }

  // 反向检查
  return props.reverse ? !result : result
})

// 自动初始化权限
onMounted(async () => {
  if (props.autoInit && !permissionStore.isInitialized && authStore.isAuthenticated) {
    await permissionStore.fetchUserPermissions()
  }
})
</script>

<style scoped>
.permission-fallback-text {
  color: #999;
  font-size: 14px;
  text-align: center;
  padding: 16px;
}
</style>
