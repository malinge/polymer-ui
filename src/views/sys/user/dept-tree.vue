<template>
	<div class="dept-container">
		<el-input v-model="deptName" clearable placeholder="请输入关键字过滤" />
		<el-tree
			ref="treeRef"
			:data="deptList"
			:expand-on-click-node="false"
			:filter-node-method="filterNode"
			:props="{ label: 'name', children: 'children' }"
			highlight-current
			node-key="id"
			@node-click="handleNodeClick"
		/>
	</div>
</template>

<script lang="ts" setup>
import { ElTree } from 'element-plus'
import { useDeptListApi } from '@/api/sys/dept'
import { onMounted, ref, watch } from 'vue'

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
</style>
