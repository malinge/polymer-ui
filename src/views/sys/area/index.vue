<template>

  <el-card>
    <el-form :inline="true">
      <el-form-item>
        <el-button type="primary" @click="areaFormHandle()">
          IP 查询
        </el-button>
      </el-form-item>
    </el-form>
    <el-table
            v-if="refreshTable"
            v-loading="state.dataListLoading"
            :default-expand-all="isExpandAll"
            :data="state.dataList"
            row-key="id"
            border
            style="width: 100%"
    >
      <el-table-column prop="id" label="编号" header-align="center"></el-table-column>
      <el-table-column prop="name" label="地名" header-align="center" align="center"></el-table-column>
    </el-table>

    <area-form ref="areaFormRef" />
  </el-card>
</template>
<script setup lang="tsx">
  import { ref, reactive } from 'vue'
  import AreaForm from './area-form.vue'
  import { IHooksOptions } from '@/hooks/interface'
  import {useCrud} from "@/hooks"


  const state: IHooksOptions = reactive({
    dataListUrl: '/sys/area/tree',
    isPage: false
  })

  const areaFormRef = ref()
  const areaFormHandle = () => {
    areaFormRef.value.open()
  }

  const { getDataList } = useCrud(state)

  // 是否展开，默认全部折叠
  const isExpandAll = ref(false)
  // 是否重新渲染表格状态
  const refreshTable = ref(true)


</script>

