import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Activity } from '@/types/activity'
import type { Memo } from '@/types/memo'
import { subDays, format, startOfDay } from 'date-fns'

export interface DaySummary {
  date: string
  sleepMinutes: number
  studyMinutes: number
  exerciseMinutes: number
  scheduleMinutes: number
  taskMinutes: number // memos (task) total
  customMinutes: Record<string, number> // custom activity name -> minutes
  wakeTime: string | null
  sleepTime: string | null
  totalMinutes: number
}

export interface WeekSummary {
  days: DaySummary[]
  avgSleepMinutes: number
  totalStudyMinutes: number
  totalExerciseMinutes: number
  totalScheduleMinutes: number
  totalTaskMinutes: number
  totalMinutes: number
  busiestDay: string | null
  busiestDayMinutes: number
}

export interface MonthSummary {
  days: DaySummary[]
  avgSleepMinutes: number
  totalStudyMinutes: number
  totalExerciseMinutes: number
  totalScheduleMinutes: number
  totalTaskMinutes: number
  totalMinutes: number
  busiestDay: string | null
  busiestDayMinutes: number
  activeDays: number
}

function getDurationMin(a: Activity): number {
  if (a.duration_minutes && a.duration_minutes > 0) return a.duration_minutes
  if (a.ended_at) return Math.round((new Date(a.ended_at).getTime() - new Date(a.started_at).getTime()) / 60000)
  return 0
}

function buildSummaries(activities: Activity[], memos: Memo[], days: number): DaySummary[] {
  const grouped: Record<string, Activity[]> = {}
  const memoGrouped: Record<string, Memo[]> = {}
  for (let i = days - 1; i >= 0; i--) {
    const d = format(subDays(new Date(), i), 'yyyy-MM-dd')
    grouped[d] = []
    memoGrouped[d] = []
  }
  activities.forEach((a) => {
    const d = format(new Date(a.started_at), 'yyyy-MM-dd')
    if (grouped[d]) grouped[d].push(a)
  })
  memos.forEach((m) => {
    if (!m.actual_start || !m.duration_minutes) return
    const d = format(new Date(m.actual_start), 'yyyy-MM-dd')
    if (memoGrouped[d]) memoGrouped[d].push(m)
  })
  return Object.entries(grouped).map(([date, acts]) => {
    const sleepMinutes = acts.filter((a) => a.type === 'sleep').reduce((s, a) => s + getDurationMin(a), 0)
    // study/exercise 중 note가 있는 것은 커스텀 활동 (이름이 note에 저장됨)
    const studyMinutes = acts.filter((a) => a.type === 'study' && !a.note).reduce((s, a) => s + getDurationMin(a), 0)
    const exerciseMinutes = acts.filter((a) => a.type === 'exercise' && !a.note).reduce((s, a) => s + getDurationMin(a), 0)
    const scheduleMinutes = (memoGrouped[date] ?? []).reduce((s, m) => s + (m.duration_minutes ?? 0), 0)

    // 커스텀 활동: note가 있는 study/exercise → note 이름으로 묶음
    const customMinutes: Record<string, number> = {}
    acts.filter((a) => (a.type === 'study' || a.type === 'exercise') && a.note).forEach((a) => {
      const name = a.note!
      customMinutes[name] = (customMinutes[name] ?? 0) + getDurationMin(a)
    })

    const taskMinutes = scheduleMinutes
    const totalMinutes = sleepMinutes + studyMinutes + exerciseMinutes + scheduleMinutes + Object.values(customMinutes).reduce((s, v) => s + v, 0)

    return {
      date,
      sleepMinutes,
      studyMinutes,
      exerciseMinutes,
      scheduleMinutes,
      taskMinutes,
      customMinutes,
      wakeTime: acts.find((a) => a.type === 'wake')?.started_at ?? null,
      sleepTime: acts.find((a) => a.type === 'sleep')?.started_at ?? null,
      totalMinutes,
    }
  })
}

