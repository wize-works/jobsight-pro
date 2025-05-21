"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseBrowserClient } from "./supabase"

// Define types
type User = {
  id: string
  auth_id: string
  business_id: string
  firstName: string
  lastName: string
  email: string
  role: string
  avatar_url: string
}

type AuthContextType = {
  user: User | null
  isLoaded: boolean
  isSignedIn: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, firstName: string, lastName: string) => Promise<void>
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
    // Check if user is stored in localStorage (for preview purposes)
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      setUser(JSON.parse(storedUser))
      setIsLoaded(true)
      return
    }

    // For demo purposes, we'll use a mock user with the provided Kinde ID
    const mockUser: User = {
      id: "user_123456789",
      auth_id: "kp_ecd695ce489643809b28af7094ed80ad", // Using the provided Kinde ID
      business_id: "business_123456789",
      firstName: "John",
      lastName: "Doe",
      email: "john.doe@example.com",
      role: "Admin",
      avatar_url: "/diverse-avatars.png",
    }

    setUser(mockUser)
    localStorage.setItem("user", JSON.stringify(mockUser))
    setIsLoaded(true)
  }, [])

  const signIn = async (email: string, password: string) => {
    if (!supabase) return

    try {
      // In a real app, this would authenticate with Supabase Auth
      // For demo purposes, we'll just use our mock user
      const mockUser: User = {
        id: "user_123456789",
        auth_id: "kp_ecd695ce489643809b28af7094ed80ad", // Using the provided Kinde ID
        business_id: "business_123456789",
        firstName: "John",
        lastName: "Doe",
        email: email,
        role: "Admin",
        avatar_url: "/diverse-avatars.png",
      }

      setUser(mockUser)
      localStorage.setItem("user", JSON.stringify(mockUser))
      router.push("/dashboard")
    } catch (error) {
      console.error("Error signing in:", error)
    }
  }

  const signUp = async (email: string, password: string, firstName: string, lastName: string) => {
    if (!supabase) return

    try {
      // In a real app, this would register with Supabase Auth
      // For demo purposes, we'll just use our mock user with the provided info
      const mockUser: User = {
        id: "user_123456789",
        auth_id: "kp_a48db0a030564ea29c3c070875aef0bc", // Using the second provided Kinde ID
        business_id: "business_987654321",
        firstName: firstName,
        lastName: lastName,
        email: email,
        role: "Admin",
        avatar_url: "/diverse-avatars.png",
      }

      setUser(mockUser)
      localStorage.setItem("user", JSON.stringify(mockUser))
      router.push("/onboarding")
    } catch (error) {
      console.error("Error signing up:", error)
    }
  }

  const signOut = () => {
    setUser(null)
    localStorage.removeItem("user")
    router.push("/")
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
