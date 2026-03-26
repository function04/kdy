import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Memo } from '@/types/memo'

async function getCurrentUserId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('로그인이 필요합니다')
  return user.id
}

export function useMemos() {
  const [memos, setMemos] = useState<Memo[]>([])
  const [loading, setLoading] = useState(true)

  const fetchMemos = useCallback(async () => {
    const { data } = await supabase
      .from('memos')
      .select('*')
      .order('scheduled_at', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false })
    if (data) setMemos(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchMemos()
  }, [fetchMemos])

  async function createMemo(memo: Omit<Memo, 'id' | 'user_id' | 'created_at' | 'actual_start' | 'actual_end' | 'duration_minutes'>) {
    const user_id = await getCurrentUserId()
    const { data, error } = await supabase.from('memos').insert({ ...memo, user_id }).select().single()
    if (!error && data) setMemos((prev) => [data, ...prev])
    return { error }
  }

  async function updateMemo(id: string, updates: Partial<Memo>) {
    const { data, error } = await supabase.from('memos').update(updates).eq('id', id).select().single()
    if (!error && data) setMemos((prev) => prev.map((m) => (m.id === id ? data : m)))
    return { error }
  }

  async function deleteMemo(id: string) {
    const { error } = await supabase.from('memos').delete().eq('id', id)
    if (!error) setMemos((prev) => prev.filter((m) => m.id !== id))
    return { error }
  }

  async function toggleComplete(id: string, current: boolean) {
    return updateMemo(id, { is_completed: !current })
  }

  // 일정 시작 — actual_start 기록
  async function startMemo(id: string) {
    return updateMemo(id, { actual_start: new Date().toISOString() })
  }

  // 일정 완료 — actual_end + duration 계산 + is_completed
  async function completeMemo(id: string) {
    const memo = memos.find(m => m.id === id)
    if (!memo) return { error: new Error('not found') }

    const now = new Date()
    const start = memo.actual_start ? new Date(memo.actual_start) : now
    const duration = Math.round((now.getTime() - start.getTime()) / 60000)

    return updateMemo(id, {
      actual_end: now.toISOString(),
      duration_minutes: duration,
      is_completed: true,
    })
  }

  return { memos, loading, createMemo, updateMemo, deleteMemo, toggleComplete, startMemo, completeMemo, refetch: fetchMemos }
}
