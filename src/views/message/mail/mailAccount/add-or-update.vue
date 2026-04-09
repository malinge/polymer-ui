<template>
	<el-dialog v-model="visible" :title="!dataForm.id ? '新增' : '修改'" :close-on-click-modal="false">
		<el-form ref="dataFormRef" :model="dataForm" :rules="dataRules" label-width="auto" @keyup.enter="submitHandle()">
<!--	    				<el-form-item label="主键" prop="id">
					<el-input v-model="dataForm.id" placeholder="主键"></el-input>
				</el-form-item>-->
				<el-form-item label="邮箱" prop="mail">
					<el-input v-model="dataForm.mail" placeholder="邮箱"></el-input>
				</el-form-item>
				<el-form-item label="用户名" prop="username">
					<el-input v-model="dataForm.username" placeholder="用户名"></el-input>
				</el-form-item>
				<el-form-item label="密码" prop="password" auto>
					<el-input v-model="dataForm.password" type="password" placeholder="密码"></el-input>
				</el-form-item>
				<el-form-item label="SMTP 服务器域名" prop="host">
					<el-input v-model="dataForm.host" placeholder="SMTP 服务器域名"></el-input>
				</el-form-item>
				<el-form-item label="SMTP 服务器端口" prop="port">
					<el-input v-model="dataForm.port" placeholder="SMTP 服务器端口"></el-input>
				</el-form-item>
        <el-form-item label="协议" prop="protocol">
          <el-input v-model="dataForm.protocol" placeholder="协议"></el-input>
        </el-form-item>
				<el-form-item label="是否开启SSL" prop="sslEnable">
					<el-switch v-model="dataForm.sslEnable" inline-prompt active-text="开" inactive-text="关"/>
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
import { useMailAccountApi, useMailAccountSubmitApi } from '@/api//message/mailAccount'

const emit = defineEmits(['refreshDataList'])

const visible = ref(false)
const dataFormRef = ref()

const dataForm = reactive({
	id: '',
	mail: '',
	username: '',
	password: '',
	host: '',
	port: '',
  protocol: '',
	sslEnable: '',
	tenantId: '',
	deptId: '',
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
		getMailAccount(id)
	}
}

const getMailAccount = (id: number) => {
	useMailAccountApi(id).then(res => {
		Object.assign(dataForm, res.data)
	})
}

const dataRules = ref({
  mail: [{ required: true, message: '必填项不能为空', trigger: 'blur' }],
  username: [{ required: true, message: '必填项不能为空', trigger: 'blur' }],
  password: [{ required: true, message: '必填项不能为空', trigger: 'blur' }],
  host: [{ required: true, message: '必填项不能为空', trigger: 'blur' }],
  port: [{ required: true, message: '必填项不能为空', trigger: 'blur' }],
  protocol: [{ required: true, message: '必填项不能为空', trigger: 'blur' }],
  sslEnable: [{ required: true, message: '必填项不能为空', trigger: 'blur' }]
})

// 表单提交
const submitHandle = () => {
	dataFormRef.value.validate((valid: boolean) => {
		if (!valid) {
			return false
		}

		useMailAccountSubmitApi(dataForm).then(() => {
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
