/**
 * @fileoverview PDF Generation Client Actions
 * Replaces src/app/actions/pdf-generation-gotenberg.ts with offline-first implementation.
 * Handles PDF generation with offline queue support.
 */

interface ActionResult<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

interface PdfGenerationOptions {
    html?: string;
    url?: string;
    filename: string;
    description?: string;
    saveToStorage?: boolean;
    clientId?: string;
    projectId?: string;
    returnAsAttachment?: boolean;
}

interface PdfGenerationResult {
    success: boolean;
    buffer?: Uint8Array;
    media?: any;
    fileUrl?: string;
    filename?: string;
    size?: number;
    error?: string;
    queued?: boolean;
}

interface QueuedPdfGeneration {
    options: PdfGenerationOptions;
    businessId: string;
    userId?: string;
    timestamp: number;
    id: string;
}

/**
 * Generate a PDF document with offline queue support
 */
export async function generatePdfDocument(
    businessId: string,
    options: PdfGenerationOptions,
    userId?: string
): Promise<ActionResult<PdfGenerationResult>> {
    if (typeof window === 'undefined') {
        return { success: false, error: 'Client-side only function' };
    }

    try {
        // Check if online
        if (!navigator.onLine) {
            // Queue for later generation
            const queueId = await queuePdfGeneration(businessId, options, userId);

            return {
                success: true,
                data: {
                    success: true,
                    queued: true,
                    filename: options.filename
                },
                message: 'PDF generation queued for when back online'
            };
        }

        // Generate PDF using browser APIs (limited functionality)
        const pdfResult = await generatePdfInBrowser(options);

        return {
            success: true,
            data: pdfResult,
            message: 'PDF generated successfully'
        };

    } catch (error) {
        console.error('Error generating PDF:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to generate PDF'
        };
    }
}

/**
 * Generate invoice PDF
 */
export async function generateInvoicePdf(
    businessId: string,
    invoiceId: string,
    invoiceData: any,
    userId?: string
): Promise<ActionResult<PdfGenerationResult>> {
    const options: PdfGenerationOptions = {
        filename: `invoice-${invoiceData.invoice_number || invoiceId}.pdf`,
        description: `Invoice ${invoiceData.invoice_number || invoiceId}`,
        saveToStorage: true,
        html: generateInvoiceHtml(invoiceData)
    };

    return await generatePdfDocument(businessId, options, userId);
}

/**
 * Generate daily log PDF
 */
export async function generateDailyLogPdf(
    businessId: string,
    dailyLogId: string,
    dailyLogData: any,
    userId?: string
): Promise<ActionResult<PdfGenerationResult>> {
    const options: PdfGenerationOptions = {
        filename: `daily-log-${dailyLogData.date || dailyLogId}.pdf`,
        description: `Daily Log ${dailyLogData.date || dailyLogId}`,
        saveToStorage: true,
        projectId: dailyLogData.project_id,
        html: generateDailyLogHtml(dailyLogData)
    };

    return await generatePdfDocument(businessId, options, userId);
}

/**
 * Generate project report PDF
 */
export async function generateProjectReportPdf(
    businessId: string,
    projectId: string,
    projectData: any,
    userId?: string
): Promise<ActionResult<PdfGenerationResult>> {
    const options: PdfGenerationOptions = {
        filename: `project-report-${projectData.name || projectId}.pdf`,
        description: `Project Report for ${projectData.name || projectId}`,
        saveToStorage: true,
        projectId: projectId,
        html: generateProjectReportHtml(projectData)
    };

    return await generatePdfDocument(businessId, options, userId);
}

