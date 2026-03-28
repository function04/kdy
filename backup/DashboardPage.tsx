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
import { ko } from 'date-fns/locale'
import { Plus, Trash2, X, Clock } from 'lucide-react'
import { Portal } from '@/lib/portal'

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
function ElapsedTimer({ startTime }: { startTime: string }) {
  const [elapsed, setElapsed] = useState('')

  useEffect(() => {
    function update() {
      const diff = Date.now() - new Date(startTime).getTime()
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      if (h > 0) setElapsed(`${h}h ${String(m).padStart(2, '0')}m`)
      else setElapsed(`${m}:${String(s).padStart(2, '0')}`)
    }
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [startTime])

  return (
    <span className="text-blue-400 font-mono text-xs font-bold tabular-nums">{elapsed}</span>
  )
}

function TaskCard({ memo, onComplete }: { memo: Memo; onComplete: () => void }) {
  const isActive = memo.actual_start && !memo.actual_end
  const now = new Date()
  const scheduled = memo.scheduled_at ? new Date(memo.scheduled_at) : null
  const daysLeft = scheduled ? differenceInDays(scheduled, now) : null

  // 시간 표시
  const scheduledTimeStr = scheduled
    ? format(scheduled, 'a h:mm', { locale: ko })
    : ''

  // 남은 일수 텍스트
  const daysLeftText = daysLeft !== null
    ? daysLeft <= 0 ? 'Today'
    : daysLeft === 1 ? 'Tomorrow'
    : `${daysLeft} Days Left`
    : ''

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
      // 더블탭 → 완료
      if (tapTimer.current) clearTimeout(tapTimer.current)
      setTapCount(0)
      setDismissed(true)
      setTimeout(() => onComplete(), 500)
    }
  }

  if (dismissed) {
    return (
      <div className="transition-all duration-500 ease-out" style={{ maxHeight: 0, opacity: 0, transform: 'scale(0.9) translateX(40px)', marginBottom: 0, overflow: 'hidden' }} />
    )
  }

  return (
    <div
      className={`bg-card border border-border rounded-2xl p-4 relative overflow-hidden transition-transform ${isActive ? 'active:scale-[0.97]' : ''}`}
      onClick={handleTap}
    >
      {/* 진행중 상단 애니메이션 바 */}
      {isActive && (
        <div
          className="absolute top-0 left-0 right-0 h-[2px]"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, #3B82F6 30%, #06B6D4 50%, #3B82F6 70%, transparent 100%)',
            backgroundSize: '200% 100%',
            animation: 'taskShimmer 2s linear infinite',
          }}
        />
      )}

      {/* 상단: 우선순위 배지 */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${
            memo.priority === 2
              ? 'bg-red-500/10 text-red-400 border-red-500/20'
              : memo.priority === 1
                ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                : 'bg-green-500/10 text-green-400 border-green-500/20'
          }`}>
            {memo.priority === 2 ? 'High' : memo.priority === 1 ? 'Medium' : 'Low'}
          </span>
          {isActive && (
            <span className="flex items-center gap-1 text-[10px] font-medium text-blue-400">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" style={{ animation: 'taskPulse 1.5s ease-in-out infinite' }} />
              In Progress
            </span>
          )}
        </div>
        {isActive && <ElapsedTimer startTime={memo.actual_start!} />}
      </div>

      {/* 제목 */}
      <p className="text-slate-100 font-bold text-[15px] mb-1">{memo.title}</p>

      {/* 시간 + 남은 일수 */}
      <div className="flex items-center justify-between mt-1.5">
        <div className="flex items-center gap-1.5">
          <Clock size={11} className="text-muted" />
          <span className="text-xs text-muted">{scheduledTimeStr}</span>
        </div>

        {isActive ? (
          <span className="text-[10px] text-muted">Double tap to complete</span>
        ) : daysLeftText ? (
          <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full ${
            daysLeft !== null && daysLeft <= 0 ? 'text-red-400 bg-red-500/10' :
            daysLeft === 1 ? 'text-orange-400 bg-orange-500/10' :
            'text-blue-400 bg-blue-500/10'
          }`}>
            {daysLeftText}
          </span>
        ) : null}
      </div>

      <style>{`
        @keyframes taskPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
        @keyframes taskShimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
      `}</style>
    </div>
  )
}

