<template>
  <div class="upload">
    <div class="upload-image" v-if="props.onlyImage">
      <div class="upload-image-content">
        <div class="item" v-for="(item, index) in props.fileList">
          <el-image style="width: 100%; height: 100%" :src="item.url"></el-image>
          <div class="item-action">
            <el-icon
              class="item-action-icon"
              @click="onClickPreview(item)"
              v-if="judgeAllowPreview(item)"
            >
              <View />
            </el-icon>
            <el-icon
              class="item-action-icon"
              @click="onClickDelete(index)"
              style="margin-left: 10px"
            >
              <Delete />
            </el-icon>
          </div>
        </div>
        <div class="main">
          <el-upload
            class="main-upload"
            :action="constant.uploadUrl"
            :show-file-list="false"
            :http-request="httpRequest"
            :on-success="onSuccess"
            :before-upload="onClickBeforeUpload"
            :accept="props.accept"
          >
            <el-icon class="main-upload-icon">
              <Plus />
            </el-icon>
          </el-upload>
        </div>
      </div>
    </div>
    <div class="upload-file" v-else>
      <div class="upload-file-content">
        <div class="main">
          <slot name="upload">
            <el-upload
              class="main-upload"
              :action="constant.uploadUrl"
              :show-file-list="false"
              :http-request="httpRequest"
              :on-success="onSuccess"
              :before-upload="onClickBeforeUpload"
              :accept="props.accept"
            >
              <el-button type="primary">上传</el-button>
            </el-upload>
          </slot>
        </div>
        <div class="item" v-for="(item, index) in props.fileList">
          <div class="item-name">
            {{ item.name }}
          </div>
          <div class="item-action">
            <el-icon
              class="item-action-icon"
              @click="onClickPreview(item)"
              v-if="judgeAllowPreview(item)"
            >
              <View />
            </el-icon>
            <el-icon class="item-action-icon" @click="onClickDelete(index)">
              <Delete />
            </el-icon>
          </div>
        </div>
      </div>
    </div>
    <el-image-viewer v-if="preview.show" @close="onClosePreview" :url-list="preview.url">
    </el-image-viewer>
  </div>
</template>
<script setup lang="ts">
import { Plus, View, Delete } from "@element-plus/icons-vue";
import constant from "@/utils/constant";
import cache from "@/utils/cache";
import { ElMessage, UploadProps } from "element-plus";
import { reactive } from "vue";
import {useUpload} from "@/hooks/useUpload";

interface IProps {
  onlyImage?: boolean;
  accept?: string[];
  fileList?: any[];
}

const { httpRequest } = useUpload()

const props = withDefaults(defineProps<IProps>(), {
  onlyImage: false,
  accept: () => {
    return [];
  },
  fileList: () => {
    return [
      // {
      //   name: "0cf8f47b095568234de35f931fd77d6b.jpeg",
      //   platform: "LOCAL",
      //   size: 50833,
      //   url:
      //     "https://test-jczl.hebhzjt.com:8443/yuan-oa/upload/20241125/0cf8f47b095568234de35f931fd77d6b_1732517131.jpeg",
      // },
    ];
  },
});

const emit = defineEmits<{
  (e: "update-file", value: any): void;
}>();

const onClickBeforeUpload: UploadProps["beforeUpload"] = (file) => {
  let fileNameList = file.name.split(".");
  let fileType = fileNameList[fileNameList.length - 1];
  if (props.accept.length > 0 && props.accept.indexOf(fileType) == -1) {
    ElMessage.error("文件格式不正确");
    return false;
  }
  return true;
};

const onSuccess = (res: any) => {
  if (res.code !== 0) {
    ElMessage.error(res.msg);
  } else {
    let newFileList = JSON.parse(JSON.stringify(props.fileList));
    newFileList.push(res.data.url);
    emit("update-file", newFileList);
  }
};

const onClickDelete = (index: number) => {
  let newFileList = JSON.parse(JSON.stringify(props.fileList));
  newFileList.splice(index, 1);
  emit("update-file", newFileList);
};

const judgeAllowPreview = (item: any) => {
  let fileNameList = item.name.split(".");
  let fileType = fileNameList[fileNameList.length - 1];
  if (["jpg", "png", "jpeg", "gif"].indexOf(fileType) == -1) {
    return false;
  } else {
    return true;
  }
};

//#region 预览
interface IPreview {
  show: boolean;
  url: string[];
}

const preview = reactive<IPreview>({
  show: false,
  url: [],
});
const onClickPreview = (item: any) => {
  preview.show = true;
  preview.url = [item.url];
};

const onClosePreview = () => {
  preview.show = false;
  preview.url = [];
};
//#endregion
</script>
<style lang="scss" scoped>
.upload {
  &-image {
    &-content {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      .item {
        position: relative;
        width: 100px;
        height: 100px;
        margin-right: 10px;
        &-action {
          position: absolute;
          left: 0;
          right: 0;
          top: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          display: flex;
          &-icon {
            color: #ffffff;
            font-size: 16px;
            cursor: pointer;
          }
        }
        // &:hover {
        //   .item-action {
        //     display: block;
        //   }
        // }
      }
      .main {
        width: 100px;
        height: 100px;
        background-color: #f5f5f5;
        display: flex;
        align-items: center;
        justify-content: center;
        &-upload {
          &-icon {
            font-size: 20px;
            color: #999999;
          }
        }
      }
    }
  }
  &-file {
    .item {
      display: flex;
      align-items: center;
      margin-top: 10px;
      &-action {
        margin-left: 16px;
        &-icon {
          cursor: pointer;
          margin-right: 10px;
          &:hover {
            color: #409eff;
          }
        }
      }
    }
  }
}
</style>
