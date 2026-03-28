import { format } from 'date-fns'

interface HeaderProps {
  displayName?: string
}

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 6)  return 'Good Night'
  if (hour < 12) return 'Good Morning'
  if (hour < 18) return 'Good Afternoon'
  if (hour < 22) return 'Good Evening'
  return 'Good Night'
}

export function Header({ displayName }: HeaderProps) {
  const today = format(new Date(), 'EEE, MMM d')

  return (
    <div className="px-4 pt-4 pb-2">
      <p className="text-muted text-sm">{today}</p>
      <h1 className="text-xl font-semibold text-slate-100 mt-0.5">
        {getGreeting()}{displayName ? `, ${displayName}` : ''}
      </h1>
    </div>
  )
}
