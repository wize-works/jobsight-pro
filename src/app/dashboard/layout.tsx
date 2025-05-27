"use client"

import { useState } from "react"
import type React from "react"
import { Navbar } from "./navbar"
import { Sidebar } from "./sidebar"
import { BottomNav } from "./bottom-nav"
import { useIsMobile } from "@/hooks/use-mobile"
import { BusinessProvider } from "@/lib/business-context"
import { withBusiness } from "@/lib/auth/with-business"

function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    // Check local storage for sidebarCollapsed value
    const storedSidebarCollapsed = typeof window !== "undefined" ? localStorage.getItem("sidebarCollapsed") : null
    const [sidebarCollapsed, setSidebarCollapsed] = useState(storedSidebarCollapsed ? JSON.parse(storedSidebarCollapsed) : false);
    const isMobile = useIsMobile();

    return (
        <div className="drawer lg:drawer-open">
            <input id="my-drawer-2" type="checkbox" className="drawer-toggle" />
            <div className="drawer-content flex flex-col bg-base-200">
                <Navbar setSidebarCollapsed={setSidebarCollapsed} sidebarCollapsed={sidebarCollapsed} />
                {/* Page content */}
                <div className="p-4 md:p-6 container mx-auto pb-20 lg:pb-6">
                    <BusinessProvider>
                        {children}
                    </BusinessProvider>
                </div>
                {isMobile && <BottomNav />}
            </div>
            {!isMobile && <Sidebar sidebarCollapsed={sidebarCollapsed} />}
        </div>)
}

export default withBusiness(DashboardLayout);