// 활동 트래커 카드
function ActivityTracker() {
  const { stopActivity } = useActivities()
  const { activeActivityId, activeActivityType, activeActivityStartedAt, activeActivityNote } = useAppStore()
  const { customs } = useCustomActivities()
  const [elapsed, setElapsed] = useState('')
  const [tapCount, setTapCount] = useState(0)
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [dismissed, setDismissed] = useState(false)

  // 활동 이름/색상 결정 — 커스텀이면 note + 커스텀 색상
  const activityInfo = useMemo(() => {
    if (!activeActivityId || !activeActivityType) return null
    // 커스텀 활동 (note가 있으면)
    if (activeActivityNote) {
      const custom = customs.find(c => c.name === activeActivityNote)
      return { label: activeActivityNote, color: custom?.color ?? ACTIVITY_CONFIG[activeActivityType]?.color ?? '#3B82F6' }
    }
    const config = ACTIVITY_CONFIG[activeActivityType]
    if (config) return { label: config.label, color: config.color }
    return { label: activeActivityType, color: '#666' }
  }, [activeActivityId, activeActivityType, activeActivityNote, customs])

  // 커스텀 활동이면 activities에서 note 가져오기 어려우니
  // 여기서는 store에 저장된 type만 사용. 커스텀은 study로 저장되므로
  // ACTIVITY_CONFIG['study'].label = '공부'가 나옴
  // → 개선: ActiveTimer의 라벨을 직접 씀

  useEffect(() => {
    if (!activeActivityStartedAt) return
    function tick() {
      const diff = Date.now() - new Date(activeActivityStartedAt!).getTime()
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      if (h > 0) setElapsed(`${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`)
      else setElapsed(`${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [activeActivityStartedAt])

  function handleTap() {
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

  // dismissed 후 store가 업데이트되면 리셋
  useEffect(() => {
    if (dismissed && !activeActivityId) setDismissed(false)
  }, [activeActivityId, dismissed])

  const isActive = !!activeActivityId && !!activityInfo
  const color = activityInfo?.color ?? 'rgba(255,255,255,0.15)'

  return (
    <button
      onClick={isActive ? handleTap : undefined}
      className={`bg-card rounded-2xl px-3 py-3 relative overflow-hidden text-center ${isActive ? 'active:scale-95' : ''} transition-transform`}
      style={{ border: `1px solid ${isActive ? `${color}25` : 'var(--color-border)'}` }}
    >
      {isActive && (
        <div className="absolute top-0 left-0 right-0 h-[1.5px]"
          style={{
            background: `linear-gradient(90deg, transparent, ${color}, ${color}80, ${color}, transparent)`,
            backgroundSize: '200% 100%', animation: 'actShimmer 2.5s linear infinite',
          }}
        />
      )}
      {isActive ? (
        <>
          <div className="flex items-center justify-center gap-1.5 mb-0.5">
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color, animation: 'actPulse 1.5s ease-in-out infinite' }} />
            <p className="text-[10px] text-muted truncate">{activityInfo!.label}</p>
          </div>
          <p className="text-lg font-bold font-mono tabular-nums" style={{ color }}>{elapsed}</p>
        </>
      ) : (
        <>
          <p className="text-lg font-bold text-muted/30">--:--</p>
          <p className="text-[10px] text-muted mt-0.5">Activity</p>
        </>
      )}
      <style>{`
        @keyframes actShimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
        @keyframes actPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
      `}</style>
    </button>
  )
}

export function DashboardPage() {
  const { profile } = useAuth()
  const { memos, startMemo, completeMemo } = useMemos()
  const { ddays, createDday, updateDday, deleteDday } = useDdays()
  const [showDday, setShowDday] = useState(false)
  const [showDdaySheet, setShowDdaySheet] = useState(false)
  const [ddayTitle, setDdayTitle] = useState('')
  const [ddayDate, setDdayDate] = useState('')

  if (showDday) return <DdayPage onBack={() => setShowDday(false)} />

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

  // 자동 시작: 시간이 지난 오늘 일정 중 actual_start가 없는 것
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

  // 표시할 Recent Task 카드 (최대 2개)
  const displayCards = useMemo(() => {
    const cards: Memo[] = []
    const now = new Date()
    // 1. 진행중인 것 먼저
    const active = memos.filter(m => m.actual_start && !m.actual_end && !m.is_completed)
    active.forEach(m => { if (cards.length < 2) cards.push(m) })
    // 2. 오늘 대기중
    const todayPending = memos
      .filter(m => m.scheduled_at && isToday(new Date(m.scheduled_at)) && !m.is_completed && !m.actual_start)
      .sort((a, b) => new Date(a.scheduled_at!).getTime() - new Date(b.scheduled_at!).getTime())
    todayPending.forEach(m => { if (cards.length < 2) cards.push(m) })
    // 3. upcoming (미래) — 가장 가까운 것부터
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

  return (
    <PageShell>
      <Header displayName={profile?.display_name ?? profile?.username} />

      <div className="px-4 py-2 space-y-3 pb-24">

        {/* D-day + Upcoming + Today — 한 줄 */}
        <div className="flex gap-2">
          {dday ? (
            <button
              onClick={openDdaySheet}
              className="bg-card border border-border rounded-2xl px-3 py-3 flex-1 text-center active:scale-95 transition-transform"
            >
              <p className={`text-lg font-bold ${isPast ? 'text-muted' : 'text-white'}`}>{ddayText}</p>
              <p className="text-[10px] text-muted truncate mt-0.5">{dday.title}</p>
            </button>
          ) : (
            <button
              onClick={openDdaySheet}
              className="bg-card border border-dashed border-border rounded-2xl px-3 py-3 flex-1 text-center active:scale-95 transition-transform"
            >
              <Plus size={16} className="text-muted mx-auto" />
              <p className="text-[10px] text-muted mt-0.5">D-day</p>
            </button>
          )}

          <div className="bg-card border border-border rounded-2xl px-3 py-3 flex-1 text-center">
            <p className="text-lg font-bold text-blue-400">{upcomingCount}</p>
            <p className="text-[10px] text-muted mt-0.5">Upcoming</p>
          </div>

          <div className="bg-card border border-border rounded-2xl px-3 py-3 flex-1 text-center">
            <p className="text-lg font-bold text-slate-100">{todayCount}</p>
            <p className="text-[10px] text-muted mt-0.5">Today</p>
          </div>
        </div>

        {/* Activity Tracker + 빈 카드 — 1:2 비율 */}
        <div className="grid grid-cols-3 gap-2">
          <ActivityTracker />
          <div className="col-span-2 bg-card border border-border rounded-2xl px-3 py-3" />
        </div>

        {/* Recent Task */}
        {displayCards.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-slate-300 mb-2">Recent task</h3>
            <div className="space-y-2">
              {displayCards.map(memo => (
                <TaskCard
                  key={memo.id}
                  memo={memo}
                  onComplete={() => completeMemo(memo.id)}
                />
              ))}
            </div>
          </div>
        )}

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
                background: 'rgba(var(--nav-bg), 0.85)', backdropFilter: 'blur(48px) saturate(200%)',
                WebkitBackdropFilter: 'blur(48px) saturate(200%)',
                border: '0.5px solid rgba(var(--nav-border), 0.25)', borderRadius: 24, padding: 20,
                boxShadow: '0 8px 40px rgba(0,0,0,0.4)', animation: 'ddExpandUp 0.25s cubic-bezier(0.34,1.4,0.64,1) forwards',
              }}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-slate-100 font-semibold text-sm">D-day {dday ? 'Edit' : 'Set'}</h3>
                <button onClick={() => setShowDdaySheet(false)} className="text-muted"><X size={18} /></button>
              </div>
              <input type="text" value={ddayTitle} onChange={e => setDdayTitle(e.target.value)}
                placeholder="Title" autoFocus
                className="w-full bg-background border border-border rounded-xl px-4 py-3 placeholder:text-muted focus:outline-none focus:border-blue-500 text-sm"
                style={{ color: 'var(--color-text)' }} />
              <input type="date" value={ddayDate} onChange={e => setDdayDate(e.target.value)}
                className="w-full bg-background border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 text-sm"
                style={{ color: 'var(--color-text)' }} />
              <button onClick={handleDdaySave} disabled={!ddayTitle.trim() || !ddayDate}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-semibold py-3 rounded-xl transition-colors text-sm">
                Save
              </button>
              {dday && (
                <button onClick={handleDdayDelete} className="w-full flex items-center justify-center gap-2 text-red-400 text-sm py-2">
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
