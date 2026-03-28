import { useState, useEffect, useMemo } from 'react'
import { PageShell } from '@/components/layout/PageShell'
import { MemoCard } from './MemoCard'
import { MemoForm } from './MemoForm'
import { useMemos } from '@/hooks/useMemos'
import { useGCal } from '@/contexts/GoogleCalendarContext'
import type { Memo } from '@/types/memo'
import { Plus, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react'
import {
  format, startOfWeek, addDays, isToday, isSameDay, isSameMonth,
  startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths,
  getDay,
} from 'date-fns'

type FormState = { show: boolean; editing: Memo | null }
type Listener = (s: FormState) => void
let _state: FormState = { show: false, editing: null }
const _listeners = new Set<Listener>()
function setFormState(s: FormState) {
  _state = s
  _listeners.forEach(fn => fn(s))
}
function useFormState() {
  const [s, setS] = useState<FormState>(_state)
  useEffect(() => {
    setS(_state)
    _listeners.add(setS)
    return () => { _listeners.delete(setS) }
  }, [])
  return s
}

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const DAY_LABELS_KO = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

export function SchedulePage() {
  const { memos, loading, createMemo, updateMemo, deleteMemo, toggleComplete } = useMemos()
  const gcal = useGCal()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [weekOffset, setWeekOffset] = useState(0)
  const [showCalendar, setShowCalendar] = useState(false)
  const [calMonth, setCalMonth] = useState(new Date())
  const formState = useFormState()

  const weekDays = useMemo(() => {
    const base = addDays(new Date(), weekOffset * 7)
    const start = startOfWeek(base, { weekStartsOn: 0 })
    return Array.from({ length: 7 }, (_, i) => addDays(start, i))
  }, [weekOffset])

  const calendarDays = useMemo(() => {
    const start = startOfMonth(calMonth)
    const end = endOfMonth(calMonth)
    const days = eachDayOfInterval({ start, end })
    const padded: (Date | null)[] = Array(getDay(start)).fill(null)
    return [...padded, ...days]
  }, [calMonth])

  const filtered = useMemo(() => {
    return memos
      .filter(m => {
        if (!m.scheduled_at) return true
        return isSameDay(new Date(m.scheduled_at), selectedDate)
      })
      .sort((a, b) => {
        // 미완료 먼저
        if (a.is_completed !== b.is_completed) return a.is_completed ? 1 : -1
        if (a.scheduled_at && b.scheduled_at) return new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
        if (a.scheduled_at) return -1
        if (b.scheduled_at) return 1
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      })
  }, [memos, selectedDate])

  const datesWithMemos = useMemo(() => {
    const set = new Set<string>()
    memos.forEach(m => {
      if (m.scheduled_at && !m.is_completed) set.add(format(new Date(m.scheduled_at), 'yyyy-MM-dd'))
    })
    return set
  }, [memos])

  function handleSubmit(data: Omit<Memo, 'id' | 'user_id' | 'created_at' | 'actual_start' | 'actual_end' | 'duration_minutes'>) {
    if (formState.editing) {
      updateMemo(formState.editing.id, data)
    } else {
      createMemo(data)
      if (gcal.isSignedIn && data.scheduled_at) {
        gcal.ensureAuth(() => { gcal.createEvent(data.title, data.scheduled_at!) })
      }
    }
  }

  function selectCalDay(day: Date) {
    setSelectedDate(day)
    setShowCalendar(false)
    const today = new Date()
    const diffDays = Math.round((day.getTime() - today.getTime()) / (24 * 60 * 60 * 1000))
    setWeekOffset(Math.floor((diffDays + today.getDay()) / 7) - Math.floor(today.getDay() / 7))
  }

  return (
    <PageShell>
      {/* 헤더 */}
      <div className="px-4 pt-4 pb-1 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-100">Task</h2>
        <button
          onClick={() => { setWeekOffset(0); setSelectedDate(new Date()); setCalMonth(new Date()) }}
          className="text-xs text-blue-400 font-medium"
        >
          Today
        </button>
      </div>

      {/* 년월 토글 */}
      <div className="px-4 pt-1 pb-2">
        <button
          onClick={() => { setShowCalendar(!showCalendar); setCalMonth(selectedDate) }}
          className="flex items-center gap-1.5 active:opacity-70"
        >
          <span className="text-sm font-medium text-slate-200">
            {format(weekDays[3], 'MMMM yyyy')}
          </span>
          <ChevronDown size={14} className={`text-muted transition-transform ${showCalendar ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* 풀 캘린더 */}
      {showCalendar && (
        <div className="mx-4 mb-3 bg-card border border-border rounded-2xl p-3" style={{ animation: 'calOpen 0.2s ease-out' }}>
          <div className="flex items-center justify-between mb-3">
            <button onClick={() => setCalMonth(m => subMonths(m, 1))} className="p-1 text-muted active:text-slate-200"><ChevronLeft size={16} /></button>
            <span className="text-sm font-medium text-slate-200">{format(calMonth, 'MMMM yyyy')}</span>
            <button onClick={() => setCalMonth(m => addMonths(m, 1))} className="p-1 text-muted active:text-slate-200"><ChevronRight size={16} /></button>
          </div>
          <div className="grid grid-cols-7 mb-1">
            {DAY_LABELS.map((d, i) => (
              <div key={i} className="text-center text-[10px] text-muted font-medium py-1">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {calendarDays.map((day, i) => {
              if (!day) return <div key={`p-${i}`} />
              const selected = isSameDay(day, selectedDate)
              const today = isToday(day)
              const thisMonth = isSameMonth(day, calMonth)
              const hasMemo = datesWithMemos.has(format(day, 'yyyy-MM-dd'))
              return (
                <button key={i} onClick={() => selectCalDay(day)} className="flex flex-col items-center justify-center py-1.5">
                  <span className={`w-7 h-7 flex items-center justify-center rounded-full text-xs transition-all ${
                    selected ? 'bg-blue-600 text-white' : today ? 'text-blue-400 font-bold' : thisMonth ? 'text-slate-300' : 'text-muted/40'
                  }`}>{format(day, 'd')}</span>
                  {hasMemo && !selected && <span className="w-1 h-1 rounded-full bg-blue-400 mt-0.5" />}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* 주간 바 */}
      <div className="px-2 pb-3">
        <div className="flex items-center justify-between px-2 mb-2">
          <button onClick={() => setWeekOffset(w => w - 1)} className="p-1 text-muted active:text-slate-200"><ChevronLeft size={16} /></button>
          <p className="text-xs text-muted">{format(weekDays[0], 'M/d')} - {format(weekDays[6], 'M/d')}</p>
          <button onClick={() => setWeekOffset(w => w + 1)} className="p-1 text-muted active:text-slate-200"><ChevronRight size={16} /></button>
        </div>
        <div className="flex justify-around">
          {weekDays.map((day, i) => {
            const selected = isSameDay(day, selectedDate)
            const today = isToday(day)
            const hasMemo = datesWithMemos.has(format(day, 'yyyy-MM-dd'))
            return (
              <button key={i} onClick={() => setSelectedDate(day)} className="flex flex-col items-center gap-1 py-1 w-10">
                <span className={`text-[10px] font-medium ${today ? 'text-blue-400' : 'text-muted'}`}>{DAY_LABELS_KO[i]}</span>
                <span className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-semibold transition-all ${
                  selected ? 'bg-blue-600 text-white' : today ? 'text-blue-400' : 'text-slate-200'
                }`}>{format(day, 'd')}</span>
                <span className={`w-1 h-1 rounded-full transition-opacity ${hasMemo ? 'bg-blue-400 opacity-100' : 'opacity-0'}`} />
              </button>
            )
          })}
        </div>
      </div>

      {/* 구분선 */}
      <div className="mx-4 border-t border-border" />

      {/* Task 목록 */}
      <div className="px-4 pt-3 space-y-2 pb-24">
        {loading ? (
          <p className="text-muted text-sm text-center py-8">Loading...</p>
        ) : filtered.length === 0 ? (
          <p className="text-muted text-sm text-center py-12">No tasks</p>
        ) : (
          filtered.map(memo => (
            <MemoCard
              key={memo.id}
              memo={memo}
              onToggle={() => toggleComplete(memo.id, memo.is_completed)}
              onEdit={() => setFormState({ show: true, editing: memo })}
              onDelete={() => deleteMemo(memo.id)}
            />
          ))
        )}
      </div>

      {formState.show && (
        <MemoForm
          initial={formState.editing ?? undefined}
          onSubmit={handleSubmit}
          onClose={() => setFormState({ show: false, editing: null })}
        />
      )}

      <style>{`@keyframes calOpen { from { opacity: 0; max-height: 0; } to { opacity: 1; max-height: 400px; } }`}</style>
    </PageShell>
  )
}

export function ScheduleFAB({ isVisible }: { isVisible: boolean }) {
  if (!isVisible) return null
  return (
    <button
      onClick={() => setFormState({ show: true, editing: null })}
      className="active:scale-85 transition-transform"
      style={{
        position: 'fixed',
        bottom: 'calc(max(16px, env(safe-area-inset-bottom)) + 70px)',
        right: 20,
        width: 48, height: 48, borderRadius: 24,
        background: 'rgba(59, 130, 246, 0.15)',
        backdropFilter: 'blur(24px) saturate(200%)',
        WebkitBackdropFilter: 'blur(24px) saturate(200%)',
        border: '1px solid rgba(59, 130, 246, 0.25)',
        boxShadow: '0 4px 20px rgba(59, 130, 246, 0.2), inset 0 1px 0 rgba(255,255,255,0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 41,
      }}
    >
      <Plus size={22} style={{ color: '#60A5FA' }} strokeWidth={2.5} />
    </button>
  )
}
