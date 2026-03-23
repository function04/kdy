import { useState } from 'react'
import type { Memo } from '@/types/memo'
import { differenceInDays, differenceInHours, parseISO, isToday, isTomorrow } from 'date-fns'
import { Plus, Trash2, X } from 'lucide-react'
import { useDdays } from '@/hooks/useDdays'
import { formatDate, formatTime } from '@/lib/utils'
import { Portal } from '@/lib/portal'

function getDdayText(dateStr: string) {
  const target = parseISO(dateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  if (isToday(target)) return 'D-Day'
  const diff = differenceInDays(target, today)
  return diff > 0 ? `D-${diff}` : `D+${Math.abs(diff)}`
}

function getUpcomingLabel(scheduledAt: string) {
  const date = new Date(scheduledAt)
  const now = new Date()
  if (isToday(date)) {
    const hours = differenceInHours(date, now)
    if (hours <= 0) return { label: '지금', color: 'text-red-400' }
    return { label: `${hours}시간 후`, color: 'text-orange-400' }
  }
  if (isTomorrow(date)) return { label: 'D-1', color: 'text-yellow-400' }
  const days = differenceInDays(date, now)
  return { label: `D-${days}`, color: 'text-blue-400' }
}

interface DdayWidgetProps {
  memos: Memo[]
}

export function DdayWidget({ memos }: DdayWidgetProps) {
  const { ddays, createDday, updateDday, deleteDday } = useDdays()
  const [showSheet, setShowSheet] = useState(false)
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')

  const dday = ddays[0] ?? null
  const now = new Date()
  const upcoming = memos
    .filter((m) => !m.is_completed && m.scheduled_at && new Date(m.scheduled_at) >= now)
    .slice(0, 2)

  function openSheet() {
    if (dday) {
      setTitle(dday.title)
      setDate(dday.date)
    } else {
      setTitle('')
      setDate('')
    }
    setShowSheet(true)
  }

  async function handleSave() {
    if (!title.trim() || !date) return
    if (dday) {
      await updateDday(dday.id, { title: title.trim(), date, color: dday.color })
    } else {
      await createDday({ title: title.trim(), date, color: '#3B82F6' })
    }
    setShowSheet(false)
  }

  async function handleDelete() {
    if (dday) await deleteDday(dday.id)
    setShowSheet(false)
  }

  const ddayText = dday ? getDdayText(dday.date) : null
  const isPast = ddayText?.startsWith('D+')

  return (
    <>
      <div className="flex gap-3">
        {/* D-day 카드 */}
        {dday ? (
          <button
            onClick={openSheet}
            className="flex-shrink-0 rounded-2xl p-3 w-[90px] text-center border border-border bg-card transition-all active:scale-95"
          >
            <p className={`text-xl font-bold ${isPast ? 'text-muted' : 'text-white'}`}>
              {ddayText}
            </p>
            <p className="text-xs mt-1 truncate text-slate-300">{dday.title}</p>
            <p className="text-muted text-[10px] mt-0.5">{dday.date.slice(5).replace('-', '/')}</p>
          </button>
        ) : (
          <button
            onClick={openSheet}
            className="flex-shrink-0 rounded-2xl w-[90px] h-[90px] flex flex-col items-center justify-center gap-1 border border-dashed border-border bg-card active:scale-95 transition-all"
          >
            <Plus size={16} className="text-muted" />
            <p className="text-muted text-[10px]">D-day</p>
          </button>
        )}

        {/* 임박한 일정 */}
        {upcoming.length > 0 && (
          <div className="flex-1 min-w-0 space-y-2">
            {upcoming.map((memo) => {
              const dday = getUpcomingLabel(memo.scheduled_at!)
              return (
                <div key={memo.id} className="flex items-center gap-3">
                  <div className="w-1 h-10 rounded-full flex-shrink-0" style={{ backgroundColor: memo.color }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-100 text-sm truncate">{memo.title}</p>
                    <p className="text-muted text-xs">
                      {formatDate(memo.scheduled_at!)} {formatTime(memo.scheduled_at!)}
                    </p>
                  </div>
                  <span className={`text-xs font-bold flex-shrink-0 ${dday.color}`}>
                    {dday.label}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* D-day 설정 floating 카드 */}
      {showSheet && (
        <Portal>
          <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{
              background: 'rgba(0,0,0,0.55)',
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
              animation: 'wFadeIn 0.18s ease forwards',
            }}
            onClick={() => setShowSheet(false)}
          >
            <div
              className="w-full space-y-3"
              style={{
                maxWidth: 'calc(100vw - 32px)',
                marginTop: 'auto',
                marginBottom: 'calc(max(24px, env(safe-area-inset-bottom)) + 80px)',
                background: 'rgba(var(--nav-bg), 0.85)',
                backdropFilter: 'blur(48px) saturate(200%)',
                WebkitBackdropFilter: 'blur(48px) saturate(200%)',
                border: '0.5px solid rgba(var(--nav-border), 0.25)',
                borderRadius: 24,
                padding: 20,
                boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
                animation: 'wExpandUp 0.25s cubic-bezier(0.34,1.4,0.64,1) forwards',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-slate-100 font-semibold text-sm">D-day {dday ? '수정' : '설정'}</h3>
                <button onClick={() => setShowSheet(false)} className="text-muted">
                  <X size={18} />
                </button>
              </div>

              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="제목 (예: 수능, 여행, 졸업)"
                autoFocus
                className="w-full bg-background border border-border rounded-xl px-4 py-3 placeholder:text-muted focus:outline-none focus:border-blue-500 text-sm"
                style={{ color: 'var(--color-text)' }}
              />

              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-background border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 text-sm"
                style={{ color: 'var(--color-text)' }}
              />

              <button
                onClick={handleSave}
                disabled={!title.trim() || !date}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
              >
                저장
              </button>

              {dday && (
                <button
                  onClick={handleDelete}
                  className="w-full flex items-center justify-center gap-2 text-red-400 text-sm py-2"
                >
                  <Trash2 size={14} />
                  삭제
                </button>
              )}
            </div>
            <style>{`
              @keyframes wFadeIn { from{opacity:0} to{opacity:1} }
              @keyframes wExpandUp { from{opacity:0;transform:scale(0.88) translateY(20px)} to{opacity:1;transform:scale(1) translateY(0)} }
            `}</style>
          </div>
        </Portal>
      )}
    </>
  )
}
