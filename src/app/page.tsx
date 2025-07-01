import { redirect } from "next/navigation"

// Force dynamic rendering to avoid build-time issues with Clerk
export const dynamic = 'force-dynamic'

export default function Home() {
    redirect("/landing");
}
