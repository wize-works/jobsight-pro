declare module 'qrcode' {
    const QRCode: {
        toDataURL(text: string, options?: any): Promise<string>;
        // Add other methods as needed
    };
    export default QRCode;
}