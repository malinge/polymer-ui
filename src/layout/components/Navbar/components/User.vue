<template>
	<el-dropdown class="avatar-container" trigger="hover">
		<div class="avatar-wrapper">
			<el-avatar shape="circle" :size="30" :src="previewUrl"></el-avatar>
			<span>{{ userStore.user.realName }}</span>
			<el-icon class="el-icon--right"><ArrowDown /></el-icon>
		</div>
		<template #dropdown>
			<el-dropdown-menu class="user-dropdown">
				<router-link to="/profile">
					<el-dropdown-item> {{ $t('router.profile') }} </el-dropdown-item>
				</router-link>
				<el-dropdown-item divided @click="logout"> {{ $t('app.signOut') }} </el-dropdown-item>
			</el-dropdown-menu>
		</template>
	</el-dropdown>
</template>

<script setup lang="ts">
	import { useUserStore } from '@/store/modules/user'
	import { ArrowDown } from '@element-plus/icons-vue'
  import {onMounted, ref, watch} from "vue";
  import FileUrlUtils from "@/utils/fileUrlUtils";

	const userStore = useUserStore()

  const previewUrl = ref('');

  // 获取预览URL
  const fetchPreviewUrl = async () => {
    previewUrl.value =  await FileUrlUtils.getFullUrl(userStore.user.avatar)
  };

  // 监听modelValue变化
  watch(() => userStore.user.avatar, fetchPreviewUrl);

  // 组件挂载时初始化
  onMounted(fetchPreviewUrl);

	const logout = () => {
		userStore.logoutAction().then(() => {
			// router.push({ path: '/login' })

			// 刷新页面
			location.reload()
		})
	}
</script>

<style lang="scss" scoped>
	.avatar-container {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		height: var(--theme-header-height);
	.avatar-wrapper {
		display: flex;
		align-items: center;
		white-space: nowrap;
		cursor: pointer;
		padding: 0 8px;
		color: var(--theme-header-text-color);
	span {
		margin-left: 6px;
	}
	}
	//&:hover {
	   //	background: var(--theme-header-hover-color);
	   //}
	}
</style>
