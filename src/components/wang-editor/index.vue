<template>
  <div style="border: 1px solid #ccc; z-index: 100">
    <!-- 工具栏 -->
    <Toolbar :editor="editorRef" :mode="mode" style="border-bottom: 1px solid #ccc" />
    <!-- 编辑器 -->
    <Editor
        :model-value="modelValue || ''"
        :style="style"
        :disabled="disabled"
        :default-config="editorConfig"
        :mode="mode"
        @on-created="handleCreated"
        @on-change="handleChange"
    />
  </div>
</template>

<script lang="ts" setup>
import '@wangeditor/editor/dist/css/style.css'
import { onBeforeUnmount, shallowRef, watch } from 'vue'
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'
import { IDomEditor, IEditorConfig } from '@wangeditor/editor'
import FileUrlUtils from "@/utils/fileUrlUtils";
import {ElMessage} from "element-plus";
import { useFileUpload } from "@/hooks/useFileUpload";

const props = defineProps({
  modelValue: {
    type: String,
    required: true,
    default: ''
  },
  mode: {
    type: String,
    default: 'default'
  },
  placeholder: {
    type: String,
    default: ''
  },
  style: {
    type: String,
    default: 'height: 400px;'
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue'])
// 在 setup 中调用 useFileUpload
const { uploadAttachmentSimplify } = useFileUpload()
// 编辑器实例，使用 undefined 而不是 null
const editorRef = shallowRef<IDomEditor>()

type InsertFnType = (url: string, alt: string, href: string) => void

// 编辑器配置
const editorConfig: Partial<IEditorConfig> = {
  placeholder: props.placeholder,
  readOnly: props.disabled,
  MENU_CONF: {
    uploadImage: {
      // 自定义上传
      async customUpload(file: File, insertFn: InsertFnType) {
        try {
          // 直接传递 File 对象
          const result = await uploadAttachmentSimplify(file)
          // 获取完整URL
          const url = await FileUrlUtils.getFullUrl(result.url)
          insertFn(url, result.name, result.url)
        } catch (error) {
          ElMessage.error('图片上传失败，请重试')
        }
      }
    }
  }
}

// 组件销毁时，也及时销毁编辑器
onBeforeUnmount(() => {
  const editor = editorRef.value
  if (editor == null) {
    return
  }
  editor.destroy()
  editorRef.value = undefined
})

const handleCreated = (editor: IDomEditor) => {
  editorRef.value = editor
}

// 编辑器change事件触发
const handleChange = (editor: IDomEditor) => {
  const html = editor.getHtml()
  emit('update:modelValue', html || '')
}

// 监听外部 modelValue 变化，更新编辑器内容
watch(() => props.modelValue, (newValue) => {
  const editor = editorRef.value
  if (editor && newValue !== editor.getHtml()) {
    editor.setHtml(newValue || '')
  }
}, { immediate: false })
</script>
