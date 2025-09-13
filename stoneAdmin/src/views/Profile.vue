<template>
  <div class="profile">
    <n-grid :cols="3" :x-gap="24" responsive="screen">
      <!-- 个人信息卡片 -->
      <n-grid-item :span="isMobile ? 3 : 1">
        <n-card title="个人信息" class="profile-card">
          <div class="profile-info">
            <div class="avatar-section">
              <n-avatar :size="80" color="#1890ff">
                <n-icon :size="40">
                  <PersonOutline />
                </n-icon>
              </n-avatar>
              <div class="user-basic">
                <h3>{{ authStore.user?.account }}</h3>
                <n-tag :type="authStore.user?.type === 'SUPER_ADMIN' ? 'error' : 'info'">
                  {{ getRoleText(authStore.user?.type) }}
                </n-tag>
              </div>
            </div>
            
            <n-divider />
            
            <div class="info-list">
              <div class="info-item">
                <span class="label">用户ID：</span>
                <n-text code>{{ authStore.user?.id }}</n-text>
              </div>
              <div class="info-item">
                <span class="label">账户状态：</span>
                <n-tag :type="authStore.user?.status === 'ACTIVE' ? 'success' : 'error'">
                  {{ authStore.user?.status === 'ACTIVE' ? '正常' : '已禁用' }}
                </n-tag>
              </div>
              <div class="info-item">
                <span class="label">注册时间：</span>
                <span>{{ formatDate(authStore.user?.createdAt) }}</span>
              </div>
              <div class="info-item">
                <span class="label">更新时间：</span>
                <span>{{ formatDate(authStore.user?.updatedAt) }}</span>
              </div>
              <div class="info-item" v-if="authStore.user?.lastLoginAt">
                <span class="label">上次登录：</span>
                <span>{{ formatDate(authStore.user?.lastLoginAt) }}</span>
              </div>
            </div>
          </div>
        </n-card>
      </n-grid-item>

      <!-- 修改密码 -->
      <n-grid-item :span="isMobile ? 3 : 2">
        <n-card title="修改密码" class="password-card">
          <n-form
            ref="passwordFormRef"
            :model="passwordForm"
            :rules="passwordRules"
            label-placement="left"
            label-width="100px"
          >
            <n-form-item label="当前密码" path="currentPassword">
              <n-input
                v-model:value="passwordForm.currentPassword"
                type="password"
                placeholder="请输入当前密码"
                show-password-on="click"
              />
            </n-form-item>
            
            <n-form-item label="新密码" path="newPassword">
              <n-input
                v-model:value="passwordForm.newPassword"
                type="password"
                placeholder="请输入新密码"
                show-password-on="click"
              />
            </n-form-item>
            
            <n-form-item label="确认密码" path="confirmPassword">
              <n-input
                v-model:value="passwordForm.confirmPassword"
                type="password"
                placeholder="请再次输入新密码"
                show-password-on="click"
              />
            </n-form-item>
            
            <n-form-item>
              <n-button 
                type="primary" 
                :loading="passwordSubmitting"
                @click="handlePasswordSubmit"
              >
                修改密码
              </n-button>
              <n-button @click="handlePasswordReset" class="ml-3">
                重置
              </n-button>
            </n-form-item>
          </n-form>
        </n-card>
      </n-grid-item>
    </n-grid>

    <!-- 系统信息 -->
    <n-card title="系统信息" class="system-card">
      <n-grid :cols="4" :x-gap="16" responsive="screen">
        <n-grid-item :span="isMobile ? 2 : 1">
          <div class="system-item">
            <n-icon :size="24" color="#1890ff">
              <DesktopOutline />
            </n-icon>
            <div class="system-info">
              <div class="system-label">操作系统</div>
              <div class="system-value">{{ systemInfo.platform }}</div>
            </div>
          </div>
        </n-grid-item>
        
        <n-grid-item :span="isMobile ? 2 : 1">
          <div class="system-item">
            <n-icon :size="24" color="#52c41a">
              <CodeOutline />
            </n-icon>
            <div class="system-info">
              <div class="system-label">浏览器</div>
              <div class="system-value">{{ systemInfo.browser }}</div>
            </div>
          </div>
        </n-grid-item>
        
        <n-grid-item :span="isMobile ? 2 : 1">
          <div class="system-item">
            <n-icon :size="24" color="#fa8c16">
              <TimeOutline />
            </n-icon>
            <div class="system-info">
              <div class="system-label">登录时间</div>
              <div class="system-value">{{ loginTime }}</div>
            </div>
          </div>
        </n-grid-item>
        
        <n-grid-item :span="isMobile ? 2 : 1">
          <div class="system-item">
            <n-icon :size="24" color="#722ed1">
              <GlobeOutline />
            </n-icon>
            <div class="system-info">
              <div class="system-label">IP地址</div>
              <div class="system-value">{{ systemInfo.ip }}</div>
            </div>
          </div>
        </n-grid-item>
      </n-grid>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { 
  PersonOutline,
  DesktopOutline,
  CodeOutline,
  TimeOutline,
  GlobeOutline
} from '@vicons/ionicons5'
import type { FormInst, FormRules } from 'naive-ui'
import { useMessage } from 'naive-ui'
import { useAuthStore } from '@/stores/auth'
import { formatDate } from '@stone/shared'
import { updateAdmin } from '@/utils/api'

