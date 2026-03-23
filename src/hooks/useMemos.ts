import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Memo } from '@/types/memo'

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

  async function createMemo(memo: Omit<Memo, 'id' | 'user_id' | 'created_at'>) {
    const { data, error } = await supabase.from('memos').insert(memo).select().single()
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

  return { memos, loading, createMemo, updateMemo, deleteMemo, toggleComplete, refetch: fetchMemos }
}
