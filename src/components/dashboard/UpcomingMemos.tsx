import { useNavigate } from 'react-router-dom'
import type { Memo } from '@/types/memo'
import { formatDate, formatTime } from '@/lib/utils'
import { differenceInDays, differenceInHours, isToday, isTomorrow } from 'date-fns'

interface UpcomingMemosProps {
  memos: Memo[]
}

function getDdayLabel(scheduledAt: string) {
  const date = new Date(scheduledAt)
  const now = new Date()
  if (isToday(date)) {
    const hours = differenceInHours(date, now)
    if (hours <= 0) return { label: '지금', color: 'text-red-400' }
    return { label: `${hours}시간 후`, color: 'text-orange-400' }
  }
  if (isTomorrow(date)) return { label: 'D-1', color: 'text-yellow-400' }
  const days = differenceInDays(date, now)
  if (days <= 7) return { label: `D-${days}`, color: 'text-blue-400' }
  return { label: `D-${days}`, color: 'text-muted' }
}

export function UpcomingMemos({ memos }: UpcomingMemosProps) {
  const navigate = useNavigate()
  const now = new Date()
  const weekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  const upcoming = memos
    .filter((m) => !m.is_completed && m.scheduled_at && new Date(m.scheduled_at) >= now)
    .slice(0, 5)

  const thisWeek = upcoming.filter((m) => new Date(m.scheduled_at!) <= weekLater)
  const later = upcoming.filter((m) => new Date(m.scheduled_at!) > weekLater)

  if (upcoming.length === 0) return null

  return (
    <div className="bg-card border border-border rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-slate-300">다가오는 일정</h3>
        <button onClick={() => navigate('/schedule')} className="text-xs text-muted hover:text-slate-300">
          전체보기
        </button>
      </div>

      <div className="space-y-2">
        {thisWeek.map((memo) => {
          const dday = getDdayLabel(memo.scheduled_at!)
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

        {later.length > 0 && (
          <>
            <div className="border-t border-border pt-2 mt-2">
              <p className="text-muted text-xs mb-2">1주일 이후</p>
              {later.map((memo) => {
                const dday = getDdayLabel(memo.scheduled_at!)
                return (
                  <div key={memo.id} className="flex items-center gap-3 mb-2">
                    <div className="w-1 h-10 rounded-full flex-shrink-0" style={{ backgroundColor: memo.color }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-300 text-sm truncate">{memo.title}</p>
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
          </>
        )}
      </div>
    </div>
  )
}
