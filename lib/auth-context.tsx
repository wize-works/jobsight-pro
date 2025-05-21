"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { useRouter } from "next/navigation"

// Define types
type User = {
  id: string
  firstName: string
  lastName: string
  email: string
  imageUrl: string
}

type AuthContextType = {
  user: User | null
  isLoaded: boolean
  isSignedIn: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, firstName: string, lastName: string) => Promise<void>
  signOut: () => void
}

// Create mock user
const mockUser: User = {
  id: "user_123456789",
  firstName: "John",
  lastName: "Doe",
  email: "john.doe@example.com",
  imageUrl: "/diverse-avatars.png",
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Check if user is stored in localStorage (for preview purposes)
    const storedUser = localStorage.getItem("mockUser")
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
    setIsLoaded(true)
  }, [])

  const signIn = async (email: string, password: string) => {
    // Mock authentication - in a real app, this would call Clerk's API
    setUser(mockUser)
    localStorage.setItem("mockUser", JSON.stringify(mockUser))
    router.push("/dashboard")
  }

  const signUp = async (email: string, password: string, firstName: string, lastName: string) => {
    // Mock registration - in a real app, this would call Clerk's API
    const newUser = { ...mockUser, firstName, lastName, email }
    setUser(newUser)
    localStorage.setItem("mockUser", JSON.stringify(newUser))
    router.push("/onboarding")
  }

  const signOut = () => {
    setUser(null)
    localStorage.removeItem("mockUser")
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
