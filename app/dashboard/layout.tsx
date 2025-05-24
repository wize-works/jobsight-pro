"use client"

import { useState } from "react"
import type React from "react"
import Link from "next/link"
import { Navbar } from "./navbar"
import { Sidebar } from "./sidebar"
import { BusinessProvider } from "@/lib/business-context"

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    // Check local storage for sidebarCollapsed value
    const storedSidebarCollapsed = typeof window !== "undefined" ? localStorage.getItem("sidebarCollapsed") : null
    const [sidebarCollapsed, setSidebarCollapsed] = useState(storedSidebarCollapsed ? JSON.parse(storedSidebarCollapsed) : false);

    return (
        <div className="drawer lg:drawer-open">
            <input id="my-drawer-2" type="checkbox" className="drawer-toggle" />
            <div className="drawer-content flex flex-col bg-base-200">
                <Navbar setSidebarCollapsed={setSidebarCollapsed} sidebarCollapsed={sidebarCollapsed} />
                {/* Page content */}
                <div className="p-4 md:p-6 container mx-auto">
                    <BusinessProvider>
                        {children}
                    </BusinessProvider>
                </div>
            </div>
            <Sidebar sidebarCollapsed={sidebarCollapsed} />
        </div>
    )
}
