"use client"

import Link from "next/link";
import { usePathname } from "next/navigation";

export const BottomNav = () => {
    const pathname = usePathname();

    return (
        <div className="dock dock-md bg-base-100 lg:hidden border-t">
            <Link href="/dashboard" className={`${pathname === "/dashboard" ? "dock-active" : ""}`}>
                <i className="far fa-tachometer-alt fa-fw"></i>
                <span className="dock-label">Dashboard</span>
            </Link>
            <Link href="/dashboard/projects" className={`${pathname === "/dashboard/projects" ? "dock-active" : ""}`}>
                <i className="far fa-project-diagram fa-fw"></i>
                <span className="dock-label">Projects</span>
            </Link>
            <Link href="/dashboard/tasks" className={`${pathname === "/dashboard/tasks" ? "dock-active" : ""}`}>
                <i className="far fa-tasks fa-fw"></i>
                <span className="dock-label">Tasks</span>
            </Link>
            <Link href="/dashboard/clients" className={`${pathname.includes("/dashboard/clients") ? "dock-active" : ""}`}>
                <i className="far fa-user-tie fa-fw"></i>
                <span className="dock-label">Clients</span>
            </Link>
            <Link href="/dashboard/more" className={`${pathname === "/dashboard/more" ? "active" : ""}`}>
                <i className="far fa-ellipsis-h fa-fw"></i>
                <span className="dock-label">More</span>
            </Link>
        </div>
    );
}