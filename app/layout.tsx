import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "JobSight - Your Entire Jobsite, One App",
  description: "Modern field service and construction project management platform",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script src="https://kit.fontawesome.com/40c3b5129c.js" crossOrigin="anonymous"></script>
      </head>
      <body className={`${inter.className} antialiased bg-base-200 flex min-h-screen`}>
        <ThemeProvider attribute="data-theme" defaultTheme="light" enableSystem themes={["light", "dark"]}>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
