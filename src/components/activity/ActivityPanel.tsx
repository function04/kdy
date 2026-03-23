import { useState, useEffect } from 'react'
import { useActivities } from '@/hooks/useActivities'
import { useAppStore } from '@/stores/appStore'
import { ACTIVITY_CONFIG } from '@/lib/constants'
import { ActiveTimer } from './ActiveTimer'
import type { ActivityType } from '@/types/activity'
import { X, Plus } from 'lucide-react'
import { Portal } from '@/lib/portal'

const ACTIVITY_TYPES: ActivityType[] = ['wake', 'sleep', 'study', 'exercise']

// 버튼 누를 때 뜨는 플래시 메시지
function FlashBadge() {
  const { flashMessage, flashKey } = useAppStore()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!flashMessage || flashKey === 0) return
    setVisible(true)
    const t = setTimeout(() => setVisible(false), 1800)
    return () => clearTimeout(t)
  }, [flashKey, flashMessage])

  if (!visible || !flashMessage) return null

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 'calc(100% + 8px)',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(30,30,32,0.92)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '0.5px solid rgba(255,255,255,0.12)',
        borderRadius: 12,
        padding: '6px 14px',
        whiteSpace: 'nowrap',
        zIndex: 51,
        animation: 'flashIn 0.2s cubic-bezier(0.34,1.4,0.64,1) forwards',
        pointerEvents: 'none',
      }}
    >
      <p className="text-slate-100 text-xs font-semibold">{flashMessage}</p>
    </div>
  )
}

