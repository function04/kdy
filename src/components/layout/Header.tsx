import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

interface HeaderProps {
  displayName?: string
}

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 6)  return '깊은 밤이에요'
  if (hour < 12) return '좋은 아침이에요'
  if (hour < 18) return '좋은 오후예요'
  if (hour < 22) return '좋은 저녁이에요'
  return '편안한 밤이에요'
}

export function Header({ displayName }: HeaderProps) {
  const today = format(new Date(), 'M월 d일 (eee)', { locale: ko })

  return (
    <div className="px-4 pt-4 pb-2">
      <p className="text-muted text-sm">{today}</p>
      <h1 className="text-xl font-semibold text-slate-100 mt-0.5">
        {getGreeting()}{displayName ? `, ${displayName}` : ''}
      </h1>
    </div>
  )
}
