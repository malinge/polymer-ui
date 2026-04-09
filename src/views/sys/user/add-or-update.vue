<template>
	<el-dialog v-model="visible" :title="!dataForm.id ? '新增' : '修改'" :close-on-click-modal="false" draggable>
		<el-form ref="dataFormRef" :model="dataForm" :rules="dataRules" label-width="120px" @keyup.enter="submitHandle()">
			<el-row>
				<el-col :span="12">
          <el-form-item prop="avatar" label="用户头像">
              <!-- 使用 v-model 绑定到父组件的数据 -->
              <AvatarUpload v-model="dataForm.avatar" :enable-remove-action="false"/>
          </el-form-item>
					<el-form-item prop="username" label="用户账号">
						<el-input v-model="dataForm.username" placeholder="用户账号"></el-input>
					</el-form-item>
          <el-form-item prop="realName" label="用户姓名">
            <el-input v-model="dataForm.realName" placeholder="用户姓名"></el-input>
          </el-form-item>
					<el-form-item prop="mobile" label="手机号码">
						<el-input v-model="dataForm.mobile" placeholder="手机号码"></el-input>
					</el-form-item>
          <el-form-item prop="deptId" label="所属部门">
            <el-tree-select
                v-model="dataForm.deptId"
                :data="deptList"
                value-key="id"
                check-strictly
                :render-after-expand="false"
                :props="{ label: 'name', children: 'children' }"
                style="width: 100%"
            />
          </el-form-item>
				</el-col>

				<el-col :span="12">
          <el-form-item prop="password" label="用户密码">
            <el-input v-model="dataForm.password" type="password" placeholder="密码"></el-input>
          </el-form-item>
					<el-form-item prop="email" label="用户邮箱">
						<el-input v-model="dataForm.email" placeholder="邮箱"></el-input>
					</el-form-item>
          <el-form-item prop="gender" label="用户性别">
            <fast-radio-group v-model="dataForm.gender" dict-type="user_gender"></fast-radio-group>
          </el-form-item>
          <el-form-item prop="city" label="所在城市">
            <el-cascader v-model="dataForm.city" :options="cityOptions" :props="cascaderProps" filterable clearable style="width: 100%" placeholder="请选择城市" @change="handleCityChange" />
          </el-form-item>
          <el-form-item prop="address" label="详细地址">
            <el-input v-model="dataForm.address" placeholder="详细地址"></el-input>
          </el-form-item>
					<el-form-item prop="roleIdList" label="所属角色">
						<el-select v-model="dataForm.roleIdList" multiple placeholder="所属角色" style="width: 100%">
							<el-option v-for="role in roleList" :key="role.id" :label="role.name" :value="role.id"></el-option>
						</el-select>
					</el-form-item>
          <el-form-item prop="postIdList" label="所属岗位">
            <el-select v-model="dataForm.postIdList" multiple placeholder="所属岗位" style="width: 100%">
              <el-option v-for="post in postList" :key="post.id" :label="post.postName" :value="post.id"></el-option>
            </el-select>
          </el-form-item>
					<el-form-item prop="status" label="用户状态">
						<fast-radio-group v-model="dataForm.status" dict-type="user_status"></fast-radio-group>
					</el-form-item>
				</el-col>
			</el-row>
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
	import { useDeptListApi } from '@/api/sys/dept'
	import { useUserApi, useUserSubmitApi } from '@/api/sys/user'
	import { usePostListApi } from '@/api/sys/post'
	import { useRoleListApi } from '@/api/sys/role'
	import { useCityListApi } from '@/api/sys/city'
  import AvatarUpload from '@/components/upload/avatar.vue';

	const emit = defineEmits(['refreshDataList'])

	const visible = ref(false)
	const postList = ref<any[]>([])
	const roleList = ref<any[]>([])
	const deptList = ref([])
	const dataFormRef = ref()
  // 城市选项数据
  const cityOptions = ref<any[]>([])
  // 级联选择器配置
  const cascaderProps = {
    value: 'areaCode',  // 使用城市编码作为值
    label: 'name',  // 使用城市名称作为显示
    children: 'children' // 子节点字段名
  }

	const dataForm = reactive({
		id: '',
		username: '',
    avatar: '',
		realName: '',
		deptId: '',
		deptName: '',
		password: '',
		gender: 0,
		email: '',
		mobile: '',
    address: '',
    city: [] as string[],
		roleIdList: [] as any[],
		postIdList: [] as any[],
		status: 1
	})

	const init = (id?: number) => {
		visible.value = true
		dataForm.id = ''

		// 重置表单数据
		if (dataFormRef.value) {
			dataFormRef.value.resetFields()
		}

		// id 存在则为修改
		if (id) {
			getUser(id)
		}

		getDeptList()
		getPostList()
		getRoleList()
    // 每次打开弹窗时获取城市数据
    getCityList()
	}

	// 获取岗位列表
	const getPostList = () => {
		return usePostListApi().then(res => {
			postList.value = res.data
		})
	}

	// 获取角色列表
	const getRoleList = () => {
		return useRoleListApi().then(res => {
			roleList.value = res.data
		})
	}

	// 获取部门列表
	const getDeptList = () => {
		return useDeptListApi().then(res => {
			deptList.value = res.data
		})
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


  // 获取信息
	const getUser = (id: number) => {
		useUserApi(id).then(res => {
			Object.assign(dataForm, res.data)
		})
	}

	const dataRules = ref({
		username: [{ required: true, message: '必填项不能为空', trigger: 'blur' }],
		realName: [{ required: true, message: '必填项不能为空', trigger: 'blur' }],
		mobile: [{ required: true, message: '必填项不能为空', trigger: 'blur' }],
		deptId: [{ required: true, message: '必填项不能为空', trigger: 'blur' }]
	})

	// 表单提交
	const submitHandle = () => {
		dataFormRef.value.validate((valid: boolean) => {
			if (!valid) {
				return false
			}

			useUserSubmitApi(dataForm).then(() => {
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
