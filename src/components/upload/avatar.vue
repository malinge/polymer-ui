<template>
  <el-upload
      class="avatar-uploader"
      :action="constant.uploadUrl"
      :show-file-list="false"
      :http-request="httpRequest"
      :on-success="handleAvatarSuccess"
      :before-upload="beforeAvatarUpload">
    <!-- 使用容器包裹头像和操作层 -->
    <div class="avatar-container">
      <img v-if="props.modelValue" :src="previewUrl" class="avatar" alt="头像" />
      <el-icon v-else class="avatar-uploader-icon"> <Plus /> </el-icon>
      <!-- 遮罩层和删除按钮 -->
      <div v-if="props.modelValue" class="avatar-mask" @click.stop="handleRemoveAvatar" >
        <el-icon class="delete-icon"><Delete /></el-icon>
      </div>
    </div>
  </el-upload>
</template>
<script setup lang="ts">
import constant from "@/utils/constant";
import {Delete, Plus} from "@element-plus/icons-vue";
import { ElMessage, type UploadProps } from "element-plus";
import { updateUserAvatar } from '@/api/sys/avatar'
import {useUpload} from "@/hooks/useUpload";
import {onMounted, ref, watch} from "vue";
import FileUrlUtils from "@/utils/fileUrlUtils";

// 定义 Props 接收父组件传递的 avatar 值
const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  // 新增控制删除逻辑的参数
  enableRemoveAction: {
    type: Boolean,
    default: false  // 默认开启删除逻辑
  },
  // 新增控制删除逻辑的参数
  bizId: {
    type: Number,
    default: ''  // 默认开启删除逻辑
  }
});

// 定义 Emits 事件
const emit = defineEmits(['update:modelValue']); // 新增 remove 事件
const { httpRequest } = useUpload()
const previewUrl = ref('');

// 获取预览URL
const fetchPreviewUrl = async () => {
  previewUrl.value =  await FileUrlUtils.getFullUrl(props.modelValue)
};

// 监听modelValue变化
watch(() => props.modelValue, fetchPreviewUrl);

// 组件挂载时初始化
onMounted(fetchPreviewUrl);

const handleAvatarSuccess: UploadProps['onSuccess'] = (res) => {
  // 通过 emit 更新父组件的绑定值
  emit('update:modelValue', res.url);
  if (props.enableRemoveAction) {
    // 触发 remove 事件通知父组件
    const dataForm = {
      id: props.bizId,
      avatar: res.url
    }
    updateUserAvatar(dataForm).then(() => {
      ElMessage.success('修改成功')
    })
  }
}

const beforeAvatarUpload: UploadProps['beforeUpload'] = (rawFile) => {
  if (rawFile.type !== 'image/jpeg' && rawFile.type !== 'image/png') {
    ElMessage.error('Avatar picture must be JPG OR PNG format!')
    return false
  } else if (rawFile.size / 1024 / 1024 > 2) {
    ElMessage.error('Avatar picture size can not exceed 2MB!')
    return false
  }
  return true
}

// 删除头像处理
const handleRemoveAvatar = (event: Event) => {
  event.stopPropagation();
  // 清空时触发更新
  emit('update:modelValue', '');
  // 这里可以添加服务器删除逻辑
  // 根据参数判断是否触发删除逻辑
  if (props.enableRemoveAction) {
    // 触发 remove 事件通知父组件
    const dataForm = {
      id: props.bizId,
    }
    updateUserAvatar(dataForm).then(() => {
      ElMessage.success('修改成功')
    })
  }
};
</script>


<style scoped>
.avatar-uploader {
  --avatar-size: 170px;
  position: relative;
  display: inline-block;
}

.avatar-container {
  position: relative;
  width: var(--avatar-size);
  height: var(--avatar-size);
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  overflow: hidden;
  transition: border-color 0.3s;
}

.avatar-container:hover {
  border-color: #409EFF;
}

.avatar,
.avatar-uploader-icon {
  width: var(--avatar-size);
  height: var(--avatar-size);
  display: block;
}

.avatar-uploader-icon {
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 28px;
  color: #8c939d;
}

.avatar-mask {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  opacity: 0;
  transition: opacity 0.3s;
}

.avatar-container:hover .avatar-mask {
  opacity: 1;
}

.delete-icon {
  color: white;
  font-size: 24px;
  cursor: pointer;
}

.delete-icon:hover {
  color: #c1bebe;
}
</style>
