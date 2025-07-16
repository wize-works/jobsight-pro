// PDF Generation API Client
export interface PdfGenerationRequest {
    type: 'client' | 'invoice' | 'daily-log' | 'project' | 'custom';
    html?: string;
    url?: string;
    filename: string;
    description?: string;
    saveToStorage?: boolean;
    clientId?: string;
    projectId?: string;
    invoiceId?: string;
    logId?: string;
    returnAsAttachment?: boolean;
}

export interface PdfGenerationResponse {
    success: boolean;
    buffer?: string; // base64 encoded buffer
    media?: any;
    fileUrl?: string;
    filename?: string;
    size?: number;
    error?: string;
}

// Specific PDF generation options
export interface ClientPdfOptions {
    clientId: string;
    clientName: string;
    saveToStorage?: boolean;
    returnAsAttachment?: boolean;
}

export interface InvoicePdfOptions {
    invoiceId: string;
    filename: string;
    returnAsAttachment?: boolean;
}

export interface DailyLogPdfOptions {
    logId: string;
    filename: string;
    returnAsAttachment?: boolean;
}

export interface ProjectPdfOptions {
    projectId: string;
    projectName: string;
    clientId?: string;
    saveToStorage?: boolean;
    returnAsAttachment?: boolean;
}

export interface CustomPdfOptions {
    html?: string;
    url?: string;
    filename: string;
    description?: string;
    saveToStorage?: boolean;
    clientId?: string;
    projectId?: string;
    returnAsAttachment?: boolean;
}

// API Client
class PdfGenerationApiClient {
    private baseUrl = '/api/pdf-generation';

    async generatePdf(request: PdfGenerationRequest): Promise<PdfGenerationResponse> {
        const response = await fetch(this.baseUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(request),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to generate PDF');
        }

        return response.json();
    }

    async generateClientPdf(options: ClientPdfOptions): Promise<PdfGenerationResponse> {
        const filename = `Client-${options.clientName.replace(/[^a-zA-Z0-9]/g, '_')}-${new Date().toISOString().split('T')[0]}.pdf`;

        return this.generatePdf({
            type: 'client',
            clientId: options.clientId,
            filename,
            description: `Client profile PDF for ${options.clientName}`,
            saveToStorage: options.saveToStorage ?? true,
            returnAsAttachment: options.returnAsAttachment ?? false
        });
    }

    async generateInvoicePdf(options: InvoicePdfOptions): Promise<PdfGenerationResponse> {
        return this.generatePdf({
            type: 'invoice',
            invoiceId: options.invoiceId,
            filename: options.filename,
            description: 'Invoice PDF',
            saveToStorage: false,
            returnAsAttachment: options.returnAsAttachment ?? true
        });
    }

    async generateDailyLogPdf(options: DailyLogPdfOptions): Promise<PdfGenerationResponse> {
        return this.generatePdf({
            type: 'daily-log',
            logId: options.logId,
            filename: options.filename,
            description: 'Daily Log PDF',
            saveToStorage: false,
            returnAsAttachment: options.returnAsAttachment ?? true
        });
    }

    async generateProjectPdf(options: ProjectPdfOptions): Promise<PdfGenerationResponse> {
        const filename = `Project-${options.projectName.replace(/[^a-zA-Z0-9]/g, '_')}-${new Date().toISOString().split('T')[0]}.pdf`;

        return this.generatePdf({
            type: 'project',
            projectId: options.projectId,
            clientId: options.clientId,
            filename,
            description: `Project report PDF for ${options.projectName}`,
            saveToStorage: options.saveToStorage ?? true,
            returnAsAttachment: options.returnAsAttachment ?? false
        });
    }

    async generateCustomPdf(options: CustomPdfOptions): Promise<PdfGenerationResponse> {
        return this.generatePdf({
            type: 'custom',
            html: options.html,
            url: options.url,
            filename: options.filename,
            description: options.description,
            saveToStorage: options.saveToStorage ?? true,
            clientId: options.clientId,
            projectId: options.projectId,
            returnAsAttachment: options.returnAsAttachment ?? false
        });
    }
}

// Export singleton instance
export const pdfGenerationApi = new PdfGenerationApiClient();

// Utility functions for common PDF generation patterns
export const pdfGenerationUtils = {
    /**
     * Generate a client profile PDF and save to storage
     */
    async generateClientProfile(clientId: string, clientName: string): Promise<PdfGenerationResponse> {
        return pdfGenerationApi.generateClientPdf({
            clientId,
            clientName,
            saveToStorage: true,
            returnAsAttachment: false
        });
    },

    /**
     * Generate an invoice PDF for download
     */
    async generateInvoiceDownload(invoiceId: string, filename: string): Promise<PdfGenerationResponse> {
        return pdfGenerationApi.generateInvoicePdf({
            invoiceId,
            filename,
            returnAsAttachment: true
        });
    },

    /**
     * Generate a daily log PDF for download
     */
    async generateDailyLogDownload(logId: string, filename: string): Promise<PdfGenerationResponse> {
        return pdfGenerationApi.generateDailyLogPdf({
            logId,
            filename,
            returnAsAttachment: true
        });
    },

    /**
     * Generate a project report PDF and save to storage
     */
    async generateProjectReport(projectId: string, projectName: string, clientId?: string): Promise<PdfGenerationResponse> {
        return pdfGenerationApi.generateProjectPdf({
            projectId,
            projectName,
            clientId,
            saveToStorage: true,
            returnAsAttachment: false
        });
    },

    /**
     * Download PDF as a file
     */
    downloadPdf(buffer: string, filename: string): void {
        const byteCharacters = atob(buffer);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    },

    /**
     * Format file size for display
     */
    formatFileSize(bytes: number): string {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    /**
     * Generate filename with date
     */
    generateFilename(prefix: string, extension: string = 'pdf'): string {
        const date = new Date().toISOString().split('T')[0];
        return `${prefix}-${date}.${extension}`;
    }
};