// Browser-based PDF generation (simplified)
async function generatePdfInBrowser(options: PdfGenerationOptions): Promise<PdfGenerationResult> {
    try {
        if (!options.html) {
            throw new Error('HTML content required for browser PDF generation');
        }

        // Create a temporary iframe for rendering
        const iframe = document.createElement('iframe');
        iframe.style.position = 'absolute';
        iframe.style.left = '-9999px';
        iframe.style.width = '210mm'; // A4 width
        iframe.style.height = '297mm'; // A4 height
        document.body.appendChild(iframe);

        // Load content
        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (!doc) {
            throw new Error('Could not access iframe document');
        }

        doc.open();
        doc.write(options.html);
        doc.close();

        // Wait for content to load
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Trigger print dialog (browser-native PDF generation)
        iframe.contentWindow?.print();

        // Clean up
        document.body.removeChild(iframe);

        return {
            success: true,
            filename: options.filename,
            size: 0 // Unknown size for browser-generated PDFs
        };

    } catch (error) {
        throw new Error(`Browser PDF generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

// HTML generation functions (simplified versions)
function generateInvoiceHtml(invoiceData: any): string {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Invoice ${invoiceData.invoice_number}</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .header { text-align: center; margin-bottom: 30px; }
                .invoice-details { margin-bottom: 20px; }
                .items-table { width: 100%; border-collapse: collapse; }
                .items-table th, .items-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                .total { text-align: right; font-weight: bold; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Invoice</h1>
                <h2>${invoiceData.invoice_number}</h2>
            </div>
            <div class="invoice-details">
                <p><strong>Date:</strong> ${invoiceData.issue_date}</p>
                <p><strong>Due Date:</strong> ${invoiceData.due_date}</p>
                <p><strong>Client:</strong> ${invoiceData.client_name}</p>
                <p><strong>Project:</strong> ${invoiceData.project_name}</p>
            </div>
            <table class="items-table">
                <thead>
                    <tr>
                        <th>Description</th>
                        <th>Quantity</th>
                        <th>Unit Price</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${(invoiceData.items || []).map((item: any) => `
                        <tr>
                            <td>${item.description}</td>
                            <td>${item.quantity}</td>
                            <td>$${item.unit_price}</td>
                            <td>$${item.total_price}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            <div class="total">
                <p><strong>Total: $${invoiceData.amount}</strong></p>
            </div>
        </body>
        </html>
    `;
}

function generateDailyLogHtml(dailyLogData: any): string {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Daily Log - ${dailyLogData.date}</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .header { text-align: center; margin-bottom: 30px; }
                .section { margin-bottom: 20px; }
                .work-section { border: 1px solid #ddd; padding: 15px; margin-bottom: 15px; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Daily Log</h1>
                <h2>${dailyLogData.date}</h2>
                <p><strong>Project:</strong> ${dailyLogData.project_name}</p>
            </div>
            <div class="section work-section">
                <h3>Work Planned</h3>
                <p>${dailyLogData.work_planned}</p>
            </div>
            <div class="section work-section">
                <h3>Work Completed</h3>
                <p>${dailyLogData.work_completed}</p>
            </div>
            <div class="section">
                <p><strong>Hours Worked:</strong> ${dailyLogData.hours_worked}</p>
                <p><strong>Overtime:</strong> ${dailyLogData.overtime}</p>
                <p><strong>Weather:</strong> ${dailyLogData.weather}</p>
            </div>
            ${dailyLogData.notes ? `
                <div class="section">
                    <h3>Notes</h3>
                    <p>${dailyLogData.notes}</p>
                </div>
            ` : ''}
        </body>
        </html>
    `;
}

function generateProjectReportHtml(projectData: any): string {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Project Report - ${projectData.name}</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .header { text-align: center; margin-bottom: 30px; }
                .section { margin-bottom: 20px; }
                .progress-bar { background: #f0f0f0; height: 20px; border-radius: 10px; overflow: hidden; }
                .progress-fill { background: #4CAF50; height: 100%; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Project Report</h1>
                <h2>${projectData.name}</h2>
            </div>
            <div class="section">
                <p><strong>Status:</strong> ${projectData.status}</p>
                <p><strong>Start Date:</strong> ${projectData.start_date}</p>
                <p><strong>End Date:</strong> ${projectData.end_date}</p>
                <p><strong>Budget:</strong> $${projectData.budget}</p>
                <p><strong>Progress:</strong> ${projectData.progress}%</p>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${projectData.progress}%"></div>
                </div>
            </div>
            ${projectData.description ? `
                <div class="section">
                    <h3>Description</h3>
                    <p>${projectData.description}</p>
                </div>
            ` : ''}
        </body>
        </html>
    `;
}

// Offline queue management
async function queuePdfGeneration(
    businessId: string,
    options: PdfGenerationOptions,
    userId?: string
): Promise<string> {
    const queueKey = `pdf_generation_queue_${businessId}`;
    const queue = JSON.parse(localStorage.getItem(queueKey) || '[]');

    const queueItem: QueuedPdfGeneration = {
        id: crypto.randomUUID(),
        options,
        businessId,
        userId,
        timestamp: Date.now()
    };

    queue.push(queueItem);
    localStorage.setItem(queueKey, JSON.stringify(queue));

    console.log('PDF generation queued for later processing');
    return queueItem.id;
}

export async function processQueuedPdfGenerations(businessId: string): Promise<void> {
    if (!navigator.onLine) return;

    const queueKey = `pdf_generation_queue_${businessId}`;
    const queue: QueuedPdfGeneration[] = JSON.parse(localStorage.getItem(queueKey) || '[]');

    if (queue.length === 0) return;

    console.log(`Processing ${queue.length} queued PDF generations`);

    const processedGenerations: number[] = [];

    for (let i = 0; i < queue.length; i++) {
        const item = queue[i];

        try {
            await generatePdfDocument(businessId, item.options, item.userId);
            processedGenerations.push(i);
        } catch (error) {
            console.error(`Failed to process queued PDF generation ${i}:`, error);
        }
    }

    // Remove processed generations
    const remainingQueue = queue.filter((_: any, index: number) => !processedGenerations.includes(index));
    localStorage.setItem(queueKey, JSON.stringify(remainingQueue));

    console.log(`Processed ${processedGenerations.length} PDF generations, ${remainingQueue.length} remaining`);
}

export async function getQueuedPdfGenerationsCount(businessId: string): Promise<number> {
    const queueKey = `pdf_generation_queue_${businessId}`;
    const queue = JSON.parse(localStorage.getItem(queueKey) || '[]');
    return queue.length;
}
