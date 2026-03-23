import { useNavigate } from 'react-router-dom'
import { useActivities } from '@/hooks/useActivities'
import { useAppStore } from '@/stores/appStore'
import { ACTIVITY_CONFIG } from '@/lib/constants'
import type { ActivityType } from '@/types/activity'

export function QuickActions() {
  const navigate = useNavigate()
  const { logInstant, startActivity, stopActivity } = useActivities()
  const { activeActivityId, activeActivityType } = useAppStore()

  async function handlePress(type: ActivityType) {
    if (type === 'wake' || type === 'sleep') {
      await logInstant(type)
    } else {
      if (activeActivityType === type && activeActivityId) {
        await stopActivity(activeActivityId)
      } else {
        await startActivity(type)
        navigate('/activity')
      }
    }
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-4">
      <h3 className="text-sm font-medium text-slate-300 mb-3">빠른 활동</h3>
      <div className="grid grid-cols-4 gap-2">
        {(['wake', 'sleep', 'study', 'exercise'] as ActivityType[]).map((type) => {
          const config = ACTIVITY_CONFIG[type]
          const isActive = activeActivityType === type
          return (
            <button
              key={type}
              onClick={() => handlePress(type)}
              className="flex flex-col items-center gap-1.5 py-3 rounded-xl transition-all active:scale-95 border"
              style={{
                backgroundColor: isActive ? `${config.color}25` : `${config.color}10`,
                borderColor: isActive ? config.color : `${config.color}30`,
              }}
            >
              <span className="text-xs text-slate-300">{config.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
