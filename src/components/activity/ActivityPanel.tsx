import { useState } from 'react'
import { useActivities } from '@/hooks/useActivities'
import { useCustomActivities } from '@/hooks/useCustomActivities'
import { useAppStore } from '@/stores/appStore'
import { ACTIVITY_CONFIG } from '@/lib/constants'
import type { ActivityType } from '@/types/activity'
import { X, Plus } from 'lucide-react'
import { Portal } from '@/lib/portal'

export function ActivityPanel() {
  const { logInstant, startActivity, stopActivity } = useActivities()
  const { customs, addCustom, deleteCustom } = useCustomActivities()
  const { activeActivityId, activeActivityType, activeActivityNote } = useAppStore()
  const [open, setOpen] = useState(false)
  const [glowKey, setGlowKey] = useState(0)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [longPressId, setLongPressId] = useState<string | null>(null)
  const [longPressTimer, setLongPressTimer] = useState<ReturnType<typeof setTimeout> | null>(null)

  const hasActive = !!activeActivityId
  const [closing, setClosing] = useState(false)

  function closePanel() {
    setClosing(true)
    setTimeout(() => { setOpen(false); setClosing(false); setLongPressId(null) }, 250)
  }

  async function handlePress(type: ActivityType) {
    if (type === 'sleep') {
      if (activeActivityType === 'sleep') await logInstant('wake')
      else await logInstant('sleep')
    } else {
      if (activeActivityType === type && activeActivityId) await stopActivity(activeActivityId)
      else await startActivity(type)
    }
    closePanel()
  }

  async function handleCustomPress(customName: string) {
    if (activeActivityId && activeActivityNote === customName) {
      await stopActivity(activeActivityId)
    } else if (!hasActive) {
      await startActivity('study', customName)
    }
    closePanel()
  }

  async function handleAddCustom() {
    if (!newName.trim()) return
    await addCustom(newName.trim())
    setNewName('')
    setShowAddForm(false)
  }

  function isDisabled(type: ActivityType) {
    if (type === 'sleep') return false
    if (!activeActivityType) return false
    if (activeActivityType === type && !activeActivityNote) return false // 기본 활동 진행중 → 종료 가능
    return true
  }

  function isCustomDisabled(customName: string) {
    if (!hasActive) return false
    if (activeActivityNote === customName) return false // 이 활동 진행중 → 종료 가능
    return true
  }

  function getSubLabel(type: ActivityType) {
    if (activeActivityType !== type) return undefined
    if (activeActivityNote) return undefined // 커스텀이면 기본 버튼에 표시 안함
    if (type === 'sleep') return '기상하기'
    return '종료하기'
  }

  // 기본 3개 + 커스텀 버튼 합쳐서 하나의 그리드
  const buttons: { key: string; label: string; color: string; isActive: boolean; disabled: boolean; subLabel?: string; onClick: () => void }[] = []

  // 기본 활동
  const TYPES: ActivityType[] = ['sleep', 'study', 'exercise']
  TYPES.forEach(type => {
    const config = ACTIVITY_CONFIG[type]
    const isActive = activeActivityType === type && !activeActivityNote
    buttons.push({
      key: type,
      label: config.label,
      color: config.color,
      isActive,
      disabled: isDisabled(type),
      subLabel: getSubLabel(type),
      onClick: () => handlePress(type),
    })
  })

  // 커스텀 활동
  customs.forEach(custom => {
    const isActive = hasActive && activeActivityNote === custom.name
    buttons.push({
      key: custom.id,
      label: custom.name,
      color: custom.color,
      isActive,
      disabled: isCustomDisabled(custom.name),
      subLabel: isActive ? '종료하기' : undefined,
      onClick: () => handleCustomPress(custom.name),
    })
  })

  return (
    <>
      {/* 사이드 탭 */}
      <button
        onClick={() => { setGlowKey(k => k + 1); setOpen(true) }}
        style={{
          position: 'fixed', left: 0, top: '50%', transform: 'translateY(-50%)',
          width: 8, height: 64, borderRadius: '0 6px 6px 0',
          background: 'rgba(255, 255, 255, 0.15)',
          backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.1)', borderLeft: 'none',
          boxShadow: '2px 0 12px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.15)',
          zIndex: 40, padding: 0, cursor: 'pointer',
        }}
      />

      {glowKey > 0 && (
        <div key={glowKey} style={{
          position: 'fixed', left: 0, top: '50%', transform: 'translateY(-50%)',
          width: 60, height: 100, pointerEvents: 'none', zIndex: 39,
          background: 'radial-gradient(ellipse at 0% 50%, rgba(255,255,255,0.2) 0%, transparent 70%)',
          animation: 'glowFade 0.5s ease forwards',
        }} />
      )}

      {open && (
        <Portal>
          <div style={{
            position: 'fixed', inset: 0, zIndex: 49,
            background: 'rgba(0,0,0,0.15)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
            animation: closing ? 'wFadeOut 0.25s ease forwards' : 'wFadeIn 0.2s ease forwards',
          }} onClick={closePanel} />

          <div style={{
            position: 'fixed', left: 16, top: '50%', transform: 'translateY(-50%)',
            width: 260, borderRadius: 24, maxHeight: '75vh', zIndex: 50,
            display: 'flex', flexDirection: 'column',
            background: 'rgba(255, 255, 255, 0.06)',
            backdropFilter: 'blur(48px) saturate(180%)', WebkitBackdropFilter: 'blur(48px) saturate(180%)',
            border: '1px solid rgba(255,255,255,0.12)',
            boxShadow: '0 12px 48px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.1)',
            overflow: 'hidden', animation: closing ? 'panelCollapse 0.25s ease forwards' : 'panelExpand 0.28s cubic-bezier(0.34,1.12,0.64,1) forwards',
          }} onClick={e => e.stopPropagation()}>

            <div className="flex items-center justify-between px-5 pt-5 pb-3 flex-shrink-0">
              <p className="text-slate-100 font-semibold text-base">활동</p>
              <button onClick={closePanel} className="text-muted active:scale-90 transition-transform p-1">
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-4" style={{ maxHeight: 'calc(75vh - 80px)' }}>
              {/* 모든 버튼 — 한 그리드 */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                {buttons.map(btn => {
                  const isCustom = customs.some(c => c.id === btn.key)
                  return (
                    <div key={btn.key} className="relative">
                      <button
                        onClick={btn.onClick}
                        disabled={btn.disabled}
                        className="flex items-center gap-2.5 rounded-xl px-3.5 py-3 transition-all active:scale-95 disabled:opacity-20 w-full"
                        style={{
                          background: btn.isActive ? `${btn.color}10` : 'rgba(255,255,255,0.02)',
                          border: `1.5px solid ${btn.isActive ? `${btn.color}50` : `${btn.color}20`}`,
                        }}
                      >
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: btn.color, opacity: btn.isActive ? 1 : 0.5, animation: btn.isActive ? 'actDot 1.5s ease-in-out infinite' : 'none' }}
                        />
                        <div className="flex-1 text-left min-w-0">
                          <span className="text-sm font-medium text-slate-200 truncate block">{btn.label}</span>
                          {btn.subLabel && <span className="text-[10px] font-medium block" style={{ color: btn.color }}>{btn.subLabel}</span>}
                        </div>
                      </button>
                      {/* 커스텀 길게 눌러 삭제 */}
                      {isCustom && (
                        <div
                          className="absolute inset-0 rounded-xl"
                          onTouchStart={() => { const t = setTimeout(() => setLongPressId(btn.key), 600); setLongPressTimer(t) }}
                          onTouchEnd={() => { if (longPressTimer) clearTimeout(longPressTimer) }}
                          onTouchMove={() => { if (longPressTimer) clearTimeout(longPressTimer) }}
                          style={{ pointerEvents: longPressId ? 'none' : 'auto' }}
                          onClick={() => { if (!longPressId) btn.onClick() }}
                        />
                      )}
                      {longPressId === btn.key && (
                        <button
                          onClick={() => { deleteCustom(btn.key); setLongPressId(null) }}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center z-10"
                          style={{ animation: 'flashIn 0.15s ease forwards' }}
                        >
                          <X size={10} className="text-white" />
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* 활동 추가 */}
              {!showAddForm ? (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="w-full flex items-center justify-center gap-2 rounded-xl py-3 transition-all active:scale-95"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)' }}
                >
                  <Plus size={14} className="text-muted" />
                  <span className="text-sm text-muted">활동 추가</span>
                </button>
              ) : (
                <div className="space-y-2">
                  <input
                    type="text" value={newName} onChange={e => setNewName(e.target.value)}
                    placeholder="활동 이름 (예: 독서, 코딩)" autoFocus
                    className="w-full rounded-xl px-3 py-2.5 text-sm placeholder:text-muted focus:outline-none"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--color-text)' }}
                    onKeyDown={e => { if (e.key === 'Enter') handleAddCustom() }}
                  />
                  <div className="flex gap-2">
                    <button onClick={handleAddCustom} disabled={!newName.trim()}
                      className="flex-1 py-2 rounded-xl text-sm font-medium text-blue-400 disabled:opacity-30"
                      style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}>
                      저장
                    </button>
                    <button onClick={() => { setShowAddForm(false); setNewName('') }}
                      className="flex-1 py-2 rounded-xl text-sm text-muted"
                      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      취소
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <style>{`
            @keyframes wFadeIn { from{opacity:0} to{opacity:1} }
            @keyframes wFadeOut { from{opacity:1} to{opacity:0} }
            @keyframes panelExpand { from{opacity:0;transform:translateY(-50%) scale(0.9) translateX(-20px)} to{opacity:1;transform:translateY(-50%) scale(1) translateX(0)} }
            @keyframes panelCollapse { from{opacity:1;transform:translateY(-50%) scale(1) translateX(0)} to{opacity:0;transform:translateY(-50%) scale(0.9) translateX(-30px)} }
            @keyframes flashIn { from{opacity:0;transform:scale(0.8)} to{opacity:1;transform:scale(1)} }
            @keyframes actDot { 0%,100%{opacity:1} 50%{opacity:0.3} }
          `}</style>
        </Portal>
      )}

      <style>{`@keyframes glowFade { 0%{opacity:1} 60%{opacity:0.6} 100%{opacity:0} }`}</style>
    </>
  )
}
