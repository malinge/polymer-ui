<template>
  <el-card>
    <el-form :inline="true" :model="state.queryForm" @keyup.enter="getDataList()">
      <el-form-item>
        <el-input v-model="state.queryForm.name" placeholder="附件名称"></el-input>
      </el-form-item>
      <el-form-item>
        <el-input v-model="state.queryForm.platform" placeholder="存储平台"></el-input>
      </el-form-item>
      <el-form-item>
        <el-button @click="getDataList()">查询</el-button>
      </el-form-item>
      <el-form-item v-auth="'sys:attachment:save'">
        <Upload
            ref="uploadRef"
            :accept="[]"
            :max-size="100"
            :no-file-list = true
            @success="handleUploadSuccess"
            @error="handleUploadError">
          <template #upload>
            <el-button type="primary" :loading="uploadLoading">上传</el-button>
          </template>
        </Upload>
      </el-form-item>
      <el-form-item>
        <el-button
          v-auth="'sys:attachment:delete'"
          type="danger"
          @click="deleteBatchHandle()"
          >删除</el-button
        >
      </el-form-item>
    </el-form>
    <el-table
      v-loading="state.dataListLoading"
      show-overflow-tooltip
      :data="state.dataList"
      border
      style="width: 100%"
      ref="tableRef"
      @select="selectHandle"
      @select-all="selectAllHandle"
    >
      <el-table-column
        type="selection"
        header-align="center"
        align="center"
        width="50"
      ></el-table-column>
      <el-table-column
        prop="name"
        label="附件名称"
        header-align="center"
        align="center"
      ></el-table-column>
      <el-table-column
        prop="url"
        label="附件地址"
        header-align="center"
        align="center"
      ></el-table-column>
      <el-table-column prop="size" label="附件大小" header-align="center" align="center">
        <template #default="scope">
          {{ convertSizeFormat(scope.row.size) }}
        </template>
      </el-table-column>
      <el-table-column
        prop="platform"
        label="存储平台"
        header-align="center"
        align="center"
      ></el-table-column>
      <el-table-column
        prop="createTime"
        label="创建时间"
        header-align="center"
        align="center"
      ></el-table-column>
      <el-table-column
        label="操作"
        fixed="right"
        header-align="center"
        align="center"
        width="150"
      >
        <template #default="scope">
          <el-button
            type="primary"
            link
            @click="downloadHandle(scope.row.url, scope.row.name)"
            >下载</el-button
          >
          <el-button
            v-auth="'sys:attachment:delete'"
            type="primary"
            link
            @click="deleteBatchHandle(scope.row.id)"
            >删除</el-button
          >
        </template>
      </el-table-column>
    </el-table>
    <el-pagination
      :current-page="state.pageNo"
      :page-sizes="state.pageSizes"
      :page-size="state.pageSize"
      :total="state.total"
      layout="total, sizes, prev, pager, next, jumper"
      @size-change="sizeChangeHandle"
      @current-change="currentChangeHandle"
    >
    </el-pagination>
  </el-card>
</template>

<script setup lang="ts" name="SysAttachmentIndex">
import { useCrud } from "@/hooks";
import { reactive, ref } from "vue";
import { convertSizeFormat } from "@/utils/tool";
import { IHooksOptions } from "@/hooks/interface";
import { ElMessage } from "element-plus";
import type { UploadProps } from "element-plus";
import { useAttachmentSubmitApi } from "@/api/sys/attachment";
import type {AttachmentUploadResult} from "@/types/api/common"
import Upload from "@/components/upload/index.vue";

const tableRef = ref();

const uploadRef = ref<InstanceType<typeof Upload>>();
const uploadLoading = ref(false);

const state: IHooksOptions = reactive({
  dataListUrl: "/sys/attachment/page",
  deleteUrl: "/sys/attachment",
  primaryKey: "id",
  queryForm: {
    name: "",
    platform: "",
  },
});

/**
 * 上传成功回调
 * 直接使用 AttachmentUploadResult 保存附件记录
 */
const handleUploadSuccess = (result: AttachmentUploadResult): void => {
  // 保存附件记录到后端
  useAttachmentSubmitApi(result)
      .then(() => {
        ElMessage.success({
          message: `保存附件记录成功`,
          duration: 3000,
          onClose: () => {
            getDataList()
            // 需重置上传组件的 loading 状态
            uploadRef.value?.resetUploadStatus();
          },
        })
      })
      .catch((error) => {
        const message = error?.message || '保存附件记录失败'
        ElMessage.error(message)
      })
}

/**
 * 上传失败回调
 */
const handleUploadError = (error: Error): void => {
  ElMessage.error(`上传失败：${error.message}`)
}

/**
 * 上传前校验
 */
const beforeUpload: UploadProps['beforeUpload'] = (file) => {
  // 校验文件大小（100MB）
  const maxSize = 100 * 1024 * 1024 // 100MB
  if (file.size > maxSize) {
    ElMessage.error('文件大小不能超过 100MB')
    return false
  }
  return true
}

/**
 * 使用 useCrud 钩子
 */
const {
  getDataList,
  sizeChangeHandle,
  currentChangeHandle,
  deleteBatchHandle,
  downloadHandle,
  selectHandle,
  selectAllHandle,
} = useCrud(state);
</script>
