import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Activity } from '@/types/activity'
import { useAppStore } from '@/stores/appStore'

export function useActivities() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const { setActiveActivity, clearActiveActivity } = useAppStore()

  const fetchToday = useCallback(async () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const { data } = await supabase
      .from('activities')
      .select('*')
      .gte('started_at', today.toISOString())
      .order('started_at', { ascending: false })

    if (data) {
      setActivities(data)
      // 진행 중인 활동 복원 (study/exercise만)
      const ongoing = data.find(
        (a) => a.ended_at === null && (a.type === 'study' || a.type === 'exercise')
      )
      if (ongoing) {
        setActiveActivity(ongoing.id, ongoing.type, ongoing.started_at)
      } else {
        clearActiveActivity()
      }
    }
    setLoading(false)
  }, [setActiveActivity, clearActiveActivity])

  useEffect(() => {
    fetchToday()
  }, [fetchToday])

  // 기상/취침: 시점만 기록 (즉시 종료)
  async function logInstant(type: 'wake' | 'sleep') {
    const now = new Date().toISOString()
    const { data, error } = await supabase
      .from('activities')
      .insert({ type, started_at: now, ended_at: now })
      .select()
      .single()
    if (!error && data) setActivities((prev) => [data, ...prev])
    return { error }
  }

  // 공부/운동: 시작
  async function startActivity(type: 'study' | 'exercise') {
    const now = new Date().toISOString()
    const { data, error } = await supabase
      .from('activities')
      .insert({ type, started_at: now })
      .select()
      .single()
    if (!error && data) {
      setActivities((prev) => [data, ...prev])
      setActiveActivity(data.id, data.type, data.started_at)
    }
    return { error }
  }

  // 공부/운동: 종료
  async function stopActivity(id: string) {
    const now = new Date().toISOString()
    const { data, error } = await supabase
      .from('activities')
      .update({ ended_at: now })
      .eq('id', id)
      .select()
      .single()
    if (!error && data) {
      setActivities((prev) => prev.map((a) => (a.id === id ? data : a)))
      clearActiveActivity()
    }
    return { error }
  }

  async function deleteActivity(id: string) {
    const { error } = await supabase.from('activities').delete().eq('id', id)
    if (!error) {
      setActivities((prev) => prev.filter((a) => a.id !== id))
      clearActiveActivity()
    }
    return { error }
  }

  return { activities, loading, logInstant, startActivity, stopActivity, deleteActivity, refetch: fetchToday }
}
