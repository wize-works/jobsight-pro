import type React from "react";
import { Inter } from "next/font/google";
import "@/app/globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import Script from "next/script";
import { Toaster } from "@/components/toaster";
import { ClarityProvider } from "@/components/clarity-provider";

const inter = Inter({ subsets: ["latin"] });

// Demo layout without authentication - for showcasing features
export default function DemoLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <Script
                src="https://kit.fontawesome.com/40c3b5129c.js"
                crossOrigin="anonymous"
            />
            <body className={inter.className}>
                <ThemeProvider>
                    <ClarityProvider />
                    {children}
                    <Toaster />
                </ThemeProvider>
            </body>
        </html>
    );
}
