import { Router } from 'express'
import { memberAuth } from '../middleware/auth'
import { memberLoginController, getMemberProfileController } from '../controllers/authController'

const router = Router()

// 会员登录（无需认证）
router.post('/login', memberLoginController)

// 获取会员个人信息（需要认证）
router.get('/profile', memberAuth, getMemberProfileController)

// 其他会员路由将在后续添加

export default router
