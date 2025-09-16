import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { useAuthStore } from './auth'
import { getUserPermissions, getUserMenuPermissions } from '@/utils/api'

// 权限接口定义
interface Permission {
  id: string
  key: string
  name: string
  type: 'MENU' | 'PAGE' | 'API' | 'ACTION'
  parentId?: string
  enabled: boolean
  children?: Permission[]
}

interface Role {
  id: string
  name: string
  code: string
  description?: string
  status: 'ACTIVE' | 'INACTIVE'
}

interface UserPermissions {
  roles: Role[]
  permissions: Permission[]
  permissionKeys: string[]
  menuPermissions: Permission[]
}

export const usePermissionStore = defineStore('permission', () => {
  // 状态
  const userPermissions = ref<UserPermissions | null>(null)
  const isLoading = ref(false)
  const isInitialized = ref(false)

  // 计算属性
  const permissionKeys = computed(() => userPermissions.value?.permissionKeys || [])
  const roles = computed(() => userPermissions.value?.roles || [])
  const menuPermissions = computed(() => userPermissions.value?.menuPermissions || [])

  // 获取用户权限信息
  const fetchUserPermissions = async (): Promise<boolean> => {
    const authStore = useAuthStore()
    
    if (!authStore.isAuthenticated || !authStore.user?.id) {
      return false
    }

    // 超级管理员直接返回，不需要加载权限
    if (authStore.isSuperAdmin) {
      userPermissions.value = {
        roles: [{ id: 'super', name: '超级管理员', code: 'SUPER_ADMIN', status: 'ACTIVE' }],
        permissions: [],
        permissionKeys: ['*'], // 超级管理员拥有所有权限
        menuPermissions: []
      }
      isInitialized.value = true
      return true
    }

    try {
      isLoading.value = true
      
      // 并行获取用户权限和菜单权限，强制刷新避免缓存
      const [permissionsResponse, menuResponse] = await Promise.all([
        getUserPermissions(authStore.user.id, true),
        getUserMenuPermissions(authStore.user.id, true)
      ])

      if (permissionsResponse.success) {
        const permissionData = permissionsResponse.data
        
        userPermissions.value = {
          roles: permissionData.roles || [],
          permissions: permissionData.permissions || [],
          permissionKeys: permissionData.permissionKeys || [],
          menuPermissions: menuResponse.success ? menuResponse.data : []
        }
        
        isInitialized.value = true
        return true
      } else {
        console.error('Failed to fetch user permissions:', permissionsResponse.message)
        return false
      }
    } catch (error) {
      console.error('Error fetching user permissions:', error)
      return false
    } finally {
      isLoading.value = false
    }
  }

  // 检查单个权限
  const hasPermission = (permission: string): boolean => {
    const authStore = useAuthStore()
    
    if (!authStore.isAuthenticated) return false
    
    // 超级管理员拥有所有权限
    if (authStore.isSuperAdmin) return true
    
    if (!userPermissions.value) return false
    
    // 无角色用户不应该有任何权限
    if (!userPermissions.value.roles || userPermissions.value.roles.length === 0) {
      return false
    }
    
    // 检查权限键
    return userPermissions.value.permissionKeys.includes(permission)
  }

  // 检查任意权限（OR逻辑）
  const hasAnyPermission = (permissions: string[]): boolean => {
    const authStore = useAuthStore()
    
    if (!authStore.isAuthenticated) return false
    
    // 超级管理员拥有所有权限
    if (authStore.isSuperAdmin) return true
    
    if (!userPermissions.value || permissions.length === 0) return false
    
    // 无角色用户不应该有任何权限
    if (!userPermissions.value.roles || userPermissions.value.roles.length === 0) {
      return false
    }
    
    // 检查是否拥有任意一个权限
    return permissions.some(permission => 
      userPermissions.value!.permissionKeys.includes(permission)
    )
  }

  // 检查所有权限（AND逻辑）
  const hasAllPermissions = (permissions: string[]): boolean => {
    const authStore = useAuthStore()
    
    if (!authStore.isAuthenticated) return false
    
    // 超级管理员拥有所有权限
    if (authStore.isSuperAdmin) return true
    
    if (!userPermissions.value || permissions.length === 0) return false
    
    // 无角色用户不应该有任何权限
    if (!userPermissions.value.roles || userPermissions.value.roles.length === 0) {
      return false
    }
    
    // 检查是否拥有所有权限
    return permissions.every(permission => 
      userPermissions.value!.permissionKeys.includes(permission)
    )
  }

  // 检查角色
  const hasRole = (roleCode: string): boolean => {
    const authStore = useAuthStore()
    
    if (!authStore.isAuthenticated) return false
    
    // 超级管理员检查
    if (authStore.isSuperAdmin && roleCode === 'SUPER_ADMIN') return true
    
    if (!userPermissions.value) return false
    
    // 检查角色编码
    return userPermissions.value.roles.some(role => role.code === roleCode)
  }

  // 检查任意角色
  const hasAnyRole = (roleCodes: string[]): boolean => {
    const authStore = useAuthStore()
    
    if (!authStore.isAuthenticated) return false
    
    // 超级管理员检查
    if (authStore.isSuperAdmin && roleCodes.includes('SUPER_ADMIN')) return true
    
    if (!userPermissions.value || roleCodes.length === 0) return false
    
    // 检查是否拥有任意一个角色
    return roleCodes.some(roleCode => 
      userPermissions.value!.roles.some(role => role.code === roleCode)
    )
  }

  // 检查菜单权限
  const hasMenuPermission = (menuKey: string): boolean => {
    const authStore = useAuthStore()
    
    if (!authStore.isAuthenticated) return false
    
    // 超级管理员拥有所有权限
    if (authStore.isSuperAdmin) return true
    
    if (!userPermissions.value) return false
    
    // 无角色用户不应该有任何菜单权限
    if (!userPermissions.value.roles || userPermissions.value.roles.length === 0) {
      return false
    }
    
    // 没有菜单权限数据时返回false
    if (!userPermissions.value.menuPermissions || userPermissions.value.menuPermissions.length === 0) {
      return false
    }
    
    // 递归检查菜单权限
    const checkMenuRecursive = (menus: Permission[], key: string): boolean => {
      for (const menu of menus) {
        if (menu.key === key && menu.enabled) return true
        if (menu.children && checkMenuRecursive(menu.children, key)) return true
      }
      return false
    }
    
    return checkMenuRecursive(userPermissions.value.menuPermissions, menuKey)
  }

  // 获取可访问的菜单
  const getAccessibleMenus = (): Permission[] => {
    const authStore = useAuthStore()
    
    if (!authStore.isAuthenticated) return []
    
    // 超级管理员返回所有菜单（这里可以根据需要返回完整菜单结构）
    if (authStore.isSuperAdmin) {
      return userPermissions.value?.menuPermissions || []
    }
    
    if (!userPermissions.value) return []
    
    // 过滤启用的菜单
    const filterEnabledMenus = (menus: Permission[]): Permission[] => {
      return menus
        .filter(menu => menu.enabled)
        .map(menu => ({
          ...menu,
          children: menu.children ? filterEnabledMenus(menu.children) : undefined
        }))
        .filter(menu => !menu.children || menu.children.length > 0)
    }
    
    return filterEnabledMenus(userPermissions.value.menuPermissions)
  }

  // 重置权限信息
  const resetPermissions = () => {
    userPermissions.value = null
    isLoading.value = false
    isInitialized.value = false
  }

  // 刷新权限信息
  const refreshPermissions = async (): Promise<boolean> => {
    resetPermissions()
    return await fetchUserPermissions()
  }

  return {
    // 状态
    userPermissions,
    isLoading,
    isInitialized,
    
    // 计算属性
    permissionKeys,
    roles,
    menuPermissions,
    
    // 方法
    fetchUserPermissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    hasAnyRole,
    hasMenuPermission,
    getAccessibleMenus,
    resetPermissions,
    refreshPermissions
  }
})
