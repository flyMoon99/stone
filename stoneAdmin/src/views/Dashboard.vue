<template>
  <div class="dashboard">
    <!-- 欢迎区域 -->
    <div class="welcome-section">
      <n-card class="welcome-card">
        <div class="welcome-content">
          <div class="welcome-text">
            <h2 class="welcome-title">
              欢迎回来，{{ authStore.user?.account }}！
            </h2>
            <p class="welcome-subtitle">
              今天是 {{ formatDate(new Date()) }}，祝您工作愉快
            </p>
          </div>
          <div class="welcome-avatar">
            <n-avatar :size="60" color="#1890ff">
              <n-icon :size="30">
                <PersonOutline />
              </n-icon>
            </n-avatar>
          </div>
        </div>
      </n-card>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-section">
      <n-grid :cols="4" :x-gap="16" :y-gap="16" responsive="screen">
        <n-grid-item :span="isMobile ? 2 : 1">
          <n-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon" style="background: #e6f7ff; color: #1890ff;">
                <n-icon :size="24">
                  <PeopleOutline />
                </n-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ stats.totalMembers }}</div>
                <div class="stat-label">会员总数</div>
              </div>
            </div>
          </n-card>
        </n-grid-item>

        <n-grid-item :span="isMobile ? 2 : 1">
          <n-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon" style="background: #f6ffed; color: #52c41a;">
                <n-icon :size="24">
                  <ShieldCheckmarkOutline />
                </n-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ stats.totalAdmins }}</div>
                <div class="stat-label">管理员数</div>
              </div>
            </div>
          </n-card>
        </n-grid-item>

        <n-grid-item :span="isMobile ? 2 : 1">
          <n-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon" style="background: #fff7e6; color: #fa8c16;">
                <n-icon :size="24">
                  <TodayOutline />
                </n-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ stats.todayLogins }}</div>
                <div class="stat-label">今日登录</div>
              </div>
            </div>
          </n-card>
        </n-grid-item>

        <n-grid-item :span="isMobile ? 2 : 1">
          <n-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon" style="background: #f9f0ff; color: #722ed1;">
                <n-icon :size="24">
                  <StatsChartOutline />
                </n-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ stats.systemHealth }}%</div>
                <div class="stat-label">系统健康度</div>
              </div>
            </div>
          </n-card>
        </n-grid-item>
      </n-grid>
    </div>

    <!-- 图表和快捷操作 -->
    <n-grid :cols="3" :x-gap="16" :y-gap="16" responsive="screen">
      <!-- 用户增长趋势图 -->
      <n-grid-item :span="isMobile ? 3 : 2">
        <n-card title="用户增长趋势" class="chart-card">
          <div class="chart-container" ref="userChartRef"></div>
        </n-card>
      </n-grid-item>

      <!-- 快捷操作 -->
      <n-grid-item :span="isMobile ? 3 : 1">
        <n-card title="快捷操作" class="quick-actions-card">
          <div class="quick-actions">
            <n-button 
              type="primary" 
              block 
              class="quick-action-btn"
              @click="$router.push('/admin/members')"
            >
              <n-icon :size="16" class="mr-1">
                <PersonAddOutline />
              </n-icon>
              添加会员
            </n-button>
            
            <n-button 
              v-if="authStore.isSuperAdmin"
              block 
              class="quick-action-btn"
              @click="$router.push('/admin/admins')"
            >
              <n-icon :size="16" class="mr-1">
                <ShieldOutline />
              </n-icon>
              管理员管理
            </n-button>
            
            <n-button 
              block 
              class="quick-action-btn"
              @click="$router.push('/admin/statistics/users')"
            >
              <n-icon :size="16" class="mr-1">
                <BarChartOutline />
              </n-icon>
              用户统计
            </n-button>
            
            <n-button 
              block 
              class="quick-action-btn"
              @click="$router.push('/admin/system/logs')"
            >
              <n-icon :size="16" class="mr-1">
                <DocumentTextOutline />
              </n-icon>
              查看日志
            </n-button>
          </div>
        </n-card>
      </n-grid-item>
    </n-grid>

    <!-- 最近活动 -->
    <div class="recent-section">
      <n-card title="最近活动" class="recent-card">
        <n-list>
          <n-list-item v-for="activity in recentActivities" :key="activity.id">
            <div class="activity-item">
              <div class="activity-icon">
                <n-icon :size="16" :color="activity.color">
                  <component :is="activity.icon" />
                </n-icon>
              </div>
              <div class="activity-content">
                <div class="activity-text">{{ activity.text }}</div>
                <div class="activity-time">{{ formatTime(activity.time) }}</div>
              </div>
            </div>
          </n-list-item>
        </n-list>
      </n-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, markRaw } from 'vue'
