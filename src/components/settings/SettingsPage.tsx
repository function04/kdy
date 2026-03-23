import { useState } from 'react'
import { PageShell } from '@/components/layout/PageShell'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { KOREAN_CITIES } from '@/lib/constants'
import { LogOut, ChevronRight } from 'lucide-react'
import { AdminPage } from './AdminPage'

export function SettingsPage() {
  const { profile, signOut, refetchProfile } = useAuth()
  const [showAdmin, setShowAdmin] = useState(false)
  const [saving, setSaving] = useState(false)
  const [displayName, setDisplayName] = useState(profile?.display_name ?? '')
  const [selectedCity, setSelectedCity] = useState(profile?.weather_city ?? '인천')

  if (showAdmin) return <AdminPage onBack={() => setShowAdmin(false)} />

  async function saveProfile() {
    if (!profile) return
    setSaving(true)
    const city = KOREAN_CITIES.find((c) => c.name === selectedCity)
    await supabase.from('profiles').update({
      display_name: displayName || profile.username,
      weather_city: selectedCity,
      weather_lat: city?.lat ?? profile.weather_lat,
      weather_lon: city?.lon ?? profile.weather_lon,
    }).eq('id', profile.id)
    await refetchProfile?.()
    setSaving(false)
  }

  return (
    <PageShell>
      <div className="px-4 pt-4 pb-2">
        <h2 className="text-lg font-semibold text-slate-100">설정</h2>
      </div>

      <div className="px-4 space-y-4">
        {/* 프로필 */}
        <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
          <p className="text-sm font-medium text-slate-300">프로필</p>
          <div>
            <label className="text-xs text-muted block mb-1">아이디</label>
            <p className="text-slate-400 text-sm">{profile?.username}</p>
          </div>
          <div>
            <label className="text-xs text-muted block mb-1">표시 이름</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full bg-background border border-border rounded-xl px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* 날씨 지역 */}
        <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
          <p className="text-sm font-medium text-slate-300">날씨 지역</p>
          <div className="grid grid-cols-3 gap-2">
            {KOREAN_CITIES.map((city) => (
              <button
                key={city.name}
                onClick={() => setSelectedCity(city.name)}
                className={`py-2 rounded-xl text-sm font-medium transition-colors border ${
                  selectedCity === city.name
                    ? 'bg-blue-600 border-blue-500 text-white'
                    : 'bg-background border-border text-muted hover:text-slate-300'
                }`}
              >
                {city.name}
              </button>
            ))}
          </div>
        </div>

        {/* 저장 버튼 */}
        <button
          onClick={saveProfile}
          disabled={saving}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold py-3 rounded-2xl transition-colors"
        >
          {saving ? '저장 중...' : '저장'}
        </button>

        {/* Admin 탭 (admin만 표시) */}
        {profile?.role === 'admin' && (
          <button
            onClick={() => setShowAdmin(true)}
            className="w-full flex items-center justify-between bg-card border border-border px-4 py-3 rounded-2xl"
          >
            <span className="text-slate-100 text-sm font-medium">🛡️ 관리자 패널</span>
            <ChevronRight size={16} className="text-muted" />
          </button>
        )}

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
