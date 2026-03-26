import { useState } from 'react'
import type { Memo } from '@/types/memo'
import { X } from 'lucide-react'
import { Portal } from '@/lib/portal'

const PRIORITY_COLORS: Record<0 | 1 | 2, string> = {
  0: '#3B82F6',
  1: '#F59E0B',
  2: '#EF4444',
}

const PRIORITY_OPTIONS: { val: 0 | 1 | 2; label: string; color: string; activeBg: string; activeBorder: string }[] = [
  { val: 0, label: 'Low',    color: 'text-green-400',  activeBg: 'rgba(34,197,94,0.12)',  activeBorder: 'rgba(34,197,94,0.4)' },
  { val: 1, label: 'Medium', color: 'text-yellow-400', activeBg: 'rgba(234,179,8,0.12)',  activeBorder: 'rgba(234,179,8,0.4)' },
  { val: 2, label: 'High',   color: 'text-red-400',    activeBg: 'rgba(239,68,68,0.12)',  activeBorder: 'rgba(239,68,68,0.4)' },
]

interface MemoFormProps {
  initial?: Partial<Memo>
  onSubmit: (data: Omit<Memo, 'id' | 'user_id' | 'created_at' | 'actual_start' | 'actual_end' | 'duration_minutes'>) => void
  onClose: () => void
}

const DAY_MAP: Record<string, number> = {
  '일': 0, '월': 1, '화': 2, '수': 3, '목': 4, '금': 5, '토': 6,
}

function toDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function getNextWeekDay(targetDay: number): Date {
  const now = new Date()
  const current = now.getDay()
  const daysUntilEndOfWeek = 6 - current
  const diff = daysUntilEndOfWeek + 1 + targetDay
  const d = new Date(now)
  d.setDate(d.getDate() + diff)
  return d
}

function getThisWeekDay(targetDay: number): Date {
  const now = new Date()
  const current = now.getDay()
  let diff = targetDay - current
  if (diff <= 0) diff += 7
  const d = new Date(now)
  d.setDate(d.getDate() + diff)
  return d
}

