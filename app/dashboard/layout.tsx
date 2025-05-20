"use client"

import type React from "react"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { ThemeToggle } from "@/components/theme-toggle"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for auth cookie on client side
    const cookies = document.cookie.split(";")
    const authCookie = cookies.find((cookie) => cookie.trim().startsWith("auth_session="))

    if (!authCookie) {
      router.push("/login")
    } else {
      setIsAuthenticated(true)
    }

    setIsLoading(false)
  }, [router])

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    )
  }

  // If not authenticated, the useEffect will redirect to login
  if (!isAuthenticated) {
    return null
  }

  // Check if a path is active
  const isActive = (path: string) => {
    return pathname === path || pathname.startsWith(`${path}/`)
  }

  // Mock user data for preview
  const user = {
    given_name: "John",
    family_name: "Doe",
    email: "john.doe@example.com",
    picture: null,
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Sidebar for desktop */}
      <aside className="w-64 bg-base-200 hidden md:flex flex-col h-screen sticky top-0">
        <div className="p-4 border-b border-base-300">
          <Link href="/dashboard" className="flex items-center">
            <i className="fas fa-hard-hat text-primary text-2xl mr-2"></i>
            <span className="text-xl font-bold">JobSight</span>
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto p-4">
          <ul className="menu menu-md gap-2">
            <li>
              <Link href="/dashboard" className={isActive("/dashboard") && !isActive("/dashboard/") ? "active" : ""}>
                <i className="fas fa-tachometer-alt w-5"></i>
                <span>Dashboard</span>
              </Link>
            </li>
            <li>
              <Link href="/dashboard/projects" className={isActive("/dashboard/projects") ? "active" : ""}>
                <i className="fas fa-project-diagram w-5"></i>
                <span>Projects</span>
              </Link>
            </li>
            <li>
              <Link href="/dashboard/tasks" className={isActive("/dashboard/tasks") ? "active" : ""}>
                <i className="fas fa-tasks w-5"></i>
                <span>Tasks</span>
              </Link>
            </li>
            <li>
              <Link href="/dashboard/crews" className={isActive("/dashboard/crews") ? "active" : ""}>
                <i className="fas fa-users w-5"></i>
                <span>Crews</span>
              </Link>
            </li>
            <li>
              <Link href="/dashboard/equipment" className={isActive("/dashboard/equipment") ? "active" : ""}>
                <i className="fas fa-truck w-5"></i>
                <span>Equipment</span>
              </Link>
            </li>
            <li>
              <Link href="/dashboard/clients" className={isActive("/dashboard/clients") ? "active" : ""}>
                <i className="fas fa-user-tie w-5"></i>
                <span>Clients</span>
                {isActive("/dashboard/clients") && <span className="badge badge-sm badge-primary">New</span>}
              </Link>
            </li>
            <li>
              <Link href="/dashboard/daily-logs" className={isActive("/dashboard/daily-logs") ? "active" : ""}>
                <i className="fas fa-clipboard-list w-5"></i>
                <span>Daily Logs</span>
              </Link>
            </li>
            <li>
              <Link href="/dashboard/invoices" className={isActive("/dashboard/invoices") ? "active" : ""}>
                <i className="fas fa-file-invoice-dollar w-5"></i>
                <span>Invoices</span>
              </Link>
            </li>
            <li>
              <Link href="/dashboard/media" className={isActive("/dashboard/media") ? "active" : ""}>
                <i className="fas fa-images w-5"></i>
                <span>Media</span>
              </Link>
            </li>
            <li>
              <Link href="/dashboard/reports" className={isActive("/dashboard/reports") ? "active" : ""}>
                <i className="fas fa-chart-bar w-5"></i>
                <span>Reports</span>
              </Link>
            </li>
          </ul>

          <div className="divider"></div>

          <ul className="menu menu-md gap-2">
            <li>
              <Link href="/dashboard/organization" className={isActive("/dashboard/organization") ? "active" : ""}>
                <i className="fas fa-building w-5"></i>
                <span>Organization</span>
              </Link>
            </li>
            <li>
              <Link href="/dashboard/settings" className={isActive("/dashboard/settings") ? "active" : ""}>
                <i className="fas fa-cog w-5"></i>
                <span>Settings</span>
              </Link>
            </li>
            <li>
              <Link href="/dashboard/help" className={isActive("/dashboard/help") ? "active" : ""}>
                <i className="fas fa-question-circle w-5"></i>
                <span>Help</span>
              </Link>
            </li>
          </ul>
        </nav>

        <div className="p-4 border-t border-base-300">
          <div className="flex items-center">
            <div className="avatar">
              <div className="w-10 rounded-full">
                {user?.picture ? (
                  <img src={user.picture || "/placeholder.svg"} alt={user.given_name || "User"} />
                ) : (
                  <div className="bg-primary text-primary-content flex items-center justify-center h-full text-lg font-semibold">
                    {user?.given_name?.[0] || user?.email?.[0] || "U"}
                  </div>
                )}
              </div>
            </div>
            <div className="ml-3">
              <p className="font-medium">{user?.given_name || user?.email || "User"}</p>
              <p className="text-xs text-base-content/70">Admin</p>
            </div>
            <div className="dropdown dropdown-end ml-auto">
              <div tabIndex={0} role="button" className="btn btn-ghost btn-xs">
                <i className="fas fa-ellipsis-v"></i>
              </div>
              <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
                <li>
                  <Link href="/dashboard/profile">Profile</Link>
                </li>
                <li>
                  <button
                    onClick={() => {
                      document.cookie = "auth_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
                      router.push("/")
                    }}
                  >
                    Logout
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Top navbar */}
        <header className="navbar bg-base-100 shadow-md sticky top-0 z-10 md:pl-4">
          <div className="navbar-start">
            <div className="dropdown md:hidden">
              <div tabIndex={0} role="button" className="btn btn-ghost">
                <i className="fas fa-bars"></i>
              </div>
              <ul
                tabIndex={0}
                className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52"
              >
                <li>
                  <Link
                    href="/dashboard"
                    className={isActive("/dashboard") && !isActive("/dashboard/") ? "active" : ""}
                  >
                    <i className="fas fa-tachometer-alt w-5"></i>
                    <span>Dashboard</span>
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard/projects" className={isActive("/dashboard/projects") ? "active" : ""}>
                    <i className="fas fa-project-diagram w-5"></i>
                    <span>Projects</span>
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard/tasks" className={isActive("/dashboard/tasks") ? "active" : ""}>
                    <i className="fas fa-tasks w-5"></i>
                    <span>Tasks</span>
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard/crews" className={isActive("/dashboard/crews") ? "active" : ""}>
                    <i className="fas fa-users w-5"></i>
                    <span>Crews</span>
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard/equipment" className={isActive("/dashboard/equipment") ? "active" : ""}>
                    <i className="fas fa-truck w-5"></i>
                    <span>Equipment</span>
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard/clients" className={isActive("/dashboard/clients") ? "active" : ""}>
                    <i className="fas fa-user-tie w-5"></i>
                    <span>Clients</span>
                    {isActive("/dashboard/clients") && <span className="badge badge-sm badge-primary">New</span>}
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard/daily-logs" className={isActive("/dashboard/daily-logs") ? "active" : ""}>
                    <i className="fas fa-clipboard-list w-5"></i>
                    <span>Daily Logs</span>
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard/invoices" className={isActive("/dashboard/invoices") ? "active" : ""}>
                    <i className="fas fa-file-invoice-dollar w-5"></i>
                    <span>Invoices</span>
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard/media" className={isActive("/dashboard/media") ? "active" : ""}>
                    <i className="fas fa-images w-5"></i>
                    <span>Media</span>
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard/reports" className={isActive("/dashboard/reports") ? "active" : ""}>
                    <i className="fas fa-chart-bar w-5"></i>
                    <span>Reports</span>
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard/organization" className={isActive("/dashboard/organization") ? "active" : ""}>
                    <i className="fas fa-building w-5"></i>
                    <span>Organization</span>
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard/settings" className={isActive("/dashboard/settings") ? "active" : ""}>
                    <i className="fas fa-cog w-5"></i>
                    <span>Settings</span>
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard/help" className={isActive("/dashboard/help") ? "active" : ""}>
                    <i className="fas fa-question-circle w-5"></i>
                    <span>Help</span>
                  </Link>
                </li>
              </ul>
            </div>
            <Link href="/" className="btn btn-ghost text-xl md:hidden">
              <i className="fas fa-hard-hat text-primary mr-2"></i>
              JobSight
            </Link>
          </div>
          <div className="navbar-center">
            <div className="form-control">
              <input type="text" placeholder="Search..." className="input input-bordered w-24 md:w-auto" />
            </div>
          </div>
          <div className="navbar-end">
            <button className="btn btn-ghost btn-circle">
              <div className="indicator">
                <i className="fas fa-bell"></i>
                <span className="badge badge-xs badge-primary indicator-item">3</span>
              </div>
            </button>
            <ThemeToggle />
            <div className="dropdown dropdown-end">
              <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar">
                <div className="w-10 rounded-full">
                  {user?.picture ? (
                    <img src={user.picture || "/placeholder.svg"} alt={user.given_name || "User avatar"} />
                  ) : (
                    <div className="bg-primary text-primary-content flex items-center justify-center h-full text-lg font-semibold">
                      {user?.given_name?.[0] || user?.email?.[0] || "U"}
                    </div>
                  )}
                </div>
              </div>
              <ul
                tabIndex={0}
                className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52"
              >
                <li>
                  <Link href="/dashboard/profile" className="justify-between">
                    Profile
                    <span className="badge badge-primary badge-sm">New</span>
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard/organization">Organization</Link>
                </li>
                <li>
                  <Link href="/dashboard/settings">Settings</Link>
                </li>
                <li>
                  <button
                    onClick={() => {
                      document.cookie = "auth_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
                      router.push("/")
                    }}
                  >
                    Logout
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-6 bg-base-200">{children}</main>

        {/* Mobile bottom navigation */}
        <nav className="btm-nav bg-base-100 md:hidden">
          <Link href="/dashboard" className={isActive("/dashboard") && !isActive("/dashboard/") ? "active" : ""}>
            <i className="fas fa-tachometer-alt"></i>
            <span className="btm-nav-label">Dashboard</span>
          </Link>
          <Link href="/dashboard/projects" className={isActive("/dashboard/projects") ? "active" : ""}>
            <i className="fas fa-project-diagram"></i>
            <span className="btm-nav-label">Projects</span>
          </Link>
          <Link href="/dashboard/tasks" className={isActive("/dashboard/tasks") ? "active" : ""}>
            <i className="fas fa-tasks"></i>
            <span className="btm-nav-label">Tasks</span>
          </Link>
          <Link href="/dashboard/crews" className={isActive("/dashboard/crews") ? "active" : ""}>
            <i className="fas fa-users"></i>
            <span className="btm-nav-label">Crews</span>
          </Link>
          <Link href="/dashboard/more" className={isActive("/dashboard/more") ? "active" : ""}>
            <i className="fas fa-ellipsis-h"></i>
            <span className="btm-nav-label">More</span>
          </Link>
        </nav>
      </div>
    </div>
  )
}
