<template>
  <div class="user-permission-management">
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
        <n-form-item label="角色" label-placement="left">
          <n-select 
            v-model:value="searchForm.roleCode" 
            placeholder="请选择角色"
            clearable
            :options="roleOptions"
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
          <span>用户权限管理</span>
          <div class="table-actions">
            <n-button 
              :disabled="!selectedRowKeys.length"
              @click="handleBatchAssignRoles"
            >
              <n-icon :size="16" class="mr-1">
                <KeyOutline />
              </n-icon>
              批量分配角色
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

    <!-- 角色分配模态框 -->
    <n-modal 
      v-model:show="showRoleModal" 
      preset="card" 
      title="角色分配"
      style="width: 600px"
      :mask-closable="false"
    >
      <div v-if="currentUser">
        <n-alert type="info" style="margin-bottom: 16px;">
          为用户 <strong>{{ currentUser.account }}</strong> 分配角色
        </n-alert>
        
        <n-spin :show="roleLoading">
          <div class="role-assignment">
            <div class="available-roles">
              <h4>可用角色</h4>
              <n-checkbox-group v-model:value="selectedRoles">
                <n-space vertical>
                  <n-checkbox 
                    v-for="role in availableRoles" 
                    :key="role.id" 
                    :value="role.id"
                    :label="role.name"
                  >
                    <div class="role-item">
                      <div class="role-info">
                        <span class="role-name">{{ role.name }}</span>
                        <span class="role-code">{{ role.code }}</span>
                      </div>
                      <div class="role-description">{{ role.description }}</div>
                    </div>
                  </n-checkbox>
                </n-space>
              </n-checkbox-group>
            </div>
          </div>
        </n-spin>
      </div>

      <template #footer>
        <div class="modal-footer">
          <n-button @click="handleCancelRole">取消</n-button>
          <n-button type="primary" :loading="roleSubmitting" @click="handleSubmitRole">
            保存角色
          </n-button>
        </div>
      </template>
    </n-modal>

    <!-- 批量角色分配模态框 -->
    <n-modal 
      v-model:show="showBatchRoleModal" 
      preset="card" 
      title="批量角色分配"
      style="width: 600px"
      :mask-closable="false"
    >
      <div>
        <n-alert type="info" style="margin-bottom: 16px;">
          为选中的 <strong>{{ selectedRowKeys.length }}</strong> 个用户批量分配角色
        </n-alert>
        
        <n-spin :show="roleLoading">
          <div class="batch-role-assignment">
            <n-form label-placement="left" label-width="100px">
              <n-form-item label="分配方式">
                <n-radio-group v-model:value="batchAssignMode">
                  <n-radio value="add">追加角色</n-radio>
                  <n-radio value="replace">替换角色</n-radio>
                </n-radio-group>
              </n-form-item>
              <n-form-item label="选择角色">
                <n-checkbox-group v-model:value="batchSelectedRoles">
                  <n-space vertical>
                    <n-checkbox 
                      v-for="role in availableRoles" 
                      :key="role.id" 
                      :value="role.id"
                      :label="role.name"
                    >
                      <div class="role-item">
                        <div class="role-info">
                          <span class="role-name">{{ role.name }}</span>
                          <span class="role-code">{{ role.code }}</span>
                        </div>
                        <div class="role-description">{{ role.description }}</div>
                      </div>
                    </n-checkbox>
                  </n-space>
                </n-checkbox-group>
              </n-form-item>
            </n-form>
          </div>
        </n-spin>
      </div>

      <template #footer>
        <div class="modal-footer">
          <n-button @click="handleCancelBatchRole">取消</n-button>
          <n-button type="primary" :loading="roleSubmitting" @click="handleSubmitBatchRole">
            批量分配
          </n-button>
        </div>
      </template>
    </n-modal>

    <!-- 用户权限详情模态框 -->
    <n-modal 
      v-model:show="showPermissionModal" 
      preset="card" 
      title="用户权限详情"
      style="width: 800px"
      :mask-closable="false"
    >
      <div v-if="currentUser">
        <n-alert type="info" style="margin-bottom: 16px;">
          用户 <strong>{{ currentUser.account }}</strong> 的权限详情
        </n-alert>
        
        <n-spin :show="permissionLoading">
          <n-tabs type="line" animated>
            <!-- 角色信息 -->
            <n-tab-pane name="roles" tab="用户角色">
              <div class="user-roles">
                <n-space v-if="userRoles.length > 0">
                  <n-tag 
                    v-for="role in userRoles" 
                    :key="role.id"
                    type="info"
                    size="large"
                    closable
                    @close="handleRemoveUserRole(role.id)"
                  >
                    <template #icon>
                      <n-icon><KeyOutline /></n-icon>
                    </template>
                    {{ role.name }}
                  </n-tag>
                </n-space>
                <n-empty v-else description="该用户暂无分配角色" />
              </div>
            </n-tab-pane>

            <!-- 权限列表 -->
            <n-tab-pane name="permissions" tab="权限列表">
              <div class="user-permissions">
                <n-tree
                  v-if="userPermissionTree.length > 0"
                  :data="userPermissionTree"
                  :expanded-keys="permissionExpandedKeys"
                  :render-label="renderPermissionLabel"
                  :render-prefix="renderPermissionPrefix"
                  key-field="id"
                  label-field="name"
                  children-field="children"
                  @update:expanded-keys="handlePermissionExpand"
                />
                <n-empty v-else description="该用户暂无权限" />
              </div>
            </n-tab-pane>

            <!-- 菜单权限 -->
            <n-tab-pane name="menu" tab="菜单权限">
              <div class="user-menu-permissions">
                <n-tree
                  v-if="userMenuPermissions.length > 0"
                  :data="userMenuPermissions"
                  :expanded-keys="menuExpandedKeys"
                  :render-label="renderMenuLabel"
                  :render-prefix="renderMenuPrefix"
                  key-field="id"
                  label-field="name"
                  children-field="children"
                  @update:expanded-keys="handleMenuExpand"
                />
                <n-empty v-else description="该用户暂无菜单权限" />
              </div>
            </n-tab-pane>
          </n-tabs>
        </n-spin>
      </div>

      <template #footer>
        <div class="modal-footer">
          <n-button @click="handleCancelPermission">关闭</n-button>
        </div>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, h, computed } from 'vue'
