import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "@/app/globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/lib/auth-context"
import Script from "next/script"
import { toast } from "@/hooks/use-toast"
import { Toaster } from "@/components/toaster"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
    title: "JobSight - Your Entire Jobsite, One App",
    description: "Modern field service and construction project management platform",
}

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <AuthProvider>
            <html lang="en" suppressHydrationWarning>
                <meta name="viewport" content="viewport-fit=cover" />
                <Script src="https://kit.fontawesome.com/40c3b5129c.js" crossOrigin="anonymous" />
                <body className={inter.className}>
                    <ThemeProvider>{children}</ThemeProvider>
                    <Toaster />
                </body>
            </html>
        </AuthProvider >
    )
}
