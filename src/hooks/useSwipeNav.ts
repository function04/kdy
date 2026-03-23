import { useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

const ROUTES = ['/', '/activity', '/schedule', '/analytics', '/settings']

// 수평 스와이프만 감지 (수직 스크롤과 구분)
// - 수평 이동이 수직 이동의 2배 이상이어야 함
// - 최소 수평 이동 거리 60px 이상
const MIN_SWIPE_X = 60
const RATIO = 2

export function useSwipeNav() {
  const navigate = useNavigate()
  const location = useLocation()
  const touchStart = useRef<{ x: number; y: number } | null>(null)
  const swiping = useRef(false)

  function onTouchStart(e: React.TouchEvent) {
    touchStart.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    }
    swiping.current = false
  }

  function onTouchMove(e: React.TouchEvent) {
    if (!touchStart.current) return
    const dx = e.touches[0].clientX - touchStart.current.x
    const dy = e.touches[0].clientY - touchStart.current.y
    // 수평이 수직보다 확실히 크면 스와이프로 판정
    if (Math.abs(dx) > Math.abs(dy) * RATIO && Math.abs(dx) > 20) {
      swiping.current = true
    }
  }

  function onTouchEnd(e: React.TouchEvent) {
    if (!touchStart.current || !swiping.current) return

    const dx = e.changedTouches[0].clientX - touchStart.current.x
    const dy = e.changedTouches[0].clientY - touchStart.current.y
    touchStart.current = null
    swiping.current = false

    // 수평 이동이 충분하고 수직보다 2배 이상일 때만
    if (Math.abs(dx) < MIN_SWIPE_X || Math.abs(dx) < Math.abs(dy) * RATIO) return

    const current = ROUTES.indexOf(location.pathname)
    if (current === -1) return

    if (dx < 0 && current < ROUTES.length - 1) {
      // 왼쪽 스와이프 → 다음 탭
      navigate(ROUTES[current + 1])
    } else if (dx > 0 && current > 0) {
      // 오른쪽 스와이프 → 이전 탭
      navigate(ROUTES[current - 1])
    }
  }

  return { onTouchStart, onTouchMove, onTouchEnd }
}
