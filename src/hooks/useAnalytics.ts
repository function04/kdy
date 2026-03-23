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

function buildSummaries(data: Activity[], days: number): DaySummary[] {
  const grouped: Record<string, Activity[]> = {}
  for (let i = days - 1; i >= 0; i--) {
    const d = format(subDays(new Date(), i), 'yyyy-MM-dd')
    grouped[d] = []
  }
  data.forEach((a) => {
    const d = format(new Date(a.started_at), 'yyyy-MM-dd')
    if (grouped[d]) grouped[d].push(a)
  })
  return Object.entries(grouped).map(([date, acts]) => ({
    date,
    studyMinutes: acts.filter((a) => a.type === 'study' && a.duration_minutes).reduce((s, a) => s + (a.duration_minutes ?? 0), 0),
    exerciseMinutes: acts.filter((a) => a.type === 'exercise' && a.duration_minutes).reduce((s, a) => s + (a.duration_minutes ?? 0), 0),
    wakeTime: acts.find((a) => a.type === 'wake')?.started_at ?? null,
    sleepTime: acts.find((a) => a.type === 'sleep')?.started_at ?? null,
  }))
}

export function useAnalytics() {
  const [weekly, setWeekly] = useState<DaySummary[]>([])
  const [monthly, setMonthly] = useState<DaySummary[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    const from = startOfDay(subDays(new Date(), 29)).toISOString()
    const { data } = await supabase
      .from('activities')
      .select('*')
      .gte('started_at', from)
      .order('started_at', { ascending: true })

    if (!data) { setLoading(false); return }

    setWeekly(buildSummaries(data.filter(a => new Date(a.started_at) >= startOfDay(subDays(new Date(), 6))), 7))
    setMonthly(buildSummaries(data, 30))
    setLoading(false)
  }, [])

  useEffect(() => { fetch() }, [fetch])

  return { weekly, monthly, loading }
}
