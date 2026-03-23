import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Dday } from '@/types/dday'

async function getCurrentUserId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('로그인이 필요합니다')
  return user.id
}

export function useDdays() {
  const [ddays, setDdays] = useState<Dday[]>([])
  const [loading, setLoading] = useState(true)

  const fetchDdays = useCallback(async () => {
    const { data } = await supabase
      .from('ddays')
      .select('*')
      .order('date', { ascending: true })
    if (data) setDdays(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchDdays()
  }, [fetchDdays])

  async function createDday(dday: Omit<Dday, 'id' | 'user_id' | 'created_at'>) {
    const user_id = await getCurrentUserId()
    const { data, error } = await supabase.from('ddays').insert({ ...dday, user_id }).select().single()
    if (!error && data) setDdays((prev) => [...prev, data].sort((a, b) => a.date.localeCompare(b.date)))
    return { error }
  }

  async function updateDday(id: string, updates: Partial<Dday>) {
    const { data, error } = await supabase.from('ddays').update(updates).eq('id', id).select().single()
    if (!error && data) setDdays((prev) => prev.map((d) => d.id === id ? data : d))
    return { error }
  }

  async function deleteDday(id: string) {
    const { error } = await supabase.from('ddays').delete().eq('id', id)
    if (!error) setDdays((prev) => prev.filter((d) => d.id !== id))
    return { error }
  }

  return { ddays, loading, createDday, updateDday, deleteDday }
}
