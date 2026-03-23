import { useWeather, getWeatherInfo } from '@/hooks/useWeather'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

interface WeatherWidgetProps {
  lat: number
  lon: number
  city: string
}

export function WeatherWidget({ lat, lon, city }: WeatherWidgetProps) {
  const { weather, loading, error } = useWeather(lat, lon)

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
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      {/* 현재 날씨 */}
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-muted text-xs mb-1">📍 {city}</p>
            <div className="flex items-end gap-2">
              <span className="text-5xl font-light text-slate-100">{weather.temperature}°</span>
              <span className="text-2xl mb-1">{current.icon}</span>
            </div>
            <p className="text-slate-300 text-sm mt-1">{current.label}</p>
            <p className="text-muted text-xs mt-1">
              최고 {weather.todayMax}° · 최저 {weather.todayMin}° · 습도 {weather.humidity}% · 바람 {weather.windspeed}km/h
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
                <div key={h.time} className="flex flex-col items-center gap-1 min-w-[48px] px-1">
                  <span className="text-muted text-[10px]">{label}</span>
                  <span className="text-base">{info.icon}</span>
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
            <div key={day.date} className="flex items-center justify-between px-4 py-2.5">
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
  )
}
