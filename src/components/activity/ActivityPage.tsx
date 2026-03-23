import { PageShell } from '@/components/layout/PageShell'
import { ActivityButton } from './ActivityButton'
import { ActiveTimer } from './ActiveTimer'
import { ActivityLog } from './ActivityLog'
import { useActivities } from '@/hooks/useActivities'
import { useAppStore } from '@/stores/appStore'
import type { ActivityType } from '@/types/activity'

export function ActivityPage() {
  const { activities, loading, logInstant, startActivity, stopActivity, deleteActivity } = useActivities()
  const { activeActivityId, activeActivityType } = useAppStore()

  async function handlePress(type: ActivityType) {
    if (type === 'wake' || type === 'sleep') {
      await logInstant(type)
    } else {
      if (activeActivityType === type && activeActivityId) {
        await stopActivity(activeActivityId)
      } else {
        await startActivity(type)
      }
    }
  }

  return (
    <PageShell>
      <div className="px-4 pt-4 pb-2">
        <h2 className="text-lg font-semibold text-slate-100">활동 추적</h2>
        <p className="text-muted text-sm mt-0.5">오늘의 활동을 기록하세요</p>
      </div>

      {/* 진행 중 타이머 */}
      {activeActivityId && (
        <div className="mt-2 mb-4">
          <ActiveTimer onStop={stopActivity} />
        </div>
      )}

      {/* 활동 버튼 2x2 */}
      <div className="px-4 grid grid-cols-2 gap-3 mt-4">
        {(['wake', 'sleep', 'study', 'exercise'] as ActivityType[]).map((type) => (
          <ActivityButton
            key={type}
            type={type}
            onPress={() => handlePress(type)}
          />
        ))}
      </div>

      {/* 오늘 활동 로그 */}
      <div className="px-4 mt-6">
        <h3 className="text-sm font-medium text-muted mb-2">오늘 기록</h3>
        {loading ? (
          <div className="bg-card border border-border rounded-2xl p-6 text-center">
            <p className="text-muted text-sm">불러오는 중...</p>
          </div>
        ) : (
          <ActivityLog activities={activities} onDelete={deleteActivity} />
        )}
      </div>
    </PageShell>
  )
}
