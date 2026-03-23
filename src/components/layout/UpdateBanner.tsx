import { useRegisterSW } from 'virtual:pwa-register/react'
import { Portal } from '@/lib/portal'

export function UpdateBanner() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  if (!needRefresh) return null

  return (
    <Portal>
      <div
        style={{
          position: 'fixed',
          top: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9999,
          animation: 'updateBannerIn 0.3s cubic-bezier(0.34,1.4,0.64,1) forwards',
          whiteSpace: 'nowrap',
        }}
      >
        <button
          onClick={() => updateServiceWorker(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'rgba(30,30,32,0.92)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '0.5px solid rgba(255,255,255,0.15)',
            borderRadius: 14,
            padding: '8px 16px',
            cursor: 'pointer',
          }}
        >
          <span style={{ fontSize: 13, color: '#e2e8f0', fontWeight: 600 }}>업데이트 확인</span>
          <span style={{ fontSize: 11, color: '#94a3b8' }}>탭하여 새로고침</span>
        </button>
        <style>{`
          @keyframes updateBannerIn {
            from { opacity: 0; transform: translateX(-50%) translateY(-8px) scale(0.92); }
            to   { opacity: 1; transform: translateX(-50%) translateY(0)   scale(1); }
          }
        `}</style>
      </div>
    </Portal>
  )
}
