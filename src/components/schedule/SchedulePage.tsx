import { useState } from 'react'
import { PageShell } from '@/components/layout/PageShell'
import { MemoCard } from './MemoCard'
import { MemoForm } from './MemoForm'
import { useMemos } from '@/hooks/useMemos'
import type { Memo } from '@/types/memo'
import { Plus } from 'lucide-react'

export function SchedulePage() {
  const { memos, loading, createMemo, updateMemo, deleteMemo, toggleComplete } = useMemos()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Memo | null>(null)
  const [tab, setTab] = useState<'upcoming' | 'completed'>('upcoming')

  const filtered = memos.filter((m) =>
    tab === 'upcoming' ? !m.is_completed : m.is_completed
  )

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
              onEdit={() => { setEditing(memo); setShowForm(true) }}
              onDelete={() => deleteMemo(memo.id)}
            />
          ))
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => { setEditing(null); setShowForm(true) }}
        className="fixed bottom-24 right-4 w-14 h-14 bg-blue-600 hover:bg-blue-500 rounded-full flex items-center justify-center shadow-lg transition-colors z-40"
      >
        <Plus size={24} className="text-white" />
      </button>

      {/* 메모 폼 */}
      {showForm && (
        <MemoForm
          initial={editing ?? undefined}
          onSubmit={(data) => editing ? updateMemo(editing.id, data) : createMemo(data)}
          onClose={() => { setShowForm(false); setEditing(null) }}
        />
      )}
    </PageShell>
  )
}
