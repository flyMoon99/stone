<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <img src="/logo-icon-120px.svg" alt="基石" class="login-logo" />
        <h1 class="login-title">会员登录</h1>
        <p class="login-subtitle">欢迎回来，请登录您的账户</p>
      </div>

      <n-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        size="large"
        class="login-form"
      >
        <n-form-item path="account">
          <n-input
            v-model:value="formData.account"
            placeholder="请输入账户名"
            :input-props="{ autocomplete: 'username' }"
          >
            <template #prefix>
              <n-icon :size="18">
                <PersonOutline />
              </n-icon>
            </template>
          </n-input>
        </n-form-item>

        <n-form-item path="password">
          <n-input
            v-model:value="formData.password"
            type="password"
            placeholder="请输入密码"
            show-password-on="click"
            :input-props="{ autocomplete: 'current-password' }"
            @keydown.enter="handleLogin"
          >
            <template #prefix>
              <n-icon :size="18">
                <LockClosedOutline />
              </n-icon>
            </template>
          </n-input>
        </n-form-item>

        <n-form-item>
          <n-button
            type="primary"
            size="large"
            :loading="authStore.isLoading"
            :disabled="!canSubmit"
            block
            @click="handleLogin"
          >
            {{ authStore.isLoading ? '登录中...' : '登录' }}
          </n-button>
        </n-form-item>
      </n-form>

      <div class="login-footer">
        <n-button text @click="$router.push('/')">
          <n-icon :size="16" class="mr-1">
            <ArrowBackOutline />
          </n-icon>
          返回首页
        </n-button>
      </div>
    </div>

    <!-- 背景装饰 -->
    <div class="login-bg">
      <div class="bg-shape bg-shape-1"></div>
      <div class="bg-shape bg-shape-2"></div>
      <div class="bg-shape bg-shape-3"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import type { FormInst, FormRules } from 'naive-ui'
import { useMessage } from 'naive-ui'
import { PersonOutline, LockClosedOutline, ArrowBackOutline } from '@vicons/ionicons5'
import { useAuthStore } from '@/stores/auth'
import type { LoginRequest } from '@stone/shared'

const router = useRouter()
const route = useRoute()
const message = useMessage()
const authStore = useAuthStore()

// 表单引用
const formRef = ref<FormInst | null>(null)

// 表单数据
const formData = ref<LoginRequest>({
  account: '',
  password: ''
})

// 表单验证规则
const rules: FormRules = {
  account: [
    {
      required: true,
      message: '请输入账户名',
      trigger: ['input', 'blur']
    },
    {
      min: 3,
      max: 50,
      message: '账户名长度应在3-50个字符之间',
      trigger: ['input', 'blur']
    }
  ],
  password: [
    {
      required: true,
      message: '请输入密码',
      trigger: ['input', 'blur']
    },
    {
      min: 6,
      message: '密码长度至少6位',
      trigger: ['input', 'blur']
    }
  ]
}

// 计算属性
const canSubmit = computed(() => {
  return formData.value.account.length >= 3 && 
         formData.value.password.length >= 6 && 
         !authStore.isLoading
})

// 处理登录
const handleLogin = async () => {
  if (!formRef.value) return

  try {
    // 验证表单
    await formRef.value.validate()
    
    // 执行登录
    await authStore.login(formData.value)
    
    message.success('登录成功')
    
    // 获取重定向地址
    const redirect = route.query.redirect as string || '/member'
    router.push(redirect)
    
  } catch (error) {
    if (error instanceof Error) {
      message.error(error.message || '登录失败')
    } else {
      console.error('Login validation error:', error)
    }
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
  overflow: hidden;
}

.login-card {
  width: 100%;
  max-width: 400px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  position: relative;
  z-index: 10;
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.login-logo {
  width: 64px;
  height: 64px;
  margin-bottom: 16px;
}

.login-title {
  font-size: 28px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.login-subtitle {
  color: #666;
  font-size: 14px;
}

.login-form {
  margin-bottom: 24px;
}

.login-footer {
  text-align: center;
}

/* 背景装饰 */
.login-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
}

.bg-shape {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  animation: float 6s ease-in-out infinite;
}

.bg-shape-1 {
  width: 200px;
  height: 200px;
  top: 10%;
  left: 10%;
  animation-delay: 0s;
}

.bg-shape-2 {
  width: 150px;
  height: 150px;
  top: 60%;
  right: 10%;
  animation-delay: 2s;
}

.bg-shape-3 {
  width: 100px;
  height: 100px;
  bottom: 20%;
  left: 20%;
  animation-delay: 4s;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-20px);
  }
}

/* 响应式设计 */
@media (max-width: 480px) {
  .login-card {
    margin: 20px;
    padding: 24px;
  }
  
  .login-title {
    font-size: 24px;
  }
}

/* 深色主题适配 */
:deep(.n-form-item-feedback-wrapper) {
  min-height: 24px;
}
</style>
