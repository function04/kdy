import { useState, useRef, useEffect } from 'react'
import type { Memo } from '@/types/memo'
import { formatTime } from '@/lib/utils'
import { Trash2, Pencil, Check, RotateCcw } from 'lucide-react'

interface MemoCardProps {
  memo: Memo
  onToggle: () => void
  onEdit: () => void
  onDelete: () => void
}

const PRIORITY_LABEL = ['Low', 'Medium', 'High']

const PRIORITY_COLOR: Record<number, string> = {
  0: '#4ADE80',
  1: '#FBBF24',
  2: '#F87171',
}

const ACTION_WIDTH = 120

export function MemoCard({ memo, onToggle, onEdit, onDelete }: MemoCardProps) {
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
      const finalX = val < -ACTION_WIDTH * 0.35 ? -ACTION_WIDTH : 0
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
    return <div className="transition-all duration-250" style={{ maxHeight: 0, opacity: 0, marginBottom: 0 }} />
  }

  const isOpen = offsetX < -10
  const isSwiping = swipingRef.current

  return (
    <div ref={containerRef} className="relative" style={{ overflow: 'hidden', borderRadius: 14 }}>
      {/* 뒤쪽 액션 — 아이콘만, 깔끔하게 */}
      <div
        className="absolute right-0 top-0 bottom-0 flex items-center justify-end gap-3 pr-4"
        style={{ width: ACTION_WIDTH }}
      >
        <button
          onClick={() => handleAction('complete')}
          className="w-10 h-10 rounded-full flex items-center justify-center active:scale-90 transition-transform"
          style={{ background: memo.is_completed ? 'rgba(217,119,6,0.15)' : 'rgba(74,222,128,0.12)' }}
        >
          {memo.is_completed
            ? <RotateCcw size={16} style={{ color: '#FBBF24' }} />
            : <Check size={16} style={{ color: '#4ADE80' }} strokeWidth={2.5} />
          }
        </button>
        <button
          onClick={() => handleAction('delete')}
          className="w-10 h-10 rounded-full flex items-center justify-center active:scale-90 transition-transform"
          style={{ background: 'rgba(248,113,113,0.12)' }}
        >
          <Trash2 size={16} style={{ color: '#F87171' }} />
        </button>
      </div>

      {/* 메인 카드 */}
      <div
        className={`relative ${memo.is_completed ? 'opacity-40' : ''}`}
        style={{
          background: '#141416',
          borderRadius: 14,
          border: '1px solid rgba(255,255,255,0.06)',
          transform: `translateX(${offsetX}px)`,
          transition: isSwiping ? 'none' : 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          zIndex: 1,
        }}
        onClick={() => { if (isOpen) handleClose() }}
      >
        <div className="flex items-center gap-3 px-4 py-3.5">
          {/* 우선순위 컬러 도트 */}
          <div className="w-[6px] h-[6px] rounded-full flex-shrink-0" style={{ backgroundColor: `${color}80` }} />

          {/* 내용 */}
          <div className="flex-1 min-w-0">
            <p className={`text-[14px] font-medium text-[#EDEDEF] truncate ${memo.is_completed ? 'line-through' : ''}`}>
              {memo.title}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[11px] font-medium" style={{ color: `${color}90` }}>
                {PRIORITY_LABEL[memo.priority]}
              </span>
              {memo.content && (
                <>
                  <span className="text-[#5C5C66]/30">·</span>
                  <p className="text-[11px] text-[#5C5C66] truncate">{memo.content}</p>
                </>
              )}
            </div>
          </div>

          {/* 오른쪽: 시간 + 편집 */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {memo.scheduled_at && (
              <span className="text-[12px] text-[#A0A0A8] font-mono tabular-nums">
                {formatTime(memo.scheduled_at)}
              </span>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); onEdit() }}
              className="p-1.5 text-[#5C5C66] active:text-[#A0A0A8] transition-colors"
            >
              <Pencil size={12} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
