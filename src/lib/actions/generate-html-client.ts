/**
 * HTML Generation Client Actions - Offline-First Implementation
 * 
 * Provides offline-first HTML generation for PDF documents including:
 * - Dynamic invoice HTML generation
 * - Daily log report HTML generation  
 * - Client report HTML generation
 * - Business report HTML generation
 * 
 * All operations support offline template caching and generation.
 */

import type { Database } from "@/types/supabase";
import {
    createSelectAction
} from "@/lib/actions/client-action-factory";

// Extract types from Supabase
type Business = Database['public']['Tables']['businesses']['Row'];
type Client = Database['public']['Tables']['clients']['Row'];
type Invoice = Database['public']['Tables']['invoices']['Row'];
type DailyLog = Database['public']['Tables']['daily_logs']['Row'];

// Create client-side select actions for data retrieval
const selectBusinesses = createSelectAction('businesses');
const selectClients = createSelectAction('clients');
const selectInvoices = createSelectAction('invoices');
const selectDailyLogs = createSelectAction('daily_logs');

// HTML generation result interface
export interface HtmlGenerationResult {
    success: boolean;
    html?: string;
    error?: string;
    template?: string;
    data?: any;
}

/**
 * Helper function to convert relative URLs to absolute URLs for PDF generation
 */
const getAbsoluteUrl = (url: string): string => {
    if (!url) return '';

    // If already an absolute URL, return as is
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
    }

    // Convert relative URL to absolute
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://pro.jobsight.co';
    return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
};

/**
 * Helper function to convert image URL to base64 data URL for better PDF compatibility
 */
const getImageAsDataUrl = async (imageUrl: string): Promise<string> => {
    try {
        if (!imageUrl) return '';

        // Convert to absolute URL first
        const absoluteUrl = getAbsoluteUrl(imageUrl);

        // For offline scenarios, return the URL as-is
        // In online scenarios, this could fetch and convert to base64
        if (!navigator.onLine) {
            return absoluteUrl;
        }

        // Attempt to fetch and convert to base64
        try {
            const response = await fetch(absoluteUrl);
            if (!response.ok) return absoluteUrl;

            const blob = await response.blob();
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = () => resolve(absoluteUrl);
                reader.readAsDataURL(blob);
            });
        } catch {
            return absoluteUrl;
        }
    } catch (error) {
        console.error('Error converting image to data URL:', error);
        return imageUrl;
    }
};

/**
 * Generate HTML for invoice with offline support
 */
