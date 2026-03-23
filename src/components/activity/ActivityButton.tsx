import { ACTIVITY_CONFIG } from '@/lib/constants'
import type { ActivityType } from '@/types/activity'
import { useAppStore } from '@/stores/appStore'

interface ActivityButtonProps {
  type: ActivityType
  onPress: () => void
  disabled?: boolean
}

export function ActivityButton({ type, onPress, disabled }: ActivityButtonProps) {
  const { activeActivityType } = useAppStore()
  const config = ACTIVITY_CONFIG[type]
  const isActive = activeActivityType === type
  const isOtherActive = activeActivityType !== null && activeActivityType !== type

  return (
    <button
      onClick={onPress}
      disabled={disabled || (isOtherActive && !isActive)}
      className="flex flex-col items-center justify-center rounded-2xl p-6 border-2 transition-all active:scale-95 disabled:opacity-40"
      style={{
        backgroundColor: isActive ? `${config.color}25` : `${config.color}10`,
        borderColor: isActive ? config.color : `${config.color}40`,
      }}
    >
      <span className="font-semibold text-slate-100 text-sm">{config.label}</span>
      {isActive && (
        <span className="text-xs mt-1" style={{ color: config.color }}>진행 중</span>
      )}
    </button>
  )
}