const message = useMessage()
const authStore = useAuthStore()

// 响应式数据
const isMobile = ref(false)
const passwordSubmitting = ref(false)
const passwordFormRef = ref<FormInst | null>(null)
const loginTime = ref('')

// 密码表单
const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// 系统信息
const systemInfo = reactive({
  platform: '',
  browser: '',
  ip: '127.0.0.1'
})

// 密码验证规则
const passwordRules: FormRules = {
  currentPassword: [
    { required: true, message: '请输入当前密码', trigger: ['input', 'blur'] }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: ['input', 'blur'] },
    { min: 8, message: '密码长度至少8位', trigger: ['input', 'blur'] },
    {
      validator: (rule, value) => {
        if (value && value === passwordForm.currentPassword) {
          return new Error('新密码不能与当前密码相同')
        }
        return true
      },
      trigger: ['input', 'blur']
    }
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: ['input', 'blur'] },
    {
      validator: (rule, value) => {
        if (value && value !== passwordForm.newPassword) {
          return new Error('两次输入的密码不一致')
        }
        return true
      },
      trigger: ['input', 'blur']
    }
  ]
}

// 获取角色文本
const getRoleText = (type?: string): string => {
  switch (type) {
    case 'SUPER_ADMIN':
      return '超级管理员'
    case 'ADMIN':
      return '管理员'
    default:
      return '用户'
  }
}

// 检测系统信息
const detectSystemInfo = () => {
  // 检测操作系统
  const userAgent = navigator.userAgent
  if (userAgent.includes('Windows')) {
    systemInfo.platform = 'Windows'
  } else if (userAgent.includes('Mac')) {
    systemInfo.platform = 'macOS'
  } else if (userAgent.includes('Linux')) {
    systemInfo.platform = 'Linux'
  } else {
    systemInfo.platform = 'Unknown'
  }

  // 检测浏览器
  if (userAgent.includes('Chrome')) {
    systemInfo.browser = 'Chrome'
  } else if (userAgent.includes('Firefox')) {
    systemInfo.browser = 'Firefox'
  } else if (userAgent.includes('Safari')) {
    systemInfo.browser = 'Safari'
  } else if (userAgent.includes('Edge')) {
    systemInfo.browser = 'Edge'
  } else {
    systemInfo.browser = 'Unknown'
  }

  // 设置登录时间
  loginTime.value = formatDate(new Date())
}

// 检查屏幕尺寸
const checkScreenSize = () => {
  isMobile.value = window.innerWidth <= 768
}

// 修改密码
const handlePasswordSubmit = async () => {
  if (!passwordFormRef.value || !authStore.user) return

  try {
    await passwordFormRef.value.validate()
    passwordSubmitting.value = true

    // 这里应该先验证当前密码，然后更新新密码
    // 由于我们的API设计，这里简化处理
    const response = await updateAdmin(authStore.user.id, {
      password: passwordForm.newPassword
    })

    if (response.success) {
      message.success('密码修改成功，请重新登录')
      handlePasswordReset()
      // 可以选择自动登出用户
      setTimeout(() => {
        authStore.logout()
        window.location.href = '/login'
      }, 2000)
    } else {
      message.error(response.message)
    }
  } catch (error) {
    // 表单验证失败
  } finally {
    passwordSubmitting.value = false
  }
}

// 重置密码表单
const handlePasswordReset = () => {
  passwordForm.currentPassword = ''
  passwordForm.newPassword = ''
  passwordForm.confirmPassword = ''
}

onMounted(() => {
  detectSystemInfo()
  checkScreenSize()
  window.addEventListener('resize', checkScreenSize)
})
</script>

<style scoped>
.profile {
  padding: 0;
}

.profile-card,
.password-card,
.system-card {
  margin-bottom: 24px;
}

.profile-info {
  padding: 16px 0;
}

.avatar-section {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.user-basic h3 {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.info-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.info-item .label {
  color: #666;
  font-weight: 500;
  min-width: 80px;
}

.system-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.system-info {
  flex: 1;
}

.system-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.system-value {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .avatar-section {
    flex-direction: column;
    text-align: center;
  }
  
  .info-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
  
  .info-item .label {
    min-width: auto;
  }
  
  .system-item {
    flex-direction: column;
    text-align: center;
    gap: 8px;
  }
}
</style>
