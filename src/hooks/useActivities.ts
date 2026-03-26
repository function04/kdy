import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Activity } from '@/types/activity'
import { useAppStore } from '@/stores/appStore'

async function getCurrentUserId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('로그인이 필요합니다')
  return user.id
}

export function useActivities() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const { setActiveActivity, clearActiveActivity, showFlash } = useAppStore()

  const fetchToday = useCallback(async () => {
    // 어제 오후 6시부터 — 어제 취침 기록도 포함
    const since = new Date()
    since.setDate(since.getDate() - 1)
    since.setHours(18, 0, 0, 0)

    const { data } = await supabase
      .from('activities')
      .select('*')
      .gte('started_at', since.toISOString())
      .order('started_at', { ascending: false })

    if (data) {
      setActivities(data)
      // 진행 중인 활동 복원 (ended_at이 null인 것)
      const ongoing = data.find((a) => a.ended_at === null)
      if (ongoing) {
        setActiveActivity(ongoing.id, ongoing.type, ongoing.started_at, ongoing.note ?? undefined)
      } else {
        clearActiveActivity()
      }
    }
    setLoading(false)
  }, [setActiveActivity, clearActiveActivity])

  useEffect(() => {
    fetchToday()
  }, [fetchToday])

  // 기상: 취침 활동 종료만 (새 활동 시작 안 함)
  // 취침: 취침 활동 시작 (타이머)
  async function logInstant(type: 'wake' | 'sleep') {
    const now = new Date().toISOString()
    const { activeActivityId, activeActivityType } = useAppStore.getState()

    if (type === 'wake') {
      // 기상 = 취침 종료만
      if (activeActivityId && activeActivityType === 'sleep') {
        const { data, error } = await supabase
          .from('activities')
          .update({ ended_at: now })
          .eq('id', activeActivityId)
          .select()
          .single()
        if (!error && data) {
          setActivities(prev => prev.map(a => a.id === activeActivityId ? { ...a, ended_at: now } : a))
          clearActiveActivity()
          showFlash('취침 종료')
        }
        return { error: error ?? null }
      }
      return { error: null }
    }

    // 취침 시작
    const user_id = await getCurrentUserId()
    const { data, error } = await supabase
      .from('activities')
      .insert({ type: 'sleep', started_at: now, user_id })
      .select()
      .single()

    if (!error && data) {
      setActivities(prev => [data, ...prev])
      setActiveActivity(data.id, data.type, data.started_at)
      showFlash('취침 시작')
    }
    return { error: error ?? null }
  }

  // 공부/운동: 시작 (커스텀 이름 가능)
  async function startActivity(type: 'study' | 'exercise', note?: string) {
    const now = new Date().toISOString()
    const user_id = await getCurrentUserId()
    const insert: any = { type, started_at: now, user_id }
    if (note) insert.note = note
    const { data, error } = await supabase
      .from('activities')
      .insert(insert)
      .select()
      .single()
    if (!error && data) {
      setActivities((prev) => [data, ...prev])
      setActiveActivity(data.id, data.type, data.started_at, note)
      showFlash(`${note || (type === 'study' ? '공부' : '운동')} 시작`)
    }
    return { error }
  }

  // 공부/운동: 종료
  async function stopActivity(id: string) {
    const now = new Date().toISOString()
    const { activeActivityType } = useAppStore.getState()
    const { data, error } = await supabase
      .from('activities')
      .update({ ended_at: now })
      .eq('id', id)
      .select()
      .single()
    if (!error && data) {
      setActivities((prev) => prev.map((a) => (a.id === id ? data : a)))
      clearActiveActivity()
      const label = activeActivityType === 'study' ? '공부' : activeActivityType === 'exercise' ? '운동' : activeActivityType === 'sleep' ? '취침' : '기상'
      showFlash(`${label} 종료`)
    }
    return { error }
  }

  async function deleteActivity(id: string) {
    const { error } = await supabase.from('activities').delete().eq('id', id)
    if (!error) {
      setActivities((prev) => prev.filter((a) => a.id !== id))
      const { activeActivityId } = useAppStore.getState()
      if (activeActivityId === id) clearActiveActivity()
    }
    return { error }
  }

  return { activities, loading, logInstant, startActivity, stopActivity, deleteActivity, refetch: fetchToday }
}
