"use client"

import { useEffect, useState } from "react"

interface WeatherData {
  condition: string
  temperature: number
  humidity: number
  windSpeed: number
  location: string
}

interface WeatherDisplayProps {
  location: string
  date?: string
  fallbackData?: WeatherData
}

export function WeatherDisplay({ location, date, fallbackData }: WeatherDisplayProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!location) {
      setLoading(false)
      return
    }

    const fetchWeather = async () => {
      try {
        setLoading(true)
        setError(null)

        // Use the OpenWeather API with the environment variable
        const apiKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY

        if (!apiKey) {
          throw new Error("OpenWeather API key is not configured")
        }

        const response = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
            location,
          )}&units=imperial&appid=${apiKey}`,
        )

        if (!response.ok) {
          throw new Error("Failed to fetch weather data")
        }

        const data = await response.json()

        setWeather({
          condition: data.weather[0].main,
          temperature: Math.round(data.main.temp),
          humidity: data.main.humidity,
          windSpeed: Math.round(data.wind.speed),
          location: `${data.name}, ${data.sys.country}`,
        })
      } catch (err) {
        console.error("Error fetching weather:", err)
        setError("Could not load weather data")

        // Use fallback data if provided
        if (fallbackData) {
          setWeather(fallbackData)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchWeather()
  }, [location, fallbackData])

  // If loading, show a loading spinner
  if (loading) {
    return (
      <div className="flex justify-center items-center p-4">
        <span className="loading loading-spinner loading-md"></span>
      </div>
    )
  }

  // If there's an error and no fallback data, show the error
  if (error && !weather) {
    return (
      <div className="alert alert-warning">
        <i className="fas fa-exclamation-triangle"></i>
        <span>{error}</span>
      </div>
    )
  }

  // If we have weather data (either from API or fallback), show it
  if (weather) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium">{weather.location}</h3>
            {date && <p className="text-sm text-base-content/70">{new Date(date).toLocaleDateString()}</p>}
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{weather.temperature}°F</div>
            <div className="text-base-content/70">{weather.condition}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center">
            <i className="fas fa-tint text-blue-500 mr-2"></i>
            <span>Humidity: {weather.humidity}%</span>
          </div>
          <div className="flex items-center">
            <i className="fas fa-wind text-gray-500 mr-2"></i>
            <span>Wind: {weather.windSpeed} mph</span>
          </div>
        </div>

        <div className="flex justify-center">{getWeatherIcon(weather.condition)}</div>
      </div>
    )
  }

  // Fallback if no data and no error
  return (
    <div className="alert alert-info">
      <i className="fas fa-info-circle"></i>
      <span>No weather data available</span>
    </div>
  )
}

// Helper function to get the appropriate weather icon
function getWeatherIcon(condition: string) {
  const iconSize = "text-5xl"

  switch (condition.toLowerCase()) {
    case "clear":
      return <i className={`fas fa-sun text-yellow-500 ${iconSize}`}></i>
    case "clouds":
    case "cloudy":
      return <i className={`fas fa-cloud text-gray-400 ${iconSize}`}></i>
    case "rain":
    case "drizzle":
      return <i className={`fas fa-cloud-rain text-blue-400 ${iconSize}`}></i>
    case "thunderstorm":
      return <i className={`fas fa-bolt text-yellow-400 ${iconSize}`}></i>
    case "snow":
      return <i className={`fas fa-snowflake text-blue-200 ${iconSize}`}></i>
    case "mist":
    case "fog":
      return <i className={`fas fa-smog text-gray-300 ${iconSize}`}></i>
    default:
      return <i className={`fas fa-cloud-sun text-yellow-400 ${iconSize}`}></i>
  }
}
