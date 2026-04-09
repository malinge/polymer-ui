<template>
	<el-dialog v-model="visible" :title="!dataForm.id ? '新增' : '修改'" :close-on-click-modal="false">
		<el-form ref="dataFormRef" :model="dataForm" :rules="dataRules" label-width="100px" @keyup.enter="submitHandle()">
			<el-form-item label="模版编码" prop="code">
				<el-input v-model="dataForm.code" placeholder="模版编码"></el-input>
			</el-form-item>
			<el-form-item label="模板名称" prop="name">
				<el-input v-model="dataForm.name" placeholder="模板名称"></el-input>
			</el-form-item>

			<el-form-item label="发送人名称" prop="nickname">
				<el-input v-model="dataForm.nickname" placeholder="发送人名称"></el-input>
			</el-form-item>
			<el-form-item label="模版内容" prop="content">
				<el-input
					v-model="dataForm.content"
					style="width: 100%"
					:rows="2"
					type="textarea"
				/>
			</el-form-item>
			<el-form-item label="类型" prop="type">
				<fast-select v-model="dataForm.type" dict-type="notify_type" clearable placeholder="状态"></fast-select>
				<!-- <el-input v-model="dataForm.type" placeholder="类型"></el-input> -->
			</el-form-item>
			<el-form-item label="状态" prop="status">
				<fast-radio-group v-model="dataForm.status" dict-type="notify_status"></fast-radio-group>
				<!-- <el-input v-model="dataForm.status" placeholder="状态"></el-input> -->
			</el-form-item>
			<el-form-item label="备注" prop="remark">
				<el-input v-model="dataForm.remark" placeholder="备注"></el-input>
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
import { useNotifyTemplateApi, useNotifyTemplateSubmitApi } from '@/api/message/notifyTemplate'

const emit = defineEmits(['refreshDataList'])

const visible = ref(false)
const dataFormRef = ref()

const dataForm = reactive({
	id: '',
	name: '',
	code: '',
	nickname: '',
	content: '',
	type: '',
	status: 1,
	remark: '',
	deptId: '',
	tenantId: '',
	version: '',
	deleted: '',
	creator: '',
	createTime: '',
	updater: '',
	updateTime: ''})

const init = (id?: number) => {
	visible.value = true
	dataForm.id = ''

	// 重置表单数据
	if (dataFormRef.value) {
		dataFormRef.value.resetFields()
	}

	if (id) {
		getNotifyTemplate(id)
	}
}

const getNotifyTemplate = (id: number) => {
	useNotifyTemplateApi(id).then(res => {
		Object.assign(dataForm, res.data)
	})
}

const dataRules = ref({
	name: [{ required: true, message: '必填项不能为空', trigger: 'blur' }],
	code: [{ required: true, message: '必填项不能为空', trigger: 'blur' }],
	type: [{ required: true, message: '必填项不能为空', trigger: 'blur' }],
	nickname: [{ required: true, message: '必填项不能为空', trigger: 'blur' }],
	status: [{ required: true, message: '必填项不能为空', trigger: 'blur' }],
	content: [{ required: true, message: '必填项不能为空', trigger: 'blur' }]
})

// 表单提交
const submitHandle = () => {
	dataFormRef.value.validate((valid: boolean) => {
		if (!valid) {
			return false
		}

		useNotifyTemplateSubmitApi(dataForm).then(() => {
			ElMessage.success({
				message: '操作成功',
				duration: 500,
				onClose: () => {
					visible.value = false
					emit('refreshDataList')
				}
			})
		})
	})
}

defineExpose({
	init
})
</script>