import { 
  PersonOutline,
  PeopleOutline,
  ShieldCheckmarkOutline,
  TodayOutline,
  StatsChartOutline,
  PersonAddOutline,
  ShieldOutline,
  BarChartOutline,
  DocumentTextOutline,
  LogInOutline,
  PersonCircleOutline,
  SettingsOutline
} from '@vicons/ionicons5'
import { init } from 'echarts'
import { useAuthStore } from '@/stores/auth'
import { formatDate } from '@stone/shared'

const authStore = useAuthStore()

// 响应式数据
const userChartRef = ref<HTMLElement>()
const isMobile = ref(false)

// 统计数据
const stats = ref({
  totalMembers: 1248,
  totalAdmins: 8,
  todayLogins: 156,
  systemHealth: 98
})

// 最近活动数据
const recentActivities = ref([
  {
    id: 1,
    text: '用户 testmember 登录系统',
    time: new Date(Date.now() - 5 * 60 * 1000),
    icon: markRaw(LogInOutline),
    color: '#52c41a'
  },
  {
    id: 2,
    text: '管理员 admin 创建了新用户',
    time: new Date(Date.now() - 15 * 60 * 1000),
    icon: markRaw(PersonCircleOutline),
    color: '#1890ff'
  },
  {
    id: 3,
    text: '系统配置已更新',
    time: new Date(Date.now() - 30 * 60 * 1000),
    icon: markRaw(SettingsOutline),
    color: '#fa8c16'
  },
  {
    id: 4,
    text: '用户 member001 注册成功',
    time: new Date(Date.now() - 60 * 60 * 1000),
    icon: markRaw(PersonAddOutline),
    color: '#722ed1'
  }
])

// 格式化时间
const formatTime = (date: Date): string => {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  return `${days}天前`
}

// 检查屏幕尺寸
const checkScreenSize = () => {
  isMobile.value = window.innerWidth <= 768
}

// 初始化用户增长图表
const initUserChart = () => {
  if (!userChartRef.value) return

  const chart = init(userChartRef.value)
  
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: ['1月', '2月', '3月', '4月', '5月', '6月', '7月']
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '新增会员',
        type: 'line',
        smooth: true,
        data: [120, 132, 101, 134, 90, 230, 210],
        itemStyle: {
          color: '#1890ff'
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(24, 144, 255, 0.3)' },
              { offset: 1, color: 'rgba(24, 144, 255, 0.1)' }
            ]
          }
        }
      },
      {
        name: '活跃用户',
        type: 'line',
        smooth: true,
        data: [220, 182, 191, 234, 290, 330, 310],
        itemStyle: {
          color: '#52c41a'
        }
      }
    ]
  }

  chart.setOption(option)

  // 响应式调整
  const resizeChart = () => {
    chart.resize()
  }

  window.addEventListener('resize', resizeChart)

  // 组件卸载时清理
  onUnmounted(() => {
    window.removeEventListener('resize', resizeChart)
    chart.dispose()
  })
}

onMounted(() => {
  checkScreenSize()
  window.addEventListener('resize', checkScreenSize)
  
  // 延迟初始化图表，确保DOM已渲染
  setTimeout(initUserChart, 100)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkScreenSize)
})
</script>

<style scoped>
.dashboard {
  padding: 0;
}

.welcome-section {
  margin-bottom: 24px;
}

.welcome-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.welcome-card :deep(.n-card__content) {
  padding: 24px;
}

.welcome-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.welcome-title {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 8px;
  color: white;
}

.welcome-subtitle {
  font-size: 14px;
  opacity: 0.9;
  color: white;
}

.stats-section {
  margin-bottom: 24px;
}

.stat-card {
  height: 100%;
}

.stat-card :deep(.n-card__content) {
  padding: 20px;
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #333;
  line-height: 1.2;
}

.stat-label {
  font-size: 14px;
  color: #666;
  margin-top: 4px;
}

.chart-card {
  height: 400px;
}

.chart-container {
  height: 300px;
  width: 100%;
}

.quick-actions-card {
  height: 400px;
}

.quick-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.quick-action-btn {
  justify-content: flex-start;
}

.recent-section {
  margin-top: 24px;
}

.recent-card :deep(.n-card__content) {
  padding: 0;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 24px;
}

.activity-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #f5f7fa;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.activity-content {
  flex: 1;
}

.activity-text {
  font-size: 14px;
  color: #333;
  margin-bottom: 4px;
}

.activity-time {
  font-size: 12px;
  color: #999;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .welcome-content {
    flex-direction: column;
    text-align: center;
    gap: 16px;
  }
  
  .welcome-title {
    font-size: 20px;
  }
  
  .stat-content {
    flex-direction: column;
    text-align: center;
    gap: 12px;
  }
  
  .chart-card,
  .quick-actions-card {
    height: auto;
  }
  
  .chart-container {
    height: 250px;
  }
}
</style>