import { 
  SearchOutline, 
  CreateOutline,
  KeyOutline,
  EyeOutline,
  PersonAddOutline,
  DocumentTextOutline,
  GridOutline,
  CodeOutline,
  SettingsOutline
} from '@vicons/ionicons5'
import type { DataTableColumns } from 'naive-ui'
import { useMessage, useDialog, NButton, NTag, NIcon } from 'naive-ui'
import type { Admin } from '@stone/shared'
import { AdminType, UserStatus, formatDate } from '@stone/shared'
import { 
  getAdminList,
  getAvailableRoles,
  assignRolesToUser,
  getUserRoles,
  removeUserRole,
  getUserPermissions,
  getUserMenuPermissions,
  batchAssignRolesToUsers
} from '@/utils/api'

// 角色和权限接口定义
interface Role {
  id: string
  name: string
  code: string
  description?: string
  status: 'ACTIVE' | 'INACTIVE'
}

interface Permission {
  id: string
  key: string
  name: string
  type: 'MENU' | 'PAGE' | 'API' | 'ACTION'
  parentId?: string
  enabled: boolean
  children?: Permission[]
  isOrphaned?: boolean  // 标识是否为孤立权限（父权限不在当前权限列表中）
}

interface UserPermissions {
  roles: Role[]
  permissions: Permission[]
  permissionKeys: string[]
}

const message = useMessage()
const dialog = useDialog()

// 响应式数据
const loading = ref(false)
const roleLoading = ref(false)
const roleSubmitting = ref(false)
const permissionLoading = ref(false)
const showRoleModal = ref(false)
const showBatchRoleModal = ref(false)
const showPermissionModal = ref(false)
const currentUser = ref<Admin | null>(null)
const selectedRowKeys = ref<string[]>([])

