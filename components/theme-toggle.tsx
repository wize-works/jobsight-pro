"use client"

import { useTheme } from "next-themes"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <label className="swap swap-rotate btn btn-ghost btn-circle">
      {/* this hidden checkbox controls the state */}
      <input
        type="checkbox"
        checked={theme === "dark"}
        onChange={() => setTheme(theme === "light" ? "dark" : "light")}
        className="hidden"
      />

      {/* sun icon */}
      <i className="fas fa-sun swap-on text-yellow-500 text-lg"></i>

      {/* moon icon */}
      <i className="fas fa-moon swap-off text-slate-400 text-lg"></i>
    </label>
  )
}
