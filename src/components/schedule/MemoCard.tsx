import type { Memo } from '@/types/memo'
import { formatDate, formatTime } from '@/lib/utils'
import { Trash2, Pencil, Check } from 'lucide-react'

interface MemoCardProps {
  memo: Memo
  onToggle: () => void
  onEdit: () => void
  onDelete: () => void
}

const PRIORITY_LABEL = ['', '중요', '긴급']
const PRIORITY_COLOR = ['', '#EAB308', '#EF4444']

export function MemoCard({ memo, onToggle, onEdit, onDelete }: MemoCardProps) {
  return (
    <div
      className={`bg-card border rounded-2xl p-4 transition-opacity ${memo.is_completed ? 'opacity-50' : ''}`}
      style={{ borderColor: `${memo.color}40` }}
    >
      <div className="flex items-start gap-3">
        {/* 완료 체크 */}
        <button
          onClick={onToggle}
          className="mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors"
          style={{
            borderColor: memo.is_completed ? memo.color : `${memo.color}60`,
            backgroundColor: memo.is_completed ? memo.color : 'transparent',
          }}
        >
          {memo.is_completed && <Check size={11} className="text-white" strokeWidth={3} />}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className={`text-slate-100 font-medium text-sm ${memo.is_completed ? 'line-through' : ''}`}>
              {memo.title}
            </p>
            {memo.priority > 0 && (
              <span
                className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                style={{ backgroundColor: `${PRIORITY_COLOR[memo.priority]}20`, color: PRIORITY_COLOR[memo.priority] }}
              >
                {PRIORITY_LABEL[memo.priority]}
              </span>
            )}
          </div>
          {memo.content && (
            <p className="text-muted text-xs mt-1 line-clamp-2">{memo.content}</p>
          )}
          {memo.scheduled_at && (
            <p className="text-xs mt-1.5" style={{ color: `${memo.color}cc` }}>
              📅 {formatDate(memo.scheduled_at)} {formatTime(memo.scheduled_at)}
            </p>
          )}
        </div>

        <div className="flex gap-1">
          <button onClick={onEdit} className="text-muted hover:text-slate-300 p-1 transition-colors">
            <Pencil size={14} />
          </button>
          <button onClick={onDelete} className="text-muted hover:text-red-400 p-1 transition-colors">
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
