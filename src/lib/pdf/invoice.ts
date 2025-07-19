// PDF generation utility for invoices
// Uses API client instead of actions for consistency

import { pdfGenerationApi } from '@/lib/api/pdf-generation';

export async function generateInvoicePdfServer(invoiceData: any, businessInfo: any): Promise<Uint8Array | null> {
    try {
        // Generate filename
        const filename = `Invoice-${invoiceData.invoice_number}-${new Date().toISOString().split('T')[0]}.pdf`;

        // Generate PDF using API client
        const result = await pdfGenerationApi.generateInvoicePdf({
            invoiceId: invoiceData.id,
            filename,
            returnAsAttachment: true
        });

        if (result.success && result.buffer) {
            return new Uint8Array(Buffer.from(result.buffer, 'base64'));
        }
        return null;
    } catch (error) {
        console.error('Error generating invoice PDF:', error);
        return null;
    }
}
