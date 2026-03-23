import { useState } from 'react'
import { PageShell } from '@/components/layout/PageShell'
import { useAnalytics, type DaySummary } from '@/hooks/useAnalytics'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { X } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

function fmtTime(iso: string | null) {
  if (!iso) return '-'
  return format(new Date(iso), 'HH:mm')
}

function sleepMinutes(d: DaySummary): number | null {
  if (!d.sleepTime || !d.wakeTime) return null
  const sleep = new Date(d.sleepTime)
  const wake = new Date(d.wakeTime)
  let diff = (wake.getTime() - sleep.getTime()) / 60000
  if (diff < 0) diff += 24 * 60
  return diff > 0 && diff < 24 * 60 ? diff : null
}

function fmtDuration(min: number) {
  const h = Math.floor(min / 60)
  const m = Math.round(min % 60)
  if (h === 0) return `${m}분`
  if (m === 0) return `${h}시간`
  return `${h}시간 ${m}분`
}

function fmtHours(min: number) {
  return min > 0 ? (min / 60).toFixed(1) + 'h' : '-'
}

function ExpandModal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ animation: 'wFadeIn 0.2s ease forwards' }}
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-sm bg-card border border-border rounded-3xl overflow-hidden shadow-xl"
        style={{ animation: 'wExpand 0.28s cubic-bezier(0.34,1.56,0.64,1) forwards', maxHeight: '80vh' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <p className="font-semibold text-slate-100">{title}</p>
          <button onClick={onClose} className="text-muted"><X size={18} /></button>
        </div>
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(80vh - 60px)' }}>
          {children}
        </div>
      </div>
      <style>{`
        @keyframes wFadeIn { from{opacity:0} to{opacity:1} }
        @keyframes wExpand { from{opacity:0;transform:scale(0.88)} to{opacity:1;transform:scale(1)} }
      `}</style>
    </div>
  )
}

