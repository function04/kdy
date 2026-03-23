import { PageShell } from '@/components/layout/PageShell'
import { Header } from '@/components/layout/Header'
import { WeatherWidget } from './WeatherWidget'
import { QuickActions } from './QuickActions'
import { TodaySummary } from './TodaySummary'
import { UpcomingMemos } from './UpcomingMemos'
import { useAuth } from '@/hooks/useAuth'
import { useActivities } from '@/hooks/useActivities'
import { useMemos } from '@/hooks/useMemos'

export function DashboardPage() {
  const { profile } = useAuth()
  const { activities } = useActivities()
  const { memos } = useMemos()

  const lat = profile?.weather_lat ?? 37.45
  const lon = profile?.weather_lon ?? 126.70
  const city = profile?.weather_city ?? '인천'

  return (
    <PageShell>
      <Header displayName={profile?.display_name ?? profile?.username} />
      <div className="px-4 py-2 space-y-3">
        <WeatherWidget lat={lat} lon={lon} city={city} />
        <QuickActions />
        <TodaySummary activities={activities} />
        <UpcomingMemos memos={memos} />
      </div>
    </PageShell>
  )
}