// 搜索表单
const searchForm = reactive({
  account: '',
  type: null as AdminType | null,
  roleCode: null as string | null,
  status: null as UserStatus | null
})

// 角色分配相关数据
const availableRoles = ref<Role[]>([])
const selectedRoles = ref<string[]>([])
const batchSelectedRoles = ref<string[]>([])
const batchAssignMode = ref<'add' | 'replace'>('add')

// 用户权限相关数据
const userRoles = ref<Role[]>([])
const userPermissionTree = ref<Permission[]>([])
const userMenuPermissions = ref<Permission[]>([])
const permissionExpandedKeys = ref<string[]>([])
const menuExpandedKeys = ref<string[]>([])

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

// 角色选项（从可用角色生成）
const roleOptions = computed(() => {
  return availableRoles.value.map(role => ({
    label: role.name,
    value: role.code
  }))
})

// 权限类型图标映射
const getPermissionTypeIcon = (type: string) => {
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
const getPermissionTypeColor = (type: string) => {
  switch (type) {
    case 'MENU':
      return '#1890ff'
    case 'PAGE':
      return '#52c41a'
    case 'API':
      return '#faad14'
    case 'ACTION':
      return '#f5222d'
    default:
      return '#666'
  }
}

// 构建权限树结构
const buildPermissionTree = (permissions: Permission[]): Permission[] => {
  if (!permissions || permissions.length === 0) {
    return []
  }

  console.log('开始构建权限树，权限数量:', permissions.length)
  
  // 创建权限映射
  const permissionMap = new Map<string, Permission>()
  const rootPermissions: Permission[] = []
  const orphanedPermissions: Permission[] = []

  // 首先将所有权限添加到映射中，并初始化children数组
  permissions.forEach(permission => {
    const permissionWithChildren = {
      ...permission,
      children: [] as Permission[]
    }
    permissionMap.set(permission.id, permissionWithChildren)
    console.log(`映射权限: ${permission.name} (${permission.id}) - 父权限ID: ${permission.parentId || '无'}`)
  })

  // 按层级排序，确保父权限先处理
  const sortedPermissions = [...permissions].sort((a, b) => {
    // 没有父权限的排在前面
    if (!a.parentId && b.parentId) return -1
    if (a.parentId && !b.parentId) return 1
    return 0
  })

  // 构建树形结构
  sortedPermissions.forEach(permission => {
    const permissionNode = permissionMap.get(permission.id)!
    
    if (permission.parentId) {
      // 有父权限ID，尝试找到父权限
      const parent = permissionMap.get(permission.parentId)
      if (parent) {
        // 父权限存在，添加到父权限的children中
        if (!parent.children) {
          parent.children = []
        }
        parent.children.push(permissionNode)
        console.log(`添加子权限: ${permission.name} -> 父权限: ${parent.name}`)
      } else {
        // 父权限不存在于当前用户权限列表中，作为孤立权限处理
        console.warn(`权限 ${permission.name} (${permission.id}) 的父权限 ${permission.parentId} 不在用户权限列表中`)
        orphanedPermissions.push(permissionNode)
      }
    } else {
      // 没有父权限，作为根节点
      rootPermissions.push(permissionNode)
      console.log(`添加根权限: ${permission.name}`)
    }
  })

  // 将孤立权限也添加到根级别，但添加特殊标识
  orphanedPermissions.forEach(permission => {
    // 为孤立权限添加特殊标识，便于前端显示
    permission.isOrphaned = true
    rootPermissions.push(permission)
    console.log(`添加孤立权限到根级别: ${permission.name}`)
  })

  // 递归排序子权限
  const sortChildren = (permissions: Permission[]): Permission[] => {
    return permissions.sort((a, b) => {
      // 孤立权限排在后面
      if (a.isOrphaned && !b.isOrphaned) return 1
      if (!a.isOrphaned && b.isOrphaned) return -1
      // 按名称排序
      return a.name.localeCompare(b.name)
    }).map(permission => ({
      ...permission,
      children: permission.children ? sortChildren(permission.children) : []
    }))
  }

  const result = sortChildren(rootPermissions)
  console.log('权限树构建完成，根权限数量:', result.length)
  console.log('权限树结构:', result)
  
  return result
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
    title: '当前角色',
    key: 'roles',
    width: 200,
    render: (row) => {
      if (!row.roles || row.roles.length === 0) {
        return h(NTag, { size: 'small', type: 'default' }, { default: () => '无角色' })
      }
      
      return h('div', { style: 'display: flex; gap: 4px; flex-wrap: wrap;' }, 
        row.roles.map((role: any) => 
          h(NTag, { 
            key: role.id,
            size: 'small', 
            type: 'info' 
          }, { 
            default: () => role.name 
          })
        )
      )
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
    title: '最后登录',
    key: 'lastLoginAt',
    width: 180,
    render: (row) => row.lastLoginAt ? formatDate(row.lastLoginAt) : '-'
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
            onClick: () => handleAssignRoles(row),
            style: { marginRight: '8px' }
          },
          { default: () => '分配角色', icon: () => h(NIcon, null, { default: () => h(KeyOutline) }) }
        ),
        h(
          NButton,
          {
            size: 'small',
            type: 'info',
            ghost: true,
            onClick: () => handleViewPermissions(row)
          },
          { default: () => '查看权限', icon: () => h(NIcon, null, { default: () => h(EyeOutline) }) }
        )
      ]
    }
  }
]

