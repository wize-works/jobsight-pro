import { ThemeToggle } from "@/components/theme-toggle";
import Link from "next/link";
import { Notifications } from "./notifications";
import { useIsMobile } from "@/hooks/use-mobile"
import { LogoutLink } from "@kinde-oss/kinde-auth-nextjs";

type NavbarProps = {
    sidebarCollapsed: boolean;
    setSidebarCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
};

export const Navbar = ({ sidebarCollapsed, setSidebarCollapsed }: NavbarProps) => {
    const isMobile = useIsMobile();

    const handleSidebarToggle = () => {
        localStorage.setItem("sidebarCollapsed", JSON.stringify(!sidebarCollapsed));
        setSidebarCollapsed(!sidebarCollapsed);
    }
    return (
        <div className="navbar bg-base-100 border-b">
            {!isMobile && (
                <div className="flex-none hidden lg:block">
                    <button onClick={() => handleSidebarToggle()} className="btn btn-square btn-ghost">
                        <i className={`fa-kit fa-xl ${sidebarCollapsed ? "fa-light-sidebar-circle-arrow-right" : "fa-light-sidebar-circle-arrow-left"}`}></i>
                    </button>
                </div>
            )}
            <div className="flex-1">{/* Navbar spacer */}</div>
            <div className="flex space-x-4">
                <ThemeToggle />
                <Notifications />
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
                            <LogoutLink className="justify-between">
                                Logout
                            </LogoutLink>
                        </li>
                    </ul>
                </div>
            </div>
        </div>

    );
}
