import { useState, useRef, useEffect } from 'react'
import type { Memo } from '@/types/memo'
import { formatTime } from '@/lib/utils'
import { Trash2, Pencil, Check, CheckCircle } from 'lucide-react'

interface MemoCardProps {
  memo: Memo
  onToggle: () => void
  onEdit: () => void
  onDelete: () => void
}

const PRIORITY_LABEL = ['Low', 'Medium', 'High']

const PRIORITY_COLOR: Record<number, string> = {
  0: '#22C55E',
  1: '#F59E0B',
  2: '#EF4444',
}

const PRIORITY_BADGE: Record<number, { bg: string; text: string }> = {
  0: { bg: 'bg-green-500/10', text: 'text-green-400' },
  1: { bg: 'bg-yellow-500/10', text: 'text-yellow-400' },
  2: { bg: 'bg-red-500/10', text: 'text-red-400' },
}

const ACTION_WIDTH = 140

export function MemoCard({ memo, onToggle, onEdit, onDelete }: MemoCardProps) {
  const badge = PRIORITY_BADGE[memo.priority] ?? PRIORITY_BADGE[0]
  const color = PRIORITY_COLOR[memo.priority] ?? PRIORITY_COLOR[0]

  const containerRef = useRef<HTMLDivElement>(null)
  const startX = useRef(0)
  const startY = useRef(0)
  const currentX = useRef(0)
  const dirLocked = useRef<'h' | 'v' | null>(null)
  const swipingRef = useRef(false)
  const [offsetX, setOffsetX] = useState(0)
  const offsetXRef = useRef(0)
  const [dismissed, setDismissed] = useState(false)

  // native event listener로 등록해야 e.preventDefault() + stopPropagation 동시 가능
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    function onTouchStart(e: TouchEvent) {
      startX.current = e.touches[0].clientX
      startY.current = e.touches[0].clientY
      currentX.current = offsetXRef.current
      dirLocked.current = null
      swipingRef.current = true
    }

    function onTouchMove(e: TouchEvent) {
      if (!swipingRef.current) return
      const dx = e.touches[0].clientX - startX.current
      const dy = e.touches[0].clientY - startY.current

      if (!dirLocked.current) {
        if (Math.abs(dx) > Math.abs(dy) * 1.2 && Math.abs(dx) > 6) {
          dirLocked.current = 'h'
        } else if (Math.abs(dy) > 8) {
          dirLocked.current = 'v'
          swipingRef.current = false
          return
        } else {
          return
        }
      }

      if (dirLocked.current !== 'h') return

      // 페이지 스와이프 차단
      e.preventDefault()
      e.stopPropagation()

      let newX = currentX.current + dx
      if (newX > 0) newX = newX * 0.15
      if (newX < -ACTION_WIDTH * 1.5) newX = -ACTION_WIDTH * 1.5 + (newX + ACTION_WIDTH * 1.5) * 0.1

      offsetXRef.current = newX
      setOffsetX(newX)
    }

    function onTouchEnd() {
      if (!swipingRef.current && dirLocked.current !== 'h') {
        swipingRef.current = false
        dirLocked.current = null
        return
      }
      swipingRef.current = false
      dirLocked.current = null

      const val = offsetXRef.current
      const finalX = val < -ACTION_WIDTH * 0.4 ? -ACTION_WIDTH : 0
      offsetXRef.current = finalX
      setOffsetX(finalX)
    }

    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchmove', onTouchMove, { passive: false })
    el.addEventListener('touchend', onTouchEnd, { passive: true })

    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', onTouchEnd)
    }
  }, [])

  function handleAction(action: 'complete' | 'delete') {
    setDismissed(true)
    setTimeout(() => {
      if (action === 'complete') onToggle()
      else onDelete()
    }, 250)
  }

  function handleClose() {
    offsetXRef.current = 0
    setOffsetX(0)
  }

  if (dismissed) {
    return (
      <div
        className="transition-all duration-250"
        style={{ maxHeight: 0, opacity: 0, marginBottom: 0 }}
      />
    )
  }

  const isOpen = offsetX < -10
  const isSwiping = swipingRef.current

  return (
    <div ref={containerRef} className="relative rounded-2xl" style={{ overflow: 'hidden' }}>
      {/* 뒤쪽 액션 버튼 */}
      {isOpen && (
        <div
          className="absolute right-0 top-0 bottom-0 flex items-stretch rounded-r-2xl"
          style={{ width: ACTION_WIDTH, overflow: 'hidden' }}
        >
          <button
            onClick={() => handleAction('complete')}
            className="flex-1 flex flex-col items-center justify-center gap-1 active:opacity-80"
            style={{ backgroundColor: memo.is_completed ? '#D97706' : '#16A34A' }}
          >
            <CheckCircle size={18} className="text-white" />
            <span className="text-white text-[10px] font-medium">
              {memo.is_completed ? 'Undo' : 'Done'}
            </span>
          </button>
          <button
            onClick={() => handleAction('delete')}
            className="flex-1 flex flex-col items-center justify-center gap-1 active:opacity-80"
            style={{ backgroundColor: '#DC2626' }}
          >
            <Trash2 size={18} className="text-white" />
            <span className="text-white text-[10px] font-medium">Delete</span>
          </button>
        </div>
      )}

      {/* 메인 카드 */}
      <div
        className={`relative bg-card rounded-2xl ${memo.is_completed ? 'opacity-40' : ''}`}
        style={{
          transform: `translateX(${offsetX}px)`,
          transition: isSwiping ? 'none' : 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          zIndex: 1,
        }}
        onClick={() => { if (isOpen) handleClose() }}
      >
        <div className="flex items-stretch gap-0">
          {/* 왼쪽 컬러 바 */}
          <div
            className="w-1 flex-shrink-0 rounded-l-2xl"
            style={{ backgroundColor: color }}
          />

          <div className="flex-1 flex items-center gap-3 px-3 py-3">
            {/* 체크 버튼 */}
            <button
              onClick={(e) => { e.stopPropagation(); handleAction('complete') }}
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                memo.is_completed
                  ? 'bg-blue-600 border-blue-600'
                  : 'border-slate-500 active:border-blue-400'
              }`}
            >
              {memo.is_completed && <Check size={11} className="text-white" strokeWidth={3} />}
            </button>

            {/* 내용 */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className={`text-slate-100 font-medium text-sm ${memo.is_completed ? 'line-through' : ''}`}>
                  {memo.title}
                </p>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${badge.bg} ${badge.text}`}>
                  {PRIORITY_LABEL[memo.priority]}
                </span>
              </div>
              {memo.content && (
                <p className="text-muted text-xs mt-0.5 line-clamp-1">{memo.content}</p>
              )}
              {memo.scheduled_at && (
                <p className="text-muted text-xs mt-1">
                  {formatTime(memo.scheduled_at)}
                </p>
              )}
            </div>

            {/* 수정 아이콘 */}
            <button
              onClick={(e) => { e.stopPropagation(); onEdit() }}
              className="p-2 text-muted active:text-slate-200 rounded-xl transition-colors flex-shrink-0"
            >
              <Pencil size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