function parseNaturalInput(input: string): { title: string; scheduledAt: string } {
  const now = new Date()
  let text = input.trim()
  let baseDate: Date | null = null
  let hour = -1
  let minute = 0

  const t1 = text.match(/(오전|오후)?\s*(\d{1,2})\s*시\s*(\d{1,2}\s*분)?/u)
  const t2 = text.match(/(\d{1,2}):(\d{2})/)
  const t3 = text.match(/(오전|오후)\s*(\d{1,2})\s*시?/)

  if (t1) {
    hour = parseInt(t1[2])
    if (t1[1] === '오후' && hour < 12) hour += 12
    if (t1[1] === '오전' && hour === 12) hour = 0
    if (t1[3]) minute = parseInt(t1[3])
    text = text.replace(t1[0], ' ').trim()
  } else if (t2) {
    hour = parseInt(t2[1])
    minute = parseInt(t2[2])
    text = text.replace(t2[0], ' ').trim()
  } else if (t3) {
    hour = parseInt(t3[2])
    if (t3[1] === '오후' && hour < 12) hour += 12
    if (t3[1] === '오전' && hour === 12) hour = 0
    text = text.replace(t3[0], ' ').trim()
  }

  if (/오늘/.test(text)) {
    baseDate = new Date(now); text = text.replace(/오늘\s*/, '').trim()
  } else if (/내일/.test(text)) {
    baseDate = new Date(now); baseDate.setDate(baseDate.getDate() + 1); text = text.replace(/내일\s*/, '').trim()
  } else if (/모레/.test(text)) {
    baseDate = new Date(now); baseDate.setDate(baseDate.getDate() + 2); text = text.replace(/모레\s*/, '').trim()
  } else if (/다음\s*주?\s*([일월화수목금토])요?일?/.test(text)) {
    const m = text.match(/다음\s*주?\s*([일월화수목금토])요?일?/)!
    baseDate = getNextWeekDay(DAY_MAP[m[1]]); text = text.replace(m[0], '').trim()
  } else if (/(이번\s*주?\s*)?([일월화수목금토])요?일?에?/.test(text)) {
    const m = text.match(/(이번\s*주?\s*)?([일월화수목금토])요?일?에?/)!
    baseDate = getThisWeekDay(DAY_MAP[m[2]]); text = text.replace(m[0], '').trim()
  } else {
    const d1 = text.match(/(\d{1,2})\s*월\s*(\d{1,2})\s*일?/)
    const d2 = text.match(/(\d{1,2})[\/\-](\d{1,2})/)
    if (d1) {
      baseDate = new Date(now.getFullYear(), parseInt(d1[1]) - 1, parseInt(d1[2]))
      if (baseDate < now) baseDate.setFullYear(baseDate.getFullYear() + 1)
      text = text.replace(d1[0], '').trim()
    } else if (d2) {
      baseDate = new Date(now.getFullYear(), parseInt(d2[1]) - 1, parseInt(d2[2]))
      if (baseDate < now) baseDate.setFullYear(baseDate.getFullYear() + 1)
      text = text.replace(d2[0], '').trim()
    }
  }

  if (hour >= 0 && !baseDate) {
    baseDate = new Date(now)
    if (hour < now.getHours() || (hour === now.getHours() && minute <= now.getMinutes())) {
      baseDate.setDate(baseDate.getDate() + 1)
    }
  }

  if (baseDate && hour < 0) { hour = 9; minute = 0 }

  let scheduledAt = ''
  if (baseDate && hour >= 0) {
    scheduledAt = `${toDateStr(baseDate)}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
  }

  const title = text.replace(/\s+/g, ' ').trim()
  return { title: title || input.trim(), scheduledAt }
}

export function MemoForm({ initial, onSubmit, onClose }: MemoFormProps) {
  const [rawInput, setRawInput] = useState(initial?.title ?? '')
  const [title, setTitle] = useState(initial?.title ?? '')
  const [scheduledAt, setScheduledAt] = useState(
    initial?.scheduled_at ? initial.scheduled_at.slice(0, 16) : ''
  )
  const [priority, setPriority] = useState<0 | 1 | 2>(initial?.priority ?? 0)
  const [parsed, setParsed] = useState(false)

  const isEditing = !!initial?.id

  function handleRawChange(value: string) {
    setRawInput(value)
    if (!isEditing) {
      const result = parseNaturalInput(value)
      setTitle(result.title)
      if (result.scheduledAt) { setScheduledAt(result.scheduledAt); setParsed(true) }
      else setParsed(false)
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    onSubmit({
      title: title.trim(),
      content: initial?.content ?? null,
      scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null,
      is_completed: initial?.is_completed ?? false,
      priority,
      color: PRIORITY_COLORS[priority],
    })
    onClose()
  }

  return (
    <Portal>
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{
        background: 'rgba(0,0,0,0.15)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        animation: 'mfFadeIn 0.18s ease forwards',
      }}
      onClick={onClose}
    >
      <div
        className="w-full rounded-3xl p-5"
        style={{
          maxWidth: 'calc(100vw - 32px)',
          marginTop: 'auto',
          marginBottom: 'calc(max(24px, env(safe-area-inset-bottom)) + 80px)',
          background: 'rgba(255, 255, 255, 0.06)',
          backdropFilter: 'blur(48px) saturate(200%)',
          WebkitBackdropFilter: 'blur(48px) saturate(200%)',
          border: '1px solid rgba(255,255,255,0.12)',
          animation: 'mfExpandUp 0.25s cubic-bezier(0.34,1.4,0.64,1) forwards',
          boxShadow: '0 12px 48px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-slate-100 font-semibold text-base">{isEditing ? 'Edit Task' : 'New Task'}</h3>
          <button onClick={onClose} className="text-muted hover:text-slate-300 p-1">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <input
              type="text"
              value={isEditing ? title : rawInput}
              onChange={(e) => isEditing ? setTitle(e.target.value) : handleRawChange(e.target.value)}
              placeholder={isEditing ? '제목' : '다음주 월요일 12시 PT, 내일 21시 미팅...'}
              autoFocus
              required
              className="w-full rounded-xl px-4 py-3 placeholder:text-muted focus:outline-none text-sm"
              style={{
                color: 'var(--color-text)',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            />
            {parsed && scheduledAt && (
              <p className="text-blue-400 text-xs mt-1.5 px-1">
                {new Date(scheduledAt).toLocaleString('ko-KR', {
                  month: 'long', day: 'numeric', weekday: 'short',
                  hour: '2-digit', minute: '2-digit',
                })} · {title}
              </p>
            )}
          </div>

          {/* 우선순위 — Low / Medium / High */}
          <div>
            <p className="text-xs text-muted mb-2 px-0.5">Priority</p>
            <div className="flex gap-2">
              {PRIORITY_OPTIONS.map(({ val, label, color, activeBg, activeBorder }) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setPriority(val)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    priority === val ? color : 'text-muted'
                  }`}
                  style={{
                    background: priority === val ? activeBg : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${priority === val ? activeBorder : 'rgba(255,255,255,0.06)'}`,
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl text-sm font-semibold transition-colors"
            style={{
              background: 'rgba(59,130,246,0.15)',
              border: '1px solid rgba(59,130,246,0.3)',
              color: '#60A5FA',
            }}
          >
            {isEditing ? '수정' : '추가'}
          </button>
        </form>
      </div>
      <style>{`
        @keyframes mfFadeIn { from{opacity:0} to{opacity:1} }
        @keyframes mfExpandUp { from{opacity:0;transform:scale(0.88) translateY(20px)} to{opacity:1;transform:scale(1) translateY(0)} }
      `}</style>
    </div>
    </Portal>
  )
}
