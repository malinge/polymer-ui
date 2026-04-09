<template>
		<el-popover width="400" placement="bottom" trigger="click">
			<template #reference>
				<el-badge :is-dot="unreadCount > 0" class="message_badge">
					<svg-icon icon="icon-mail" @click="getList">
					</svg-icon>
				</el-badge>
			</template>
			<el-tabs v-model="activeName">
				<el-tab-pane label="我的站内信" name="notice">
					<el-scrollbar class="message-list">
						<template v-for="item in list" :key="item.id">
							<div class="message-item">
								<img alt="senderAvatar" class="message-icon" :src="item.senderAvatar" />
								<div class="message-content">
								<span class="message-title">
									{{ item.sender }}：{{ item.content }}
								</span>
								<span class="message-date">
									{{ formatDate(item.createTime) }}
								</span>
								</div>
							</div>
						</template>
					</el-scrollbar>
				</el-tab-pane>
			</el-tabs>
			<!-- 更多 -->
			<div style="margin-top: 10px; text-align: right">
				<el-button type="primary" :icon="View" @click="goMyList">查看全部</el-button>
			</div>
		</el-popover>
  </template>
<script lang="ts" setup>
import { formatDate } from '@/utils/formatTime'
import * as NotifyMessageApi from '@/api/message/notifyMessage'
import { useRouter } from 'vue-router'
import { ref, onMounted, onUnmounted } from 'vue'
import { RefSymbol } from '@vue/reactivity';
import { View } from '@element-plus/icons-vue'
import { wsClient, MessageTypes, initWebSocket } from '@/utils/websocket';
import cache from '@/utils/cache'
import constant from '@/utils/constant'

defineOptions({ name: 'Message' })

const { push } = useRouter()
const activeName = ref('notice')
const unreadCount = ref(0) // 未读消息数量
const list = ref<any[]>([]) // 消息列表


// 获得消息列表
const getList = async () => {
  await NotifyMessageApi.getUnreadNotifyMessageList().then(res => {
    Object.assign(list.value, res.data)
  })
  // 强制设置 unreadCount 为 0，避免小红点因为轮询太慢，不消除
  unreadCount.value = 0
}

// // 获得未读消息数
const getUnreadCount = async () => {
  NotifyMessageApi.getUnreadNotifyMessageCount().then(res => {
    unreadCount.value = res.data
  })
}

// 跳转我的站内信
const goMyList = () => {
  push({
    name: 'MyNotifyMessage'
  })
}

// 处理收到的消息
const handleMessage = (data: any) => {
  unreadCount.value = 1;
};

// ========== 初始化 =========
onMounted(() => {
  const token = cache.getToken();
  const baseUrl = constant.wsUrl;

  if (token && baseUrl) {
    initWebSocket(baseUrl, token);
  }
  wsClient.subscribe(MessageTypes.NOTIFY_MESSAGE, handleMessage);
});

onUnmounted(() => {
  wsClient.unsubscribe(MessageTypes.NOTIFY_MESSAGE, handleMessage);
});

</script>

<style lang="scss" scoped>

.message_badge {
  :deep(.is-dot) {
    right: 15px;
    top: 15px;
  }
}

.message-list {
  display: flex;
  height: 400px;
  flex-direction: column;

  .message-item {
    display: flex;
    align-items: center;
    padding: 20px 0;
    border-bottom: 1px solid var(--el-border-color-light);

    &:last-child {
      border: none;
    }

    .message-icon {
      width: 40px;
      height: 40px;
      margin: 0 20px 0 5px;
    }

    .message-content {
      display: flex;
      flex-direction: column;

      .message-title {
        margin-bottom: 5px;
      }

      .message-date {
        font-size: 12px;
        color: var(--el-text-color-secondary);
      }
    }
  }
}
</style>
