import { ThemeToggle } from "@/components/theme-toggle";
import Link from "next/link";
type NavbarProps = {
    sidebarCollapsed: boolean;
    setSidebarCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
};

export const Navbar = ({ sidebarCollapsed, setSidebarCollapsed }: NavbarProps) => {
    return (
        <div className="navbar bg-base-100 border-b">
            <div className="flex-none lg:hidden">
                <label htmlFor="my-drawer-2" className="btn btn-square btn-ghost">
                    <i className="fas fa-bars"></i>
                </label>
            </div>
            <div className="flex-none hidden lg:block">
                <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="btn btn-square btn-ghost">
                    <i className={`fas fa-${sidebarCollapsed ? "chevron-right" : "chevron-left"}`}></i>
                </button>
            </div>
            <div className="flex-1">{/* Navbar spacer */}</div>
            <div className="flex space-x-4">
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

    );
}