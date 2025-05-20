"use client"

import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs"
import Link from "next/link"
import { LogoutButton } from "./auth-buttons"

export function UserNav() {
  const { user } = useKindeBrowserClient()

  if (!user) return null

  return (
    <div className="dropdown dropdown-end">
      <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar">
        <div className="w-10 rounded-full">
          {user.picture ? (
            <img src={user.picture || "/placeholder.svg"} alt={user.given_name || "User avatar"} />
          ) : (
            <div className="bg-primary text-primary-content flex items-center justify-center h-full text-lg font-semibold">
              {user.given_name?.[0] || user.email?.[0] || "U"}
            </div>
          )}
        </div>
      </div>
      <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52">
        <li>
          <Link href="/dashboard/profile" className="justify-between">
            Profile
            <span className="badge badge-primary badge-sm">New</span>
          </Link>
        </li>
        <li>
          <Link href="/dashboard/settings">Settings</Link>
        </li>
        <li>
          <LogoutButton />
        </li>
      </ul>
    </div>
  )
}
