import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "../styles/globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/lib/auth-context"
import Script from "next/script"
import { Toaster } from "sonner"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
    title: "JobSight - Your Entire Jobsite, One App",
    description: "Modern field service and construction project management platform",
    generator: 'v0.dev'
}

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <html lang="en" data-theme="light2">
            <Script src="https://kit.fontawesome.com/40c3b5129c.js" crossOrigin="anonymous" />
            <body className={inter.className}>
                <AuthProvider>
                    <ThemeProvider>{children}</ThemeProvider>
                    <Toaster position="bottom-right" />
                </AuthProvider>
            </body>
        </html>
    )
}
