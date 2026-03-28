import { useEffect, useState } from 'react'
import { useAppStore } from '@/stores/appStore'

export function Toast() {
  const { flashMessage, flashKey } = useAppStore()
  const [visible, setVisible] = useState(false)
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    if (!flashMessage) return
    setVisible(true)
    setExiting(false)

    const hideTimer = setTimeout(() => {
      setExiting(true)
      setTimeout(() => setVisible(false), 300)
    }, 2000)

    return () => clearTimeout(hideTimer)
  }, [flashMessage, flashKey])

  if (!visible || !flashMessage) return null

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 'calc(max(16px, env(safe-area-inset-bottom)) + 76px)',
        left: '50%',
        transform: 'translateX(-50%)',
        background: '#1C1C1F',
        border: '1px solid rgba(255,255,255,0.10)',
        borderRadius: 12,
        padding: '10px 20px',
        zIndex: 100,
        animation: exiting ? 'toastOut 0.3s ease forwards' : 'toastIn 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
      }}
    >
      <span className="text-[13px] text-[#EDEDEF] font-medium whitespace-nowrap">{flashMessage}</span>
    </div>
  )
}
