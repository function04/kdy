import { useState } from 'react'
import type { Memo } from '@/types/memo'
import { X } from 'lucide-react'

const COLORS = ['#3B82F6', '#22C55E', '#EAB308', '#A855F7', '#EF4444', '#F97316', '#06B6D4']

interface MemoFormProps {
  initial?: Partial<Memo>
  onSubmit: (data: Omit<Memo, 'id' | 'user_id' | 'created_at'>) => void
  onClose: () => void
}

export function MemoForm({ initial, onSubmit, onClose }: MemoFormProps) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [content, setContent] = useState(initial?.content ?? '')
  const [scheduledAt, setScheduledAt] = useState(
    initial?.scheduled_at ? initial.scheduled_at.slice(0, 16) : ''
  )
  const [priority, setPriority] = useState<0 | 1 | 2>(initial?.priority ?? 0)
  const [color, setColor] = useState(initial?.color ?? '#3B82F6')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    onSubmit({
      title: title.trim(),
      content: content.trim() || null,
      scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null,
      is_completed: initial?.is_completed ?? false,
      priority,
      color,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-end justify-center" onClick={onClose}>
      <div
        className="bg-card w-full max-w-lg rounded-t-3xl p-6 pb-10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-slate-100 font-semibold">{initial ? '메모 수정' : '새 메모'}</h3>
          <button onClick={onClose} className="text-muted hover:text-slate-300">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="제목"
            required
            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-slate-100 placeholder:text-muted focus:outline-none focus:border-blue-500"
          />

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="내용 (선택)"
            rows={3}
            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-slate-100 placeholder:text-muted focus:outline-none focus:border-blue-500 resize-none"
          />

          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-blue-500"
          />

          {/* 우선순위 */}
          <div className="flex gap-2">
            {([['보통', 0], ['중요', 1], ['긴급', 2]] as const).map(([label, val]) => (
              <button
                key={val}
                type="button"
                onClick={() => setPriority(val)}
                className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors border ${
                  priority === val
                    ? val === 0 ? 'bg-slate-600 border-slate-500 text-white'
                    : val === 1 ? 'bg-yellow-500/20 border-yellow-500 text-yellow-400'
                    : 'bg-red-500/20 border-red-500 text-red-400'
                    : 'bg-transparent border-border text-muted'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* 색상 */}
          <div className="flex gap-2">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className="w-8 h-8 rounded-full border-2 transition-transform active:scale-90"
                style={{
                  backgroundColor: c,
                  borderColor: color === c ? 'white' : 'transparent',
                }}
              />
            ))}
          </div>

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
