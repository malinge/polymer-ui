<template>
  <div class="user-transfer-container">
    <el-dialog
        v-model="dialogVisible"
        :title="title"
        width="940px"
        :close-on-click-modal="false"
    >
      <div class="user-transfer-dialog">
        <!-- 左侧组织部门树 -->
        <div class="tree-container">
          <div class="dept-title">组织部门</div>
          <!-- 部门搜索框 -->
          <el-input
              class="my-el-input"
              :prefix-icon="Search"
              v-model="deptName"
              clearable
              placeholder="请输入搜索内容"
              @input="handleSearchInput"
          />
          <div class="tree-scroll-container">
            <!-- 部门树组件 -->
            <el-tree
                ref="deptTreeRef"
                :data="deptTree"
                node-key="id"
                :props="{ label: 'name', children: 'children' }"
                :highlight-current="true"
                :expand-on-click-node="false"
                @node-click="handleNodeClick"
                :filter-node-method="filterNode"
            />
          </div>
        </div>

        <!-- 右侧人员穿梭框 -->
        <div class="transfer-content">
          <el-transfer
              v-model="selectedUserIds"
              filterable
              :filter-method="filterMethod"
              :titles="['待选人员', '已选人员']"
              :props="{ key: 'id', label: 'username' }"
              :data="leftUsers"
              @change="handleTransferChange"
          />
        </div>
      </div>

      <!-- 对话框底部按钮 -->
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmSelection">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, PropType } from 'vue'
import { ElTree, ElMessage } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { useDeptListApi } from '@/api/sys/dept'
import { useListByDeptIdApi } from '@/api/sys/user'

// 用户接口定义
interface User {
  id: number
  username: string
}

// 组织部门接口定义
interface Dept {
  id: number
  name: string
  children?: Dept[]
}

// 组件属性定义
const props = defineProps({
  // 对话框标题
  title: {
    type: String,
    default: '选择负责人'
  },
  // 是否多选模式
  multiple: {
    type: Boolean,
    default: false
  },
  // 默认选中的用户ID
  defaultValue: {
    type: [Number, Array] as PropType<number | number[]>,
    default: null
  }
})

// 组件事件定义
const emit = defineEmits(['confirm'])

// ============== 状态变量定义 ==============
const dialogVisible = ref(false)          // 对话框显示状态
const deptTree = ref<Dept[]>([])            // 组织部门树数据
const deptTreeRef = ref<InstanceType<typeof ElTree>>() // 树组件引用
const currentDeptId = ref<number>(0)       // 当前选中的部门ID
const leftUsers = ref<User[]>([])         // 左侧待选人员列表
const selectedUserIds = ref<number[]>([]) // 已选择的用户ID列表
const deptName = ref('')                   // 部门搜索关键字

// ============== 初始化逻辑 ==============
onMounted(async () => {
  // 组件挂载时加载部门树
  await loadDeptTree()

  // 默认选中第一个节点
  if (deptTree.value.length > 0) {
    const firstNode = deptTree.value[0]
    deptTreeRef.value?.setCurrentKey(firstNode.id)
    handleNodeClick(firstNode)
  }
})

// ============== 方法定义 ==============

/**
 * 打开对话框
 * @param defaultValue - 默认选中的用户ID（可选）
 */
const open = (defaultValue?: number | number[]) => {
  dialogVisible.value = true
  selectedUserIds.value = []

  // 设置默认值 - 使用传入的值或props.defaultValue
  const initValue = defaultValue !== undefined ? defaultValue : props.defaultValue

  if (initValue !== null && initValue !== undefined) {
    if (props.multiple) {
      // 多选模式：直接设置数组
      selectedUserIds.value = Array.isArray(initValue) ? [...initValue] : [initValue]
    } else {
      // 单选模式：确保是数组形式
      selectedUserIds.value = Array.isArray(initValue) && initValue.length > 0
          ? [initValue[0]]
          : (typeof initValue === 'number' ? [initValue] : [])
    }
  }

  // 如果部门树未加载，则加载部门树
  if (deptTree.value.length === 0) {
    loadDeptTree().then(() => {
      if (deptTree.value.length > 0) {
        const firstNode = deptTree.value[0]
        deptTreeRef.value?.setCurrentKey(firstNode.id)
        handleNodeClick(firstNode)
      }
    })
  }
}

/**
 * 加载组织部门树
 */
const loadDeptTree = async () => {
  try {
    const res = await useDeptListApi()
    deptTree.value = res.data || []
  } catch (error) {
    console.error('加载组织部门树失败:', error)
    ElMessage.error('加载组织部门失败')
  }
}

/**
 * 加载指定部门下的用户
 * @param deptId - 部门ID
 */
const loadUsersByDept = async (deptId: number) => {
  try {
    const res = await useListByDeptIdApi(deptId)
    leftUsers.value = res.data || [] // 确保总是数组
  } catch (error) {
    console.error(`加载部门${deptId}下的用户失败:`, error)
    ElMessage.error('加载用户列表失败')
    leftUsers.value = []
  }
}

