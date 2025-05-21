/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: [
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                border: "hsl(var(--border))",
                input: "hsl(var(--input))",
                ring: "hsl(var(--ring))",
                background: "hsl(var(--background))",
                foreground: "hsl(var(--foreground))",
                muted: {
                    DEFAULT: "hsl(var(--muted))",
                    foreground: "hsl(var(--muted-foreground))",
                },
                accent: {
                    DEFAULT: "hsl(var(--accent))",
                    foreground: "hsl(var(--accent-foreground))",
                },
                popover: {
                    DEFAULT: "hsl(var(--popover))",
                    foreground: "hsl(var(--popover-foreground))",
                },
                card: {
                    DEFAULT: "hsl(var(--card))",
                    foreground: "hsl(var(--card-foreground))",
                },
            },
            borderRadius: {
                lg: "var(--radius)",
                md: "calc(var(--radius) - 2px)",
                sm: "calc(var(--radius) - 4px)",
            },
        },
    },
    plugins: [require("tailwindcss-animate"), require("daisyui")],
    daisyui: {
        themes: [
            {
                light: {
                    "primary": "#f87431",
                    "primary-content": "#fafaf9",
                    "secondary": "#02aca3",
                    "secondary-content": "#fafaf9",
                    "accent": "#5c95ff",
                    "accent-content": "#080607",
                    "neutral": "#080607",
                    "neutral-content": "#fafaf9",
                    "base-100": "#fafaf9",
                    "base-200": "#f0efec",
                    "base-300": "#ccc9c0",
                    "base-content": "#080607",
                    "info": "#983486",
                    "info-content": "#fafaf9",
                    "success": "#34a432",
                    "success-content": "#fafaf9",
                    "warning": "#f5b400",
                    "warning-content": "#fafaf9",
                    "error": "#d1152b",
                    "error-content": "#fafaf9"
                }
            },
            {
                dark: {
                    "primary": "#f87431",
                    "primary-content": "#fafaf9",
                    "secondary": "#02aca3",
                    "secondary-content": "#fafaf9",
                    "accent": "#5c95ff",
                    "accent-content": "#080607",
                    "neutral": "#080607",
                    "neutral-content": "#fafaf9",
                    "base-100": "#2d2d2a",
                    "base-200": "#232321",
                    "base-300": "#191917",
                    "base-content": "#fafaf9",
                    "info": "#983486",
                    "info-content": "#fafaf9",
                    "success": "#34a432",
                    "success-content": "#fafaf9",
                    "warning": "#f5b400",
                    "warning-content": "#fafaf9",
                    "error": "#d1152b",
                    "error-content": "#fafaf9"
                }
            },
        ], // This will use your custom theme files
        logs: false, // Disable console logs
    },
}