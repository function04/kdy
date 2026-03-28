export interface Memo {
  id: string
  user_id: string
  title: string
  content: string | null
  scheduled_at: string | null
  is_completed: boolean
  priority: 0 | 1 | 2
  color: string
  actual_start: string | null
  actual_end: string | null
  duration_minutes: number | null
  gcal_event_id: string | null
  created_at: string
}
