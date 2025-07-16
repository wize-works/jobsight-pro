import { useState, useCallback } from 'react';
import {
    pdfGenerationApi,
    pdfGenerationUtils,
    PdfGenerationRequest,
    PdfGenerationResponse,
    ClientPdfOptions,
    InvoicePdfOptions,
    DailyLogPdfOptions,
    ProjectPdfOptions,
    CustomPdfOptions
} from '@/lib/api/pdf-generation';

// Base hook for PDF generation
export function usePdfGeneration() {
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const generatePdf = useCallback(async (request: PdfGenerationRequest): Promise<PdfGenerationResponse | null> => {
        try {
            setIsGenerating(true);
            setError(null);

            const response = await pdfGenerationApi.generatePdf(request);
            return response;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to generate PDF';
            setError(errorMessage);
            return null;
        } finally {
            setIsGenerating(false);
        }
    }, []);

    return {
        generatePdf,
        isGenerating,
        error,
        clearError: () => setError(null)
    };
}

// Hook for client PDF generation
export function useClientPdf() {
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const generateClientPdf = useCallback(async (options: ClientPdfOptions): Promise<PdfGenerationResponse | null> => {
        try {
            setIsGenerating(true);
            setError(null);

            const response = await pdfGenerationApi.generateClientPdf(options);
            return response;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to generate client PDF';
            setError(errorMessage);
            return null;
        } finally {
            setIsGenerating(false);
        }
    }, []);

    const generateClientProfile = useCallback(async (clientId: string, clientName: string): Promise<PdfGenerationResponse | null> => {
        return generateClientPdf({
            clientId,
            clientName,
            saveToStorage: true,
            returnAsAttachment: false
        });
    }, [generateClientPdf]);

    return {
        generateClientPdf,
        generateClientProfile,
        isGenerating,
        error,
        clearError: () => setError(null)
    };
}

// Hook for invoice PDF generation
export function useInvoicePdf() {
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const generateInvoicePdf = useCallback(async (options: InvoicePdfOptions): Promise<PdfGenerationResponse | null> => {
        try {
            setIsGenerating(true);
            setError(null);

            const response = await pdfGenerationApi.generateInvoicePdf(options);
            return response;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to generate invoice PDF';
            setError(errorMessage);
            return null;
        } finally {
            setIsGenerating(false);
        }
    }, []);

    const generateInvoiceDownload = useCallback(async (invoiceId: string, filename: string): Promise<void> => {
        const response = await generateInvoicePdf({
            invoiceId,
            filename,
            returnAsAttachment: true
        });

        if (response?.success && response.buffer) {
            pdfGenerationUtils.downloadPdf(response.buffer, filename);
        }
    }, [generateInvoicePdf]);

    return {
        generateInvoicePdf,
        generateInvoiceDownload,
        isGenerating,
        error,
        clearError: () => setError(null)
    };
}

// Hook for daily log PDF generation
export function useDailyLogPdf() {
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const generateDailyLogPdf = useCallback(async (options: DailyLogPdfOptions): Promise<PdfGenerationResponse | null> => {
        try {
            setIsGenerating(true);
            setError(null);

            const response = await pdfGenerationApi.generateDailyLogPdf(options);
            return response;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to generate daily log PDF';
            setError(errorMessage);
            return null;
        } finally {
            setIsGenerating(false);
        }
    }, []);

    const generateDailyLogDownload = useCallback(async (logId: string, filename: string): Promise<void> => {
        const response = await generateDailyLogPdf({
            logId,
            filename,
            returnAsAttachment: true
        });

        if (response?.success && response.buffer) {
            pdfGenerationUtils.downloadPdf(response.buffer, filename);
        }
    }, [generateDailyLogPdf]);

    return {
        generateDailyLogPdf,
        generateDailyLogDownload,
        isGenerating,
        error,
        clearError: () => setError(null)
    };
}

// Hook for project PDF generation
export function useProjectPdf() {
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const generateProjectPdf = useCallback(async (options: ProjectPdfOptions): Promise<PdfGenerationResponse | null> => {
        try {
            setIsGenerating(true);
            setError(null);

            const response = await pdfGenerationApi.generateProjectPdf(options);
            return response;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to generate project PDF';
            setError(errorMessage);
            return null;
        } finally {
            setIsGenerating(false);
        }
    }, []);

    const generateProjectReport = useCallback(async (projectId: string, projectName: string, clientId?: string): Promise<PdfGenerationResponse | null> => {
        return generateProjectPdf({
            projectId,
            projectName,
            clientId,
            saveToStorage: true,
            returnAsAttachment: false
        });
    }, [generateProjectPdf]);

    return {
        generateProjectPdf,
        generateProjectReport,
        isGenerating,
        error,
        clearError: () => setError(null)
    };
}

// Hook for custom PDF generation
export function useCustomPdf() {
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const generateCustomPdf = useCallback(async (options: CustomPdfOptions): Promise<PdfGenerationResponse | null> => {
        try {
            setIsGenerating(true);
            setError(null);

            const response = await pdfGenerationApi.generateCustomPdf(options);
            return response;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to generate custom PDF';
            setError(errorMessage);
            return null;
        } finally {
            setIsGenerating(false);
        }
    }, []);

    return {
        generateCustomPdf,
        isGenerating,
        error,
        clearError: () => setError(null)
    };
}

// Combined hook for all PDF generation types
export function usePdfOperations() {
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const generatePdf = useCallback(async (request: PdfGenerationRequest): Promise<PdfGenerationResponse | null> => {
        try {
            setIsGenerating(true);
            setError(null);

            const response = await pdfGenerationApi.generatePdf(request);
            return response;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to generate PDF';
            setError(errorMessage);
            return null;
        } finally {
            setIsGenerating(false);
        }
    }, []);

    const generateClientProfile = useCallback(async (clientId: string, clientName: string) => {
        return pdfGenerationUtils.generateClientProfile(clientId, clientName);
    }, []);

    const generateInvoiceDownload = useCallback(async (invoiceId: string, filename: string) => {
        const response = await pdfGenerationUtils.generateInvoiceDownload(invoiceId, filename);
        if (response?.success && response.buffer) {
            pdfGenerationUtils.downloadPdf(response.buffer, filename);
        }
        return response;
    }, []);

    const generateDailyLogDownload = useCallback(async (logId: string, filename: string) => {
        const response = await pdfGenerationUtils.generateDailyLogDownload(logId, filename);
        if (response?.success && response.buffer) {
            pdfGenerationUtils.downloadPdf(response.buffer, filename);
        }
        return response;
    }, []);

    const generateProjectReport = useCallback(async (projectId: string, projectName: string, clientId?: string) => {
        return pdfGenerationUtils.generateProjectReport(projectId, projectName, clientId);
    }, []);

    const downloadPdf = useCallback((buffer: string, filename: string) => {
        pdfGenerationUtils.downloadPdf(buffer, filename);
    }, []);

    return {
        generatePdf,
        generateClientProfile,
        generateInvoiceDownload,
        generateDailyLogDownload,
        generateProjectReport,
        downloadPdf,
        isGenerating,
        error,
        clearError: () => setError(null),
        utils: pdfGenerationUtils
    };
}