// 权限树渲染函数
const renderPermissionLabel = ({ option }: { option: Permission }) => {
  const labelStyle = option.isOrphaned 
    ? 'font-weight: 500; color: #faad14; font-style: italic;' 
    : 'font-weight: 500;'
  
  const elements = [h('span', { style: labelStyle }, option.name)]
  
  // 为孤立权限添加标识
  if (option.isOrphaned) {
    elements.push(
      h('span', { 
        style: 'margin-left: 8px; font-size: 12px; color: #faad14; background: #fff7e6; padding: 2px 6px; border-radius: 3px; border: 1px solid #ffd591;' 
      }, '孤立权限')
    )
  }
  
  return h('div', { style: 'display: flex; align-items: center;' }, elements)
}

const renderPermissionPrefix = ({ option }: { option: Permission }) => {
  return h(NIcon, { 
    size: 16, 
    color: getPermissionTypeColor(option.type)
  }, { 
    default: () => h(getPermissionTypeIcon(option.type)) 
  })
}

// 菜单权限树渲染函数
const renderMenuLabel = ({ option }: { option: Permission }) => {
  return h('div', { style: 'display: flex; align-items: center; gap: 8px;' }, [
    h('span', { style: 'font-weight: 500;' }, option.name),
    h('code', { 
      style: 'font-size: 12px; background: #f5f5f5; padding: 2px 6px; border-radius: 3px; color: #666;' 
    }, option.key)
  ])
}

const renderMenuPrefix = ({ option }: { option: Permission }) => {
  return h(NIcon, { 
    size: 16, 
    color: getPermissionTypeColor(option.type)
  }, { 
    default: () => h(getPermissionTypeIcon(option.type)) 
  })
}

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
      message.error(response.message || '获取用户列表失败')
    }
  } catch (error) {
    message.error('获取用户列表失败，请刷新重试')
  } finally {
    loading.value = false
  }
}

