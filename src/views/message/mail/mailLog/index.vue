<template>
  <el-card>
    <el-form :inline="true" :model="state.queryForm" @keyup.enter="getDataList()">
      <el-form-item>
        <el-input
          v-model="state.queryForm.templateTitle"
          placeholder="邮件标题"
          clearable
        ></el-input>
      </el-form-item>
      <el-form-item>
        <el-button @click="getDataList()">查询</el-button>
      </el-form-item>
<!--      <el-form-item>
        <el-button
          v-auth="'message:mailLog:save'"
          type="primary"
          @click="addOrUpdateHandle()"
          >新增</el-button
        >
      </el-form-item>-->
      <el-form-item>
        <el-button
          v-auth="'message:mailLog:delete'"
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
        prop="toMail"
        label="接收邮箱地址"
        header-align="center"
        align="center"
      ></el-table-column>
      <el-table-column
        prop="fromMail"
        label="发送邮箱地址"
        header-align="center"
        align="center"
      ></el-table-column>
      <el-table-column
        prop="templateCode"
        label="模板编码"
        header-align="center"
        align="center"
      ></el-table-column>
      <el-table-column
        prop="templateNickname"
        label="模版发送人名称"
        header-align="center"
        align="center"
      ></el-table-column>
      <el-table-column
        prop="templateTitle"
        label="邮件标题"
        header-align="center"
        align="center"
      ></el-table-column>
      <el-table-column
        prop="sendStatusLabel"
        label="发送状态"
        header-align="center"
        align="center"
      ></el-table-column>
      <el-table-column
        prop="sendTime"
        label="发送时间"
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
          <el-button type="primary" link @click="detailHandle(scope.row)">查看</el-button>
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

    <!-- 详情 -->
    <mail-log-detail ref="detailRef"></mail-log-detail>
  </el-card>
</template>

<script setup lang="ts" name="SysMailLogIndex">
import { useCrud } from "@/hooks";
import { reactive, ref } from "vue";
import { IHooksOptions } from "@/hooks/interface";
import MailLogDetail from "./mail-log-detail.vue";

const tableRef = ref();

const state: IHooksOptions = reactive({
  dataListUrl: "/message/mailLog/page",
  deleteUrl: "/message/mailLog",
  primaryKey: "id",
  queryForm: {
    templateTitle: "",
  },
});

const detailRef = ref();
const detailHandle = (row: any) => {
  detailRef.value.init(row);
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
