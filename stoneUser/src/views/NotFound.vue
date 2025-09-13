<template>
  <div class="not-found-container">
    <div class="not-found-content">
      <div class="not-found-icon">
        <n-icon :size="120" color="#d03050">
          <AlertCircleOutline />
        </n-icon>
      </div>
      
      <h1 class="not-found-title">404</h1>
      <h2 class="not-found-subtitle">页面未找到</h2>
      <p class="not-found-description">
        抱歉，您访问的页面不存在或已被移除。
      </p>
      
      <div class="not-found-actions">
        <n-button type="primary" size="large" @click="$router.push('/')">
          <n-icon :size="18" class="mr-1">
            <HomeOutline />
          </n-icon>
          返回首页
        </n-button>
        
        <n-button size="large" @click="$router.back()">
          <n-icon :size="18" class="mr-1">
            <ArrowBackOutline />
          </n-icon>
          返回上页
        </n-button>
      </div>
    </div>
    
    <!-- 背景装饰 -->
    <div class="not-found-bg">
      <div class="bg-circle bg-circle-1"></div>
      <div class="bg-circle bg-circle-2"></div>
      <div class="bg-circle bg-circle-3"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { AlertCircleOutline, HomeOutline, ArrowBackOutline } from '@vicons/ionicons5'
</script>

<style scoped>
.not-found-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  position: relative;
  overflow: hidden;
}

.not-found-content {
  text-align: center;
  position: relative;
  z-index: 10;
  max-width: 500px;
  padding: 40px;
}

.not-found-icon {
  margin-bottom: 24px;
}

.not-found-title {
  font-size: 72px;
  font-weight: 700;
  color: #d03050;
  margin-bottom: 16px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
}

.not-found-subtitle {
  font-size: 32px;
  font-weight: 600;
  color: #333;
  margin-bottom: 16px;
}

.not-found-description {
  font-size: 16px;
  color: #666;
  line-height: 1.6;
  margin-bottom: 32px;
}

.not-found-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
}

/* 背景装饰 */
.not-found-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
}

.bg-circle {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  animation: float 8s ease-in-out infinite;
}

.bg-circle-1 {
  width: 300px;
  height: 300px;
  top: 10%;
  left: 10%;
  animation-delay: 0s;
}

.bg-circle-2 {
  width: 200px;
  height: 200px;
  top: 50%;
  right: 15%;
  animation-delay: 2s;
}

.bg-circle-3 {
  width: 150px;
  height: 150px;
  bottom: 20%;
  left: 20%;
  animation-delay: 4s;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px) rotate(0deg);
  }
  33% {
    transform: translateY(-20px) rotate(120deg);
  }
  66% {
    transform: translateY(20px) rotate(240deg);
  }
}

/* 响应式设计 */
@media (max-width: 480px) {
  .not-found-content {
    padding: 20px;
  }
  
  .not-found-title {
    font-size: 56px;
  }
  
  .not-found-subtitle {
    font-size: 24px;
  }
  
  .not-found-actions {
    flex-direction: column;
    align-items: center;
  }
  
  .not-found-actions .n-button {
    width: 200px;
  }
}
</style>
