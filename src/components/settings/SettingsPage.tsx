import { useState, useMemo, useEffect } from 'react'
import { PageShell } from '@/components/layout/PageShell'
import { useAuth } from '@/hooks/useAuth'
import { useTheme, type ThemeMode } from '@/contexts/ThemeContext'
import { supabase } from '@/lib/supabase'
import { KOREAN_CITIES } from '@/lib/constants'
import { LogOut, ChevronRight, Search, Check } from 'lucide-react'
import { AdminPage } from './AdminPage'

const THEME_OPTIONS: { value: ThemeMode; label: string; icon: string }[] = [
  { value: 'dark', label: '다크', icon: '🌙' },
  { value: 'light', label: '라이트', icon: '☀️' },
  { value: 'system', label: '시스템', icon: '⚙️' },
]

export function SettingsPage() {
  const { profile, signOut, refetchProfile } = useAuth()
  const { mode: themeMode, setMode: setThemeMode } = useTheme()
  const [showAdmin, setShowAdmin] = useState(false)
  const [saving, setSaving] = useState(false)
  const [displayName, setDisplayName] = useState(profile?.display_name ?? '')
  const [selectedCity, setSelectedCity] = useState(
    KOREAN_CITIES.find((c) => c.name === profile?.weather_city) ?? KOREAN_CITIES[0]
  )
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name ?? '')
      const city = KOREAN_CITIES.find((c) => c.name === profile.weather_city)
      if (city) setSelectedCity(city)
    }
  }, [profile])

  if (showAdmin) return <AdminPage onBack={() => setShowAdmin(false)} />

  const filtered = useMemo(() => {
    if (!search.trim()) return []
    return KOREAN_CITIES.filter((c) => c.name.includes(search.trim())).slice(0, 8)
  }, [search])

  async function saveProfile() {
    if (!profile) return
    setSaving(true)
    await supabase.from('profiles').update({
      display_name: displayName || profile.username,
      weather_city: selectedCity.name,
      weather_lat: selectedCity.lat,
      weather_lon: selectedCity.lon,
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
              className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              style={{ color: 'var(--color-text)' }}
            />
          </div>
        </div>

        {/* 날씨 지역 */}
        <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
          <p className="text-sm font-medium text-slate-300">날씨 지역</p>

          {/* 현재 선택 */}
          <div className="flex items-center gap-2 bg-blue-600/10 border border-blue-500/30 rounded-xl px-3 py-2">
            <Check size={14} className="text-blue-400 flex-shrink-0" />
            <span className="text-blue-300 text-sm font-medium">{selectedCity.name}</span>
          </div>

          {/* 검색창 */}
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="구/시 검색 (예: 연수구, 수원)"
              className="w-full bg-background border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm placeholder:text-muted focus:outline-none focus:border-blue-500"
              style={{ color: 'var(--color-text)' }}
            />
          </div>

          {/* 검색 결과 */}
          {filtered.length > 0 && (
            <div className="bg-background border border-border rounded-xl overflow-hidden">
              {filtered.map((city, i) => (
                <button
                  key={city.name}
                  onClick={() => { setSelectedCity(city); setSearch('') }}
                  className={`w-full flex items-center justify-between px-4 py-3 text-sm text-left transition-colors hover:bg-card ${
                    i !== 0 ? 'border-t border-border' : ''
                  } ${selectedCity.name === city.name ? 'text-blue-400' : 'text-slate-300'}`}
                >
                  <span>{city.name}</span>
                  {selectedCity.name === city.name && <Check size={14} className="text-blue-400" />}
                </button>
              ))}
            </div>
          )}

          {search.trim() && filtered.length === 0 && (
            <p className="text-muted text-xs text-center py-2">검색 결과가 없습니다</p>
          )}
        </div>

        {/* 테마 */}
        <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
          <p className="text-sm font-medium text-slate-300">테마</p>
          <div className="flex gap-2">
            {THEME_OPTIONS.map(({ value, label, icon }) => (
              <button
                key={value}
                onClick={() => setThemeMode(value)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-colors flex flex-col items-center gap-1 ${
                  themeMode === value
                    ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                    : 'bg-background border-border text-muted'
                }`}
              >
                <span className="text-base">{icon}</span>
                <span>{label}</span>
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

        {/* Admin 패널 */}
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
