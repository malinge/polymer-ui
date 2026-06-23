<template>
	<el-form ref="dataFormRef" :model="dataForm" :rules="dataRules" label-width="100px">
    <el-form-item prop="avatar" label="用户头像">
      <UploadComponent
          v-model:file-list="avatarList"
          no-file-list
          only-image
          :accept="['jpg', 'png', 'jpeg']"
          :max-size="10"
          :max-count="1"
          @success="handleUploadSuccess"
          @error="handleUploadError"
      />
    </el-form-item>
    <el-form-item prop="gender" label="用户性别">
      <fast-radio-group v-model="dataForm.gender" dict-type="user_gender"></fast-radio-group>
    </el-form-item>
		<el-form-item prop="mobile" label="手机号码">
			<el-input v-model="dataForm.mobile" placeholder="手机号码"></el-input>
		</el-form-item>
		<el-form-item prop="email" label="用户邮箱">
			<el-input v-model="dataForm.email" placeholder="邮箱"></el-input>
		</el-form-item>
    <el-form-item prop="city" label="所在城市">
      <el-cascader v-model="dataForm.city" :options="cityOptions" :props="cascaderProps" filterable clearable style="width: 100%" placeholder="请选择城市" @change="handleCityChange" />
    </el-form-item>
    <el-form-item prop="address" label="详细地址">
      <el-input v-model="dataForm.address" placeholder="详细地址"></el-input>
    </el-form-item>
		<el-form-item>
			<el-button type="primary" @click="handleDataForm">{{ $t('confirm') }}</el-button>
		</el-form-item>
	</el-form>
</template>

<script setup lang="ts">
import { reactive, ref, computed } from 'vue'
import { validatePassword } from '@/utils/validate'
import { useUserInfoSubmitApi } from '@/api/sys/user'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/store/modules/user'
import FastRadioGroup from "@/components/fast-radio-group/src/fast-radio-group.vue";
import {useCityListApi} from "@/api/sys/city";
import UploadComponent from "@/components/upload/index.vue";
import type {AttachmentUploadResult} from "@/hooks/useFileUpload";

const userStore = useUserStore()
const uploadRef = ref<InstanceType<typeof UploadComponent>>();
const dataFormRef: any = ref(null)
// 城市选项数据
const cityOptions = ref<any[]>([])
// 级联选择器配置
const cascaderProps = {
  value: 'areaCode',  // 使用城市编码作为值
  label: 'name',  // 使用城市名称作为显示
  children: 'children' // 子节点字段名
}
const isLoaded = ref(false) // 新增加载状态标记

const dataForm = reactive({
  avatar: userStore.user.avatar,
	mobile: userStore.user.mobile,
	email: userStore.user.email,
	gender: userStore.user.gender,
  address: userStore.user.address,
  city: userStore.user.city
})

const init = () => {
  if (isLoaded.value) return // 已加载则跳过
  getCityList()
  isLoaded.value = true
}

// 使用 computed 带有 getter 和 setter
const avatarList = computed({
  get: () => {
    if (dataForm.avatar) {
      return [{
        name: '头像.jpg',
        url: dataForm.avatar,
        size: 20000,
        platform: 'MINIO'
      }]
    }
    return []
  },
  set: (newValue) => {
    // 当上传组件更新 file-list 时，更新 dataForm.avatar
    if (newValue && newValue.length > 0) {
      dataForm.avatar = newValue[0].url
    } else {
      dataForm.avatar = ''
    }
  }
})

/**
 * 上传成功回调
 * 直接使用 AttachmentUploadResult 保存附件记录
 */
const handleUploadSuccess = (result: AttachmentUploadResult): void => {
  dataForm.avatar = result.url;
  // 需重置上传组件的 loading 状态
  uploadRef.value?.resetUploadStatus();
}

// ========== 上传错误回调 ==========
const handleUploadError = (error: Error) => {
  ElMessage.error(error.message || '上传失败')
}

// 获取城市列表
const getCityList = () => {
  useCityListApi().then(res => {
    cityOptions.value = res.data
  }).catch(() => {
    cityOptions.value = []
  })
}
// 城市选择变化处理
const handleCityChange = (value: string[]) => {
  // 此处value已经是字符串数组，直接赋值
  dataForm.city = value
}

const dataRules = ref({
	mobile: [{ required: true, validator: validatePassword, trigger: 'blur' }]
})

const handleDataForm = () => {
	dataFormRef.value.validate((valid: boolean) => {
		if (!valid) {
			return false
		}

		// 修改登录用户信息
		useUserInfoSubmitApi(dataForm).then(() => {
			// 更新状态管理
			userStore.user.avatar = dataForm.avatar
			userStore.user.mobile = dataForm.mobile
			userStore.user.email = dataForm.email
			userStore.user.gender = dataForm.gender
			userStore.user.address = dataForm.address
			userStore.user.city = dataForm.city

			ElMessage.success('修改成功')
		})
	})
}
defineExpose({
  init
})
</script>
