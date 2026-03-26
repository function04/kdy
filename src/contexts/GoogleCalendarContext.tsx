import { createContext, useContext, type ReactNode } from 'react'
import { useGoogleCalendar } from '@/hooks/useGoogleCalendar'

type GCalContextType = ReturnType<typeof useGoogleCalendar>

const GCalContext = createContext<GCalContextType | null>(null)

export function GoogleCalendarProvider({ children }: { children: ReactNode }) {
  const gcal = useGoogleCalendar()
  return <GCalContext.Provider value={gcal}>{children}</GCalContext.Provider>
}

export function useGCal() {
  const ctx = useContext(GCalContext)
  if (!ctx) throw new Error('useGCal must be used within GoogleCalendarProvider')
  return ctx
}
