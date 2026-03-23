import { useEffect, useState } from 'react'
import type { Activity } from '@/types/activity'
import { ACTIVITY_CONFIG } from '@/lib/constants'
import { formatTime } from '@/lib/utils'
import { Trash2 } from 'lucide-react'

interface ActivityLogProps {
  activities: Activity[]
  onDelete: (id: string) => void
}

function OngoingTimer({ startedAt }: { startedAt: string }) {
  const [elapsed, setElapsed] = useState(0)
  useEffect(() => {
    const update = () => setElapsed(Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000))
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [startedAt])

  const h = Math.floor(elapsed / 3600)
  const m = Math.floor((elapsed % 3600) / 60)
  const s = elapsed % 60
  if (h > 0) return <>{h}시간 {String(m).padStart(2,'0')}분 {String(s).padStart(2,'0')}초째</>
  if (m > 0) return <>{m}분 {String(s).padStart(2,'0')}초째</>
  return <>{s}초째</>
}

function fmtDuration(minutes: number | null) {
  if (!minutes) return ''
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h > 0 && m > 0) return ` · ${h}시간 ${m}분`
  if (h > 0) return ` · ${h}시간`
  return ` · ${m}분`
}

export function ActivityLog({ activities, onDelete }: ActivityLogProps) {
  if (activities.length === 0) {
    return (
      <div className="bg-card border border-border rounded-2xl p-6 text-center">
        <p className="text-muted text-sm">기록된 활동이 없습니다</p>
      </div>
    )
  }

  const sorted = [...activities].sort(
    (a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
  )

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      {sorted.map((activity, i) => {
        const config = ACTIVITY_CONFIG[activity.type]
        const isOngoing = activity.ended_at === null
        const isSleepWake = activity.type === 'wake' || activity.type === 'sleep'

        const statusLabel = isOngoing
          ? activity.type === 'wake' ? '기상중'
          : activity.type === 'sleep' ? '취침중'
          : activity.type === 'study' ? '공부중' : '운동중'
          : config.label

        return (
          <div
            key={activity.id}
            className={`flex items-center gap-3 px-4 py-3 ${i !== 0 ? 'border-t border-border' : ''}`}
          >
            {/* 활동 색상 점 */}
            <div
              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: config.color }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-slate-100 text-sm font-medium">{statusLabel}</p>
              <p className="text-muted text-xs mt-0.5">
                {isOngoing ? (
                  <>{formatTime(activity.started_at)} ~ <OngoingTimer startedAt={activity.started_at} /></>
                ) : isSleepWake ? (
                  `${formatTime(activity.started_at)} ~ ${formatTime(activity.ended_at!)}`
                ) : (
                  `${formatTime(activity.started_at)} ~ ${formatTime(activity.ended_at!)}${fmtDuration(activity.duration_minutes)}`
                )}
              </p>
            </div>
            <button
              onClick={() => {
                if (confirm(`"${statusLabel}" 기록을 삭제할까요?`)) onDelete(activity.id)
              }}
              className="text-muted/40 active:text-red-400 transition-colors p-1.5 rounded-lg active:bg-red-500/10"
            >
              <Trash2 size={13} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
