import { PageShell } from '@/components/layout/PageShell'
import { ActivityLog } from './ActivityLog'
import { useActivities } from '@/hooks/useActivities'
import { useAppStore } from '@/stores/appStore'
import { ActiveTimer } from './ActiveTimer'

export function ActivityPage() {
  const { activities, loading, stopActivity, deleteActivity } = useActivities()
  const { activeActivityId } = useAppStore()

  return (
    <PageShell>
      <div className="px-4 pt-4 pb-2">
        <h2 className="text-lg font-semibold text-slate-100">최근 활동</h2>
      </div>

      {activeActivityId && (
        <div className="px-4 mt-1 mb-3">
          <ActiveTimer onStop={stopActivity} />
        </div>
      )}

      <div className="px-4 mt-2">
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
