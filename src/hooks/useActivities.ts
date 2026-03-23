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

  // 기상: 진행 중인 취침 종료 + 기상 시작(타이머)
  // 취침: 진행 중인 기상 종료 + 취침 시작(타이머)
  async function logInstant(type: 'wake' | 'sleep') {
    const now = new Date().toISOString()
    const user_id = await getCurrentUserId()
    const { activeActivityId, activeActivityType } = useAppStore.getState()

    // 진행 중인 반대 활동 종료
    const opposite = type === 'wake' ? 'sleep' : 'wake'
    if (activeActivityId && activeActivityType === opposite) {
      await supabase.from('activities').update({ ended_at: now }).eq('id', activeActivityId)
      showFlash(`${type === 'wake' ? '취침 종료' : '기상 종료'}`)
    }

    // 새 활동 시작 (ended_at 없음 = 진행 중)
    const { data, error } = await supabase
      .from('activities')
      .insert({ type, started_at: now, user_id })
      .select()
      .single()

    if (!error && data) {
      setActivities((prev) => {
        // 진행 중이던 반대 활동도 ended_at 업데이트
        return [data, ...prev.map(a =>
          a.id === activeActivityId ? { ...a, ended_at: now } : a
        )]
      })
      setActiveActivity(data.id, data.type, data.started_at)
      showFlash(`${type === 'wake' ? '기상' : '취침'} 시작`)
    }
    return { error }
  }

  // 공부/운동: 시작
  async function startActivity(type: 'study' | 'exercise') {
    const now = new Date().toISOString()
    const user_id = await getCurrentUserId()
    const { data, error } = await supabase
      .from('activities')
      .insert({ type, started_at: now, user_id })
      .select()
      .single()
    if (!error && data) {
      setActivities((prev) => [data, ...prev])
      setActiveActivity(data.id, data.type, data.started_at)
      showFlash(`${type === 'study' ? '공부' : '운동'} 시작`)
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
