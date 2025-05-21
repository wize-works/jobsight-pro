"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseBrowserClient } from "./supabase"

// Define types
type User = {
  id: string
  auth_id: string
  business_id?: string
  firstName: string
  lastName: string
  email: string
  role: string
  avatar_url?: string
}

type AuthContextType = {
  user: User | null
  isLoaded: boolean
  isSignedIn: boolean
  signIn: () => void
  signUp: () => void
  signOut: () => void
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const router = useRouter()
  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        // Check if we have a Kinde access token in cookies
        const response = await fetch("/api/auth/me")
        if (!response.ok) {
          setUser(null)
          setIsLoaded(true)
          return
        }

        const userData = await response.json()

        if (userData && userData.id) {
          // We have a valid user from Kinde, now get the user data from our database
          if (supabase) {
            const { data: dbUser } = await supabase.from("users").select("*").eq("auth_id", userData.id).single()

            if (dbUser) {
              setUser({
                id: dbUser.id,
                auth_id: dbUser.auth_id,
                business_id: dbUser.business_id,
                firstName: dbUser.first_name,
                lastName: dbUser.last_name,
                email: dbUser.email,
                role: dbUser.role,
                avatar_url: dbUser.avatar_url,
              })
            }
          }
        } else {
          setUser(null)
        }
      } catch (error) {
        console.error("Error checking auth status:", error)
        setUser(null)
      } finally {
        setIsLoaded(true)
      }
    }

    checkAuthStatus()
  }, [supabase])

  const signIn = () => {
    router.push("/api/auth/kinde/login")
  }

  const signUp = () => {
    router.push("/api/auth/kinde/register")
  }

  const signOut = () => {
    router.push("/api/auth/kinde/logout")
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoaded,
        isSignedIn: !!user,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
