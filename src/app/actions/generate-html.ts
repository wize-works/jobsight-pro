"use server";

import { getClientDetailsByID } from "./clients";
import { getDailyLogWithDetailsById } from "./daily-logs";
import { getBusinessById } from "./business";

// Helper function to convert relative URLs to absolute URLs for PDF generation
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

export async function generateClientHTML(businessId: string, clientId: string): Promise<string> {
    try {
        // Validate inputs
        if (!businessId || !clientId) {
            throw new Error('Business ID and Client ID are required');
        }

        // Fetch client data using existing server action
        const clientDetails = await getClientDetailsByID(businessId, clientId);

        if (!clientDetails) {
            throw new Error('Client not found');
        }

        const { client, projects, contacts, interactions } = clientDetails;        // Get business info separately - with fallback to client's business_id
        const actualBusinessId = businessId || client.business_id;
        if (!actualBusinessId) {
            throw new Error('Unable to determine business ID');
        }

        const business = await getBusinessById(actualBusinessId);

        if (!business) {
            console.warn('Business not found, using default values');
        }

        // Get invoices for this client (we'll need to add this to the client details action if not already included)
        const invoices = (client as any).invoices || [];

        // Prepare client data with business info
        const clientData = {
            ...client,
            contacts: contacts || [],
            interactions: interactions || [],
            projects: projects || [],
            invoices: invoices,
            business_info: {
                name: business?.name || '',
                street: business?.address || '',
                city: business?.city || '',
                state: business?.state || '',
                zip: business?.zip || '',
                country: business?.country || 'USA',
                phone: business?.phone || '',
                email: business?.email || '',
                website: business?.website || '',
                tax_id: business?.tax_id || '',
                logo_url: business?.logo_url || '',
            }
        };

        // Calculate statistics
        const totalProjects = projects?.length || 0;
        const activeProjects = projects?.filter((p: any) => p.status === 'active' || p.status === 'in_progress').length || 0;
        const totalInvoices = invoices?.length || 0;
        const totalInvoiceAmount = invoices?.reduce((sum: number, inv: any) => sum + (inv.amount || 0), 0) || 0;
        const paidInvoices = invoices?.filter((inv: any) => inv.status === 'paid').length || 0;

        // Generate HTML
        const html = `
<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Client Details - ${client.name}</title>
    <style> 
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            margin: 0;
            padding: 36px;
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
        .client-info {
            text-align: right;
        }
        .client-title {
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
        .details-section {
            margin-bottom: 40px;
        }
        .details-section h3 {
            font-size: 20px;
            font-weight: 600;
            margin-bottom: 16px;
            color: #1f2937;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 8px;
        }
        .details-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 20px;
        }
        .detail-item {
            margin-bottom: 12px;
        }
        .detail-label {
            font-weight: 600;
            color: #6b7280;
            font-size: 14px;
            margin-bottom: 4px;
        }
        .detail-value {
            color: #1f2937;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 20px;
            margin-bottom: 40px;
        }
        .stat-card {
            background: #f9fafb;
            padding: 20px;
            border-radius: 8px;
            border: 1px solid #e5e7eb;
            text-align: center;
        }
        .stat-value {
            font-size: 24px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 4px;
        }
        .stat-label {
            color: #6b7280;
            font-size: 14px;
        }
        .table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        .table th,
        .table td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #e5e7eb;
        }
        .table th {
            background: #f9fafb;
            font-weight: 600;
            color: #374151;
        }
        .table .text-right {
            text-align: right;
        }
        .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 9999px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
        }
        .status-active {
            background: #dcfce7;
            color: #166534;
        }
        .status-inactive, .status-archived {
            background: #f3f4f6;
            color: #374151;
        }
        .status-pending {
            background: #fef3c7;
            color: #92400e;
        }
        .contact-card {
            background: #f9fafb;
            padding: 16px;
            border-radius: 8px;
            border: 1px solid #e5e7eb;
            margin-bottom: 12px;
        }
        .contact-name {
            font-weight: 600;
            font-size: 16px;
            margin-bottom: 4px;
        }
        .contact-title {
            color: #6b7280;
            font-size: 14px;
            margin-bottom: 8px;
        }
        .contact-info {
            font-size: 14px;
        }
        .footer {
            text-align: center;
            color: #6b7280;
            font-size: 14px;
            margin-top: 40px;
            border-top: 1px solid #e5e7eb;
            padding-top: 20px;
        }
        .primary-badge {
            background: #dbeafe;
            color: #1d4ed8;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 600;
            margin-left: 8px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div>
                <img src="${getAbsoluteUrl(clientData.business_info.logo_url || '/logo-full.png')}" alt="Company Logo" class="logo" />
                <div style="margin-top: 20px;">
                    <div style="font-weight: bold; font-size: 16px;">${clientData.business_info.name}</div>
                    <div>${clientData.business_info.street}</div>
                    <div>${clientData.business_info.city}, ${clientData.business_info.state} ${clientData.business_info.zip}</div>
                    <div>${clientData.business_info.country}</div>
                    <div>Phone: ${clientData.business_info.phone}</div>
                    <div>Email: ${clientData.business_info.email}</div>
                    <div>Tax ID: ${clientData.business_info.tax_id}</div>
                </div>
            </div>
            <div class="client-info">
                <div class="client-title">CLIENT DETAILS</div>
                <table class="info-table">
                    <tr>
                        <td class="label">Client ID:</td>
                        <td>${client.id.slice(-8).toUpperCase()}</td>
                    </tr>
                    <tr>
                        <td class="label">Created:</td>
                        <td>${formatDate(client.created_at)}</td>
                    </tr>
                    <tr>
                        <td class="label">Updated:</td>
                        <td>${formatDate(client.updated_at)}</td>
                    </tr>
                    <tr>
                        <td class="label">Status:</td>
                        <td>
                            <span class="status-badge status-${client.status || 'active'}">
                                ${(client.status || 'active').charAt(0).toUpperCase() + (client.status || 'active').slice(1)}
                            </span>
                        </td>
                    </tr>
                </table>
            </div>
        </div>

        <!-- Client Information -->
        <div class="details-section">
            <h3>${client.name}</h3>
            <div class="details-grid">
                <div>
                    <div class="detail-item">
                        <div class="detail-label">Type</div>
                        <div class="detail-value">${client.type || 'Not specified'}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Industry</div>
                        <div class="detail-value">${client.industry || 'Not specified'}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Contact Name</div>
                        <div class="detail-value">${client.contact_name || 'Not provided'}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Email</div>
                        <div class="detail-value">${client.contact_email || 'Not provided'}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Phone</div>
                        <div class="detail-value">${client.contact_phone || 'Not provided'}</div>
                    </div>
                </div>
                <div>
                    <div class="detail-item">
                        <div class="detail-label">Address</div>
                        <div class="detail-value">
                            ${client.address || 'Not provided'}<br>
                            ${client.city ? `${client.city}, ` : ''}${client.state || ''} ${client.zip || ''}<br>
                            ${client.country || ''}
                        </div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Website</div>
                        <div class="detail-value">${client.website || 'Not provided'}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Tax ID</div>
                        <div class="detail-value">${client.tax_id || 'Not provided'}</div>
                    </div>
                </div>
            </div>
            ${client.notes ? `
                <div class="detail-item">
                    <div class="detail-label">Notes</div>
                    <div class="detail-value">${client.notes}</div>
                </div>
            ` : ''}
        </div>

        <!-- Statistics -->
        <div class="details-section">
            <h3>Client Statistics</h3>
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-value">${totalProjects}</div>
                    <div class="stat-label">Total Projects</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${activeProjects}</div>
                    <div class="stat-label">Active Projects</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${totalInvoices}</div>
                    <div class="stat-label">Total Invoices</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${formatCurrency(totalInvoiceAmount)}</div>
                    <div class="stat-label">Total Billed</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${paidInvoices}</div>
                    <div class="stat-label">Paid Invoices</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${contacts?.length || 0}</div>
                    <div class="stat-label">Contacts</div>
                </div>
            </div>
        </div>

        <!-- Contacts -->
        ${contacts && contacts.length > 0 ? `
        <div class="details-section">
            <h3>Client Contacts</h3>
            ${contacts.map((contact: any) => `
                <div class="contact-card">
                    <div class="contact-name">
                        ${contact.name}
                        ${contact.is_primary ? '<span class="primary-badge">PRIMARY</span>' : ''}
                    </div>
                    ${contact.title ? `<div class="contact-title">${contact.title}</div>` : ''}
                    <div class="contact-info">
                        ${contact.email ? `<div>📧 ${contact.email}</div>` : ''}
                        ${contact.phone ? `<div>📞 ${contact.phone}</div>` : ''}
                        ${contact.mobile ? `<div>📱 ${contact.mobile}</div>` : ''}
                    </div>
                </div>
            `).join('')}
        </div>
        ` : ''}

        <!-- Recent Projects -->
        ${projects && projects.length > 0 ? `
        <div class="details-section">
            <h3>Projects (${projects.length})</h3>
            <table class="table">
                <thead>
                    <tr>
                        <th>Project Name</th>
                        <th>Status</th>
                        <th class="text-right">Budget</th>
                        <th>Start Date</th>
                        <th>End Date</th>
                    </tr>
                </thead>
                <tbody>
                    ${projects.slice(0, 10).map((project: any) => `
                    <tr>
                        <td>${project.name}</td>
                        <td>
                            <span class="status-badge status-${project.status || 'active'}">
                                ${(project.status || 'active').charAt(0).toUpperCase() + (project.status || 'active').slice(1)}
                            </span>
                        </td>
                        <td class="text-right">${project.budget ? formatCurrency(project.budget) : '-'}</td>
                        <td>${formatDate(project.start_date)}</td>
                        <td>${formatDate(project.end_date)}</td>
                    </tr>
                    `).join('')}
                </tbody>
            </table>
            ${projects.length > 10 ? `<p style="color: #6b7280; font-size: 14px;">Showing first 10 of ${projects.length} projects</p>` : ''}
        </div>
        ` : ''}

        <!-- Recent Interactions -->
        ${interactions && interactions.length > 0 ? `
        <div class="details-section">
            <h3>Recent Interactions (${interactions.length})</h3>
            <table class="table">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Type</th>
                        <th>Summary</th>
                        <th>Follow-up</th>
                    </tr>
                </thead>
                <tbody>
                    ${interactions.map((interaction: any) => `
                    <tr>
                        <td>${formatDate(interaction.date)}</td>
                        <td>${interaction.type || 'General'}</td>
                        <td>${interaction.summary || '-'}</td>
                        <td>${interaction.follow_up_date ? formatDate(interaction.follow_up_date) : '-'}</td>
                    </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        ` : ''}

        <div class="footer">
            <p>Client Details Report Generated on ${formatDate(new Date().toISOString())}</p>
            <p>For questions or updates, contact us at ${clientData.business_info.email} or ${clientData.business_info.phone}</p>
            <p>Powered by JobSight Pro - Construction Management Software</p>
        </div>
    </div>
</body>
</html>`;

        return html;
    } catch (error) {
        console.error('Error generating client HTML:', error);
        throw new Error('Failed to generate client HTML');
    }
}

export async function generateDailyLogHTML(businessId: string, logId: string): Promise<string> {
    try {
        // Validate inputs
        if (!businessId || !logId) {
            throw new Error('Business ID and Log ID are required');
        }

        // Fetch daily log data using existing server action
        const log = await getDailyLogWithDetailsById(businessId, logId);

        if (!log) {
            throw new Error('Daily log not found');
        }        // Get business info separately - with fallback handling
        const actualBusinessId = businessId || log.business_id;
        if (!actualBusinessId) {
            throw new Error('Unable to determine business ID');
        }

        const business = await getBusinessById(actualBusinessId);

        if (!business) {
            console.warn('Business not found, using default values');
        }

        // Create business info object
        const businessInfo = {
            name: business?.name || '',
            street: business?.address || '',
            city: business?.city || '',
            state: business?.state || '',
            zip: business?.zip || '',
            country: business?.country || 'USA',
            phone: business?.phone || '',
            email: business?.email || '',
            website: business?.website || '',
            tax_id: business?.tax_id || '',
            logo_url: business?.logo_url || '',
        };        // Generate HTML for daily log
        const html = `
<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Daily Log - ${log.project?.name || 'Unknown Project'} - ${formatDate(log.date)}</title>
    <style>
        * {
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            margin: 0;
            padding: 0;
            background: #ffffff;
            color: #1a1a1a;
            line-height: 1.6;
            font-size: 14px;
        }
        
        .page {
            width: 210mm;
            min-height: 297mm;
            margin: 0 auto;
            background: white;
            box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
            position: relative;
        }        .container {
            padding: 32px;
            height: 100%;
        }
          /* Header Section */
        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 32px;
            padding-bottom: 24px;
            border-bottom: 2px solid #ff6b35;
            position: relative;
        }
        
        .company-info {
            flex: 1;
        }
        
        .logo {
            height: 50px;
            margin-bottom: 15px;
            max-width: 200px;
        }
        
        .company-details {
            color: #666666;
            font-size: 12px;
            line-height: 1.4;
        }
        
        .company-name {
            font-weight: 700;
            font-size: 16px;
            color: #1a1a1a;
            margin-bottom: 8px;
        }
          .log-info-panel {
            background: #ff6b35;
            color: white;
            padding: 24px;
            border-radius: 8px;
            min-width: 300px;
            border: 1px solid #e5e5e5;
        }
          .log-title {
            font-size: 20px;
            font-weight: 700;
            margin-bottom: 16px;
            text-align: center;
            letter-spacing: 0.5px;
        }
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
            font-size: 13px;
        }
        
        .info-item {
            display: flex;
            flex-direction: column;
        }
          .info-label {
            font-weight: 500;
            opacity: 0.9;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
        }
        
        .info-value {
            font-weight: 700;
            font-size: 14px;
        }
        
        /* Weather styling */
        .weather-value {
            display: flex;
            align-items: center;
            gap: 5px;
        }
          /* Section Styling */
        .section {
            margin-bottom: 32px;
            background: #fafafa;
            border-radius: 8px;
            padding: 24px;
            border-left: 4px solid #ff6b35;
            border: 1px solid #e5e5e5;
        }
          .section-title {
            font-size: 16px;
            font-weight: 600;
            color: #1a1a1a;
            margin-bottom: 16px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
          .section-icon {
            width: 18px;
            height: 18px;
            background: #ff6b35;
            border-radius: 3px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 11px;
            font-weight: 600;
        }
          .project-grid {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 16px;
        }
          .project-item {
            background: white;
            padding: 16px;
            border-radius: 6px;
            border: 1px solid #e5e5e5;
        }
        
        .project-label {
            font-weight: 600;
            color: #666666;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 5px;
        }
        
        .project-value {
            color: #1a1a1a;
            font-weight: 600;
            font-size: 14px;
        }
          /* Work Description */
        .work-description {
            background: white;
            padding: 20px;
            border-radius: 6px;
            border: 1px solid #e5e5e5;
            font-size: 14px;
            line-height: 1.6;
            color: #333333;
        }
          /* Table Styling */
        .data-table {
            width: 100%;
            border-collapse: collapse;
            background: white;
            border-radius: 6px;
            overflow: hidden;
            border: 1px solid #e5e5e5;
        }
        
        .data-table th {
            background: #ff6b35;
            color: white;
            padding: 14px 12px;
            text-align: left;
            font-weight: 600;
            font-size: 13px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
          .data-table td {
            padding: 12px;
            border-bottom: 1px solid #f0f0f0;
            font-size: 13px;
            vertical-align: top;
        }
        
        .data-table tr:last-child td {
            border-bottom: none;
        }
        
        .data-table tr:nth-child(even) {
            background: #fafafa;
        }
        
        .text-right {
            text-align: right;
        }
        
        .currency {
            font-weight: 600;
            color: #ff6b35;
        }
        
        /* Notes Section */
        .notes-grid {
            display: grid;
            gap: 15px;
        }
          .note-item {
            background: white;
            padding: 16px;
            border-radius: 6px;
            border-left: 4px solid #ff6b35;
            border: 1px solid #e5e5e5;
        }
        
        .note-label {
            font-weight: 600;
            color: #ff6b35;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 8px;
        }
        
        .note-value {
            color: #333333;
            line-height: 1.5;
        }
          /* Footer */
        .footer {
            margin-top: 32px;
            padding-top: 20px;
            border-top: 1px solid #e5e5e5;
            text-align: center;
            color: #888888;
            font-size: 12px;
            line-height: 1.4;
        }
        
        .footer-title {
            font-weight: 600;
            color: #666666;
            margin-bottom: 5px;
        }
          /* Utilities */
        .badge {
            display: inline-block;
            background: #ff6b35;
            color: white;
            padding: 4px 8px;
            border-radius: 3px;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
          .empty-state {
            text-align: center;
            color: #999999;
            font-style: italic;
            padding: 16px;
            background: #f9f9f9;
            border-radius: 4px;
        }
        
        @media print {
            .page {
                box-shadow: none;
                margin: 0;
            }
            
            body {
                background: white;
            }
        }
    </style>
</head>
<body>
    <div class="page">
        <div class="container">
            <!-- Header Section -->
            <div class="header">
                <div class="company-info">
                    <img src="${getAbsoluteUrl(businessInfo.logo_url || '/logo-full.png')}" alt="Company Logo" class="logo" />
                    <div class="company-details">
                        <div class="company-name">${businessInfo.name}</div>
                        <div>${businessInfo.street}</div>
                        <div>${businessInfo.city}, ${businessInfo.state} ${businessInfo.zip}</div>
                        <div>${businessInfo.country}</div>
                        <div>📞 ${businessInfo.phone}</div>
                        <div>✉️ ${businessInfo.email}</div>
                    </div>
                </div>
                
                <div class="log-info-panel">
                    <div class="log-title">DAILY LOG</div>
                    <div class="info-grid">
                        <div class="info-item">
                            <div class="info-label">Date</div>
                            <div class="info-value">${formatDate(log.date)}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">Log ID</div>
                            <div class="info-value">#${log.id.slice(-8).toUpperCase()}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">Weather</div>
                            <div class="info-value weather-value">
                                🌤️ ${log.weather || 'Not recorded'}
                            </div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">Hours</div>
                            <div class="info-value">${log.hours_worked || 0}h</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Project Information Section -->
            <div class="section">
                <h3 class="section-title">
                    <span class="section-icon">🏗️</span>
                    Project Information
                </h3>
                <div class="project-grid">
                    <div class="project-item">
                        <div class="project-label">Project Name</div>
                        <div class="project-value">${log.project?.name || 'Unknown Project'}</div>
                    </div>
                    <div class="project-item">
                        <div class="project-label">Client</div>
                        <div class="project-value">${log.client?.name || 'Not specified'}</div>
                    </div>
                    <div class="project-item">
                        <div class="project-label">Crew</div>
                        <div class="project-value">${log.crew?.name || 'Not assigned'}</div>
                    </div>
                </div>
            </div>

            <!-- Work Completed Section -->
            <div class="section">
                <h3 class="section-title">
                    <span class="section-icon">✅</span>
                    Work Completed
                </h3>
                <div class="work-description">
                    ${log.work_completed || '<div class="empty-state">No work details recorded</div>'}
                </div>
            </div>

            <!-- Materials Section -->
            ${log.materials && log.materials.length > 0 ? `
            <div class="section">
                <h3 class="section-title">
                    <span class="section-icon">📦</span>
                    Materials Used
                    <span class="badge">${log.materials.length} items</span>
                </h3>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Material</th>
                            <th class="text-right">Quantity</th>
                            <th class="text-right">Cost per Unit</th>
                            <th class="text-right">Total Cost</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${log.materials.map((material: any) => `
                        <tr>
                            <td><strong>${material.name}</strong></td>
                            <td class="text-right">${material.quantity || 0}</td>
                            <td class="text-right">${formatCurrency(material.cost || 0)}</td>
                            <td class="text-right currency">${formatCurrency((material.cost || 0) * (material.quantity || 0))}</td>
                        </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            ` : ''}

            <!-- Equipment Section -->
            ${log.equipment && log.equipment.length > 0 ? `
            <div class="section">
                <h3 class="section-title">
                    <span class="section-icon">🚜</span>
                    Equipment Used
                    <span class="badge">${log.equipment.length} items</span>
                </h3>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Equipment</th>
                            <th class="text-right">Hours Used</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${log.equipment.map((equip: any) => `
                        <tr>
                            <td><strong>${equip.name}</strong></td>
                            <td class="text-right">${equip.hours || 0}h</td>
                        </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            ` : ''}

            <!-- Notes and Issues Section -->
            ${(log.safety && log.safety !== "None reported") || (log.delays && log.delays !== "No delays reported") || log.quality ? `
            <div class="section">
                <h3 class="section-title">
                    <span class="section-icon">📝</span>
                    Notes & Issues
                </h3>
                <div class="notes-grid">
                    ${log.safety && log.safety !== "None reported" ? `
                        <div class="note-item">
                            <div class="note-label">🛡️ Safety Notes</div>
                            <div class="note-value">${log.safety}</div>
                        </div>
                    ` : ''}
                    ${log.delays && log.delays !== "No delays reported" ? `
                        <div class="note-item">
                            <div class="note-label">⏰ Delays</div>
                            <div class="note-value">${log.delays}</div>
                        </div>
                    ` : ''}
                    ${log.quality ? `
                        <div class="note-item">
                            <div class="note-label">⭐ Quality Notes</div>
                            <div class="note-value">${log.quality}</div>
                        </div>
                    ` : ''}
                </div>
            </div>
            ` : ''}

            <!-- Footer -->
            <div class="footer">
                <div class="footer-title">Daily Log Report Generated on ${formatDate(new Date().toISOString())}</div>
                <p>For questions or updates, contact us at ${businessInfo.email} or ${businessInfo.phone}</p>
                <p><strong>Powered by JobSight Pro</strong> - Construction Management Software</p>
            </div>
        </div>
    </div>
</body>
</html>`;

        return html;
    } catch (error) {
        console.error('Error generating daily log HTML:', error);
        throw new Error('Failed to generate daily log HTML');
    }
}

/**
 * Generate invoice HTML by fetching from the invoice HTML API route
 */
export async function generateInvoiceHTML(businessId: string, invoiceId: string): Promise<string> {
    try {
        // Validate inputs
        if (!businessId || !invoiceId) {
            throw new Error('Business ID and Invoice ID are required');
        }

        // Fetch HTML from the invoice HTML API route
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';
        const url = `${baseUrl}/api/invoices/${invoiceId}/html?businessId=${businessId}`;

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Failed to fetch invoice HTML: ${response.status} ${response.statusText}`);
        }

        const html = await response.text();
        return html;

    } catch (error) {
        console.error('Error generating invoice HTML:', error);
        throw new Error('Failed to generate invoice HTML');
    }
}
