import Link
    from "next/link";
interface SidebarProps {
    sidebarCollapsed: boolean;
}

export const Sidebar = ({ sidebarCollapsed }: SidebarProps) => {
    return (
        <div className="drawer-side bg-base-100">
            <label htmlFor="my-drawer-2" aria-label="close sidebar" className="drawer-overlay"></label>
            <div
                className={`menu p-4 ${sidebarCollapsed ? "w-20" : "w-64"} min-h-full text-base-content transition-all duration-300`}
            >
                <div className="mb-6 flex items-center justify-center">
                    {sidebarCollapsed ? (
                        <img src="/logo.png" alt="JobSight" className="h-10" />
                    ) : (
                        <img src="/logo-full.png" alt="JobSight" className="h-10" />
                    )}
                </div>

                <ul className="space-y-1">
                    <li>
                        <Link href="/dashboard" className="flex items-center">
                            <i className="fas fa-tachometer-alt w-5"></i>
                            {!sidebarCollapsed && <span>Dashboard</span>}
                        </Link>
                    </li>

                    {!sidebarCollapsed && (
                        <li className="menu-title">
                            <span>Organization</span>
                        </li>
                    )}
                    <li>
                        <Link href="/dashboard/business" className="flex items-center">
                            <i className="fas fa-building w-5"></i>
                            {!sidebarCollapsed && <span>Business</span>}
                        </Link>
                    </li>
                    <li>
                        <Link href="/dashboard/crews" className="flex items-center">
                            <i className="fas fa-users w-5"></i>
                            {!sidebarCollapsed && <span>Crews</span>}
                        </Link>
                    </li>
                    <li>
                        <Link href="/dashboard/equipment" className="flex items-center">
                            <i className="fas fa-truck w-5"></i>
                            {!sidebarCollapsed && <span>Equipment</span>}
                            {!sidebarCollapsed && <span className="badge badge-sm badge-primary ml-auto">New</span>}
                        </Link>
                    </li>
                    <li>
                        <Link href="/dashboard/clients" className="flex items-center">
                            <i className="fas fa-user-tie w-5"></i>
                            {!sidebarCollapsed && <span>Clients</span>}
                            {!sidebarCollapsed && <span className="badge badge-sm badge-primary ml-auto">New</span>}
                        </Link>
                    </li>

                    {!sidebarCollapsed && (
                        <li className="menu-title">
                            <span>Projects</span>
                        </li>
                    )}
                    <li>
                        <Link href="/dashboard/projects" className="flex items-center">
                            <i className="fas fa-project-diagram w-5"></i>
                            {!sidebarCollapsed && <span>Projects</span>}
                        </Link>
                    </li>
                    <li>
                        <Link href="/dashboard/tasks" className="flex items-center">
                            <i className="fas fa-tasks w-5"></i>
                            {!sidebarCollapsed && <span>Tasks</span>}
                        </Link>
                    </li>
                    <li>
                        <Link href="/dashboard/daily-logs" className="flex items-center">
                            <i className="fas fa-clipboard-list w-5"></i>
                            {!sidebarCollapsed && <span>Daily Logs</span>}
                        </Link>
                    </li>

                    {!sidebarCollapsed && (
                        <li className="menu-title">
                            <span>Finance</span>
                        </li>
                    )}
                    <li>
                        <Link href="/dashboard/invoices" className="flex items-center">
                            <i className="fas fa-file-invoice-dollar w-5"></i>
                            {!sidebarCollapsed && <span>Invoices</span>}
                        </Link>
                    </li>

                    {!sidebarCollapsed && (
                        <li className="menu-title">
                            <span>Media</span>
                        </li>
                    )}
                    <li>
                        <Link href="/dashboard/media" className="flex items-center">
                            <i className="fas fa-images w-5"></i>
                            {!sidebarCollapsed && <span>Media Library</span>}
                        </Link>
                    </li>

                    {!sidebarCollapsed && (
                        <li className="menu-title">
                            <span>Reports</span>
                        </li>
                    )}
                    <li>
                        <Link href="/dashboard/reports" className="flex items-center">
                            <i className="fas fa-chart-bar w-5"></i>
                            {!sidebarCollapsed && <span>Reports</span>}
                        </Link>
                    </li>
                </ul>

                {!sidebarCollapsed && (
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
                )}
            </div>
        </div>
    );
}
