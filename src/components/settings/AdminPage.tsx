import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { PageShell } from '@/components/layout/PageShell'
import { ChevronLeft, Check, X } from 'lucide-react'
import { formatRelative } from '@/lib/utils'

interface UserProfile {
  id: string
  username: string
  display_name: string | null
  role: string
  is_approved: boolean
  created_at: string
}

interface AdminPageProps {
  onBack: () => void
}

export function AdminPage({ onBack }: AdminPageProps) {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'pending' | 'approved'>('pending')

  useEffect(() => {
    fetchUsers()
  }, [])

  async function fetchUsers() {
    const { data } = await supabase.rpc('get_all_profiles')
    if (data) setUsers(data)
    setLoading(false)
  }

  async function approve(id: string) {
    await supabase.from('profiles').update({ is_approved: true }).eq('id', id)
    setUsers((prev) => prev.map((u) => u.id === id ? { ...u, is_approved: true } : u))
  }

  async function reject(id: string) {
    await supabase.from('profiles').update({ is_approved: false }).eq('id', id)
    setUsers((prev) => prev.map((u) => u.id === id ? { ...u, is_approved: false } : u))
  }

  async function setAdmin(id: string, isAdmin: boolean) {
    await supabase.from('profiles').update({ role: isAdmin ? 'admin' : 'user' }).eq('id', id)
    setUsers((prev) => prev.map((u) => u.id === id ? { ...u, role: isAdmin ? 'admin' : 'user' } : u))
  }

  const pending = users.filter((u) => !u.is_approved)
  const approved = users.filter((u) => u.is_approved)
  const displayed = tab === 'pending' ? pending : approved

  return (
    <PageShell>
      <div className="px-4 pt-4 pb-2 flex items-center gap-3">
        <button onClick={onBack} className="text-muted hover:text-slate-300">
          <ChevronLeft size={22} />
        </button>
        <h2 className="text-lg font-semibold text-slate-100">관리자 패널</h2>
      </div>

      {/* 탭 */}
      <div className="flex bg-card mx-4 rounded-xl p-1 mb-4 border border-border">
        <button
          onClick={() => setTab('pending')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === 'pending' ? 'bg-blue-600 text-white' : 'text-muted'
          }`}
        >
          승인 대기 {pending.length > 0 && `(${pending.length})`}
        </button>
        <button
          onClick={() => setTab('approved')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === 'approved' ? 'bg-blue-600 text-white' : 'text-muted'
          }`}
        >
          승인된 사용자
        </button>
      </div>

      <div className="px-4 space-y-2">
        {loading ? (
          <p className="text-muted text-sm text-center py-8">불러오는 중...</p>
        ) : displayed.length === 0 ? (
          <p className="text-muted text-sm text-center py-8">
            {tab === 'pending' ? '승인 대기 중인 사용자가 없습니다' : '승인된 사용자가 없습니다'}
          </p>
        ) : (
          displayed.map((user) => (
            <div key={user.id} className="bg-card border border-border rounded-2xl p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-slate-100 font-medium text-sm">{user.display_name ?? user.username}</p>
                    {user.role === 'admin' && (
                      <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded-full">admin</span>
                    )}
                  </div>
                  <p className="text-muted text-xs">@{user.username}</p>
                  <p className="text-muted text-xs mt-1">{formatRelative(user.created_at)} 가입</p>
                </div>

                <div className="flex gap-2">
                  {!user.is_approved ? (
                    <button
                      onClick={() => approve(user.id)}
                      className="flex items-center gap-1 bg-green-500/20 border border-green-500/40 text-green-400 text-xs px-3 py-1.5 rounded-xl"
                    >
                      <Check size={13} />
                      승인
                    </button>
                  ) : (
                    <button
                      onClick={() => reject(user.id)}
                      className="flex items-center gap-1 bg-red-500/10 border border-red-500/30 text-red-400 text-xs px-3 py-1.5 rounded-xl"
                    >
                      <X size={13} />
                      취소
                    </button>
                  )}
                </div>
              </div>

              {user.is_approved && (
                <div className="mt-3 pt-3 border-t border-border">
                  <button
                    onClick={() => setAdmin(user.id, user.role !== 'admin')}
                    className={`text-xs px-3 py-1.5 rounded-xl border transition-colors ${
                      user.role === 'admin'
                        ? 'bg-blue-500/20 border-blue-500/40 text-blue-400'
                        : 'bg-transparent border-border text-muted hover:text-slate-300'
                    }`}
                  >
                    {user.role === 'admin' ? '🛡️ admin 해제' : 'admin 권한 부여'}
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </PageShell>
  )
}
