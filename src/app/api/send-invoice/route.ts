import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { InvoiceEmail } from '@/components/email-examples';
import { generateInvoicePdf } from '@/app/actions/pdf-generation-gotenberg';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            recipientEmail,
            recipientName,
            subject,
            message,
            invoiceData,
            businessInfo,
            attachPDF = true
        } = body;

        // Validate required fields
        if (!recipientEmail || !recipientName || !invoiceData) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Format currency
        const formatCurrency = (amount: number) => {
            return new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
                minimumFractionDigits: 2,
            }).format(amount);
        };

        // Format date
        const formatDate = (dateString: string | null) => {
            if (!dateString) return "-";
            return new Date(dateString).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
            });
        };

        // Calculate totals
        const subtotal = invoiceData.items.reduce((sum: number, item: any) => sum + (item.amount ?? 0), 0);
        const taxRate = 0.08;
        const tax = subtotal * taxRate;
        const total = subtotal + tax;        // Generate email subject if not provided
        const emailSubject = subject || `Invoice ${invoiceData.invoice_number} from ${businessInfo?.name || 'your contractor'} via JobSight Pro`;        // Prepare invoice URLs
        const invoiceUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://pro.jobsight.co'}/dashboard/invoices/${invoiceData.id}`;
        const paymentUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://pro.jobsight.co'}/pay/invoice/${invoiceData.id}`;

        // Generate PDF attachment if requested
        let pdfAttachment = null;
        if (attachPDF) {
            try {
                // Use our new server action to generate PDF
                const filename = `Invoice-${invoiceData.invoice_number}.pdf`;
                const pdfResult = await generateInvoicePdf(invoiceData.business_id, invoiceData.id, filename); if (pdfResult.success && pdfResult.buffer) {
                    // Convert buffer to base64 for email attachment
                    const base64Content = Buffer.from(pdfResult.buffer).toString('base64');
                    pdfAttachment = {
                        filename,
                        content: base64Content,
                    };
                } else {
                    console.warn('Failed to generate PDF attachment:', pdfResult.error);
                }
            } catch (pdfError) {
                console.warn('Error generating PDF attachment:', pdfError);
                // Continue without PDF attachment rather than failing the email
            }
        }// Send email
        const emailResponse = await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL || 'JobSight Pro <noreply@updates.jobsight.co>',
            replyTo: businessInfo?.email || invoiceData.business_info?.email || undefined,
            to: [recipientEmail],
            subject: emailSubject,
            react: InvoiceEmail({
                recipientName,
                invoiceNumber: invoiceData.invoice_number,
                amount: formatCurrency(total),
                dueDate: formatDate(invoiceData.due_date),
                projectName: invoiceData.project?.name || 'Project Services',
                invoiceUrl,
                paymentUrl,
                businessInfo: {
                    name: businessInfo?.name || invoiceData.business_info?.name,
                    address: businessInfo?.address || `${invoiceData.business_info?.street}, ${invoiceData.business_info?.city}, ${invoiceData.business_info?.state} ${invoiceData.business_info?.zip}`,
                    phone: businessInfo?.phone || invoiceData.business_info?.phone,
                    email: businessInfo?.email || invoiceData.business_info?.email
                }
            }),
            // Add custom message if provided
            ...(message && {
                text: message
            }),
            // Add PDF attachment if generated
            ...(pdfAttachment && {
                attachments: [{
                    filename: pdfAttachment.filename,
                    content: pdfAttachment.content,
                }]
            })
        });

        if (emailResponse.error) {
            console.error('Resend error:', emailResponse.error);
            return NextResponse.json(
                { error: 'Failed to send email', details: emailResponse.error },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            messageId: emailResponse.data?.id,
            message: 'Invoice email sent successfully'
        });

    } catch (error) {
        console.error('Error sending invoice email:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
