import { Router } from 'express'
import { adminAuth, superAdminAuth, adminAuthWithPermissions, requirePermissions } from '../middleware/auth'
import { adminLoginController, getAdminProfileController } from '../controllers/authController'
import {
  createAdminController,
  getAdminListController,
  getAdminByIdController,
  updateAdminController,
  batchUpdateAdminStatusController
} from '../controllers/adminController'
import {
  createMemberController,
  getMemberListController,
  getMemberByIdController,
  updateMemberController,
  batchUpdateMemberStatusController,
  searchMembersController
} from '../controllers/memberController'

const router = Router()

// 认证相关路由
router.post('/login', adminLoginController)
router.get('/profile', adminAuth, getAdminProfileController)

// 管理员管理路由（需要超级管理员权限）
router.post('/admins', superAdminAuth, createAdminController)
router.get('/admins', adminAuth, getAdminListController)
router.get('/admins/:id', adminAuth, getAdminByIdController)
router.put('/admins/:id', superAdminAuth, updateAdminController)

router.patch('/admins/batch-status', superAdminAuth, batchUpdateAdminStatusController)

// 会员管理路由（需要管理员权限）
router.post('/members', adminAuthWithPermissions, requirePermissions(['member.create']), createMemberController)
router.get('/members', adminAuthWithPermissions, requirePermissions(['member.list']), getMemberListController)
router.get('/members/search', adminAuthWithPermissions, requirePermissions(['member.list']), searchMembersController)
router.get('/members/:id', adminAuthWithPermissions, requirePermissions(['member.list']), getMemberByIdController)
router.put('/members/:id', adminAuthWithPermissions, requirePermissions(['member.update']), updateMemberController)

router.patch('/members/batch-status', adminAuthWithPermissions, requirePermissions(['member.update']), batchUpdateMemberStatusController)

export default router
