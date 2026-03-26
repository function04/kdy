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
        <h2 className="text-lg font-semibold text-slate-100">Settings</h2>
      </div>

      <div className="px-4 space-y-4 pb-24">
        {/* Profile */}
        <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
          <p className="text-sm font-medium text-slate-300">Profile</p>
          <div>
            <label className="text-xs text-muted block mb-1">Username</label>
            <p className="text-slate-400 text-sm">{profile?.username}</p>
          </div>
          <div>
            <label className="text-xs text-muted block mb-1">Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              style={{ color: 'var(--color-text)' }}
            />
          </div>
          <button
            onClick={saveProfile}
            disabled={saving}
            className="w-full py-2.5 rounded-xl text-sm font-medium transition-colors"
            style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', color: '#60A5FA' }}
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>

        {/* Google Calendar */}
        <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
          <p className="text-sm font-medium text-slate-300">Google Calendar</p>
          {gcal.isSignedIn ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400" />
                <span className="text-green-400 text-sm">Connected</span>
              </div>
              <button onClick={() => gcal.signOut()} className="text-xs text-muted hover:text-red-400 transition-colors">
                Disconnect
              </button>
            </div>
          ) : (
            <button
              onClick={() => gcal.signIn()}
              disabled={!gcal.ready}
              className="w-full flex items-center justify-center gap-2 text-sm font-medium py-2.5 rounded-xl transition-colors"
              style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', color: '#60A5FA' }}
            >
              <Calendar size={16} />
              Connect Google Account
            </button>
          )}
          {gcal.isSignedIn && (
            <button
              onClick={syncAllToGCal}
              disabled={syncing}
              className="w-full flex items-center justify-center gap-2 bg-white/5 border border-border text-slate-300 text-sm font-medium py-2.5 rounded-xl transition-colors hover:bg-white/10 disabled:opacity-50"
            >
              <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
              {syncing ? 'Syncing...' : 'Sync existing tasks'}
            </button>
          )}
          {syncResult && <p className="text-green-400 text-xs text-center">{syncResult}</p>}
        </div>

        {/* Logout */}
        <button
          onClick={signOut}
          className="w-full flex items-center justify-center gap-2 bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 text-red-400 font-medium py-3 rounded-2xl transition-colors"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </PageShell>
  )
}
