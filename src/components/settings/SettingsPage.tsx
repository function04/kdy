import { useState, useEffect } from 'react'
import { PageShell } from '@/components/layout/PageShell'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { LogOut, Calendar, RefreshCw } from 'lucide-react'
import { useGCal } from '@/contexts/GoogleCalendarContext'
import { useMemos } from '@/hooks/useMemos'

export function SettingsPage() {
  const { profile, signOut, refetchProfile } = useAuth()
  const gcal = useGCal()
  const { memos } = useMemos()
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState('')
  const [saving, setSaving] = useState(false)
  const [displayName, setDisplayName] = useState(profile?.display_name ?? '')

  useEffect(() => {
    if (profile) setDisplayName(profile.display_name ?? '')
  }, [profile])

  async function syncAllToGCal() {
    if (!gcal.isSignedIn) return
    setSyncing(true)
    setSyncResult('')
    const pending = memos.filter(m => m.scheduled_at && !m.is_completed)
    let count = 0
    for (const memo of pending) {
      try { await gcal.createEvent(memo.title, memo.scheduled_at!); count++ } catch {}
    }
    setSyncing(false)
    setSyncResult(`${count} tasks synced`)
    setTimeout(() => setSyncResult(''), 3000)
  }

  async function saveProfile() {
    if (!profile) return
    setSaving(true)
    await supabase.from('profiles').update({
      display_name: displayName || profile.username,
    }).eq('id', profile.id)
    await refetchProfile?.()
    setSaving(false)
  }

  return (
    <PageShell>
      <div className="px-4 pt-4 pb-2">
        <h2 className="text-lg font-semibold text-[#EDEDEF]">Settings</h2>
      </div>

      <div className="px-4 space-y-4 pb-24">
        {/* Profile - iOS Grouped List 스타일 */}
        <div>
          <p className="text-[13px] font-medium text-[#A0A0A8] px-1 mb-2">Profile</p>
          <div style={{ background: '#141416', borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
            {/* Username */}
            <div className="px-4 py-3.5">
              <label className="text-[12px] text-[#5C5C66] block mb-1">Username</label>
              <p className="text-[#A0A0A8] text-[14px]">{profile?.username}</p>
            </div>
            <div className="ml-4" style={{ height: '0.5px', background: 'rgba(255,255,255,0.06)' }} />
            {/* Display Name */}
            <div className="px-4 py-3.5">
              <label className="text-[12px] text-[#5C5C66] block mb-1.5">Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full rounded-xl px-3 py-2.5 text-[14px] focus:outline-none"
                style={{ color: '#EDEDEF', background: '#0A0A0B', border: '1px solid rgba(255,255,255,0.08)' }}
              />
            </div>
            <div className="ml-4" style={{ height: '0.5px', background: 'rgba(255,255,255,0.06)' }} />
            {/* Save */}
            <button
              onClick={saveProfile}
              disabled={saving}
              className="w-full py-3 text-[14px] font-medium transition-colors disabled:opacity-40 pressable"
              style={{ color: '#5B8DEF' }}
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>

        {/* Google Calendar - iOS Grouped List 스타일 */}
        <div>
          <p className="text-[13px] font-medium text-[#A0A0A8] px-1 mb-2">Google Calendar</p>
          <div style={{ background: '#141416', borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
            {gcal.isSignedIn ? (
              <>
                <div className="px-4 py-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#4ADE80]" />
                    <span className="text-[#4ADE80] text-[14px]">Connected</span>
                  </div>
                  <button onClick={() => gcal.signOut()} className="text-[12px] text-[#5C5C66] active:text-[#F87171] transition-colors">
                    Disconnect
                  </button>
                </div>
                <div className="ml-4" style={{ height: '0.5px', background: 'rgba(255,255,255,0.06)' }} />
                <button
                  onClick={syncAllToGCal}
                  disabled={syncing}
                  className="w-full flex items-center justify-center gap-2 py-3 text-[14px] font-medium text-[#A0A0A8] disabled:opacity-50 pressable"
                >
                  <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
                  {syncing ? 'Syncing...' : 'Sync existing tasks'}
                </button>
                {syncResult && <p className="text-[#4ADE80] text-[12px] text-center pb-3">{syncResult}</p>}
              </>
            ) : (
              <button
                onClick={() => gcal.signIn()}
                disabled={!gcal.ready}
                className="w-full flex items-center justify-center gap-2 py-3.5 text-[14px] font-medium disabled:opacity-40 pressable"
                style={{ color: '#5B8DEF' }}
              >
                <Calendar size={16} />
                Connect Google Account
              </button>
            )}
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={signOut}
          className="w-full flex items-center justify-center gap-2 py-3.5 font-medium text-[14px] pressable"
          style={{
            background: 'rgba(248,113,113,0.08)',
            border: '1px solid rgba(248,113,113,0.15)',
            borderRadius: 16,
            color: '#F87171',
          }}
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </PageShell>
  )
}
