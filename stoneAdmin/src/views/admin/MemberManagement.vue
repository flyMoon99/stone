<template>
  <div class="member-management">
    <!-- 搜索和筛选 -->
    <n-card class="search-card">
      <n-form inline :model="searchForm" class="search-form">
        <n-form-item label="账户名称" label-placement="left">
          <n-input 
            v-model:value="searchForm.keyword" 
            placeholder="请输入账户名称"
            clearable
            @keydown.enter="handleSearch"
            style="width: 180px;"
          />
        </n-form-item>
        <n-form-item label="状态" label-placement="left">
          <n-select 
            v-model:value="searchForm.status" 
            placeholder="请选择状态"
            clearable
            :options="statusOptions"
            style="width: 160px;"
          />
        </n-form-item>
        <n-form-item>
          <n-button type="primary" @click="handleSearch">
            <n-icon :size="16" class="mr-1">
              <SearchOutline />
            </n-icon>
            搜索
          </n-button>
          <n-button @click="handleReset" style="margin-left: 12px;">
            重置
          </n-button>
        </n-form-item>
      </n-form>
    </n-card>

    <!-- 数据表格 -->
    <n-card class="table-card">
      <template #header>
        <div class="table-header">
          <span>会员列表</span>
          <div class="table-actions">
            <n-button 
              v-permission="PERMISSIONS.MEMBER.CREATE"
              type="primary" 
              @click="handleCreate"
            >
              <n-icon :size="16" class="mr-1">
                <PersonAddOutline />
              </n-icon>
              添加会员
            </n-button>
            <n-button 
              :disabled="!selectedRowKeys.length"
              @click="handleBatchStatusUpdate('ACTIVE')"
            >
              批量启用
            </n-button>
            <n-button 
              :disabled="!selectedRowKeys.length"
              @click="handleBatchStatusUpdate('INACTIVE')"
            >
              批量禁用
            </n-button>
          </div>
        </div>
      </template>

      <n-data-table
        :columns="columns"
        :data="tableData"
        :loading="loading"
        :pagination="pagination"
        :row-key="(row: Member) => row.id"
        v-model:checked-row-keys="selectedRowKeys"
        @update:page="handlePageChange"
        @update:page-size="handlePageSizeChange"
      />
    </n-card>

    <!-- 创建/编辑会员模态框 -->
    <n-modal 
      v-model:show="showCreateModal" 
      preset="card" 
      :title="editingMember ? '编辑会员' : '添加会员'"
      style="width: 500px"
      :mask-closable="false"
    >
      <n-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-placement="left"
        label-width="80px"
      >
        <n-form-item label="账户名称" path="account">
          <n-input 
            v-model:value="formData.account" 
            placeholder="请输入账户名称"
            :disabled="!!editingMember"
          />
        </n-form-item>
        
        <n-form-item label="密码" path="password">
          <n-input 
            v-model:value="formData.password" 
            type="password"
            :placeholder="editingMember ? '留空则不修改密码' : '请输入密码'"
            show-password-on="click"
          />
        </n-form-item>
        
        <n-form-item v-if="editingMember" label="状态" path="status">
          <n-select 
            v-model:value="formData.status" 
            :options="statusOptions"
            placeholder="请选择状态"
          />
        </n-form-item>
      </n-form>

      <template #footer>
        <div class="modal-footer">
          <n-button @click="handleCancel">取消</n-button>
          <n-button type="primary" :loading="submitting" @click="handleSubmit">
            {{ editingMember ? '更新' : '创建' }}
          </n-button>
        </div>
      </template>
    </n-modal>

    <!-- 会员详情模态框 -->
    <n-modal 
      v-model:show="showDetailModal" 
      preset="card" 
      title="会员详情"
      style="width: 600px"
    >
      <div v-if="selectedMember" class="member-detail">
        <n-descriptions :column="2" bordered>
          <n-descriptions-item label="账户名称">
            {{ selectedMember.account }}
          </n-descriptions-item>
          <n-descriptions-item label="用户ID">
            <n-text code>{{ selectedMember.id }}</n-text>
          </n-descriptions-item>
          <n-descriptions-item label="状态">
            <n-tag :type="selectedMember.status === 'ACTIVE' ? 'success' : 'error'">
              {{ selectedMember.status === 'ACTIVE' ? '启用' : '禁用' }}
            </n-tag>
          </n-descriptions-item>
          <n-descriptions-item label="注册时间">
            {{ formatDate(selectedMember.createdAt) }}
          </n-descriptions-item>
          <n-descriptions-item label="更新时间">
            {{ formatDate(selectedMember.updatedAt) }}
          </n-descriptions-item>
          <n-descriptions-item label="最后登录">
            {{ selectedMember.lastLoginAt ? formatDate(selectedMember.lastLoginAt) : '从未登录' }}
          </n-descriptions-item>
        </n-descriptions>
      </div>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, h } from 'vue'
