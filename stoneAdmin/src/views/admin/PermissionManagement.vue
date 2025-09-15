<template>
  <div class="permission-management">
    <!-- 搜索和筛选 -->
    <n-card class="search-card">
      <n-form inline :model="searchForm" class="search-form">
        <n-form-item label="权限名称" label-placement="left">
          <n-input 
            v-model:value="searchForm.name" 
            placeholder="请输入权限名称"
            clearable
            @keydown.enter="handleSearch"
            style="width: 180px;"
          />
        </n-form-item>
        <n-form-item label="权限标识" label-placement="left">
          <n-input 
            v-model:value="searchForm.key" 
            placeholder="请输入权限标识"
            clearable
            @keydown.enter="handleSearch"
            style="width: 180px;"
          />
        </n-form-item>
        <n-form-item label="权限类型" label-placement="left">
          <n-select 
            v-model:value="searchForm.type" 
            placeholder="请选择类型"
            clearable
            :options="typeOptions"
            style="width: 140px;"
          />
        </n-form-item>
        <n-form-item label="状态" label-placement="left">
          <n-select 
            v-model:value="searchForm.enabled" 
            placeholder="请选择状态"
            clearable
            :options="enabledOptions"
            style="width: 120px;"
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

    <!-- 视图切换 -->
    <n-card class="view-card">
      <template #header>
        <div class="view-header">
          <span>权限管理</span>
          <div class="view-actions">
            <n-button-group>
              <n-button 
                :type="viewMode === 'tree' ? 'primary' : 'default'"
                @click="setViewMode('tree')"
              >
                <n-icon :size="16" class="mr-1">
                  <GitNetworkOutline />
                </n-icon>
                树形视图
              </n-button>
              <n-button 
                :type="viewMode === 'table' ? 'primary' : 'default'"
                @click="setViewMode('table')"
              >
                <n-icon :size="16" class="mr-1">
                  <GridOutline />
                </n-icon>
                表格视图
              </n-button>
            </n-button-group>
            <n-button type="primary" @click="handleCreate">
              <n-icon :size="16" class="mr-1">
                <AddOutline />
              </n-icon>
              添加权限
            </n-button>
          </div>
        </div>
      </template>

      <!-- 树形视图 -->
      <div v-if="viewMode === 'tree'" class="tree-view">
        <n-spin :show="loading">
          <n-tree
            :data="treeData"
            :expanded-keys="expandedKeys"
            :render-label="renderTreeLabel"
            :render-prefix="renderTreePrefix"
            :render-suffix="renderTreeSuffix"
            key-field="id"
            label-field="name"
            children-field="children"
            @update:expanded-keys="handleExpand"
          />
        </n-spin>
      </div>

      <!-- 表格视图 -->
      <div v-if="viewMode === 'table'" class="table-view">
        <div class="table-actions" style="margin-bottom: 16px;">
          <n-button 
            :disabled="!selectedRowKeys.length"
            @click="handleBatchStatusUpdate(true)"
          >
            批量启用
          </n-button>
          <n-button 
            :disabled="!selectedRowKeys.length"
            @click="handleBatchStatusUpdate(false)"
          >
            批量禁用
          </n-button>
        </div>

        <n-data-table
          :columns="columns"
          :data="tableData"
          :loading="loading"
          :pagination="pagination"
          :row-key="(row: Permission) => row.id"
          v-model:checked-row-keys="selectedRowKeys"
          @update:page="handlePageChange"
          @update:page-size="handlePageSizeChange"
        />
      </div>
    </n-card>

    <!-- 创建/编辑权限模态框 -->
    <n-modal 
      v-model:show="showCreateModal" 
      preset="card" 
      :title="editingPermission ? '编辑权限' : '添加权限'"
      style="width: 700px"
      :mask-closable="false"
    >
      <n-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-placement="left"
        label-width="100px"
      >
        <n-form-item label="权限名称" path="name">
          <n-input 
            v-model:value="formData.name" 
            placeholder="请输入权限名称"
          />
        </n-form-item>
        
        <n-form-item label="权限标识" path="key">
          <n-input 
            v-model:value="formData.key" 
            placeholder="请输入权限标识（如：user.create）"
            :disabled="!!editingPermission"
          />
        </n-form-item>
        
        <n-form-item label="权限类型" path="type">
          <n-select 
            v-model:value="formData.type" 
            :options="typeOptions"
            placeholder="请选择权限类型"
            style="width: 100%;"
          />
        </n-form-item>
        
        <n-form-item label="父级权限" path="parentId">
          <n-tree-select
            v-model:value="formData.parentId"
            :options="parentOptions"
            placeholder="请选择父级权限（可选）"
            clearable
            key-field="id"
            label-field="name"
            children-field="children"
            style="width: 100%;"
          />
        </n-form-item>
        
        <n-form-item v-if="formData.type === 'API'" label="API路径" path="path">
          <n-input 
            v-model:value="formData.path" 
            placeholder="请输入API路径（如：/api/users）"
          />
        </n-form-item>
        
        <n-form-item v-if="formData.type === 'API'" label="HTTP方法" path="method">
          <n-select 
            v-model:value="formData.method" 
            :options="methodOptions"
            placeholder="请选择HTTP方法"
            style="width: 100%;"
          />
        </n-form-item>
        
        <n-form-item label="排序" path="order">
          <n-input-number 
            v-model:value="formData.order" 
            placeholder="排序值（数字越小越靠前）"
            :min="0"
            :max="9999"
            style="width: 100%;"
          />
        </n-form-item>
        
        <n-form-item v-if="editingPermission" label="状态" path="enabled">
          <n-switch 
            v-model:value="formData.enabled"
            :checked-value="true"
            :unchecked-value="false"
          >
            <template #checked>启用</template>
            <template #unchecked>禁用</template>
          </n-switch>
        </n-form-item>
      </n-form>

      <template #footer>
        <div class="modal-footer">
          <n-button @click="handleCancel">取消</n-button>
          <n-button type="primary" :loading="submitting" @click="handleSubmit">
            {{ editingPermission ? '更新' : '创建' }}
          </n-button>
        </div>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, h, computed, watch } from 'vue'
