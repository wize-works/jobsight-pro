import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// Format currency helper
const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
    }).format(amount);
};

// Format date helper
const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
};

// Direct database access without authentication for PDF generation
async function getInvoiceForPDF(businessId: string, invoiceId: string) {
    const supabase = createServerClient();

    if (!supabase) {
        throw new Error('Unable to create Supabase client');
    }

    // Fetch invoice
    const { data: invoiceData, error: invoiceError } = await supabase
        .from('invoices')
        .select('*')
        .eq('business_id', businessId)
        .eq('id', invoiceId)
        .single();

    if (invoiceError || !invoiceData) {
        throw new Error('Invoice not found');
    }

    // Fetch invoice items
    const { data: itemsData } = await supabase
        .from('invoice_items')
        .select('*')
        .eq('invoice_id', invoiceId)
        .eq('business_id', businessId);

    // Fetch client
    const { data: clientData } = await supabase
        .from('clients')
        .select('*')
        .eq('id', invoiceData.client_id)
        .eq('business_id', businessId)
        .single();

    // Fetch project
    const { data: projectData } = await supabase
        .from('projects')
        .select('*')
        .eq('id', invoiceData.project_id)
        .eq('business_id', businessId)
        .single();

    // Fetch business info
    const { data: businessData } = await supabase
        .from('businesses')
        .select('*')
        .eq('id', businessId)
        .single();

    return {
        ...invoiceData,
        items: itemsData || [],
        client: clientData || null,
        project: projectData || null,
        billing_address: {
            name: clientData?.name || '',
            attention: clientData?.contact_name || '',
            street: clientData?.address || '',
            city: clientData?.city || '',
            state: clientData?.state || '',
            zip: clientData?.zip || '',
            country: clientData?.country || 'USA',
        },
        business_info: {
            name: businessData?.name || '',
            street: businessData?.address || '',
            city: businessData?.city || '',
            state: businessData?.state || '',
            zip: businessData?.zip || '',
            country: businessData?.country || 'USA',
            phone: businessData?.phone || '',
            email: businessData?.email || '',
            website: businessData?.website || '',
            tax_id: businessData?.tax_id || '',
            logo_url: businessData?.logo_url || '',
        }
    };
}

