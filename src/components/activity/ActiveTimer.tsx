import { useEffect, useState } from 'react'
import { useAppStore } from '@/stores/appStore'
import { ACTIVITY_CONFIG } from '@/lib/constants'
import { Square } from 'lucide-react'

interface ActiveTimerProps {
  onStop: (id: string) => void
}

export function ActiveTimer({ onStop }: ActiveTimerProps) {
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
    ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`

  return (
    <div
      className="mx-4 rounded-2xl p-4 flex items-center justify-between border"
      style={{ backgroundColor: `${config.color}15`, borderColor: `${config.color}40` }}
    >
      <div>
        <p className="text-xs text-muted mb-1">{config.icon} {config.label} 진행 중</p>
        <p className="text-3xl font-mono font-bold" style={{ color: config.color }}>
          {timeStr}
        </p>
      </div>
      <button
        onClick={() => onStop(activeActivityId)}
        className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm text-white"
        style={{ backgroundColor: config.color }}
      >
        <Square size={14} fill="white" />
        종료
      </button>
    </div>
  )
}