import { 
  AddOutline,
  SearchOutline, 
  CreateOutline,
  TrashOutline,
  GitNetworkOutline,
  GridOutline,
  CheckmarkCircleOutline,
  CloseCircleOutline,
  KeyOutline,
  CodeOutline,
  DocumentTextOutline,
  SettingsOutline
} from '@vicons/ionicons5'
import type { FormInst, FormRules, DataTableColumns, TreeOption } from 'naive-ui'
import { useMessage, useDialog, NButton, NTag, NIcon } from 'naive-ui'
import { formatDate } from '@stone/shared'
import { 
  getPermissionList,
  getPermissionTree,
  createPermission,
  updatePermission,
  deletePermission,
  batchUpdatePermissionStatus
} from '@/utils/api'

// 权限接口定义
interface Permission {
  id: string
  key: string
  name: string
  type: 'MENU' | 'PAGE' | 'API' | 'ACTION'
  parentId?: string
  path?: string
  method?: string
  order: number
  enabled: boolean
  createdAt: string
  updatedAt: string
  children?: Permission[]
}

const message = useMessage()
const dialog = useDialog()

// 响应式数据
const loading = ref(false)
const submitting = ref(false)
const showCreateModal = ref(false)
const editingPermission = ref<Permission | null>(null)
const selectedRowKeys = ref<string[]>([])
const formRef = ref<FormInst | null>(null)
const viewMode = ref<'tree' | 'table'>('tree')

// 搜索表单
const searchForm = reactive({
  name: '',
  key: '',
  type: null as 'MENU' | 'PAGE' | 'API' | 'ACTION' | null,
  enabled: null as boolean | null
})

// 表单数据
const formData = reactive({
  name: '',
  key: '',
  type: 'MENU' as 'MENU' | 'PAGE' | 'API' | 'ACTION',
  parentId: null as string | null,
  path: '',
  method: '',
  order: 0,
  enabled: true
})

// 数据
const treeData = ref<Permission[]>([])
const tableData = ref<Permission[]>([])
const expandedKeys = ref<string[]>([])
const pagination = reactive({
  page: 1,
  pageSize: 20,
  itemCount: 0,
  showSizePicker: true,
  pageSizes: [10, 20, 50, 100]
})

// 选项数据
const typeOptions = [
  { label: '菜单', value: 'MENU' },
  { label: '页面', value: 'PAGE' },
  { label: 'API', value: 'API' },
  { label: '操作', value: 'ACTION' }
]

const enabledOptions = [
  { label: '启用', value: true },
  { label: '禁用', value: false }
]

const methodOptions = [
  { label: 'GET', value: 'GET' },
  { label: 'POST', value: 'POST' },
  { label: 'PUT', value: 'PUT' },
  { label: 'PATCH', value: 'PATCH' },
  { label: 'DELETE', value: 'DELETE' }
]

