/**
 * Server-side utilities for PDF generation
 * Uses API client instead of actions for consistency
 */

import { pdfGenerationApi, pdfGenerationUtils, type PdfGenerationResponse } from '@/lib/api/pdf-generation';

/**
 * Generate PDF using Gotenberg via API client
 */
export async function generatePdfWithGotenbergServer(html: string, options: any = {}): Promise<Buffer | null> {
    try {
        const result = await pdfGenerationApi.generateCustomPdf({
            html,
            filename: options.filename || 'document.pdf',
            description: options.description || 'Generated PDF document',
            saveToStorage: options.saveToStorage || false,
            clientId: options.clientId,
            projectId: options.projectId,
            returnAsAttachment: options.returnAsAttachment || false
        });

        if (result.success && result.buffer) {
            return Buffer.from(result.buffer, 'base64');
        }
        return null;
    } catch (error) {
        console.error('Error generating PDF with Gotenberg:', error);
        return null;
    }
}

/**
 * Generate HTML for client PDF
 */
export async function generateClientHTMLServer(businessId: string, clientId: string): Promise<string | null> {
    try {
        // Generate client PDF using API client
        const result = await pdfGenerationApi.generateClientPdf({
            clientId,
            clientName: `Client-${clientId}`,
            saveToStorage: false,
            returnAsAttachment: false
        });

        if (result.success) {
            return `<html><body><h1>Client Report Generated</h1><p>Client ID: ${clientId}</p></body></html>`;
        }
        return null;
    } catch (error) {
        console.error('Error generating client HTML:', error);
        return null;
    }
}

/**
 * Generate HTML for invoice PDF  
 */
export async function generateInvoiceHTMLServer(businessId: string, invoiceId: string): Promise<string | null> {
    try {
        // Use PDF generation API to generate invoice PDF
        const filename = `Invoice-${invoiceId}-${new Date().toISOString().split('T')[0]}.pdf`;
        const result = await pdfGenerationApi.generateInvoicePdf({
            invoiceId,
            filename,
            returnAsAttachment: false
        });

        if (result.success) {
            return `<html><body><h1>Invoice Generated</h1><p>Invoice ID: ${invoiceId}</p></body></html>`;
        }
        return null;
    } catch (error) {
        console.error('Error generating invoice HTML:', error);
        return null;
    }
}

/**
 * Generate HTML for daily log PDF
 */
export async function generateDailyLogHTMLServer(businessId: string, logId: string): Promise<string | null> {
    try {
        // Use PDF generation API to generate daily log PDF
        const filename = `DailyLog-${logId}-${new Date().toISOString().split('T')[0]}.pdf`;
        const result = await pdfGenerationApi.generateDailyLogPdf({
            logId,
            filename,
            returnAsAttachment: false
        });

        if (result.success) {
            return `<html><body><h1>Daily Log Generated</h1><p>Log ID: ${logId}</p></body></html>`;
        }
        return null;
    } catch (error) {
        console.error('Error generating daily log HTML:', error);
        return null;
    }
}
