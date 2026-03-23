import { PageShell } from '@/components/layout/PageShell'
import { Header } from '@/components/layout/Header'
import { useAuth } from '@/hooks/useAuth'

export function DashboardPage() {
  const { profile } = useAuth()

  return (
    <PageShell>
      <Header displayName={profile?.display_name ?? profile?.username} />
      <div className="px-4 py-2 space-y-4">
        {/* Phase 4에서 위젯들 추가 예정 */}
        <div className="bg-card border border-border rounded-2xl p-4">
          <p className="text-muted text-sm text-center py-8">
            날씨 위젯이 여기에 표시됩니다
          </p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4">
          <p className="text-muted text-sm text-center py-8">
            빠른 활동 버튼이 여기에 표시됩니다
          </p>
        </div>
      </div>
    </PageShell>
  )
}
