import { useRef, useState, useEffect, type ReactNode } from 'react'

interface PullToRefreshProps {
  children: ReactNode
  onRefresh: () => void
  className?: string
  style?: React.CSSProperties
}

const TRIGGER_DISTANCE = 72
const MAX_PULL = 100

export function PullToRefresh({ children, onRefresh, className, style }: PullToRefreshProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const startY = useRef<number | null>(null)
  const isPulling = useRef(false)
  const [pullY, setPullY] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const refreshingRef = useRef(false)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    function onTouchStart(e: TouchEvent) {
      if (el!.scrollTop > 0 || refreshingRef.current) return
      startY.current = e.touches[0].clientY
      isPulling.current = false
    }

    function onTouchMove(e: TouchEvent) {
      if (startY.current === null || refreshingRef.current) return
      if (el!.scrollTop > 0) { startY.current = null; return }

      const dy = e.touches[0].clientY - startY.current
      if (dy <= 0) { isPulling.current = false; setPullY(0); return }

      isPulling.current = true
      e.preventDefault()
      setPullY(Math.min(MAX_PULL, dy * 0.45))
    }

    function onTouchEnd() {
      if (!isPulling.current) return
      isPulling.current = false
      startY.current = null

      setPullY(prev => {
        if (prev >= TRIGGER_DISTANCE && !refreshingRef.current) {
          refreshingRef.current = true
          setRefreshing(true)
          setTimeout(() => {
            onRefresh()
            refreshingRef.current = false
            setRefreshing(false)
            setPullY(0)
          }, 600)
          return prev
        }
        return 0
      })
    }

    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchmove', onTouchMove, { passive: false })
    el.addEventListener('touchend', onTouchEnd, { passive: true })
    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', onTouchEnd)
    }
  }, [onRefresh])

  const triggered = pullY >= TRIGGER_DISTANCE
  const progress = Math.min(1, pullY / TRIGGER_DISTANCE)
  const indicatorSize = pullY > 4 ? pullY : 0

  return (
    <div ref={containerRef} className={className} style={style}>
      {/* 당김 인디케이터 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-end',
          height: indicatorSize,
          overflow: 'hidden',
          transition: isPulling.current ? 'none' : 'height 0.3s ease',
          pointerEvents: 'none',
        }}
      >
        {pullY > 10 && (
          <div
            style={{
              width: 30,
              height: 30,
              marginBottom: 6,
              borderRadius: '50%',
              background: 'rgba(var(--nav-bg), 0.88)',
              backdropFilter: 'blur(12px)',
              border: `1.5px solid rgba(var(--nav-border), ${0.15 + progress * 0.5})`,
              boxShadow: '0 2px 10px rgba(0,0,0,0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {refreshing ? (
              <div style={{
                width: 13, height: 13,
                border: '1.8px solid rgba(255,255,255,0.12)',
                borderTopColor: 'rgba(255,255,255,0.75)',
                borderRadius: '50%',
                animation: 'ptr-spin 0.7s linear infinite',
              }} />
            ) : (
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path
                  d="M6.5 2v8M3.5 7l3 3 3-3"
                  stroke="white"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    transform: `rotate(${triggered ? 180 : progress * 170}deg)`,
                    transformOrigin: '6.5px 6.5px',
                    transition: isPulling.current ? 'none' : 'transform 0.15s ease',
                    opacity: 0.4 + progress * 0.6,
                  }}
                />
              </svg>
            )}
          </div>
        )}
      </div>

      {children}

      <style>{`@keyframes ptr-spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
