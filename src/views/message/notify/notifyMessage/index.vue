<template>
  <el-card>
    <el-form :inline="true" :model="state.queryForm" @keyup.enter="getDataList()">
      <el-form-item>
        <el-input
          v-model="state.queryForm.templateCode"
          placeholder="模板编码"
        ></el-input>
      </el-form-item>
<!--      <el-form-item>
        <el-select v-model="state.queryForm.type" placeholder="模版类型">
          <el-option label="选择" value="0"></el-option>
        </el-select>
      </el-form-item>-->
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
<!--      <el-form-item>
        <el-button
          v-auth="'message:notifyMessage:save'"
          type="primary"
          @click="addOrUpdateHandle()"
          >新增</el-button
        >
      </el-form-item>
      <el-form-item>
        <el-button
          v-auth="'message:notifyMessage:delete'"
          type="danger"
          @click="deleteBatchHandle()"
          >删除</el-button
        >
      </el-form-item>-->
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
        prop="templateCode"
        label="模板编码"
        header-align="center"
        align="center"
      ></el-table-column>
      <el-table-column
        prop="sender"
        label="发送人"
        header-align="center"
        align="center"
      ></el-table-column>
      <el-table-column
        prop="content"
        label="内容"
        header-align="center"
        align="center"
      ></el-table-column>
      <fast-table-column
          prop="type"
          label="类型"
          dict-type="notify_type"
          align="center"
          width="100"
      ></fast-table-column>
<!--      <fast-table-column
          prop="readStatus"
          label="是否已读"
          dict-type="notify_read_status"
          align="center"
          width="100"
      ></fast-table-column>-->
<!--      <el-table-column
        prop="readTime"
        label="阅读时间"
        header-align="center"
        align="center"
      ></el-table-column>-->
      <el-table-column
        prop="createTime"
        label="创建时间"
        header-align="center"
        align="center"
      ></el-table-column>
<!--      <el-table-column
        label="操作"
        fixed="right"
        header-align="center"
        align="center"
        width="150"
      >
        <template #default="scope">
          <el-button
            v-auth="'message:notifyMessage:update'"
            type="primary"
            link
            @click="addOrUpdateHandle(scope.row.id)"
            >修改</el-button
          >
          <el-button
            v-auth="'message:notifyMessage:delete'"
            type="primary"
            link
            @click="deleteBatchHandle(scope.row.id)"
            >删除</el-button
          >
        </template>
      </el-table-column>-->
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

<script setup lang="ts" name="MessageNotifyMessageIndex">
import { useCrud } from "@/hooks";
import { reactive, ref } from "vue";
import AddOrUpdate from "./add-or-update.vue";
import { IHooksOptions } from "@/hooks/interface";

const tableRef = ref();

const state: IHooksOptions = reactive({
  dataListUrl: "/message/notifyMessage/page",
  deleteUrl: "/message/notifyMessage",
  primaryKey: "id",
  queryForm: {
    templateCode: "",
    type: "",
    createTime: "",
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
