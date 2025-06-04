import Footer from "@/components/footer";
import { ThemeToggle } from "@/components/theme-toggle";

export default function PublicLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen flex-col relative">
            <header className="navbar absolute top-0 left-0 right-0 z-50">
                <div className="flex-1">
                </div>
                <div className="flex-none">
                    <ThemeToggle />
                </div>
            </header>
            <main className="flex-grow">{children}</main>
        </div>
    );
}