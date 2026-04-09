<template>
  <el-card>
    <el-form :inline="true" :model="state.queryForm" @keyup.enter="getDataList()">
      <el-form-item>
        <el-input v-model="state.queryForm.name" placeholder="模板名称"></el-input>
      </el-form-item>
      <el-form-item>
        <el-input v-model="state.queryForm.code" placeholder="模版编码"></el-input>
      </el-form-item>
      <el-form-item>
        <fast-select
          v-model="state.queryForm.status"
          dict-type="notify_status"
          clearable
          placeholder="状态"
        ></fast-select>
      </el-form-item>
      <el-form-item>
        <el-date-picker
          v-model="state.queryForm.createTime"
          type="daterange"
          value-format="YYYY-MM-DD"
        >
        </el-date-picker>
      </el-form-item>
      <el-form-item>
        <el-button @click="getDataList()">查询</el-button>
      </el-form-item>
      <el-form-item>
        <el-button
          v-auth="'message:notifyTemplate:save'"
          type="primary"
          @click="addOrUpdateHandle()"
          >新增</el-button
        >
      </el-form-item>
      <el-form-item>
        <el-button
          v-auth="'message:notifyTemplate:delete'"
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
        prop="name"
        label="模板名称"
        header-align="center"
        align="center"
        width="120"
        :show-overflow-tooltip="true"
      ></el-table-column>
      <el-table-column
        prop="code"
        label="模版编码"
        header-align="center"
        align="center"
        width="120"
        :show-overflow-tooltip="true"
      ></el-table-column>
      <el-table-column
        prop="nickname"
        label="发送人名称"
        header-align="center"
        align="center"
      ></el-table-column>
      <el-table-column
        prop="content"
        label="模版内容"
        header-align="center"
        align="center"
        width="200"
        :show-overflow-tooltip="true"
      ></el-table-column>
      <fast-table-column
        prop="type"
        label="类型"
        dict-type="notify_type"
        align="center"
        width="100"
      ></fast-table-column>
      <fast-table-column
        prop="status"
        label="状态"
        dict-type="notify_status"
        align="center"
        width="80"
      ></fast-table-column>
      <el-table-column
        prop="remark"
        label="备注"
        header-align="center"
        align="center"
        :show-overflow-tooltip="true"
      ></el-table-column>
      <el-table-column
        prop="createTime"
        label="创建时间"
        header-align="center"
        align="center"
        width="180"
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
            v-auth="'message:notifyTemplate:update'"
            type="primary"
            link
            @click="addOrUpdateHandle(scope.row.id)"
            >修改</el-button
          >
          <el-button
            v-auth="'message:notifyTemplate:sendNotify'"
            type="primary"
            link
            @click="openSendForm(scope.row)"
            >测试</el-button
          >
          <el-button
            v-auth="'message:notifyTemplate:delete'"
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
    <!-- 表单弹窗：测试发送 -->
    <!--		<NotifyTemplateSendForm ref="sendFormRef" />-->
  </el-card>
</template>

<script setup lang="ts" name="MessageNotifyTemplateIndex">
import { useCrud } from "@/hooks";
import { reactive, ref } from "vue";
import AddOrUpdate from "./add-or-update.vue";
import { IHooksOptions } from "@/hooks/interface";
import * as NotifyTemplateApi from "@/api/message/notifyTemplate";

const tableRef = ref();

const state: IHooksOptions = reactive({
  dataListUrl: "/message/notifyTemplate/page",
  deleteUrl: "/message/notifyTemplate",
  primaryKey: "id",
  queryForm: {
    name: "",
    code: "",
    status: "",
    createTime: "",
  },
});

const addOrUpdateRef = ref();
const addOrUpdateHandle = (id?: number) => {
  addOrUpdateRef.value.init(id);
};

/** 发送站内信按钮 */
const sendFormRef = ref(); // 表单 Ref
const openSendForm = (row: NotifyTemplateApi.NotifyTemplateVO) => {
  sendFormRef.value.open(row.id);
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
