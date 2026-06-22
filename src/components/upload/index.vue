<template>
  <div class="upload">
    <!-- 图片上传模式 -->
    <div class="upload-image" v-if="props.onlyImage">
      <div class="upload-image-content">
        <div class="item" v-for="(item, index) in fileListModel" :key="index">
          <el-image style="width: 100%; height: 100%" :src="fullUrlMap[item.url] || item.url"></el-image>
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
        <div class="main" v-if="!props.maxCount || fileListModel.length < props.maxCount">
          <el-upload
              ref="uploadRef"
              class="main-upload"
              :show-file-list="false"
              :http-request="uploadAttachmentWithLoading"
              :on-success="onSuccess"
              :before-upload="onClickBeforeUpload"
              :accept="acceptStr"
              v-loading="uploadLoading"
              element-loading-text="上传中..."
          >
            <el-icon class="main-upload-icon">
              <Plus />
            </el-icon>
          </el-upload>
        </div>
      </div>
    </div>

    <!-- 文件上传模式 -->
    <div class="upload-file" v-else>
      <div class="upload-file-content">
        <div class="main">
          <el-upload
              ref="uploadRef"
              class="main-upload"
              :show-file-list="false"
              :http-request="uploadAttachmentWithLoading"
              :on-success="onSuccess"
              :before-upload="onClickBeforeUpload"
              :accept="acceptStr">
            <slot name="upload">
              <el-button type="primary" :loading="uploadLoading">上传</el-button>
            </slot>
          </el-upload>
        </div>
        <!-- 当 noFileList 为 true 时，不显示文件列表 -->
        <template v-if="!props.noFileList">
          <div class="item" v-for="(item, index) in fileListModel" :key="index">
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
        </template>
      </div>
    </div>

    <!-- 图片预览 -->
    <el-image-viewer
        v-if="preview.show"
        @close="onClosePreview"
        :url-list="preview.urlList"
    />
  </div>
</template>

<script setup lang="ts">
import { Plus, View, Delete } from "@element-plus/icons-vue";
import { ElMessage, UploadProps, UploadRequestOptions } from "element-plus";
import { reactive, ref, computed, watch } from "vue";
import { useFileUpload, type AttachmentUploadResult } from "@/hooks/useFileUpload";
import FileUrlUtils from "@/utils/fileUrlUtils";

// ==================== 类型定义 ====================

interface FileItem {
  name: string;
  url: string;
  size: number;
  platform: string;
}

interface PreviewConfig {
  show: boolean;
  urlList: string[];
}

interface IProps {
  onlyImage?: boolean;
  accept?: string[];
  fileList?: FileItem[];
  previewExts?: string[];
  maxSize?: number;
  maxCount?: number;
  /** 是否不显示文件列表（用于表头场景） */
  noFileList?: boolean;
}

const props = withDefaults(defineProps<IProps>(), {
  onlyImage: false,
  accept: () => [],
  fileList: () => [],
  previewExts: () => ['jpg', 'png', 'jpeg', 'gif', 'webp', 'bmp', 'svg'],
  maxSize: 100,
  maxCount: undefined,
  noFileList: false,
});

// ==================== Emits ====================

const emit = defineEmits<{
  (e: "update:fileList", value: FileItem[]): void;
  (e: "update-file", value: FileItem[]): void;
  (e: "success", result: AttachmentUploadResult): void;
  (e: "error", error: Error): void;
}>();

// ==================== Hooks ====================

const { uploadAttachment } = useFileUpload();

// ==================== 响应式状态 ====================

const uploadLoading = ref(false);
const fileListModel = ref<FileItem[]>([]);
const fullUrlMap = ref<Record<string, string>>({});
const preview = reactive<PreviewConfig>({
  show: false,
  urlList: [],
});

// ==================== 计算属性 ====================

const acceptStr = computed(() => {
  if (!props.accept || props.accept.length === 0) return undefined;
  return props.accept.map(ext => `.${ext}`).join(',');
});

// ==================== 工具方法 ====================

/**
 * 判断是否为完整 URL
 */
const isFullUrl = (url: string): boolean => {
  if (!url) return false;
  return /^https?:\/\//.test(url) ||
      url.startsWith('data:') ||
      url.startsWith('blob:');
};

/**
 * 加载单个文件的完整 URL
 */
const loadFullUrl = async (url: string): Promise<string> => {
  if (!url) return '';
  if (isFullUrl(url)) return url;

  return await FileUrlUtils.getFullUrl(url);
};

/**
 * 加载所有文件的完整 URL
 */
const loadAllFullUrls = async (items: FileItem[]) => {
  const map: Record<string, string> = {};

  for (const item of items) {
    if (item.url && !isFullUrl(item.url)) {
      map[item.url] = await loadFullUrl(item.url);
    }
  }

  fullUrlMap.value = map;
};

// ==================== 监听器 ====================

watch(
    () => props.fileList,
    async (newVal) => {
      const list = Array.isArray(newVal) ? [...newVal] : [];
      fileListModel.value = list;

      // 加载完整 URL
      if (list.length > 0) {
        await loadAllFullUrls(list);
      } else {
        fullUrlMap.value = {};
      }
    },
    { immediate: true, deep: true }
);

// ==================== 核心方法 ====================

const updateFileList = (newList: FileItem[]) => {
  fileListModel.value = newList;
  emit("update:fileList", newList);
  emit("update-file", newList);

  // 加载新文件的完整 URL
  if (newList.length > 0) {
    loadAllFullUrls(newList);
  }
};

