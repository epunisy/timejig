import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.jsx'

// 서비스워커 자동 갱신 — 앱을 켤 때, 그리고 다시 화면으로 돌아올 때마다 최신 버전을 확인한다.
// 옛 캐시(옛 화면)에 오래 갇히지 않도록, 새 버전이 있으면 autoUpdate 로 바로 반영된다.
registerSW({
  immediate: true,
  onRegisteredSW(_swUrl, reg) {
    if (!reg) return
    const check = () => { reg.update().catch(() => {}) }
    check() // 켜자마자 한 번
    setInterval(check, 60 * 60 * 1000) // 1시간마다
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') check()
    })
  },
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
