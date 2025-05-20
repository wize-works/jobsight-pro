"use client"

import { useState, useEffect } from "react"

interface WeatherData {
  temperature: number
  description: string
  city: string
  country: string
  icon: string
}

export function WeatherDisplay({ city }: { city: string }) {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchWeather = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/weather?city=${city}`)

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`)
        }

        const data = await response.json()
        setWeatherData({
          temperature: data.main.temp,
          description: data.weather[0].description,
          city: data.name,
          country: data.sys.country,
          icon: data.weather[0].icon,
        })
      } catch (e: any) {
        setError(e.message)
        setWeatherData(null)
      } finally {
        setLoading(false)
      }
    }

    fetchWeather()
  }, [city])

  if (loading) {
    return <p>Loading weather data...</p>
  }

  if (error) {
    return <p>Error: {error}</p>
  }

  if (!weatherData) {
    return <p>No weather data available.</p>
  }

  return (
    <div>
      <h2>
        Weather in {weatherData.city}, {weatherData.country}
      </h2>
      <img src={`https://openweathermap.org/img/wn/${weatherData.icon}@2x.png`} alt={weatherData.description} />
      <p>Temperature: {weatherData.temperature}°C</p>
      <p>Description: {weatherData.description}</p>
    </div>
  )
}
