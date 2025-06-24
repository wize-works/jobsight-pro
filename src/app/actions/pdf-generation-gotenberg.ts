"use server";

import { withBusinessServer } from "@/lib/auth/with-business-server";

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
    media?: any;
    fileUrl?: string;
    filename?: string;
    size?: number;
    error?: string;
}

/**
 * Generate a PDF from HTML content or URL using Gotenberg and optionally save to media storage
 */
export async function generatePdfDocumentWithGotenberg(options: PdfGenerationOptions): Promise<PdfGenerationResult> {
    const { business } = await withBusinessServer();

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

        const apiEndpoint = saveToStorage ? '/api/generate-pdf-storage-gotenberg' : '/api/generate-pdf-gotenberg';

        const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}${apiEndpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                html,
                url,
                filename,
                businessId: business.id,
                clientId,
                projectId,
                description,
                saveToStorage,
                returnAsAttachment
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to generate PDF');
        }

        const result = await response.json();
        return result;

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
        const filename = `Client-${clientName.replace(/[^a-zA-Z0-9]/g, '_')}-${new Date().toISOString().split('T')[0]}.pdf`;

        // Generate and save PDF using Gotenberg
        return await generatePdfDocumentWithGotenberg({
            html,
            filename,
            description: `Client profile PDF for ${clientName}`,
            saveToStorage: true,
            clientId
        });

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

        const filename = `Project-${projectName.replace(/[^a-zA-Z0-9]/g, '_')}-${new Date().toISOString().split('T')[0]}.pdf`;

        return await generatePdfDocumentWithGotenberg({
            // html, // Will be implemented when project HTML generation is ready
            url: `${process.env.NEXTAUTH_URL}/dashboard/projects/${projectId}`, // Fallback to URL
            filename,
            description: `Project report PDF for ${projectName}`,
            saveToStorage: true,
            projectId,
            clientId
        });

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
        // You can implement client HTML generation later
        // const { generateClientHTML } = await import('@/app/actions/generate-html');
        // const html = await generateClientHTML(businessId, clientId);

        const filename = `Client-${clientName.replace(/[^a-zA-Z0-9]/g, '_')}-${new Date().toISOString().split('T')[0]}.pdf`;

        return await generatePdfDocumentWithGotenberg({
            // html, // Will be implemented when client HTML generation is ready
            url: `${process.env.NEXTAUTH_URL}/dashboard/clients/${clientId}`, // Fallback to URL
            filename,
            description: `Client report PDF for ${clientName}`,
            saveToStorage: true,
            clientId
        });

    } catch (error) {
        console.error('Error generating client PDF with Gotenberg:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to generate client PDF'
        };
    }
}