// 父级权限选项（排除当前编辑的权限）
const parentOptions = computed(() => {
  const buildOptions = (permissions: Permission[]): TreeOption[] => {
    return permissions
      .filter(p => p.id !== editingPermission.value?.id)
      .map(permission => ({
        id: permission.id,
        key: permission.id,
        name: permission.name,
        label: permission.name,
        children: permission.children ? buildOptions(permission.children) : undefined
      }))
  }
  return buildOptions(treeData.value)
})

// 表单验证规则
const formRules = computed((): FormRules => ({
  name: [
    { required: true, message: '请输入权限名称', trigger: ['input', 'blur'] },
    { min: 2, max: 50, message: '权限名称长度为2-50个字符', trigger: ['input', 'blur'] }
  ],
  key: [
    { required: true, message: '请输入权限标识', trigger: ['input', 'blur'] },
    { min: 2, max: 100, message: '权限标识长度为2-100个字符', trigger: ['input', 'blur'] },
    { pattern: /^[a-zA-Z0-9._-]+$/, message: '权限标识只能包含字母、数字、点、下划线和横线', trigger: ['input', 'blur'] }
  ],
  type: [
    { required: true, message: '请选择权限类型', trigger: ['change', 'blur'] }
  ],
  path: formData.type === 'API' ? [
    { required: true, message: '请输入API路径', trigger: ['input', 'blur'] }
  ] : [],
  method: formData.type === 'API' ? [
    { required: true, message: '请选择HTTP方法', trigger: ['change', 'blur'] }
  ] : [],
  order: [
    { type: 'number', message: '排序必须是数字', trigger: ['input', 'blur'] }
  ]
}))

// 权限类型图标映射
const getTypeIcon = (type: string) => {
  switch (type) {
    case 'MENU':
      return DocumentTextOutline
    case 'PAGE':
      return GridOutline
    case 'API':
      return CodeOutline
    case 'ACTION':
      return SettingsOutline
    default:
      return KeyOutline
  }
}

// 权限类型颜色映射
const getTypeColor = (type: string) => {
  switch (type) {
    case 'MENU':
      return 'info'
    case 'PAGE':
      return 'success'
    case 'API':
      return 'warning'
    case 'ACTION':
      return 'error'
    default:
      return 'default'
  }
}

