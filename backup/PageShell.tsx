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
        'min-h-full bg-background',
        !noHeader && 'pt-2',
        'pb-24',
        className
      )}
    >
      {children}
    </main>
  )
}
