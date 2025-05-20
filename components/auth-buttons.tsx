"use client"

import type React from "react"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { LoginLink, RegisterLink, LogoutLink } from "@kinde-oss/kinde-auth-nextjs/components"

export function LoginButton() {
  return (
    <Link href="/login" className="btn btn-ghost">
      Login
    </Link>
  )
}

export function RegisterButton() {
  return (
    <Link href="/register" className="btn btn-primary">
      Get Started
    </Link>
  )
}

export function KindeLoginButton({ className, children }: { className?: string; children?: React.ReactNode }) {
  return (
    <LoginLink className={className || "btn btn-primary"} postLoginRedirectURL="/dashboard">
      {children || "Login with Kinde"}
    </LoginLink>
  )
}

export function KindeRegisterButton({ className, children }: { className?: string; children?: React.ReactNode }) {
  return (
    <RegisterLink className={className || "btn btn-primary"} postLoginRedirectURL="/onboarding">
      {children || "Sign up with Kinde"}
    </RegisterLink>
  )
}

export function LogoutButton() {
  const router = useRouter()

  return (
    <LogoutLink
      className="link link-hover"
      postLogoutRedirectURL="/"
      onSuccess={() => {
        router.push("/")
        router.refresh()
      }}
    >
      Logout
    </LogoutLink>
  )
}
