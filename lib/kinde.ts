import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server"

// Server-side functions only
export const { getUser, isAuthenticated } = getKindeServerSession()
