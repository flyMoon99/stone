<template>
  <div class="admin-sidebar-content">
    <n-menu
      :value="activeKey"
      v-model:expanded-keys="expandedKeys"
      :collapsed="collapsed"
      :collapsed-width="64"
      :collapsed-icon-size="16"
      :root-indent="0"
      :indent="20"
      :options="menuOptions"
      :render-label="renderMenuLabel"
      @update:value="handleMenuSelect"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, h, watch, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { NIcon } from 'naive-ui'
import {
  GridOutline,
  PeopleOutline,
  PersonOutline,
  ShieldCheckmarkOutline,
  KeyOutline,
  LockClosedOutline,
  PersonAddOutline
} from '@vicons/ionicons5'
import { useAuthStore } from '@/stores/auth'
import { useTabsStore } from '@/stores/tabs'
import { usePermissionStore } from '@/stores/permission'

interface Props {
  collapsed: boolean
}

const props = defineProps<Props>()

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const tabsStore = useTabsStore()
const permissionStore = usePermissionStore()

// 当前激活的菜单项
const activeKey = computed(() => {
  return route.path
})

// 展开中的父级菜单 keys
let expandedKeys = ref<string[]>([])

// 根据当前路径计算需要展开的父级菜单
const resolveExpandedKeys = (path: string): string[] => {
  if (path.startsWith('/admin/admins') || path.startsWith('/admin/members') || path.startsWith('/admin/roles') || path.startsWith('/admin/permissions') || path.startsWith('/admin/user-permissions')) {
    return ['user-management']
  }
  return []
}

// 渲染菜单标签
const renderMenuLabel = (option: any) => {
  return option.label
}

// 菜单选项
const menuOptions = computed(() => {
  const baseOptions = [
    {
      label: '首页',
      key: '/dashboard',
      icon: () => h(NIcon, { size: 16 }, { default: () => h(GridOutline) })
    }
  ]

  // 动态生成用户管理菜单
  const userManagementChildren = []
  
  // 管理员管理 - 检查管理员管理权限
  if (authStore.isSuperAdmin || permissionStore.hasMenuPermission('admin')) {
    userManagementChildren.push({
      label: '管理员管理',
      key: '/admin/admins',
      icon: () => h(NIcon, { size: 16 }, { default: () => h(ShieldCheckmarkOutline) })
    })
  }
  
  // 会员管理 - 检查会员管理权限
  if (authStore.isSuperAdmin || permissionStore.hasMenuPermission('member')) {
    userManagementChildren.push({
      label: '会员管理',
      key: '/admin/members',
      icon: () => h(NIcon, { size: 16 }, { default: () => h(PersonOutline) })
    })
  }
  
  // 角色管理 - 检查角色管理权限
  if (authStore.isSuperAdmin || permissionStore.hasMenuPermission('role')) {
    userManagementChildren.push({
      label: '角色管理',
      key: '/admin/roles',
      icon: () => h(NIcon, { size: 16 }, { default: () => h(KeyOutline) })
    })
  }
  
  // 权限管理 - 检查权限管理权限
  if (authStore.isSuperAdmin || permissionStore.hasMenuPermission('permission')) {
    userManagementChildren.push({
      label: '权限管理',
      key: '/admin/permissions',
      icon: () => h(NIcon, { size: 16 }, { default: () => h(LockClosedOutline) })
    })
  }
  
  // 用户权限分配 - 检查用户权限分配权限
  if (authStore.isSuperAdmin || permissionStore.hasMenuPermission('user-permission')) {
    userManagementChildren.push({
      label: '用户权限分配',
      key: '/admin/user-permissions',
      icon: () => h(NIcon, { size: 16 }, { default: () => h(PersonAddOutline) })
    })
  }

  // 如果有用户管理相关的子菜单，则添加用户管理菜单组
  if (userManagementChildren.length > 0) {
    baseOptions.push({
      label: '用户管理',
      key: 'user-management',
      icon: () => h(NIcon, { size: 16 }, { default: () => h(PeopleOutline) }),
      children: userManagementChildren
    })
  }

  return baseOptions
})

// 处理菜单选择
const handleMenuSelect = (key: string) => {
  // 跳过分组菜单项
  if (key.includes('-') && !key.startsWith('/')) {
    return
  }

  // 添加到标签页并跳转
  const targetRoute = router.resolve(key)
  if (targetRoute) {
    tabsStore.addTab(targetRoute)
    router.push(key)
  }
}

// 路由变化时自动展开对应父级菜单
const syncExpandedByRoute = () => {
  expandedKeys.value = resolveExpandedKeys(route.path)
}

watch(() => route.path, () => {
  syncExpandedByRoute()
})

onMounted(() => {
  syncExpandedByRoute()
})
</script>

<style scoped>
.admin-sidebar-content {
  height: 100%;
  padding: 16px 0;
}

:deep(.n-submenu-children) {
  padding-left: 0 !important;
}

/* 统一外观留边与圆角 */
:deep(.n-menu-item) {
  margin: 4px 8px;
  border-radius: 6px;
}

:deep(.n-submenu) {
  margin: 4px 8px;
  border-radius: 6px;
}

:deep(.n-submenu > .n-submenu-children) {
  margin-left: 0 !important;
}

/* 移除顶级子菜单容器自身的左侧内边距，避免整行被右移 */
:deep(.n-menu > .n-submenu) {
  padding-left: 0 !important;
}

/* 统一所有菜单项内容的左侧缩进（顶级项） */
/* 重置所有菜单项缩进，确保顶级项完全对齐 */
:deep(.n-menu-item-content) {
  padding-left: 20px !important;
}

/* 明确覆盖：顶级子菜单标题与顶级无子菜单项保持同样左缩进 */
:deep(.n-menu > .n-submenu > .n-menu-item-content),
:deep(.n-menu > .n-menu-item > .n-menu-item-content) {
  /* 同步覆盖变量与实际padding，防止内部样式回退 */
  --n-item-padding-left: 20px !important;
  padding-left: 20px !important;
}

/* 确保顶级子菜单图标区没有额外左外边距 */
:deep(.n-menu > .n-submenu > .n-menu-item-content .n-menu-item-content__icon),
:deep(.n-menu > .n-menu-item > .n-menu-item-content .n-menu-item-content__icon) {
  margin-left: 0 !important;
}

/* 统一图标与文字间距（与上方图标容器宽度设置配合） */
:deep(.n-menu-item-content-header) {
  column-gap: 8px !important;
}

/* 二级菜单项额外缩进 */
:deep(.n-submenu-children .n-menu-item-content) {
  padding-left: 40px !important;
}

/* 顶级项图标容器固定宽度，保证文字起点一致（兼容折叠） */
:deep(.n-menu > .n-menu-item > .n-menu-item-content .n-menu-item-content__icon),
:deep(.n-menu > .n-submenu > .n-menu-item-content .n-menu-item-content__icon) {
  width: 18px !important;
  min-width: 18px !important;
  margin-right: 8px !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
}

/* 统一顶级项图标容器宽度，保证文本起始位置一致 */
:deep(.n-menu > .n-menu-item > .n-menu-item-content .n-menu-item-content__icon),
:deep(.n-menu > .n-submenu > .n-menu-item-content .n-menu-item-content__icon) {
  width: 18px !important;
  min-width: 18px !important;
  margin-right: 8px !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
}

:deep(.n-menu-item:hover) {
  background: #f0f2f5;
}

:deep(.n-menu-item--selected) {
  background: #e6f7ff;
  color: #1890ff;
}

:deep(.n-menu-item--selected::before) {
  background: #1890ff;
}
</style>
