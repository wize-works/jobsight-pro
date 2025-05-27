"use client";
import React, { useEffect, useState } from "react";

interface QRCodeProps {
    text: string;
    width?: number;
    margin?: number;
    errorCorrectionLevel?: "L" | "M" | "Q" | "H";
}

const QRCodeClient: React.FC<QRCodeProps> = ({
    text,
    width = 256,
    margin = 1,
    errorCorrectionLevel = "H",
}) => {
    const [dataUrl, setDataUrl] = useState<string>("");
    const [error, setError] = useState<string>("");

    useEffect(() => {
        let isMounted = true;
        async function generate() {
            try {
                const QRCode = (await import("qrcode")).default;
                const url = await QRCode.toDataURL(text, {
                    errorCorrectionLevel,
                    type: "image/png",
                    width,
                    margin,
                });
                if (isMounted) setDataUrl(url);
            } catch (err) {
                if (isMounted) setError("Failed to generate QR code");
            }
        }
        generate();
        return () => {
            isMounted = false;
        };
    }, [text, width, margin, errorCorrectionLevel]);

    if (error) return <div>{error}</div>;
    if (!dataUrl) return <div>Loading QR code...</div>;
    return <img src={dataUrl} alt="QR code" width={width} height={width} />;
};

export default QRCodeClient;