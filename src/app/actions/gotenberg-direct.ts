"use server";

import { uploadPdfBuffer, linkExistingMediaToClient } from '@/app/actions/media';

const GOTENBERG_URL = process.env.GOTENBERG_URL || 'http://gotenberg-service:3000';

export interface GotenbergPdfOptions {
    html?: string;
    url?: string;
    filename: string;
    businessId?: string;
    clientId?: string;
    projectId?: string;
    description?: string;
    saveToStorage?: boolean;
    returnAsAttachment?: boolean;
}

export interface GotenbergPdfResult {
    success: boolean;
    buffer?: Buffer;
    media?: any;
    fileUrl?: string;
    filename?: string;
    size?: number;
    error?: string;
}

/**
 * Generate PDF using Gotenberg service directly (no API calls)
 */
export async function generatePdfWithGotenberg(options: GotenbergPdfOptions): Promise<GotenbergPdfResult> {
    try {
        const {
            html,
            url,
            filename,
            businessId,
            clientId,
            projectId,
            description = "Generated PDF document",
            saveToStorage = false,
            returnAsAttachment = true
        } = options;

        if (!html && !url) {
            throw new Error('Either URL or HTML content is required');
        }

        if (saveToStorage && !businessId) {
            throw new Error('businessId is required when saveToStorage is true');
        }

        let pdfBuffer: Buffer;

        if (html) {
            // For HTML content, use Gotenberg's HTML endpoint
            const formData = new FormData();
            formData.append('files', new Blob([html], { type: 'text/html' }), 'index.html');

            // Set PDF options
            formData.append('paperWidth', '8.27');  // A4 width in inches
            formData.append('paperHeight', '11.7'); // A4 height in inches
            formData.append('marginTop', '0.5');
            formData.append('marginBottom', '0.5');
            formData.append('marginLeft', '0.5');
            formData.append('marginRight', '0.5');

            const response = await fetch(`${GOTENBERG_URL}/forms/chromium/convert/html`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error(`Gotenberg HTML conversion failed: ${response.statusText}`);
            }

            pdfBuffer = Buffer.from(await response.arrayBuffer());
        } else if (url) {
            // For URL, use Gotenberg's URL endpoint with form data
            const formData = new FormData();
            formData.append('url', url);
            formData.append('paperWidth', '8.27');
            formData.append('paperHeight', '11.7');
            formData.append('marginTop', '0.5');
            formData.append('marginBottom', '0.5');
            formData.append('marginLeft', '0.5');
            formData.append('marginRight', '0.5');

            const response = await fetch(`${GOTENBERG_URL}/forms/chromium/convert/url`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error(`Gotenberg URL conversion failed: ${response.statusText}`);
            }

            pdfBuffer = Buffer.from(await response.arrayBuffer());
        } else {
            throw new Error('Either HTML or URL must be provided');
        }

        // Save to storage if requested
        let media = null;
        let fileUrl = null;

        if (saveToStorage && businessId) {
            try {
                // Upload the PDF buffer to media storage
                const uploadResult = await uploadPdfBuffer(
                    businessId,
                    pdfBuffer,
                    filename,
                    description
                ); if (uploadResult.success && uploadResult.media) {
                    media = uploadResult.media;
                    fileUrl = uploadResult.fileUrl || null;

                    // Link to client or project if provided
                    if (clientId && uploadResult.media.id) {
                        await linkExistingMediaToClient(businessId, [uploadResult.media.id], clientId);
                    }
                    // Note: linkExistingMediaToProject doesn't seem to exist yet
                }
            } catch (storageError) {
                console.error('Error saving PDF to storage:', storageError);
                // Continue without storage - don't fail the PDF generation
            }
        } return {
            success: true,
            buffer: pdfBuffer,
            media,
            fileUrl: fileUrl || undefined,
            filename,
            size: pdfBuffer.length
        };

    } catch (error) {
        console.error('Error generating PDF with Gotenberg:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}
