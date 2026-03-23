import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { MobileNav } from '@/components/layout/MobileNav'
import { LoginPage } from '@/components/auth/LoginPage'
import { DashboardPage } from '@/components/dashboard/DashboardPage'
import { ActivityPage } from '@/components/activity/ActivityPage'
import { SchedulePage } from '@/components/schedule/SchedulePage'
import { AnalyticsPage } from '@/components/analytics/AnalyticsPage'
import { SettingsPage } from '@/components/settings/SettingsPage'

function PendingPage({ onSignOut }: { onSignOut: () => void }) {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
      <div className="text-5xl mb-4">⏳</div>
      <h2 className="text-xl font-bold text-slate-100 mb-2">승인 대기 중</h2>
      <p className="text-muted text-sm mb-8">
        관리자가 계정을 승인하면 이용 가능합니다.
      </p>
      <button
        onClick={onSignOut}
        className="text-muted text-sm underline"
      >
        로그아웃
      </button>
    </div>
  )
}

function AppRoutes() {
  const { user, profile, loading, signOut } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted text-sm">로딩 중...</div>
      </div>
    )
  }

  if (!user) return <LoginPage />

  if (profile && !profile.is_approved) {
    return <PendingPage onSignOut={signOut} />
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
