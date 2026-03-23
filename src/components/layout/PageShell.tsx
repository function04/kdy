import { cn } from '@/lib/utils'

interface PageShellProps {
  children: React.ReactNode
  className?: string
  noHeader?: boolean
}

export function PageShell({ children, className, noHeader }: PageShellProps) {
  return (
    <main
      className={cn(
        'min-h-screen bg-background',
        !noHeader && 'pt-2',
        'pb-20', // 하단 네비게이션 공간
        className
      )}
    >
      {children}
    </main>
  )
}
