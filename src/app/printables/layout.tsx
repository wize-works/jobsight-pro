export default function PrintLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <body style={{ background: "#fff", color: "#222", margin: 0, fontFamily: 'sans-serif' }}>
                <div style={{ margin: "0 auto", padding: 0 }}>
                    {children}
                </div>
            </body>
        </html>
    );
}
