export interface HourlyWeather {
  time: string
  temp: number
  code: number
  precipProb: number
}

export interface ForecastDay {
  date: string
  maxTemp: number
  minTemp: number
  weatherCode: number
  precipProbMax: number
}

export interface WeatherData {
  temperature: number
  weatherCode: number
  windspeed: number
  humidity: number
  todayMax: number
  todayMin: number
  todayPrecipProb: number
  hourly: HourlyWeather[]
  forecast: ForecastDay[]
}
