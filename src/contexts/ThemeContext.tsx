import { createContext, useContext, useEffect, useState } from 'react'

export type ThemeMode = 'dark' | 'light' | 'system'

interface ThemeContextValue {
  mode: ThemeMode
  setMode: (mode: ThemeMode) => void
}

const ThemeContext = createContext<ThemeContextValue>({
  mode: 'dark',
  setMode: () => {},
})

function applyTheme(m: ThemeMode) {
  const isLight =
    m === 'light' ||
    (m === 'system' && window.matchMedia('(prefers-color-scheme: light)').matches)
  document.documentElement.classList.toggle('theme-light', isLight)
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(
    () => (localStorage.getItem('theme') as ThemeMode) ?? 'dark'
  )

  function setMode(m: ThemeMode) {
    localStorage.setItem('theme', m)
    setModeState(m)
    applyTheme(m)
  }

  useEffect(() => {
    applyTheme(mode)
    if (mode === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      const handler = () => applyTheme('system')
      mq.addEventListener('change', handler)
      return () => mq.removeEventListener('change', handler)
    }
  }, [mode])

  return (
    <ThemeContext.Provider value={{ mode, setMode }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
