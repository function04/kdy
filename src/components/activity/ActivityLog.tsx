import type { Activity } from '@/types/activity'
import { ACTIVITY_CONFIG } from '@/lib/constants'
import { formatTime, formatDuration } from '@/lib/utils'
import { Trash2 } from 'lucide-react'

interface ActivityLogProps {
  activities: Activity[]
  onDelete: (id: string) => void
}

export function ActivityLog({ activities, onDelete }: ActivityLogProps) {
  if (activities.length === 0) {
    return (
      <div className="bg-card border border-border rounded-2xl p-6 text-center">
        <p className="text-muted text-sm">오늘 기록된 활동이 없습니다</p>
      </div>
    )
  }

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      {activities.map((activity, i) => {
        const config = ACTIVITY_CONFIG[activity.type]
        const isInstant = activity.type === 'wake' || activity.type === 'sleep'
        const isOngoing = activity.ended_at === null

        return (
          <div
            key={activity.id}
            className={`flex items-center gap-3 px-4 py-3 ${i !== 0 ? 'border-t border-border' : ''}`}
          >
            {/* 색상 점 */}
            <div
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: config.color }}
            />

            {/* 정보 */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-slate-100 text-sm font-medium">{config.label}</span>
                {isOngoing && (
                  <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ backgroundColor: `${config.color}20`, color: config.color }}>
                    진행 중
                  </span>
                )}
              </div>
              <p className="text-muted text-xs mt-0.5">
                {isInstant
                  ? formatTime(activity.started_at)
                  : isOngoing
                  ? `${formatTime(activity.started_at)} ~`
                  : `${formatTime(activity.started_at)} ~ ${formatTime(activity.ended_at!)} · ${formatDuration(activity.duration_minutes!)}`
                }
              </p>
            </div>

            {/* 삭제 */}
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
