"use client";

import React, { useEffect, useState } from "react";
import { useCurrentPosition } from "@/hooks/use-geolocation";

interface WeatherData {
    current: {
        temperature: number;
        condition: string;
        icon: string;
        humidity: number;
        windSpeed: number;
    };
    forecast: Array<{
        date: string;
        high: number;
        low: number;
        condition: string;
        icon: string;
    }>;
}

interface WeatherWidgetProps {
    location?: string;
}

export default function WeatherWidget({
    location = "Current Location",
}: WeatherWidgetProps) {
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Use the safe geolocation hook
    const {
        position,
        error: geoError,
        loading: geoLoading
    } = useCurrentPosition({
        enableHighAccuracy: false,
        timeout: 15000,
        maximumAge: 300000, // 5 minutes
    });

    const getWeatherIcon = (condition: string): string => {
        const conditionLower = condition.toLowerCase();
        if (
            conditionLower.includes("clear") ||
            conditionLower.includes("sunny")
        )
            return "☀️";
        if (conditionLower.includes("cloud")) return "☁️";
        if (
            conditionLower.includes("rain") ||
            conditionLower.includes("drizzle")
        )
            return "🌧️";
        if (conditionLower.includes("thunderstorm")) return "⛈️";
        if (conditionLower.includes("snow")) return "❄️";
        if (conditionLower.includes("mist") || conditionLower.includes("fog"))
            return "🌫️";
        if (conditionLower.includes("partly") || conditionLower.includes("few"))
            return "⛅";
        return "🌤️";
    };

    const formatDay = (timestamp: number, index: number): string => {
        if (index === 0) return "Today";
        if (index === 1) return "Tomorrow";

        const date = new Date(timestamp * 1000);
        return date.toLocaleDateString("en-US", { weekday: "long" });
    };

    useEffect(() => {
        const fetchWeather = async () => {
            try {
                setLoading(true);
                setError(null);

                let lat: number, lon: number;

                if (position) {
                    lat = position.coords.latitude;
                    lon = position.coords.longitude;
                } else if (geoError) {
                    // Default to a generic location (Chicago) if geolocation fails
                    lat = 41.8781;
                    lon = -87.6298;
                } else {
                    // Still waiting for geolocation
                    return;
                }

                // Fetch weather data using OneCall API
                const response = await fetch(
                    `/api/weather/current?lat=${lat}&lon=${lon}`,
                );

                if (!response.ok) {
                    throw new Error("Failed to fetch weather data");
                }

                const data = await response.json();

                const weatherData: WeatherData = {
                    current: {
                        temperature: Math.round(data.current.temp),
                        condition: data.current.weather[0].description
                            .split(" ")
                            .map(
                                (word: string) =>
                                    word.charAt(0).toUpperCase() +
                                    word.slice(1),
                            )
                            .join(" "),
                        icon: getWeatherIcon(
                            data.current.weather[0].description,
                        ),
                        humidity: data.current.humidity,
                        windSpeed: Math.round(data.current.wind_speed), // Already in mph from imperial units
                    },
                    forecast: data.daily
                        .slice(0, 5)
                        .map((day: any, index: number) => ({
                            date: formatDay(day.dt, index),
                            high: Math.round(day.temp.max),
                            low: Math.round(day.temp.min),
                            condition:
                                day.summary ||
                                day.weather[0].description
                                    .split(" ")
                                    .map(
                                        (word: string) =>
                                            word.charAt(0).toUpperCase() +
                                            word.slice(1),
                                    )
                                    .join(" "),
                            icon: getWeatherIcon(day.weather[0].description),
                        })),
                };

                setWeather(weatherData);
            } catch (err) {
                console.error("Weather fetch error:", err);
                setError(
                    err instanceof Error
                        ? err.message
                        : "Failed to load weather data",
                );
            } finally {
                setLoading(false);
            }
        };

        // Only fetch weather when geolocation is done (success or failure)
        if (!geoLoading) {
            fetchWeather();
        }
    }, [position, geoError, geoLoading, location]);

    if (loading) {
        return (
            <div className="card bg-base-100 shadow-lg">
                <div className="card-body">
                    <h3 className="text-lg font-semibold mb-4">Weather</h3>
                    <div className="flex items-center justify-center h-32">
                        <div className="loading loading-spinner loading-lg"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !weather) {
        return (
            <div className="card bg-base-100 shadow-lg">
                <div className="card-body">
                    <h3 className="text-lg font-semibold mb-4">Weather</h3>
                    <div className="alert alert-error">
                        <i className="far fa-exclamation-triangle"></i>
                        <span>{error || "Unable to load weather data"}</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="card bg-base-100 shadow-lg">
            <div className="card-body">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Weather</h3>
                    {/* <span className="text-sm text-base-content/70">
                        {location}
                    </span> */}
                </div>

                {/* Current Weather */}
                <div className="bg-gradient-to-r from-blue-500/10 to-blue-600/10 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-3xl font-bold">
                                {weather.current.temperature}°F
                            </div>
                            <div className="text-sm text-base-content/70">
                                {weather.current.condition}
                            </div>
                        </div>
                        <div className="text-4xl">{weather.current.icon}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
                        <div className="flex items-center gap-1">
                            <i className="far fa-tint text-blue-500"></i>
                            <span>{weather.current.humidity}% humidity</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <i className="far fa-wind text-green-500"></i>
                            <span>{weather.current.windSpeed} mph wind</span>
                        </div>
                    </div>
                </div>

                {/* 5-Day Forecast */}
                <div>
                    <h4 className="text-sm font-medium text-base-content/70 mb-3">
                        5-Day Forecast
                    </h4>
                    <div className="space-y-2">
                        {weather.forecast.map((day, index) => (
                            <div
                                key={index}
                                className="flex items-center justify-between py-2 border-b border-base-200 last:border-b-0"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-lg">{day.icon}</span>
                                    <div>
                                        <div className="text-sm font-medium">
                                            {day.date}
                                        </div>
                                        <div className="text-xs text-base-content/70">
                                            {day.condition}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-medium">
                                        {day.high}°
                                    </div>
                                    <div className="text-xs text-base-content/70">
                                        {day.low}°
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Weather Safety Notice */}
                <div className="mt-4 p-3 bg-yellow-500/10 rounded-lg">
                    <div className="flex items-start gap-2">
                        <i className="far fa-hard-hat text-yellow-600 mt-0.5"></i>
                        <div className="text-sm">
                            <div className="font-medium text-yellow-800 dark:text-yellow-200">
                                Safety Reminder
                            </div>
                            <div className="text-yellow-700 dark:text-yellow-300">
                                Check weather conditions before starting work.
                                Adjust schedules for severe weather.
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
