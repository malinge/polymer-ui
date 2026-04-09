<template>
  <el-dialog
    v-model="visible"
    title="邮件日志详情"
    :close-on-click-modal="false"
    draggable
  >
    <el-form label-width="auto">
      <el-form-item label="接收邮箱地址">
        <el-input v-model="dataForm.toMail" disabled></el-input>
      </el-form-item>

      <el-form-item label="发送邮箱地址">
        <el-input v-model="dataForm.fromMail" disabled></el-input>
      </el-form-item>

      <el-form-item label="模板编码">
        <el-input v-model="dataForm.templateCode" disabled></el-input>
      </el-form-item>

      <el-form-item label="模版发送人名称">
        <el-input v-model="dataForm.templateNickname" disabled></el-input>
      </el-form-item>

      <el-form-item label="邮件标题">
        <el-input v-model="dataForm.templateTitle" disabled></el-input>
      </el-form-item>

      <el-form-item label="邮件内容">
        <WangEditor v-model="dataForm.templateContent" disabled></WangEditor>
      </el-form-item>

      <el-form-item label="发送状态">
        <el-input v-model="dataForm.sendStatusLabel" disabled></el-input>
      </el-form-item>

      <el-form-item label="发送时间">
        <el-input v-model="dataForm.sendTime" disabled></el-input>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button type="primary" @click="visible = false">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { reactive, ref } from "vue";
import WangEditor from "@/components/wang-editor/index.vue";

const visible = ref(false);
const dataForm = reactive({
  toMail: "",
  fromMail: "",
  templateCode: "",
  templateNickname: "",
  templateTitle: "",
  templateContent: "",
  sendStatusLabel: "",
  sendTime: "",
});

const init = (data?: any) => {
  visible.value = true;

  Object.assign(dataForm, data);
};

defineExpose({
  init,
});
</script>
