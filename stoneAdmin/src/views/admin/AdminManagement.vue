<template>
  <div class="admin-management">
    <!-- 搜索和筛选 -->
    <n-card class="search-card">
      <n-form inline :model="searchForm" class="search-form">
        <n-form-item label="账户名称" label-placement="left">
          <n-input 
            v-model:value="searchForm.account" 
            placeholder="请输入账户名称"
            clearable
            @keydown.enter="handleSearch"
            style="width: 180px;"
          />
        </n-form-item>
        <n-form-item label="管理员类型" label-placement="left">
          <n-select 
            v-model:value="searchForm.type" 
            placeholder="请选择类型"
            clearable
            :options="typeOptions"
            style="width: 160px;"
          />
        </n-form-item>
        <n-form-item label="状态" label-placement="left">
          <n-select 
            v-model:value="searchForm.status" 
            placeholder="请选择状态"
            clearable
            :options="statusOptions"
            style="width: 140px;"
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
          <span>管理员列表</span>
          <div class="table-actions">
            <n-button type="primary" @click="handleCreate">
              <n-icon :size="16" class="mr-1">
                <PersonAddOutline />
              </n-icon>
              添加管理员
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
        :row-key="(row: Admin) => row.id"
        v-model:checked-row-keys="selectedRowKeys"
        @update:page="handlePageChange"
        @update:page-size="handlePageSizeChange"
      />
    </n-card>

    <!-- 创建/编辑管理员模态框 -->
    <n-modal 
      v-model:show="showCreateModal" 
      preset="card" 
      :title="editingAdmin ? '编辑管理员' : '添加管理员'"
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
            :disabled="!!editingAdmin"
          />
        </n-form-item>
        
        <n-form-item label="密码" path="password">
          <n-input 
            v-model:value="formData.password" 
            type="password"
            :placeholder="editingAdmin ? '留空则不修改密码' : '请输入密码'"
            show-password-on="click"
          />
        </n-form-item>
        
        <n-form-item label="管理员类型" path="type">
          <n-select 
            v-model:value="formData.type" 
            :options="typeOptions"
            placeholder="请选择管理员类型"
            style="width: 100%;"
          />
        </n-form-item>
        
        <n-form-item v-if="editingAdmin" label="状态" path="status">
          <n-select 
            v-model:value="formData.status" 
            :options="statusOptions"
            placeholder="请选择状态"
            style="width: 100%;"
          />
        </n-form-item>
      </n-form>

      <template #footer>
        <div class="modal-footer">
          <n-button @click="handleCancel">取消</n-button>
          <n-button type="primary" :loading="submitting" @click="handleSubmit">
            {{ editingAdmin ? '更新' : '创建' }}
          </n-button>
        </div>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, h } from 'vue'
import { 
  PersonAddOutline, 
  SearchOutline, 
  CreateOutline,
  CheckmarkCircleOutline,
  CloseCircleOutline
} from '@vicons/ionicons5'
import type { FormInst, FormRules, DataTableColumns } from 'naive-ui'
import { useMessage, useDialog, NButton, NTag } from 'naive-ui'
import type { Admin } from '@stone/shared'
import { AdminType, UserStatus, formatDate } from '@stone/shared'
import { 
  getAdminList, 
  createAdmin, 
  updateAdmin, 
  batchUpdateAdminStatus 
} from '@/utils/api'

const message = useMessage()
const dialog = useDialog()

// 响应式数据
const loading = ref(false)
const submitting = ref(false)
const showCreateModal = ref(false)
const editingAdmin = ref<Admin | null>(null)
const selectedRowKeys = ref<string[]>([])
const formRef = ref<FormInst | null>(null)

// 搜索表单
const searchForm = reactive({
  account: '',
  type: null as AdminType | null,
  status: null as UserStatus | null
})

// 表单数据
const formData = reactive({
  account: '',
  password: '',
  type: 'ADMIN' as AdminType,
  status: 'ACTIVE' as UserStatus
})

// 表格数据
const tableData = ref<Admin[]>([])
const pagination = reactive({
  page: 1,
  pageSize: 10,
  itemCount: 0,
  showSizePicker: true,
  pageSizes: [10, 20, 50, 100]
})

// 选项数据
const typeOptions = [
  { label: '超级管理员', value: 'SUPER_ADMIN' },
  { label: '普通管理员', value: 'ADMIN' }
]

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
      required: !editingAdmin.value, 
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
  ],
  type: [
    { required: true, message: '请选择管理员类型', trigger: ['change', 'blur'] }
  ]
}