// 获取可用角色
const fetchAvailableRoles = async () => {
  try {
    const response = await getAvailableRoles()
    if (response.success) {
      availableRoles.value = response.data
    } else {
      message.error(response.message || '获取可用角色失败')
    }
  } catch (error) {
    message.error('获取可用角色失败')
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
  searchForm.roleCode = null
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

// 分配角色
const handleAssignRoles = async (user: Admin) => {
  currentUser.value = user
  showRoleModal.value = true
  
  // 获取可用角色（如果还没有加载）
  if (availableRoles.value.length === 0) {
    await fetchAvailableRoles()
  }
  
  // 获取用户当前角色
  try {
    roleLoading.value = true
    const response = await getUserRoles(user.id)
    if (response.success) {
      selectedRoles.value = response.data.map((role: Role) => role.id)
    }
  } catch (error) {
    message.error('获取用户角色失败')
  } finally {
    roleLoading.value = false
  }
}

// 批量分配角色
const handleBatchAssignRoles = async () => {
  if (selectedRowKeys.value.length === 0) {
    message.warning('请先选择要分配角色的用户')
    return
  }
  
  showBatchRoleModal.value = true
  batchSelectedRoles.value = []
  batchAssignMode.value = 'add'
  
  // 获取可用角色（如果还没有加载）
  if (availableRoles.value.length === 0) {
    await fetchAvailableRoles()
  }
}

// 查看用户权限
const handleViewPermissions = async (user: Admin) => {
  currentUser.value = user
  showPermissionModal.value = true
  
  try {
    permissionLoading.value = true
    
    console.log(`[权限查看] 开始获取用户权限: ${user.account} (${user.id})`)
    
    // 获取用户角色
    const rolesResponse = await getUserRoles(user.id)
    if (rolesResponse.success) {
      userRoles.value = rolesResponse.data
      console.log(`[权限查看] 用户角色数量: ${rolesResponse.data.length}`)
    }
    
    // 强制从服务器获取最新的用户权限（不使用缓存）
    const permissionsResponse = await getUserPermissions(user.id, true)
    if (permissionsResponse.success) {
      // 将扁平的权限数据转换为树形结构
      const flatPermissions = permissionsResponse.data.permissions || []
      
      // 详细调试信息：打印权限数据
      console.log(`[权限查看] 用户权限数据:`, flatPermissions)
      console.log(`[权限查看] 权限数量: ${flatPermissions.length}`)
      
      // 检查权限的父子关系和数据完整性
      console.log(`[权限查看] 权限详细信息:`)
      flatPermissions.forEach((p, index) => {
        console.log(`  ${index + 1}. 权限: ${p.name} (${p.key})`)
        console.log(`     - ID: ${p.id}`)
        console.log(`     - 类型: ${p.type}`)
        console.log(`     - 父权限ID: ${p.parentId || '无'}`)
        console.log(`     - 启用状态: ${p.enabled}`)
      })
      
      // 检查是否存在父子关系
      const hasParentChild = flatPermissions.some(p => p.parentId)
      console.log(`[权限查看] 是否存在父子关系: ${hasParentChild}`)
      
      if (!hasParentChild && flatPermissions.length > 0) {
        console.warn(`[权限查看] 警告: 所有权限都没有父权限ID，可能存在数据问题`)
      }
      
      // 构建权限树
      console.log(`[权限查看] 开始构建权限树...`)
      userPermissionTree.value = buildPermissionTree(flatPermissions)
      console.log(`[权限查看] 构建的权限树:`, userPermissionTree.value)
      console.log(`[权限查看] 根权限数量: ${userPermissionTree.value.length}`)
      
      // 默认展开第一层
      permissionExpandedKeys.value = userPermissionTree.value.map(p => p.id)
      console.log(`[权限查看] 展开的权限键: ${permissionExpandedKeys.value.join(', ')}`)
    } else {
      console.error(`[权限查看] 获取用户权限失败:`, permissionsResponse.message)
    }
    
    // 获取用户菜单权限
    const menuResponse = await getUserMenuPermissions(user.id)
    if (menuResponse.success) {
      userMenuPermissions.value = menuResponse.data || []
      console.log(`[权限查看] 菜单权限数量: ${userMenuPermissions.value.length}`)
      // 默认展开第一层
      menuExpandedKeys.value = userMenuPermissions.value.map(p => p.id)
    } else {
      console.error(`[权限查看] 获取菜单权限失败:`, menuResponse.message)
    }
  } catch (error) {
    console.error(`[权限查看] 获取用户权限异常:`, error)
    message.error('获取用户权限失败')
  } finally {
    permissionLoading.value = false
    console.log(`[权限查看] 权限获取流程完成`)
  }
}

// 移除用户角色
const handleRemoveUserRole = async (roleId: string) => {
  if (!currentUser.value) return
  
  dialog.warning({
    title: '确认移除',
    content: '确定要移除该角色吗？',
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        const response = await removeUserRole(currentUser.value!.id, roleId)
        if (response.success) {
          message.success('移除角色成功')
          // 重新获取用户角色
          const rolesResponse = await getUserRoles(currentUser.value!.id)
          if (rolesResponse.success) {
            userRoles.value = rolesResponse.data
          }
        } else {
          message.error(response.message || '移除角色失败')
        }
      } catch (error) {
        message.error('移除角色失败，请重试')
      }
    }
  })
}