import { 
  PersonAddOutline, 
  SearchOutline, 
  CreateOutline,
  EyeOutline
} from '@vicons/ionicons5'
import type { FormInst, FormRules, DataTableColumns } from 'naive-ui'
import { useMessage, useDialog, NButton, NTag } from 'naive-ui'
import type { Member } from '@stone/shared'
import { UserStatus, formatDate } from '@stone/shared'
import { usePermissionStore } from '@/stores/permission'
import { PERMISSIONS } from '@/utils/permission'
import { 
  getMemberList, 
  searchMembers,
  createMember, 
  updateMember, 
  batchUpdateMemberStatus 
} from '@/utils/api'

const message = useMessage()
const dialog = useDialog()
const permissionStore = usePermissionStore()

// 响应式数据
const loading = ref(false)
const submitting = ref(false)
const showCreateModal = ref(false)
const showDetailModal = ref(false)
const editingMember = ref<Member | null>(null)
const selectedMember = ref<Member | null>(null)
const selectedRowKeys = ref<string[]>([])
const formRef = ref<FormInst | null>(null)

// 搜索表单
const searchForm = reactive({
  keyword: '',
  status: null as UserStatus | null
})

// 表单数据
const formData = reactive({
  account: '',
  password: '',
  status: 'ACTIVE' as UserStatus
})

// 表格数据
const tableData = ref<Member[]>([])
const pagination = reactive({
  page: 1,
  pageSize: 10,
  itemCount: 0,
  showSizePicker: true,
  pageSizes: [10, 20, 50, 100]
})

// 选项数据
const statusOptions = [
  { label: '启用', value: 'ACTIVE' },
  { label: '禁用', value: 'INACTIVE' }
]

// 表单验证规则
const formRules: FormRules = {
  account: [
    { required: true, message: '请输入账户名称', trigger: ['input', 'blur'] },
    { min: 3, max: 50, message: '账户名称长度为3-50个字符', trigger: ['input', 'blur'] }
  ],
  password: [
    { 
      required: !editingMember.value, 
      message: '请输入密码', 
      trigger: ['input', 'blur'] 
    },
    { 
      min: 8, 
      message: '密码长度至少8位', 
      trigger: ['input', 'blur'] 
    },
    {
      pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      message: '密码必须包含大小写字母和数字',
      trigger: ['input', 'blur']
    }
  ]
}

// 表格列配置
const columns: DataTableColumns<Member> = [
  {
    type: 'selection'
  },
  {
    title: '账户名称',
    key: 'account',
    width: 150
  },
  {
    title: '状态',
    key: 'status',
    width: 100,
    render: (row) => {
      const statusMap = {
        'ACTIVE': { label: '启用', type: 'success' },
        'INACTIVE': { label: '禁用', type: 'error' }
      }
      const config = statusMap[row.status as keyof typeof statusMap]
      return h(NTag, { type: config.type }, { default: () => config.label })
    }
  },
  {
    title: '注册时间',
    key: 'createdAt',
    width: 180,
    render: (row) => formatDate(row.createdAt)
  },
  {
    title: '最后登录',
    key: 'lastLoginAt',
    width: 180,
    render: (row) => row.lastLoginAt ? formatDate(row.lastLoginAt) : '从未登录'
  },
  {
    title: '操作',
    key: 'actions',
    width: 200,
    render: (row) => {
      return [
        h(
          NButton,
          {
            size: 'small',
            type: 'info',
            ghost: true,
            onClick: () => handleViewDetail(row),
            style: { marginRight: '8px' }
          },
          { default: () => '详情', icon: () => h(EyeOutline) }
        ),
        // 只有有编辑权限的用户才显示编辑按钮
        ...(permissionStore.hasPermission(PERMISSIONS.MEMBER.UPDATE) ? [
          h(
            NButton,
            {
              size: 'small',
              type: 'primary',
              ghost: true,
              onClick: () => handleEdit(row)
            },
            { default: () => '编辑', icon: () => h(CreateOutline) }
          )
        ] : [])
      ]
    }
  }
]

// 获取会员列表
const fetchMemberList = async () => {
  try {
    loading.value = true
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      ...(searchForm.keyword && { keyword: searchForm.keyword }),
      ...(searchForm.status && { status: searchForm.status })
    }
    
    const response = searchForm.keyword 
      ? await searchMembers(params)
      : await getMemberList(params)
      
    if (response.success) {
      tableData.value = response.data.items
      pagination.itemCount = response.data.total
    } else {
      message.error(getErrorMessage(null, response.message || '获取会员列表失败'))
    }
  } catch (error) {
    message.error(getErrorMessage(error, '获取会员列表失败，请刷新重试'))
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  pagination.page = 1
  fetchMemberList()
}

// 重置搜索
const handleReset = () => {
  searchForm.keyword = ''
  searchForm.status = null
  pagination.page = 1
  fetchMemberList()
}

