import { Router } from 'express'
import { adminAuthWithPermissions, requirePermissions, requireRoles } from '../middleware/auth'
import { requirePermission, requireResourcePermission, requireRole } from '../middleware/authorize'

// 角色管理控制器
import {
  createRoleController,
  getRoleListController,
  getRoleByIdController,
  updateRoleController,
  deleteRoleController,
  batchUpdateRoleStatusController,
  getAvailableRolesController,
  assignPermissionsToRoleController,
  getRolePermissionsController
} from '../controllers/roleController'

// 权限管理控制器
import {
  createPermissionController,
  getPermissionListController,
  getPermissionTreeController,
  getPermissionByIdController,
  updatePermissionController,
  deletePermissionController,
  batchUpdatePermissionStatusController,
  getMenuPermissionsController,
  getPermissionByKeyController,
  getPermissionsByKeysController
} from '../controllers/permissionController'

// 用户权限管理控制器
import {
  assignRolesToUserController,
  getUserPermissionsController,
  checkUserPermissionController,
  checkUserAnyPermissionController,
  checkUserAllPermissionsController,
  getUserMenuPermissionsController,
  getUserRolesController,
  removeUserRoleController,
  addUserRoleController,
  getUsersByPermissionController,
  getUsersByRoleController,
  batchAssignRolesToUsersController
} from '../controllers/userPermissionController'

const router = Router()

// ==================== 角色管理路由 ====================

// 角色CRUD操作
router.post('/roles', 
  adminAuthWithPermissions, 
  requirePermissions(['role.create']), 
  createRoleController
)

router.get('/roles', 
  adminAuthWithPermissions, 
  requirePermissions(['role.list']), 
  getRoleListController
)

router.get('/roles/available', 
  adminAuthWithPermissions, 
  requirePermissions(['role.list']), 
  getAvailableRolesController
)

router.get('/roles/:id', 
  adminAuthWithPermissions, 
  requirePermissions(['role.list']), 
  getRoleByIdController
)

router.put('/roles/:id', 
  adminAuthWithPermissions, 
  requirePermissions(['role.update']), 
  updateRoleController
)

router.delete('/roles/:id', 
  adminAuthWithPermissions, 
  requirePermissions(['role.delete']), 
  deleteRoleController
)

router.patch('/roles/batch-status', 
  adminAuthWithPermissions, 
  requirePermissions(['role.update']), 
  batchUpdateRoleStatusController
)

// 角色权限管理
router.post('/roles/:id/permissions', 
  adminAuthWithPermissions, 
  requirePermissions(['role.update', 'permission.assign'], 'all'), 
  assignPermissionsToRoleController
)

router.get('/roles/:id/permissions', 
  adminAuthWithPermissions, 
  requirePermissions(['role.list']), 
  getRolePermissionsController
)

// ==================== 权限管理路由 ====================

// 权限CRUD操作
router.post('/permissions', 
  adminAuthWithPermissions, 
  requirePermissions(['permission.create']), 
  createPermissionController
)

router.get('/permissions', 
  adminAuthWithPermissions, 
  requirePermissions(['permission.list']), 
  getPermissionListController
)

router.get('/permissions/tree', 
  adminAuthWithPermissions, 
  requirePermissions(['permission.list']), 
  getPermissionTreeController
)

router.get('/permissions/menu', 
  adminAuthWithPermissions, 
  requirePermissions(['permission.list']), 
  getMenuPermissionsController
)

router.get('/permissions/:id', 
  adminAuthWithPermissions, 
  requirePermissions(['permission.list']), 
  getPermissionByIdController
)

router.put('/permissions/:id', 
  adminAuthWithPermissions, 
  requirePermissions(['permission.update']), 
  updatePermissionController
)

router.delete('/permissions/:id', 
  adminAuthWithPermissions, 
  requirePermissions(['permission.delete']), 
  deletePermissionController
)

router.patch('/permissions/batch-status', 
  adminAuthWithPermissions, 
  requirePermissions(['permission.update']), 
  batchUpdatePermissionStatusController
)

// 权限查询
router.get('/permissions/key/:key', 
  adminAuthWithPermissions, 
  requirePermissions(['permission.list']), 
  getPermissionByKeyController
)

router.post('/permissions/keys', 
  adminAuthWithPermissions, 
  requirePermissions(['permission.list']), 
  getPermissionsByKeysController
)

// ==================== 用户权限管理路由 ====================

// 用户角色分配
router.post('/users/:id/roles', 
  adminAuthWithPermissions, 
  requirePermissions(['user.assign_role']), 
  assignRolesToUserController
)

router.get('/users/:id/roles', 
  adminAuthWithPermissions, 
  requirePermissions(['user.list']), 
  getUserRolesController
)

router.post('/users/:id/add-role', 
  adminAuthWithPermissions, 
  requirePermissions(['user.assign_role']), 
  addUserRoleController
)

router.delete('/users/:id/roles/:roleId', 
  adminAuthWithPermissions, 
  requirePermissions(['user.assign_role']), 
  removeUserRoleController
)

// 用户权限查询
router.get('/users/:id/permissions', 
  adminAuthWithPermissions, 
  requirePermissions(['user.list']), 
  getUserPermissionsController
)

router.get('/users/:id/menu-permissions', 
  adminAuthWithPermissions, 
  requirePermissions(['user.list']), 
  getUserMenuPermissionsController
)

// 权限检查
router.post('/users/:id/check-permission', 
  adminAuthWithPermissions, 
  requirePermissions(['user.list']), 
  checkUserPermissionController
)

router.post('/users/:id/check-any-permission', 
  adminAuthWithPermissions, 
  requirePermissions(['user.list']), 
  checkUserAnyPermissionController
)

router.post('/users/:id/check-all-permissions', 
  adminAuthWithPermissions, 
  requirePermissions(['user.list']), 
  checkUserAllPermissionsController
)

// 批量操作
router.post('/users/batch-assign-roles', 
  adminAuthWithPermissions, 
  requirePermissions(['user.assign_role']), 
  batchAssignRolesToUsersController
)

// 反向查询
router.get('/permissions/:permissionKey/users', 
  adminAuthWithPermissions, 
  requirePermissions(['user.list']), 
  getUsersByPermissionController
)

router.get('/roles/:roleCode/users', 
  adminAuthWithPermissions, 
  requirePermissions(['user.list']), 
  getUsersByRoleController
)

// ==================== 使用不同中间件的示例路由 ====================

// 使用资源权限中间件的示例
router.get('/example/resource-permission', 
  adminAuthWithPermissions,
  requireResourcePermission('example', 'read'),
  (req, res) => {
    res.json({ message: 'Resource permission check passed' })
  }
)

// 使用角色检查中间件的示例
router.get('/example/role-check', 
  adminAuthWithPermissions,
  requireRole(['admin', 'user_manager']),
  (req, res) => {
    res.json({ message: 'Role check passed' })
  }
)

// 使用复杂权限逻辑的示例
router.get('/example/complex-permission', 
  adminAuthWithPermissions,
  requirePermission({
    permissions: ['user.create', 'user.update'],
    mode: 'any'
  }),
  (req, res) => {
    res.json({ message: 'Complex permission check passed' })
  }
)

export default router
