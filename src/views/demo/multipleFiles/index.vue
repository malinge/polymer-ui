<template>
	<!-- 卡片容器，提供阴影和边框效果 -->
	<el-card>

		<!-- 内联表单，用于查询条件输入 -->
		<el-form :inline="true" :model="state.queryForm" @keyup.enter="getDataList()">
					<el-form-item>
				<el-button @click="getDataList()">查询</el-button>
			</el-form-item>
			<el-form-item>
				<el-button v-auth="'demo:multipleFiles:save'" type="primary" @click="addOrUpdateHandle()">新增</el-button>
			</el-form-item>
			<el-form-item>
				<el-button v-auth="'demo:multipleFiles:delete'" type="danger" @click="deleteBatchHandle()">删除</el-button>
			</el-form-item>
		</el-form>

		<!-- 数据表格 -->
		<el-table v-loading="state.dataListLoading" :data="state.dataList" border style="width: 100%" @selection-change="selectionChangeHandle">
			<el-table-column type="selection" header-align="center" align="center" width="50"></el-table-column>
			<el-table-column prop="id" label="id" header-align="center" align="center"></el-table-column>
			<el-table-column prop="name" label="名称" header-align="center" align="center"></el-table-column>
			<el-table-column prop="createTime" label="创建时间" header-align="center" align="center"></el-table-column>
			<el-table-column label="操作" fixed="right" header-align="center" align="center" width="150">
				<template #default="scope">
					<el-button v-auth="'demo:multipleFiles:update'" type="primary" link @click="addOrUpdateHandle(scope.row.id)">修改</el-button>
					<el-button v-auth="'demo:multipleFiles:delete'" type="primary" link @click="deleteBatchHandle(scope.row.id)">删除</el-button>
				</template>
			</el-table-column>
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

		<!-- 新增/修改弹窗 -->
		<add-or-update ref="addOrUpdateRef" @refreshDataList="getDataList"></add-or-update>
	</el-card>
</template>

<script setup lang="ts" name="DemoMultipleFilesIndex">
// 导入必要的库和组件
import {useCrud} from '@/hooks' // 封装的CRUD钩子
import {reactive, ref} from 'vue'
import {IHooksOptions} from '@/hooks/interface' // 类型定义
import AddOrUpdate from "./add-or-update.vue";

/**
 * 状态管理
 * 使用封装的useCrud钩子管理列表页的CRUD操作
 */
const state: IHooksOptions = reactive({
	dataListUrl: '/demo/multipleFiles/page',  // 数据列表接口
	deleteUrl: '/demo/multipleFiles',         // 删除接口
	queryForm: {  // 查询表单数据
	}
})

// 引用组件/响应式
const addOrUpdateRef = ref()

/**
 * 打开新增/修改弹窗
 * @param {number} [id] - 需要修改的条目ID，不传表示新增
 */
const addOrUpdateHandle = (id?: number) => {
	addOrUpdateRef.value.init(id)
}

// 从useCrud钩子中解构出CRUD操作方法
const {
	getDataList,              // 获取数据列表
	selectionChangeHandle,    // 多选变化处理
	sizeChangeHandle,         // 分页大小变化处理
	currentChangeHandle,      // 当前页码变化处理
	deleteBatchHandle         // 批量删除处理
} = useCrud(state)
</script>