// 分页变化
const handlePageChange = (page: number) => {
  pagination.page = page
  fetchMemberList()
}

const handlePageSizeChange = (pageSize: number) => {
  pagination.pageSize = pageSize
  pagination.page = 1
  fetchMemberList()
}

// 查看详情
const handleViewDetail = (member: Member) => {
  selectedMember.value = member
  showDetailModal.value = true
}

// 创建会员
const handleCreate = () => {
  // 重置编辑状态和表单数据
  editingMember.value = null
  formData.account = ''
  formData.password = ''
  formData.status = 'ACTIVE'
  showCreateModal.value = true
}

// 编辑会员
const handleEdit = (member: Member) => {
  editingMember.value = member
  formData.account = member.account
  formData.password = ''
  formData.status = member.status
  showCreateModal.value = true
}

// 批量状态更新
const handleBatchStatusUpdate = (status: UserStatus) => {
  const action = status === 'ACTIVE' ? '启用' : '禁用'
  dialog.info({
    title: `确认${action}`,
    content: `确定要${action}选中的 ${selectedRowKeys.value.length} 个会员吗？`,
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        const response = await batchUpdateMemberStatus({
          ids: selectedRowKeys.value,
          status
        })
        if (response.success) {
          message.success(`${action}成功`)
          selectedRowKeys.value = []
          fetchMemberList()
        } else {
          message.error(getErrorMessage(null, response.message || `${action}失败`))
        }
      } catch (error) {
        message.error(getErrorMessage(error, `${action}会员失败，请重试`))
      }
    }
  })
}

// 错误信息映射
const getErrorMessage = (error: any, defaultMessage: string): string => {
  let message = defaultMessage
  
  // 获取错误信息
  if (error?.response?.data?.message) {
    // API响应错误
    message = error.response.data.message
  } else if (error?.message) {
    // 网络错误或其他错误
    message = error.message
  } else if (typeof error === 'string') {
    // 直接传入的错误信息
    message = error
  }
  
  // 将常见的英文错误信息转换为中文
  const errorMap: Record<string, string> = {
    'Account already exists': '账户名已存在，请使用其他账户名',
    'Invalid credentials': '用户名或密码错误',
    'Account is disabled': '账户已被禁用',
    'Password must contain at least one lowercase letter, one uppercase letter, and one number': '密码必须包含大小写字母和数字',
    'Password length must be at least 8 characters': '密码长度至少8位',
    'Account length must be between 3 and 50 characters': '账户名长度应在3-50个字符之间',
    'Member not found': '会员不存在',
    'Network Error': '网络连接失败，请检查网络后重试',
    'Request timeout': '请求超时，请重试'
  }

  return errorMap[message] || message
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    submitting.value = true

    if (editingMember.value) {
      // 更新会员
      const updateData: any = {
        status: formData.status
      }
      if (formData.password) {
        updateData.password = formData.password
      }

      try {
        const response = await updateMember(editingMember.value.id, updateData)
        if (response.success) {
          message.success('更新成功')
          handleCancel()
          fetchMemberList()
        } else {
          message.error(getErrorMessage(null, response.message || '更新失败'))
        }
      } catch (error) {
        message.error(getErrorMessage(error, '更新会员失败，请重试'))
      }
    } else {
      // 创建会员
      try {
        const response = await createMember({
          account: formData.account,
          password: formData.password
        })
        if (response.success) {
          message.success('创建成功')
          handleCancel()
          fetchMemberList()
        } else {
          message.error(getErrorMessage(null, response.message || '创建失败'))
        }
      } catch (error) {
        message.error(getErrorMessage(error, '创建会员失败，请检查输入信息'))
      }
    }
  } catch (error) {
    // 表单验证失败，显示友好提示
    message.warning('请检查表单信息是否填写正确')
  } finally {
    submitting.value = false
  }
}

// 取消操作
const handleCancel = () => {
  showCreateModal.value = false
  editingMember.value = null
  formData.account = ''
  formData.password = ''
  formData.status = 'ACTIVE'
}

onMounted(() => {
  fetchMemberList()
})
</script>

<style scoped>
.member-management {
  padding: 0;
}

.search-card {
  margin-bottom: 16px;
}

.search-card :deep(.n-card__content) {
  padding-top: 0;
  padding-bottom: 0;
}

.search-form {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: center;
}

.search-form .n-form-item {
  margin-bottom: 0;
}

/* 搜索表单项标签和输入框在同一行 */
.search-form .n-form-item--left-labelled {
  display: flex;
  align-items: center;
  white-space: nowrap;
}

.table-card {
  margin-bottom: 16px;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.table-actions {
  display: flex;
  gap: 8px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.member-detail {
  padding: 16px 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 16px;
  }
  
  .search-form {
    flex-direction: column;
  }
  
  .table-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }
  
  .table-actions {
    width: 100%;
    justify-content: flex-start;
    flex-wrap: wrap;
  }
}
</style>
