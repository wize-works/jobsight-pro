import { ThemeToggle } from "@/components/theme-toggle";
import Link from "next/link";
import { Notifications } from "./notifications";
import { useIsMobile } from "@/hooks/use-mobile";
import {
    LogoutLink,
    useKindeBrowserClient,
} from "@kinde-oss/kinde-auth-nextjs";

type NavbarProps = {
    sidebarCollapsed: boolean;
    setSidebarCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
};

export const Navbar = ({
    sidebarCollapsed,
    setSidebarCollapsed,
}: NavbarProps) => {
    const isMobile = useIsMobile();
    const { user } = useKindeBrowserClient();

    const handleSidebarToggle = () => {
        localStorage.setItem(
            "sidebarCollapsed",
            JSON.stringify(!sidebarCollapsed),
        );
        setSidebarCollapsed(!sidebarCollapsed);
    };

    const getUserInitials = () => {
        if (!user?.given_name && !user?.family_name) return "U";
        return `${user?.given_name?.[0] || ""}${user?.family_name?.[0] || ""}`.toUpperCase();
    };

    return (
        <div className="navbar bg-base-100 border-b border-base-300 shadow-sm">
            {!isMobile && (
                <div className="flex-none hidden lg:block">
                    <button
                        onClick={() => handleSidebarToggle()}
                        className="btn btn-square btn-ghost"
                    >
                        <i
                            className={`far fa-xl ${sidebarCollapsed ? "fa-square-chevron-right" : "fa-square-chevron-left"}`}
                        ></i>
                    </button>
                </div>
            )}

            <div className="flex-1">
                {/* Quick search or breadcrumbs could go here */}
            </div>

            <div className="flex items-center gap-2">
                <ThemeToggle />
                <Notifications />

                {/* User menu */}
                <div className="dropdown dropdown-end">
                    <div
                        tabIndex={0}
                        role="button"
                        className="btn btn-ghost flex items-center gap-2 hover:bg-base-200 transition-colors"
                    >
                        <div className="avatar">
                            <div className="w-8 h-8 rounded-full bg-primary text-primary-content flex items-center justify-center text-sm font-medium">
                                {user?.picture ? (
                                    <img
                                        alt={user?.given_name || "User avatar"}
                                        src={user.picture}
                                        className="w-full h-full rounded-full object-cover"
                                    />
                                ) : (
                                    getUserInitials()
                                )}
                            </div>
                        </div>
                        <div className="hidden md:block text-left">
                            <div className="text-sm font-medium">
                                {user?.given_name
                                    ? `${user.given_name} ${user?.family_name || ""}`.trim()
                                    : "User"}
                            </div>
                            <div className="text-xs text-base-content/60">
                                {user?.email || "user@example.com"}
                            </div>
                        </div>
                        <i className="far fa-chevron-down text-xs"></i>
                    </div>

                    <ul
                        tabIndex={0}
                        className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow-lg bg-base-100 rounded-box w-64 border border-base-200"
                    >
                        {/* User info header */}
                        <li className="menu-title px-4 py-2">
                            <div className="flex items-center gap-3">
                                <div className="avatar">
                                    <div className="w-10 h-10 rounded-full bg-primary text-primary-content flex items-center justify-center">
                                        {user?.picture ? (
                                            <img
                                                alt={
                                                    user?.given_name ||
                                                    "User avatar"
                                                }
                                                src={user.picture}
                                                className="w-full h-full rounded-full object-cover"
                                            />
                                        ) : (
                                            getUserInitials()
                                        )}
                                    </div>
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="font-medium text-sm truncate">
                                        {user?.given_name
                                            ? `${user.given_name} ${user?.family_name || ""}`.trim()
                                            : "User"}
                                    </div>
                                    <div className="text-xs text-base-content/60 truncate">
                                        {user?.email || "user@example.com"}
                                    </div>
                                </div>
                            </div>
                        </li>

                        <div className="divider my-1"></div>

                        <li>
                            <Link href="/dashboard/profile" className="flex items-center gap-3 py-2" >
                                <i className="far fa-user w-4"></i>
                                <span>Profile</span>
                            </Link>
                        </li>
                        <li>
                            <Link href="/dashboard/settings" className="flex items-center gap-3 py-2" >
                                <i className="far fa-cog w-4"></i>
                                <span>Settings</span>
                            </Link>
                        </li>
                        <li>
                            <Link href="/dashboard/business" className="flex items-center gap-3 py-2" >
                                <i className="far fa-buildings w-4"></i>
                                <span>Business Settings</span>
                            </Link>
                        </li>

                        <div className="divider my-1"></div>

                        <li>
                            <Link href="/dashboard/reports" className="flex items-center gap-3 py-2" >
                                <i className="far fa-chart-bar w-4"></i>
                                <span>Reports</span>
                            </Link>
                        </li>
                        <li>
                            <Link href="/dashboard/more" className="flex items-center gap-3 py-2">
                                <i className="far fa-ellipsis-h w-4"></i>
                                <span>More Tools</span>
                            </Link>
                        </li>

                        <div className="divider my-1"></div>

                        <li>
                            <LogoutLink className="flex items-center gap-3 py-2 text-error hover:bg-error/10">
                                <i className="far fa-sign-out w-4"></i>
                                <span>Sign Out</span>
                            </LogoutLink>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
};
