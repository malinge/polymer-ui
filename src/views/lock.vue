<template>
  <div class="lock-container">
    <!-- 背景渐变 -->
    <div class="bg-gradient"></div>
    <!-- 动态粒子背景 -->
    <canvas ref="particleCanvas" class="particle-bg"></canvas>

    <!-- 时钟 -->
    <div class="lock-time">{{ currentTime }}</div>
    <div class="lock-date">{{ currentDate }}</div>

    <!-- 锁屏卡片 -->
    <div class="lock-card">
      <div class="avatar-wrap">
        <img alt="头像" :src="previewUrl" class="lock-avatar" />
        <div class="lock-icon">🔒</div>
      </div>
      <div class="lock-username">{{ userStore.user.realName }}</div>
      <div class="lock-hint">系统已锁定，请输入密码解锁</div>

      <form class="lock-form" @submit.prevent="handleUnlock">
        <div class="input-wrap" :class="{ shake: isShaking, 'has-value': password.length > 0 }">
          <input
              ref="passwordInput"
              v-model="password"
              type="password"
              placeholder="请输入登录密码"
              class="lock-input"
              autocomplete="off"
              :disabled="loading"/>
          <button type="submit" class="unlock-btn" :disabled="loading || !password">
            <span v-if="!loading">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"/>
                <polyline points="12 5 19 12 12 19"/>
              </svg>
            </span>
            <span v-else class="loading-dot">···</span>
          </button>
        </div>
      </form>

      <div v-if="errorMsg" class="error-msg">
        <span class="error-icon">✕</span>
        {{ errorMsg }}
      </div>

      <div class="lock-footer">
        <a href="javascript:" @click="goLogin">退出重新登录</a>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import useLockStore from '@/store/modules/lock'
import { useUserStore } from '@/store/modules/user'
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import FileUrlUtils from '@/utils/fileUrlUtils'
import { unlockScreen } from '@/api/auth'

const router = useRouter()
const userStore = useUserStore()
const lockStore = useLockStore()

const previewUrl = ref('')
const password = ref<string>('')
const loading = ref<boolean>(false)
const errorMsg = ref<string>('')
const isShaking = ref<boolean>(false)
const currentTime = ref<string>('')
const currentDate = ref<string>('')
const passwordInput = ref<HTMLInputElement | null>(null)
const particleCanvas = ref<HTMLCanvasElement | null>(null)

let timer: any = null
let animationId: any = null
let particles: Particle[] = []

interface Particle {
  x: number
  y: number
  dx: number
  dy: number
  r: number
  alpha: number
}

const fetchPreviewUrl = async () => {
  previewUrl.value = await FileUrlUtils.getFullUrl(userStore.user.avatar)
}

