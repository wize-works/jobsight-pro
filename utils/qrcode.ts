// 'use client';
// This file is a utility and cannot be a client component directly.
// To use QR code generation on the client, move this logic into a React component in /components or /app, and use a dynamic import for 'qrcode' if needed.

import QRCode from 'qrcode';

export async function generateQRCode(text: string): Promise<string> {
    try {
        const qrCodeDataUrl = await QRCode.toDataURL(text, {
            errorCorrectionLevel: 'H',
            type: 'image/png',
            width: 256,
            margin: 1,
        });
        return qrCodeDataUrl;
    } catch (error) {
        console.error('Error generating QR code:', error);
        throw new Error('Failed to generate QR code');
    }
}