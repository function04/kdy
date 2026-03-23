import type { Activity } from '@/types/activity'
import { ACTIVITY_CONFIG } from '@/lib/constants'
import { formatTime, formatDuration } from '@/lib/utils'
import { Trash2, Coffee } from 'lucide-react'

interface ActivityLogProps {
  activities: Activity[]
  onDelete: (id: string) => void
}

// 활동 사이 휴식 시간 계산 (분)
function getRestMinutes(prev: Activity, next: Activity): number {
  // 기상/취침은 시점 기록이라 휴식 계산 제외
  if (!prev.ended_at || next.type === 'wake' || next.type === 'sleep') return 0
  if (prev.type === 'wake' || prev.type === 'sleep') return 0

  const gap = (new Date(next.started_at).getTime() - new Date(prev.ended_at).getTime()) / 1000 / 60
  return gap >= 1 ? Math.floor(gap) : 0
}

export function ActivityLog({ activities, onDelete }: ActivityLogProps) {
  if (activities.length === 0) {
    return (
      <div className="bg-card border border-border rounded-2xl p-6 text-center">
        <p className="text-muted text-sm">오늘 기록된 활동이 없습니다</p>
      </div>
    )
  }

  // 시간 오름차순 정렬 (오래된 것 → 최신)
  const sorted = [...activities].sort(
    (a, b) => new Date(a.started_at).getTime() - new Date(b.started_at).getTime()
  )

  // 활동 + 휴식 아이템 목록 생성
  type LogItem =
    | { kind: 'activity'; data: Activity }
    | { kind: 'rest'; minutes: number; key: string }

  const items: LogItem[] = []
  for (let i = 0; i < sorted.length; i++) {
    items.push({ kind: 'activity', data: sorted[i] })
    if (i < sorted.length - 1) {
      const rest = getRestMinutes(sorted[i], sorted[i + 1])
      if (rest > 0) {
        items.push({ kind: 'rest', minutes: rest, key: `rest-${i}` })
      }
    }
  }

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      {items.map((item, i) => {
        if (item.kind === 'rest') {
          return (
            <div
              key={item.key}
              className={`flex items-center gap-3 px-4 py-2.5 ${i !== 0 ? 'border-t border-border' : ''} bg-slate-800/40`}
            >
              <Coffee size={14} className="text-muted flex-shrink-0" />
              <span className="text-muted text-xs">휴식 {formatDuration(item.minutes)}</span>
            </div>
          )
        }

        const activity = item.data
        const config = ACTIVITY_CONFIG[activity.type]
        const isInstant = activity.type === 'wake' || activity.type === 'sleep'
        const isOngoing = activity.ended_at === null

        return (
          <div
            key={activity.id}
            className={`flex items-center gap-3 px-4 py-3 ${i !== 0 ? 'border-t border-border' : ''}`}
          >
            <div
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: config.color }}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-slate-100 text-sm font-medium">
                  {config.icon} {config.label}
                </span>
                {isOngoing && (
                  <span
                    className="text-xs px-1.5 py-0.5 rounded-full"
                    style={{ backgroundColor: `${config.color}20`, color: config.color }}
                  >
                    진행 중
                  </span>
                )}
              </div>
              <p className="text-muted text-xs mt-0.5">
                {isInstant
                  ? formatTime(activity.started_at)
                  : isOngoing
                  ? `${formatTime(activity.started_at)} ~`
                  : `${formatTime(activity.started_at)} ~ ${formatTime(activity.ended_at!)} · ${formatDuration(activity.duration_minutes!)}`}
              </p>
            </div>
            <button
              onClick={() => onDelete(activity.id)}
              className="text-muted hover:text-red-400 transition-colors p-1"
            >
              <Trash2 size={15} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
