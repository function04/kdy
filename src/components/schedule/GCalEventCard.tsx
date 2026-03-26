import { formatTime } from '@/lib/utils'
import { Trash2, ExternalLink } from 'lucide-react'
import type { GCalEvent } from '@/hooks/useGoogleCalendar'

interface GCalEventCardProps {
  event: GCalEvent
  onDelete: () => void
}

function formatEventTime(event: GCalEvent) {
  const start = event.start.dateTime || event.start.date || ''
  if (event.start.date && !event.start.dateTime) return '종일'

  const d = new Date(start)
  const month = d.getMonth() + 1
  const day = d.getDate()
  const dayNames = ['일', '월', '화', '수', '목', '금', '토']
  const dayName = dayNames[d.getDay()]

  return `${month}/${day} (${dayName}) ${formatTime(start)}`
}

function getEventColor(colorId?: string) {
  const colors: Record<string, string> = {
    '1': '#7986CB', '2': '#33B679', '3': '#8E24AA', '4': '#E67C73',
    '5': '#F6BF26', '6': '#F4511E', '7': '#039BE5', '8': '#616161',
    '9': '#3F51B5', '10': '#0B8043', '11': '#D50000',
  }
  return colors[colorId || ''] || '#4285F4'
}

export function GCalEventCard({ event, onDelete }: GCalEventCardProps) {
  const color = getEventColor(event.colorId)

  return (
    <div
      className="bg-card rounded-2xl border border-border"
    >
      <div className="flex items-center gap-2 px-4 py-3">
        <div className="w-1 h-10 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
        <div className="flex-1 min-w-0">
          <p className="text-slate-100 font-medium text-sm truncate">{event.summary}</p>
          <p className="text-muted text-xs mt-0.5">{formatEventTime(event)}</p>
          {event.description && (
            <p className="text-muted text-xs mt-0.5 line-clamp-1">{event.description}</p>
          )}
        </div>
        <div className="flex items-center gap-0.5 flex-shrink-0">
          {event.htmlLink && (
            <a
              href={event.htmlLink}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-muted active:text-slate-200 rounded-xl transition-colors"
            >
              <ExternalLink size={14} />
            </a>
          )}
          <button
            onClick={onDelete}
            className="p-2 text-muted/60 active:text-red-400 rounded-xl transition-colors"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
