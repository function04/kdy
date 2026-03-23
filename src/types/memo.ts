export interface Memo {
  id: string
  user_id: string
  title: string
  content: string | null
  scheduled_at: string | null
  is_completed: boolean
  priority: 0 | 1 | 2
  color: string
  created_at: string
}
