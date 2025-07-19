import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { createServerClient } from '@/lib/supabase';
import { generatePdfWithGotenbergServer, generateClientHTMLServer, generateInvoiceHTMLServer, generateDailyLogHTMLServer } from '@/lib/pdf/generation';

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

/**
 * Generate PDF documents using Gotenberg
 */
export async function POST(request: NextRequest) {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = await createServerClient();
        if (!supabase) {
            return NextResponse.json({ success: false, error: 'Database connection failed' }, { status: 500 });
        }

        // Get user's business
        const { data: profile } = await supabase
            .from('profiles')
            .select('business_id')
            .eq('user_id', user.id)
            .single();

        if (!profile?.business_id) {
            return NextResponse.json({ success: false, error: 'Business not found' }, { status: 404 });
        }

        const businessId = profile.business_id;
        const body: PdfGenerationRequest = await request.json();

        const {
            type,
            html,
            url,
            filename,
            description = "Generated PDF document",
            saveToStorage = true,
            clientId,
            projectId,
            invoiceId,
            logId,
            returnAsAttachment = false
        } = body;

        // Validate required fields
        if (!type || !filename) {
            return NextResponse.json({
                success: false,
                error: 'Type and filename are required'
            }, { status: 400 });
        }

        let finalHtml = html;
        let finalUrl = url;

        // Generate HTML based on type
        switch (type) {
            case 'client':
                if (!clientId) {
                    return NextResponse.json({
                        success: false,
                        error: 'Client ID is required for client PDF generation'
                    }, { status: 400 });
                }
                finalHtml = await generateClientHTMLServer(businessId, clientId) || undefined;
                break;

            case 'invoice':
                if (!invoiceId) {
                    return NextResponse.json({
                        success: false,
                        error: 'Invoice ID is required for invoice PDF generation'
                    }, { status: 400 });
                }
                finalHtml = await generateInvoiceHTMLServer(businessId, invoiceId) || undefined;
                break;

            case 'daily-log':
                if (!logId) {
                    return NextResponse.json({
                        success: false,
                        error: 'Log ID is required for daily log PDF generation'
                    }, { status: 400 });
                }
                finalHtml = await generateDailyLogHTMLServer(businessId, logId) || undefined;
                break;

            case 'project':
                if (!projectId) {
                    return NextResponse.json({
                        success: false,
                        error: 'Project ID is required for project PDF generation'
                    }, { status: 400 });
                }
                // For now, use URL fallback for project PDFs
                finalUrl = `${process.env.NEXTAUTH_URL}/dashboard/projects/${projectId}`;
                break;

            case 'custom':
                // Use provided html or url
                break;

            default:
                return NextResponse.json({
                    success: false,
                    error: 'Invalid PDF generation type'
                }, { status: 400 });
        }

        // Validate that we have either HTML or URL
        if (!finalHtml && !finalUrl) {
            return NextResponse.json({
                success: false,
                error: 'Either HTML or URL must be provided'
            }, { status: 400 });
        }

        // Generate PDF using Gotenberg (simplified for now)
        const pdfBuffer = await generatePdfWithGotenbergServer(finalHtml || '', {
            filename,
            businessId,
            clientId,
            projectId,
            description,
            saveToStorage,
            returnAsAttachment
        });

        if (!pdfBuffer) {
            return NextResponse.json({
                success: false,
                error: 'PDF generation failed'
            }, { status: 500 });
        }

        // Return PDF as base64 or attachment
        if (returnAsAttachment) {
            return new NextResponse(pdfBuffer, {
                headers: {
                    'Content-Type': 'application/pdf',
                    'Content-Disposition': `attachment; filename="${filename}"`,
                    'Content-Length': pdfBuffer.length.toString(),
                },
            });
        }

        const result = {
            success: true,
            buffer: pdfBuffer.toString('base64'),
            filename,
            size: pdfBuffer.length
        };

        // Return response
        const response: PdfGenerationResponse = {
            success: true,
            buffer: result.buffer,
            media: undefined, // Media creation logic would go here
            fileUrl: undefined, // File URL would be set if saved to storage
            filename: result.filename,
            size: result.size
        };

        return NextResponse.json({ success: true, data: response }, { status: 200 });

    } catch (error) {
        console.error('Error in PDF generation API:', error);
        return NextResponse.json({
            success: false,
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
