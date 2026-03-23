import { useState } from 'react'
import { PageShell } from '@/components/layout/PageShell'
import { Header } from '@/components/layout/Header'
import { WeatherWidget } from './WeatherWidget'
import { TodaySummary } from './TodaySummary'
import { DdayWidget } from './DdayWidget'
import { DdayPage } from '@/components/dday/DdayPage'
import { useAuth } from '@/hooks/useAuth'
import { useActivities } from '@/hooks/useActivities'
import { useMemos } from '@/hooks/useMemos'

export function DashboardPage() {
  const { profile } = useAuth()
  const { activities } = useActivities()
  const { memos } = useMemos()
  const [showDday, setShowDday] = useState(false)

  if (showDday) return <DdayPage onBack={() => setShowDday(false)} />

  const lat = profile?.weather_lat
  const lon = profile?.weather_lon
  const city = profile?.weather_city ?? '인천'

  return (
    <PageShell>
      <Header displayName={profile?.display_name ?? profile?.username} />
      <div className="px-4 py-2 space-y-3">
        {lat && lon && <WeatherWidget lat={lat} lon={lon} city={city} />}
        <DdayWidget memos={memos} />
        <TodaySummary activities={activities} />
      </div>
    </PageShell>
  )
}
