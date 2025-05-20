import type { Config } from "tailwindcss"

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "*.{js,ts,jsx,tsx,mdx}",
  ],
  plugins: [require("tailwindcss-animate"), require("daisyui")],
  daisyui: {
    themes: [
      {
        light: {
          primary: "#F87431",
          "primary-content": "#FAFAF9",
          secondary: "#02ACA3",
          "secondary-content": "#FAFAF9",
          accent: "#5C95FF",
          "accent-content": "#080607",
          neutral: "#080607",
          "neutral-content": "#FAFAF9",
          "base-100": "#FAFAF9",
          "base-200": "#F0EFEC",
          "base-300": "#CCC9C0",
          "base-content": "#080607",
          info: "#983486",
          "info-content": "#FAFAF9",
          success: "#34A432",
          "success-content": "#FAFAF9",
          warning: "#F5B400",
          "warning-content": "#FAFAF9",
          error: "#D1152B",
          "error-content": "#FAFAF9",
        },
        dark: {
          primary: "#F87431",
          "primary-content": "#FAFAF9",
          secondary: "#02ADA5",
          "secondary-content": "#FAFAF9",
          accent: "#5C95FF",
          "accent-content": "#080607",
          neutral: "#080607",
          "neutral-content": "#FAFAF9",
          "base-100": "#2D2D2A",
          "base-200": "#232321",
          "base-300": "#191917",
          "base-content": "#FAFAF9",
          info: "#983486",
          "info-content": "#FAFAF9",
          success: "#34A432",
          "success-content": "#FAFAF9",
          warning: "#F5B400",
          "warning-content": "#FAFAF9",
          error: "#D1152B",
          "error-content": "#FAFAF9",
        },
      },
    ],
  },
}

export default config
