<template>
  <div class="role-management">
    <!-- 搜索和筛选 -->
    <n-card class="search-card">
      <n-form inline :model="searchForm" class="search-form">
        <n-form-item label="角色名称" label-placement="left">
          <n-input 
            v-model:value="searchForm.name" 
            placeholder="请输入角色名称"
            clearable
            @keydown.enter="handleSearch"
            style="width: 180px;"
          />
        </n-form-item>
        <n-form-item label="角色编码" label-placement="left">
          <n-input 
            v-model:value="searchForm.code" 
            placeholder="请输入角色编码"
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
          <span>角色列表</span>
          <div class="table-actions">
            <n-button type="primary" @click="handleCreate">
              <n-icon :size="16" class="mr-1">
                <AddOutline />
              </n-icon>
              添加角色
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
        :row-key="(row: Role) => row.id"
        v-model:checked-row-keys="selectedRowKeys"
        @update:page="handlePageChange"
        @update:page-size="handlePageSizeChange"
      />
    </n-card>

    <!-- 创建/编辑角色模态框 -->
    <n-modal 
      v-model:show="showCreateModal" 
      preset="card" 
      :title="editingRole ? '编辑角色' : '添加角色'"
      style="width: 600px"
      :mask-closable="false"
    >
      <n-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-placement="left"
        label-width="100px"
      >
        <n-form-item label="角色名称" path="name">
          <n-input 
            v-model:value="formData.name" 
            placeholder="请输入角色名称"
          />
        </n-form-item>
        
        <n-form-item label="角色编码" path="code">
          <n-input 
            v-model:value="formData.code" 
            placeholder="请输入角色编码（英文字母、数字、下划线）"
            :disabled="!!editingRole"
          />
        </n-form-item>
        
        <n-form-item label="角色描述" path="description">
          <n-input 
            v-model:value="formData.description" 
            type="textarea"
            placeholder="请输入角色描述"
            :rows="3"
          />
        </n-form-item>
        
        <n-form-item v-if="editingRole" label="状态" path="status">
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
            {{ editingRole ? '更新' : '创建' }}
          </n-button>
        </div>
      </template>
    </n-modal>

    <!-- 权限分配模态框 -->
    <n-modal 
      v-model:show="showPermissionModal" 
      preset="card" 
      title="权限分配"
      style="width: 800px"
      :mask-closable="false"
    >
      <div v-if="currentRole">
        <n-alert type="info" style="margin-bottom: 16px;">
          为角色 <strong>{{ currentRole.name }}</strong> 分配权限
        </n-alert>
        
        <n-spin :show="permissionLoading">
          <n-tree
            ref="permissionTreeRef"
            :data="permissionTreeData"
            :checkable="true"
            :cascade="true"
            :check-strategy="'all'"
            :checked-keys="checkedPermissionKeys"
            :expanded-keys="expandedKeys"
            key-field="id"
            label-field="name"
            children-field="children"
            @update:checked-keys="handlePermissionCheck"
            @update:expanded-keys="handleExpand"
          />
        </n-spin>
      </div>

      <template #footer>
        <div class="modal-footer">
          <n-button @click="handleCancelPermission">取消</n-button>
          <n-button type="primary" :loading="permissionSubmitting" @click="handleSubmitPermission">
            保存权限
          </n-button>
        </div>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, h } from 'vue'
import { 
  AddOutline,
  SearchOutline, 
  CreateOutline,
  KeyOutline,
  TrashOutline
} from '@vicons/ionicons5'
import type { FormInst, FormRules, DataTableColumns, TreeOption } from 'naive-ui'
import { useMessage, useDialog, NButton, NTag, NIcon } from 'naive-ui'
import { formatDate } from '@stone/shared'
import { 
  getRoleList, 
  createRole, 
  updateRole, 
  deleteRole,
  batchUpdateRoleStatus,
  assignPermissionsToRole,
  getRolePermissions,
  getPermissionTree
} from '@/utils/api'

// 角色接口定义
interface Role {
  id: string
  name: string
  code: string
  description?: string
  status: 'ACTIVE' | 'INACTIVE'
  createdAt: string
  updatedAt: string
  _count?: {
    admin_roles: number
    role_permissions: number
  }
}

// 权限接口定义
interface Permission {
  id: string
  key: string
  name: string
  type: 'MENU' | 'PAGE' | 'API' | 'ACTION'
  parentId?: string
  enabled: boolean
  children?: Permission[]
}

const message = useMessage()
const dialog = useDialog()

// 响应式数据
const loading = ref(false)
const submitting = ref(false)
const permissionLoading = ref(false)
const permissionSubmitting = ref(false)
const showCreateModal = ref(false)
const showPermissionModal = ref(false)
const editingRole = ref<Role | null>(null)
const currentRole = ref<Role | null>(null)
const selectedRowKeys = ref<string[]>([])
const formRef = ref<FormInst | null>(null)
const permissionTreeRef = ref<any>(null)

