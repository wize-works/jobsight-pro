"use client"

import { useTheme } from "next-themes"

export function ThemeToggle() {
    const { theme, setTheme } = useTheme()

    return (
        <button
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            className="btn btn-circle p-2 "
            aria-label="Toggle theme"
        >
            {theme === "dark" ? (
                <i className="fas fa-sun fa-fw text-yellow-500 text-lg"></i>
            ) : (
                <i className="fas fa-moon fa-fw text-slate-400 text-lg"></i>
            )}
        </button>
    )
}
