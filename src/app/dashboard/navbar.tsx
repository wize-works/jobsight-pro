import { ThemeToggle } from "@/components/theme-toggle";
import Link from "next/link";
import { Notifications } from "./notifications";
import { useIsMobile } from "@/hooks/use-mobile";
import { LogoutLink } from "@kinde-oss/kinde-auth-nextjs";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { useBusiness } from "@/hooks/use-business";

type NavbarProps = {
    sidebarCollapsed: boolean;
    setSidebarCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
};

export const Navbar = ({ sidebarCollapsed, setSidebarCollapsed }: NavbarProps) => {
    const isMobile = useIsMobile();
    const { user } = useKindeBrowserClient();
    const { business } = useBusiness();

    const handleSidebarToggle = () => {
        localStorage.setItem("sidebarCollapsed", JSON.stringify(!sidebarCollapsed));
        setSidebarCollapsed(!sidebarCollapsed);
    }

    const userInitials = user?.given_name && user?.family_name 
        ? `${user.given_name[0]}${user.family_name[0]}`.toUpperCase()
        : user?.email?.[0]?.toUpperCase() || "U";

    return (
        <div className="navbar bg-base-100 border-b shadow-sm">
            {!isMobile && (
                <div className="flex-none hidden lg:block">
                    <button 
                        onClick={handleSidebarToggle} 
                        className="btn btn-square btn-ghost hover:bg-base-200"
                        aria-label="Toggle sidebar"
                    >
                        <i className={`far fa-xl transition-transform ${sidebarCollapsed ? "fa-square-chevron-right" : "fa-square-chevron-left"}`}></i>
                    </button>
                </div>
            )}
            <div className="flex-1">{/* Navbar spacer */}</div>
            <div className="flex items-center space-x-2">
                <ThemeToggle />
                <Notifications />
                <div className="dropdown dropdown-end">
                    <div 
                        tabIndex={0} 
                        role="button" 
                        className="btn btn-ghost flex items-center gap-2 hover:bg-base-200 px-3"
                        aria-label="User menu"
                    >
                        <div className="avatar">
                            <div className="w-8 h-8 rounded-full bg-primary text-primary-content flex items-center justify-center text-sm font-semibold">
                                {user?.picture ? (
                                    <img 
                                        alt="User avatar" 
                                        src={user.picture} 
                                        className="w-full h-full rounded-full object-cover"
                                    />
                                ) : (
                                    <span>{userInitials}</span>
                                )}
                            </div>
                        </div>
                        {!isMobile && (
                            <div className="hidden sm:flex flex-col items-start">
                                <span className="text-sm font-medium truncate max-w-24">
                                    {user?.given_name || user?.email?.split('@')[0] || "User"}
                                </span>
                                {business && (
                                    <span className="text-xs text-base-content/60 truncate max-w-24">
                                        {business.name}
                                    </span>
                                )}
                            </div>
                        )}
                        <i className="fas fa-chevron-down text-xs opacity-60"></i>
                    </div>
                    <div
                        tabIndex={0}
                        className="dropdown-content menu bg-base-100 rounded-box mt-2 w-64 p-0 shadow-lg border border-base-300 z-[1]"
                    >
                        {/* User Info Header */}
                        <div className="px-4 py-3 border-b border-base-300">
                            <div className="flex items-center gap-3">
                                <div className="avatar">
                                    <div className="w-10 h-10 rounded-full bg-primary text-primary-content flex items-center justify-center">
                                        {user?.picture ? (
                                            <img 
                                                alt="User avatar" 
                                                src={user.picture} 
                                                className="w-full h-full rounded-full object-cover"
                                            />
                                        ) : (
                                            <span className="font-semibold">{userInitials}</span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium text-sm truncate">
                                        {user?.given_name && user?.family_name 
                                            ? `${user.given_name} ${user.family_name}`
                                            : user?.email?.split('@')[0] || "User"
                                        }
                                    </div>
                                    <div className="text-xs text-base-content/60 truncate">
                                        {user?.email || "No email"}
                                    </div>
                                    {business && (
                                        <div className="text-xs text-base-content/50 truncate">
                                            {business.name}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Menu Items */}
                        <div className="py-2">
                            <Link href="/dashboard/profile" className="flex items-center gap-3 px-4 py-2 hover:bg-base-200 transition-colors">
                                <i className="fas fa-user w-4"></i>
                                <span className="text-sm">Profile</span>
                            </Link>
                            <Link href="/dashboard/settings/account" className="flex items-center gap-3 px-4 py-2 hover:bg-base-200 transition-colors">
                                <i className="fas fa-cog w-4"></i>
                                <span className="text-sm">Account Settings</span>
                            </Link>
                            {business && (
                                <Link href="/dashboard/business" className="flex items-center gap-3 px-4 py-2 hover:bg-base-200 transition-colors">
                                    <i className="fas fa-building w-4"></i>
                                    <span className="text-sm">Business</span>
                                </Link>
                            )}
                            <Link href="/dashboard/settings/team" className="flex items-center gap-3 px-4 py-2 hover:bg-base-200 transition-colors">
                                <i className="fas fa-users w-4"></i>
                                <span className="text-sm">Team</span>
                            </Link>
                        </div>

                        <div className="border-t border-base-300 py-2">
                            <LogoutLink className="flex items-center gap-3 px-4 py-2 hover:bg-error/10 text-error transition-colors w-full">
                                <i className="fas fa-sign-out-alt w-4"></i>
                                <span className="text-sm">Logout</span>
                            </LogoutLink>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