// 搜索表单
const searchForm = reactive({
  name: '',
  code: '',
  status: null as 'ACTIVE' | 'INACTIVE' | null
})

// 表单数据
const formData = reactive({
  name: '',
  code: '',
  description: '',
  status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE'
})

// 权限相关数据
const permissionTreeData = ref<TreeOption[]>([])
const checkedPermissionKeys = ref<string[]>([])
const expandedKeys = ref<string[]>([])

// 表格数据
const tableData = ref<Role[]>([])
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
  name: [
    { required: true, message: '请输入角色名称', trigger: ['input', 'blur'] },
    { min: 2, max: 50, message: '角色名称长度为2-50个字符', trigger: ['input', 'blur'] }
  ],
  code: [
    { required: true, message: '请输入角色编码', trigger: ['input', 'blur'] },
    { min: 2, max: 50, message: '角色编码长度为2-50个字符', trigger: ['input', 'blur'] },
    { pattern: /^[a-zA-Z0-9_]+$/, message: '角色编码只能包含字母、数字和下划线', trigger: ['input', 'blur'] }
  ],
  description: [
    { max: 200, message: '描述长度不能超过200个字符', trigger: ['input', 'blur'] }
  ]
}

// 表格列配置
const columns: DataTableColumns<Role> = [
  {
    type: 'selection'
  },
  {
    title: '角色名称',
    key: 'name',
    width: 150
  },
  {
    title: '角色编码',
    key: 'code',
    width: 150
  },
  {
    title: '描述',
    key: 'description',
    width: 200,
    ellipsis: {
      tooltip: true
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
      if (!config) {
        return h(NTag, { type: 'default' }, { default: () => row.status || '未知' })
      }
      return h(NTag, { type: config.type }, { default: () => config.label })
    }
  },
  {
    title: '用户数',
    key: 'userCount',
    width: 100,
    render: (row) => row._count?.admin_roles || 0
  },
  {
    title: '权限数',
    key: 'permissionCount',
    width: 100,
    render: (row) => row._count?.role_permissions || 0
  },
  {
    title: '创建时间',
    key: 'createdAt',
    width: 180,
    render: (row) => formatDate(row.createdAt)
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
            type: 'primary',
            ghost: true,
            onClick: () => handleEdit(row),
            style: { marginRight: '8px' }
          },
          { default: () => '编辑', icon: () => h(NIcon, null, { default: () => h(CreateOutline) }) }
        ),
        h(
          NButton,
          {
            size: 'small',
            type: 'info',
            ghost: true,
            onClick: () => handleAssignPermissions(row),
            style: { marginRight: '8px' }
          },
          { default: () => '权限', icon: () => h(NIcon, null, { default: () => h(KeyOutline) }) }
        ),
        h(
          NButton,
          {
            size: 'small',
            type: 'error',
            ghost: true,
            onClick: () => handleDelete(row)
          },
          { default: () => '删除', icon: () => h(NIcon, null, { default: () => h(TrashOutline) }) }
        )
      ]
    }
  }
]

// 获取角色列表
const fetchRoleList = async () => {
  try {
    loading.value = true
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      ...(searchForm.name && { name: searchForm.name }),
      ...(searchForm.code && { code: searchForm.code }),
      ...(searchForm.status && { status: searchForm.status })
    }
    
    const response = await getRoleList(params)
    if (response.success) {
      tableData.value = response.data.items
      pagination.itemCount = response.data.total
    } else {
      message.error(response.message || '获取角色列表失败')
    }
  } catch (error) {
    message.error('获取角色列表失败，请刷新重试')
  } finally {
    loading.value = false
  }
}

// 获取权限树
const fetchPermissionTree = async () => {
  try {
    permissionLoading.value = true
    const response = await getPermissionTree()
    if (response.success) {
      permissionTreeData.value = buildTreeOptions(response.data)
      // 默认展开所有节点
      expandedKeys.value = getAllNodeKeys(response.data)
    } else {
      message.error(response.message || '获取权限树失败')
    }
  } catch (error) {
    message.error('获取权限树失败')
  } finally {
    permissionLoading.value = false
  }
}

// 构建树形选项
const buildTreeOptions = (permissions: Permission[]): TreeOption[] => {
  return permissions.map(permission => ({
    id: permission.id,
    key: permission.id,
    name: permission.name,
    label: permission.name,
    children: permission.children ? buildTreeOptions(permission.children) : undefined
  }))
}

// 获取所有节点key
const getAllNodeKeys = (permissions: Permission[]): string[] => {
  const keys: string[] = []
  const traverse = (items: Permission[]) => {
    items.forEach(item => {
      keys.push(item.id)
      if (item.children) {
        traverse(item.children)
      }
    })
  }
  traverse(permissions)
  return keys
}

