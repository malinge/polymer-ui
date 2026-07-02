<template>
  <el-row :gutter="6">
    <el-col :span="5">
      <el-card>
        <DeptTree @node-click="handleDeptClick"/>
      </el-card>
    </el-col>
    <el-col :span="19">
      <el-card>
        <el-form :inline="true" :model="state.queryForm" @keyup.enter="getDataList()">
          <el-form-item>
            <el-input v-model="state.queryForm.username" placeholder="用户名" clearable/>
          </el-form-item>
          <el-form-item>
            <el-input v-model="state.queryForm.mobile" placeholder="手机号" clearable/>
          </el-form-item>
          <el-form-item>
            <el-button @click="getDataList()">查询</el-button>
          </el-form-item>
          <el-form-item>
            <el-button v-auth="'sys:user:save'" type="primary" @click="addOrUpdateHandle()">新增</el-button>
          </el-form-item>
          <el-form-item>
            <el-button v-auth="'sys:user:delete'" type="danger" @click="deleteBatchHandle()">删除</el-button>
          </el-form-item>
          <el-form-item v-auth="'sys:user:import'">
            <DataImport
                ref="dataImportRef"
                import-url="/sys/user/import"
                :accept="['xlsx', 'xls']"
                :max-size="2"
                :max-records="10000"
                business-name="用户"
                templateUrl="/sys/user/exportTemplate"
                duplicate-fields-api="/sys/user/uniqueFields"
                @success="handleImportSuccess"
                @error="handleImportError"/>
          </el-form-item>
          <el-form-item>
            <el-button v-auth="'sys:user:export'" type="success" @click="exportHandle()">导出</el-button>
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
            @select-all="selectAllHandle">
          <el-table-column type="selection" header-align="center" align="center" width="50"></el-table-column>
          <el-table-column prop="username" label="用户账号" header-align="center" align="center"></el-table-column>
          <el-table-column prop="realName" label="用户姓名" header-align="center" align="center"></el-table-column>
          <fast-table-column prop="gender" label="用户性别" dict-type="user_gender"></fast-table-column>
          <el-table-column prop="mobile" label="手机号码" header-align="center" align="center"></el-table-column>
          <el-table-column prop="deptName" label="所属部门" header-align="center" align="center"></el-table-column>
          <fast-table-column prop="status" label="用户状态" dict-type="user_status"></fast-table-column>
          <el-table-column prop="createTime" label="创建时间" header-align="center" align="center"></el-table-column>
          <el-table-column label="操作" fixed="right" header-align="center" align="center" width="120">
            <template #default="scope">
              <el-button v-auth="'sys:user:update'" type="primary" link @click="addOrUpdateHandle(scope.row.id)">修改</el-button>
              <el-button v-auth="'sys:user:delete'" type="primary" link @click="deleteBatchHandle(scope.row.id)">删除</el-button>
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
            @current-change="currentChangeHandle">
        </el-pagination>
      </el-card>
    </el-col>
  </el-row>
  <add-or-update ref="addOrUpdateRef" @refresh-data-list="getDataList"></add-or-update>
</template>

<script setup lang="ts" name="SysUserIndex">
import {useCrud} from "@/hooks";
import {reactive, ref} from "vue";
import AddOrUpdate from "./add-or-update.vue";
import {IHooksOptions} from "@/hooks/interface";
import DeptTree from "./dept-tree.vue";
import DataImport from "@/components/upload/dataImport.vue"

const state: IHooksOptions = reactive({
  dataListUrl: "/sys/user/page",
  deleteUrl: "/sys/user",
  exportUrl: "/sys/user/export",
  primaryKey: "id",
  queryForm: {
    username: "",
    mobile: "",
    gender: "",
    deptId: "",
  },
});

const tableRef = ref();
const dataImportRef = ref()
const addOrUpdateRef = ref();

const addOrUpdateHandle = (id?: number) => {
  addOrUpdateRef.value.init(id);
};

const handleDeptClick = (deptId: number) => {
  state.queryForm.deptId = deptId;
  getDataList();
};

// 不接收参数
const handleImportSuccess = () => {
  getDataList()
}

const handleImportError = () => {
  getDataList()
  //ElMessage.error('导入失败')
}


const {
  getDataList,
  sizeChangeHandle,
  currentChangeHandle,
  deleteBatchHandle,
  exportHandle,
  selectHandle,
  selectAllHandle,
} = useCrud(state, tableRef);
</script>
