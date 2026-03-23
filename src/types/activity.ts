export type ActivityType = 'wake' | 'sleep' | 'study' | 'exercise'

export interface Activity {
  id: string
  user_id: string
  type: ActivityType
  started_at: string
  ended_at: string | null
  duration_minutes: number | null
  note: string | null
  created_at: string
}