export function AnalyticsPage() {
  const { weekly, monthly, loading } = useAnalytics()
  const [showActivity, setShowActivity] = useState(false)
  const [showSleep, setShowSleep] = useState(false)

  const weeklySleep = weekly.map(d => ({
    day: format(new Date(d.date), 'E', { locale: ko }),
    date: d.date,
    sleep: fmtTime(d.sleepTime),
    wake: fmtTime(d.wakeTime),
    duration: sleepMinutes(d),
  }))

  const validSleep = weeklySleep.filter(d => d.duration !== null)
  const avgSleep = validSleep.length > 0
    ? validSleep.reduce((s, d) => s + (d.duration ?? 0), 0) / validSleep.length
    : null

  const monthlyChart = monthly.map(d => ({
    day: format(new Date(d.date), 'M/d'),
    공부: Math.round(d.studyMinutes / 6) / 10,
    운동: Math.round(d.exerciseMinutes / 6) / 10,
  }))

  const monthlyValidSleep = monthly.map(d => sleepMinutes(d)).filter(Boolean) as number[]
  const monthlyAvgSleep = monthlyValidSleep.length > 0
    ? monthlyValidSleep.reduce((a, b) => a + b, 0) / monthlyValidSleep.length
    : null

  if (loading) {
    return (
      <PageShell>
        <p className="text-muted text-sm text-center py-16">불러오는 중...</p>
      </PageShell>
    )
  }

  return (
    <PageShell>
      <div className="px-4 pt-4 pb-3">
        <h2 className="text-lg font-semibold text-slate-100">분석</h2>
      </div>

      <div className="px-4 space-y-3">

        {/* 이번주 활동 — 표 형식 */}
        <button
          onClick={() => setShowActivity(true)}
          className="w-full bg-card border border-border rounded-2xl text-left active:scale-[0.98] transition-transform overflow-hidden"
        >
          {/* 헤더 */}
          <div className="flex items-center px-4 pt-4 pb-2 justify-between">
            <p className="text-xs text-muted">이번주 활동</p>
            <div className="flex gap-3">
              <span className="flex items-center gap-1 text-[10px] text-muted">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" />공부
              </span>
              <span className="flex items-center gap-1 text-[10px] text-muted">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />운동
              </span>
            </div>
          </div>

          {/* 표 헤더 */}
          <div className="flex border-t border-border">
            <div className="w-8" />
            {weekly.map(d => (
              <div key={d.date} className="flex-1 text-center py-1.5">
                <span className="text-[10px] text-muted">{format(new Date(d.date), 'E', { locale: ko })}</span>
              </div>
            ))}
          </div>

          {/* 공부 행 */}
          <div className="flex border-t border-border">
            <div className="w-8 flex items-center justify-center">
              <span className="text-[10px] text-blue-400 font-medium">공부</span>
            </div>
            {weekly.map(d => (
              <div key={d.date} className="flex-1 flex flex-col items-center justify-center py-2 gap-1">
                <div className="w-full px-1">
                  <div
                    className="rounded-sm bg-blue-500/20 mx-auto"
                    style={{
                      height: 32,
                      display: 'flex',
                      alignItems: 'flex-end',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      className="w-full bg-blue-500 rounded-sm"
                      style={{ height: `${Math.min(100, (d.studyMinutes / 180) * 100)}%`, minHeight: d.studyMinutes > 0 ? 2 : 0 }}
                    />
                  </div>
                </div>
                <span className="text-[9px] text-muted">{fmtHours(d.studyMinutes)}</span>
              </div>
            ))}
          </div>

          {/* 운동 행 */}
          <div className="flex border-t border-border pb-3">
            <div className="w-8 flex items-center justify-center">
              <span className="text-[10px] text-green-400 font-medium">운동</span>
            </div>
            {weekly.map(d => (
              <div key={d.date} className="flex-1 flex flex-col items-center justify-center py-2 gap-1">
                <div className="w-full px-1">
                  <div
                    className="rounded-sm bg-green-500/20 mx-auto"
                    style={{ height: 32, display: 'flex', alignItems: 'flex-end', overflow: 'hidden' }}
                  >
                    <div
                      className="w-full bg-green-500 rounded-sm"
                      style={{ height: `${Math.min(100, (d.exerciseMinutes / 90) * 100)}%`, minHeight: d.exerciseMinutes > 0 ? 2 : 0 }}
                    />
                  </div>
                </div>
                <span className="text-[9px] text-muted">{fmtHours(d.exerciseMinutes)}</span>
              </div>
            ))}
          </div>

          <p className="text-[10px] text-muted text-right px-4 pb-3">눌러서 한달 보기 →</p>
        </button>

        {/* 이번주 수면 — 표 형식 */}
        <button
          onClick={() => setShowSleep(true)}
          className="w-full bg-card border border-border rounded-2xl text-left active:scale-[0.98] transition-transform overflow-hidden"
        >
          <div className="flex items-center px-4 pt-4 pb-2 justify-between">
            <p className="text-xs text-muted">이번주 수면</p>
            {avgSleep !== null && (
              <p className="text-xs text-purple-400 font-medium">평균 {fmtDuration(avgSleep)}</p>
            )}
          </div>

          {/* 표 헤더 */}
          <div className="flex border-t border-border">
            <div className="w-10" />
            {weeklySleep.map(d => (
              <div key={d.date} className="flex-1 text-center py-1.5">
                <span className="text-[10px] text-muted">{d.day}</span>
              </div>
            ))}
          </div>

          {/* 취침 행 */}
          <div className="flex border-t border-border">
            <div className="w-10 flex items-center justify-center px-1">
              <span className="text-[9px] text-muted leading-tight text-center">취침</span>
            </div>
            {weeklySleep.map(d => (
              <div key={d.date} className="flex-1 flex items-center justify-center py-2">
                <span className="text-[10px] text-slate-300">{d.sleep}</span>
              </div>
            ))}
          </div>

          {/* 수면시간 행 */}
          <div className="flex border-t border-border bg-purple-500/5">
            <div className="w-10 flex items-center justify-center px-1">
              <span className="text-[9px] text-purple-400 leading-tight text-center">시간</span>
            </div>
            {weeklySleep.map(d => (
              <div key={d.date} className="flex-1 flex items-center justify-center py-2">
                <span className="text-[10px] font-medium text-purple-300">
                  {d.duration ? `${Math.floor(d.duration / 60)}h${Math.round(d.duration % 60) > 0 ? Math.round(d.duration % 60) + 'm' : ''}` : '-'}
                </span>
              </div>
            ))}
          </div>

          {/* 기상 행 */}
          <div className="flex border-t border-border pb-3">
            <div className="w-10 flex items-center justify-center px-1">
              <span className="text-[9px] text-muted leading-tight text-center">기상</span>
            </div>
            {weeklySleep.map(d => (
              <div key={d.date} className="flex-1 flex items-center justify-center py-2">
                <span className="text-[10px] text-slate-300">{d.wake}</span>
              </div>
            ))}
          </div>

          <p className="text-[10px] text-muted text-right px-4 pb-3">눌러서 한달 보기 →</p>
        </button>
      </div>

      {/* 활동 한달 모달 */}
      {showActivity && (
        <ExpandModal title="한달 활동" onClose={() => setShowActivity(false)}>
          <div className="px-5 pb-5">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthlyChart} barCategoryGap="20%" margin={{ top: 4, right: 0, left: -24, bottom: 0 }}>
                <XAxis dataKey="day" tick={{ fill: 'var(--color-muted)', fontSize: 9 }} axisLine={false} tickLine={false} interval={6} />
                <YAxis tick={{ fill: 'var(--color-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 12 }}
                  formatter={(v: number) => [`${v}h`]}
                />
                <Bar dataKey="공부" fill="#3B82F6" radius={[2, 2, 0, 0]} />
                <Bar dataKey="운동" fill="#22C55E" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="flex gap-3 mt-1">
              <span className="flex items-center gap-1 text-xs text-muted"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />공부</span>
              <span className="flex items-center gap-1 text-xs text-muted"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" />운동</span>
            </div>
          </div>
        </ExpandModal>
      )}

      {/* 수면 한달 모달 */}
      {showSleep && (
        <ExpandModal title="한달 수면" onClose={() => setShowSleep(false)}>
          <div className="px-5 pb-5 space-y-1">
            {monthlyAvgSleep !== null && (
              <p className="text-sm text-purple-400 font-medium mb-3">30일 평균 {fmtDuration(monthlyAvgSleep)}</p>
            )}
            {monthly.slice().reverse().map(d => {
              const dur = sleepMinutes(d)
              return (
                <div key={d.date} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <span className="text-xs text-muted w-16">{format(new Date(d.date), 'M/d (E)', { locale: ko })}</span>
                  <span className="text-xs text-slate-300 flex-1 text-center">
                    {fmtTime(d.sleepTime)} → {fmtTime(d.wakeTime)}
                  </span>
                  <span className="text-xs text-purple-400 w-16 text-right font-medium">
                    {dur ? fmtDuration(dur) : '-'}
                  </span>
                </div>
              )
            })}
          </div>
        </ExpandModal>
      )}
    </PageShell>
  )
}
