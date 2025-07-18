
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const lat = searchParams.get("lat");
        const lon = searchParams.get("lon");

        if (!lat || !lon) {
            return NextResponse.json(
                { success: false, error: "Latitude and longitude are required" },
                { status: 400 },
            );
        }

        const apiKey = process.env.OPENWEATHER_API_KEY;
        if (!apiKey) {
            return NextResponse.json(
                { success: false, error: "Weather API key not configured" },
                { status: 500 },
            );
        }

        const response = await fetch(
            `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&appid=${apiKey}&units=imperial&exclude=minutely,alerts`,
            {
                next: { revalidate: 600 }, // Cache for 10 minutes
            },
        );

        if (!response.ok) {
            throw new Error(`OpenWeather API error: ${response.status}`);
        }

        const data = await response.json();
        return NextResponse.json({ success: true, data }, { status: 200 });
    } catch (error) {
        console.error("Weather API error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to fetch weather data" },
            { status: 500 },
        );
    }
}
