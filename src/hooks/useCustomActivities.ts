import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export interface CustomActivity {
  id: string
  user_id: string
  name: string
  color: string
  created_at: string
}

// 기본 4색 제외한 겹치지 않는 색상 풀
const COLOR_POOL = [
  '#06B6D4', // cyan
  '#EC4899', // pink
  '#8B5CF6', // violet
  '#14B8A6', // teal
  '#F43F5E', // rose
  '#0EA5E9', // sky
  '#D946EF', // fuchsia
  '#84CC16', // lime
  '#F97316', // orange
  '#6366F1', // indigo
]

export function useCustomActivities() {
  const [customs, setCustoms] = useState<CustomActivity[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    const { data } = await supabase
      .from('custom_activities')
      .select('*')
      .order('created_at', { ascending: true })
    if (data) setCustoms(data)
    setLoading(false)
  }, [])

  useEffect(() => { fetch() }, [fetch])

  function getNextColor() {
    const used = new Set(customs.map(c => c.color))
    return COLOR_POOL.find(c => !used.has(c)) ?? COLOR_POOL[customs.length % COLOR_POOL.length]
  }

  async function addCustom(name: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    const color = getNextColor()
    const { data, error } = await supabase
      .from('custom_activities')
      .insert({ name, color, user_id: user.id })
      .select()
      .single()
    if (!error && data) setCustoms(prev => [...prev, data])
    return data
  }

  async function deleteCustom(id: string) {
    await supabase.from('custom_activities').delete().eq('id', id)
    setCustoms(prev => prev.filter(c => c.id !== id))
  }

  return { customs, loading, addCustom, deleteCustom, getNextColor }
}
