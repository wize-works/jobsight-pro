import Footer from "@/components/footer";
import { ThemeToggle } from "@/components/theme-toggle";
import { LoginLink, LogoutLink } from "@kinde-oss/kinde-auth-nextjs"
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

export default async function PublicLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { getUser } = await getKindeServerSession();
    const user = await getUser();

    return (
        <div className="flex min-h-screen flex-col relative">
            <header className="navbar absolute top-0 left-0 right-0 z-50">
                <div className="flex-1">
                </div>
                <div className="flex-none">
                    {user?.email}
                    <ThemeToggle />
                </div>
            </header>
            <main className="flex-grow">{children}</main>
        </div>
    );
}