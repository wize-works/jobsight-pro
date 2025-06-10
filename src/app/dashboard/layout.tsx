"use client";

import { useState } from "react";
import type React from "react";
import { Navbar } from "./navbar";
import { Sidebar } from "./sidebar";
import { BottomNav } from "./bottom-nav";
import { useIsMobile } from "@/hooks/use-mobile";
import { BusinessProvider } from "@/lib/business-context";
import { withBusiness } from "@/lib/auth/with-business";
import { usePathname } from "next/navigation";
import PushManager from "@/components/push-manager";
import OfflineIndicator from "@/components/offline-indicator";
import SyncStatusIndicator from "@/components/sync-status-indicator";

function DashboardLayout({ children }: { children: React.ReactNode }) {
    // Check local storage for sidebarCollapsed value
    const storedSidebarCollapsed =
        typeof window !== "undefined"
            ? localStorage.getItem("sidebarCollapsed")
            : null;
    const [sidebarCollapsed, setSidebarCollapsed] = useState(
        storedSidebarCollapsed ? JSON.parse(storedSidebarCollapsed) : false,
    );
    const isMobile = useIsMobile();
    const pathname = usePathname();

    return (
        <div className="drawer lg:drawer-open">
            <input id="my-drawer-2" type="checkbox" className="drawer-toggle" />
            <div className="drawer-content flex flex-col bg-base-200">
                <Navbar
                    setSidebarCollapsed={setSidebarCollapsed}
                    sidebarCollapsed={sidebarCollapsed}
                    userAvatarUrl={currentUser?.avatar_url}
                    isLoadingUser={isLoadingUser}
                />
                <BusinessProvider>
                    <OfflineIndicator />
                    <div className="fixed bottom-4 right-4 z-40">
                        <SyncStatusIndicator />
                    </div>
                    {pathname === "/dashboard/map" ? (
                        <div className="pb-20 lg:pb-6">{children}</div>
                    ) : (
                        <div className="p-4 md:p-6 container mx-auto pb-20 lg:pb-6">
                            {children}
                        </div>
                    )}
                </BusinessProvider>
                {isMobile && <BottomNav />}
            </div>
            {!isMobile && <Sidebar sidebarCollapsed={sidebarCollapsed} />}
        </div>
    );
}

export default withBusiness(DashboardLayout);