// 表格列配置
const columns: DataTableColumns<Permission> = [
  {
    type: 'selection'
  },
  {
    title: '权限名称',
    key: 'name',
    width: 200
  },
  {
    title: '权限标识',
    key: 'key',
    width: 200,
    render: (row) => h('code', { style: 'font-family: monospace; background: #f5f5f5; padding: 2px 4px; border-radius: 3px;' }, row.key)
  },
  {
    title: '类型',
    key: 'type',
    width: 100,
    render: (row) => {
      const config = typeOptions.find(opt => opt.value === row.type)
      return h(NTag, { 
        type: getTypeColor(row.type),
        size: 'small'
      }, { 
        default: () => config?.label || row.type,
        icon: () => h(NIcon, { size: 14 }, { default: () => h(getTypeIcon(row.type)) })
      })
    }
  },
  {
    title: 'API信息',
    key: 'api',
    width: 200,
    render: (row) => {
      if (row.type === 'API' && row.path) {
        return h('div', [
          h('div', { style: 'font-size: 12px; color: #666;' }, `${row.method || 'GET'} ${row.path}`),
        ])
      }
      return '-'
    }
  },
  {
    title: '排序',
    key: 'order',
    width: 80,
    render: (row) => row.order || 0
  },
  {
    title: '状态',
    key: 'enabled',
    width: 100,
    render: (row) => {
      return h(NTag, { 
        type: row.enabled ? 'success' : 'error',
        size: 'small'
      }, { 
        default: () => row.enabled ? '启用' : '禁用',
        icon: () => h(NIcon, { size: 14 }, { 
          default: () => h(row.enabled ? CheckmarkCircleOutline : CloseCircleOutline) 
        })
      })
    }
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
    width: 150,
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

// 树形视图渲染
const renderTreeLabel = ({ option }: { option: Permission }) => {
  return h('span', { style: 'font-weight: 500;' }, option.name)
}

const renderTreePrefix = ({ option }: { option: Permission }) => {
  return h(NIcon, { 
    size: 16, 
    color: getTypeColor(option.type) === 'info' ? '#1890ff' : 
           getTypeColor(option.type) === 'success' ? '#52c41a' :
           getTypeColor(option.type) === 'warning' ? '#faad14' :
           getTypeColor(option.type) === 'error' ? '#f5222d' : '#666'
  }, { 
    default: () => h(getTypeIcon(option.type)) 
  })
}

const renderTreeSuffix = ({ option }: { option: Permission }) => {
  return h('div', { style: 'display: flex; align-items: center; gap: 8px;' }, [
    h('code', { 
      style: 'font-size: 12px; background: #f5f5f5; padding: 2px 6px; border-radius: 3px; color: #666;' 
    }, option.key),
    h(NTag, { 
      type: getTypeColor(option.type),
      size: 'small'
    }, { 
      default: () => typeOptions.find(opt => opt.value === option.type)?.label || option.type
    }),
    h(NTag, { 
      type: option.enabled ? 'success' : 'error',
      size: 'small'
    }, { 
      default: () => option.enabled ? '启用' : '禁用'
    }),
    h('div', { style: 'display: flex; gap: 4px;' }, [
      h(
        NButton,
        {
          size: 'tiny',
          type: 'primary',
          ghost: true,
          onClick: (e: Event) => {
            e.stopPropagation()
            handleEdit(option)
          }
        },
        { icon: () => h(NIcon, { size: 12 }, { default: () => h(CreateOutline) }) }
      ),
      h(
        NButton,
        {
          size: 'tiny',
          type: 'error',
          ghost: true,
          onClick: (e: Event) => {
            e.stopPropagation()
            handleDelete(option)
          }
        },
        { icon: () => h(NIcon, { size: 12 }, { default: () => h(TrashOutline) }) }
      )
    ])
  ])
}

// 获取权限树
const fetchPermissionTree = async () => {
  try {
    loading.value = true
    const response = await getPermissionTree()
    if (response.success) {
      treeData.value = response.data
      // 默认展开第一层
      expandedKeys.value = response.data.map((item: Permission) => item.id)
    } else {
      message.error(response.message || '获取权限树失败')
    }
  } catch (error) {
    message.error('获取权限树失败，请刷新重试')
  } finally {
    loading.value = false
  }
}

// 获取权限列表（表格视图）
const fetchPermissionList = async () => {
  try {
    loading.value = true
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      ...(searchForm.name && { name: searchForm.name }),
      ...(searchForm.key && { key: searchForm.key }),
      ...(searchForm.type && { type: searchForm.type }),
      ...(searchForm.enabled !== null && { enabled: searchForm.enabled })
    }
    
    const response = await getPermissionList(params)
    if (response.success) {
      tableData.value = response.data.items
      pagination.itemCount = response.data.total
    } else {
      message.error(response.message || '获取权限列表失败')
    }
  } catch (error) {
    message.error('获取权限列表失败，请刷新重试')
  } finally {
    loading.value = false
  }
}

// 设置视图模式
const setViewMode = (mode: 'tree' | 'table') => {
  viewMode.value = mode
  if (mode === 'tree') {
    fetchPermissionTree()
  } else {
    fetchPermissionList()
  }
}

// 搜索
const handleSearch = () => {
  if (viewMode.value === 'tree') {
    fetchPermissionTree()
  } else {
    pagination.page = 1
    fetchPermissionList()
  }
}

// 重置搜索
const handleReset = () => {
  searchForm.name = ''
  searchForm.key = ''
  searchForm.type = null
  searchForm.enabled = null
  if (viewMode.value === 'tree') {
    fetchPermissionTree()
  } else {
    pagination.page = 1
    fetchPermissionList()
  }
}

// 分页变化
const handlePageChange = (page: number) => {
  pagination.page = page
  fetchPermissionList()
}

const handlePageSizeChange = (pageSize: number) => {
  pagination.pageSize = pageSize
  pagination.page = 1
  fetchPermissionList()
}

// 展开节点变化
const handleExpand = (keys: string[]) => {
  expandedKeys.value = keys
}

// 创建权限
const handleCreate = () => {
  editingPermission.value = null
  formData.name = ''
  formData.key = ''
  formData.type = 'MENU'
  formData.parentId = null
  formData.path = ''
  formData.method = ''
  formData.order = 0
  formData.enabled = true
  showCreateModal.value = true
}

// 编辑权限
const handleEdit = (permission: Permission) => {
  editingPermission.value = permission
  formData.name = permission.name
  formData.key = permission.key
  formData.type = permission.type
  formData.parentId = permission.parentId || null
  formData.path = permission.path || ''
  formData.method = permission.method || ''
  formData.order = permission.order || 0
  formData.enabled = permission.enabled
  showCreateModal.value = true
}

// 删除权限
const handleDelete = (permission: Permission) => {
  dialog.warning({
    title: '确认删除',
    content: `确定要删除权限 "${permission.name}" 吗？此操作不可恢复，子权限也会被删除。`,
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        const response = await deletePermission(permission.id)
        if (response.success) {
          message.success('删除成功')
          if (viewMode.value === 'tree') {
            fetchPermissionTree()
          } else {
            fetchPermissionList()
          }
        } else {
          message.error(response.message || '删除失败')
        }
      } catch (error) {
        message.error('删除权限失败，请重试')
      }
    }
  })
}

