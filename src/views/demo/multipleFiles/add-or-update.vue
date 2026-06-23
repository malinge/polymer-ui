<template>
	<el-dialog v-model="visible" :title="!dataForm.id ? '新增' : '修改'" :close-on-click-modal="false" draggable>
		<el-form ref="dataFormRef" :model="dataForm" :rules="dataRules" label-width="100px" @keyup.enter="submitHandle()">
				<el-form-item label="名称" prop="name">
					<el-input v-model="dataForm.name" placeholder="名称"></el-input>
				</el-form-item>
      <!-- ========== 图片上传 ========== -->
      <el-form-item prop="images" label="图片">
        <UploadComponent
            v-model:file-list="dataForm.images"
            only-image
            :accept="['jpg', 'png', 'jpeg', 'gif', 'webp']"
            :max-size="20"
            :max-count="9"
            @error="handleUploadError"
        />
        <div style="margin-top: 6px; color: #909399; font-size: 12px">
          共 {{ dataForm.images.length }} 张图片，最多 9 张
        </div>
      </el-form-item>

      <!-- ========== 附件上传 ========== -->
      <el-form-item prop="attachments" label="附件">
        <UploadComponent
            v-model:file-list="dataForm.attachments"
            :accept="[]"
            :max-size="50"
            @error="handleUploadError"
        >
          <template #upload>
            <el-button type="primary" size="small">
              <el-icon><Upload /></el-icon>
              选择附件
            </el-button>
          </template>
        </UploadComponent>
      </el-form-item>
		</el-form>
		<template #footer>
			<el-button @click="visible = false">取消</el-button>
			<el-button type="primary" @click="submitHandle()">确定</el-button>
		</template>

	</el-dialog>
</template>

<script setup lang="ts">
import {reactive, ref} from 'vue'
import {ElMessage} from 'element-plus/es'
import {useMultipleFilesApi, useMultipleFilesSubmitApi} from "@/api/demo/multipleFiles";
import UploadComponent from '@/components/upload/index.vue'
import { Upload } from '@element-plus/icons-vue' // 导入 Upload 图标
import type { AttachmentUploadResult } from '@/hooks/useFileUpload'


const emit = defineEmits(['refreshDataList'])

const visible = ref(false)
const dataFormRef = ref()

const dataForm = reactive({
	id: '',
	name: '',
  attachments: [] as AttachmentUploadResult[],
  images: [] as AttachmentUploadResult[],
	deptId: '',
	creator: '',
	createTime: '',
	updater: '',
	updateTime: ''
})

const init = (id?: number) => {
	visible.value = true
	dataForm.id = ''

	// 重置表单数据
	if (dataFormRef.value) {
		dataFormRef.value.resetFields()
	}

	if (id) {
		getMultipleFiles(id)
	}

}



const getMultipleFiles = (id: number) => {
	useMultipleFilesApi(id).then(res => {
		Object.assign(dataForm, res.data)
	})
}

const dataRules = ref({
  name: [{ required: true, message: '名称必填项不能为空', trigger: 'blur' }]
})

// ========== 上传错误回调 ==========
const handleUploadError = (error: Error) => {
  ElMessage.error(error.message || '上传失败')
}

// 表单提交
const submitHandle = () => {
	dataFormRef.value.validate((valid: boolean) => {
		if (!valid) {
			return false
		}

		useMultipleFilesSubmitApi(dataForm).then(() => {
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

