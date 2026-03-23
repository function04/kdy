import { useState } from 'react'
import { useWeather, getWeatherInfo } from '@/hooks/useWeather'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Sunrise, Sunset } from 'lucide-react'
import { Portal } from '@/lib/portal'

interface WeatherWidgetProps {
  lat: number
  lon: number
  city: string
}

export function WeatherWidget({ lat, lon, city }: WeatherWidgetProps) {
  const { weather, loading, error } = useWeather(lat, lon)
  const [expanded, setExpanded] = useState(false)

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-2xl p-4 animate-pulse">
        <div className="h-4 bg-slate-700 rounded w-1/3 mb-3" />
        <div className="h-10 bg-slate-700 rounded w-1/2 mb-3" />
        <div className="h-3 bg-slate-700 rounded w-2/3" />
      </div>
    )
  }

  if (error || !weather) {
    return (
      <div className="bg-card border border-border rounded-2xl p-4">
        <p className="text-muted text-sm text-center">날씨 정보를 불러올 수 없습니다</p>
      </div>
    )
  }

  const current = getWeatherInfo(weather.weatherCode)

  return (
    <>
      {/* 축소 카드 */}
      <button
        onClick={() => setExpanded(true)}
        className="w-full bg-card border border-border rounded-2xl p-4 text-left active:scale-[0.98] transition-transform"
      >
        <p className="text-muted text-xs mb-1">📍 {city}</p>
        <div className="flex items-center gap-2">
          <span className="text-5xl font-light text-slate-100">{weather.temperature}°</span>
          <span className="text-2xl">{current.icon}</span>
        </div>
        <p className="text-slate-300 text-sm mt-1">{current.label}</p>
        <p className="text-muted text-xs mt-1">
          최고 {weather.todayMax}° · 최저 {weather.todayMin}° · 습도 {weather.humidity}% · 바람 {weather.windspeed}km/h
        </p>
        <p className="text-muted text-xs mt-0.5">
          <span className="inline-flex items-center gap-1"><Sunrise size={11} /> {weather.sunrise}</span>
          {' · '}
          <span className="inline-flex items-center gap-1"><Sunset size={11} /> {weather.sunset}</span>
        </p>
      </button>

      {/* 확장 오버레이 */}
      {expanded && (
        <Portal>
          <div
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            style={{ animation: 'wFadeIn 0.25s ease forwards' }}
            onClick={() => setExpanded(false)}
          >
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <div
              className="relative w-full max-w-sm bg-card border border-border rounded-3xl overflow-hidden shadow-xl"
              style={{ animation: 'wExpand 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* 현재 날씨 */}
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-muted text-xs mb-1">📍 {city}</p>
                    <div className="flex items-end gap-2">
                      <span className="text-6xl font-light text-slate-100">{weather.temperature}°</span>
                      <span className="text-3xl mb-1">{current.icon}</span>
                    </div>
                    <p className="text-slate-300 text-sm mt-1">{current.label}</p>
                    <p className="text-muted text-xs mt-1">
                      최고 {weather.todayMax}° · 최저 {weather.todayMin}° · 습도 {weather.humidity}%
                    </p>
                    <p className="text-muted text-xs mt-0.5">바람 {weather.windspeed}km/h</p>
                    <p className="text-muted text-xs mt-0.5">
                      <span className="inline-flex items-center gap-1"><Sunrise size={11} /> {weather.sunrise}</span>
                      {' · '}
                      <span className="inline-flex items-center gap-1"><Sunset size={11} /> {weather.sunset}</span>
                    </p>
                  </div>
                  {weather.todayPrecipProb > 0 && (
                    <div className="text-right">
                      <p className="text-blue-400 text-2xl font-bold">{weather.todayPrecipProb}%</p>
                      <p className="text-muted text-xs">강수확률</p>
                    </div>
                  )}
                </div>
              </div>

              {/* 시간별 예보 */}
              {weather.hourly.length > 0 && (
                <div className="border-t border-border px-2 py-3">
                  <div className="flex gap-1 overflow-x-auto pb-1">
                    {weather.hourly.map((h) => {
                      const info = getWeatherInfo(h.code)
                      const hour = parseInt(h.time.slice(11, 13))
                      const label = hour === 0 ? '자정' : hour === 12 ? '정오' : `${hour}시`
                      return (
                        <div key={h.time} className="flex flex-col items-center gap-1 min-w-[44px] px-1">
                          <span className="text-muted text-[10px]">{label}</span>
                          <span className="text-sm">{info.icon}</span>
                          <span className="text-slate-200 text-xs font-medium">{h.temp}°</span>
                          {h.precipProb > 0 && (
                            <span className="text-blue-400 text-[10px]">{h.precipProb}%</span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* 3일 예보 */}
              <div className="border-t border-border divide-y divide-border">
                {weather.forecast.map((day) => {
                  const info = getWeatherInfo(day.weatherCode)
                  const label = format(new Date(day.date), 'M/d (eee)', { locale: ko })
                  return (
                    <div key={day.date} className="flex items-center justify-between px-5 py-3">
                      <span className="text-slate-300 text-sm w-20">{label}</span>
                      <span className="text-base">{info.icon}</span>
                      <div className="flex items-center gap-3">
                        {day.precipProbMax > 0 && (
                          <span className="text-blue-400 text-xs">{day.precipProbMax}%</span>
                        )}
                        <span className="text-muted text-xs">{day.minTemp}°</span>
                        <span className="text-slate-100 text-xs font-medium">{day.maxTemp}°</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
            <style>{`
              @keyframes wFadeIn { from{opacity:0} to{opacity:1} }
              @keyframes wExpand { from{opacity:0;transform:scale(0.85)} to{opacity:1;transform:scale(1)} }
            `}</style>
          </div>
        </Portal>
      )}
    </>
  )
}
