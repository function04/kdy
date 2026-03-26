import { useState, useMemo, useEffect } from 'react'
import { PageShell } from '@/components/layout/PageShell'
import { supabase } from '@/lib/supabase'
import type { Activity } from '@/types/activity'
import type { Memo } from '@/types/memo'
import { format, isToday, subDays, startOfDay, getDate } from 'date-fns'
import { ChevronLeft, ChevronRight, Moon, Sun, BookOpen, Dumbbell, Calendar, Coffee, Tag } from 'lucide-react'
import { useCustomActivities } from '@/hooks/useCustomActivities'
import { useAnalytics } from '@/hooks/useAnalytics'

// 타임라인 아이템 통합 타입
interface TimelineItem {
  id: string
  type: 'sleep' | 'wake' | 'study' | 'exercise' | 'schedule'
  label: string
  startedAt: string
  endedAt: string | null
  durationMin: number | null
  color: string
  isActive: boolean
}

const TYPE_CONFIG = {
  sleep:    { icon: Moon,     color: '#A855F7', bg: 'rgba(168,85,247,0.08)', border: 'rgba(168,85,247,0.2)' },
  wake:     { icon: Sun,      color: '#EAB308', bg: 'rgba(234,179,8,0.08)',  border: 'rgba(234,179,8,0.2)' },
  study:    { icon: BookOpen,  color: '#3B82F6', bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.2)' },
  exercise: { icon: Dumbbell, color: '#22C55E', bg: 'rgba(34,197,94,0.08)',  border: 'rgba(34,197,94,0.2)' },
  schedule: { icon: Calendar,  color: '#F97316', bg: 'rgba(249,115,22,0.08)', border: 'rgba(249,115,22,0.2)' },
}

const DAY_LABELS = ['월', '화', '수', '목', '금', '토', '일']

function fmtDuration(min: number) {
  const h = Math.floor(min / 60)
  const m = Math.round(min % 60)
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

function fmtTime(iso: string) {
  return format(new Date(iso), 'HH:mm')
}

function gapMinutes(end: string, start: string) {
  return Math.round((new Date(start).getTime() - new Date(end).getTime()) / 60000)
}

function LiveTimer({ startTime }: { startTime: string }) {
  const [text, setText] = useState('')
  useEffect(() => {
    function tick() {
      const diff = Date.now() - new Date(startTime).getTime()
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      setText(h > 0 ? `${h}h ${m}m ongoing` : `${m}m ongoing`)
    }
    tick()
    const id = setInterval(tick, 10000)
    return () => clearInterval(id)
  }, [startTime])
  return <span className="text-xs font-medium" style={{ color: '#60A5FA' }}>{text}</span>
}

// 유리 버튼
function GlassTab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1 rounded-lg text-xs font-medium transition-all"
      style={active ? {
        background: 'rgba(255,255,255,0.12)',
        border: '1px solid rgba(255,255,255,0.2)',
        color: '#e2e8f0',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      } : {
        background: 'transparent',
        border: '1px solid rgba(255,255,255,0.06)',
        color: 'rgba(148,163,184,0.7)',
      }}
    >
      {children}
    </button>
  )
}

