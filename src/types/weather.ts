export interface WeatherData {
  temperature: number
  weatherCode: number
  windspeed: number
  forecast: ForecastDay[]
}

export interface ForecastDay {
  date: string
  maxTemp: number
  minTemp: number
  weatherCode: number
}
