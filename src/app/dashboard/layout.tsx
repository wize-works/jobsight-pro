"use client";

import { useState, useEffect } from "react";
import type React from "react";
import { Navbar } from "./navbar";
import { Sidebar } from "./sidebar";
import { BottomNav } from "./bottom-nav";
import { useIsMobile } from "@/hooks/use-mobile";
import { BusinessProvider } from "@/lib/business-context";
import { usePathname } from "next/navigation";
import PushManager from "@/components/push-manager";
import OfflineIndicator from "@/components/offline-indicator";
import SyncStatusIndicator from "@/components/sync-status-indicator";
import { AIAssistantButton } from "@/components/ai-assistant-button";
import { useKindeAuth } from "@kinde-oss/kinde-auth-nextjs";
import { getUserById } from "@/app/actions/users";
import { User } from "@/types/users";
import { Toaster } from "@/components/toaster";

function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { user, isLoading: isKindeLoading } = useKindeAuth();
    const [userData, setUserData] = useState<User | null>(null);
    const [isLoadingUser, setIsLoadingUser] = useState(true);

    const storedSidebarCollapsed =
        typeof window !== "undefined"
            ? localStorage.getItem("sidebarCollapsed")
            : null;
    const [sidebarCollapsed, setSidebarCollapsed] = useState(
        storedSidebarCollapsed ? JSON.parse(storedSidebarCollapsed) : false,
    );
    const isMobile = useIsMobile();
    const pathname = usePathname();

    // Load user data from database using Kinde auth_id
    useEffect(() => {
        const loadUserData = async () => {
            if (!user?.id || isKindeLoading) {
                setIsLoadingUser(Boolean(isKindeLoading));
                return;
            }

            setIsLoadingUser(true);
            try {
                const dbUser = await getUserById(user.id);
                setUserData(dbUser);
            } catch (error) {
                console.error("Error loading user data:", error);
                setUserData(null);
            } finally {
                setIsLoadingUser(false);
            }
        };

        loadUserData();
    }, [user?.id, isKindeLoading]);

    return (
        <div className={`${!isMobile && "drawer lg:drawer-open"}`}>
            <input id="my-drawer-2" type="checkbox" className="drawer-toggle" />
            <div className="drawer-content flex flex-col bg-base-200 relative">
                <Navbar
                    setSidebarCollapsed={setSidebarCollapsed}
                    sidebarCollapsed={sidebarCollapsed}
                    userData={userData}
                    isLoadingUser={isLoadingUser}
                />
                <BusinessProvider>
                    <OfflineIndicator />
                    <div className="fixed bottom-4 right-4 z-40">
                        <SyncStatusIndicator />
                    </div>
                    <AIAssistantButton />
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
            <Toaster />
        </div>
    );
}

export default DashboardLayout;