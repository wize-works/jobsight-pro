"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

export function ThemeToggle() {
    const { theme, setTheme } = useTheme()
    const [mounted, setMounted] = useState(false)

    // useEffect only runs on the client, so now we can safely show the UI
    useEffect(() => {
        setMounted(true)
    }, [])

    // Don't render anything until component is mounted to prevent hydration issues
    if (!mounted) {
        return null
    }

    return (
        <button
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            className="btn btn-circle p-2"
            aria-label="Toggle theme"
        >
            {theme === "dark" ? (
                <i className="far fa-sun fa-fw text-yellow-500 text-lg"></i>
            ) : (
                <i className="far fa-moon fa-fw text-slate-400 text-lg"></i>
            )}
        </button>
    )
}
