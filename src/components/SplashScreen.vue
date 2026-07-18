<template>
  <div class="splash-root" :class="{ fading }" ref="stage">
    <div class="brand" ref="brand">
      <div class="logo-shift" ref="ls">
        <div class="logo-wrap">
          <img class="logo" :src="LOGO" alt="Logo" @error="onLogoError" />
        </div>
        <div class="text-clip">
          <div class="brand-text" ref="bt">
            <span class="text-main" ref="t1">Cyrene</span>
            <span class="text-sub" ref="t2">随机点名器</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

const emit = defineEmits(['done'])

const stage = ref(null)
const brand = ref(null)
const ls = ref(null)
const bt = ref(null)
const t1 = ref(null)
const t2 = ref(null)
const fading = ref(false)

// 默认使用 public 下的应用图标；加载失败时回退到内嵌 SVG
const LOGO = '/cyrene256.png'
const FALLBACK_LOGO =
  'data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20128%20128%22%3E%3Cdefs%3E%3ClinearGradient%20id%3D%22g%22%20x1%3D%220%22%20y1%3D%220%22%20x2%3D%221%22%20y2%3D%221%22%3E%3Cstop%20offset%3D%220%22%20stop-color%3D%22%23ff9ecf%22%2F%3E%3Cstop%20offset%3D%221%22%20stop-color%3D%22%23e0438b%22%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20x%3D%228%22%20y%3D%228%22%20width%3D%22112%22%20height%3D%22112%22%20rx%3D%2228%22%20fill%3D%22url(%23g)%22%2F%3E%3Cpath%20d%3D%22M64%2092%20C44%2076%2036%2060%2044%2050%20C50%2042%2060%2044%2064%2052%20C68%2044%2078%2042%2084%2050%20C92%2060%2084%2076%2064%2092%20Z%22%20fill%3D%22%23fff%22%2F%3E%3C%2Fsvg%3E'

let timers = []
function at(ms, fn) {
  timers.push(setTimeout(fn, ms))
}

function onLogoError(e) {
  const img = e.target
  if (img.src !== FALLBACK_LOGO) img.src = FALLBACK_LOGO
}

onMounted(() => {
  const s = stage.value
  const logoEl = s.querySelector('.logo')
  if (logoEl && logoEl.complete && logoEl.naturalWidth === 0) logoEl.src = FALLBACK_LOGO

  // 先锁定过渡，计算位移量后再放开
  ls.value.style.transition = 'none'
  bt.value.style.transition = 'none'
  const tw = Math.max(t1.value.offsetWidth, t2.value.offsetWidth)
  s.style.setProperty('--shift', (29 + tw) / 2 + 'px')
  s.style.setProperty('--clip-w', 29 + tw + 14 + 'px')
  // 强制回流
  void ls.value.offsetHeight
  ls.value.style.transition = ''
  bt.value.style.transition = ''
  void ls.value.offsetHeight

  // 播放动画：logo 弹入 -> 文字展开
  at(60, () => brand.value.classList.add('enter-pop'))
  at(950, () => brand.value.classList.add('expanded'))
  // 动画结束后 0.4s 淡出，再移除
  at(2300, () => {
    fading.value = true
  })
  at(2300 + 400, () => emit('done'))
})

onBeforeUnmount(() => {
  timers.forEach(clearTimeout)
  timers = []
})
</script>

<style scoped>
.splash-root {
  position: fixed;
  inset: 0;
  z-index: 2147483647; /* 始终位于最前 */
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fdf5fa;
  overflow: hidden;
  opacity: 1;
  transition: opacity 0.4s ease;
}
.splash-root.fading {
  opacity: 0;
}
.brand {
  display: flex;
  align-items: center;
  transform: translateX(calc(var(--shift, 0px) * -1));
}
.logo-shift {
  position: relative;
  flex: none;
  transform: translateX(var(--shift, 0px));
  transition: transform 1200ms cubic-bezier(0.8, 0, 0.2, 1);
}
.brand.expanded .logo-shift {
  transform: translateX(0);
}
.logo-wrap {
  position: relative;
  z-index: 2;
  width: 128px;
  height: 128px;
  opacity: 0;
}
.logo {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}
.text-clip {
  position: absolute;
  z-index: 1;
  left: 100%;
  top: 50%;
  transform: translateY(-50%);
  width: var(--clip-w, 400px);
  overflow: hidden;
  font-size: 42px;
  padding: 0.18em 0;
  margin: -0.18em 0 0 0;
}
.brand-text {
  display: inline-flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.06em;
  font-family: 'Segoe UI', 'Microsoft YaHei', 'PingFang SC', sans-serif;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: #8f2d5f;
  margin-left: 29px;
  transform: translateX(calc(-100% - 29px - 2px));
  transition: transform 1200ms cubic-bezier(0.8, 0, 0.2, 1);
  line-height: 1.15;
}
.brand.expanded .brand-text {
  transform: translateX(0);
}
.text-main,
.text-sub {
  white-space: nowrap;
}
.text-sub {
  font-size: 36px;
  opacity: 0.58;
  letter-spacing: 0.06em;
  font-weight: 500;
}
@keyframes enter-pop {
  0% {
    opacity: 0;
    transform: scale(0.15);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}
.brand.enter-pop .logo-wrap {
  animation: enter-pop 800ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}
</style>
