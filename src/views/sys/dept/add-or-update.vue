<template>
	<el-dialog v-model="visible" :title="!dataForm.id ? '新增' : '修改'" :close-on-click-modal="false" draggable>
		<el-form ref="dataFormRef" :model="dataForm" :rules="dataRules" label-width="120px" @keyup.enter="submitHandle()">
			<el-form-item prop="name" label="名称">
				<el-input v-model="dataForm.name" placeholder="名称"></el-input>
			</el-form-item>
      <el-form-item prop="type" label="部门类型">
        <fast-select v-model="dataForm.type" dict-type="dept_type" placeholder="部门类型" style="width: 100%"></fast-select>
      </el-form-item>
			<el-form-item prop="pid" label="上级部门">
				<el-tree-select
						v-model="dataForm.pid"
						:data="deptList"
						value-key="id"
						check-strictly
						:render-after-expand="false"
						:props="{ label: 'name', children: 'children' }"
						style="width: 100%"
						clearable
				/>
			</el-form-item>
      <el-form-item prop="leaderId" label="负责人">
        <div class="leader-selection">
          <div v-if="selectedLeader" class="selected-leader">
            <span>{{ selectedLeader.username }}</span>
            <el-icon @click="clearLeader" class="delete-icon">
              <Close />
            </el-icon>
          </div>
          <el-button text bg :icon="Plus" @click="openLeaderDialog">
            {{ dataForm.leaderId ? '修改负责人' : '选择负责人' }}
          </el-button>
        </div>
      </el-form-item>
			<el-form-item prop="sort" label="排序">
				<el-input-number v-model="dataForm.sort" controls-position="right" :min="0" label="排序"></el-input-number>
			</el-form-item>
		</el-form>
		<template #footer>
			<el-button @click="visible = false">取消</el-button>
			<el-button type="primary" @click="submitHandle()">确定</el-button>
		</template>
    <!-- 负责人选择组件 -->
    <user-transfer
        v-model="dataForm.leaderId"
        ref="userTransferRef"
        :title="!dataForm.leaderId ? '选择负责人' : '修改负责人'"
        :multiple="false"
        @confirm="handleLeaderSelected"
    />
	</el-dialog>
</template>

<script setup lang="ts">
	import { reactive, ref } from 'vue'
  import {Close, Plus} from '@element-plus/icons-vue'
	import { ElMessage } from 'element-plus/es'
	import { useDeptListApi, useDeptSubmitApi } from '@/api/sys/dept'
  import UserTransfer from '@/components/user-transfer/index.vue'

	const emit = defineEmits(['refreshDataList'])

	const visible = ref(false)
	const deptList = ref([])
	const dataFormRef = ref()

  const userTransferRef = ref()
  const selectedLeader = ref<{ id: number; username: string } | null>(null)

	const dataForm = reactive({
		id: '',
		name: '',
		type: 1,
		pid: '',
		parentName: '',
    leaderId: null,
		sort: 0
	})

	const init = (isUpdate: boolean, row: any) => {
		visible.value = true

		// 重置表单数据
		if (dataFormRef.value) {
			dataFormRef.value.resetFields()
		}

    // 重置负责人信息
    selectedLeader.value = null

		// 更新表单数据
		if (row) {
			getDept(isUpdate, row)
		} else {
			dataForm.pid = ''
			dataForm.parentName = ''
      dataForm.leaderId = null
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
	const getDept = (isUpdate: boolean, row: any) => {
		Object.assign(dataForm, row)

    // 设置负责人信息
    if (row.leaderId) {
      dataForm.leaderId = row.leaderId
      // 如果有负责人名称，直接设置
      if (row.leaderName) {
        selectedLeader.value = {
          id: row.leaderId,
          username: row.leaderName
        }
      } else {
        // 这里简化为只显示ID
        selectedLeader.value = {
          id: row.leaderId,
          username: `用户 ${row.leaderId}`
        }
      }
    }

		if (!isUpdate) {
			// 是新增，重置表单数据
			dataForm.pid = dataForm.id
			dataForm.parentName = dataForm.name
			dataForm.id = ''
			dataForm.name = ''
			dataForm.sort = 0
      dataForm.leaderId = null
      selectedLeader.value = null
		}
	}

	const dataRules = ref({
		name: [{ required: true, message: '必填项不能为空', trigger: 'blur' }],
		type: [{ required: true, message: '必填项不能为空', trigger: 'blur' }],
		parentName: [{ required: true, message: '必填项不能为空', trigger: 'blur' }]
	})

  // 打开负责人选择对话框
  const openLeaderDialog = () => {
    userTransferRef.value.open(dataForm.leaderId)
  }

  // 处理负责人选择结果
  const handleLeaderSelected = (user: any) => {
    if (user) {
      selectedLeader.value = {
        id: user.id,
        username: user.username
      }
      dataForm.leaderId = user.id
    } else {
      selectedLeader.value = null
      dataForm.leaderId = null
    }
  }

  // 清除已选择的负责人
  const clearLeader = () => {
    selectedLeader.value = null
    dataForm.leaderId = null
  }

	// 表单提交
	const submitHandle = () => {
		dataFormRef.value.validate((valid: boolean) => {
			if (!valid) {
				return false
			}

			useDeptSubmitApi(dataForm).then(() => {
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

<style lang="scss" scoped>
	.dept-list {
	::v-deep(.el-input__inner) {
		cursor: pointer;
	}
	::v-deep(.el-input__suffix) {
		cursor: pointer;
	}
	}

  .leader-selection {
    display: flex;
    flex-direction: row;
    gap: 10px;

    .selected-leader {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 10px;
      background-color: #f5f7fa;
      border-radius: 20px;
      border: 0 solid #dcdfe6;

      .delete-icon {
        cursor: pointer;
        color: #f56c6c;
      }

      .delete-icon:hover {
        color: #e4393c;
      }
    }
  }

  .el-button.is-text:not(.is-disabled).is-has-bg {
    background-color: var(--el-fill-color-light);
    border-radius: 20px;
  }
</style>
