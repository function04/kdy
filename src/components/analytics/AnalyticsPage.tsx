import { PageShell } from '@/components/layout/PageShell'
import { useAnalytics } from '@/hooks/useAnalytics'
import { formatDuration } from '@/lib/utils'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid,
} from 'recharts'

export function AnalyticsPage() {
  const { weekly, loading } = useAnalytics()

  const chartData = weekly.map((d) => ({
    day: format(new Date(d.date), 'E', { locale: ko }),
    공부: Math.round(d.studyMinutes / 60 * 10) / 10,
    운동: Math.round(d.exerciseMinutes / 60 * 10) / 10,
    기상: d.wakeTime ? parseInt(d.wakeTime.slice(11, 13)) + parseInt(d.wakeTime.slice(14, 16)) / 60 : null,
  }))

  const totalStudy = weekly.reduce((s, d) => s + d.studyMinutes, 0)
  const totalExercise = weekly.reduce((s, d) => s + d.exerciseMinutes, 0)
  const studyDays = weekly.filter((d) => d.studyMinutes > 0).length
  const exerciseDays = weekly.filter((d) => d.exerciseMinutes > 0).length

  return (
    <PageShell>
      <div className="px-4 pt-4 pb-2">
        <h2 className="text-lg font-semibold text-slate-100">분석</h2>
        <p className="text-muted text-sm mt-0.5">최근 7일</p>
      </div>

      {loading ? (
        <p className="text-muted text-sm text-center py-8">불러오는 중...</p>
      ) : (
        <div className="px-4 space-y-4">
          {/* 주간 인사이트 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-card border border-border rounded-2xl p-4">
              <p className="text-muted text-xs mb-1">📚 총 공부</p>
              <p className="text-slate-100 font-bold text-lg">{formatDuration(totalStudy)}</p>
              <p className="text-muted text-xs mt-1">{studyDays}일 기록</p>
            </div>
            <div className="bg-card border border-border rounded-2xl p-4">
              <p className="text-muted text-xs mb-1">💪 총 운동</p>
              <p className="text-slate-100 font-bold text-lg">{formatDuration(totalExercise)}</p>
              <p className="text-muted text-xs mt-1">{exerciseDays}일 기록</p>
            </div>
          </div>

          {/* 공부/운동 막대 차트 */}
          <div className="bg-card border border-border rounded-2xl p-4">
            <p className="text-sm font-medium text-slate-300 mb-4">일별 공부 / 운동 (시간)</p>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={chartData} barCategoryGap="30%">
                <XAxis dataKey="day" tick={{ fill: '#64748B', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} width={24} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: 8 }}
                  labelStyle={{ color: '#94A3B8' }}
                  itemStyle={{ color: '#E2E8F0' }}
                  formatter={(v: number) => [`${v}h`]}
                />
                <Bar dataKey="공부" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="운동" fill="#22C55E" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* 기상 시간 꺾은선 차트 */}
          <div className="bg-card border border-border rounded-2xl p-4">
            <p className="text-sm font-medium text-slate-300 mb-4">기상 시간 추세</p>
            <ResponsiveContainer width="100%" height={150}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="day" tick={{ fill: '#64748B', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fill: '#64748B', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={32}
                  domain={[4, 12]}
                  tickFormatter={(v) => `${v}시`}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: 8 }}
                  labelStyle={{ color: '#94A3B8' }}
                  formatter={(v: number) => [`${Math.floor(v)}:${String(Math.round((v % 1) * 60)).padStart(2, '0')}`]}
                />
                <Line
                  dataKey="기상"
                  stroke="#EAB308"
                  strokeWidth={2}
                  dot={{ fill: '#EAB308', r: 4 }}
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </PageShell>
  )
}
