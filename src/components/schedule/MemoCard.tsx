import { useState } from 'react'
import type { Memo } from '@/types/memo'
import { formatDate, formatTime } from '@/lib/utils'
import { Trash2, Pencil } from 'lucide-react'
import { Portal } from '@/lib/portal'

interface MemoCardProps {
  memo: Memo
  onToggle: () => void
  onEdit: () => void
  onDelete: () => void
}

const PRIORITY_LABEL = ['', '중요', '긴급']

// 배경 없이 테두리 색상만
const PRIORITY_BORDER: Record<number, string> = {
  0: '1px solid rgba(var(--color-border-rgb, 60,60,65), 1)',
  1: '1.5px solid rgba(251,146,60,0.6)',   // orange-400/60
  2: '1.5px solid rgba(248,113,113,0.6)',  // red-400/60
}

const PRIORITY_BADGE: Record<number, { bg: string; text: string }> = {
  0: { bg: '', text: '' },
  1: { bg: 'bg-orange-500/10', text: 'text-orange-400' },
  2: { bg: 'bg-red-500/10', text: 'text-red-400' },
}

export function MemoCard({ memo, onToggle, onEdit, onDelete }: MemoCardProps) {
  const border = PRIORITY_BORDER[memo.priority] ?? PRIORITY_BORDER[0]
  const badge = PRIORITY_BADGE[memo.priority] ?? PRIORITY_BADGE[0]
  const [showConfirm, setShowConfirm] = useState(false)

  return (
    <>
      <div
        className={`bg-card rounded-2xl transition-opacity ${memo.is_completed ? 'opacity-40' : ''}`}
        style={{ border }}
      >
        <div className="flex items-center gap-2 px-4 py-3">
          {/* 카드 본체 — 탭하면 완료 확인 */}
          <button
            className="flex-1 min-w-0 text-left active:opacity-60 transition-opacity"
            onClick={() => setShowConfirm(true)}
          >
            <div className="flex items-center gap-2 flex-wrap">
              <p className={`text-slate-100 font-medium text-sm ${memo.is_completed ? 'line-through' : ''}`}>
                {memo.title}
              </p>
              {memo.priority > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${badge.bg} ${badge.text}`}>
                  {PRIORITY_LABEL[memo.priority]}
                </span>
              )}
            </div>
            {memo.content && (
              <p className="text-muted text-xs mt-0.5 line-clamp-2">{memo.content}</p>
            )}
            {memo.scheduled_at && (
              <p className="text-slate-200 text-xs mt-1 font-medium">
                {formatDate(memo.scheduled_at)} {formatTime(memo.scheduled_at)}
              </p>
            )}
          </button>

          {/* 오른쪽 아이콘 버튼들 */}
          <div className="flex items-center gap-0.5 flex-shrink-0">
            <button
              onClick={onEdit}
              className="p-2 text-muted active:text-slate-200 rounded-xl transition-colors"
            >
              <Pencil size={14} />
            </button>
            <button
              onClick={onDelete}
              className="p-2 text-muted/60 active:text-red-400 rounded-xl transition-colors"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* 완료 확인 다이얼로그 */}
      {showConfirm && (
        <Portal>
          <div
            className="fixed inset-0 z-50 flex items-center justify-center px-8"
            style={{ animation: 'wFadeIn 0.15s ease forwards' }}
            onClick={() => setShowConfirm(false)}
          >
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <div
              className="relative w-full max-w-xs bg-card rounded-2xl overflow-hidden shadow-xl"
              style={{ animation: 'wExpand 0.2s cubic-bezier(0.34,1.56,0.64,1) forwards' }}
              onClick={e => e.stopPropagation()}
            >
              <div className="px-5 pt-5 pb-4 text-center">
                <p className="text-slate-100 font-semibold text-base mb-1">
                  {memo.is_completed ? '완료 취소' : '완료로 표시'}
                </p>
                <p className="text-muted text-sm">"{memo.title}"</p>
              </div>
              <div className="border-t border-border flex">
                <button
                  onClick={() => { setShowConfirm(false); onToggle() }}
                  className="flex-1 py-3.5 text-sm font-semibold text-slate-100 border-r border-border active:bg-white/5"
                >
                  {memo.is_completed ? '완료 취소' : '완료'}
                </button>
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 py-3.5 text-sm text-muted active:bg-white/5"
                >
                  취소
                </button>
              </div>
            </div>
          </div>
          <style>{`
            @keyframes wFadeIn { from{opacity:0} to{opacity:1} }
            @keyframes wExpand { from{opacity:0;transform:scale(0.88)} to{opacity:1;transform:scale(1)} }
          `}</style>
        </Portal>
      )}
    </>
  )
}