export async function generateInvoiceHtml(
    businessId: string,
    invoiceId: string
): Promise<HtmlGenerationResult> {
    try {
        // Get invoice data from local storage
        const invoiceResult = await selectInvoices({ id: invoiceId }, businessId);
        if (invoiceResult.error || !invoiceResult.data?.length) {
            return {
                success: false,
                error: 'Invoice not found'
            };
        }

        const invoice = invoiceResult.data[0] as Invoice;

        // Get business data
        const businessResult = await selectBusinesses({ id: businessId }, businessId);
        if (businessResult.error || !businessResult.data?.length) {
            return {
                success: false,
                error: 'Business not found'
            };
        }

        const business = businessResult.data[0] as Business;

        // Get client data if available
        let client: Client | null = null;
        if (invoice.client_id) {
            const clientResult = await selectClients({ id: invoice.client_id }, businessId);
            if (clientResult.data?.length) {
                client = clientResult.data[0] as Client;
            }
        }

        // Generate HTML template
        const html = await generateInvoiceTemplate(business, invoice, client);

        return {
            success: true,
            html,
            template: 'invoice',
            data: { business, invoice, client }
        };
    } catch (error) {
        console.error('Error generating invoice HTML:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

/**
 * Generate HTML for daily log with offline support
 */
export async function generateDailyLogHtml(
    businessId: string,
    logId: string
): Promise<HtmlGenerationResult> {
    try {
        // Get daily log data from local storage
        const logResult = await selectDailyLogs({ id: logId }, businessId);
        if (logResult.error || !logResult.data?.length) {
            return {
                success: false,
                error: 'Daily log not found'
            };
        }

        const dailyLog = logResult.data[0] as DailyLog;

        // Get business data
        const businessResult = await selectBusinesses({ id: businessId }, businessId);
        if (businessResult.error || !businessResult.data?.length) {
            return {
                success: false,
                error: 'Business not found'
            };
        }

        const business = businessResult.data[0] as Business;

        // Generate HTML template
        const html = await generateDailyLogTemplate(business, dailyLog);

        return {
            success: true,
            html,
            template: 'daily_log',
            data: { business, dailyLog }
        };
    } catch (error) {
        console.error('Error generating daily log HTML:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

/**
 * Generate HTML for client report with offline support
 */
export async function generateClientHtml(
    businessId: string,
    clientId: string
): Promise<HtmlGenerationResult> {
    try {
        // Get client data from local storage
        const clientResult = await selectClients({ id: clientId }, businessId);
        if (clientResult.error || !clientResult.data?.length) {
            return {
                success: false,
                error: 'Client not found'
            };
        }

        const client = clientResult.data[0] as Client;

        // Get business data
        const businessResult = await selectBusinesses({ id: businessId }, businessId);
        if (businessResult.error || !businessResult.data?.length) {
            return {
                success: false,
                error: 'Business not found'
            };
        }

        const business = businessResult.data[0] as Business;

        // Generate HTML template
        const html = await generateClientTemplate(business, client);

        return {
            success: true,
            html,
            template: 'client',
            data: { business, client }
        };
    } catch (error) {
        console.error('Error generating client HTML:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

/**
 * Generate invoice HTML template
 */
async function generateInvoiceTemplate(
    business: Business,
    invoice: Invoice,
    client: Client | null
): Promise<string> {
    const logoUrl = business.logo_url ? await getImageAsDataUrl(business.logo_url) : '';

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice #${invoice.invoice_number}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; color: #333; }
        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
        .logo { max-height: 80px; max-width: 200px; }
        .invoice-title { font-size: 28px; font-weight: bold; color: #2563eb; }
        .invoice-info { text-align: right; }
        .business-info, .client-info { margin-bottom: 20px; }
        .section-title { font-weight: bold; margin-bottom: 10px; }
        .invoice-details { margin: 20px 0; }
        .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .table th, .table td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        .table th { background-color: #f8f9fa; font-weight: bold; }
        .total-section { text-align: right; margin-top: 20px; }
        .total-row { display: flex; justify-content: space-between; margin: 5px 0; }
        .total-final { font-weight: bold; font-size: 18px; border-top: 2px solid #333; padding-top: 10px; }
        .notes { margin-top: 30px; padding: 15px; background-color: #f8f9fa; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="header">
        <div>
            ${logoUrl ? `<img src="${logoUrl}" alt="${business.name}" class="logo">` : ''}
            <h1>${business.name}</h1>
        </div>
        <div class="invoice-info">
            <div class="invoice-title">INVOICE</div>
            <div><strong>#${invoice.invoice_number}</strong></div>
            <div>Date: ${invoice.issue_date ? new Date(invoice.issue_date).toLocaleDateString() : 'N/A'}</div>
            ${invoice.due_date ? `<div>Due: ${new Date(invoice.due_date).toLocaleDateString()}</div>` : ''}
        </div>
    </div>

    <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
        <div class="business-info">
            <div class="section-title">From:</div>
            <div>${business.name}</div>
            ${business.address ? `<div>${business.address}</div>` : ''}
            ${business.city || business.state || business.zip ? `<div>${[business.city, business.state, business.zip].filter(Boolean).join(', ')}</div>` : ''}
            ${business.phone ? `<div>Phone: ${business.phone}</div>` : ''}
            ${business.email ? `<div>Email: ${business.email}</div>` : ''}
        </div>

        <div class="client-info">
            <div class="section-title">To:</div>
            ${client ? `
                <div>${client.name}</div>
                ${client.address ? `<div>${client.address}</div>` : ''}
                ${client.city || client.state || client.zip ? `<div>${[client.city, client.state, client.zip].filter(Boolean).join(', ')}</div>` : ''}
                ${client.contact_phone ? `<div>Phone: ${client.contact_phone}</div>` : ''}
                ${client.contact_email ? `<div>Email: ${client.contact_email}</div>` : ''}
            ` : '<div>Client information not available</div>'}
        </div>
    </div>

    <div class="invoice-details">
        ${invoice.notes ? `<div><strong>Description:</strong> ${invoice.notes}</div>` : ''}
        <div><strong>Status:</strong> ${invoice.status}</div>
    </div>

    <table class="table">
        <thead>
            <tr>
                <th>Description</th>
                <th>Quantity</th>
                <th>Rate</th>
                <th>Amount</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>${invoice.notes || 'Service'}</td>
                <td>1</td>
                <td>$${((invoice.amount || 0) / 100).toFixed(2)}</td>
                <td>$${((invoice.amount || 0) / 100).toFixed(2)}</td>
            </tr>
        </tbody>
    </table>

    <div class="total-section">
        <div class="total-row">
            <span>Subtotal:</span>
            <span>$${((invoice.amount || 0) / 100).toFixed(2)}</span>
        </div>
        <div class="total-row total-final">
            <span>Total:</span>
            <span>$${((invoice.amount || 0) / 100).toFixed(2)}</span>
        </div>
    </div>

    ${invoice.notes ? `
        <div class="notes">
            <div class="section-title">Notes:</div>
            <div>${invoice.notes}</div>
        </div>
    ` : ''}
</body>
</html>`;
}

/**
 * Generate daily log HTML template
 */
async function generateDailyLogTemplate(
    business: Business,
    dailyLog: DailyLog
): Promise<string> {
    const logoUrl = business.logo_url ? await getImageAsDataUrl(business.logo_url) : '';

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Daily Log - ${new Date(dailyLog.date).toLocaleDateString()}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; color: #333; }
        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
        .logo { max-height: 80px; max-width: 200px; }
        .section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        .section-title { font-size: 18px; font-weight: bold; margin-bottom: 10px; }
        .field { margin: 10px 0; }
        .field-label { font-weight: bold; }
    </style>
</head>
<body>
    <div class="header">
        <div>
            ${logoUrl ? `<img src="${logoUrl}" alt="${business.name}" class="logo">` : ''}
            <h1>${business.name}</h1>
        </div>
        <div>
            <h2>Daily Log</h2>
            <div>Date: ${new Date(dailyLog.date).toLocaleDateString()}</div>
        </div>
    </div>

    <div class="section">
        <div class="section-title">General Information</div>
        <div class="field">
            <span class="field-label">Date:</span> ${new Date(dailyLog.date).toLocaleDateString()}
        </div>
        ${dailyLog.weather ? `
            <div class="field">
                <span class="field-label">Weather:</span> ${dailyLog.weather}
            </div>
        ` : ''}
        <div class="field">
            <span class="field-label">Hours Worked:</span> ${dailyLog.hours_worked}
        </div>
    </div>

    ${dailyLog.work_completed ? `
        <div class="section">
            <div class="section-title">Work Completed</div>
            <div>${dailyLog.work_completed}</div>
        </div>
    ` : ''}

    ${dailyLog.work_planned ? `
        <div class="section">
            <div class="section-title">Work Planned</div>
            <div>${dailyLog.work_planned}</div>
        </div>
    ` : ''}

    ${dailyLog.notes ? `
        <div class="section">
            <div class="section-title">Notes</div>
            <div>${dailyLog.notes}</div>
        </div>
    ` : ''}
</body>
</html>`;
}

/**
 * Generate client HTML template
 */
async function generateClientTemplate(
    business: Business,
    client: Client
): Promise<string> {
    const logoUrl = business.logo_url ? await getImageAsDataUrl(business.logo_url) : '';

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Client Report - ${client.name}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; color: #333; }
        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
        .logo { max-height: 80px; max-width: 200px; }
        .section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        .section-title { font-size: 18px; font-weight: bold; margin-bottom: 10px; }
        .field { margin: 10px 0; }
        .field-label { font-weight: bold; }
    </style>
</head>
<body>
    <div class="header">
        <div>
            ${logoUrl ? `<img src="${logoUrl}" alt="${business.name}" class="logo">` : ''}
            <h1>${business.name}</h1>
        </div>
        <div>
            <h2>Client Report</h2>
            <div>${client.name}</div>
        </div>
    </div>

    <div class="section">
        <div class="section-title">Client Information</div>
        <div class="field">
            <span class="field-label">Name:</span> ${client.name}
        </div>
        ${client.type ? `
            <div class="field">
                <span class="field-label">Type:</span> ${client.type}
            </div>
        ` : ''}
        ${client.industry ? `
            <div class="field">
                <span class="field-label">Industry:</span> ${client.industry}
            </div>
        ` : ''}
        ${client.contact_email ? `
            <div class="field">
                <span class="field-label">Email:</span> ${client.contact_email}
            </div>
        ` : ''}
        ${client.contact_phone ? `
            <div class="field">
                <span class="field-label">Phone:</span> ${client.contact_phone}
            </div>
        ` : ''}
    </div>

    ${client.address || client.city || client.state || client.zip ? `
        <div class="section">
            <div class="section-title">Address</div>
            ${client.address ? `<div>${client.address}</div>` : ''}
            ${client.city || client.state || client.zip ? `<div>${[client.city, client.state, client.zip].filter(Boolean).join(', ')}</div>` : ''}
        </div>
    ` : ''}

    ${client.notes ? `
        <div class="section">
            <div class="section-title">Notes</div>
            <div>${client.notes}</div>
        </div>
    ` : ''}
</body>
</html>`;
}

// Export individual template generators for reuse
export {
    generateInvoiceTemplate,
    generateDailyLogTemplate,
    generateClientTemplate,
    getAbsoluteUrl,
    getImageAsDataUrl
};
