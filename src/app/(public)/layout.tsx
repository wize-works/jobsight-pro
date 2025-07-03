import Footer from "@/components/footer";
import { ThemeToggle } from "@/components/theme-toggle";
import { SignInButton, SignOutButton, UserButton } from '@clerk/nextjs';
import { auth, currentUser } from '@clerk/nextjs/server';
import Link from "next/link";

export default async function PublicLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { userId } = await auth();
    const user = await currentUser();

    return (
        <div className="flex min-h-screen flex-col relative">
            <header className="navbar absolute top-0 left-0 right-0 z-50">
                <div className="flex-1"></div>
                <div className="flex-none space-x-4">
                    <div className="hidden">{user?.id}</div>
                    {user ? (
                        <>
                            <Link href="/dashboard" className="btn btn-primary">
                                Dashboard
                            </Link>
                            <SignOutButton>
                                <button className="btn btn-outline btn-secondary">Logout</button>
                            </SignOutButton>
                        </>
                    ) : (
                        <Link href={"/sign-in"}>
                            Login
                        </Link>
                    )}
                    <ThemeToggle />
                </div>
            </header>
            <main className="flex-grow">{children}</main>
        </div>
    );
}
