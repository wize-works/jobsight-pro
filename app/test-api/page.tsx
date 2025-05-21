"use client"

import { useState, useEffect } from "react"

export default function TestApiPage() {
  const [response, setResponse] = useState<string>("Loading...")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/test")
        if (!res.ok) {
          throw new Error(`Status: ${res.status}`)
        }
        const data = await res.json()
        setResponse(JSON.stringify(data, null, 2))
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error")
        console.error("Error fetching API:", err)
      }
    }

    fetchData()
  }, [])

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">API Test Page</h1>
      {error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p className="font-bold">Error:</p>
          <p>{error}</p>
        </div>
      ) : null}
      <div className="bg-gray-100 p-4 rounded">
        <h2 className="text-lg font-semibold mb-2">Response from /api/test:</h2>
        <pre className="bg-white p-4 rounded border">{response}</pre>
      </div>
    </div>
  )
}
