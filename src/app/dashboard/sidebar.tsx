import Link from "next/link";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

interface SidebarProps {
    sidebarCollapsed: boolean;
}

export const Sidebar = ({ sidebarCollapsed }: SidebarProps) => {
    const { resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    // After mounting, we have access to the theme
    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <div className="drawer-side bg-base-100">
            <label htmlFor="my-drawer-2" aria-label="close sidebar" className="drawer-overlay"></label>
            <div className={`menu ${sidebarCollapsed ? "w-16" : "w-64"} min-h-full text-base-content transition-all duration-300`} >
                <div className="mb-6 flex items-center justify-center">
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
                    <li className="">
                        <Link href="/dashboard" className="flex items-center min-h-8 p-1">
                            <i className="far fa-tachometer-alt fa-fw fa-lg"></i>
                            {!sidebarCollapsed && <span>Dashboard</span>}
                        </Link>
                    </li>

                    {!sidebarCollapsed ? (
                        <li className="menu-title py-1 mx-0 px-0">
                            <span className="divider my-1">Organization</span>
                        </li>
                    ) : (
                        <li className="menu-title py-1 mx-0 px-0">
                            <span className="divider my-1"></span>
                        </li>
                    )}
                    <li className="">
                        <Link href="/dashboard/business" className="flex items-center min-h-8 p-1">
                            <i className="far fa-buildings fa-fw fa-lg"></i>
                            {!sidebarCollapsed && <span>Business</span>}
                        </Link>
                    </li>
                    <li className="">
                        <Link href="/dashboard/crews" className="flex items-center min-h-8 p-1">
                            <i className="far fa-user-helmet-safety fa-fw fa-lg"></i>
                            {!sidebarCollapsed && <span>Crews</span>}
                            {!sidebarCollapsed && <span className="badge badge-sm badge-accent ml-auto">New</span>}
                        </Link>
                    </li>
                    <li className="">
                        <Link href="/dashboard/equipment" className="flex items-center min-h-8 p-1">
                            <i className="far fa-excavator fa-fw fa-lg"></i>
                            {!sidebarCollapsed && <span>Equipment</span>}
                            {!sidebarCollapsed && <span className="badge badge-sm badge-accent ml-auto">New</span>}
                        </Link>
                    </li>
                    <li className="">
                        <Link href="/dashboard/clients" className="flex items-center min-h-8 p-1">
                            <i className="far fa-user-tie fa-fw fa-lg"></i>
                            {!sidebarCollapsed && <span>Clients</span>}
                            {!sidebarCollapsed && <span className="badge badge-sm badge-accent ml-auto">New</span>}
                        </Link>
                    </li>

                    {!sidebarCollapsed ? (
                        <li className="menu-title py-1 mx-0 px-0">
                            <span className="divider my-1">Projects</span>
                        </li>
                    ) : (
                        <li className="menu-title py-1 mx-0 px-0">
                            <span className="divider my-1"></span>
                        </li>
                    )}
                    <li className="">
                        <Link href="/dashboard/projects" className="flex items-center min-h-8 p-1">
                            <i className="far fa-person-digging fa-fw fa-lg"></i>
                            {!sidebarCollapsed && <span>Projects</span>}
                            {!sidebarCollapsed && <span className="badge badge-sm badge-neutral ml-auto">Next</span>}
                        </Link>
                    </li>
                    <li className="">
                        <Link href="/dashboard/tasks" className="flex items-center min-h-8 p-1">
                            <i className="far fa-tasks fa-fw fa-lg"></i>
                            {!sidebarCollapsed && <span>Tasks</span>}
                        </Link>
                    </li>
                    <li className="">
                        <Link href="/dashboard/daily-logs" className="flex items-center min-h-8 p-1">
                            <i className="far fa-clipboard-list fa-fw fa-lg"></i>
                            {!sidebarCollapsed && <span>Daily Logs</span>}
                        </Link>
                    </li>

                    {!sidebarCollapsed ? (
                        <li className="menu-title py-1 mx-0 px-0">
                            <span className="divider my-1">Finance</span>
                        </li>
                    ) : (
                        <li className="menu-title py-1 mx-0 px-0">
                            <span className="divider my-1"></span>
                        </li>
                    )}
                    <li className="">
                        <Link href="/dashboard/invoices" className="flex items-center min-h-8 p-1">
                            <i className="far fa-file-invoice-dollar fa-fw fa-lg"></i>
                            {!sidebarCollapsed && <span>Invoices</span>}
                        </Link>
                    </li>
                    <li className="">
                        <Link href="/dashboard/reports" className="flex items-center min-h-8 p-1">
                            <i className="far fa-chart-bar fa-fw fa-lg"></i>
                            {!sidebarCollapsed && <span>Reports</span>}
                        </Link>
                    </li>

                    {!sidebarCollapsed ? (
                        <li className="menu-title py-1 mx-0 px-0">
                            <span className="divider my-1">Media</span>
                        </li>
                    ) : (
                        <li className="menu-title py-1 mx-0 px-0">
                            <span className="divider my-1"></span>
                        </li>
                    )}
                    <li className="">
                        <Link href="/dashboard/media" className="flex items-center min-h-8 p-1">
                            <i className="far fa-images fa-fw fa-lg"></i>
                            {!sidebarCollapsed && <span>Media Library</span>}
                        </Link>
                    </li>
                    <li className="">
                        <Link href="/dashboard/map" className="flex items-center min-h-8 p-1">
                            <i className="far fa-location-dot fa-fw fa-lg"></i>
                            {!sidebarCollapsed && <span>Map</span>}
                        </Link>
                    </li>
                </ul>

                {!sidebarCollapsed && (
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
                )}
            </div>
        </div>
    );
}
