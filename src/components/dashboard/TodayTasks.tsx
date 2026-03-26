import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Memo } from '@/types/memo'
import { formatTime } from '@/lib/utils'
import { isToday, differenceInHours } from 'date-fns'
import { Play, CheckCircle, Clock } from 'lucide-react'

interface TodayTasksProps {
  memos: Memo[]
  onStart: (id: string) => void
  onComplete: (id: string) => void
}

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
    <span className="text-blue-400 font-mono text-xs font-bold tabular-nums">
      {elapsed}
    </span>
  )
}

export function TodayTasks({ memos, onStart, onComplete }: TodayTasksProps) {
  const navigate = useNavigate()
  const now = new Date()

  const todayMemos = memos.filter(m =>
    m.scheduled_at && isToday(new Date(m.scheduled_at)) && !m.is_completed
  ).sort((a, b) =>
    new Date(a.scheduled_at!).getTime() - new Date(b.scheduled_at!).getTime()
  )

  const activeMemo = memos.find(m => m.actual_start && !m.actual_end && !m.is_completed)

  // 표시할 카드: 진행중 + 다음 일정 (최대 2개)
  const displayCards: Memo[] = []
  if (activeMemo) displayCards.push(activeMemo)
  todayMemos.forEach(m => {
    if (displayCards.length >= 2) return
    if (m.id === activeMemo?.id) return
    displayCards.push(m)
  })

  if (displayCards.length === 0) return null

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-slate-300">Recent task</h3>
        <button onClick={() => navigate('/schedule')} className="text-xs text-muted hover:text-slate-300">
          See all
        </button>
      </div>

      <div className="space-y-2">
        {displayCards.map(memo => {
          const isActive = memo.actual_start && !memo.actual_end
          const scheduledTime = memo.scheduled_at ? formatTime(memo.scheduled_at) : ''
          const hoursUntil = memo.scheduled_at
            ? differenceInHours(new Date(memo.scheduled_at), now)
            : null

          return (
            <div
              key={memo.id}
              className="bg-card border border-border rounded-2xl p-4 relative overflow-hidden"
            >
              {isActive && (
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-500"
                  style={{ backgroundSize: '200% 100%', animation: 'taskShimmer 2s ease-in-out infinite' }}
                />
              )}

              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    {isActive ? (
                      <span className="flex items-center gap-1 text-[10px] font-medium text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400" style={{ animation: 'taskPulse 1.5s ease-in-out infinite' }} />
                        진행중
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium text-muted bg-white/5 px-2 py-0.5 rounded-full">
                        대기중
                      </span>
                    )}
                    {memo.priority > 0 && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                        memo.priority === 2 ? 'bg-red-500/10 text-red-400' : 'bg-orange-500/10 text-orange-400'
                      }`}>
                        {memo.priority === 2 ? '긴급' : '중요'}
                      </span>
                    )}
                  </div>

                  <p className="text-slate-100 font-semibold text-sm">{memo.title}</p>

                  <div className="flex items-center gap-2 mt-1.5">
                    <Clock size={11} className="text-muted" />
                    <span className="text-xs text-muted">{scheduledTime}</span>
                    {isActive && (
                      <>
                        <span className="text-muted">·</span>
                        <ElapsedTimer startTime={memo.actual_start!} />
                      </>
                    )}
                  </div>
                </div>

                <div className="flex-shrink-0">
                  {isActive ? (
                    <button
                      onClick={() => onComplete(memo.id)}
                      className="w-10 h-10 rounded-xl bg-green-500/15 border border-green-500/30 flex items-center justify-center active:scale-90 transition-transform"
                    >
                      <CheckCircle size={18} className="text-green-400" />
                    </button>
                  ) : (
                    <button
                      onClick={() => onStart(memo.id)}
                      className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center active:scale-90 transition-transform"
                    >
                      <Play size={16} className="text-blue-400 ml-0.5" />
                    </button>
                  )}
                </div>
              </div>

              {!isActive && hoursUntil !== null && hoursUntil > 0 && (
                <div className="mt-2 flex justify-end">
                  <span className="text-[10px] text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full">
                    {hoursUntil < 1 ? '곧 시작' : `${hoursUntil}시간 후`}
                  </span>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <style>{`
        @keyframes taskPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        @keyframes taskShimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  )
}
