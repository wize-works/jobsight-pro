import QRCode from "@/components/qrcode";

export default function EquipmentQRCode({ id }: { id: string }) {
    return (
        <html lang="en">
            <body style={{ background: "#fff", color: "#222", margin: 0, fontFamily: 'sans-serif' }}>
                <div style={{ maxWidth: 900, margin: "0 auto", padding: 0 }}>
                    <div style={{ textAlign: "center", padding: "20px" }}>
                        <QRCode text={`https://pro.jobsight.co/dashboard/equipment/${id}`} width={1280} />
                    </div>
                </div>
            </body>
        </html>
    );
}