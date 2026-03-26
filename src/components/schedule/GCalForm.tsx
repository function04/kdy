import { useState } from 'react'
import { X } from 'lucide-react'
import { Portal } from '@/lib/portal'

interface GCalFormProps {
  onSubmit: (summary: string, startDateTime: string, endDateTime?: string) => void
  onClose: () => void
}

const DAY_NAMES: Record<string, number> = {
  '일': 0, '월': 1, '화': 2, '수': 3, '목': 4, '금': 5, '토': 6,
}

function parseNaturalDate(input: string): { title: string; start: string; end: string } {
  const now = new Date()
  let remaining = input.trim()
  let baseDate: Date | null = null

  // 날짜 파싱
  if (/^내일/.test(remaining)) {
    baseDate = new Date(now)
    baseDate.setDate(baseDate.getDate() + 1)
    remaining = remaining.replace(/^내일\s*/, '')
  } else if (/^모레/.test(remaining)) {
    baseDate = new Date(now)
    baseDate.setDate(baseDate.getDate() + 2)
    remaining = remaining.replace(/^모레\s*/, '')
  } else if (/^다음\s*주\s*([월화수목금토일])요?일?/.test(remaining)) {
    const m = remaining.match(/^다음\s*주\s*([월화수목금토일])요?일?/)!
    const targetDay = DAY_NAMES[m[1]]
    baseDate = new Date(now)
    const diff = ((targetDay - baseDate.getDay()) + 7) % 7 + 7
    baseDate.setDate(baseDate.getDate() + diff)
    remaining = remaining.replace(m[0], '').trim()
  } else if (/^(이번\s*주\s*)?([월화수목금토일])요?일?/.test(remaining)) {
    const m = remaining.match(/^(이번\s*주\s*)?([월화수목금토일])요?일?/)!
    const targetDay = DAY_NAMES[m[2]]
    baseDate = new Date(now)
    let diff = targetDay - baseDate.getDay()
    if (diff <= 0) diff += 7
    baseDate.setDate(baseDate.getDate() + diff)
    remaining = remaining.replace(m[0], '').trim()
  } else if (/^(\d{1,2})월\s*(\d{1,2})일/.test(remaining)) {
    const m = remaining.match(/^(\d{1,2})월\s*(\d{1,2})일/)!
    baseDate = new Date(now.getFullYear(), parseInt(m[1]) - 1, parseInt(m[2]))
    if (baseDate < now) baseDate.setFullYear(baseDate.getFullYear() + 1)
    remaining = remaining.replace(m[0], '').trim()
  } else if (/^오늘/.test(remaining)) {
    baseDate = new Date(now)
    remaining = remaining.replace(/^오늘\s*/, '')
  }

  if (!baseDate) baseDate = new Date(now)

  // 시간 파싱
  let hour = 9, minute = 0
  const timeMatch = remaining.match(/(오전|오후)?\s*(\d{1,2})\s*시\s*(\d{1,2}\s*분)?/)
  if (timeMatch) {
    hour = parseInt(timeMatch[2])
    if (timeMatch[1] === '오후' && hour < 12) hour += 12
    if (timeMatch[1] === '오전' && hour === 12) hour = 0
    if (timeMatch[3]) minute = parseInt(timeMatch[3])
    remaining = remaining.replace(timeMatch[0], '').trim()
  } else {
    const shortTime = remaining.match(/(\d{1,2}):(\d{2})/)
    if (shortTime) {
      hour = parseInt(shortTime[1])
      minute = parseInt(shortTime[2])
      remaining = remaining.replace(shortTime[0], '').trim()
    }
  }

  baseDate.setHours(hour, minute, 0, 0)
  const endDate = new Date(baseDate.getTime() + 60 * 60 * 1000)

  return {
    title: remaining || input.trim(),
    start: baseDate.toISOString(),
    end: endDate.toISOString(),
  }
}

export function GCalForm({ onSubmit, onClose }: GCalFormProps) {
  const [rawInput, setRawInput] = useState('')
  const [parsed, setParsed] = useState<{ title: string; start: string; end: string } | null>(null)

  function handleChange(value: string) {
    setRawInput(value)
    if (value.trim()) {
      setParsed(parseNaturalDate(value))
    } else {
      setParsed(null)
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!parsed || !parsed.title.trim()) return
    onSubmit(parsed.title, parsed.start, parsed.end)
  }

  return (
    <Portal>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center"
        style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', animation: 'gcFadeIn 0.18s ease forwards' }}
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
            animation: 'gcExpandUp 0.25s cubic-bezier(0.34,1.4,0.64,1) forwards',
            boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-100 font-semibold">Google Calendar 일정 추가</h3>
            <button onClick={onClose} className="text-muted hover:text-slate-300">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="text"
              value={rawInput}
              onChange={(e) => handleChange(e.target.value)}
              placeholder="내일 오후3시 치과, 다음주 화요일 미팅..."
              autoFocus
              required
              className="w-full bg-background border border-blue-500/50 rounded-xl px-4 py-3 placeholder:text-muted focus:outline-none focus:border-blue-500"
              style={{ color: 'var(--color-text)' }}
            />
            {parsed && parsed.title && (
              <div className="bg-blue-500/10 rounded-xl px-3 py-2 border border-blue-500/20">
                <p className="text-blue-400 text-xs">
                  {new Date(parsed.start).toLocaleString('ko-KR', {
                    month: 'long', day: 'numeric', weekday: 'short',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </p>
                <p className="text-slate-200 text-sm mt-0.5">{parsed.title}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={!parsed?.title.trim()}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/30 disabled:text-white/30 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              Google Calendar에 추가
            </button>
          </form>
        </div>
        <style>{`
          @keyframes gcFadeIn { from{opacity:0} to{opacity:1} }
          @keyframes gcExpandUp { from{opacity:0;transform:scale(0.88) translateY(20px)} to{opacity:1;transform:scale(1) translateY(0)} }
        `}</style>
      </div>
    </Portal>
  )
}
