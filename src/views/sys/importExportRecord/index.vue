<template>
  <!-- 卡片容器，提供阴影和边框效果 -->
  <el-card>

    <!-- 内联表单，用于查询条件输入 -->
    <el-form :inline="true" :model="state.queryForm" @keyup.enter="getDataList()">
      <el-form-item>
        <el-input v-model="state.queryForm.operatorName" placeholder="操作人姓名" clearable></el-input>
      </el-form-item>
      <el-form-item>
        <el-input v-model="state.queryForm.businessType" placeholder="对象" clearable></el-input>
      </el-form-item>
      <el-form-item>
        <el-select v-model="state.queryForm.operationType" style="width: 100px" placeholder="操作类型">
          <el-option label="导入" value="import"></el-option>
          <el-option label="导出" value="export"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-date-picker
            v-model="createTimeRef"
            type="datetimerange"
            start-placeholder="开始操作时间"
            end-placeholder="结束操作时间"
            value-format="YYYY-MM-DD HH:mm:ss" @change="onChangeCreateTime">
        </el-date-picker>
      </el-form-item>
      <el-form-item>
        <el-button @click="getDataList()">查询</el-button>
      </el-form-item>
    </el-form>

    <!-- 数据表格 -->
    <el-table v-loading="state.dataListLoading" :data="state.dataList" border style="width: 100%" @selection-change="selectionChangeHandle">
      <el-table-column prop="operatorName" label="操作人姓名" header-align="center" align="center" width="100"></el-table-column>
      <el-table-column prop="businessType" label="对象" header-align="center" align="center" width="60"></el-table-column>
      <el-table-column prop="operationType" label="操作类型" header-align="center" align="center" width="100">
        <template #default="{ row }">{{ operationTypeMap[row.operationType] || row.operationType }}</template>
      </el-table-column>
      <el-table-column prop="createTime" label="操作时间" header-align="center" align="center" width="160"></el-table-column>
      <el-table-column prop="totalCount" label="总数据量" header-align="center" align="center" width="90"></el-table-column>
      <el-table-column prop="successCount" label="成功量" header-align="center" align="center" width="70"></el-table-column>
      <el-table-column prop="errorCount" label="失败量" header-align="center" align="center" width="70"></el-table-column>
      <el-table-column prop="conflictHandleCount" label="冲突量" header-align="center" align="center" width="70"></el-table-column>
      <el-table-column prop="importStrategy" label="策略" header-align="center" align="center" width="100">
        <template #default="{ row }">{{ importStrategyMap[row.importStrategy] || row.importStrategy }}</template>
      </el-table-column>
      <el-table-column prop="errorFileUrl" label="错误文件" header-align="center" align="center" width="90">
        <template #default="{ row }">
          <el-link v-if="row.errorFileUrl" type="primary" @click="downloadHandle(row.errorFileUrl, '错误.xlsx')">下载</el-link>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column prop="resultFileUrl" label="结果文件" header-align="center" align="center" width="90">
        <template #default="{ row }">
          <el-link v-if="row.resultFileUrl" type="primary" @click="downloadHandle(row.resultFileUrl, 'data.xlsx')">下载</el-link>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column prop="remark" label="备注" header-align="center" align="center" min-width="380"></el-table-column>
    </el-table>

    <!-- 分页组件 -->
    <el-pagination
        :current-page="state.pageNo"
        :page-sizes="state.pageSizes"
        :page-size="state.pageSize"
        :total="state.total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="sizeChangeHandle"
        @current-change="currentChangeHandle">
    </el-pagination>

  </el-card>
</template>

<script setup lang="ts" name="SystemImportExportRecordIndex">
// 导入必要的库和组件
import {useCrud} from '@/hooks' // 封装的CRUD钩子
import {reactive, ref} from 'vue'
import {IHooksOptions} from '@/hooks/interface' // 类型定义

/**
 * 操作类型映射
 */
const operationTypeMap: Record<string, string> = {
  'import': '导入',
  'export': '导出',
}

/**
 * 导入策略映射
 */
const importStrategyMap: Record<string, string> = {
  'update': '更新',
  'skip': '跳过',
  'override': '覆盖',
}

/**
 * 状态管理
 * 使用封装的useCrud钩子管理列表页的CRUD操作
 */
const state: IHooksOptions = reactive({
  dataListUrl: '/system/importExportRecord/page',  // 数据列表接口
  deleteUrl: '/system/importExportRecord',         // 删除接口
  queryForm: {  // 查询表单数据
    operatorName: '',
    businessType: '',
    operationType: '',
    beginCreateTime: '',
    endCreateTime: ''
  }
})

const createTimeRef = ref<string[]>([])
/**
 * 创建时间范围选择变更处理
 * @param {any} value - 日期选择器返回的值数组
 */
const onChangeCreateTime = (value: any) => {
  if (value && value.length === 2) {
    state.queryForm.beginCreateTime = value[0];
    state.queryForm.endCreateTime = value[1];
  }else {
    state.queryForm.beginCreateTime = '';
    state.queryForm.endCreateTime = '';
  }
}

// 从useCrud钩子中解构出CRUD操作方法
const {
  getDataList,              // 获取数据列表
  selectionChangeHandle,    // 多选变化处理
  sizeChangeHandle,         // 分页大小变化处理
  currentChangeHandle,      // 当前页码变化处理
  downloadHandle,
} = useCrud(state)
</script>
