import { PageShell } from '@/components/layout/PageShell'

export function SchedulePage() {
  return (
    <PageShell>
      <div className="px-4 py-4">
        <h2 className="text-lg font-semibold text-slate-100 mb-4">일정 / 메모</h2>
        {/* Phase 5에서 구현 예정 */}
        <div className="bg-card border border-border rounded-2xl p-4">
          <p className="text-muted text-sm text-center py-8">
            메모와 일정이 여기에 표시됩니다
          </p>
        </div>
      </div>
    </PageShell>
  )
}
