import { useEffect, useState } from 'react'

export function SplashScreen({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<'enter' | 'hold' | 'exit'>('enter')

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('hold'), 50)
    const t2 = setTimeout(() => setPhase('exit'), 1400)
    const t3 = setTimeout(() => onDone(), 2000)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [onDone])

  const entering = phase === 'enter'
  const exiting = phase === 'exit'

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: '#2c2c2e',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        opacity: exiting ? 0 : 1,
        transition: exiting ? 'opacity 0.55s cubic-bezier(0.4,0,1,1)' : 'none',
      }}
    >
      {/* 배경 원형 glow */}
      <div style={{
        position: 'absolute',
        width: 280,
        height: 280,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
        transform: entering ? 'scale(0.6)' : exiting ? 'scale(1.4)' : 'scale(1)',
        opacity: entering ? 0 : exiting ? 0 : 1,
        transition: 'transform 0.9s cubic-bezier(0.34,1.56,0.64,1), opacity 0.9s ease',
      }} />

      {/* 텍스트 */}
      <p
        style={{
          position: 'relative',
          color: '#f0f0f0',
          fontSize: 28,
          fontWeight: 600,
          fontFamily: '-apple-system, "SF Pro Display", BlinkMacSystemFont, sans-serif',
          letterSpacing: '0.5px',
          opacity: entering ? 0 : exiting ? 0 : 1,
          transform: entering ? 'translateY(12px)' : exiting ? 'translateY(-8px)' : 'translateY(0)',
          transition: entering
            ? 'none'
            : exiting
            ? 'opacity 0.45s ease, transform 0.45s ease'
            : 'opacity 0.65s cubic-bezier(0.34,1.56,0.64,1), transform 0.65s cubic-bezier(0.34,1.56,0.64,1)',
          filter: entering ? 'blur(8px)' : exiting ? 'blur(4px)' : 'blur(0px)',
        }}
      >
        Just For Me
      </p>
    </div>
  )
}
