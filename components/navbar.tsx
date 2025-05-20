import Link from "next/link"
import { ThemeToggle } from "@/components/theme-toggle"

export default function Navbar() {
  return (
    <div className="navbar bg-base-100 shadow-sm">
      <div className="navbar-start">
        <div className="dropdown">
          <div tabIndex={0} role="button" className="btn btn-ghost lg:hidden">
            <i className="fas fa-bars"></i>
          </div>
          <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52">
            <li>
              <Link href="/features" className="text-base-content">
                Features
              </Link>
            </li>
            <li>
              <Link href="/pricing" className="text-base-content">
                Pricing
              </Link>
            </li>
            <li>
              <Link href="/about" className="text-base-content">
                About
              </Link>
            </li>
          </ul>
        </div>
        <Link href="/" className="btn btn-ghost p-0">
          <img src="/logo-full.png" alt="JobSight" className="h-10 hidden sm:block" />
          <img src="/logo.png" alt="JobSight" className="h-10 sm:hidden" />
        </Link>
      </div>
      <div className="navbar-center hidden lg:flex">
        <ul className="menu menu-horizontal px-1">
          <li>
            <Link href="/features" className="text-base-content">
              Features
            </Link>
          </li>
          <li>
            <Link href="/pricing" className="text-base-content">
              Pricing
            </Link>
          </li>
          <li>
            <Link href="/about" className="text-base-content">
              About
            </Link>
          </li>
        </ul>
      </div>
      <div className="navbar-end">
        <ThemeToggle />
        <Link href="/login" className="btn btn-ghost ml-2">
          Login
        </Link>
        <Link href="/register" className="btn btn-primary">
          Get Started
        </Link>
      </div>
    </div>
  )
}