/**
 * 树节点过滤方法
 * @param name - 过滤条件
 * @param data - 节点数据
 * @returns 是否符合条件
 */
const filterNode = (name: string, data: any) => {
  if (!name) return true
  return data.name.includes(name)
}

/**
 * 安全字符串转换（用于搜索）
 * @param str - 输入字符串
 * @returns 小写字符串或空字符串
 */
const safeToLower = (str: string | null | undefined): string => {
  return str ? str.toLowerCase() : ''
}

// ============== 事件处理函数 ==============

/**
 * 部门搜索输入处理
 */
const handleSearchInput = () => {
  deptTreeRef.value!.filter(deptName.value)
}

/**
 * 树节点点击事件
 * @param node - 点击的节点数据
 */
const handleNodeClick = (node: Dept) => {
  currentDeptId.value = node.id
  loadUsersByDept(node.id)
}

/**
 * 穿梭框筛选方法
 * @param query - 搜索关键字
 * @param item - 用户项
 * @returns 是否符合条件
 */
const filterMethod = (query: string, item: User) => {
  return safeToLower(item.username).includes(safeToLower(query))
}

/**
 * 处理穿梭框变化事件
 * @param newSelected - 新的选中用户ID列表
 * @param direction - 移动方向（'left' 或 'right'）
 * @param movedKeys - 被移动的键列表
 */
const handleTransferChange = (newSelected: number[], direction: 'left' | 'right', movedKeys: number[]) => {
  // 单选模式下特殊处理：当从左侧添加新用户时，替换现有选择
  if (!props.multiple && direction === 'right' && movedKeys.length > 0) {
    // 只保留最新添加的用户
    selectedUserIds.value = [movedKeys[movedKeys.length - 1]]
  }
}

/**
 * 确认选择
 */
const confirmSelection = () => {
  // 单选模式校验
  if (!props.multiple && selectedUserIds.value.length > 1) {
    ElMessage.warning('单选模式下只能选择一个用户')
    return
  }

  // 获取选中用户的详细信息
  const selectedUsers = selectedUserIds.value.map(id =>
      leftUsers.value.find(user => user.id === id) || { id, username: `未知用户(${id})` }
  )

  // 根据模式触发不同的事件
  if (props.multiple) {
    emit('confirm', selectedUsers)
  } else {
    emit('confirm', selectedUsers.length > 0 ? selectedUsers[0] : null)
  }

  dialogVisible.value = false
}

// ============== 监听器 ==============

/**
 * 监听选中用户ID的变化（用于单选模式处理）
 */
watch(selectedUserIds, (newVal) => {
  // 单选模式下确保最多只能选择一个用户
  if (!props.multiple && newVal.length > 1) {
    // 保留最后一个选择的用户
    selectedUserIds.value = [newVal[newVal.length - 1]]
  }
})

// 暴露open方法供外部使用
defineExpose({ open })
</script>

<style scoped>
/* 容器样式 */
.user-transfer-container {
  display: block;
}

/* 对话框内容布局 */
.user-transfer-dialog {
  display: flex;
}

/* 左侧树容器 */
.tree-container {
  padding: 0;
  width: 200px;
  height: 417px;
  min-height: 300px;
  overflow: hidden;
  border: 1px solid #ebeef5;
  margin-right: 10px;
  display: flex;
  flex-direction: column;
}

/* 部门标题样式 */
.dept-title {
  background-color: #f5f7fa;
  padding: 9.3px 15px;
  margin: 0;
  width: 100%;
  box-sizing: border-box;
  color: var(--el-text-color-primary);
  font-size: 16px;
  font-weight: normal;
  flex-shrink: 0;
}

/* 搜索框样式 */
.my-el-input {
  height: 34px;
  margin: 15px 1px 10px 8px;
  width: calc(100% - 16px);
  flex-shrink: 0;
}

/* 树滚动容器 */
.tree-scroll-container {
  flex: 1;
  overflow: auto;
  min-width: 100%;
}

/* 树样式调整 */
.tree-scroll-container :deep(.el-tree) {
  min-width: max-content;
  padding: 0 8px 8px;
  box-sizing: border-box;
}

.tree-scroll-container :deep(.el-tree-node__content) {
  height: auto;
  min-height: 26px;
}

.tree-scroll-container :deep(.el-tree-node__label) {
  white-space: nowrap;
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 穿梭框样式调整 */
:deep(.el-transfer) {
  --el-transfer-border-color: var(--el-border-color-lighter);
  --el-transfer-border-radius: var(--el-border-radius-base);
  --el-transfer-panel-width: 200px;
  --el-transfer-panel-header-height: 40px;
  --el-transfer-panel-header-bg-color: var(--el-fill-color-light);
  --el-transfer-panel-footer-height: 40px;
  --el-transfer-panel-body-height: 378px;
  --el-transfer-item-height: 30px;
  --el-transfer-filter-height: 32px;
  font-size: var(--el-font-size-base);
}

:deep(.el-transfer-panel) {
  width: 259px;
}
</style>
