import { useState } from 'react'
import type { Memo } from '@/types/memo'
import { X } from 'lucide-react'
import { Portal } from '@/lib/portal'

// 우선순위별 고정 색상
const PRIORITY_COLORS: Record<0 | 1 | 2, string> = {
  0: '#3B82F6', // 보통 - 파랑
  1: '#EAB308', // 중요 - 노랑
  2: '#EF4444', // 긴급 - 빨강
}

interface MemoFormProps {
  initial?: Partial<Memo>
  onSubmit: (data: Omit<Memo, 'id' | 'user_id' | 'created_at'>) => void
  onClose: () => void
}

const DAY_NAMES: Record<string, number> = {
  '일': 0, '월': 1, '화': 2, '수': 3, '목': 4, '금': 5, '토': 6,
}

function toDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function parseTime(remaining: string): { hour: string; minute: string; rest: string } {
  const timeMatch = remaining.match(/^(오전|오후)?\s*(\d{1,2})시(\s*(\d{1,2})분)?/)
  if (!timeMatch) return { hour: '09', minute: '00', rest: remaining }
  let h = parseInt(timeMatch[2])
  const ampm = timeMatch[1]
  if (ampm === '오후' && h < 12) h += 12
  if (ampm === '오전' && h === 12) h = 0
  return {
    hour: String(h).padStart(2, '0'),
    minute: timeMatch[4] ? String(timeMatch[4]).padStart(2, '0') : '00',
    rest: remaining.replace(timeMatch[0], '').trim(),
  }
}

function parseNaturalInput(input: string): { title: string; scheduledAt: string } {
  const now = new Date()
  let scheduledAt = ''
  let remaining = input.trim()
  let baseDate: Date | null = null

  if (/^내일/.test(remaining)) {
    baseDate = new Date(now)
    baseDate.setDate(baseDate.getDate() + 1)
    remaining = remaining.replace(/^내일\s*/, '')
  } else if (/^모레/.test(remaining)) {
    baseDate = new Date(now)
    baseDate.setDate(baseDate.getDate() + 2)
    remaining = remaining.replace(/^모레\s*/, '')
  } else if (/^다음주?\s*[월화수목금토일]요일?/.test(remaining)) {
    const m = remaining.match(/^다음주?\s*([월화수목금토일])요일?/)!
    const targetDay = DAY_NAMES[m[1]]
    baseDate = new Date(now)
    const currentDay = baseDate.getDay()
    let diff = targetDay - currentDay + 7
    if (diff <= 7) diff += 7
    baseDate.setDate(baseDate.getDate() + diff)
    remaining = remaining.replace(m[0], '').trim()
  } else if (/^(이번\s*주\s*)?[월화수목금토일]요일?/.test(remaining)) {
    const m = remaining.match(/^(이번\s*주\s*)?([월화수목금토일])요일?/)!
    const targetDay = DAY_NAMES[m[2]]
    baseDate = new Date(now)
    const currentDay = baseDate.getDay()
    let diff = targetDay - currentDay
    if (diff <= 0) diff += 7
    baseDate.setDate(baseDate.getDate() + diff)
    remaining = remaining.replace(m[0], '').trim()
  } else {
    const dateMatch = remaining.match(/^(\d{1,2})월\s*(\d{1,2})일/)
    if (dateMatch) {
      const year = now.getFullYear()
      baseDate = new Date(year, parseInt(dateMatch[1]) - 1, parseInt(dateMatch[2]))
      remaining = remaining.replace(dateMatch[0], '').trim()
    }
  }

  if (baseDate) {
    const { hour, minute, rest } = parseTime(remaining)
    scheduledAt = `${toDateStr(baseDate)}T${hour}:${minute}`
    remaining = rest
  }

  return { title: remaining || input.trim(), scheduledAt }
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
      if (result.scheduledAt) {
        setScheduledAt(result.scheduledAt)
        setParsed(true)
      } else {
        setParsed(false)
      }
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
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', animation: 'wFadeIn 0.18s ease forwards' }}
      onClick={onClose}
    >
      <div
        className="w-full rounded-3xl p-5"
        style={{
          maxWidth: 'calc(100vw - 32px)',
          marginTop: 'auto',
          marginBottom: 'calc(max(24px, env(safe-area-inset-bottom)) + 80px)',
          background: 'rgba(var(--nav-bg), 0.85)',
          backdropFilter: 'blur(48px) saturate(200%)',
          WebkitBackdropFilter: 'blur(48px) saturate(200%)',
          border: '0.5px solid rgba(var(--nav-border), 0.25)',
          animation: 'wExpandUp 0.25s cubic-bezier(0.34,1.4,0.64,1) forwards',
          boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-slate-100 font-semibold">{isEditing ? '일정 수정' : '새 일정'}</h3>
          <button onClick={onClose} className="text-muted hover:text-slate-300">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* 자연어 입력 */}
          <div>
            <input
              type="text"
              value={isEditing ? title : rawInput}
              onChange={(e) => isEditing ? setTitle(e.target.value) : handleRawChange(e.target.value)}
              placeholder={isEditing ? '제목' : '내일 오후3시 치과, 3월27일 병원가기...'}
              autoFocus
              required
              className="w-full bg-background border border-blue-500/50 rounded-xl px-4 py-3 placeholder:text-muted focus:outline-none focus:border-blue-500"
              style={{ color: 'var(--color-text)' }}
            />
            {parsed && scheduledAt && (
              <p className="text-blue-400 text-xs mt-1 px-1">
                📅 {new Date(scheduledAt).toLocaleString('ko-KR', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })} · {title}
              </p>
            )}
          </div>

          {/* 우선순위 */}
          <div className="flex gap-2">
            {([['보통', 0], ['중요', 1], ['긴급', 2]] as const).map(([label, val]) => (
              <button
                key={val}
                type="button"
                onClick={() => setPriority(val)}
                className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors border ${
                  priority === val
                    ? val === 0 ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                    : val === 1 ? 'bg-yellow-500/20 border-yellow-500 text-yellow-400'
                    : 'bg-red-500/20 border-red-500 text-red-400'
                    : 'bg-transparent border-border text-muted'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            저장
          </button>
        </form>
      </div>
      <style>{`
        @keyframes wFadeIn { from{opacity:0} to{opacity:1} }
        @keyframes wExpandUp { from{opacity:0;transform:scale(0.88) translateY(20px)} to{opacity:1;transform:scale(1) translateY(0)} }
      `}</style>
    </div>
    </Portal>
  )
}