// This route generates HTML for PDF generation without requiring authentication
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { searchParams } = new URL(request.url);
        const businessId = searchParams.get('businessId');

        if (!businessId || !id) {
            return NextResponse.json({ error: 'Missing businessId or invoiceId' }, { status: 400 });
        }        // Fetch the invoice data
        const invoice = await getInvoiceForPDF(businessId, id);

        if (!invoice) {
            return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
        }

        // Calculate totals
        const subtotal = invoice.items.reduce((sum: number, item: any) => sum + (item.amount ?? 0), 0);
        const taxRate = 0.08;
        const tax = subtotal * taxRate;
        const total = subtotal + tax;

        // Generate the HTML content for the invoice
        const html = `
<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice ${invoice.invoice_number}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            margin: 0;
            padding: 40px;
            background: white;
            color: #333;
            line-height: 1.5;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 40px;
        }
        .logo {
            height: 60px;
        }
        .invoice-info {
            text-align: right;
        }
        .invoice-title {
            font-size: 32px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 20px;
        }
        .info-table {
            border-collapse: collapse;
        }
        .info-table td {
            padding: 4px 12px;
            border: none;
        }
        .info-table .label {
            font-weight: 600;
            text-align: right;
        }
        .addresses {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            margin-bottom: 40px;
        }
        .address-section h3 {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 12px;
            color: #1f2937;
        }
        .address-box {
            background: #f9fafb;
            padding: 20px;
            border-radius: 8px;
            border: 1px solid #e5e7eb;
        }
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 40px;
        }
        .items-table th,
        .items-table td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #e5e7eb;
        }
        .items-table th {
            background: #f9fafb;
            font-weight: 600;
            color: #374151;
        }
        .items-table .text-right {
            text-align: right;
        }
        .totals {
            margin-left: auto;
            width: 300px;
        }
        .totals-table {
            width: 100%;
            border-collapse: collapse;
        }
        .totals-table td {
            padding: 8px 12px;
            border: none;
        }
        .totals-table .label {
            font-weight: 600;
            text-align: right;
        }
        .totals-table .total-row {
            border-top: 2px solid #e5e7eb;
            font-weight: bold;
            font-size: 18px;
        }
        .notes-section {
            margin-bottom: 40px;
        }
        .notes-section h3 {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 12px;
            color: #1f2937;
        }
        .notes-box {
            background: #f9fafb;
            padding: 20px;
            border-radius: 8px;
            border: 1px solid #e5e7eb;
        }
        .footer {
            text-align: center;
            color: #6b7280;
            font-size: 14px;
            margin-top: 40px;
        }
        .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 9999px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
        }
        .status-paid {
            background: #dcfce7;
            color: #166534;
        }
        .status-pending {
            background: #fef3c7;
            color: #92400e;
        }
        .status-overdue {
            background: #fee2e2;
            color: #991b1b;
        }
        .status-draft {
            background: #f3f4f6;
            color: #374151;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div>
                <img src="${invoice.business_info.logo_url || '/logo-full.png'}" alt="Company Logo" class="logo" />
                <div style="margin-top: 20px;">
                    <div style="font-weight: bold; font-size: 16px;">${invoice.business_info.name}</div>
                    <div>${invoice.business_info.street}</div>
                    <div>${invoice.business_info.city}, ${invoice.business_info.state} ${invoice.business_info.zip}</div>
                    <div>${invoice.business_info.country}</div>
                    <div>Phone: ${invoice.business_info.phone}</div>
                    <div>Email: ${invoice.business_info.email}</div>
                    <div>Tax ID: ${invoice.business_info.tax_id}</div>
                </div>
            </div>
            <div class="invoice-info">
                <div class="invoice-title">INVOICE</div>
                <table class="info-table">
                    <tr>
                        <td class="label">Invoice #:</td>
                        <td>${invoice.invoice_number}</td>
                    </tr>
                    <tr>
                        <td class="label">Issue Date:</td>
                        <td>${formatDate(invoice.issue_date)}</td>
                    </tr>
                    <tr>
                        <td class="label">Due Date:</td>
                        <td>${formatDate(invoice.due_date)}</td>
                    </tr>
                    ${invoice.paid_date ? `
                    <tr>
                        <td class="label">Paid Date:</td>
                        <td>${formatDate(invoice.paid_date)}</td>
                    </tr>
                    ` : ''}
                    <tr>
                        <td class="label">Status:</td>                        <td>
                            <span class="status-badge status-${invoice.status || 'draft'}">
                                ${(invoice.status || 'draft').charAt(0).toUpperCase() + (invoice.status || 'draft').slice(1)}
                            </span>
                        </td>
                    </tr>
                </table>
            </div>
        </div>

        <div class="addresses">
            <div class="address-section">
                <h3>Bill To:</h3>
                <div class="address-box">
                    <div style="font-weight: bold;">${invoice.billing_address.name}</div>
                    <div>Attn: ${invoice.billing_address.attention}</div>
                    <div>${invoice.billing_address.street}</div>
                    <div>${invoice.billing_address.city}, ${invoice.billing_address.state} ${invoice.billing_address.zip}</div>
                    <div>${invoice.billing_address.country}</div>
                </div>
            </div>
            <div class="address-section">
                <h3>Project:</h3>
                <div class="address-box">
                    <div style="font-weight: bold;">${invoice.project?.name || 'N/A'}</div>
                    <div>Invoice for services rendered as part of the project.</div>
                </div>
            </div>
        </div>

        <div>
            <h3>Invoice Items:</h3>
            <table class="items-table">
                <thead>
                    <tr>
                        <th>Description</th>
                        <th class="text-right">Quantity</th>
                        <th class="text-right">Unit Price</th>
                        <th class="text-right">Amount</th>
                    </tr>
                </thead>
                <tbody>                    ${invoice.items.map((item: any) => `
                    <tr>
                        <td>${item.description}</td>
                        <td class="text-right">${item.quantity}</td>
                        <td class="text-right">${formatCurrency(item.unit_price ?? 0)}</td>
                        <td class="text-right">${formatCurrency(item.amount ?? 0)}</td>
                    </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        <div class="totals">
            <table class="totals-table">
                <tr>
                    <td class="label">Subtotal:</td>
                    <td class="text-right">${formatCurrency(subtotal)}</td>
                </tr>
                <tr>
                    <td class="label">Tax (${(taxRate * 100).toFixed(0)}%):</td>
                    <td class="text-right">${formatCurrency(tax)}</td>
                </tr>
                <tr class="total-row">
                    <td class="label">Total:</td>
                    <td class="text-right">${formatCurrency(total)}</td>
                </tr>
            </table>
        </div>

        ${invoice.notes ? `
        <div class="notes-section">
            <h3>Notes:</h3>
            <div class="notes-box">
                <p>${invoice.notes}</p>
            </div>
        </div>
        ` : ''}

        <div class="notes-section">
            <h3>Payment Instructions:</h3>
            <div class="notes-box">
                <p>Please make payment to:</p>
                <p>${invoice.payment_method || 'Contact us for payment details'}</p>
            </div>
        </div>

        <div class="footer">
            <p>Thank you for your business!</p>
            <p>If you have any questions about this invoice, please contact us at ${invoice.business_info.email} or ${invoice.business_info.phone}.</p>
        </div>
    </div>
</body>
</html>`;

        return new Response(html, {
            headers: {
                'Content-Type': 'text/html',
            },
        });

    } catch (error) {
        console.error('Error generating invoice HTML:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json(
            {
                error: 'Failed to generate invoice HTML',
                details: errorMessage
            },
            { status: 500 }
        );
    }
}
