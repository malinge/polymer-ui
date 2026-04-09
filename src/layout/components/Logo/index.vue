<template>
	<div v-if="appStore.sidebarOpened" class="sidebar-logo">
		<el-avatar src="./favicon.ico" class="raw-icon"></el-avatar>
		<span class="logo-title"> {{ $t('app.logoText') }}</span>
	</div>
	<div v-else class="sidebar-logo sidebar-logo-expend">
    <el-avatar src="./favicon.ico" class="raw-icon"></el-avatar>
	</div>
</template>

<script setup lang="ts">
	import { useAppStore } from '@/store/modules/app'
	const appStore = useAppStore()
</script>

<style lang="scss" scoped>
	.sidebar-logo {
		width: 230px !important;
		height: var(--theme-header-height);
		line-height: var(--theme-header-height);
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: rgb(0 21 41 / 2%) 0 1px 4px;
		color: var(--theme-logo-text-color);
		font-size: 18px;

		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;

	.el-avatar {
		width: 30px;
		height: 30px;
	}
	.logo-title {
		margin-left: 10px;
	}
	}
	.sidebar-logo-expend {
		width: 100% !important;
	}
  /* 清除背景色和滤镜 */
  .raw-icon {
    background: transparent !important;
    filter: none !important;
  }

  /* 确保内部图片显示原始样式 */
  .raw-icon > img {
    filter: none !important;
    -webkit-filter: none !important;
    object-fit: contain !important; /* 保持原始比例 */
    background: transparent !important;
  }
</style>
