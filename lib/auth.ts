import { cookies } from "next/headers"

// Simple function to check if user is authenticated
export function isAuthenticated() {
  const cookieStore = cookies()
  return !!cookieStore.get("auth_session")
}

// Mock user data for preview
export function getUser() {
  if (!isAuthenticated()) {
    return null
  }

  return {
    id: "mock-user-id",
    given_name: "John",
    family_name: "Doe",
    email: "john.doe@example.com",
    picture: null,
  }
}
