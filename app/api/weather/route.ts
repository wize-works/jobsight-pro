import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const latitude = searchParams.get("lat")
    const longitude = searchParams.get("lon")
    const location = searchParams.get("location")

    // Get API key from environment variable - using the non-public version
    const apiKey = process.env.OPENWEATHER_API_KEY

    if (!apiKey) {
      return NextResponse.json({ error: "OpenWeather API key is not configured" }, { status: 500 })
    }

    let url: string

    // Determine which API endpoint to use based on available parameters
    if (latitude && longitude) {
      // Use coordinates if available (more reliable)
      url = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=imperial&appid=${apiKey}`
    } else if (location) {
      // Use location name as fallback
      url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)}&units=imperial&appid=${apiKey}`
    } else {
      return NextResponse.json({ error: "No location or coordinates provided" }, { status: 400 })
    }

    // Fetch weather data from OpenWeather API
    const response = await fetch(url)

    if (!response.ok) {
      const errorData = await response.json()
      return NextResponse.json(
        { error: `API returned ${response.status}: ${errorData.message || "Unknown error"}` },
        { status: response.status },
      )
    }

    // Return the weather data
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in weather API route:", error)
    return NextResponse.json({ error: "Failed to fetch weather data" }, { status: 500 })
  }
}
