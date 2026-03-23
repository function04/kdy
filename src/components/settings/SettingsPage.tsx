import { PageShell } from '@/components/layout/PageShell'
import { useAuth } from '@/hooks/useAuth'
import { LogOut } from 'lucide-react'

export function SettingsPage() {
  const { profile, signOut } = useAuth()

  return (
    <PageShell>
      <div className="px-4 py-4">
        <h2 className="text-lg font-semibold text-slate-100 mb-4">설정</h2>

        {/* 프로필 */}
        <div className="bg-card border border-border rounded-2xl p-4 mb-4">
          <p className="text-muted text-xs mb-1">로그인 아이디</p>
          <p className="text-slate-100 font-medium">{profile?.username}</p>
          {profile?.display_name && (
            <>
              <p className="text-muted text-xs mt-3 mb-1">표시 이름</p>
              <p className="text-slate-100">{profile.display_name}</p>
            </>
          )}
        </div>

        {/* Phase 6에서 날씨 지역 설정 추가 예정 */}
        <div className="bg-card border border-border rounded-2xl p-4 mb-4">
          <p className="text-muted text-xs mb-1">날씨 지역</p>
          <p className="text-slate-100">{profile?.weather_city ?? '인천'}</p>
          <p className="text-muted text-xs mt-1">({profile?.weather_lat}, {profile?.weather_lon})</p>
        </div>

        {/* 로그아웃 */}
        <button
          onClick={signOut}
          className="w-full flex items-center justify-center gap-2 bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 text-red-400 font-medium py-3 rounded-2xl transition-colors"
        >
          <LogOut size={18} />
          로그아웃
        </button>
      </div>
    </PageShell>
  )
}
