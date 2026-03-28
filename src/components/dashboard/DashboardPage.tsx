import { useState, useEffect, useMemo, useRef } from 'react'
import { PageShell } from '@/components/layout/PageShell'
import { Header } from '@/components/layout/Header'
import { DdayPage } from '@/components/dday/DdayPage'
import { useAuth } from '@/hooks/useAuth'
import { useMemos } from '@/hooks/useMemos'
import { useDdays } from '@/hooks/useDdays'
import { useActivities } from '@/hooks/useActivities'
import { useCustomActivities } from '@/hooks/useCustomActivities'
import { useAppStore } from '@/stores/appStore'
import { ACTIVITY_CONFIG } from '@/lib/constants'
import { isToday, differenceInDays, parseISO, format } from 'date-fns'
import { Plus, Trash2, X } from 'lucide-react'
import { Portal } from '@/lib/portal'
import { useTodos } from '@/hooks/useTodos'
import { TodoPage } from '@/components/todo/TodoPage'

import type { Memo } from '@/types/memo'

function getDdayText(dateStr: string) {
  const target = parseISO(dateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  if (isToday(target)) return 'D-Day'
  const diff = differenceInDays(target, today)
  return diff > 0 ? `D-${diff}` : `D+${Math.abs(diff)}`
}

// 경과 시간 타이머
function ElapsedTimer({ startTime, color }: { startTime: string; color: string }) {
  const [elapsed, setElapsed] = useState('')

  useEffect(() => {
    function update() {
      const diff = Date.now() - new Date(startTime).getTime()
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      if (h > 0) setElapsed(`${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`)
      else setElapsed(`${m}:${String(s).padStart(2, '0')}`)
    }
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [startTime])

  return (
    <span className="font-mono text-sm font-bold tabular-nums" style={{ color }}>{elapsed}</span>
  )
}

// 태스크 행 (Grouped List 스타일)
function TaskRow({ memo, onComplete, isLast }: { memo: Memo; onComplete: () => void; isLast: boolean }) {
  const isActive = memo.actual_start && !memo.actual_end
  const now = new Date()
  const scheduled = memo.scheduled_at ? new Date(memo.scheduled_at) : null
  // 날짜만 비교 (시간 무시)
  const daysLeft = scheduled ? (() => {
    const s = new Date(scheduled.getFullYear(), scheduled.getMonth(), scheduled.getDate())
    const n = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    return Math.round((s.getTime() - n.getTime()) / (24 * 60 * 60 * 1000))
  })() : null

  const scheduledTimeStr = scheduled
    ? format(scheduled, 'h:mm a')
    : ''

  const daysLeftText = daysLeft !== null
    ? daysLeft <= 0 ? 'Today'
    : daysLeft === 1 ? 'Tomorrow'
    : `${daysLeft} Days Left`
    : ''

  // 우선순위 색상
  const priorityColor = memo.priority === 2 ? '#F87171' : memo.priority === 1 ? '#FBBF24' : '#4ADE80'

  // 더블탭 완료
  const [tapCount, setTapCount] = useState(0)
  const [dismissed, setDismissed] = useState(false)
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleTap() {
    if (!isActive) return
    if (tapCount === 0) {
      setTapCount(1)
      tapTimer.current = setTimeout(() => setTapCount(0), 400)
    } else {
      if (tapTimer.current) clearTimeout(tapTimer.current)
      setTapCount(0)
      setDismissed(true)
      setTimeout(() => onComplete(), 500)
    }
  }

  if (dismissed) {
    return (
      <div className="transition-all duration-500 ease-out" style={{ maxHeight: 0, opacity: 0, overflow: 'hidden' }} />
    )
  }

  return (
    <div
      className={`px-4 py-3.5 pressable ${isActive ? 'cursor-pointer' : ''}`}
      onClick={handleTap}
      style={{ background: isActive ? 'rgba(255,255,255,0.03)' : 'transparent' }}
    >
      <div className="flex items-start gap-3">
        {/* 컬러 인디케이터 — 세로 바 */}
        <div className="flex-shrink-0 pt-[3px]">
          <div
            className="w-[3px] h-[32px] rounded-full"
            style={{
              backgroundColor: isActive ? priorityColor : `${priorityColor}50`,
              boxShadow: isActive ? `0 0 6px ${priorityColor}30` : 'none',
            }}
          />
        </div>

        {/* 제목 + 시간 */}
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-medium text-[#EDEDEF] truncate">{memo.title}</p>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-[12px] text-[#5C5C66]">{scheduledTimeStr}</span>
            {isActive && <span className="text-[10px] text-[#5B8DEF]">In Progress</span>}
          </div>
        </div>

        {/* 오른쪽: 타이머 또는 남은 일수 */}
        <div className="flex-shrink-0 pt-[2px]">
          {isActive ? (
            <ElapsedTimer startTime={memo.actual_start!} color="#5B8DEF" />
          ) : daysLeftText ? (
            <span className={`text-[12px] font-medium ${
              daysLeft !== null && daysLeft <= 0 ? 'text-[#F87171]' :
              daysLeft === 1 ? 'text-[#FBBF24]' :
              'text-[#5C5C66]'
            }`}>
              {daysLeftText}
            </span>
          ) : null}
        </div>
      </div>

      {/* 구분선 (마지막 아이템 제외) */}
      {!isLast && (
        <div className="ml-5 mt-3.5" style={{ height: '0.5px', background: 'rgba(255,255,255,0.06)' }} />
      )}

      <style>{`
        @keyframes taskPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
      `}</style>
    </div>
  )
}

// 활동 트래커 — 탭하면 오버레이로 활동 선택
function ActivityTracker() {
  const { logInstant, startActivity, stopActivity } = useActivities()
  const { activeActivityId, activeActivityType, activeActivityStartedAt, activeActivityNote } = useAppStore()
  const { customs, addCustom } = useCustomActivities()
  const [tapCount, setTapCount] = useState(0)
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [dismissed, setDismissed] = useState(false)
  const [showPicker, setShowPicker] = useState(false)
  const [showAddCustom, setShowAddCustom] = useState(false)
  const [newActName, setNewActName] = useState('')
  const cardRef = useRef<HTMLDivElement>(null)

  const activityInfo = useMemo(() => {
    if (!activeActivityId || !activeActivityType) return null
    if (activeActivityNote) {
      const custom = customs.find(c => c.name === activeActivityNote)
      return { label: activeActivityNote, color: custom?.color ?? ACTIVITY_CONFIG[activeActivityType]?.color ?? '#3B82F6' }
    }
    const config = ACTIVITY_CONFIG[activeActivityType]
    if (config) return { label: config.label, color: config.color }
    return { label: activeActivityType, color: '#666' }
  }, [activeActivityId, activeActivityType, activeActivityNote, customs])

  function handleDoubleTap() {
    if (!activeActivityId) return
    if (tapCount === 0) {
      setTapCount(1)
      tapTimer.current = setTimeout(() => setTapCount(0), 400)
    } else {
      if (tapTimer.current) clearTimeout(tapTimer.current)
      setTapCount(0)
      setDismissed(true)
      setTimeout(() => { if (activeActivityId) stopActivity(activeActivityId) }, 400)
    }
  }

  function openPicker() {
    setShowPicker(true)
  }

  function handleSelect(action: () => void) {
    action()
    setShowPicker(false)
  }

  useEffect(() => {
    if (dismissed && !activeActivityId) setDismissed(false)
  }, [activeActivityId, dismissed])

  useEffect(() => {
    if (activeActivityId) setShowPicker(false)
  }, [activeActivityId])

  const isActive = !!activeActivityId && !!activityInfo
  const color = activityInfo?.color ?? '#5C5C66'

  const activityButtons = useMemo(() => [
    { label: '취침', color: '#C084FC', action: () => logInstant('sleep') },
    { label: '공부', color: '#60A5FA', action: () => startActivity('study') },
    { label: '운동', color: '#4ADE80', action: () => startActivity('exercise') },
    ...customs.map(c => ({
      label: c.name,
      color: c.color,
      action: () => startActivity('study', c.name),
    })),
  ], [customs, logInstant, startActivity])

  return (
    <>
      <div ref={cardRef}>
        {!isActive ? (
          <button
            onClick={openPicker}
            className="w-full px-4 py-4 flex items-center justify-between pressable"
            style={{ background: '#141416', borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div className="flex items-center gap-3">
              <div className="w-[6px] h-[6px] rounded-full bg-[#5C5C66]/30" />
              <span className="text-[13px] text-[#5C5C66]">No Activity</span>
            </div>
            <span className="text-[11px] text-[#5C5C66]/50">Tap to start</span>
          </button>
        ) : (
          <div
            className="relative overflow-hidden pressable cursor-pointer"
            onClick={handleDoubleTap}
            style={{ background: '#141416', borderRadius: 16, border: `1px solid ${color}20` }}
          >
            <div className="absolute top-0 left-0 right-0 h-[2px]" style={{
              background: `linear-gradient(90deg, transparent, ${color}, ${color}80, ${color}, transparent)`,
              backgroundSize: '200% 100%', animation: 'actShimmer 2.5s linear infinite',
            }} />
            <div className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ background: color, borderRadius: '16px 0 0 16px' }} />
            <div className="px-4 pl-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color, animation: 'actPulse 1.5s ease-in-out infinite' }} />
                <span className="text-[14px] font-medium" style={{ color }}>{activityInfo!.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <ElapsedTimer startTime={activeActivityStartedAt!} color={color} />
                <span className="text-[10px] text-[#5C5C66]">Double tap to stop</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 오버레이 — 화면 중앙에 원형 배치 */}
      {showPicker && (
        <Portal>
          <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ animation: 'actOverlayIn 0.2s ease forwards' }}
            onClick={() => setShowPicker(false)}
          >
            <div className="absolute inset-0" style={{
              background: 'rgba(0,0,0,0.5)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
            }} />

            {/* 중앙 원형 배치 — 약간 위로 */}
            <div className="relative" style={{ width: 240, height: 240, marginTop: -60 }}>
              {activityButtons.map((btn, i) => {
                const total = activityButtons.length
                const radius = 88
                const angle = ((360 / total) * i - 90) * (Math.PI / 180)
                const x = 120 + Math.cos(angle) * radius
                const y = 120 + Math.sin(angle) * radius

                return (
                  <button
                    key={btn.label}
                    onClick={(e) => { e.stopPropagation(); handleSelect(btn.action) }}
                    className="absolute flex flex-col items-center gap-1.5 pressable"
                    style={{
                      left: x,
                      top: y,
                      transform: 'translate(-50%, -50%)',
                      animation: `actBubble 0.25s cubic-bezier(0.22, 1, 0.36, 1) ${i * 50}ms both`,
                    }}
                  >
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center"
                      style={{
                        background: `${btn.color}0C`,
                        border: `1px solid ${btn.color}25`,
                      }}
                    >
                      <span className="text-[13px] font-medium" style={{ color: btn.color }}>{btn.label.slice(0, 2)}</span>
                    </div>
                    {btn.label.length > 2 && <span className="text-[9px] font-medium" style={{ color: `${btn.color}99` }}>{btn.label}</span>}
                  </button>
                )
              })}

              {/* 중앙 + 버튼 (활동 추가) */}
              <button
                onClick={(e) => { e.stopPropagation(); setShowPicker(false); setShowAddCustom(true) }}
                className="absolute flex items-center justify-center pressable"
                style={{
                  left: 120, top: 120,
                  transform: 'translate(-50%, -50%)',
                  width: 36, height: 36, borderRadius: 18,
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  animation: 'actBubble 0.2s cubic-bezier(0.22, 1, 0.36, 1) both',
                }}
              >
                <Plus size={16} className="text-[#A0A0A8]" />
              </button>
            </div>
          </div>
          <style>{`
            @keyframes actOverlayIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes actBubble {
              from { opacity: 0; transform: translate(-50%, -50%) scale(0); }
              to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
            }
          `}</style>
        </Portal>
      )}

      {/* 커스텀 활동 추가 시트 */}
      {showAddCustom && (
        <Portal>
          <div
            className="fixed inset-0 z-50 flex items-end justify-center"
            style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', animation: 'actOverlayIn 0.18s ease forwards' }}
            onClick={() => { setShowAddCustom(false); setNewActName('') }}
          >
            <div
              className="w-full"
              style={{
                maxWidth: 'calc(100vw - 32px)',
                marginBottom: 'calc(max(24px, env(safe-area-inset-bottom)) + 80px)',
                background: '#1C1C1F',
                border: '1px solid rgba(255,255,255,0.10)',
                borderRadius: 20,
                padding: 20,
                animation: 'ddExpandUp 0.25s cubic-bezier(0.34,1.4,0.64,1) forwards',
              }}
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-[#EDEDEF] font-semibold text-[14px] mb-3">Add Activity</h3>
              <form onSubmit={e => {
                e.preventDefault()
                if (!newActName.trim()) return
                addCustom(newActName.trim())
                setNewActName('')
                setShowAddCustom(false)
              }}>
                <input
                  type="text"
                  value={newActName}
                  onChange={e => setNewActName(e.target.value)}
                  placeholder="활동 이름 (예: 독서, 코딩)"
                  autoFocus
                  className="w-full rounded-xl px-4 py-3 text-[14px] placeholder:text-[#5C5C66]/60 focus:outline-none mb-3"
                  style={{ color: '#EDEDEF', background: '#0A0A0B', border: '1px solid rgba(255,255,255,0.08)' }}
                />
                <button
                  type="submit"
                  disabled={!newActName.trim()}
                  className="w-full py-3 rounded-xl text-[14px] font-medium disabled:opacity-30"
                  style={{ background: '#5B8DEF', color: '#fff' }}
                >
                  Add
                </button>
              </form>
            </div>
          </div>
        </Portal>
      )}

      <style>{`
        @keyframes actShimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
        @keyframes actPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
        @keyframes ddExpandUp { from{opacity:0;transform:scale(0.88) translateY(20px)} to{opacity:1;transform:scale(1) translateY(0)} }
      `}</style>
    </>
  )
}

export function DashboardPage() {
  const { profile } = useAuth()
  const { memos, startMemo, completeMemo } = useMemos()
  const { ddays, createDday, updateDday, deleteDday } = useDdays()
  const { todos, addTodo, toggleTodo } = useTodos()
  const [todoInput, setTodoInput] = useState('')
  const [showTodoPage, setShowTodoPage] = useState(false)
  const [dismissingTodo, setDismissingTodo] = useState<string | null>(null)
  const [showDday, setShowDday] = useState(false)
  const [showDdaySheet, setShowDdaySheet] = useState(false)
  const [ddayTitle, setDdayTitle] = useState('')
  const [ddayDate, setDdayDate] = useState('')

  const dday = ddays[0] ?? null
  const ddayText = dday ? getDdayText(dday.date) : null
  const isPast = ddayText?.startsWith('D+')
  const now = new Date()

  const upcomingCount = memos.filter(m =>
    !m.is_completed && m.scheduled_at && new Date(m.scheduled_at) > now
  ).length

  const todayCount = memos.filter(m =>
    m.scheduled_at && isToday(new Date(m.scheduled_at)) && !m.is_completed
  ).length

  // 자동 시작
  useEffect(() => {
    const now = new Date()
    memos.forEach(m => {
      if (
        m.scheduled_at &&
        isToday(new Date(m.scheduled_at)) &&
        new Date(m.scheduled_at) <= now &&
        !m.is_completed &&
        !m.actual_start
      ) {
        startMemo(m.id)
      }
    })
  }, [memos])

  // 표시할 Recent Task (최대 2개)
  const displayCards = useMemo(() => {
    const cards: Memo[] = []
    const now = new Date()
    const active = memos.filter(m => m.actual_start && !m.actual_end && !m.is_completed)
    active.forEach(m => { if (cards.length < 2) cards.push(m) })
    const todayPending = memos
      .filter(m => m.scheduled_at && isToday(new Date(m.scheduled_at)) && !m.is_completed && !m.actual_start)
      .sort((a, b) => new Date(a.scheduled_at!).getTime() - new Date(b.scheduled_at!).getTime())
    todayPending.forEach(m => { if (cards.length < 2) cards.push(m) })
    const upcoming = memos
      .filter(m => m.scheduled_at && new Date(m.scheduled_at) > now && !m.is_completed && !m.actual_start && !isToday(new Date(m.scheduled_at)))
      .sort((a, b) => new Date(a.scheduled_at!).getTime() - new Date(b.scheduled_at!).getTime())
    upcoming.forEach(m => { if (cards.length < 2) cards.push(m) })
    return cards
  }, [memos])

  function openDdaySheet() {
    if (dday) { setDdayTitle(dday.title); setDdayDate(dday.date) }
    else { setDdayTitle(''); setDdayDate('') }
    setShowDdaySheet(true)
  }

  async function handleDdaySave() {
    if (!ddayTitle.trim() || !ddayDate) return
    if (dday) await updateDday(dday.id, { title: ddayTitle.trim(), date: ddayDate, color: dday.color })
    else await createDday({ title: ddayTitle.trim(), date: ddayDate, color: '#3B82F6' })
    setShowDdaySheet(false)
  }

  async function handleDdayDelete() {
    if (dday) await deleteDday(dday.id)
    setShowDdaySheet(false)
  }

  if (showTodoPage) return <TodoPage onBack={() => setShowTodoPage(false)} />
  if (showDday) return <DdayPage onBack={() => setShowDday(false)} />

  return (
    <PageShell>
      <Header displayName={profile?.display_name ?? profile?.username} />

      <div className="px-4 py-2 space-y-5 pb-24">

        {/* ━━ 상단 요약 (카드 없음, 텍스트 행) ━━ */}
        <div className="flex items-center gap-3 px-1">
          {dday ? (
            <button onClick={openDdaySheet} className="pressable flex items-center gap-1.5">
              <span className={`text-[15px] font-bold ${isPast ? 'text-[#5C5C66]' : 'text-[#EDEDEF]'}`}>{ddayText}</span>
              <span className="text-[12px] text-[#5C5C66]">{dday.title}</span>
            </button>
          ) : (
            <button onClick={openDdaySheet} className="pressable flex items-center gap-1">
              <Plus size={13} className="text-[#5C5C66]" />
              <span className="text-[12px] text-[#5C5C66]">D-day</span>
            </button>
          )}

          <span className="text-[#5C5C66]/30">·</span>

          <div className="flex items-center gap-1">
            <span className="text-[14px] font-bold text-[#5B8DEF]">{upcomingCount}</span>
            <span className="text-[12px] text-[#5C5C66]">Upcoming</span>
          </div>

          <span className="text-[#5C5C66]/30">·</span>

          <div className="flex items-center gap-1">
            <span className="text-[14px] font-bold text-[#EDEDEF]">{todayCount}</span>
            <span className="text-[12px] text-[#5C5C66]">Today</span>
          </div>
        </div>

        {/* ━━ In Progress 활동 (Accent Bar) ━━ */}
        <ActivityTracker />

        {/* ━━ Recent Task (Grouped List, 최대 2개) ━━ */}
        {displayCards.length > 0 && (
          <div>
            <div className="px-1 mb-1.5">
              <h3 className="text-[12px] font-medium text-[#5C5C66]">Recent Task</h3>
            </div>
            <div style={{ background: '#141416', borderRadius: 14, border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
              {displayCards.map((memo, i) => (
                <div key={memo.id} className="animate-in">
                  <TaskRow
                    memo={memo}
                    onComplete={() => completeMemo(memo.id)}
                    isLast={i === displayCards.length - 1}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ━━ To Do ━━ */}
        <div>
          <div className="px-1 mb-1.5 flex items-center justify-between">
            <button onClick={() => setShowTodoPage(true)} className="pressable">
              <h3 className="text-[12px] font-medium text-[#5C5C66]">To Do →</h3>
            </button>
          </div>
          <div className="space-y-0">
            {/* 미완료 항목만 표시 (홈에서는 완료 항목 안 보임) */}
            {todos.filter(t => !t.is_done).map((todo, i) => (
              <div
                key={todo.id}
                className="flex items-center gap-3 py-2 px-1 animate-in"
                style={{
                  animationDelay: `${i * 30}ms`,
                  ...(dismissingTodo === todo.id ? {
                    opacity: 0,
                    maxHeight: 0,
                    transform: 'translateX(20px)',
                    transition: 'all 0.35s cubic-bezier(0.22, 1, 0.36, 1)',
                    overflow: 'hidden',
                    padding: 0,
                    margin: 0,
                  } : {}),
                }}
              >
                <button
                  onClick={(e) => {
                    const btn = e.currentTarget
                    btn.classList.add('haptic')
                    setTimeout(() => btn.classList.remove('haptic'), 350)
                    setDismissingTodo(todo.id)
                    setTimeout(() => {
                      toggleTodo(todo.id, todo.is_done)
                      setDismissingTodo(null)
                    }, 400)
                  }}
                  className="w-[18px] h-[18px] rounded-full border-[1.5px] flex-shrink-0 pressable"
                  style={{ borderColor: 'rgba(255,255,255,0.15)' }}
                />
                <span className="text-[13px] text-[#EDEDEF] flex-1">{todo.text}</span>
              </div>
            ))}
            {/* 인라인 추가 */}
            <form
              onSubmit={e => {
                e.preventDefault()
                if (!todoInput.trim()) return
                addTodo(todoInput.trim())
                setTodoInput('')
              }}
              className="flex items-center gap-3 py-2 px-1"
            >
              <div className="w-[18px] h-[18px] rounded-full border-[1.5px] border-dashed flex-shrink-0 flex items-center justify-center" style={{ borderColor: 'rgba(255,255,255,0.10)' }}>
                <Plus size={10} className="text-[#5C5C66]" />
              </div>
              <input
                type="text"
                value={todoInput}
                onChange={e => setTodoInput(e.target.value)}
                placeholder="Add..."
                className="flex-1 bg-transparent text-[13px] text-[#EDEDEF] placeholder:text-[#5C5C66]/40 focus:outline-none"
              />
            </form>
          </div>
        </div>

      </div>

      {/* D-day 시트 */}
      {showDdaySheet && (
        <Portal>
          <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', animation: 'ddFadeIn 0.18s ease forwards' }}
            onClick={() => setShowDdaySheet(false)}
          >
            <div
              className="w-full space-y-3"
              style={{
                maxWidth: 'calc(100vw - 32px)', marginTop: 'auto',
                marginBottom: 'calc(max(24px, env(safe-area-inset-bottom)) + 80px)',
                background: 'rgba(20,20,22,0.95)', backdropFilter: 'blur(48px) saturate(200%)',
                WebkitBackdropFilter: 'blur(48px) saturate(200%)',
                border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 20,
                boxShadow: '0 8px 40px rgba(0,0,0,0.5)', animation: 'ddExpandUp 0.25s cubic-bezier(0.34,1.4,0.64,1) forwards',
              }}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-[#EDEDEF] font-semibold text-sm">D-day {dday ? 'Edit' : 'Set'}</h3>
                <button onClick={() => setShowDdaySheet(false)} className="text-[#5C5C66]"><X size={18} /></button>
              </div>
              <input type="text" value={ddayTitle} onChange={e => setDdayTitle(e.target.value)}
                placeholder="Title" autoFocus
                className="w-full rounded-xl px-4 py-3 placeholder:text-[#5C5C66] focus:outline-none text-sm"
                style={{ color: '#EDEDEF', background: '#0A0A0B', border: '1px solid rgba(255,255,255,0.08)' }} />
              <input type="date" value={ddayDate} onChange={e => setDdayDate(e.target.value)}
                className="w-full rounded-xl px-4 py-3 focus:outline-none text-sm"
                style={{ color: '#EDEDEF', background: '#0A0A0B', border: '1px solid rgba(255,255,255,0.08)' }} />
              <button onClick={handleDdaySave} disabled={!ddayTitle.trim() || !ddayDate}
                className="w-full disabled:opacity-40 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
                style={{ background: '#5B8DEF' }}>
                Save
              </button>
              {dday && (
                <button onClick={handleDdayDelete} className="w-full flex items-center justify-center gap-2 text-[#F87171] text-sm py-2">
                  <Trash2 size={14} /> Delete
                </button>
              )}
            </div>
            <style>{`
              @keyframes ddFadeIn { from{opacity:0} to{opacity:1} }
              @keyframes ddExpandUp { from{opacity:0;transform:scale(0.88) translateY(20px)} to{opacity:1;transform:scale(1) translateY(0)} }
            `}</style>
          </div>
        </Portal>
      )}
    </PageShell>
  )
}