export function ActivityPanel() {
  const { logInstant, startActivity, stopActivity } = useActivities()
  const { activeActivityId, activeActivityType } = useAppStore()
  const [open, setOpen] = useState(false)
  const [glowKey, setGlowKey] = useState(0)

  async function handlePress(type: ActivityType) {
    if (type === 'wake' || type === 'sleep') {
      await logInstant(type)
    } else {
      if (activeActivityType === type && activeActivityId) {
        await stopActivity(activeActivityId)
      } else {
        await startActivity(type)
      }
    }
  }

  function handleTabPress() {
    setGlowKey(k => k + 1)
    setOpen(true)
  }

  // 버튼 비활성화 로직
  function isDisabled(type: ActivityType) {
    // 기상: 취침중일 때만 눌림
    if (type === 'wake') return activeActivityType !== 'sleep'
    // 취침: 기상중이거나 아무것도 없을 때만 눌림 (이미 취침중이면 비활성)
    if (type === 'sleep') return activeActivityType === 'sleep'
    // 공부/운동: 같은 타입 진행중(종료) 또는 아무것도 없을 때(시작) 가능, 다른 활동 진행중엔 비활성
    if (type === 'study' || type === 'exercise') {
      if (!activeActivityType) return false
      if (activeActivityType === type) return false
      return true
    }
    return false
  }

  return (
    <>
      {/* 왼쪽 사이드 탭 */}
      <button
        onClick={handleTabPress}
        style={{
          position: 'fixed',
          left: 0,
          top: '50%',
          transform: 'translateY(-50%)',
          width: 6,
          height: 54,
          borderRadius: '0 4px 4px 0',
          background: 'rgba(var(--nav-border), 0.5)',
          zIndex: 40,
          border: 'none',
          padding: 0,
          cursor: 'pointer',
        }}
      />

      {/* 탭 press glow — 눌렀을 때만 */}
      {glowKey > 0 && (
        <div
          key={glowKey}
          style={{
            position: 'fixed',
            left: 0,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 56,
            height: 90,
            pointerEvents: 'none',
            zIndex: 39,
            background: 'radial-gradient(ellipse at 0% 50%, rgba(255,255,255,0.22) 0%, transparent 70%)',
            animation: 'glowFade 0.5s ease forwards',
          }}
        />
      )}

      {open && (
        <Portal>
          {/* 백드롭 */}
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 49,
              background: 'rgba(0,0,0,0.2)',
              backdropFilter: 'blur(2px)',
              WebkitBackdropFilter: 'blur(2px)',
              animation: 'wFadeIn 0.2s ease forwards',
            }}
            onClick={() => setOpen(false)}
          />

          {/* 플로팅 카드 */}
          <div
            style={{
              position: 'fixed',
              left: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              width: 220,
              borderRadius: 20,
              maxHeight: '68vh',
              zIndex: 50,
              display: 'flex',
              flexDirection: 'column',
              background: 'rgba(var(--nav-bg), 0.82)',
              backdropFilter: 'blur(48px) saturate(200%)',
              WebkitBackdropFilter: 'blur(48px) saturate(200%)',
              border: '0.5px solid rgba(var(--nav-border), 0.3)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
              overflow: 'hidden',
              animation: 'panelExpand 0.28s cubic-bezier(0.34,1.12,0.64,1) forwards',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* 헤더 */}
            <div className="flex items-center justify-between px-3.5 pt-4 pb-2 flex-shrink-0">
              <p className="text-slate-100 font-semibold text-xs">활동</p>
              <button onClick={() => setOpen(false)} className="text-muted active:scale-90 transition-transform">
                <X size={14} />
              </button>
            </div>

            {/* 진행 중 타이머 (compact) */}
            {activeActivityId && (
              <div className="px-2.5 mb-2 flex-shrink-0 relative">
                <ActiveTimer onStop={stopActivity} compact />
                <FlashBadge />
              </div>
            )}

            {/* 플래시 — 활동 없을 때도 표시 */}
            {!activeActivityId && (
              <div className="relative px-2.5 flex-shrink-0">
                <FlashBadge />
              </div>
            )}

            {/* 활동 버튼 — 2열 컴팩트 */}
            <div className="px-2.5 grid grid-cols-2 gap-1 mb-2 flex-shrink-0">
              {ACTIVITY_TYPES.map((type) => {
                const config = ACTIVITY_CONFIG[type]
                const isActive = activeActivityType === type
                const disabled = isDisabled(type)
                return (
                  <button
                    key={type}
                    onClick={() => handlePress(type)}
                    disabled={disabled}
                    className="flex items-center justify-center rounded-xl px-2.5 py-2 transition-all active:opacity-60 disabled:opacity-25"
                    style={{
                      background: 'transparent',
                      border: `1.5px solid ${isActive ? config.color : `${config.color}55`}`,
                    }}
                  >
                    <span className="text-[11px] font-medium text-slate-100">{config.label}</span>
                  </button>
                )
              })}

              {/* + 활동 추가 */}
              <button
                className="flex items-center gap-1.5 rounded-xl px-2.5 py-2 border transition-all active:scale-95 col-span-2"
                style={{
                  background: 'rgba(var(--nav-border), 0.06)',
                  borderColor: 'rgba(var(--nav-border), 0.15)',
                  borderStyle: 'dashed',
                }}
              >
                <Plus size={12} className="text-muted" />
                <span className="text-[11px] text-muted">활동 추가</span>
              </button>
            </div>

            {/* 하단 여백 */}
            <div className="pb-2 flex-shrink-0" />
          </div>

          <style>{`
            @keyframes wFadeIn { from{opacity:0} to{opacity:1} }
            @keyframes panelExpand {
              from { opacity:0; transform:translateY(-50%) scale(0.88); }
              to   { opacity:1; transform:translateY(-50%) scale(1); }
            }
            @keyframes flashIn {
              from { opacity:0; transform:translateX(-50%) scale(0.88) translateY(4px); }
              to   { opacity:1; transform:translateX(-50%) scale(1) translateY(0); }
            }
          `}</style>
        </Portal>
      )}

      <style>{`
        @keyframes glowFade { 0%{opacity:1} 60%{opacity:0.6} 100%{opacity:0} }
      `}</style>
    </>
  )
}
