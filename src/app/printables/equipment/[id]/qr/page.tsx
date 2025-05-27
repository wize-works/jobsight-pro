import QRCode from "@/components/qrcode";

export default async function EquipmentQRCode({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return (
        <div style={{ textAlign: "center", padding: "20px" }}>
            <QRCode text={`https://pro.jobsight.co/dashboard/equipment/${id}`} width={1280} />
        </div>
    );
}