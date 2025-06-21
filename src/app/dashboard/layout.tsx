"use client";

import { useState } from "react";
import type React from "react";
import { Navbar } from "./navbar";
import { Sidebar } from "./sidebar";
import { BottomNav } from "./bottom-nav";
import { useIsMobile } from "@/hooks/use-mobile";
import { BusinessProvider, useBusiness } from "@/lib/business-context";
import { usePathname } from "next/navigation";
import { AIAssistantButton } from "@/components/ai-assistant-button";
import { Toaster } from "@/components/toaster";
import ErrorBoundary from "@/components/error-boundary";

function DashboardLayout({ children }: { children: React.ReactNode }) {
    const storedSidebarCollapsed =
        typeof window !== "undefined"
            ? localStorage.getItem("sidebarCollapsed")
            : null;
    const [sidebarCollapsed, setSidebarCollapsed] = useState(
        storedSidebarCollapsed ? JSON.parse(storedSidebarCollapsed) : false,
    );
    const isMobile = useIsMobile();
    const pathname = usePathname();

    return (<div className={`${!isMobile && "drawer lg:drawer-open"}`}>
        <input id="my-drawer-2" type="checkbox" className="drawer-toggle" />
        <div className="drawer-content flex flex-col bg-base-200 relative">
            <BusinessProvider>
                <ErrorBoundary fallback={(error) => (
                    <div className="p-4 md:p-6 container mx-auto pb-20 lg:pb-6">
                        <div className="alert alert-error">
                            <i className="fas fa-exclamation-triangle"></i>
                            <div>
                                <h3 className="font-bold">Something went wrong</h3>
                                <div className="text-xs">
                                    {error.message || "An unexpected error occurred. Please refresh the page."}
                                </div>
                            </div>
                        </div>
                    </div>
                )}>
                    <Navbar
                        setSidebarCollapsed={setSidebarCollapsed}
                        sidebarCollapsed={sidebarCollapsed}
                    />
                    {pathname === "/dashboard/map" ? (
                        <div className="pb-20 lg:pb-6">{children}</div>
                    ) : (
                        <div className="p-4 md:p-6 container mx-auto pb-20 lg:pb-6">
                            {children}
                        </div>
                    )}
                    <AIAssistantButton />
                </ErrorBoundary>
            </BusinessProvider>
            {isMobile && <BottomNav />}
        </div>
        {!isMobile && <Sidebar sidebarCollapsed={sidebarCollapsed} />}
        <Toaster />
    </div>
    );
}

export default DashboardLayout;