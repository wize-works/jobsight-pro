export default function PrintLayout({ children }: { children: React.ReactNode }) {
    return (
        <div style={{ margin: "0 auto", padding: 0 }} data-theme="light" className="bg-white">
            {children}
        </div>
    );
}
