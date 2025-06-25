"use server";

import { withBusinessServer } from "@/lib/auth/with-business-server";
import { generateClientHTML, generateInvoiceHTML } from "@/app/actions/generate-html";
import { generatePdfWithGotenberg } from "@/app/actions/gotenberg-direct";

export interface PdfGenerationOptions {
    html?: string;
    url?: string;
    filename: string;
    description?: string;
    saveToStorage?: boolean;
    clientId?: string;
    projectId?: string;
    returnAsAttachment?: boolean;
}

export interface PdfGenerationResult {
    success: boolean;
    buffer?: Uint8Array; // Changed from Buffer to Uint8Array for serialization
    media?: any;
    fileUrl?: string;
    filename?: string;
    size?: number;
    error?: string;
}

/**
 * Generate a PDF from HTML content or URL using Gotenberg directly (no API calls)
 */
export async function generatePdfDocumentWithGotenberg(options: PdfGenerationOptions, businessId?: string): Promise<PdfGenerationResult> {
    // Only use withBusinessServer if businessId is not provided
    let actualBusinessId = businessId;

    if (!actualBusinessId) {
        const { business } = await withBusinessServer();
        actualBusinessId = business.id;
    }

    try {
        const {
            html,
            url,
            filename,
            description = "Generated PDF document",
            saveToStorage = true,
            clientId,
            projectId,
            returnAsAttachment = false
        } = options;

        if (!html && !url) {
            throw new Error('Either HTML or URL must be provided');
        }

        // Use the direct Gotenberg action instead of API calls
        const result = await generatePdfWithGotenberg({
            html,
            url,
            filename,
            businessId: actualBusinessId,
            clientId,
            projectId,
            description,
            saveToStorage,
            returnAsAttachment
        });

        if (!result.success) {
            throw new Error(result.error || 'Failed to generate PDF');
        } return {
            success: true,
            buffer: result.buffer ? new Uint8Array(result.buffer) : undefined,
            media: result.media ? { buffer: result.buffer, ...result.media } : undefined,
            fileUrl: result.fileUrl,
            filename: result.filename,
            size: result.size
        };

    } catch (error) {
        console.error('Error in generatePdfDocumentWithGotenberg:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}

/**
 * Generate a client profile PDF using Gotenberg and save to media storage
 */
export async function generateClientPdfWithGotenberg(
    businessId: string,
    clientId: string,
    clientName: string
): Promise<PdfGenerationResult> {
    try {
        // Import the HTML generation function
        const { generateClientHTML } = await import('@/app/actions/generate-html');

        // Generate HTML content
        const html = await generateClientHTML(businessId, clientId);

        // Generate filename with date
        const filename = `Client-${clientName.replace(/[^a-zA-Z0-9]/g, '_')}-${new Date().toISOString().split('T')[0]}.pdf`;        // Generate and save PDF using Gotenberg
        return await generatePdfDocumentWithGotenberg({
            html,
            filename,
            description: `Client profile PDF for ${clientName}`,
            saveToStorage: true,
            clientId
        }, businessId);

    } catch (error) {
        console.error('Error generating client PDF with Gotenberg:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to generate client PDF'
        };
    }
}

/**
 * Generate a project report PDF using Gotenberg and save to media storage
 */
export async function generateProjectPdfWithGotenberg(
    businessId: string,
    projectId: string,
    projectName: string,
    clientId?: string
): Promise<PdfGenerationResult> {
    try {
        // You can implement project HTML generation later
        // const { generateProjectHTML } = await import('@/app/actions/generate-html');
        // const html = await generateProjectHTML(businessId, projectId);

        const filename = `Project-${projectName.replace(/[^a-zA-Z0-9]/g, '_')}-${new Date().toISOString().split('T')[0]}.pdf`; return await generatePdfDocumentWithGotenberg({
            // html, // Will be implemented when project HTML generation is ready
            url: `${process.env.NEXTAUTH_URL}/dashboard/projects/${projectId}`, // Fallback to URL
            filename,
            description: `Project report PDF for ${projectName}`,
            saveToStorage: true,
            projectId,
            clientId
        }, businessId);

    } catch (error) {
        console.error('Error generating project PDF with Gotenberg:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to generate project PDF'
        };
    }
}

/**
 * Generate a client PDF using Gotenberg and save to media storage
 */
export async function generateClientPdf(
    businessId: string,
    clientId: string,
    clientName: string
): Promise<PdfGenerationResult> {
    try {
        console.log('Starting client PDF generation for:', { businessId, clientId, clientName });

        // Generate client HTML content using direct import
        const html = await generateClientHTML(businessId, clientId);
        console.log('Successfully generated client HTML, length:', html.length);

        const filename = `Client-${clientName.replace(/[^a-zA-Z0-9]/g, '_')}-${new Date().toISOString().split('T')[0]}.pdf`;

        console.log('Calling generatePdfDocumentWithGotenberg with filename:', filename);
        return await generatePdfDocumentWithGotenberg({
            html,
            filename,
            description: `Client report PDF for ${clientName}`,
            saveToStorage: true,
            clientId
        }, businessId);

    } catch (error) {
        console.error('Error generating client PDF with Gotenberg:', error);
        console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to generate client PDF'
        };
    }
}

/**
 * Generate an invoice PDF using Gotenberg and return as downloadable response
 */
export async function generateInvoicePdf(
    businessId: string,
    invoiceId: string,
    filename: string
): Promise<PdfGenerationResult> {
    try {        // Generate invoice HTML content using direct import
        const html = await generateInvoiceHTML(businessId, invoiceId);
        return await generatePdfDocumentWithGotenberg({
            html,
            filename,
            description: `Invoice PDF`,
            saveToStorage: false, // For direct download
            returnAsAttachment: true
        }, businessId);

    } catch (error) {
        console.error('Error generating invoice PDF with Gotenberg:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to generate invoice PDF'
        };
    }
}
