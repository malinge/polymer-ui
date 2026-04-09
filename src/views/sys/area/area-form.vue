<template>
  <el-dialog v-model="dialogVisible" title="IP 查询">
    <el-form
            ref="formRef"
            v-loading="formLoading"
            :model="formData"
            :rules="formRules"
            label-width="80px"
    >
      <el-form-item label="IP" prop="ip">
        <el-input v-model="formData.ip" placeholder="请输入 IP 地址" />
      </el-form-item>
      <el-form-item label="地址" prop="result">
        <el-input v-model="formData.result" placeholder="展示查询 IP 结果" readonly />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button :disabled="formLoading" type="primary" @click="submitForm">确定</el-button>
      <el-button  @click="dialogVisible = false">取消</el-button>

    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
  import { ref, reactive } from 'vue'
  import * as AreaApi from '@/api/sys/area'
  import { ElMessage } from 'element-plus/es'

  defineOptions({ name: 'SystemAreaForm' })

  const dialogVisible = ref(false) // 弹窗的是否展示
  const formLoading = ref(false) // 表单的加载中：提交的按钮禁用
  const formData = ref({
    ip: '',
    result: undefined
  })
  const formRules = reactive({
    ip: [{ required: true, message: 'IP 地址不能为空', trigger: 'blur' }]
  })
  const formRef = ref() // 表单 Ref

  /** 打开弹窗 */
  const open = async () => {
    dialogVisible.value = true
    // 重置表单数据
    if (formRef.value) {
      formRef.value.resetFields()
    }
  }
  defineExpose({ open }) // 提供 open 方法，用于打开弹窗

  /** 提交表单 */
  const submitForm = async () => {
    // 校验表单
    if (!formRef) return
    const valid = await formRef.value.validate()
    if (!valid) return
    // 提交请求
    formLoading.value = true
    try {
      const res = await AreaApi.getAreaByIp(formData.value.ip!.trim())
      formData.value.result = res.data
      ElMessage.success('查询成功')
    } finally {
      formLoading.value = false
    }
  }

</script>

