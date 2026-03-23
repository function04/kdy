import type { Activity } from '@/types/activity'
import { formatDuration, formatTime } from '@/lib/utils'
import { ACTIVITY_CONFIG } from '@/lib/constants'

interface TodaySummaryProps {
  activities: Activity[]
}

export function TodaySummary({ activities }: TodaySummaryProps) {
  const wake = activities.find((a) => a.type === 'wake')
  const sleep = activities.find((a) => a.type === 'sleep')
  const studyMin = activities
    .filter((a) => a.type === 'study' && a.duration_minutes)
    .reduce((s, a) => s + (a.duration_minutes ?? 0), 0)
  const exerciseMin = activities
    .filter((a) => a.type === 'exercise' && a.duration_minutes)
    .reduce((s, a) => s + (a.duration_minutes ?? 0), 0)

  const items = [
    { type: 'wake' as const, value: wake ? formatTime(wake.started_at) : null, label: '기상' },
    { type: 'sleep' as const, value: sleep ? formatTime(sleep.started_at) : null, label: '취침' },
    { type: 'study' as const, value: studyMin > 0 ? formatDuration(studyMin) : null, label: '공부' },
    { type: 'exercise' as const, value: exerciseMin > 0 ? formatDuration(exerciseMin) : null, label: '운동' },
  ]

  const hasAny = items.some((i) => i.value !== null)
  if (!hasAny) return null

  return (
    <div className="bg-card border border-border rounded-2xl p-4">
      <h3 className="text-sm font-medium text-slate-300 mb-3">오늘 요약</h3>
      <div className="grid grid-cols-2 gap-3">
        {items.map(({ type, value, label }) => {
          const config = ACTIVITY_CONFIG[type]
          return (
            <div
              key={type}
              className="rounded-xl p-3"
              style={{ backgroundColor: `${config.color}12` }}
            >
              <p className="text-xs text-muted mb-1">{label}</p>
              <p className="text-slate-100 font-semibold text-sm">
                {value ?? <span className="text-muted font-normal">-</span>}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
