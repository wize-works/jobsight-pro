"use client"

import { useTheme } from "next-themes"

export function ThemeToggle() {
    const { theme, setTheme } = useTheme()

    return (
        <div className="bg-base-100 rounded-full shadow-lg">
            <button
                onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                className="btn btn-circle"
                aria-label="Toggle theme"
            >
                {theme === "dark" ? (
                    <i className="fas fa-sun text-yellow-500 text-lg"></i>
                ) : (
                    <i className="fas fa-moon text-slate-400 text-lg"></i>
                )}
            </button>
        </div>
    )
}
