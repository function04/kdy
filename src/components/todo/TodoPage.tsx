import { useState, useMemo, useCallback } from 'react'
import { useTodos } from '@/hooks/useTodos'
import { ChevronLeft, Check, X } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { ko } from 'date-fns/locale'

interface TodoPageProps {
  onBack: () => void
}

export function TodoPage({ onBack }: TodoPageProps) {
  const [exiting, setExiting] = useState(false)
  const slideBack = useCallback(() => {
    setExiting(true)
    setTimeout(onBack, 280)
  }, [onBack])
  const { todos, addTodo, toggleTodo, deleteTodo } = useTodos()
  const [tab, setTab] = useState<'active' | 'done'>('active')
  const [input, setInput] = useState('')

  const activeTodos = useMemo(() => todos.filter(t => !t.is_done), [todos])

  // 완료된 To Do를 날짜별 그룹화
  const doneByDate = useMemo(() => {
    const done = todos.filter(t => t.is_done && t.completed_at)
    const groups: Record<string, typeof done> = {}
    done
      .sort((a, b) => new Date(b.completed_at!).getTime() - new Date(a.completed_at!).getTime())
      .forEach(t => {
        const dateKey = format(parseISO(t.completed_at!), 'yyyy-MM-dd')
        if (!groups[dateKey]) groups[dateKey] = []
        groups[dateKey].push(t)
      })
    return Object.entries(groups)
  }, [todos])

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim()) return
    addTodo(input.trim())
    setInput('')
  }

  return (
    <div
      className="min-h-screen"
      style={{
        background: '#0A0A0B',
        animation: exiting
          ? 'pageSlideOut 0.28s cubic-bezier(0.22, 1, 0.36, 1) forwards'
          : 'pageSlideIn 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
      }}
    >
      {/* 헤더 */}
      <div className="px-4 pt-4 pb-3 flex items-center gap-3">
        <button onClick={slideBack} className="p-1 text-[#5C5C66] active:text-[#EDEDEF] pressable">
          <ChevronLeft size={22} />
        </button>
        <h2 className="text-[18px] font-semibold text-[#EDEDEF]">To Do</h2>
      </div>

      {/* 탭 */}
      <div className="px-4 pb-3 flex gap-2">
        <button
          onClick={() => setTab('active')}
          className="px-4 py-1.5 rounded-lg text-[12px] font-medium transition-all pressable"
          style={tab === 'active' ? {
            background: 'rgba(255,255,255,0.10)',
            border: '1px solid rgba(255,255,255,0.15)',
            color: '#EDEDEF',
          } : {
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.06)',
            color: '#5C5C66',
          }}
        >
          Active{activeTodos.length > 0 ? ` (${activeTodos.length})` : ''}
        </button>
        <button
          onClick={() => setTab('done')}
          className="px-4 py-1.5 rounded-lg text-[12px] font-medium transition-all pressable"
          style={tab === 'done' ? {
            background: 'rgba(255,255,255,0.10)',
            border: '1px solid rgba(255,255,255,0.15)',
            color: '#EDEDEF',
          } : {
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.06)',
            color: '#5C5C66',
          }}
        >
          Done
        </button>
      </div>

      <div className="px-4 pb-24">
        {/* Active 탭 */}
        {tab === 'active' && (
          <div>
            {/* 입력 */}
            <form onSubmit={handleAdd} className="flex items-center gap-3 mb-4">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="+ Add new to do..."
                className="flex-1 rounded-xl px-4 py-3 text-[14px] placeholder:text-[#5C5C66]/50 focus:outline-none"
                style={{ color: '#EDEDEF', background: '#141416', border: '1px solid rgba(255,255,255,0.06)' }}
                onFocus={e => { (e.target as HTMLInputElement).style.borderColor = 'rgba(91,141,239,0.3)' }}
                onBlur={e => { (e.target as HTMLInputElement).style.borderColor = 'rgba(255,255,255,0.06)' }}
              />
            </form>

            {/* 리스트 */}
            {activeTodos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-2">
                <Check size={28} className="text-[#5C5C66]/30" />
                <p className="text-[#5C5C66] text-[13px]">All clear!</p>
              </div>
            ) : (
              <div className="space-y-0">
                {activeTodos.map((todo, i) => (
                  <div
                    key={todo.id}
                    className="flex items-center gap-3 py-3 px-1 animate-in"
                    style={{ animationDelay: `${i * 30}ms` }}
                  >
                    <button
                      onClick={() => toggleTodo(todo.id, todo.is_done)}
                      className="w-[20px] h-[20px] rounded-full border-[1.5px] flex-shrink-0 pressable"
                      style={{ borderColor: 'rgba(255,255,255,0.15)' }}
                    />
                    <span className="text-[14px] text-[#EDEDEF] flex-1">{todo.text}</span>
                    <button onClick={() => deleteTodo(todo.id)} className="p-1.5 text-[#5C5C66] active:text-[#F87171]">
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Done 탭 — 날짜별 그룹 */}
        {tab === 'done' && (
          <div>
            {doneByDate.length === 0 ? (
              <p className="text-[#5C5C66] text-[13px] text-center py-12">No completed to-dos</p>
            ) : (
              <div className="space-y-5">
                {doneByDate.map(([dateKey, items]) => (
                  <div key={dateKey}>
                    <p className="text-[11px] font-medium text-[#5C5C66] px-1 mb-2">
                      {format(parseISO(dateKey), 'M월 d일 (EEE)', { locale: ko })}
                    </p>
                    <div style={{ background: '#141416', borderRadius: 14, border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                      {items.map((todo, i) => (
                        <div key={todo.id}>
                          <div className="flex items-center gap-3 px-4 py-3">
                            <button
                              onClick={() => toggleTodo(todo.id, todo.is_done)}
                              className="w-[20px] h-[20px] rounded-full flex-shrink-0 flex items-center justify-center pressable"
                              style={{ backgroundColor: '#5B8DEF' }}
                            >
                              <Check size={11} className="text-white" strokeWidth={3} />
                            </button>
                            <span className="text-[14px] text-[#EDEDEF] flex-1 line-through opacity-50">{todo.text}</span>
                            <button onClick={() => deleteTodo(todo.id)} className="p-1.5 text-[#5C5C66] active:text-[#F87171]">
                              <X size={14} />
                            </button>
                          </div>
                          {i < items.length - 1 && (
                            <div className="ml-11" style={{ height: '0.5px', background: 'rgba(255,255,255,0.06)' }} />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
