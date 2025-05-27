"use client"

import Link from "next/link";
import { usePathname } from "next/navigation";

export const BottomNav = () => {
    const pathname = usePathname();

    return (
        <div className="dock bg-base-100 lg:hidden border-t">
            <Link href="/dashboard" className={`${pathname === "/dashboard" ? "active" : ""}`}>
                <i className="fal fa-tachometer-alt fa-fw fa-lg"></i>
                <span className="dock-label text-xs">Dashboard</span>
            </Link>
            <Link href="/dashboard/projects" className={`${pathname === "/dashboard/projects" ? "active" : ""}`}>
                <i className="fal fa-project-diagram fa-fw fa-lg"></i>
                <span className="dock-label text-xs">Projects</span>
            </Link>
            <Link href="/dashboard/tasks" className={`${pathname === "/dashboard/tasks" ? "active" : ""}`}>
                <i className="fal fa-tasks fa-fw fa-lg"></i>
                <span className="dock-label text-xs">Tasks</span>
            </Link>
            <Link href="/dashboard/clients" className={`${pathname.startsWith("/dashboard/clients") ? "active" : ""}`}>
                <i className="fal fa-user-tie fa-fw fa-lg"></i>
                <span className="dock-label text-xs">Clients</span>
            </Link>
            <Link href="/dashboard/more" className={`${pathname === "/dashboard/more" ? "active" : ""}`}>
                <i className="fal fa-ellipsis-h fa-fw fa-lg"></i>
                <span className="dock-label text-xs">More</span>
            </Link>
        </div>
    );
}