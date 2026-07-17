<template>
	<div class="dept-container">
		<el-input v-model="deptName" clearable placeholder="请输入关键字过滤" >
      <template #prefix>
        <el-icon><Search /></el-icon>
      </template>
    </el-input>
		<el-tree
			ref="treeRef"
			:data="deptList"
			:expand-on-click-node="false"
			:filter-node-method="filterNode"
			:props="{ label: 'name', children: 'children' }"
			highlight-current
			node-key="id"
			@node-click="handleNodeClick"
		>
      <template #default="{ node, data }">
        <slot name="node" :node="node" :data="data">
            <span class="tree-node">
              <el-icon class="node-icon">
                <Folder v-if="data.children && data.children.length" />
                <Document v-else />
              </el-icon>
              <span class="node-label" :title="node.label">{{ node.label }}</span>
            </span>
        </slot>
      </template>
    </el-tree>
	</div>
</template>

<script lang="ts" setup>
import { ElTree } from 'element-plus'
import { useDeptListApi } from '@/api/sys/dept'
import { onMounted, ref, watch } from 'vue'
import {Search, Folder, Document} from '@element-plus/icons-vue'

const deptList = ref()
const deptName = ref()
const treeRef = ref()

onMounted(async () => {
	await getDeptList()
})

watch(deptName, val => {
	treeRef.value.filter(val)
})

// 部门列表
const getDeptList = async () => {
	const res = await useDeptListApi()
	deptList.value = res.data
}

const filterNode = (name: string, data: any) => {
	if (!name) {
		return true
	}
	return data.name.includes(name)
}

const emits = defineEmits(['nodeClick'])
// 处理点击事件
const handleNodeClick = (row: any) => {
	emits('nodeClick', row.id)
}
</script>

<style lang="scss" scoped>
.dept-container {
	min-height: calc(100vh - 112px - var(--theme-header-height));
	overflow: hidden;
	white-space: nowrap;
	text-overflow: ellipsis;
	:deep(.el-tree) {
		margin-top: 20px;
	}
}

.tree-node {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 13px;
  overflow: hidden;

  .node-icon {
    font-size: 14px;
    color: #4fb5d0;
    flex-shrink: 0;
  }

  .node-label {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
</style>
