import Link from "next/link"
import { ThemeToggle } from "@/components/theme-toggle"
import Image from "next/image"
import dynamic from "next/dynamic"
import LoginButton from "@/components/auth/login-button"


export default function Home() {
    return (
        <main className="min-h-screen flex flex-col lg:flex-row relative">
            {/* Theme toggle in top right */}
            <div className="absolute top-4 right-4">
                <ThemeToggle />
            </div>
            <section className="bg-base-100 w-full lg:w-1/2 flex flex-col items-center justify-center min-h-screen p-6 text-center">


                <div className="max-w-md">
                    <div className="mb-3">
                        <Image src="/logo-full.png" alt="JobSight Logo" width={200} height={16} className="mx-auto" />
                    </div>
                    <p className="mb-8 text-opacity-80">Construction management made simple</p>

                    <div className="flex flex-col gap-3">
                        <LoginButton className="btn btn-secondary">Login</LoginButton>
                        <Link href="/register" className="btn btn-primary w-full">
                            Get Started
                        </Link>
                        <Link href="/dashboard" className="btn btn-outline w-full">
                            Go to Dashboard
                        </Link>
                        <Link href="/onboarding" className="btn btn-ghost w-full">
                            Register with Onboarding
                        </Link>
                    </div>
                </div>
            </section>

            {/* Right Side - Orange */}
            <section className="bg-primary w-full lg:w-1/2 flex flex-col justify-center p-8 lg:p-16 min-h-screen">
                <div className="max-w-lg mx-auto">
                    <h2 className="text-3xl font-bold text-primary-content mb-10">Professional Construction Management</h2>

                    <div className="space-y-8">
                        <div className="flex items-start gap-4">
                            <div className="bg-white rounded-full p-2 mt-1">
                                <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-primary-content">Track Projects</h3>
                                <p className="text-primary-content text-opacity-80">Manage all your construction projects in one place</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="bg-white rounded-full p-2 mt-1">
                                <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-primary-content">Save Time</h3>
                                <p className="text-primary-content text-opacity-80">Streamline daily logs and task management</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="bg-white rounded-full p-2 mt-1">
                                <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-primary-content">Manage Teams</h3>
                                <p className="text-primary-content text-opacity-80">Coordinate crew and equipment efficiently</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-10">
                        <Link href="/pricing" className="btn bg-white text-primary hover:bg-white/90 border-none">
                            View Pricing Plans
                        </Link>
                    </div>
                </div>
            </section>
        </main>
    )
}
