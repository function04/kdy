import { useState, useEffect } from 'react'
import { PageShell } from '@/components/layout/PageShell'
import { MemoCard } from './MemoCard'
import { MemoForm } from './MemoForm'
import { useMemos } from '@/hooks/useMemos'
import type { Memo } from '@/types/memo'
import { Plus } from 'lucide-react'

// 모듈 레벨 상태 — FAB(track 밖)과 SchedulePage(track 안) 간 공유
type FormState = { show: boolean; editing: Memo | null }
type Listener = (s: FormState) => void
let _state: FormState = { show: false, editing: null }
const _listeners = new Set<Listener>()
function setFormState(s: FormState) {
  _state = s
  _listeners.forEach(fn => fn(s))
}
function useFormState() {
  const [s, setS] = useState<FormState>(_state)
  useEffect(() => {
    setS(_state)
    _listeners.add(setS)
    return () => { _listeners.delete(setS) }
  }, [])
  return s
}

export function SchedulePage() {
  const { memos, loading, createMemo, updateMemo, deleteMemo, toggleComplete } = useMemos()
  const [tab, setTab] = useState<'upcoming' | 'completed'>('upcoming')
  const formState = useFormState()

  const filtered = memos
    .filter((m) => tab === 'upcoming' ? !m.is_completed : m.is_completed)
    .sort((a, b) => {
      // scheduled_at 있는 것 먼저, 없는 것은 뒤로
      if (a.scheduled_at && b.scheduled_at) {
        return new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
      }
      if (a.scheduled_at) return -1
      if (b.scheduled_at) return 1
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

  function handleSubmit(data: Omit<Memo, 'id' | 'user_id' | 'created_at'>) {
    if (formState.editing) {
      updateMemo(formState.editing.id, data)
    } else {
      createMemo(data)
    }
  }

  return (
    <PageShell>
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-100">일정 / 메모</h2>
      </div>

      {/* 탭 */}
      <div className="flex bg-card mx-4 rounded-xl p-1 mb-4 border border-border">
        {(['upcoming', 'completed'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t ? 'bg-blue-600 text-white' : 'text-muted hover:text-slate-300'
            }`}
          >
            {t === 'upcoming' ? '할 일' : '완료'}
          </button>
        ))}
      </div>

      {/* 목록 */}
      <div className="px-4 space-y-2">
        {loading ? (
          <p className="text-muted text-sm text-center py-8">불러오는 중...</p>
        ) : filtered.length === 0 ? (
          <p className="text-muted text-sm text-center py-8">
            {tab === 'upcoming' ? '할 일이 없습니다' : '완료된 항목이 없습니다'}
          </p>
        ) : (
          filtered.map((memo) => (
            <MemoCard
              key={memo.id}
              memo={memo}
              onToggle={() => toggleComplete(memo.id, memo.is_completed)}
              onEdit={() => setFormState({ show: true, editing: memo })}
              onDelete={() => deleteMemo(memo.id)}
            />
          ))
        )}
      </div>

      {/* 폼 모달 */}
      {formState.show && (
        <MemoForm
          initial={formState.editing ?? undefined}
          onSubmit={handleSubmit}
          onClose={() => setFormState({ show: false, editing: null })}
        />
      )}
    </PageShell>
  )
}

// track 밖에서 렌더 — fixed 포지셔닝이 정상 작동
export function ScheduleFAB({ isVisible }: { isVisible: boolean }) {
  if (!isVisible) return null
  return (
    <button
      onClick={() => setFormState({ show: true, editing: null })}
      className="active:scale-90 transition-transform"
      style={{
        position: 'fixed',
        bottom: 'calc(max(16px, env(safe-area-inset-bottom)) + 70px)',
        right: 20,
        width: 44,
        height: 44,
        borderRadius: 22,
        background: 'rgba(var(--nav-bg), 0.8)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        border: '0.5px solid rgba(var(--nav-border), 0.25)',
        boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 41,
      }}
    >
      <Plus size={20} style={{ color: '#007AFF' }} strokeWidth={2.5} />
    </button>
  )
}
