import type { Directive, DirectiveBinding } from 'vue'
import { usePermissionStore } from '@/stores/permission'
import { useAuthStore } from '@/stores/auth'

// 权限指令绑定值类型
interface PermissionBinding {
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
  
  // 操作类型
  action?: 'show' | 'hide' | 'disable'
}

// 权限检查函数
const checkPermission = (binding: PermissionBinding): boolean => {
  const permissionStore = usePermissionStore()
  const authStore = useAuthStore()

  // 如果用户未认证，直接返回false
  if (!authStore.isAuthenticated) {
    return binding.reverse ? true : false
  }

  let result = true

  // 自定义检查函数优先级最高
  if (binding.check) {
    result = binding.check()
  }
  // 单个权限检查
  else if (binding.permission) {
    result = permissionStore.hasPermission(binding.permission)
  }
  // 多个权限检查
  else if (binding.permissions && binding.permissions.length > 0) {
    if (binding.permissionMode === 'all') {
      result = permissionStore.hasAllPermissions(binding.permissions)
    } else {
      result = permissionStore.hasAnyPermission(binding.permissions)
    }
  }
  // 单个角色检查
  else if (binding.role) {
    result = permissionStore.hasRole(binding.role)
  }
  // 多个角色检查
  else if (binding.roles && binding.roles.length > 0) {
    result = permissionStore.hasAnyRole(binding.roles)
  }
  // 菜单权限检查
  else if (binding.menu) {
    result = permissionStore.hasMenuPermission(binding.menu)
  }

  // 反向检查
  return binding.reverse ? !result : result
}

// 应用权限控制
const applyPermissionControl = (el: HTMLElement, binding: PermissionBinding) => {
  const hasPermission = checkPermission(binding)
  const action = binding.action || 'show'

  switch (action) {
    case 'hide':
      // 隐藏元素（保留空间）
      el.style.visibility = hasPermission ? 'visible' : 'hidden'
      break
    case 'disable':
      // 禁用元素
      if (hasPermission) {
        el.removeAttribute('disabled')
        el.style.pointerEvents = 'auto'
        el.style.opacity = '1'
      } else {
        el.setAttribute('disabled', 'true')
        el.style.pointerEvents = 'none'
        el.style.opacity = '0.5'
      }
      break
    case 'show':
    default:
      // 显示/隐藏元素（不保留空间）
      el.style.display = hasPermission ? '' : 'none'
      break
  }
}

// 解析指令绑定值
const parseBinding = (binding: DirectiveBinding): PermissionBinding => {
  const value = binding.value

  // 如果是字符串，作为单个权限处理
  if (typeof value === 'string') {
    return { permission: value }
  }

  // 如果是数组，作为多个权限处理
  if (Array.isArray(value)) {
    return { permissions: value }
  }

  // 如果是对象，直接使用
  if (typeof value === 'object' && value !== null) {
    return value as PermissionBinding
  }

  // 默认返回空对象
  return {}
}

// v-permission 指令
export const vPermission: Directive = {
  mounted(el: HTMLElement, binding: DirectiveBinding) {
    const permissionBinding = parseBinding(binding)
    applyPermissionControl(el, permissionBinding)
  },
  
  updated(el: HTMLElement, binding: DirectiveBinding) {
    const permissionBinding = parseBinding(binding)
    applyPermissionControl(el, permissionBinding)
  }
}

// v-role 指令（角色检查的简化版本）
export const vRole: Directive = {
  mounted(el: HTMLElement, binding: DirectiveBinding) {
    const value = binding.value
    const permissionBinding: PermissionBinding = {
      role: typeof value === 'string' ? value : undefined,
      roles: Array.isArray(value) ? value : undefined
    }
    applyPermissionControl(el, permissionBinding)
  },
  
  updated(el: HTMLElement, binding: DirectiveBinding) {
    const value = binding.value
    const permissionBinding: PermissionBinding = {
      role: typeof value === 'string' ? value : undefined,
      roles: Array.isArray(value) ? value : undefined
    }
    applyPermissionControl(el, permissionBinding)
  }
}

// v-auth 指令（认证检查）
export const vAuth: Directive = {
  mounted(el: HTMLElement, binding: DirectiveBinding) {
    const authStore = useAuthStore()
    const reverse = binding.modifiers.reverse || false
    const hasAuth = authStore.isAuthenticated
    const shouldShow = reverse ? !hasAuth : hasAuth
    
    el.style.display = shouldShow ? '' : 'none'
  },
  
  updated(el: HTMLElement, binding: DirectiveBinding) {
    const authStore = useAuthStore()
    const reverse = binding.modifiers.reverse || false
    const hasAuth = authStore.isAuthenticated
    const shouldShow = reverse ? !hasAuth : hasAuth
    
    el.style.display = shouldShow ? '' : 'none'
  }
}

// 导出所有指令
export default {
  permission: vPermission,
  role: vRole,
  auth: vAuth
}
