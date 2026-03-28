export interface Todo {
  id: string
  user_id: string
  text: string
  is_done: boolean
  completed_at: string | null
  created_at: string
}
