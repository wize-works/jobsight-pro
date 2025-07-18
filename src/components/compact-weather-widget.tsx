"use client";

import React, { useEffect, useState } from "react";

interface WeatherData {
    current: {
        temperature: number;
        condition: string;
        icon: string;
    };
    forecast: Array<{
        date: string;
        high: number;
        low: number;
        condition: string;
        icon: string;
    }>;
}

interface CompactWeatherWidgetProps {
    location: {
        latitude: number;
        longitude: number;
        address?: string;
    };
    className?: string;
}

export default function CompactWeatherWidget({
    location,
    className,
}: CompactWeatherWidgetProps) {
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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
        if (index === 1) return "Tom";

        const date = new Date(timestamp * 1000);
        return date.toLocaleDateString("en-US", { weekday: "short" });
    };

    useEffect(() => {
        const fetchWeather = async () => {
            try {
                setLoading(true);
                setError(null);

                const lat = location.latitude;
                const lon = location.longitude;

                // Fetch weather data using OneCall API
                const response = await fetch(
                    `/api/weather/current?lat=${lat}&lon=${lon}`,
                );

                if (!response.ok) {
                    throw new Error("Failed to fetch weather data");
                }

                const { data } = await response.json();

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

        fetchWeather();
    }, [location]);

    if (loading) {
        return (
            <div className={`bg-base-100 rounded-lg p-3 shadow-sm border ${className || ''}`}>
                <div className="flex items-center gap-2">
                    <i className="far fa-cloud-sun text-primary"></i>
                    <span className="font-medium text-sm">5-Day Forecast</span>
                    <div className="loading loading-spinner loading-sm ml-auto"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`bg-base-100 rounded-lg p-3 shadow-sm border ${className || ''}`}>
                <div className="flex items-center gap-2">
                    <i className="far fa-exclamation-triangle text-error"></i>
                    <span className="font-medium text-sm text-error">Weather Error</span>
                </div>
            </div>
        );
    }

    if (!weather) {
        return null;
    }

    return (
        <div className={`bg-base-100 rounded-lg p-3 shadow-sm border ${className || ''}`}>
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                    <i className="far fa-cloud-sun text-primary"></i>
                    <span className="font-medium text-sm">5-Day Forecast</span>
                </div>
                <div className="flex items-center gap-4 flex-1 justify-end">
                    {weather.forecast.map((day, index) => (
                        <div
                            key={index}
                            className="flex flex-col md:flex-row items-center gap-1 text-center min-w-0"
                            title={`${day.date}: ${day.condition}`}
                        >

                            <div className="text-xs font-medium text-base-content/70 min-w-[2.5rem]">
                                {day.date}
                            </div>
                            <div className="text-lg" title={day.condition}>
                                {day.icon}
                            </div>
                            <div className="flex flex-col items-center min-w-[2rem]">
                                <div className="text-xs font-semibold">
                                    {day.high}°
                                </div>
                                <div className="text-xs text-base-content/50">
                                    {day.low}°
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
