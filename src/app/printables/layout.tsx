import { BusinessProvider } from "@/lib/business-context";

export default function PrintLayout({ children }: { children: React.ReactNode }) {
    return (
        <BusinessProvider>
            <div style={{ margin: "0 auto", padding: 0 }} data-theme="light" className="bg-white">
                {children}
            </div>
        </BusinessProvider>
    );
}
