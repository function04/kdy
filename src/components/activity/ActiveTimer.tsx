import { useEffect, useState } from 'react'
import { useAppStore } from '@/stores/appStore'
import { ACTIVITY_CONFIG } from '@/lib/constants'

interface ActiveTimerProps {
  onStop: (id: string) => void
  compact?: boolean
}

export function ActiveTimer({ onStop, compact }: ActiveTimerProps) {
  const { activeActivityId, activeActivityType, activeActivityStartedAt } = useAppStore()
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (!activeActivityStartedAt) return
    const update = () => {
      setElapsed(Math.floor((Date.now() - new Date(activeActivityStartedAt).getTime()) / 1000))
    }
    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [activeActivityStartedAt])

  if (!activeActivityId || !activeActivityType) return null

  const config = ACTIVITY_CONFIG[activeActivityType]
  const h = Math.floor(elapsed / 3600)
  const m = Math.floor((elapsed % 3600) / 60)
  const s = elapsed % 60

  const timeStr = h > 0
    ? `${h}시간 ${String(m).padStart(2, '0')}분 ${String(s).padStart(2, '0')}초`
    : m > 0
    ? `${m}분 ${String(s).padStart(2, '0')}초`
    : `${s}초`

  const label =
    activeActivityType === 'wake' ? '기상중' :
    activeActivityType === 'sleep' ? '취침중' :
    activeActivityType === 'study' ? '공부중' : '운동중'

  if (compact) {
    return (
      <div
        className="rounded-xl px-3 py-2 flex items-center justify-between"
        style={{ border: `1.5px solid ${config.color}60` }}
      >
        <div>
          <p className="text-[10px] font-medium" style={{ color: config.color }}>{label}</p>
          <p className="text-xs font-mono font-semibold text-slate-100">{timeStr}</p>
        </div>
        {(activeActivityType === 'study' || activeActivityType === 'exercise') && (
          <button
            onClick={() => onStop(activeActivityId)}
            className="text-[10px] px-2 py-1 rounded-lg font-medium"
            style={{ border: `1px solid ${config.color}80`, color: config.color }}
          >
            종료
          </button>
        )}
      </div>
    )
  }

  return (
    <div
      className="mx-4 rounded-2xl p-4 flex items-center justify-between"
      style={{ border: `1.5px solid ${config.color}60` }}
    >
      <div>
        <p className="text-xs mb-1 font-medium" style={{ color: config.color }}>{label}</p>
        <p className="text-2xl font-mono font-bold text-slate-100">
          {h > 0
            ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
            : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`}
        </p>
      </div>
      {(activeActivityType === 'study' || activeActivityType === 'exercise') && (
        <button
          onClick={() => onStop(activeActivityId)}
          className="px-4 py-2 rounded-xl font-medium text-sm"
          style={{ border: `1px solid ${config.color}80`, color: config.color }}
        >
          종료
        </button>
      )}
    </div>
  )
}
