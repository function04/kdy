import { createContext, useContext, useEffect } from 'react'

const ThemeContext = createContext({})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    document.documentElement.classList.add('theme-light')
  }, [])
  return <ThemeContext.Provider value={{}}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  return useContext(ThemeContext)
}
