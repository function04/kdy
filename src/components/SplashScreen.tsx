import { useEffect, useState } from 'react'

export function SplashScreen({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<'enter' | 'hold' | 'exit'>('enter')

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('hold'), 50)
    const t2 = setTimeout(() => setPhase('exit'), 1600)
    const t3 = setTimeout(() => onDone(), 2200)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [onDone])

  const entering = phase === 'enter'
  const exiting = phase === 'exit'

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: '#0A0A0B',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        opacity: exiting ? 0 : 1,
        transition: exiting ? 'opacity 0.5s cubic-bezier(0.4,0,1,1)' : 'none',
      }}
    >
      {/* 텍스트 */}
      <p
        style={{
          position: 'relative',
          color: '#EDEDEF',
          fontSize: 26,
          fontWeight: 700,
          fontFamily: "'Pretendard Variable', Pretendard, -apple-system, sans-serif",
          letterSpacing: '-0.5px',
          opacity: entering ? 0 : exiting ? 0 : 1,
          transform: entering
            ? 'scale(0.9)'
            : exiting
            ? 'scale(1.1)'
            : 'scale(1)',
          transition: entering
            ? 'none'
            : exiting
            ? 'opacity 0.4s ease, transform 0.4s ease, filter 0.4s ease'
            : 'opacity 0.7s cubic-bezier(0.22,1,0.36,1), transform 0.7s cubic-bezier(0.22,1,0.36,1), filter 0.7s ease',
          filter: entering ? 'blur(10px)' : exiting ? 'blur(6px)' : 'blur(0px)',
        }}
      >
        Just For Me
      </p>
    </div>
  )
}
