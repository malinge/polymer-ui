<template>
  <el-card>
    <el-form :inline="true" :model="state.queryForm" @keyup.enter="getDataList()">
      <el-form-item>
        <el-input v-model="state.queryForm.mail" placeholder="邮箱" clearable></el-input>
      </el-form-item>
      <el-form-item>
        <el-input
          v-model="state.queryForm.username"
          placeholder="用户名"
          clearable
        ></el-input>
      </el-form-item>
      <el-form-item>
        <el-button @click="getDataList()">查询</el-button>
      </el-form-item>
      <el-form-item>
        <el-button
          v-auth="'message:mailAccount:save'"
          type="primary"
          @click="addOrUpdateHandle()"
          >新增</el-button
        >
      </el-form-item>
      <el-form-item>
        <el-button
          v-auth="'message:mailAccount:delete'"
          type="danger"
          @click="deleteBatchHandle()"
          >删除</el-button
        >
      </el-form-item>
    </el-form>
    <el-table
      v-loading="state.dataListLoading"
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
        prop="mail"
        label="邮箱"
        header-align="center"
        align="center"
      ></el-table-column>
      <el-table-column
        prop="username"
        label="用户名"
        header-align="center"
        align="center"
      ></el-table-column>
      <el-table-column
        prop="host"
        label="SMTP 服务器域名"
        header-align="center"
        align="center"
      ></el-table-column>
      <el-table-column
        prop="port"
        label="SMTP 服务器端口"
        header-align="center"
        align="center"
      ></el-table-column>
      <el-table-column
          prop="protocol"
          label="协议"
          header-align="center"
          align="center"
      ></el-table-column>
      <el-table-column
        prop="sslEnable"
        label="是否开启SSL"
        header-align="center"
        align="center"
      >
        <template #default="scope">
          <el-switch
            v-model="scope.row.sslEnable"
            disabled
            inline-prompt
            active-text="开"
            inactive-text="关"
          />
        </template>
      </el-table-column>

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
            v-auth="'message:mailAccount:update'"
            type="primary"
            link
            @click="addOrUpdateHandle(scope.row.id)"
            >修改</el-button
          >
          <el-button
            v-auth="'message:mailAccount:delete'"
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

    <!-- 弹窗, 新增 / 修改 -->
    <add-or-update ref="addOrUpdateRef" @refreshDataList="getDataList"></add-or-update>
  </el-card>
</template>

<script setup lang="ts" name="SysMailAccountIndex">
import { useCrud } from "@/hooks";
import { reactive, ref } from "vue";
import AddOrUpdate from "./add-or-update.vue";
import { IHooksOptions } from "@/hooks/interface";

const tableRef = ref();

const state: IHooksOptions = reactive({
  dataListUrl: "/message/mailAccount/page",
  deleteUrl: "/message/mailAccount",
  primaryKey: "id",
  queryForm: {
    mail: "",
    username: "",
  },
});

const addOrUpdateRef = ref();
const addOrUpdateHandle = (id?: number) => {
  addOrUpdateRef.value.init(id);
};

const {
  getDataList,
  sizeChangeHandle,
  currentChangeHandle,
  deleteBatchHandle,
  selectHandle,
  selectAllHandle,
} = useCrud(state, tableRef);
</script>
