import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/app/globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/lib/auth-context";
import Script from "next/script";
import { Toaster } from "@/components/toaster";
import Clarity from "@microsoft/clarity";

Clarity.init(process.env.NEXT_PUBLIC_CLARITY_ID || "");

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "JobSight Pro",
    description: "All your construction management needs in one place.",
    keywords:
        "construction management, project management, field service, jobsite management, construction app",
    authors: [{ name: "JobSight Team" }],
    applicationName: "JobSight Pro",
    manifest: "/manifest.json",
    icons: {
        icon: [
            { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
            { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
            { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
            { url: "/favicon-128.png", sizes: "128x128", type: "image/png" },
            {
                url: "/favicon-196x196.png",
                sizes: "196x196",
                type: "image/png",
            },
        ],
        apple: [
            {
                url: "/apple-touch-icon-57x57.png",
                sizes: "57x57",
                type: "image/png",
            },
            {
                url: "/apple-touch-icon-60x60.png",
                sizes: "60x60",
                type: "image/png",
            },
            {
                url: "/apple-touch-icon-72x72.png",
                sizes: "72x72",
                type: "image/png",
            },
            {
                url: "/apple-touch-icon-76x76.png",
                sizes: "76x76",
                type: "image/png",
            },
            {
                url: "/apple-touch-icon-114x114.png",
                sizes: "114x114",
                type: "image/png",
            },
            {
                url: "/apple-touch-icon-120x120.png",
                sizes: "120x120",
                type: "image/png",
            },
            {
                url: "/apple-touch-icon-144x144.png",
                sizes: "144x144",
                type: "image/png",
            },
            {
                url: "/apple-touch-icon-152x152.png",
                sizes: "152x152",
                type: "image/png",
            },
        ],
        other: [{ rel: "icon", url: "/favicon.ico" }],
    },
    appleWebApp: {
        capable: true,
        statusBarStyle: "default",
        title: "JobSight Pro",
    },
    openGraph: {
        title: "JobSight Pro",
        description: "All your construction management needs in one place.",
        type: "website",
    },
    other: {
        "background-color": "#FAFAF9",
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <AuthProvider>
            <html lang="en" suppressHydrationWarning>
                <Script
                    src="https://kit.fontawesome.com/40c3b5129c.js"
                    crossOrigin="anonymous"
                />
                <body className={inter.className}>
                    <ThemeProvider>
                        {children}
                        <Toaster />
                    </ThemeProvider>
                </body>
            </html>
        </AuthProvider>
    );
}