// 주간 요약 뷰
function WeekSummaryView() {
  const { weekSummary, loading } = useAnalytics()
  const { customs } = useCustomActivities()

  if (loading || !weekSummary) {
    return <p className="text-muted text-sm text-center py-12">Loading...</p>
  }

  const { days, avgSleepMinutes, totalStudyMinutes, totalExerciseMinutes, totalTaskMinutes, busiestDay } = weekSummary

  // 최대 활동시간 (바 그래프 스케일용)
  const maxTotal = Math.max(...days.map(d => d.totalMinutes - d.sleepMinutes), 1)

  // 커스텀 활동 색상 맵
  const customColorMap: Record<string, string> = {}
  customs.forEach(c => { customColorMap[c.name] = c.color })

  const busiestLabel = busiestDay ? DAY_LABELS[new Date(busiestDay).getDay() === 0 ? 6 : new Date(busiestDay).getDay() - 1] + '요일' : '-'

  // 커스텀 활동별 주간 합산
  const customTotals: Record<string, number> = {}
  days.forEach(d => {
    Object.entries(d.customMinutes).forEach(([name, min]) => {
      customTotals[name] = (customTotals[name] ?? 0) + min
    })
  })

  // 총 활동시간 (수면 제외)
  const totalActive = totalStudyMinutes + totalExerciseMinutes + totalTaskMinutes +
    Object.values(customTotals).reduce((s, v) => s + v, 0)

  return (
    <div className="space-y-3">
      {/* 헤더 카드 */}
      <div
        className="rounded-2xl p-4 space-y-3"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
      >
        <p className="text-xs text-muted font-medium tracking-wide">이번 주</p>

        {/* 핵심 통계 */}
        <div className="space-y-2">
          <StatRow label="수면" value={`avg ${fmtDuration(avgSleepMinutes)}`} color="#A855F7" bar={avgSleepMinutes / (10 * 60)} />
          {totalStudyMinutes > 0 && <StatRow label="공부" value={fmtDuration(totalStudyMinutes)} color="#3B82F6" bar={totalStudyMinutes / (7 * 8 * 60)} />}
          {totalExerciseMinutes > 0 && <StatRow label="운동" value={fmtDuration(totalExerciseMinutes)} color="#22C55E" bar={totalExerciseMinutes / (7 * 2 * 60)} />}
          {totalTaskMinutes > 0 && <StatRow label="Task" value={fmtDuration(totalTaskMinutes)} color="#F97316" bar={totalTaskMinutes / (7 * 4 * 60)} />}
          {Object.entries(customTotals).filter(([, m]) => m > 0).map(([name, min]) => (
            <StatRow key={name} label={name} value={fmtDuration(min)} color={customColorMap[name] ?? '#6366F1'} bar={min / (7 * 4 * 60)} />
          ))}
        </div>
      </div>

      {/* 일별 활동 바 차트 */}
      <div
        className="rounded-2xl p-4"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
      >
        <p className="text-xs text-muted font-medium tracking-wide mb-3">일별 활동</p>
        <div className="space-y-2">
          {days.map((day) => {
            const label = DAY_LABELS[new Date(day.date).getDay() === 0 ? 6 : new Date(day.date).getDay() - 1]
            const pct = (day.totalMinutes - day.sleepMinutes) / maxTotal
            const isBusiest = day.date === busiestDay

            // 세그먼트 색상 순서: 수면→공부→일정→운동→커스텀
            const segments = [
              { min: day.studyMinutes, color: '#3B82F6' },
              { min: day.scheduleMinutes, color: '#F97316' },
              { min: day.exerciseMinutes, color: '#22C55E' },
              ...Object.entries(day.customMinutes).map(([name, min]) => ({
                min, color: customColorMap[name] ?? '#6366F1'
              })),
            ].filter(s => s.min > 0)

            const activeMin = day.totalMinutes - day.sleepMinutes

            return (
              <div key={day.date} className="flex items-center gap-2">
                <span className="text-xs text-muted w-4 text-center flex-shrink-0" style={isBusiest ? { color: '#60A5FA' } : {}}>{label}</span>
                <div className="flex-1 h-5 rounded-md overflow-hidden relative" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <div className="h-full flex" style={{ width: `${Math.max(pct * 100, 2)}%` }}>
                    {segments.length > 0 ? segments.map((seg, _si) => (
                      <div
                        key={_si}
                        className="h-full"
                        style={{
                          width: `${(seg.min / day.totalMinutes) * 100}%`,
                          backgroundColor: seg.color,
                          opacity: 0.75,
                        }}
                      />
                    )) : (
                      <div className="h-full w-full" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }} />
                    )}
                  </div>
                </div>
                <span className="text-xs font-medium w-10 text-right flex-shrink-0" style={{ color: activeMin > 0 ? '#94a3b8' : '#475569' }}>
                  {activeMin > 0 ? fmtDuration(activeMin) : '-'}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* 푸터 통계 */}
      <div
        className="rounded-2xl p-4 flex justify-between items-center"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
      >
        <div className="text-center">
          <p className="text-xs text-muted mb-0.5">가장 바빴던 날</p>
          <p className="text-sm font-semibold text-slate-200">{busiestLabel}</p>
        </div>
        <div className="w-px h-8" style={{ background: 'rgba(255,255,255,0.08)' }} />
        <div className="text-center">
          <p className="text-xs text-muted mb-0.5">총 활동시간</p>
          <p className="text-sm font-semibold text-slate-200">{fmtDuration(totalActive)}</p>
        </div>
      </div>
    </div>
  )
}

// 월간 요약 뷰
function MonthSummaryView() {
  const { monthSummary, loading } = useAnalytics()
  const { customs } = useCustomActivities()

  if (loading || !monthSummary) {
    return <p className="text-muted text-sm text-center py-12">Loading...</p>
  }

  const { days, avgSleepMinutes, totalStudyMinutes, totalExerciseMinutes, totalTaskMinutes, busiestDay, busiestDayMinutes, activeDays } = monthSummary

  const customColorMap: Record<string, string> = {}
  customs.forEach(c => { customColorMap[c.name] = c.color })

  // 커스텀 활동별 월간 합산
  const customTotals: Record<string, number> = {}
  days.forEach(d => {
    Object.entries(d.customMinutes).forEach(([name, min]) => {
      customTotals[name] = (customTotals[name] ?? 0) + min
    })
  })

  const totalActive = totalStudyMinutes + totalExerciseMinutes + totalTaskMinutes +
    Object.values(customTotals).reduce((s, v) => s + v, 0)

  const busiestLabel = busiestDay
    ? `${format(new Date(busiestDay), 'M/d')} (${fmtDuration(busiestDayMinutes)})`
    : '-'

  // 히트맵: days를 주 단위로 그룹화
  // 첫 날의 요일 오프셋
  const firstDay = days[0] ? new Date(days[0].date) : new Date()
  const firstDow = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1 // 월=0
  const maxDayMin = Math.max(...days.map(d => d.totalMinutes - d.sleepMinutes), 1)

  // 히트맵 셀 (빈칸 포함해서 격자 구성)
  const cells: Array<{ date: string | null; activeMin: number }> = [
    ...Array(firstDow).fill(null).map(() => ({ date: null, activeMin: 0 })),
    ...days.map(d => ({ date: d.date, activeMin: d.totalMinutes - d.sleepMinutes })),
  ]
  // 마지막 주 빈칸
  const remainder = cells.length % 7
  if (remainder > 0) {
    for (let i = 0; i < 7 - remainder; i++) cells.push({ date: null, activeMin: 0 })
  }

  const weeks: typeof cells[] = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))

  return (
    <div className="space-y-3">
      {/* 헤더 카드 */}
      <div
        className="rounded-2xl p-4 space-y-3"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
      >
        <p className="text-xs text-muted font-medium tracking-wide">{format(new Date(), 'M')}월 요약</p>
        <div className="space-y-2">
          <StatRow label="수면" value={`avg ${fmtDuration(avgSleepMinutes)}`} color="#A855F7" bar={avgSleepMinutes / (10 * 60)} />
          {totalStudyMinutes > 0 && <StatRow label="공부" value={`총 ${fmtDuration(totalStudyMinutes)}`} color="#3B82F6" bar={totalStudyMinutes / (30 * 8 * 60)} extraNote={`(일평균 ${fmtDuration(Math.round(totalStudyMinutes / 30))})`} />}
          {totalExerciseMinutes > 0 && <StatRow label="운동" value={`총 ${fmtDuration(totalExerciseMinutes)}`} color="#22C55E" bar={totalExerciseMinutes / (30 * 2 * 60)} extraNote={`(일평균 ${fmtDuration(Math.round(totalExerciseMinutes / 30))})`} />}
          {totalTaskMinutes > 0 && <StatRow label="Task" value={`총 ${fmtDuration(totalTaskMinutes)}`} color="#F97316" bar={totalTaskMinutes / (30 * 4 * 60)} extraNote={`(일평균 ${fmtDuration(Math.round(totalTaskMinutes / 30))})`} />}
          {Object.entries(customTotals).filter(([, m]) => m > 0).map(([name, min]) => (
            <StatRow key={name} label={name} value={`총 ${fmtDuration(min)}`} color={customColorMap[name] ?? '#6366F1'} bar={min / (30 * 4 * 60)} extraNote={`(일평균 ${fmtDuration(Math.round(min / 30))})`} />
          ))}
        </div>
      </div>

      {/* 히트맵 */}
      <div
        className="rounded-2xl p-4"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
      >
        <p className="text-xs text-muted font-medium tracking-wide mb-3">일별 히트맵</p>
        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {DAY_LABELS.map(d => (
            <div key={d} className="text-center text-[9px] text-muted">{d}</div>
          ))}
        </div>
        {/* 주별 행 */}
        <div className="space-y-1">
          {weeks.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7 gap-1">
              {week.map((cell, ci) => {
                if (!cell.date) return <div key={ci} className="aspect-square rounded-sm" style={{ background: 'transparent' }} />
                const intensity = cell.activeMin / maxDayMin
                const isBusiest = cell.date === busiestDay
                const isToday_ = cell.date === format(new Date(), 'yyyy-MM-dd')
                const dayNum = getDate(new Date(cell.date))
                return (
                  <div
                    key={ci}
                    className="aspect-square rounded-sm flex items-center justify-center relative"
                    style={{
                      background: cell.activeMin > 0
                        ? `rgba(96,165,250,${0.15 + intensity * 0.65})`
                        : 'rgba(255,255,255,0.04)',
                      border: isToday_ ? '1px solid rgba(96,165,250,0.6)' : isBusiest ? '1px solid rgba(251,191,36,0.5)' : '1px solid transparent',
                    }}
                  >
                    <span className="text-[8px]" style={{ color: cell.activeMin > 0 ? 'rgba(226,232,240,0.8)' : 'rgba(100,116,139,0.5)' }}>
                      {dayNum}
                    </span>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
        <p className="text-[10px] text-muted mt-2">(진할수록 활동 많은 날)</p>
      </div>

      {/* 푸터 */}
      <div
        className="rounded-2xl p-4 grid grid-cols-3 gap-2"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
      >
        <div className="text-center">
          <p className="text-[10px] text-muted mb-1">활동일</p>
          <p className="text-sm font-semibold text-slate-200">{activeDays}일 / 31일</p>
        </div>
        <div className="text-center">
          <p className="text-[10px] text-muted mb-1">가장 바빴던 날</p>
          <p className="text-sm font-semibold text-slate-200">{busiestLabel}</p>
        </div>
        <div className="text-center">
          <p className="text-[10px] text-muted mb-1">총 활동시간</p>
          <p className="text-sm font-semibold text-slate-200">{fmtDuration(totalActive)}</p>
        </div>
      </div>
    </div>
  )
}

// 공통 stat row
function StatRow({ label, value, color, bar, extraNote }: { label: string; value: string; color: string; bar: number; extraNote?: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
      <span className="text-xs text-muted w-8 flex-shrink-0">{label}</span>
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <div
          className="h-full rounded-full"
          style={{ width: `${Math.min(100, Math.max(0, bar * 100))}%`, backgroundColor: color, opacity: 0.7 }}
        />
      </div>
      <span className="text-xs font-medium text-slate-200 flex-shrink-0">{value}</span>
      {extraNote && <span className="text-[10px] text-muted flex-shrink-0">{extraNote}</span>}
    </div>
  )
}

export function AnalyticsPage() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [memos, setMemos] = useState<Memo[]>([])
  const [loading, setLoading] = useState(true)
  const [dayOffset, setDayOffset] = useState(0)
  const [summaryTab, setSummaryTab] = useState<'timeline' | 'week' | 'month'>('timeline')
  const { customs } = useCustomActivities()

  const customColorMap = useMemo(() => {
    const map: Record<string, { color: string; icon: typeof Tag }> = {}
    customs.forEach(c => { map[c.name] = { color: c.color, icon: Tag } })
    return map
  }, [customs])

  const viewDate = useMemo(() => subDays(new Date(), -dayOffset), [dayOffset])

  useEffect(() => {
    async function load() {
      setLoading(true)
      const dayStart = startOfDay(viewDate)
      const prevEvening = new Date(dayStart)
      prevEvening.setHours(prevEvening.getHours() - 6)
      const dayEnd = new Date(dayStart)
      dayEnd.setDate(dayEnd.getDate() + 1)

      const [actRes, memoRes] = await Promise.all([
        supabase.from('activities').select('*')
          .gte('started_at', prevEvening.toISOString())
          .lt('started_at', dayEnd.toISOString())
          .order('started_at', { ascending: true }),
        supabase.from('memos').select('*')
          .not('actual_start', 'is', null)
          .gte('actual_start', prevEvening.toISOString())
          .lt('actual_start', dayEnd.toISOString())
          .order('actual_start', { ascending: true }),
      ])

      setActivities(actRes.data ?? [])
      setMemos(memoRes.data ?? [])
      setLoading(false)
    }
    if (summaryTab === 'timeline') load()
  }, [dayOffset, summaryTab])

  const timeline = useMemo(() => {
    const items: TimelineItem[] = []
    activities.forEach(a => {
      if (a.type === 'wake') return
      const dur = a.ended_at
        ? Math.round((new Date(a.ended_at).getTime() - new Date(a.started_at).getTime()) / 60000)
        : null
      const customMatch = a.note ? customColorMap[a.note] : null
      items.push({
        id: a.id,
        type: a.type as TimelineItem['type'],
        label: a.note || (a.type === 'sleep' ? '수면' : a.type === 'study' ? '공부' : '운동'),
        startedAt: a.started_at,
        endedAt: a.ended_at,
        durationMin: dur,
        color: customMatch?.color ?? TYPE_CONFIG[a.type as keyof typeof TYPE_CONFIG]?.color ?? '#666',
        isActive: !a.ended_at,
      })
    })
    memos.forEach(m => {
      if (!m.actual_start) return
      items.push({
        id: m.id,
        type: 'schedule',
        label: m.title,
        startedAt: m.actual_start,
        endedAt: m.actual_end,
        durationMin: m.duration_minutes,
        color: TYPE_CONFIG.schedule.color,
        isActive: !m.actual_end && !m.is_completed,
      })
    })
    items.sort((a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime())
    return items
  }, [activities, memos])

  const summary = useMemo(() => {
    const sleep = timeline.filter(t => t.type === 'sleep' && t.durationMin).reduce((s, t) => s + (t.durationMin ?? 0), 0)
    const study = timeline.filter(t => t.type === 'study' && t.durationMin).reduce((s, t) => s + (t.durationMin ?? 0), 0)
    const exercise = timeline.filter(t => t.type === 'exercise' && t.durationMin).reduce((s, t) => s + (t.durationMin ?? 0), 0)
    const schedule = timeline.filter(t => t.type === 'schedule' && t.durationMin).reduce((s, t) => s + (t.durationMin ?? 0), 0)
    return { sleep, study, exercise, schedule, total: sleep + study + exercise + schedule }
  }, [timeline])

  const isViewToday = isToday(viewDate)

  return (
    <PageShell>
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <h2 className="text-lg font-semibold text-slate-100">Timeline</h2>
        <div className="flex gap-1.5">
          <GlassTab active={summaryTab === 'week'} onClick={() => setSummaryTab(t => t === 'week' ? 'timeline' : 'week')}>Week</GlassTab>
          <GlassTab active={summaryTab === 'month'} onClick={() => setSummaryTab(t => t === 'month' ? 'timeline' : 'month')}>Month</GlassTab>
        </div>
      </div>

      {/* Week 요약 */}
      {summaryTab === 'week' && (
        <div className="px-4 pb-24">
          <WeekSummaryView />
        </div>
      )}

      {/* Month 요약 */}
      {summaryTab === 'month' && (
        <div className="px-4 pb-24">
          <MonthSummaryView />
        </div>
      )}

      {/* Timeline */}
      {summaryTab === 'timeline' && (
        <>
          {/* 날짜 네비 */}
          <div className="flex items-center justify-between px-4 pb-3">
            <button onClick={() => setDayOffset(d => d - 1)} className="p-1.5 text-muted active:text-slate-200">
              <ChevronLeft size={18} />
            </button>
            <div className="text-center">
              <p className="text-sm font-medium text-slate-200">
                {isViewToday ? 'Today' : format(viewDate, 'EEE, MMM d')}
              </p>
              <p className="text-[10px] text-muted">{format(viewDate, 'yyyy.MM.dd EEEE')}</p>
            </div>
            <button
              onClick={() => setDayOffset(d => Math.min(d + 1, 0))}
              disabled={dayOffset >= 0}
              className="p-1.5 text-muted active:text-slate-200 disabled:opacity-20"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="px-4 pb-24">
            {/* 요약 바 */}
            {summary.total > 0 && (
              <div className="bg-card border border-border rounded-2xl p-4 mb-4">
                <div className="flex gap-3 mb-3">
                  {[
                    { label: '수면', min: summary.sleep, color: '#A855F7' },
                    { label: '공부', min: summary.study, color: '#3B82F6' },
                    { label: '일정', min: summary.schedule, color: '#F97316' },
                    { label: '운동', min: summary.exercise, color: '#22C55E' },
                  ].filter(s => s.min > 0).map(s => (
                    <div key={s.label} className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                      <span className="text-xs text-slate-300">{s.label}</span>
                      <span className="text-xs font-medium text-slate-100">{fmtDuration(s.min)}</span>
                    </div>
                  ))}
                </div>
                <div className="h-2 rounded-full overflow-hidden flex" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  {[
                    { min: summary.sleep, color: '#A855F7' },
                    { min: summary.study, color: '#3B82F6' },
                    { min: summary.schedule, color: '#F97316' },
                    { min: summary.exercise, color: '#22C55E' },
                  ].filter(s => s.min > 0).map((s, i) => (
                    <div
                      key={i}
                      className="h-full"
                      style={{ width: `${(s.min / (24 * 60)) * 100}%`, backgroundColor: s.color, opacity: 0.8 }}
                    />
                  ))}
                </div>
                <p className="text-[10px] text-muted mt-1.5 text-right">
                  Active {fmtDuration(summary.total)} / 24h
                </p>
              </div>
            )}

            {/* 타임라인 */}
            {loading ? (
              <p className="text-muted text-sm text-center py-12">Loading...</p>
            ) : timeline.length === 0 ? (
              <p className="text-muted text-sm text-center py-12">No activities recorded</p>
            ) : (
              <div className="relative">
                <div
                  className="absolute left-[52px] top-0 bottom-0 w-[1px]"
                  style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,0.08), rgba(255,255,255,0.03))' }}
                />
                <div className="space-y-0">
                  {timeline.map((item, i) => {
                    const config = TYPE_CONFIG[item.type]
                    const customMatch = customColorMap[item.label]
                    const Icon = customMatch ? Tag : config.icon
                    const itemColor = customMatch?.color ?? item.color
                    const itemBg = customMatch ? `${customMatch.color}10` : config.bg
                    const itemBorder = customMatch ? `${customMatch.color}25` : config.border
                    const prevItem = i > 0 ? timeline[i - 1] : null
                    const gap = prevItem?.endedAt ? gapMinutes(prevItem.endedAt, item.startedAt) : 0

                    return (
                      <div key={item.id}>
                        {gap >= 5 && (
                          <div className="flex items-center gap-3 py-2 pl-[18px]">
                            <span className="text-[10px] text-muted w-8 text-right">{fmtDuration(gap)}</span>
                            <div className="w-3 flex justify-center">
                              <Coffee size={8} className="text-muted/40" />
                            </div>
                            <span className="text-[10px] text-muted/40">Free time</span>
                          </div>
                        )}
                        <div className="flex items-start gap-3">
                          <div className="w-[40px] pt-3.5 text-right flex-shrink-0">
                            <span className="text-xs font-mono text-muted">{fmtTime(item.startedAt)}</span>
                          </div>
                          <div className="flex-shrink-0 pt-3 relative z-10">
                            <div
                              className="w-[10px] h-[10px] rounded-full border-2"
                              style={{
                                borderColor: item.color,
                                backgroundColor: item.isActive ? item.color : 'var(--color-background)',
                                boxShadow: item.isActive ? `0 0 8px ${item.color}60` : 'none',
                                animation: item.isActive ? 'dotPulse 2s ease-in-out infinite' : 'none',
                              }}
                            />
                          </div>
                          <div
                            className="flex-1 rounded-xl p-3 mb-2 transition-all"
                            style={{ background: itemBg, border: `1px solid ${itemBorder}`, backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-2 mb-1">
                                <Icon size={14} style={{ color: itemColor }} strokeWidth={2} />
                                <span className="text-sm font-semibold text-slate-100">{item.label}</span>
                              </div>
                              {item.isActive && (
                                <span className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5" style={{ backgroundColor: item.color, animation: 'dotPulse 1.5s ease-in-out infinite' }} />
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              {item.endedAt ? (
                                <>
                                  <span className="text-[11px] text-muted">{fmtTime(item.startedAt)} → {fmtTime(item.endedAt)}</span>
                                  {item.durationMin && (
                                    <>
                                      <span className="text-muted text-[10px]">·</span>
                                      <span className="text-[11px] font-medium" style={{ color: item.color }}>{fmtDuration(item.durationMin)}</span>
                                    </>
                                  )}
                                </>
                              ) : item.isActive ? (
                                <LiveTimer startTime={item.startedAt} />
                              ) : (
                                <span className="text-[11px] text-muted">{fmtTime(item.startedAt)}</span>
                              )}
                            </div>
                            {item.durationMin && item.durationMin > 0 && (
                              <div className="mt-2 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
                                <div
                                  className="h-full rounded-full"
                                  style={{ width: `${Math.min(100, (item.durationMin / 180) * 100)}%`, backgroundColor: item.color, opacity: 0.6 }}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}

                  {isViewToday && (
                    <div className="flex items-center gap-3">
                      <div className="w-[40px] text-right flex-shrink-0">
                        <span className="text-xs font-mono text-blue-400">{format(new Date(), 'HH:mm')}</span>
                      </div>
                      <div className="flex-shrink-0 relative z-10">
                        <div className="w-[10px] h-[10px] rounded-full bg-blue-500" style={{ boxShadow: '0 0 8px rgba(59,130,246,0.5)', animation: 'dotPulse 2s ease-in-out infinite' }} />
                      </div>
                      <div className="flex-1 py-2">
                        <span className="text-xs text-blue-400 font-medium">Now</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      <style>{`
        @keyframes dotPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.3); }
        }
      `}</style>
    </PageShell>
  )
}
