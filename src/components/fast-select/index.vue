<template>
  <el-select
      :model-value="stringValue"
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

<script setup lang="ts">
import { computed } from 'vue'
import { getDictDataList } from '@/utils/tool'
import { useAppStore } from '@/store/modules/app'

const appStore = useAppStore()
const emit = defineEmits(['update:modelValue'])
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

// 将传入的值转为字符串类型，确保与 dictValue 匹配
const stringValue = computed(() => {
  return props.modelValue !== undefined && props.modelValue !== null
      ? String(props.modelValue)
      : ''
})

const handleChange = (value: any) => {
  emit('update:modelValue', value)
}

// 改为 computed，确保字典数据异步加载后能响应式更新
const dataList = computed(() => {
  return getDictDataList(appStore.dictList, props.dictType)
})
</script>
