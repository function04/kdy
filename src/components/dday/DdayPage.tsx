import { useState } from 'react'
import { PageShell } from '@/components/layout/PageShell'
import { useDdays } from '@/hooks/useDdays'
import type { Dday } from '@/types/dday'
import { differenceInDays, parseISO, isToday } from 'date-fns'
import { Plus, Pencil, Trash2, ChevronLeft, X } from 'lucide-react'

function getDdayText(dateStr: string) {
  const target = parseISO(dateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  if (isToday(target)) return 'D-Day'
  const diff = differenceInDays(target, today)
  return diff > 0 ? `D-${diff}` : `D+${Math.abs(diff)}`
}

interface DdayFormProps {
  initial?: Partial<Dday>
  onSubmit: (data: Omit<Dday, 'id' | 'user_id' | 'created_at'>) => void
  onClose: () => void
}

function DdayForm({ initial, onSubmit, onClose }: DdayFormProps) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [date, setDate] = useState(initial?.date ?? '')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !date) return
    onSubmit({ title: title.trim(), date, color: initial?.color ?? '#3B82F6' })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-end justify-center" onClick={onClose}>
      <div className="bg-card w-full max-w-lg rounded-t-3xl p-6 pb-10" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-slate-100 font-semibold">{initial ? 'D-day 수정' : '새 D-day'}</h3>
          <button onClick={onClose} className="text-muted hover:text-slate-300"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="제목 (예: 수능, 졸업, 여행)"
            required
            autoFocus
            className="w-full bg-background border border-border rounded-xl px-4 py-3 placeholder:text-muted focus:outline-none focus:border-blue-500"
            style={{ color: 'var(--color-text)' }}
          />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className="w-full bg-background border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500"
            style={{ color: 'var(--color-text)' }}
          />
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            저장
          </button>
        </form>
      </div>
    </div>
  )
}

interface DdayPageProps {
  onBack: () => void
}

export function DdayPage({ onBack }: DdayPageProps) {
  const { ddays, loading, createDday, updateDday, deleteDday } = useDdays()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Dday | null>(null)

  return (
    <PageShell>
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-muted hover:text-slate-300">
            <ChevronLeft size={22} />
          </button>
          <h2 className="text-lg font-semibold text-slate-100">D-day</h2>
        </div>
        <button
          onClick={() => { setEditing(null); setShowForm(true) }}
          className="w-9 h-9 bg-blue-600 hover:bg-blue-500 rounded-full flex items-center justify-center transition-colors"
        >
          <Plus size={18} className="text-white" />
        </button>
      </div>

      <div className="px-4 space-y-2 mt-2">
        {loading ? (
          <p className="text-muted text-sm text-center py-8">불러오는 중...</p>
        ) : ddays.length === 0 ? (
          <p className="text-muted text-sm text-center py-12">+ 버튼을 눌러 D-day를 추가하세요</p>
        ) : (
          ddays.map((dday) => {
            const ddayText = getDdayText(dday.date)
            const isPast = ddayText.startsWith('D+')
            return (
              <div
                key={dday.id}
                className="bg-card border rounded-2xl p-4 flex items-center gap-4"
                style={{ borderColor: `${dday.color}40` }}
              >
                {/* D-day 숫자 */}
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${dday.color}20` }}
                >
                  <span
                    className="text-lg font-bold"
                    style={{ color: isPast ? '#64748B' : dday.color }}
                  >
                    {ddayText}
                  </span>
                </div>

                {/* 정보 */}
                <div className="flex-1 min-w-0">
                  <p className="text-slate-100 font-medium truncate">{dday.title}</p>
                  <p className="text-muted text-xs mt-0.5">
                    {dday.date.replace(/-/g, '.')}
                  </p>
                </div>

                {/* 버튼 */}
                <div className="flex gap-1">
                  <button
                    onClick={() => { setEditing(dday); setShowForm(true) }}
                    className="text-muted hover:text-slate-300 p-1.5"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => deleteDday(dday.id)}
                    className="text-muted hover:text-red-400 p-1.5"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {showForm && (
        <DdayForm
          initial={editing ?? undefined}
          onSubmit={(data) => editing ? updateDday(editing.id, data) : createDday(data)}
          onClose={() => { setShowForm(false); setEditing(null) }}
        />
      )}
    </PageShell>
  )
}
