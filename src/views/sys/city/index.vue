<template>
    <el-card>
      <el-form :inline="true" :model="state.queryForm" @keyup.enter="getDataList()">
        <el-form-item>
          <el-input
              v-model="state.queryForm.name"
              placeholder="城市名称"
              clearable
          ></el-input>
        </el-form-item>
            <el-form-item>
          <el-button @click="getDataList()">查询</el-button>
        </el-form-item>
        <el-form-item>
          <el-button v-auth="'system:city:save'" type="primary" @click="addOrUpdateHandle()">新增</el-button>
        </el-form-item>
      </el-form>
      <el-table v-loading="state.dataListLoading" :data="state.dataList" border style="width: 100%">
        <el-table-column :index="calculateIndex" label="序号" type="index" header-align="center" align="center" width="60"></el-table-column>
        <el-table-column prop="name" label="城市名称" header-align="center" align="center"></el-table-column>
        <el-table-column prop="cityCode" label="城市区号" header-align="center" align="center"></el-table-column>
        <el-table-column prop="areaCode" label="行政编码" header-align="center" align="center"></el-table-column>
        <el-table-column prop="parentCode" label="父级编码" header-align="center" align="center"></el-table-column>
        <fast-table-column
            prop="level"
            label="城市等级"
            dict-type="city_level"
            align="center"
            width="100"
        ></fast-table-column>
        <el-table-column prop="zipCode" label="邮政编码" header-align="center" align="center"></el-table-column>
        <el-table-column prop="shortName" label="城市简称" header-align="center" align="center"></el-table-column>
        <el-table-column prop="pinyin" label="城市拼音" header-align="center" align="center"></el-table-column>
        <el-table-column prop="longitude" label="城市经度" header-align="center" align="center"></el-table-column>
        <el-table-column prop="latitude" label="城市纬度" header-align="center" align="center"></el-table-column>
        <el-table-column prop="createTime" label="创建时间" header-align="center" align="center"></el-table-column>
        <el-table-column label="操作" fixed="right" header-align="center" align="center" width="150">
          <template #default="scope">
            <el-button v-auth="'system:city:update'" v-if="scope.row.haveChild"  type="primary" link @click="goSubLevel(scope.row.id, scope.row.name)">下级</el-button>
            <el-button v-auth="'system:city:update'" type="primary" link @click="addOrUpdateHandle(scope.row.id)">修改</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 弹窗, 新增 / 修改 -->
      <add-or-update ref="addOrUpdateRef" @refreshDataList="getDataList" :pid="currentPid"></add-or-update>

      <!-- 下级城市抽屉 -->
      <el-drawer
          v-model="drawerState.visible"
          :title="drawerTitle"
          direction="rtl"
          :size="drawerState.size"
          :before-close="handleDrawerClose">
        <system-city-index
            v-if="drawerState.visible"
            :pid="drawerState.currentPid"
            :level="drawerState.level + 1"
            is-drawer
            @back="handleBack"
        />
      </el-drawer>
    </el-card>
</template>

<script setup lang="ts" name="SystemCityIndex">
import { useCrud } from '@/hooks'
import {onMounted, reactive, ref, defineProps, watch, computed } from 'vue'
import { useRoute } from 'vue-router'
import AddOrUpdate from './add-or-update.vue'
import { IHooksOptions } from '@/hooks/interface'

const route = useRoute()
const currentPid = ref(0) // 当前父级ID

// 新增 props 接收抽屉模式参数
const props = defineProps({
  pid: {
    type: Number,
    default: 0
  },
  isDrawer: {
    type: Boolean,
    default: false
  },
  level: {
    type: Number,
    default: 0
  }
})

// 抽屉相关状态 - 重构为单个对象管理
const drawerState = ref({
  visible: false,
  currentPid: 0,
  currentName: '',
  level: props.level,
  size: '70%'
})

// 动态抽屉标题
const drawerTitle = computed(() =>
    drawerState.value.currentName ? `${drawerState.value.currentName}的下级城市` : '下级城市'
)

// 计算抽屉大小的函数
const calculateDrawerSize = (level: number) => {
  const baseSize = 70; // 基础大小70%
  const minSize = 30;  // 最小大小30%
  // 每深一级减少10%
  const calculatedSize = baseSize - level * 10;
  return Math.max(calculatedSize, minSize) + '%';
}

const state: IHooksOptions = reactive({
	dataListUrl: '/system/city/list',
	deleteUrl: '/system/city',
  isPage: false,
	queryForm: {
    name: "",
    pid: 0,
	}
})

// 初始化获取路由参数
onMounted(() => {
  const pid = props.pid || (route.query.pid ? Number(route.query.pid) : 0)
  state.queryForm.pid = pid
  currentPid.value = pid
  getDataList()
})

// 监听 props.pid 变化
watch(() => props.pid, (newPid) => {
  state.queryForm.pid = newPid
  currentPid.value = newPid
  getDataList()
})

// 查看下级
const goSubLevel = (id: number, name: string) => {
  // 更新抽屉状态 - 所有操作在单个对象中完成
  drawerState.value = {
    ...drawerState.value,
    visible: true,
    currentPid: id,
    currentName: name,
    level: props.level,
    size: calculateDrawerSize(props.level)
  }
}

// 处理抽屉关闭
const handleDrawerClose = () => {
  // 重置所有状态
  drawerState.value = {
    visible: false,
    currentPid: 0,
    currentName: '',
    level: 0,
    size: '70%'
  }
}

// 处理返回上一级
const handleBack = () => {
  if (drawerState.value.level > 1) {
    // 返回到上一级状态
    drawerState.value = {
      ...drawerState.value,
      level: props.level - 1,
      size: calculateDrawerSize(props.level - 1)
      // 注意：这里不需要修改currentPid和currentName
      // 因为子组件会通过props.pid重新加载数据
    }
  } else {
    // 如果是第一级，直接关闭
    drawerState.value.visible = false
  }
}

const addOrUpdateRef = ref()
const addOrUpdateHandle = (id?: number) => {
	addOrUpdateRef.value.init(id)
}
const calculateIndex=(index: number) => {
  return index + 1; // 默认从1开始
}

const { getDataList } = useCrud(state)
</script>