// 表格列配置
const columns: DataTableColumns<Admin> = [
  {
    type: 'selection'
  },
  {
    title: '账户名称',
    key: 'account',
    width: 150
  },
  {
    title: '管理员类型',
    key: 'type',
    width: 120,
    render: (row) => {
      const typeMap = {
        'SUPER_ADMIN': { label: '超级管理员', type: 'error' },
        'ADMIN': { label: '普通管理员', type: 'info' }
      }
      const config = typeMap[row.type as keyof typeof typeMap]
      return h(NTag, { type: config.type }, { default: () => config.label })
    }
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
    title: '创建时间',
    key: 'createdAt',
    width: 180,
    render: (row) => formatDate(row.createdAt)
  },
  {
    title: '最后登录',
    key: 'lastLoginAt',
    width: 180,
    render: (row) => row.lastLoginAt ? formatDate(row.lastLoginAt) : '-'
  },
  {
    title: '操作',
    key: 'actions',
    width: 150,
    render: (row) => {
      return [
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

      ]
    }
  }
]

// 获取管理员列表
const fetchAdminList = async () => {
  try {
    loading.value = true
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      ...(searchForm.account && { account: searchForm.account }),
      ...(searchForm.type && { type: searchForm.type }),
      ...(searchForm.status && { status: searchForm.status })
    }
    
    const response = await getAdminList(params)
    if (response.success) {
      tableData.value = response.data.items
      pagination.itemCount = response.data.total
    } else {
      message.error(getErrorMessage(null, response.message || '获取管理员列表失败'))
    }
  } catch (error) {
    message.error(getErrorMessage(error, '获取管理员列表失败，请刷新重试'))
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  pagination.page = 1
  fetchAdminList()
}

// 重置搜索
const handleReset = () => {
  searchForm.account = ''
  searchForm.type = null
  searchForm.status = null
  pagination.page = 1
  fetchAdminList()
}

// 分页变化
const handlePageChange = (page: number) => {
  pagination.page = page
  fetchAdminList()
}

const handlePageSizeChange = (pageSize: number) => {
  pagination.pageSize = pageSize
  pagination.page = 1
  fetchAdminList()
}

// 创建管理员
const handleCreate = () => {
  console.log('点击了添加管理员按钮') // 调试信息
  // 重置编辑状态和表单数据
  editingAdmin.value = null
  formData.account = ''
  formData.password = ''
  formData.type = 'ADMIN'
  formData.status = 'ACTIVE'
  showCreateModal.value = true
  console.log('模态框状态:', showCreateModal.value) // 调试信息
}

// 编辑管理员
const handleEdit = (admin: Admin) => {
  editingAdmin.value = admin
  formData.account = admin.account
  formData.password = ''
  formData.type = admin.type
  formData.status = admin.status
  showCreateModal.value = true
}

// 批量状态更新
const handleBatchStatusUpdate = (status: UserStatus) => {
  const action = status === 'ACTIVE' ? '启用' : '禁用'
  dialog.info({
    title: `确认${action}`,
    content: `确定要${action}选中的 ${selectedRowKeys.value.length} 个管理员吗？`,
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        const response = await batchUpdateAdminStatus({
          ids: selectedRowKeys.value,
          status
        })
        if (response.success) {
          message.success(`${action}成功`)
          selectedRowKeys.value = []
          fetchAdminList()
        } else {
          message.error(getErrorMessage(null, response.message || `${action}失败`))
        }
      } catch (error) {
        message.error(getErrorMessage(error, `${action}管理员失败，请重试`))
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
    'Admin not found': '管理员不存在',
    'Cannot delete super admin': '不能删除超级管理员',
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

    if (editingAdmin.value) {
      // 更新管理员
      const updateData: any = {
        type: formData.type,
        status: formData.status
      }
      if (formData.password) {
        updateData.password = formData.password
      }

      try {
        const response = await updateAdmin(editingAdmin.value.id, updateData)
        if (response.success) {
          message.success('更新成功')
          handleCancel()
          fetchAdminList()
        } else {
          message.error(getErrorMessage(null, response.message || '更新失败'))
        }
      } catch (error) {
        message.error(getErrorMessage(error, '更新管理员失败，请重试'))
      }
    } else {
      // 创建管理员
      try {
        const response = await createAdmin({
          account: formData.account,
          password: formData.password,
          type: formData.type
        })
        if (response.success) {
          message.success('创建成功')
          handleCancel()
          fetchAdminList()
        } else {
          message.error(getErrorMessage(null, response.message || '创建失败'))
        }
      } catch (error) {
        message.error(getErrorMessage(error, '创建管理员失败，请检查输入信息'))
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
  editingAdmin.value = null
  formData.account = ''
  formData.password = ''
  formData.type = 'ADMIN'
  formData.status = 'ACTIVE'
}

onMounted(() => {
  fetchAdminList()
})
</script>

<style scoped>
.admin-management {
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
  }
}
</style>
