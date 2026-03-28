import { useRef, useState, useEffect, useCallback } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { GoogleCalendarProvider } from '@/contexts/GoogleCalendarContext'
import { useAuth } from '@/hooks/useAuth'
import { SplashScreen } from '@/components/SplashScreen'
import { MobileNav } from '@/components/layout/MobileNav'
import { PullToRefresh } from '@/components/layout/PullToRefresh'
import { UpdateBanner } from '@/components/layout/UpdateBanner'
import { Toast } from '@/components/layout/Toast'
// ActivityPanel removed — 활동 선택은 대시보드에서 직접 처리
import { LoginPage } from '@/components/auth/LoginPage'
import { DashboardPage } from '@/components/dashboard/DashboardPage'
import { SchedulePage, ScheduleFAB } from '@/components/schedule/SchedulePage'
import { AnalyticsPage } from '@/components/analytics/AnalyticsPage'
import { SettingsPage } from '@/components/settings/SettingsPage'

const ROUTES = ['/', '/schedule', '/analytics', '/settings']
const PAGES = [DashboardPage, SchedulePage, AnalyticsPage, SettingsPage]

function PendingPage({ onSignOut }: { onSignOut: () => void }) {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
      <div className="text-5xl mb-4">⏳</div>
      <h2 className="text-xl font-bold text-slate-100 mb-2">승인 대기 중</h2>
      <p className="text-muted text-sm mb-8">
        관리자가 계정을 승인하면 이용 가능합니다.
      </p>
      <button onClick={onSignOut} className="text-muted text-sm underline">
        로그아웃
      </button>
    </div>
  )
}

function SwipePages() {
  const location = useLocation()
  const navigate = useNavigate()
  const currentIndex = ROUTES.indexOf(location.pathname)
  const idx = currentIndex === -1 ? 0 : currentIndex

  const containerRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const [pageKeys, setPageKeys] = useState(() => PAGES.map((_, i) => i))
  const touchStart = useRef<{ x: number; y: number } | null>(null)
  const dirLocked = useRef<'h' | 'v' | null>(null)
  const isDragging = useRef(false)
  const w = useRef(window.innerWidth)
  const idxRef = useRef(idx)
  idxRef.current = idx

  useEffect(() => {
    w.current = window.innerWidth
    const track = trackRef.current
    if (!track) return
    requestAnimationFrame(() => {
      track.style.transition = 'none'
      track.style.transform = `translateX(${-idx * w.current}px)`
    })
  }, [idx])

  function setTrackX(x: number, animated: boolean) {
    const track = trackRef.current
    if (!track) return
    track.style.transition = animated
      ? 'transform 0.32s cubic-bezier(0.22, 1, 0.36, 1)'
      : 'none'
    track.style.transform = `translateX(${x}px)`
  }

  const handleTouchStart = useCallback((e: TouchEvent) => {
    // data-no-swipe 속성이 있는 요소 안에서 시작된 터치는 페이지 스와이프 무시
    const target = e.target as HTMLElement
    if (target.closest('[data-no-swipe]')) {
      touchStart.current = null
      return
    }
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    dirLocked.current = null
    isDragging.current = false
  }, [])

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!touchStart.current) return
    const dx = e.touches[0].clientX - touchStart.current.x
    const dy = e.touches[0].clientY - touchStart.current.y

    if (!dirLocked.current) {
      if (Math.abs(dx) > Math.abs(dy) * 1.5 && Math.abs(dx) > 8) {
        dirLocked.current = 'h'
      } else if (Math.abs(dy) > 10) {
        dirLocked.current = 'v'
        return
      } else {
        return
      }
    }

    if (dirLocked.current !== 'h') return

    e.preventDefault()
    isDragging.current = true

    const i = idxRef.current
    let clamped = dx
    if ((dx > 0 && i === 0) || (dx < 0 && i === ROUTES.length - 1)) {
      clamped = dx * 0.15
    }
    setTrackX(-i * w.current + clamped, false)
  }, [])

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!touchStart.current || !isDragging.current) {
      touchStart.current = null
      isDragging.current = false
      dirLocked.current = null
      return
    }

    const dx = e.changedTouches[0].clientX - touchStart.current.x
    touchStart.current = null
    dirLocked.current = null
    isDragging.current = false

    const i = idxRef.current
    const threshold = w.current * 0.28

    if (dx < -threshold && i < ROUTES.length - 1) {
      setTrackX(-(i + 1) * w.current, true)
      setTimeout(() => navigate(ROUTES[i + 1]), 0)
    } else if (dx > threshold && i > 0) {
      setTrackX(-(i - 1) * w.current, true)
      setTimeout(() => navigate(ROUTES[i - 1]), 0)
    } else {
      setTrackX(-i * w.current, true)
    }
  }, [navigate])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    el.addEventListener('touchstart', handleTouchStart, { passive: true })
    el.addEventListener('touchmove', handleTouchMove, { passive: false })
    el.addEventListener('touchend', handleTouchEnd, { passive: true })
    return () => {
      el.removeEventListener('touchstart', handleTouchStart)
      el.removeEventListener('touchmove', handleTouchMove)
      el.removeEventListener('touchend', handleTouchEnd)
    }
  }, [handleTouchStart, handleTouchMove, handleTouchEnd])

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 overflow-hidden"
    >
      <div
        ref={trackRef}
        className="flex h-full"
        style={{
          width: `${PAGES.length * 100}vw`,
          transform: `translateX(${-idx * window.innerWidth}px)`,
        }}
      >
        {PAGES.map((Page, i) => (
          <PullToRefresh
            key={i}
            className="h-full overflow-y-auto"
            style={{ width: '100vw', flexShrink: 0 }}
            onRefresh={() => setPageKeys(prev => prev.map((k, j) => j === i ? k + PAGES.length : k))}
          >
            <Page key={pageKeys[i]} />
          </PullToRefresh>
        ))}
      </div>

      <MobileNav />
      <ScheduleFAB isVisible={idx === 1} />
      <Toast />
    </div>
  )
}

function AppRoutes() {
  const { user, profile, loading, signOut } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted text-sm">로딩 중...</div>
      </div>
    )
  }

  if (!user) return <LoginPage />
  if (profile && !profile.is_approved) return <PendingPage onSignOut={signOut} />

  return (
    <Routes>
      <Route path="/*" element={<SwipePages />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  const [splash, setSplash] = useState(true)

  return (
    <ThemeProvider>
      <GoogleCalendarProvider>
        <UpdateBanner />
        {splash && <SplashScreen onDone={() => setSplash(false)} />}
        {!splash && (
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        )}
      </GoogleCalendarProvider>
    </ThemeProvider>
  )
}
