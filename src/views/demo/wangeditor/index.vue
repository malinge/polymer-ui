<template>
	<div>
		<WangEditor v-model="editorValue" placeholder="请输入..."></WangEditor>
		<!--		<WangEditor v-model="editorValue2" :disabled="true" placeholder=""></WangEditor>-->
	</div>
</template>

<script lang="ts" setup name="DemoWangeditorIndex">
import WangEditor from '@/components/wang-editor/index.vue'
import { ref } from 'vue'

const editorValue = ref('<p>hjzt</p>')
// const editorValue2 = ref('<p>hjzt</p>')
</script>
