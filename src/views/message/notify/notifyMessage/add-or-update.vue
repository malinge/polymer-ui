<template>
	<el-dialog v-model="visible" :title="!dataForm.id ? '新增' : '修改'" :close-on-click-modal="false">
		<el-form ref="dataFormRef" :model="dataForm" :rules="dataRules" label-width="100px" @keyup.enter="submitHandle()">
	    				<el-form-item label="用户id" prop="userId">
					<el-input v-model="dataForm.userId" placeholder="用户id"></el-input>
				</el-form-item>
				<el-form-item label="模板编码" prop="templateCode">
					<el-input v-model="dataForm.templateCode" placeholder="模板编码"></el-input>
				</el-form-item>
				<el-form-item label="发送人" prop="sender">
					<el-input v-model="dataForm.sender" placeholder="发送人"></el-input>
				</el-form-item>
				<el-form-item label="内容" prop="content">
					<el-input v-model="dataForm.content" placeholder="内容"></el-input>
				</el-form-item>
				<el-form-item label="类型" prop="type">
					<el-input v-model="dataForm.type" placeholder="类型"></el-input>
				</el-form-item>
				<el-form-item label="是否已读" prop="readStatus">
					<el-input v-model="dataForm.readStatus" placeholder="是否已读"></el-input>
				</el-form-item>
				<el-form-item label="阅读时间" prop="readTime">
					<el-input v-model="dataForm.readTime" placeholder="阅读时间"></el-input>
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
import { useNotifyMessageApi, useNotifyMessageSubmitApi } from '@/api/message/notifyMessage'

const emit = defineEmits(['refreshDataList'])

const visible = ref(false)
const dataFormRef = ref()

const dataForm = reactive({
	id: '',
	userId: '',
	userType: '',
	title: '',
	templateCode: '',
  sender: '',
	content: '',
	type: '',
  senderAvatar: '',
	readStatus: '',
	readTime: '',
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
		getNotifyMessage(id)
	}
}

const getNotifyMessage = (id: number) => {
	useNotifyMessageApi(id).then(res => {
		Object.assign(dataForm, res.data)
	})
}

const dataRules = ref({
})

// 表单提交
const submitHandle = () => {
	dataFormRef.value.validate((valid: boolean) => {
		if (!valid) {
			return false
		}

		useNotifyMessageSubmitApi(dataForm).then(() => {
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
