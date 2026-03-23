import { useEffect, useState } from 'react'
import type { WeatherData, ForecastDay } from '@/types/weather'

const WMO_CODES: Record<number, { label: string; icon: string }> = {
  0:  { label: '맑음', icon: '☀️' },
  1:  { label: '대체로 맑음', icon: '🌤️' },
  2:  { label: '부분적으로 흐림', icon: '⛅' },
  3:  { label: '흐림', icon: '☁️' },
  45: { label: '안개', icon: '🌫️' },
  48: { label: '안개', icon: '🌫️' },
  51: { label: '가벼운 이슬비', icon: '🌦️' },
  53: { label: '이슬비', icon: '🌦️' },
  55: { label: '강한 이슬비', icon: '🌧️' },
  61: { label: '가벼운 비', icon: '🌧️' },
  63: { label: '비', icon: '🌧️' },
  65: { label: '강한 비', icon: '🌧️' },
  71: { label: '가벼운 눈', icon: '🌨️' },
  73: { label: '눈', icon: '❄️' },
  75: { label: '강한 눈', icon: '❄️' },
  80: { label: '소나기', icon: '🌦️' },
  81: { label: '소나기', icon: '🌧️' },
  82: { label: '강한 소나기', icon: '⛈️' },
  95: { label: '뇌우', icon: '⛈️' },
  96: { label: '우박 동반 뇌우', icon: '⛈️' },
  99: { label: '우박 동반 뇌우', icon: '⛈️' },
}

export function getWeatherInfo(code: number) {
  return WMO_CODES[code] ?? { label: '알 수 없음', icon: '🌡️' }
}

export function useWeather(lat: number, lon: number) {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    async function fetchWeather() {
      try {
        const url = [
          `https://api.open-meteo.com/v1/forecast`,
          `?latitude=${lat}&longitude=${lon}`,
          `&current=temperature_2m,weather_code,windspeed_10m,relative_humidity_2m`,
          `&hourly=temperature_2m,weather_code,precipitation_probability`,
          `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset`,
          `&timezone=Asia%2FSeoul&forecast_days=4`,
        ].join('')

        const res = await window.fetch(url)
        const data = await res.json()

        // 시간별 데이터 (오늘 현재 시각 기준 앞뒤 12시간)
        const now = new Date()
        const currentHour = now.getHours()
        const hourlyTimes: string[] = data.hourly.time
        const todayPrefix = now.toISOString().slice(0, 10)

        const hourly = hourlyTimes
          .map((t, i) => ({
            time: t,
            temp: Math.round(data.hourly.temperature_2m[i]),
            code: data.hourly.weather_code[i],
            precipProb: data.hourly.precipitation_probability[i],
          }))
          .filter((h) => {
            if (!h.time.startsWith(todayPrefix)) return false
            const hour = parseInt(h.time.slice(11, 13))
            return hour >= currentHour && hour <= currentHour + 11
          })
          .slice(0, 12)

        const forecast: ForecastDay[] = data.daily.time.slice(1, 4).map((date: string, i: number) => ({
          date,
          maxTemp: Math.round(data.daily.temperature_2m_max[i + 1]),
          minTemp: Math.round(data.daily.temperature_2m_min[i + 1]),
          weatherCode: data.daily.weather_code[i + 1],
          precipProbMax: data.daily.precipitation_probability_max[i + 1],
        }))

        setWeather({
          temperature: Math.round(data.current.temperature_2m),
          weatherCode: data.current.weather_code,
          windspeed: Math.round(data.current.windspeed_10m),
          humidity: data.current.relative_humidity_2m,
          todayMax: Math.round(data.daily.temperature_2m_max[0]),
          todayMin: Math.round(data.daily.temperature_2m_min[0]),
          todayPrecipProb: data.daily.precipitation_probability_max[0],
          hourly,
          forecast,
        })
      } catch {
        setError(true)
      } finally {
        setLoading(false)
      }
    }
    fetchWeather()
  }, [lat, lon])

  return { weather, loading, error }
}