// 搜索
const handleSearch = () => {
  pagination.page = 1
  fetchRoleList()
}

// 重置搜索
const handleReset = () => {
  searchForm.name = ''
  searchForm.code = ''
  searchForm.status = null
  pagination.page = 1
  fetchRoleList()
}

// 分页变化
const handlePageChange = (page: number) => {
  pagination.page = page
  fetchRoleList()
}

const handlePageSizeChange = (pageSize: number) => {
  pagination.pageSize = pageSize
  pagination.page = 1
  fetchRoleList()
}

// 创建角色
const handleCreate = () => {
  editingRole.value = null
  formData.name = ''
  formData.code = ''
  formData.description = ''
  formData.status = 'ACTIVE'
  showCreateModal.value = true
}

// 编辑角色
const handleEdit = (role: Role) => {
  editingRole.value = role
  formData.name = role.name
  formData.code = role.code
  formData.description = role.description || ''
  formData.status = role.status
  showCreateModal.value = true
}

// 删除角色
const handleDelete = (role: Role) => {
  dialog.warning({
    title: '确认删除',
    content: `确定要删除角色 "${role.name}" 吗？此操作不可恢复。`,
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        const response = await deleteRole(role.id)
        if (response.success) {
          message.success('删除成功')
          fetchRoleList()
        } else {
          message.error(response.message || '删除失败')
        }
      } catch (error) {
        message.error('删除角色失败，请重试')
      }
    }
  })
}

// 批量状态更新
const handleBatchStatusUpdate = (status: 'ACTIVE' | 'INACTIVE') => {
  const action = status === 'ACTIVE' ? '启用' : '禁用'
  dialog.info({
    title: `确认${action}`,
    content: `确定要${action}选中的 ${selectedRowKeys.value.length} 个角色吗？`,
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        const response = await batchUpdateRoleStatus({
          ids: selectedRowKeys.value,
          status
        })
        if (response.success) {
          message.success(`${action}成功`)
          selectedRowKeys.value = []
          fetchRoleList()
        } else {
          message.error(response.message || `${action}失败`)
        }
      } catch (error) {
        message.error(`${action}角色失败，请重试`)
      }
    }
  })
}

// 分配权限
const handleAssignPermissions = async (role: Role) => {
  currentRole.value = role
  showPermissionModal.value = true
  
  // 获取权限树（如果还没有加载）
  if (permissionTreeData.value.length === 0) {
    await fetchPermissionTree()
  }
  
  // 获取角色当前权限
  try {
    const response = await getRolePermissions(role.id)
    if (response.success) {
      checkedPermissionKeys.value = response.data.map((p: Permission) => p.id)
    }
  } catch (error) {
    message.error('获取角色权限失败')
  }
}

// 权限选择变化
const handlePermissionCheck = (keys: string[]) => {
  checkedPermissionKeys.value = keys
}

// 展开节点变化
const handleExpand = (keys: string[]) => {
  expandedKeys.value = keys
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    submitting.value = true

    if (editingRole.value) {
      // 更新角色
      const response = await updateRole(editingRole.value.id, {
        name: formData.name,
        description: formData.description,
        status: formData.status
      })
      if (response.success) {
        message.success('更新成功')
        handleCancel()
        fetchRoleList()
      } else {
        message.error(response.message || '更新失败')
      }
    } else {
      // 创建角色
      const response = await createRole({
        name: formData.name,
        code: formData.code,
        description: formData.description
      })
      if (response.success) {
        message.success('创建成功')
        handleCancel()
        fetchRoleList()
      } else {
        message.error(response.message || '创建失败')
      }
    }
  } catch (error) {
    message.warning('请检查表单信息是否填写正确')
  } finally {
    submitting.value = false
  }
}

// 提交权限分配
const handleSubmitPermission = async () => {
  if (!currentRole.value) return

  try {
    permissionSubmitting.value = true
    const response = await assignPermissionsToRole(currentRole.value.id, {
      permissionIds: checkedPermissionKeys.value
    })
    if (response.success) {
      message.success('权限分配成功')
      handleCancelPermission()
      fetchRoleList()
    } else {
      message.error(response.message || '权限分配失败')
    }
  } catch (error) {
    message.error('权限分配失败，请重试')
  } finally {
    permissionSubmitting.value = false
  }
}

// 取消操作
const handleCancel = () => {
  showCreateModal.value = false
  editingRole.value = null
  formData.name = ''
  formData.code = ''
  formData.description = ''
  formData.status = 'ACTIVE'
}

// 取消权限分配
const handleCancelPermission = () => {
  showPermissionModal.value = false
  currentRole.value = null
  checkedPermissionKeys.value = []
}

onMounted(() => {
  fetchRoleList()
})
</script>

<style scoped>
.role-management {
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
