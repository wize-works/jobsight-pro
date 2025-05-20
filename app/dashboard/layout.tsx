import type React from "react"
import Link from "next/link"
import { ThemeToggle } from "@/components/theme-toggle"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="drawer lg:drawer-open">
      <input id="my-drawer-2" type="checkbox" className="drawer-toggle" />
      <div className="drawer-content flex flex-col">
        {/* Navbar */}
        <div className="navbar bg-base-100 border-b">
          <div className="flex-none lg:hidden">
            <label htmlFor="my-drawer-2" className="btn btn-square btn-ghost">
              <i className="fas fa-bars"></i>
            </label>
          </div>
          <div className="flex-1">
            <Link href="/dashboard" className="btn btn-ghost p-0">
              <img src="/logo-full.png" alt="JobSight" className="h-10 hidden sm:block" />
              <img src="/logo.png" alt="JobSight" className="h-10 sm:hidden" />
            </Link>
          </div>
          <div className="flex-none gap-2">
            <ThemeToggle />
            <div className="dropdown dropdown-end">
              <div tabIndex={0} role="button" className="btn btn-ghost btn-circle">
                <i className="fas fa-bell"></i>
                <span className="badge badge-sm badge-primary indicator-item">3</span>
              </div>
              <div tabIndex={0} className="mt-3 z-[1] card card-compact dropdown-content w-52 bg-base-100 shadow">
                <div className="card-body">
                  <span className="font-bold text-lg">3 Notifications</span>
                  <div className="text-sm">
                    <div className="py-2 border-b">
                      <p className="font-semibold">Equipment inspection due</p>
                      <p className="text-xs">Excavator #103 - Today</p>
                    </div>
                    <div className="py-2 border-b">
                      <p className="font-semibold">Task assigned</p>
                      <p className="text-xs">Foundation work - Main St Project</p>
                    </div>
                    <div className="py-2">
                      <p className="font-semibold">Invoice paid</p>
                      <p className="text-xs">Johnson Residence - $3,450</p>
                    </div>
                  </div>
                  <div className="card-actions">
                    <Link href="/dashboard/notifications" className="btn btn-primary btn-block btn-sm">
                      View all
                    </Link>
                  </div>
                </div>
              </div>
            </div>
            <div className="dropdown dropdown-end">
              <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar">
                <div className="w-10 rounded-full">
                  <img alt="User avatar" src="/diverse-avatars.png" />
                </div>
              </div>
              <ul
                tabIndex={0}
                className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52"
              >
                <li>
                  <Link href="/dashboard/profile" className="justify-between">
                    Profile
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard/settings">Settings</Link>
                </li>
                <li>
                  <Link href="/">Logout</Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Page content */}
        <div className="p-4 md:p-6">{children}</div>
      </div>

      {/* Sidebar */}
      <div className="drawer-side">
        <label htmlFor="my-drawer-2" aria-label="close sidebar" className="drawer-overlay"></label>
        <div className="menu p-4 w-64 min-h-full bg-base-200 text-base-content">
          <div className="mb-6 flex items-center justify-center">
            <img src="/logo-full.png" alt="JobSight" className="h-10 hidden sm:block" />
            <img src="/logo.png" alt="JobSight" className="h-10 sm:hidden" />
          </div>

          <ul className="space-y-1">
            <li>
              <Link href="/dashboard" className="flex items-center">
                <i className="fas fa-tachometer-alt w-5"></i>
                <span>Dashboard</span>
              </Link>
            </li>

            <li className="menu-title">
              <span>Organization</span>
            </li>
            <li>
              <Link href="/dashboard/business" className="flex items-center">
                <i className="fas fa-building w-5"></i>
                <span>Business</span>
              </Link>
            </li>
            <li>
              <Link href="/dashboard/crews" className="flex items-center">
                <i className="fas fa-users w-5"></i>
                <span>Crews</span>
              </Link>
            </li>
            <li>
              <Link href="/dashboard/equipment" className="flex items-center">
                <i className="fas fa-truck w-5"></i>
                <span>Equipment</span>
                <span className="badge badge-sm badge-primary ml-auto">New</span>
              </Link>
            </li>
            <li>
              <Link href="/dashboard/clients" className="flex items-center">
                <i className="fas fa-user-tie w-5"></i>
                <span>Clients</span>
                <span className="badge badge-sm badge-primary ml-auto">New</span>
              </Link>
            </li>

            <li className="menu-title">
              <span>Projects</span>
            </li>
            <li>
              <Link href="/dashboard/projects" className="flex items-center">
                <i className="fas fa-project-diagram w-5"></i>
                <span>Projects</span>
              </Link>
            </li>
            <li>
              <Link href="/dashboard/tasks" className="flex items-center">
                <i className="fas fa-tasks w-5"></i>
                <span>Tasks</span>
              </Link>
            </li>
            <li>
              <Link href="/dashboard/daily-logs" className="flex items-center">
                <i className="fas fa-clipboard-list w-5"></i>
                <span>Daily Logs</span>
              </Link>
            </li>

            <li className="menu-title">
              <span>Finance</span>
            </li>
            <li>
              <Link href="/dashboard/invoices" className="flex items-center">
                <i className="fas fa-file-invoice-dollar w-5"></i>
                <span>Invoices</span>
              </Link>
            </li>

            <li className="menu-title">
              <span>Media</span>
            </li>
            <li>
              <Link href="/dashboard/media" className="flex items-center">
                <i className="fas fa-images w-5"></i>
                <span>Media Library</span>
              </Link>
            </li>

            <li className="menu-title">
              <span>Reports</span>
            </li>
            <li>
              <Link href="/dashboard/reports" className="flex items-center">
                <i className="fas fa-chart-bar w-5"></i>
                <span>Reports</span>
              </Link>
            </li>
          </ul>

          <div className="mt-auto pt-6">
            <div className="bg-base-100 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <i className="fas fa-crown text-warning mr-2"></i>
                <span className="font-semibold">Pro Plan</span>
              </div>
              <p className="text-sm mb-2">7 days left in trial</p>
              <Link href="/dashboard/subscription" className="btn btn-primary btn-sm btn-block">
                Upgrade Now
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
