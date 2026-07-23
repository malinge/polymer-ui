<template>
	<div class="navbar-right">
    <a href="https://github.com/linxile" target="_blank">
      <svg-icon icon="icon-github-fill"></svg-icon>
    </a>
		<Lang />
		<ComponentSize />
		<Search />
		<Fullscreen />
		<Notice/>
		<User />
		<ThemeSettings />
	</div>
</template>

<script setup lang="ts">
import Lang from '@/components/lang/index.vue'
import Search from './components/Search.vue'
import ComponentSize from './components/ComponentSize.vue'
import Fullscreen from './components/Fullscreen.vue'
import User from './components/User.vue'
import ThemeSettings from './components/ThemeSettings.vue'
import Notice from '@/components/notice/index.vue'
import SvgIcon from "@/components/svg-icon/index.vue";
</script>

<style lang="scss" scoped>
.navbar-right {
	display: flex;
	align-items: center;
	justify-content: flex-end;
	&-link {
		height: 100%;
		display: flex;
		align-items: center;
		white-space: nowrap;
		&-photo {
			width: 25px;
			height: 25px;
			border-radius: 100%;
		}
	}
}
</style>
