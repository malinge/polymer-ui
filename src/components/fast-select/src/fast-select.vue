<template>
  <el-select
      :model-value="modelValue"
      :placeholder="placeholder"
      :clearable="clearable"
      @change="handleChange">
    <el-option
        v-for="data in dataList"
        :key="data.dictValue"
        :label="data.dictLabel"
        :value="data.dictValue">
      {{ data.dictLabel }}
    </el-option>
  </el-select>
</template>

<script setup lang="ts" name="FastSelect">
import { getDictDataList } from '@/utils/tool'
import { useAppStore } from '@/store/modules/app'

const appStore = useAppStore()
const props = defineProps({
  modelValue: {
    type: [Number, String],
    required: true
  },
  dictType: {
    type: String,
    required: true
  },
  clearable: {
    type: Boolean,
    required: false,
    default: () => false
  },
  placeholder: {
    type: String,
    required: false,
    default: () => ''
  }
})

// 添加处理函数，确保不会传递 undefined
const handleChange = (value: any) => {
  // 当值为 undefined 时转换为空字符串
  emit('update:modelValue', value === undefined ? '' : value)
}

// 添加 emit 声明
const emit = defineEmits(['update:modelValue'])

const dataList = getDictDataList(appStore.dictList, props.dictType)
</script>
