"use client";
import Link from "next/link";
import { useTheme } from "next-themes";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

interface SidebarProps {
    sidebarCollapsed: boolean;
}

export const Sidebar = ({ sidebarCollapsed }: SidebarProps) => {
    const { resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const pathname = usePathname();

    // Check if the current path matches the menu item path
    const isActive = (path: string) => {
        if (path === "/dashboard" && pathname === "/dashboard") {
            return true;
        }
        return pathname.startsWith(path) && path !== "/dashboard";
    };

    // After mounting, we have access to the theme
    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <div className="drawer-side bg-base-100">
            <label htmlFor="my-drawer-2" aria-label="close sidebar" className="drawer-overlay"></label>
            <div className={`menu ${sidebarCollapsed ? "w-16" : "w-64"} min-h-full text-base-content transition-all duration-300`} >
                <div className="m-2 flex items-start justify-start">
                    {sidebarCollapsed ? (
                        <img src="/logo.png" alt="JobSight" className="h-10" />
                    ) : (
                        <img
                            src={mounted && resolvedTheme === 'dark' ? "/logo-full-white.png" : "/logo-full.png"}
                            alt="JobSight"
                            className="h-10"
                        />
                    )}
                </div>

                <ul className="menu menu-md space-y-2 w-full">
                    <li className={isActive("/dashboard") ? "active" : ""}>
                        <Link href="/dashboard" className={`flex items-center min-h-8 p-1 ${isActive("/dashboard") ? "bg-primary/10 text-primary font-medium" : ""}`}>
                            <i className={`far fa-tachometer-alt fa-fw fa-lg ${isActive("/dashboard") ? "text-primary" : ""}`}></i>
                            {!sidebarCollapsed && <span>Dashboard</span>}
                        </Link>
                    </li>

                    {!sidebarCollapsed ? (
                        <li className="menu-title py-1 mx-0 px-0">
                            <div className="divider divider-start my-1">Projects</div>
                        </li>
                    ) : (
                        <li className=" py-3 mx-0 px-0">
                            <span className="divider divider-start m-0 p-0"></span>
                        </li>
                    )}
                    <li className={isActive("/dashboard/projects") ? "active" : ""}>
                        <Link href="/dashboard/projects" className={`flex items-center min-h-8 p-1 ${isActive("/dashboard/projects") ? "bg-primary/10 text-primary font-medium" : ""}`}>
                            <i className={`far fa-screwdriver-wrench fa-fw fa-lg ${isActive("/dashboard/projects") ? "text-primary" : ""}`}></i>
                            {!sidebarCollapsed && <span>Projects</span>}
                        </Link>
                    </li>
                    <li className={isActive("/dashboard/tasks") ? "active" : ""}>
                        <Link href="/dashboard/tasks" className={`flex items-center min-h-8 p-1 ${isActive("/dashboard/tasks") ? "bg-primary/10 text-primary font-medium" : ""}`}>
                            <i className={`far fa-tasks fa-fw fa-lg ${isActive("/dashboard/tasks") ? "text-primary" : ""}`}></i>
                            {!sidebarCollapsed && <span>Tasks</span>}
                        </Link>
                    </li>
                    <li className={isActive("/dashboard/daily-logs") ? "active" : ""}>
                        <Link href="/dashboard/daily-logs" className={`flex items-center min-h-8 p-1 ${isActive("/dashboard/daily-logs") ? "bg-primary/10 text-primary font-medium" : ""}`}>
                            <i className={`far fa-clipboard-list fa-fw fa-lg ${isActive("/dashboard/daily-logs") ? "text-primary" : ""}`}></i>
                            {!sidebarCollapsed && <span>Daily Logs</span>}
                        </Link>
                    </li>

                    {!sidebarCollapsed ? (
                        <li className="menu-title py-1 mx-0 px-0">
                            <div className="divider divider-start my-1">Organization</div>
                        </li>
                    ) : (
                        <li className=" py-3 mx-0 px-0">
                            <span className="divider divider-start m-0 p-0"></span>
                        </li>
                    )}
                    <li className={isActive("/dashboard/clients") ? "active" : ""}>
                        <Link href="/dashboard/clients" className={`flex items-center min-h-8 p-1 ${isActive("/dashboard/clients") ? "bg-primary/10 text-primary font-medium" : ""}`}>
                            <i className={`far fa-buildings fa-fw fa-lg ${isActive("/dashboard/clients") ? "text-primary" : ""}`}></i>
                            {!sidebarCollapsed && <span>Clients</span>}
                        </Link>
                    </li>
                    <li className={isActive("/dashboard/crews") ? "active" : ""}>
                        <Link href="/dashboard/crews" className={`flex items-center min-h-8 p-1 ${isActive("/dashboard/crews") ? "bg-primary/10 text-primary font-medium" : ""}`}>
                            <i className={`far fa-users fa-fw fa-lg ${isActive("/dashboard/crews") ? "text-primary" : ""}`}></i>
                            {!sidebarCollapsed && <span>Crews</span>}
                        </Link>
                    </li>
                    <li className={isActive("/dashboard/equipment") ? "active" : ""}>
                        <Link href="/dashboard/equipment" className={`flex items-center min-h-8 p-1 ${isActive("/dashboard/equipment") ? "bg-primary/10 text-primary font-medium" : ""}`}>
                            <i className={`far fa-excavator fa-fw fa-lg ${isActive("/dashboard/equipment") ? "text-primary" : ""}`}></i>
                            {!sidebarCollapsed && <span>Equipment</span>}
                        </Link>
                    </li>

                    {!sidebarCollapsed ? (
                        <li className="menu-title py-1 mx-0 px-0">
                            <span className="divider divider-start my-1">Finance</span>
                        </li>
                    ) : (
                        <li className=" py-3 mx-0 px-0">
                            <span className="divider divider-start m-0 p-0"></span>
                        </li>
                    )}
                    <li className={isActive("/dashboard/invoices") ? "active" : ""}>
                        <Link href="/dashboard/invoices" className={`flex items-center min-h-8 p-1 ${isActive("/dashboard/invoices") ? "bg-primary/10 text-primary font-medium" : ""}`}>
                            <i className={`far fa-file-invoice-dollar fa-fw fa-lg ${isActive("/dashboard/invoices") ? "text-primary" : ""}`}></i>
                            {!sidebarCollapsed && <span>Invoices</span>}
                        </Link>
                    </li>
                    <li className={isActive("/dashboard/invoice-automation") ? "active" : ""}>
                        <Link href="/dashboard/invoice-automation" className={`flex items-center min-h-8 p-1 ${isActive("/dashboard/invoice-automation") ? "bg-primary/10 text-primary font-medium" : ""}`}>
                            <i className={`far fa-robot fa-fw fa-lg ${isActive("/dashboard/invoice-automation") ? "text-primary" : ""}`}></i>
                            {!sidebarCollapsed && <span>Invoice Automation</span>}
                        </Link>
                    </li>
                    <li className={isActive("/dashboard/rate-management") ? "active" : ""}>
                        <Link href="/dashboard/rate-management" className={`flex items-center min-h-8 p-1 ${isActive("/dashboard/rate-management") ? "bg-primary/10 text-primary font-medium" : ""}`}>
                            <i className={`far fa-money-bill-wave fa-fw fa-lg ${isActive("/dashboard/rate-management") ? "text-primary" : ""}`}></i>
                            {!sidebarCollapsed && <span>Rate Management</span>}
                        </Link>
                    </li>
                    <li className={isActive("/dashboard/reports") ? "active" : ""}>
                        <Link href="/dashboard/reports" className={`flex items-center min-h-8 p-1 ${isActive("/dashboard/reports") ? "bg-primary/10 text-primary font-medium" : ""}`}>
                            <i className={`far fa-chart-bar fa-fw fa-lg ${isActive("/dashboard/reports") ? "text-primary" : ""}`}></i>
                            {!sidebarCollapsed && <span>Reports</span>}
                        </Link>
                    </li>

                    {!sidebarCollapsed ? (
                        <li className="menu-title py-1 mx-0 px-0">
                            <span className="divider divider-start my-1">Media</span>
                        </li>
                    ) : (
                        <li className=" py-3 mx-0 px-0">
                            <span className="divider divider-start m-0 p-0"></span>
                        </li>
                    )}
                    <li className={isActive("/dashboard/media") ? "active" : ""}>
                        <Link href="/dashboard/media" className={`flex items-center min-h-8 p-1 ${isActive("/dashboard/media") ? "bg-primary/10 text-primary font-medium" : ""}`}>
                            <i className={`far fa-images fa-fw fa-lg ${isActive("/dashboard/media") ? "text-primary" : ""}`}></i>
                            {!sidebarCollapsed && <span>Media Library</span>}
                        </Link>
                    </li>
                    <li className={isActive("/dashboard/map") ? "active" : ""}>
                        <Link href="/dashboard/map" className={`flex items-center min-h-8 p-1 ${isActive("/dashboard/map") ? "bg-primary/10 text-primary font-medium" : ""}`}>
                            <i className={`far fa-location-dot fa-fw fa-lg ${isActive("/dashboard/map") ? "text-primary" : ""}`}></i>
                            {!sidebarCollapsed && <span>Map</span>}
                        </Link>
                    </li>
                </ul>

                {/* {!sidebarCollapsed && (
                    <div className="mt-auto pt-6">
                        <div className="bg-base-100 p-4 rounded-lg">
                            <div className="flex items-center mb-2">
                                <i className="fal fa-crown text-warning mr-2"></i>
                                <span className="font-semibold">Pro Plan</span>
                            </div>
                            <p className="text-sm mb-2">7 days left in trial</p>
                            <Link href="/dashboard/business" className="btn btn-primary btn-sm btn-block">
                                Upgrade Now
                            </Link>
                        </div>
                    </div>
                )} */}
            </div>
        </div>
    );
}
