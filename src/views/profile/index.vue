<template>
  <el-row :gutter="20">
    <el-col :span="8">
      <el-card class="profile-card">
        <template #header >个人信息</template>
        <el-row justify="center" align="middle">
          <el-col :span="8">
            <!-- 头像展示 -->
            <div class="avatar-wrapper">
              <el-image
                  :src="avatarUrl"
                  class="avatar-img"
                  fit="cover"
                  @click="showViewer = true"
              >
                <template #error>
                  <div class="image-error">
                    <el-icon><User /></el-icon>
                  </div>
                </template>
              </el-image>
            </div>
          </el-col>
        </el-row>
        <ul>
          <li>
            <svg-icon icon="icon-idcard" /> 用户姓名 <span>{{ userStore.user.realName }}</span>
          </li>
          <li>
            <svg-icon icon="icon-phone" /> 手机号码 <span>{{ userStore.user.mobile }}</span>
          </li>
          <li>
            <svg-icon icon="icon-mail" /> 用户邮箱 <span>{{ userStore.user.email || '/' }}</span>
          </li>
          <li>
            <svg-icon icon="icon-apartment" /> 所属部门 <span>{{ userStore.user.deptName || '/' }}</span>
          </li>
          <li>
            <svg-icon icon="icon-tag" /> 所属岗位 <span>{{ userStore.user.postNameList || '/' }} </span>
          </li>
          <li>
            <svg-icon icon="icon-tag" /> 所属角色 <span>{{ userStore.user.roleNameList || '/' }} </span>
          </li>
          <li>
            <svg-icon icon="icon-calendar-check" /> 创建日期 <span>{{ userStore.user.createTime }}</span>
          </li>
        </ul>
      </el-card>
    </el-col>
    <el-col :span="16">
      <el-card>
        <template #header> 基本信息 </template>
        <el-tabs v-model="activeName">
          <el-tab-pane label="基本资料" name="info">
            <UserInfo ref="userInfoRef"/>
          </el-tab-pane>
          <el-tab-pane label="修改密码" name="password">
            <Password />
          </el-tab-pane>
        </el-tabs>
      </el-card>
    </el-col>
  </el-row>

  <!-- 图片预览器 -->
  <el-image-viewer
      v-if="showViewer"
      :url-list="[avatarUrl]"
      @close="showViewer = false"
      :initial-index="0"
      hide-on-click-modal
  />
</template>

<script setup lang="ts" name="ProfileIndex">
import {onBeforeMount, onMounted, ref, watch} from 'vue'
import {useUserStore} from '@/store/modules/user'
import Password from '@/views/profile/password.vue'
import UserInfo from '@/views/profile/user-info.vue'
import {User} from '@element-plus/icons-vue'
import FileUrlUtils from "@/utils/fileUrlUtils";

const userStore = useUserStore()
const activeName = ref('info')
const userInfoRef = ref() // 创建 UserInfo 组件的引用
const showViewer = ref(false) // 控制图片预览器显示
const avatarUrl = ref('') // 存储头像URL

// 获取头像完整URL
const getAvatarUrl = async () => {
  if (!userStore.user.avatar) {
    return
  }
  try {
    avatarUrl.value = await FileUrlUtils.getFullUrl(userStore.user.avatar)
  } catch (error) {
    console.error('获取头像URL失败:', error)
  }
}

// 监听 userStore.user.avatar 变化
watch(() => userStore.user.avatar, () => {
  getAvatarUrl()
}, { immediate: true })

// 监听标签页变化
watch(activeName, (newVal) => {
  if (newVal === 'info' && userInfoRef.value) {
    userInfoRef.value.init() // 切换到基本资料页时调用 init
  }
})

// 确保初始加载时调用
onMounted(() => {
  if (activeName.value === 'info' && userInfoRef.value) {
    userInfoRef.value.init()
  }
})

// 组件挂载前获取头像
onBeforeMount(() => {
  getAvatarUrl()
})
</script>

<style scoped lang="scss">
.profile-card {
  ul {
    list-style: none;
    padding: 0;
    li {
      padding: 12px 0;
      border-bottom: 1px solid #f0f0f0;
      &:last-child {
        border-bottom: none;
        padding-top: 12px;
      }
      span {
        float: right;
      }
    }
  }
}

.avatar-wrapper {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 20px 0;
  cursor: pointer;
  position: relative;

  .avatar-img {
    width: 150px;
    height: 150px;
    border-radius: 50%;
    border: 3px solid #f0f0f0;
    transition: all 0.3s ease;

    :deep(.el-image__inner) {
      border-radius: 50%;
    }

    &:hover {
      border-color: #409eff;
      transform: scale(1.05);
      box-shadow: 0 4px 20px rgba(64, 158, 255, 0.3);
    }
  }

  .image-error {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
    background: #f5f7fa;
    border-radius: 50%;
    font-size: 40px;
    color: #909399;

    .el-icon {
      font-size: 40px;
    }
  }
}
</style>