const startClock = () => {
  const update = () => {
    const now = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    currentTime.value = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
    const days = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
    currentDate.value = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 ${days[now.getDay()]}`
  }
  update()
  timer = setInterval(update, 1000)
}

const handleUnlock = async () => {
  if (!password.value) {
    showError('请输入密码')
    return
  }
  loading.value = true
  errorMsg.value = ''
  try {
    await unlockScreen(password.value)
    const lockPath = lockStore.lockPath
    lockStore.unlockScreen()
    router.replace(lockPath)
  } catch (err: any) {
    const msg = err.message || err.toString()
    showError(msg)
    password.value = ''
    nextTick(() => passwordInput.value?.focus())
  } finally {
    loading.value = false
  }
}

const showError = (msg: string) => {
  errorMsg.value = msg
  isShaking.value = true
  setTimeout(() => {
    isShaking.value = false
  }, 600)
}

const goLogin = () => {
  lockStore.unlockScreen()
  userStore.logoutAction().then(() => {
    location.reload()
  })
}

const hexToRgba = (hex: string, alpha: number): string => {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

const initParticles = () => {
  const canvas = particleCanvas.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const resize = () => {
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
  }
  resize()
  window.addEventListener('resize', resize)

  const colorHex = '#4fb5d0'

  particles = Array.from({ length: 100 }, (): Particle => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    r: Math.random() * 4 + 1,
    dx: (Math.random() - 0.5) * 0.7,
    dy: (Math.random() - 0.5) * 0.7,
    alpha: Math.random() * 0.5 + 0.2,
  }))

  const draw = () => {
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    particles.forEach((p) => {
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
      ctx.fillStyle = hexToRgba(colorHex, p.alpha)
      ctx.fill()
      ctx.shadowColor = hexToRgba(colorHex, 0.3)
      ctx.shadowBlur = 8
      ctx.fill()
      ctx.shadowBlur = 0
      p.x += p.dx
      p.y += p.dy
      if (p.x < 0 || p.x > canvas.width) p.dx *= -1
      if (p.y < 0 || p.y > canvas.height) p.dy *= -1
    })
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const a = particles[i],
            b = particles[j]
        const dist = Math.hypot(a.x - b.x, a.y - b.y)
        if (dist < 150) {
          ctx.beginPath()
          ctx.moveTo(a.x, a.y)
          ctx.lineTo(b.x, b.y)
          const alpha = 0.35 * (1 - dist / 150)
          ctx.strokeStyle = hexToRgba(colorHex, alpha)
          ctx.lineWidth = 1
          ctx.stroke()
        }
      }
    }
    animationId = requestAnimationFrame(draw)
  }
  draw()
}

onMounted(() => {
  fetchPreviewUrl()
  startClock()
  initParticles()
  nextTick(() => passwordInput.value?.focus())
})

onBeforeUnmount(() => {
  clearInterval(timer)
  cancelAnimationFrame(animationId)
})
</script>

<style scoped>
.lock-container {
  position: fixed;
  inset: 0;
  background: linear-gradient(145deg, #f0f6fa 0%, #e8eef4 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
  overflow: hidden;
}

.bg-gradient {
  position: absolute;
  inset: 0;
  background:
      radial-gradient(ellipse at 20% 50%, rgba(79, 181, 208, 0.08) 0%, transparent 60%),
      radial-gradient(ellipse at 80% 50%, rgba(79, 181, 208, 0.06) 0%, transparent 60%);
  z-index: 0;
  pointer-events: none;
}

.particle-bg {
  position: absolute;
  inset: 0;
  z-index: 0;
}

.lock-time {
  position: relative;
  z-index: 1;
  font-size: 72px;
  font-weight: 200;
  color: rgba(44, 62, 80, 0.5);
  letter-spacing: 4px;
  text-shadow: 0 0 40px rgba(44, 62, 80, 0.08);
  margin-bottom: 8px;
  font-variant-numeric: tabular-nums;
}

.lock-date {
  position: relative;
  z-index: 1;
  font-size: 15px;
  color: rgba(44, 62, 80, 0.5);
  margin-bottom: 48px;
  letter-spacing: 2px;
}

.lock-card {
  position: relative;
  z-index: 1;
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 24px;
  padding: 40px 48px 36px;
  width: 380px;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow:
      0 20px 80px rgba(79, 181, 208, 0.15),
      0 8px 32px rgba(79, 181, 208, 0.08),
      inset 0 1px 0 rgba(255, 255, 255, 0.8);
  transition: box-shadow 0.4s ease, transform 0.3s ease;
}

.lock-card:hover {
  box-shadow:
      0 32px 100px rgba(79, 181, 208, 0.20),
      0 12px 40px rgba(79, 181, 208, 0.12),
      inset 0 1px 0 rgba(255, 255, 255, 0.8);
  transform: translateY(-4px);
}

.avatar-wrap {
  position: relative;
  margin-bottom: 16px;
}

.lock-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  border: 3px solid #e8ecf1;
  object-fit: cover;
  display: block;
  transition: border-color 0.3s ease;
}

.avatar-wrap:hover .lock-avatar {
  border-color: #4fb5d0;
}

.lock-icon {
  position: absolute;
  bottom: -4px;
  right: -4px;
  background: #ffffff;
  border-radius: 50%;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  border: 2px solid #e8ecf1;
  transition: border-color 0.3s ease;
}

.avatar-wrap:hover .lock-icon {
  border-color: #4fb5d0;
}

.lock-username {
  color: #4fb5d0;
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 6px;
  letter-spacing: 1px;
}

.lock-hint {
  color: rgba(44, 62, 80, 0.45);
  font-size: 13px;
  margin-bottom: 28px;
}

.lock-form {
  width: 100%;
}

.input-wrap {
  width: 100%;
  display: flex;
  align-items: center;
  background: #f5f7fa;
  border: 2px solid transparent;
  border-radius: 12px;
  padding: 2px 4px 2px 18px;
  transition: border-color 0.3s ease, box-shadow 0.3s ease, background 0.3s ease;
}

.input-wrap:focus-within {
  border-color: #4fb5d0;
  box-shadow: 0 0 0 4px rgba(79, 181, 208, 0.12);
  background: #ffffff;
}

.input-wrap.has-value {
  border-color: rgba(79, 181, 208, 0.3);
}

.input-wrap.shake {
  animation: shake 0.5s ease;
}

@keyframes shake {
  0%,
  100% {
    transform: translateX(0);
  }
  20% {
    transform: translateX(-8px);
  }
  40% {
    transform: translateX(8px);
  }
  60% {
    transform: translateX(-6px);
  }
  80% {
    transform: translateX(6px);
  }
}

.lock-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: #2c3e50;
  font-size: 15px;
  padding: 12px 0;
  letter-spacing: 0.5px;
}

.lock-input::placeholder {
  color: #b0b4bb;
  font-weight: 300;
  letter-spacing: 0;
}

.lock-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.unlock-btn {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  background: #4fb5d0;
  border: none;
  color: #fff;
  cursor: pointer;
  transition: background 0.25s ease, transform 0.2s ease, box-shadow 0.25s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.unlock-btn:hover:not(:disabled) {
  background: #6fc8e0;
  transform: scale(1.04);
  box-shadow: 0 4px 16px rgba(79, 181, 208, 0.35);
}

.unlock-btn:active:not(:disabled) {
  transform: scale(0.94);
  box-shadow: 0 2px 8px rgba(79, 181, 208, 0.25);
}

.unlock-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  transform: scale(0.96);
}

.unlock-btn svg {
  display: block;
}

.loading-dot {
  font-size: 16px;
  letter-spacing: 2px;
  font-weight: 600;
}

.error-msg {
  margin-top: 16px;
  color: #f56c6c;
  font-size: 13px;
  text-align: center;
  animation: fadeIn 0.35s ease;
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(245, 108, 108, 0.06);
  padding: 8px 16px;
  border-radius: 8px;
  border: 1px solid rgba(245, 108, 108, 0.15);
}

.error-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  background: #f56c6c;
  color: #fff;
  border-radius: 50%;
  font-size: 10px;
  font-weight: 700;
  flex-shrink: 0;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.lock-footer {
  margin-top: 24px;
}

.lock-footer a {
  color: rgba(44, 62, 80, 0.35);
  font-size: 13px;
  text-decoration: none;
  transition: color 0.25s ease, transform 0.2s ease;
  cursor: pointer;
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
}

.lock-footer a:hover {
  color: #4fb5d0;
  transform: translateY(-1px);
}

/* 响应式调整 */
@media (max-width: 480px) {
  .lock-card {
    width: 90%;
    padding: 32px 24px 28px;
    border-radius: 16px;
  }

  .lock-time {
    font-size: 48px;
  }

  .lock-date {
    font-size: 13px;
    margin-bottom: 32px;
  }

  .lock-input {
    font-size: 14px;
    padding: 10px 0;
  }

  .unlock-btn {
    width: 40px;
    height: 40px;
  }

  .input-wrap {
    padding: 2px 4px 2px 14px;
  }
}
</style>
