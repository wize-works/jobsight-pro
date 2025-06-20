
// This file is no longer needed as OneCall API provides both current and forecast data
// Keeping this file for backward compatibility but redirecting to the current endpoint

import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    // Redirect to the current endpoint which now handles both current and forecast
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get("lat");
    const lon = searchParams.get("lon");
    
    if (!lat || !lon) {
        return NextResponse.json(
            { error: "Latitude and longitude are required" },
            { status: 400 },
        );
    }

    // Forward to the current endpoint
    const currentUrl = new URL("/api/weather/current", request.url);
    currentUrl.searchParams.set("lat", lat);
    currentUrl.searchParams.set("lon", lon);
    
    try {
        const response = await fetch(currentUrl.toString());
        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error("Weather forecast API error:", error);
        return NextResponse.json(
            { error: "Failed to fetch weather forecast" },
            { status: 500 },
        );
    }
}
