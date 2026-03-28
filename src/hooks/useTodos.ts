import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Todo } from '@/types/todo'

async function getCurrentUserId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('로그인이 필요합니다')
  return user.id
}

export function useTodos() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [loading, setLoading] = useState(true)

  const fetchTodos = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('todos')
      .select('*')
      .order('is_done', { ascending: true })
      .order('created_at', { ascending: false })
    setTodos(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchTodos() }, [fetchTodos])

  async function addTodo(text: string) {
    const user_id = await getCurrentUserId()
    const { data } = await supabase.from('todos').insert({ text, user_id }).select().single()
    if (data) setTodos(prev => [data, ...prev])
  }

  async function toggleTodo(id: string, current: boolean) {
    const updates: any = { is_done: !current }
    if (!current) updates.completed_at = new Date().toISOString()
    else updates.completed_at = null
    await supabase.from('todos').update(updates).eq('id', id)
    setTodos(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t))
  }

  async function deleteTodo(id: string) {
    await supabase.from('todos').delete().eq('id', id)
    setTodos(prev => prev.filter(t => t.id !== id))
  }

  return { todos, loading, addTodo, toggleTodo, deleteTodo, refetch: fetchTodos }
}
