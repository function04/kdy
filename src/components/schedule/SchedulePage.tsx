import { useState, useEffect, useMemo, useRef } from 'react'
import { PageShell } from '@/components/layout/PageShell'
import { MemoCard } from './MemoCard'
import { MemoForm, parseNaturalInput } from './MemoForm'
import { useMemos } from '@/hooks/useMemos'
import { useGCal } from '@/contexts/GoogleCalendarContext'
import type { Memo } from '@/types/memo'
import { Plus, ChevronLeft, ChevronRight, ChevronDown, Settings2, Calendar } from 'lucide-react'
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

function WeekStrip({ weekDays, selectedDate, datesWithMemos, onSelectDate, onSwipeLeft, onSwipeRight }: {
  weekDays: Date[]
  selectedDate: Date
  datesWithMemos: Set<string>
  onSelectDate: (d: Date) => void
  onSwipeLeft: () => void
  onSwipeRight: () => void
}) {
  const stripRef = useRef<HTMLDivElement>(null)
  const startX = useRef(0)
  const startY = useRef(0)
  const dirLocked = useRef<'h' | 'v' | null>(null)
  const [dragX, setDragX] = useState(0)
  const [transitioning, setTransitioning] = useState(false)
  const fired = useRef(false)

  useEffect(() => {
    const el = stripRef.current
    if (!el) return

    function onTouchStart(e: TouchEvent) {
      if (transitioning) return
      startX.current = e.touches[0].clientX
      startY.current = e.touches[0].clientY
      dirLocked.current = null
      fired.current = false
      setDragX(0)
    }

    function onTouchMove(e: TouchEvent) {
      if (transitioning) return
      if (dirLocked.current === 'v') return
      const dx = e.touches[0].clientX - startX.current
      const dy = e.touches[0].clientY - startY.current

      if (!dirLocked.current) {
        if (Math.abs(dx) > Math.abs(dy) * 1.8 && Math.abs(dx) > 12) {
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
      e.stopPropagation()

      // 탄성 저항 적용
      const resistance = 0.4
      setDragX(dx * resistance)
    }

    function onTouchEnd() {
      if (dirLocked.current !== 'h' || fired.current || transitioning) {
        dirLocked.current = null
        setDragX(0)
        return
      }

      fired.current = true
      const threshold = 30
      const currentDrag = dragX

      if (Math.abs(currentDrag) > threshold) {
        // 슬라이드 아웃 애니메이션
        const direction = currentDrag < 0 ? -1 : 1
        setTransitioning(true)
        setDragX(direction * 120)

        setTimeout(() => {
          if (direction < 0) onSwipeLeft()
          else onSwipeRight()
          // 반대쪽에서 슬라이드 인
          setDragX(direction * -80)
          requestAnimationFrame(() => {
            setTransitioning(false)
            setDragX(0)
          })
        }, 180)
      } else {
        setDragX(0)
      }
      dirLocked.current = null
    }

    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchmove', onTouchMove, { passive: false })
    el.addEventListener('touchend', onTouchEnd, { passive: true })
    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', onTouchEnd)
    }
  }, [onSwipeLeft, onSwipeRight, transitioning, dragX])

  return (
    <div ref={stripRef} className="px-4 pb-3 overflow-hidden" data-no-swipe>
      <div
        className="flex justify-around"
        style={{
          transform: `translateX(${dragX}px)`,
          transition: dirLocked.current === 'h' ? 'none' : 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          opacity: transitioning ? 0.6 : 1,
        }}
      >
        {weekDays.map((day, i) => {
          const selected = isSameDay(day, selectedDate)
          const today = isToday(day)
          const hasMemo = datesWithMemos.has(format(day, 'yyyy-MM-dd'))
          return (
            <button key={i} onClick={() => onSelectDate(day)} className="flex flex-col items-center gap-1 py-1 w-10">
              <span className={`text-[10px] font-medium ${today ? 'text-[#5B8DEF]' : 'text-[#5C5C66]'}`}>{DAY_LABELS[i]}</span>
              <span className={`w-8 h-8 flex items-center justify-center rounded-full text-[14px] font-semibold transition-all ${
                selected ? 'bg-[#5B8DEF] text-white' : today ? 'text-[#5B8DEF]' : 'text-[#A0A0A8]'
              }`}>{format(day, 'd')}</span>
              <div className="h-[4px] flex items-center justify-center">
                {hasMemo && !selected && <div className="w-[4px] h-[4px] rounded-full bg-[#5B8DEF]/50" />}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function QuickAdd({ onAdd, onOpenForm }: {
  onAdd: (data: Omit<Memo, 'id' | 'user_id' | 'created_at' | 'actual_start' | 'actual_end' | 'duration_minutes'>) => void
  onOpenForm: () => void
}) {
  const [value, setValue] = useState('')
  const [preview, setPreview] = useState<{ title: string; scheduledAt: string } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleChange(v: string) {
    setValue(v)
    if (v.trim()) {
      const result = parseNaturalInput(v)
      setPreview(result.scheduledAt ? result : null)
    } else {
      setPreview(null)
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!value.trim()) return
    const result = parseNaturalInput(value)
    const title = result.title || value.trim()
    onAdd({
      title,
      content: null,
      scheduled_at: result.scheduledAt ? new Date(result.scheduledAt).toISOString() : null,
      is_completed: false,
      priority: 0,
      color: '#5B8DEF',
    })
    setValue('')
    setPreview(null)
    inputRef.current?.blur()
  }

  return (
    <div className="px-4 pt-3 pb-2">
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <div className="flex-1 relative">
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={e => handleChange(e.target.value)}
            placeholder="+ Add new task..."
            className="w-full rounded-xl px-4 py-3 text-[14px] placeholder:text-[#5C5C66]/60 focus:outline-none transition-colors"
            style={{
              color: '#EDEDEF',
              background: '#141416',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
            onFocus={e => {
              (e.target as HTMLInputElement).style.borderColor = 'rgba(91,141,239,0.3)'
            }}
            onBlur={e => {
              (e.target as HTMLInputElement).style.borderColor = 'rgba(255,255,255,0.06)'
            }}
          />
        </div>
        <button
          type="button"
          onClick={onOpenForm}
          className="p-3 rounded-xl pressable"
          style={{ background: '#141416', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <Settings2 size={16} className="text-[#5C5C66]" />
        </button>
      </form>
      {preview && (
        <p className="text-[12px] text-[#5B8DEF] mt-1.5 px-1">
          {new Date(preview.scheduledAt).toLocaleString('ko-KR', {
            month: 'long', day: 'numeric', weekday: 'short',
            hour: '2-digit', minute: '2-digit',
          })} · {preview.title}
        </p>
      )}
    </div>
  )
}

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
        <h2 className="text-lg font-semibold text-[#EDEDEF]">Task</h2>
        <button
          onClick={() => { setWeekOffset(0); setSelectedDate(new Date()); setCalMonth(new Date()) }}
          className="text-[12px] text-[#5B8DEF] font-medium pressable"
        >
          Today
        </button>
      </div>

      {/* 년월 토글 */}
      <div className="px-4 pt-1 pb-2">
        <button
          onClick={() => { setShowCalendar(!showCalendar); setCalMonth(selectedDate) }}
          className="flex items-center gap-1.5 pressable"
        >
          <span className="text-[14px] font-medium text-[#A0A0A8]">
            {format(weekDays[3], 'MMMM yyyy')}
          </span>
          <ChevronDown size={14} className={`text-[#5C5C66] transition-transform ${showCalendar ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* 풀 캘린더 */}
      {showCalendar && (
        <div className="mx-4 mb-3 p-3" style={{ background: '#141416', borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)', animation: 'calOpen 0.2s ease-out' }}>
          <div className="flex items-center justify-between mb-3">
            <button onClick={() => setCalMonth(m => subMonths(m, 1))} className="p-1 text-[#5C5C66] active:text-[#EDEDEF]"><ChevronLeft size={16} /></button>
            <span className="text-[14px] font-medium text-[#A0A0A8]">{format(calMonth, 'MMMM yyyy')}</span>
            <button onClick={() => setCalMonth(m => addMonths(m, 1))} className="p-1 text-[#5C5C66] active:text-[#EDEDEF]"><ChevronRight size={16} /></button>
          </div>
          <div className="grid grid-cols-7 mb-1">
            {DAY_LABELS.map((d, i) => (
              <div key={i} className="text-center text-[10px] text-[#5C5C66] font-medium py-1">{d}</div>
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
                    selected ? 'bg-[#5B8DEF] text-white' : today ? 'text-[#5B8DEF] font-bold' : thisMonth ? 'text-[#A0A0A8]' : 'text-[#5C5C66]/40'
                  }`}>{format(day, 'd')}</span>
                  {hasMemo && !selected && <span className="w-1 h-1 rounded-full bg-[#5B8DEF] mt-0.5" />}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* 주간 바 — 스와이프 가능 */}
      <WeekStrip
        weekDays={weekDays}
        selectedDate={selectedDate}
        datesWithMemos={datesWithMemos}
        onSelectDate={setSelectedDate}
        onSwipeLeft={() => setWeekOffset(w => w + 1)}
        onSwipeRight={() => setWeekOffset(w => w - 1)}
      />

      {/* 구분선 */}
      <div className="mx-4" style={{ height: '0.5px', background: 'rgba(255,255,255,0.06)' }} />

      {/* 빠른 추가 입력 */}
      <QuickAdd onAdd={(data) => {
        createMemo(data)
        if (gcal.isSignedIn && data.scheduled_at) {
          gcal.ensureAuth(() => { gcal.createEvent(data.title, data.scheduled_at!) })
        }
      }} onOpenForm={() => setFormState({ show: true, editing: null })} />

      {/* Task 목록 */}
      <div className="px-4 pt-1 space-y-2 pb-24">
        {loading ? (
          <div className="space-y-2">
            {[1,2,3].map(i => (
              <div key={i} className="p-4 rounded-[14px]" style={{ background: '#141416', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center gap-3">
                  <div className="skeleton w-[6px] h-[32px] rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="skeleton h-[14px] w-[60%]" />
                    <div className="skeleton h-[12px] w-[30%]" />
                  </div>
                  <div className="skeleton h-[12px] w-[40px]" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <Calendar size={28} className="text-[#5C5C66]/30" />
            <p className="text-[#5C5C66] text-[13px]">No tasks for this day</p>
          </div>
        ) : (
          filtered.map((memo, i) => (
            <div key={memo.id} className="animate-in" style={{ animationDelay: `${i * 30}ms` }}>
              <MemoCard
                memo={memo}
                onToggle={() => toggleComplete(memo.id, memo.is_completed)}
                onEdit={() => setFormState({ show: true, editing: memo })}
                onDelete={() => deleteMemo(memo.id)}
              />
            </div>
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
      className="active:scale-90 transition-transform"
      style={{
        position: 'fixed',
        bottom: 'calc(max(16px, env(safe-area-inset-bottom)) + 70px)',
        right: 20,
        width: 44, height: 44, borderRadius: 14,
        background: '#141416',
        border: '1px solid rgba(255,255,255,0.08)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 41,
      }}
    >
      <Plus size={20} style={{ color: '#5B8DEF' }} strokeWidth={2} />
    </button>
  )
}
