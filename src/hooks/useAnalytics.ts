import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Activity } from '@/types/activity'
import { subDays, format, startOfDay } from 'date-fns'

export interface DaySummary {
  date: string
  studyMinutes: number
  exerciseMinutes: number
  wakeTime: string | null
  sleepTime: string | null
}

export function useAnalytics() {
  const [weekly, setWeekly] = useState<DaySummary[]>([])
  const [loading, setLoading] = useState(true)

  const fetchWeekly = useCallback(async () => {
    const from = startOfDay(subDays(new Date(), 6)).toISOString()
    const { data } = await supabase
      .from('activities')
      .select('*')
      .gte('started_at', from)
      .order('started_at', { ascending: true })

    if (!data) { setLoading(false); return }

    // 날짜별 그룹화
    const grouped: Record<string, Activity[]> = {}
    for (let i = 6; i >= 0; i--) {
      const d = format(subDays(new Date(), i), 'yyyy-MM-dd')
      grouped[d] = []
    }
    data.forEach((a) => {
      const d = format(new Date(a.started_at), 'yyyy-MM-dd')
      if (grouped[d]) grouped[d].push(a)
    })

    const summaries: DaySummary[] = Object.entries(grouped).map(([date, acts]) => ({
      date,
      studyMinutes: acts
        .filter((a) => a.type === 'study' && a.duration_minutes)
        .reduce((sum, a) => sum + (a.duration_minutes ?? 0), 0),
      exerciseMinutes: acts
        .filter((a) => a.type === 'exercise' && a.duration_minutes)
        .reduce((sum, a) => sum + (a.duration_minutes ?? 0), 0),
      wakeTime: acts.find((a) => a.type === 'wake')?.started_at ?? null,
      sleepTime: acts.find((a) => a.type === 'sleep')?.started_at ?? null,
    }))

    setWeekly(summaries)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchWeekly()
  }, [fetchWeekly])

  return { weekly, loading }
}
