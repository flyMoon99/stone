import { Router } from 'express'
import { adminAuth, superAdminAuth } from '../middleware/auth'
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
router.post('/members', adminAuth, createMemberController)
router.get('/members', adminAuth, getMemberListController)
router.get('/members/search', adminAuth, searchMembersController)
router.get('/members/:id', adminAuth, getMemberByIdController)
router.put('/members/:id', adminAuth, updateMemberController)

router.patch('/members/batch-status', adminAuth, batchUpdateMemberStatusController)

export default router
