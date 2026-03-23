import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { MobileNav } from '@/components/layout/MobileNav'
import { LoginPage } from '@/components/auth/LoginPage'
import { DashboardPage } from '@/components/dashboard/DashboardPage'
import { ActivityPage } from '@/components/activity/ActivityPage'
import { SchedulePage } from '@/components/schedule/SchedulePage'
import { AnalyticsPage } from '@/components/analytics/AnalyticsPage'
import { SettingsPage } from '@/components/settings/SettingsPage'

function AppRoutes() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted text-sm">로딩 중...</div>
      </div>
    )
  }

  if (!user) {
    return <LoginPage />
  }

  return (
    <>
      <Routes>
        <Route path="/"           element={<DashboardPage />} />
        <Route path="/activity"   element={<ActivityPage />} />
        <Route path="/schedule"   element={<SchedulePage />} />
        <Route path="/analytics"  element={<AnalyticsPage />} />
        <Route path="/settings"   element={<SettingsPage />} />
        <Route path="*"           element={<Navigate to="/" replace />} />
      </Routes>
      <MobileNav />
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}
