import { useNavigate } from 'react-router-dom'
import type { Memo } from '@/types/memo'
import { formatDate, formatTime } from '@/lib/utils'

interface UpcomingMemosProps {
  memos: Memo[]
}

export function UpcomingMemos({ memos }: UpcomingMemosProps) {
  const navigate = useNavigate()
  const now = new Date()

  const upcoming = memos
    .filter((m) => !m.is_completed && m.scheduled_at && new Date(m.scheduled_at) >= now)
    .slice(0, 3)

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
        {upcoming.map((memo) => (
          <div key={memo.id} className="flex items-center gap-3">
            <div className="w-1 h-8 rounded-full flex-shrink-0" style={{ backgroundColor: memo.color }} />
            <div className="flex-1 min-w-0">
              <p className="text-slate-100 text-sm truncate">{memo.title}</p>
              <p className="text-muted text-xs">
                {formatDate(memo.scheduled_at!)} {formatTime(memo.scheduled_at!)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