function toWeekSummary(days: DaySummary[]): WeekSummary {
  const sleepDays = days.filter(d => d.sleepMinutes > 0)
  const avgSleepMinutes = sleepDays.length > 0 ? Math.round(sleepDays.reduce((s, d) => s + d.sleepMinutes, 0) / sleepDays.length) : 0
  const busiest = days.reduce<DaySummary | null>((prev, d) => (!prev || d.totalMinutes > prev.totalMinutes) ? d : prev, null)
  return {
    days,
    avgSleepMinutes,
    totalStudyMinutes: days.reduce((s, d) => s + d.studyMinutes, 0),
    totalExerciseMinutes: days.reduce((s, d) => s + d.exerciseMinutes, 0),
    totalScheduleMinutes: days.reduce((s, d) => s + d.scheduleMinutes, 0),
    totalTaskMinutes: days.reduce((s, d) => s + d.taskMinutes, 0),
    totalMinutes: days.reduce((s, d) => s + d.totalMinutes, 0),
    busiestDay: busiest?.date ?? null,
    busiestDayMinutes: busiest?.totalMinutes ?? 0,
  }
}

function toMonthSummary(days: DaySummary[]): MonthSummary {
  const sleepDays = days.filter(d => d.sleepMinutes > 0)
  const avgSleepMinutes = sleepDays.length > 0 ? Math.round(sleepDays.reduce((s, d) => s + d.sleepMinutes, 0) / sleepDays.length) : 0
  const busiest = days.reduce<DaySummary | null>((prev, d) => (!prev || d.totalMinutes > prev.totalMinutes) ? d : prev, null)
  const activeDays = days.filter(d => d.totalMinutes > 0).length
  return {
    days,
    avgSleepMinutes,
    totalStudyMinutes: days.reduce((s, d) => s + d.studyMinutes, 0),
    totalExerciseMinutes: days.reduce((s, d) => s + d.exerciseMinutes, 0),
    totalScheduleMinutes: days.reduce((s, d) => s + d.scheduleMinutes, 0),
    totalTaskMinutes: days.reduce((s, d) => s + d.taskMinutes, 0),
    totalMinutes: days.reduce((s, d) => s + d.totalMinutes, 0),
    busiestDay: busiest?.date ?? null,
    busiestDayMinutes: busiest?.totalMinutes ?? 0,
    activeDays,
  }
}

export function useAnalytics() {
  const [weekly, setWeekly] = useState<DaySummary[]>([])
  const [monthly, setMonthly] = useState<DaySummary[]>([])
  const [weekSummary, setWeekSummary] = useState<WeekSummary | null>(null)
  const [monthSummary, setMonthSummary] = useState<MonthSummary | null>(null)
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    const from = startOfDay(subDays(new Date(), 29)).toISOString()

    const [activitiesRes, memosRes] = await Promise.all([
      supabase.from('activities').select('*').gte('started_at', from).order('started_at', { ascending: true }),
      supabase.from('memos').select('*').not('actual_start', 'is', null).gte('actual_start', from),
    ])

    const activities = activitiesRes.data ?? []
    const memos = memosRes.data ?? []

    const weekActs = activities.filter(a => new Date(a.started_at) >= startOfDay(subDays(new Date(), 6)))
    const weekMemos = memos.filter(m => m.actual_start && new Date(m.actual_start) >= startOfDay(subDays(new Date(), 6)))

    const weekDays = buildSummaries(weekActs, weekMemos, 7)
    const monthDays = buildSummaries(activities, memos, 30)

    setWeekly(weekDays)
    setMonthly(monthDays)
    setWeekSummary(toWeekSummary(weekDays))
    setMonthSummary(toMonthSummary(monthDays))
    setLoading(false)
  }, [])

  useEffect(() => { fetch() }, [fetch])

  return { weekly, monthly, weekSummary, monthSummary, loading }
}