// 批量状态更新
const handleBatchStatusUpdate = (enabled: boolean) => {
  const action = enabled ? '启用' : '禁用'
  dialog.info({
    title: `确认${action}`,
    content: `确定要${action}选中的 ${selectedRowKeys.value.length} 个权限吗？`,
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        const response = await batchUpdatePermissionStatus({
          ids: selectedRowKeys.value,
          enabled
        })
        if (response.success) {
          message.success(`${action}成功`)
          selectedRowKeys.value = []
          fetchPermissionList()
        } else {
          message.error(response.message || `${action}失败`)
        }
      } catch (error) {
        message.error(`${action}权限失败，请重试`)
      }
    }
  })
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    // 先进行表单验证
    await formRef.value.validate()
  } catch (validationError) {
    // 表单验证失败，不需要显示错误信息，Naive UI会自动显示字段级别的错误
    return
  }

  try {
    submitting.value = true

    const submitData: any = {
      name: formData.name,
      type: formData.type,
      parentId: formData.parentId,
      order: formData.order
    }

    // 只在编辑时包含key字段（创建时key不能为空，编辑时不允许修改）
    if (!editingPermission.value) {
      submitData.key = formData.key
    }

    // API类型包含path和method，非API类型清空这些字段
    if (formData.type === 'API') {
      submitData.path = formData.path
      submitData.method = formData.method
    } else {
      // 非API类型时，明确设置为null以清空数据库中的值
      submitData.path = null
      submitData.method = null
    }

    // 编辑时包含enabled状态
    if (editingPermission.value) {
      submitData.enabled = formData.enabled
    }

    if (editingPermission.value) {
      // 更新权限
      const response = await updatePermission(editingPermission.value.id, submitData)
      if (response.success) {
        message.success('更新成功')
        handleCancel()
        if (viewMode.value === 'tree') {
          fetchPermissionTree()
        } else {
          fetchPermissionList()
        }
      } else {
        message.error(response.message || '更新失败')
      }
    } else {
      // 创建权限
      const response = await createPermission(submitData)
      if (response.success) {
        message.success('创建成功')
        handleCancel()
        if (viewMode.value === 'tree') {
          fetchPermissionTree()
        } else {
          fetchPermissionList()
        }
      } else {
        message.error(response.message || '创建失败')
      }
    }
  } catch (error: any) {
    // API调用错误，显示后端返回的具体错误信息
    const errorMessage = error.response?.data?.message || error.message || '操作失败，请重试'
    message.error(errorMessage)
  } finally {
    submitting.value = false
  }
}

// 取消操作
const handleCancel = () => {
  showCreateModal.value = false
  editingPermission.value = null
  formData.name = ''
  formData.key = ''
  formData.type = 'MENU'
  formData.parentId = null
  formData.path = ''
  formData.method = ''
  formData.order = 0
  formData.enabled = true
}

// 监听权限类型变化，清空API相关字段
watch(() => formData.type, (newType) => {
  if (newType !== 'API') {
    formData.path = ''
    formData.method = ''
  }
})

onMounted(() => {
  fetchPermissionTree()
})
</script>

<style scoped>
.permission-management {
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

.view-card {
  margin-bottom: 16px;
}

.view-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.view-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.tree-view {
  min-height: 400px;
}

.table-view {
  min-height: 400px;
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

/* 树形视图样式 */
:deep(.n-tree .n-tree-node-content) {
  padding: 8px 0;
}

:deep(.n-tree .n-tree-node-content:hover) {
  background: #f5f7fa;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .search-form {
    flex-direction: column;
  }
  
  .view-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }
  
  .view-actions {
    width: 100%;
    justify-content: space-between;
  }
  
  .table-actions {
    flex-wrap: wrap;
  }
}
</style>
