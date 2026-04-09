<template>
	<el-dialog v-model="visible" :title="!dataForm.id ? '新增' : '修改'" :close-on-click-modal="false">
		<el-form ref="dataFormRef" :model="dataForm" :rules="dataRules" label-width="100px" @keyup.enter="submitHandle()">
				<el-form-item label="模板名称" prop="name">
					<el-input v-model="dataForm.name" placeholder="模板名称"></el-input>
				</el-form-item>
				<el-form-item label="模板编码" prop="code">
					<el-input v-model="dataForm.code" placeholder="模板编码"></el-input>
				</el-form-item>
				<el-form-item label="邮箱账号" prop="accountId">
					<el-select v-model="dataForm.accountId" placeholder="邮箱账号" style="width: 100%">
						<el-option v-for="post in mailAccountList" :key="post.id" :label="post.mail" :value="post.id"></el-option>
					</el-select>
				</el-form-item>
				<el-form-item label="发送人名称" prop="nickname">
					<el-input v-model="dataForm.nickname" placeholder="发送人名称"></el-input>
				</el-form-item>
        <el-form-item label="主题" prop="subject">
          <el-input v-model="dataForm.subject" placeholder="主题"></el-input>
        </el-form-item>
				<el-form-item label="模板标题" prop="title">
					<el-input v-model="dataForm.title" placeholder="模板标题"></el-input>
				</el-form-item>
				<el-form-item label="模板内容" prop="content">
					<WangEditor v-model="dataForm.content" placeholder="请输入..."></WangEditor>
				</el-form-item>
				<el-form-item label="开启状态" prop="status">
					<fast-radio-group v-model="dataForm.status" dict-type="user_status"></fast-radio-group>
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
import WangEditor from '@/components/wang-editor/index.vue'
import { useMailTemplateApi, useMailTemplateSubmitApi } from '@/api/message/mailTemplate'
import { useMailAccountListApi } from '@/api/message/mailAccount'
import {usePostListApi} from "@/api/sys/post";

const emit = defineEmits(['refreshDataList'])

const visible = ref(false)
const mailAccountList = ref<any[]>([])
const dataFormRef = ref()

const dataForm = reactive({
	id: '',
	name: '',
	code: '',
	accountId: '',
	nickname: '',
  subject: '',
	title: '',
	content: '',
	status: '',
	remark: '',
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
		getMailTemplate(id)
	}

	getMailAccountList();
}

// 获取邮箱账号列表
const getMailAccountList = () => {
	return useMailAccountListApi().then(res => {
		mailAccountList.value = res.data
	})
}

const getMailTemplate = (id: number) => {
	useMailTemplateApi(id).then(res => {
		Object.assign(dataForm, res.data)
	})
}

const dataRules = ref({
	name: [{ required: true, message: '必填项不能为空', trigger: 'blur' }],
	code: [{ required: true, message: '必填项不能为空', trigger: 'blur' }],
	accountId: [{ required: true, message: '必填项不能为空', trigger: 'blur' }],
	nickname: [{ required: true, message: '必填项不能为空', trigger: 'blur' }],
  subject: [{ required: true, message: '必填项不能为空', trigger: 'blur' }],
	title: [{ required: true, message: '必填项不能为空', trigger: 'blur' }],
	content: [{ required: true, message: '必填项不能为空', trigger: 'blur' }]
})

// 表单提交
const submitHandle = () => {
	dataFormRef.value.validate((valid: boolean) => {
		if (!valid) {
			return false
		}

		useMailTemplateSubmitApi(dataForm).then(() => {
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
