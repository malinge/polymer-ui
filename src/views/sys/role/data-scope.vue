<template>
	<el-dialog v-model="visible" title="数据权限" :close-on-click-modal="false" :width="600" draggable>
		<el-form ref="dataFormRef" :model="dataForm" label-width="120px" @keyup.enter="submitHandle()">
			<el-form-item prop="name" label="名称">
				<el-input v-model="dataForm.name" disabled></el-input>
			</el-form-item>
			<el-form-item prop="dataScope" label="数据范围">
				<fast-select v-model="dataForm.dataScope" dict-type="role_data_scope" placeholder="数据范围" style="width: 100%"></fast-select>
			</el-form-item>
			<el-form-item v-show="dataForm.dataScope == 4" label="数据权限">
				<el-tree ref="deptListTree" :data="deptList" :props="{ label: 'name', children: 'children' }" node-key="id" accordion show-checkbox> </el-tree>
			</el-form-item>
		</el-form>
		<template #footer>
			<el-button @click="visible = false">取消</el-button>
			<el-button type="primary" @click="submitHandle()">确定</el-button>
		</template>
	</el-dialog>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus/es'
import { useRoleApi, useRoleDataScopeSubmitApi } from '@/api/sys/role'
import { useDeptListApi } from '@/api/sys/dept'

const visible = ref(false)
const deptList = ref([])
const deptListTree = ref()
const dataFormRef = ref()

const dataForm = reactive({
	id: '',
	name: '',
	deptIdList: [],
	dataScope: 0,
	remark: ''
})

const init = (id?: number) => {
	visible.value = true
	dataForm.id = ''

	// 重置表单数据
	if (dataFormRef.value) {
		dataFormRef.value.resetFields()
	}
	if (deptListTree.value) {
		deptListTree.value.setCheckedKeys([])
	}

	// id 存在则为修改
	if (id) {
		getRole(id)
	}

	// 部门列表
	getDeptList()
}

// 获取部门列表
const getDeptList = async () => {
	const res = await useDeptListApi()
	deptList.value = res.data
}

// 获取信息
const getRole = (id: number) => {
	useRoleApi(id).then(res => {
		Object.assign(dataForm, res.data)

		deptListTree.value.setCheckedKeys(dataForm.deptIdList)
	})
}

// 表单提交
const submitHandle = () => {
	dataForm.deptIdList = deptListTree.value.getCheckedKeys()

	useRoleDataScopeSubmitApi(dataForm).then(() => {
		ElMessage.success({
			message: '操作成功',
			duration: 500,
			onClose: () => {
				visible.value = false
			}
		})
	})
}

defineExpose({
	init
})
</script>
