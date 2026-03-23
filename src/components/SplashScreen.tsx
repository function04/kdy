import { useEffect, useState } from 'react'

export function SplashScreen({ onDone }: { onDone: () => void }) {
  const [fading, setFading] = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => setFading(true), 1200)
    const t2 = setTimeout(() => onDone(), 1700)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [onDone])

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: '#1C1C1E',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        opacity: fading ? 0 : 1,
        transition: 'opacity 0.5s ease',
      }}
    >
      <p
        style={{
          color: '#F2F2F7',
          fontSize: 32,
          fontWeight: 700,
          fontFamily: '-apple-system, "SF Pro Display", "SF Pro Text", BlinkMacSystemFont, sans-serif',
          letterSpacing: '-1.2px',
          opacity: fading ? 0 : 1,
          transform: fading ? 'scale(0.94)' : 'scale(1)',
          transition: 'opacity 0.5s ease, transform 0.5s ease',
        }}
      >
        Just For Me
      </p>
    </div>
  )
}
