<template>
	<el-dialog v-model="visible" :title="!dataForm.id ? '新增' : '修改'" :close-on-click-modal="false">
		<el-form ref="dataFormRef" :model="dataForm" :rules="dataRules" label-width="100px"  @keyup.enter="submitHandle()">
      <!-- 新增字段：父级ID（仅显示） -->
      <el-form-item label="父级ID" v-show="false">
        <el-input v-model="dataForm.pid" placeholder="父级ID" disabled></el-input>
      </el-form-item>
				<el-form-item label="城市名称" prop="name">
					<el-input v-model="dataForm.name" placeholder="城市名称"></el-input>
				</el-form-item>
				<el-form-item label="城市拼音" prop="pinyin">
					<el-input v-model="dataForm.pinyin" placeholder="城市拼音"></el-input>
				</el-form-item>
				<el-form-item label="城市简称" prop="shortName">
					<el-input v-model="dataForm.shortName" placeholder="城市简称"></el-input>
				</el-form-item>
				<el-form-item label="行政编码" prop="areaCode">
					<el-input v-model="dataForm.areaCode" placeholder="行政编码"></el-input>
				</el-form-item>
				<el-form-item label="城市区号" prop="cityCode">
					<el-input v-model="dataForm.cityCode" placeholder="城市区号"></el-input>
				</el-form-item>
				<el-form-item label="城市等级" prop="level">
          <fast-radio-group v-model="dataForm.level" dict-type="city_level"></fast-radio-group>
				</el-form-item>
				<el-form-item label="邮政编码" prop="zipCode">
					<el-input v-model="dataForm.zipCode" placeholder="邮政编码"></el-input>
				</el-form-item>
				<el-form-item label="城市经度" prop="longitude">
					<el-input v-model="dataForm.longitude" placeholder="城市经度"></el-input>
				</el-form-item>
				<el-form-item label="城市纬度" prop="latitude">
					<el-input v-model="dataForm.latitude" placeholder="城市纬度"></el-input>
				</el-form-item>
		</el-form>
		<template #footer>
			<el-button @click="visible = false">取消</el-button>
			<el-button type="primary" @click="submitHandle()">确定</el-button>
		</template>
	</el-dialog>
</template>

<script setup lang="ts">
import { reactive, ref, defineProps } from 'vue'
import { ElMessage } from 'element-plus/es'
import { useCityApi, useCitySubmitApi } from '@/api/sys/city'

const props = defineProps({
  pid: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits(['refreshDataList'])

const visible = ref(false)
const dataFormRef = ref()

const dataForm = reactive({
	id: '',
	pid: 0,
	name: '',
	pinyin: '',
	shortName: '',
	fullName: '',
	areaCode: '',
	cityCode: '',
	parentCode: '',
	level: '',
	zipCode: '',
	longitude: '',
	latitude: '',
	haveChild: '',
	creator: '',
	createTime: '',
	updater: '',
	updateTime: ''})

const init = (id?: number, pid?: number) => {
	visible.value = true
	dataForm.id = ''

	// 重置表单数据
	if (dataFormRef.value) {
		dataFormRef.value.resetFields()
	}

  // 设置父级ID
  if (pid !== undefined) {
    dataForm.pid = pid
  } else if (props.pid !== undefined) {
    dataForm.pid = props.pid
  }

	if (id) {
		getCity(id)
	}else {
    // 新增时设置默认父级ID
    if (dataForm.pid === undefined) {
      dataForm.pid = props.pid
    }
  }
}

const getCity = (id: number) => {
	useCityApi(id).then(res => {
		Object.assign(dataForm, res.data)
	})
}

const dataRules = ref({
  name: [{ required: true, message: '必填项不能为空', trigger: 'blur' }],
  level: [{ required: true, message: '必填项不能为空', trigger: 'blur' }],
  areaCode: [{ required: true, message: '必填项不能为空', trigger: 'blur' }]
})

// 表单提交
const submitHandle = () => {
	dataFormRef.value.validate((valid: boolean) => {
		if (!valid) {
			return false
		}

    // 确保父级ID正确传递
    if (!dataForm.id && dataForm.pid === undefined) {
      dataForm.pid = props.pid
    }

		useCitySubmitApi(dataForm).then(() => {
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