const onClickBeforeUpload: UploadProps["beforeUpload"] = (file) => {
  if (props.accept && props.accept.length > 0) {
    const fileNameList = file.name.split(".");
    const fileType = fileNameList[fileNameList.length - 1].toLowerCase();

    if (!props.accept.map(ext => ext.toLowerCase()).includes(fileType)) {
      ElMessage.error(`文件格式不正确，仅支持：${props.accept.join(', ')}`);
      return false;
    }
  }

  if (props.maxSize && props.maxSize > 0) {
    const maxSizeBytes = props.maxSize * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      ElMessage.error(`文件大小不能超过 ${props.maxSize}MB`);
      return false;
    }
  }

  return true;
};

const uploadAttachmentWithLoading = async (options: UploadRequestOptions) => {
  uploadLoading.value = true;
  try {
    return await uploadAttachment(options);
  } catch (error) {
    uploadLoading.value = false;
    throw error;
  }
};

const onSuccess = (result: AttachmentUploadResult) => {
  uploadLoading.value = false;

  if (!result || !result.url) {
    ElMessage.error("上传失败：未获取到文件信息");
    return;
  }

  // 只有非 noFileList 模式才更新文件列表
  if (!props.noFileList) {
    const newList = [...fileListModel.value, result];
    updateFileList(newList);
  }

  // 触发成功事件
  emit("success", result);
  ElMessage.success(`文件 ${result.name} 上传成功`);
};

const onError = (error: Error) => {
  uploadLoading.value = false;
  emit("error", error);
  ElMessage.error(error.message || "上传失败");
};

const onClickDelete = (index: number) => {
  const newList = [...fileListModel.value];
  const deleted = newList.splice(index, 1);

  // 从映射中移除
  if (deleted.length > 0 && deleted[0].url) {
    delete fullUrlMap.value[deleted[0].url];
  }

  updateFileList(newList);

  if (deleted.length > 0) {
    ElMessage.success(`已删除文件：${deleted[0].name}`);
  }
};

const judgeAllowPreview = (item: FileItem): boolean => {
  if (!item || !item.name) return false;

  const fileNameList = item.name.split(".");
  const fileType = fileNameList[fileNameList.length - 1].toLowerCase();

  const previewExts = props.previewExts?.length ? props.previewExts : ['jpg', 'png', 'jpeg', 'gif', 'webp', 'bmp', 'svg'];
  return previewExts.map(ext => ext.toLowerCase()).includes(fileType);
};

// ==================== 预览 ====================

const onClickPreview = async (item: FileItem) => {
  if (!item?.url) return;

  // 获取完整 URL
  let fullUrl = fullUrlMap.value[item.url];

  if (!fullUrl && !isFullUrl(item.url)) {
    fullUrl = await loadFullUrl(item.url);
    // 更新映射
    if (fullUrl) {
      fullUrlMap.value = { ...fullUrlMap.value, [item.url]: fullUrl };
    }
  } else if (isFullUrl(item.url)) {
    fullUrl = item.url;
  }

  if (fullUrl) {
    preview.show = true;
    preview.urlList = [fullUrl];
  } else {
    ElMessage.error('获取预览地址失败');
  }
};

const onClosePreview = () => {
  preview.show = false;
  preview.urlList = [];
};

// ==================== 暴露方法 ====================

defineExpose({
  clearFiles: () => {
    updateFileList([]);
  },
  getFileList: () => fileListModel.value,
  resetUploadStatus: () => {
    uploadLoading.value = false;
  },
});
</script>

<style lang="scss" scoped>
.upload {
  &-image {
    &-content {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 10px;

      .item {
        position: relative;
        width: 100px;
        height: 100px;
        border-radius: 4px;
        overflow: hidden;
        border: 1px solid #e4e7ed;
        flex-shrink: 0;

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
          opacity: 0;
          transition: opacity 0.3s;

          &-icon {
            color: #ffffff;
            font-size: 18px;
            cursor: pointer;
            padding: 4px;
            border-radius: 50%;
            transition: transform 0.2s;

            &:hover {
              transform: scale(1.2);
              background-color: rgba(255, 255, 255, 0.2);
            }
          }
        }

        &:hover {
          .item-action {
            opacity: 1;
          }
        }
      }

      .main {
        width: 100px;
        height: 100px;
        background-color: #f5f7fa;
        border: 1px dashed #d9d9d9;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.3s;
        flex-shrink: 0;

        &:hover {
          border-color: #409eff;
          background-color: #ecf5ff;
        }

        &-upload {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;

          &-icon {
            font-size: 28px;
            color: #8c939d;
          }
        }
      }
    }
  }

  &-file {
    .upload-file-content {
      .main {
        margin-bottom: 10px;
      }

      .item {
        display: flex;
        align-items: center;
        padding: 8px 12px;
        background-color: #f5f7fa;
        border-radius: 4px;
        margin-bottom: 8px;
        transition: background-color 0.2s;

        &:hover {
          background-color: #ecf5ff;
        }

        &-name {
          flex: 1;
          color: #303133;
          font-size: 14px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        &-action {
          display: flex;
          align-items: center;
          margin-left: 16px;
          flex-shrink: 0;

          &-icon {
            font-size: 18px;
            cursor: pointer;
            padding: 4px;
            border-radius: 50%;
            transition: all 0.2s;

            &:hover {
              color: #409eff;
              background-color: rgba(64, 158, 255, 0.1);
            }

            &:last-child {
              margin-left: 8px;

              &:hover {
                color: #f56c6c;
                background-color: rgba(245, 108, 108, 0.1);
              }
            }
          }
        }
      }
    }
  }
}
</style>