// 权限展开变化
const handlePermissionExpand = (keys: string[]) => {
  permissionExpandedKeys.value = keys
}

// 菜单展开变化
const handleMenuExpand = (keys: string[]) => {
  menuExpandedKeys.value = keys
}

// 提交角色分配
const handleSubmitRole = async () => {
  if (!currentUser.value) return

  try {
    roleSubmitting.value = true
    const response = await assignRolesToUser(currentUser.value.id, {
      roleIds: selectedRoles.value
    })
    if (response.success) {
      message.success('角色分配成功')
      handleCancelRole()
      fetchAdminList()
    } else {
      message.error(response.message || '角色分配失败')
    }
  } catch (error) {
    message.error('角色分配失败，请重试')
  } finally {
    roleSubmitting.value = false
  }
}

// 提交批量角色分配
const handleSubmitBatchRole = async () => {
  if (batchSelectedRoles.value.length === 0) {
    message.warning('请选择要分配的角色')
    return
  }

  try {
    roleSubmitting.value = true
    const response = await batchAssignRolesToUsers({
      userIds: selectedRowKeys.value,
      roleIds: batchSelectedRoles.value
    })
    if (response.success) {
      message.success('批量角色分配成功')
      handleCancelBatchRole()
      selectedRowKeys.value = []
      fetchAdminList()
    } else {
      message.error(response.message || '批量角色分配失败')
    }
  } catch (error) {
    message.error('批量角色分配失败，请重试')
  } finally {
    roleSubmitting.value = false
  }
}

// 取消角色分配
const handleCancelRole = () => {
  showRoleModal.value = false
  currentUser.value = null
  selectedRoles.value = []
}

// 取消批量角色分配
const handleCancelBatchRole = () => {
  showBatchRoleModal.value = false
  batchSelectedRoles.value = []
  batchAssignMode.value = 'add'
}

// 取消权限查看
const handleCancelPermission = () => {
  showPermissionModal.value = false
  currentUser.value = null
  userRoles.value = []
  userPermissionTree.value = []
  userMenuPermissions.value = []
  permissionExpandedKeys.value = []
  menuExpandedKeys.value = []
}

onMounted(() => {
  fetchAdminList()
  fetchAvailableRoles()
})
</script>

<style scoped>
.user-permission-management {
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

/* 角色分配样式 */
.role-assignment {
  max-height: 400px;
  overflow-y: auto;
}

.batch-role-assignment {
  max-height: 400px;
  overflow-y: auto;
}

.role-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.role-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.role-name {
  font-weight: 500;
}

.role-code {
  font-size: 12px;
  color: #666;
  background: #f5f5f5;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: monospace;
}

.role-description {
  font-size: 12px;
  color: #999;
}

/* 用户权限详情样式 */
.user-roles {
  min-height: 100px;
  padding: 16px 0;
}

.user-permissions {
  min-height: 300px;
  padding: 16px 0;
}

.user-menu-permissions {
  min-height: 300px;
  padding: 16px 0;
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
