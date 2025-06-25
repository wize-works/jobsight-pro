"use server";

import { getClientDetailsByID } from "./clients";
import { getDailyLogWithDetailsById } from "./daily-logs";
import { getBusinessById } from "./business";
import { getInvoiceWitDetailsById } from "./invoices";

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

// Helper function to convert image URL to base64 data URL for better PDF compatibility
const getImageAsDataUrl = async (imageUrl: string): Promise<string> => {
    try {
        if (!imageUrl) return '';

        // Convert to absolute URL first
        const absoluteUrl = getAbsoluteUrl(imageUrl);
        console.log('Fetching image from:', absoluteUrl);

        const response = await fetch(absoluteUrl);
        if (!response.ok) {
            console.warn('Failed to fetch image:', response.status, response.statusText);
            return absoluteUrl; // Fallback to original URL
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const mimeType = response.headers.get('content-type') || 'image/png';
        const base64 = buffer.toString('base64');

        return `data:${mimeType};base64,${base64}`;
    } catch (error) {
        console.error('Error converting image to data URL:', error);
        return getAbsoluteUrl(imageUrl); // Fallback to original URL
    }
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
        };        // Calculate statistics
        const totalProjects = projects?.length || 0;
        const activeProjects = projects?.filter((p: any) => p.status === 'active' || p.status === 'in_progress').length || 0;
        const totalInvoices = invoices?.length || 0;
        const totalInvoiceAmount = invoices?.reduce((sum: number, inv: any) => sum + (inv.amount || 0), 0) || 0;
        const paidInvoices = invoices?.filter((inv: any) => inv.status === 'paid').length || 0;

        // Convert logo to base64 data URL for PDF compatibility
        const logoUrl = await getImageAsDataUrl(clientData.business_info.logo_url || '/logo-full.png');
        console.log('Client PDF Logo URL (converted):', logoUrl.substring(0, 100) + '...');
        console.log('Business logo_url from DB:', clientData.business_info.logo_url);        // Generate HTML
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
            padding: 32px;
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
            margin-bottom: 32px;
            padding-bottom: 24px;
            border-bottom: 2px solid #ff6b35;
        }
        .logo {
            height: 50px;
            max-width: 200px;
        }
        .client-info {
            text-align: right;
        }
        .client-title {
            font-size: 28px;
            font-weight: 700;
            color: #ff6b35;
            margin-bottom: 16px;
        }
        .info-table {
            border-collapse: collapse;
        }
        .info-table td {
            padding: 4px 12px;
            border: none;
            font-size: 13px;
        }
        .info-table .label {
            font-weight: 600;
            text-align: right;
            color: #666666;
        }
        .company-info {
            font-size: 12px;
            line-height: 1.4;
            color: #666666;
        }
        .company-name {
            font-weight: 700;
            font-size: 14px;
            color: #1a1a1a;
            margin-bottom: 8px;
        }
        .details-section {
            margin-bottom: 32px;
        }
        .details-section h3 {
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 12px;
            color: #1a1a1a;
        }
        .details-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 32px;
            margin-bottom: 20px;
        }
        .detail-item {
            margin-bottom: 12px;
        }
        .detail-label {
            font-weight: 600;
            color: #666666;
            font-size: 13px;
            margin-bottom: 4px;
        }
        .detail-value {
            color: #1a1a1a;
            font-size: 13px;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
            gap: 16px;
            margin-bottom: 32px;
        }
        .stat-card {
            background: #fafafa;
            padding: 16px;
            border-radius: 6px;
            border: 1px solid #e5e5e5;
            text-align: center;
        }
        .stat-value {
            font-size: 20px;
            font-weight: 700;
            color: #ff6b35;
            margin-bottom: 4px;
        }
        .stat-label {
            color: #666666;
            font-size: 12px;
            font-weight: 600;
        }
        .table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            border: 1px solid #e5e5e5;
            border-radius: 6px;
            overflow: hidden;
        }
        .table th,
        .table td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #f0f0f0;
            font-size: 13px;
        }
        .table th {
            background: #ff6b35;
            color: white;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .table .text-right {
            text-align: right;
        }
        .table tr:last-child td {
            border-bottom: none;
        }
        .table tbody tr:nth-child(even) {
            background: #fafafa;
        }
        .status-badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 3px;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .status-active {
            background: #dcfce7;
            color: #166534;
        }
        .status-inactive, .status-archived {
            background: #f3f4f6;
            color: #374151;
        }
        .status-pending, .status-in_progress {
            background: #fef3c7;
            color: #92400e;
        }
        .contact-card {
            background: #fafafa;
            padding: 16px;
            border-radius: 6px;
            border: 1px solid #e5e5e5;
            margin-bottom: 12px;
        }
        .contact-name {
            font-weight: 600;
            font-size: 14px;
            margin-bottom: 4px;
            color: #1a1a1a;
        }
        .contact-title {
            color: #666666;
            font-size: 12px;
            margin-bottom: 8px;
        }
        .contact-info {
            font-size: 12px;
            color: #666666;
        }
        .footer {
            text-align: center;
            color: #888888;
            font-size: 12px;
            margin-top: 32px;
            padding-top: 20px;
            border-top: 1px solid #e5e5e5;
        }
        .primary-badge {
            background: #dbeafe;
            color: #1d4ed8;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 10px;
            font-weight: 600;
            margin-left: 8px;
        }
        .amount-highlight {
            color: #ff6b35;
            font-weight: 600;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div>
                <img src="${logoUrl}" alt="Company Logo" class="logo" />
                <div class="company-info" style="margin-top: 16px;">
                    <div class="company-name">${clientData.business_info.name}</div>
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
        </div>        <!-- Statistics -->
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
                    <div class="stat-value amount-highlight">${formatCurrency(totalInvoiceAmount)}</div>
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
        }        // Create business info object
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
        };        // Convert logo to base64 data URL for PDF compatibility
        const logoUrl = await getImageAsDataUrl(businessInfo.logo_url || '/logo-full.png');
        console.log('Daily Log PDF Logo URL (converted):', logoUrl.substring(0, 100) + '...');
        console.log('Business logo_url from DB:', businessInfo.logo_url);

        // Parse weather data if it's JSON
        let weatherDisplay = 'Not recorded';
        if (log.weather) {
            try {
                if (typeof log.weather === 'string' && log.weather.startsWith('{')) {
                    const weatherData = JSON.parse(log.weather);
                    if (weatherData.temperature) {
                        weatherDisplay = `${weatherData.temperature}°F`;
                        if (weatherData.feelsLike && weatherData.feelsLike !== weatherData.temperature) {
                            weatherDisplay += ` (feels like ${weatherData.feelsLike}°F)`;
                        }
                        if (weatherData.humidity) {
                            weatherDisplay += `, ${weatherData.humidity}% humidity`;
                        }
                    }
                } else {
                    weatherDisplay = log.weather;
                }
            } catch (e) {
                weatherDisplay = log.weather || 'Not recorded';
            }
        }// Generate HTML for daily log
        const html = `
<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Daily Log - ${log.project?.name || 'Unknown Project'} - ${formatDate(log.date)}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            margin: 0;
            padding: 32px;
            background: white;
            color: #333;
            line-height: 1.5;
        }
        
        .container {
            max-width: 800px;
            margin: 0 auto;
        }
        
        /* Header Section */
        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 32px;
            padding-bottom: 24px;
            border-bottom: 2px solid #ff6b35;
        }
        
        .logo {
            height: 50px;
            max-width: 200px;
        }
        
        .company-info {
            font-size: 12px;
            line-height: 1.4;
            color: #666666;
        }
        
        .company-name {
            font-weight: 700;
            font-size: 14px;
            color: #1a1a1a;
            margin-bottom: 8px;
        }
        
        .log-info-panel {
            text-align: right;
        }
        
        .log-title {
            font-size: 28px;
            font-weight: 700;
            color: #ff6b35;
            margin-bottom: 16px;
        }
        
        .info-table {
            border-collapse: collapse;
        }
        
        .info-table td {
            padding: 4px 12px;
            border: none;
            font-size: 13px;
        }
        
        .info-table .label {
            font-weight: 600;
            text-align: right;
            color: #666666;
        }
        
        /* Section Styling */
        .section {
            margin-bottom: 32px;
        }
        
        .section-title {
            font-size: 16px;
            font-weight: 600;
            color: #1a1a1a;
            margin-bottom: 12px;
        }
        
        .details-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 16px;
            margin-bottom: 20px;
        }
        
        .detail-item {
            background: #fafafa;
            padding: 16px;
            border-radius: 6px;
            border: 1px solid #e5e5e5;
        }
        
        .detail-label {
            font-weight: 600;
            color: #666666;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
        }
        
        .detail-value {
            color: #1a1a1a;
            font-weight: 600;
            font-size: 14px;
        }
        
        /* Table Styling */
        .table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            border: 1px solid #e5e5e5;
            border-radius: 6px;
            overflow: hidden;
        }
        
        .table th,
        .table td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #f0f0f0;
            font-size: 13px;
        }
        
        .table th {
            background: #ff6b35;
            color: white;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .table .text-right {
            text-align: right;
        }
        
        .table tr:last-child td {
            border-bottom: none;
        }
        
        .table tbody tr:nth-child(even) {
            background: #fafafa;
        }
        
        /* Work Description */
        .work-description {
            background: #fafafa;
            padding: 16px;
            border-radius: 6px;
            border: 1px solid #e5e5e5;
            font-size: 13px;
            line-height: 1.5;
        }
        
        /* Notes Section */
        .notes-section {
            margin-bottom: 32px;
        }
        
        .notes-section h3 {
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 12px;
            color: #1a1a1a;
        }
        
        .notes-box {
            background: #fafafa;
            padding: 16px;
            border-radius: 6px;
            border: 1px solid #e5e5e5;
            font-size: 13px;
            line-height: 1.5;
        }
        
        /* Footer */
        .footer {
            text-align: center;
            color: #888888;
            font-size: 12px;
            margin-top: 32px;
            padding-top: 20px;
            border-top: 1px solid #e5e5e5;
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
        
        .amount-highlight {
            color: #ff6b35;
            font-weight: 600;
        }
        
        .empty-state {
            text-align: center;
            color: #999999;
            font-style: italic;
            padding: 16px;
            background: #fafafa;
            border-radius: 6px;
            border: 1px solid #e5e5e5;
        }
        
        @media print {
            body {
                background: white;
            }
        }    </style>
</head>
<body>
    <div class="container">
        <!-- Header Section -->
        <div class="header">
            <div>
                <img src="${logoUrl}" alt="Company Logo" class="logo" />
                <div class="company-info" style="margin-top: 16px;">
                    <div class="company-name">${businessInfo.name}</div>
                    <div>${businessInfo.street}</div>
                    <div>${businessInfo.city}, ${businessInfo.state} ${businessInfo.zip}</div>
                    <div>${businessInfo.country}</div>
                    <div>Phone: ${businessInfo.phone}</div>
                    <div>Email: ${businessInfo.email}</div>
                    <div>Tax ID: ${businessInfo.tax_id}</div>
                </div>
            </div>            <div class="log-info-panel">
                <div class="log-title">DAILY LOG</div>
                <table class="info-table">
                    <tr>
                        <td class="label">Date:</td>
                        <td>${formatDate(log.date)}</td>
                    </tr>
                    <tr>
                        <td class="label">Log ID:</td>
                        <td>#${log.id.slice(-8).toUpperCase()}</td>
                    </tr>
                    <tr>
                        <td class="label">Weather:</td>
                        <td>🌤️ ${weatherDisplay}</td>
                    </tr>
                    <tr>
                        <td class="label">Hours:</td>
                        <td><span class="amount-highlight">${log.hours_worked || 0}h</span></td>
                    </tr>
                </table>
            </div>
        </div>

        <!-- Project Information Section -->
        <div class="section">
            <h3 class="section-title">Project Information</h3>
            <div class="details-grid">
                <div class="detail-item">
                    <div class="detail-label">Project Name</div>
                    <div class="detail-value">${log.project?.name || 'Unknown Project'}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Client</div>
                    <div class="detail-value">${log.client?.name || 'Not specified'}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Crew</div>
                    <div class="detail-value">${log.crew?.name || 'Not assigned'}</div>
                </div>
            </div>
        </div>        
        <!-- Work Completed Section -->
        <div class="section">
            <h3 class="section-title">Work Completed</h3>
            <div class="work-description">
                ${log.work_completed || '<div class="empty-state">No work details recorded</div>'}
            </div>
        </div>        <!-- Materials Section -->
        ${log.materials && log.materials.length > 0 ? `
        <div class="section">
            <h3 class="section-title">Materials Used (${log.materials.length} items)</h3>
            <table class="table">
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
                        <td class="text-right amount-highlight">${formatCurrency((material.cost || 0) * (material.quantity || 0))}</td>
                    </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        ` : ''}        <!-- Equipment Section -->
        ${log.equipment && log.equipment.length > 0 ? `
        <div class="section">
            <h3 class="section-title">Equipment Used (${log.equipment.length} items)</h3>
            <table class="table">
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
                        <td class="text-right amount-highlight">${equip.hours || 0}h</td>
                    </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        ` : ''}        <!-- Notes and Issues Section -->
        ${(log.safety && log.safety !== "None reported") || (log.delays && log.delays !== "No delays reported") || log.quality ? `
        <div class="notes-section">
            <h3>Notes & Issues</h3>
            ${log.safety && log.safety !== "None reported" ? `
                <div class="notes-box">
                    <strong>🛡️ Safety Notes:</strong><br>
                    ${log.safety}
                </div>
            ` : ''}
            ${log.delays && log.delays !== "No delays reported" ? `
                <div class="notes-box">
                    <strong>⏰ Delays:</strong><br>
                    ${log.delays}
                </div>            ` : ''}
            ${log.quality ? `
                <div class="notes-box">
                    <strong>⭐ Quality Notes:</strong><br>
                    ${log.quality}
                </div>
            ` : ''}
        </div>
        ` : ''}

        <div class="footer">
            <p>Daily Log Report Generated on ${formatDate(new Date().toISOString())}</p>
            <p>For questions or updates, contact us at ${businessInfo.email} or ${businessInfo.phone}</p>
            <p>Powered by JobSight Pro - Construction Management Software</p>
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
 * Generate invoice HTML for PDF generation
 */
export async function generateInvoiceHTML(businessId: string, invoiceId: string): Promise<string> {
    try {
        // Validate inputs
        if (!businessId || !invoiceId) {
            throw new Error('Business ID and Invoice ID are required');
        }        // Fetch invoice data using existing server action
        const invoice = await getInvoiceWitDetailsById(businessId, invoiceId);

        if (!invoice) {
            throw new Error('Invoice not found');
        }        // Debug: Log the logo URL
        const logoUrl = await getImageAsDataUrl(invoice.business_info.logo_url || '/logo-full.png');
        console.log('Invoice PDF Logo URL (converted):', logoUrl.substring(0, 100) + '...');
        console.log('Business logo_url from DB:', invoice.business_info.logo_url);

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
            padding: 32px;
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
            margin-bottom: 32px;
            padding-bottom: 24px;
            border-bottom: 2px solid #ff6b35;
        }
        .logo {
            height: 50px;
            max-width: 200px;
        }
        .invoice-info {
            text-align: right;
        }
        .invoice-title {
            font-size: 28px;
            font-weight: 700;
            color: #ff6b35;
            margin-bottom: 16px;
        }
        .info-table {
            border-collapse: collapse;
        }
        .info-table td {
            padding: 4px 12px;
            border: none;
            font-size: 13px;
        }
        .info-table .label {
            font-weight: 600;
            text-align: right;
            color: #666666;
        }
        .addresses {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 32px;
            margin-bottom: 32px;
        }
        .address-section h3 {
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 12px;
            color: #1a1a1a;
        }
        .address-box {
            background: #fafafa;
            padding: 16px;
            border-radius: 6px;
            border: 1px solid #e5e5e5;
            font-size: 13px;
            line-height: 1.4;
        }
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 32px;
            border: 1px solid #e5e5e5;
            border-radius: 6px;
            overflow: hidden;
        }
        .items-table th,
        .items-table td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #f0f0f0;
            font-size: 13px;
        }
        .items-table th {
            background: #ff6b35;
            color: white;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .items-table .text-right {
            text-align: right;
        }
        .items-table tr:last-child td {
            border-bottom: none;
        }
        .items-table tbody tr:nth-child(even) {
            background: #fafafa;
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
            font-size: 14px;
        }
        .totals-table .label {
            font-weight: 600;
            text-align: right;
            color: #666666;
        }
        .totals-table .total-row {
            border-top: 2px solid #e5e5e5;
            font-weight: 700;
            font-size: 16px;
        }
        .totals-table .total-row .label {
            color: #1a1a1a;
        }
        .notes-section {
            margin-bottom: 32px;
        }
        .notes-section h3 {
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 12px;
            color: #1a1a1a;
        }
        .notes-box {
            background: #fafafa;
            padding: 16px;
            border-radius: 6px;
            border: 1px solid #e5e5e5;
            font-size: 13px;
            line-height: 1.5;
        }
        .footer {
            text-align: center;
            color: #888888;
            font-size: 12px;
            margin-top: 32px;
            padding-top: 20px;
            border-top: 1px solid #e5e5e5;
        }
        .status-badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 3px;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
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
        .company-info {
            font-size: 12px;
            line-height: 1.4;
            color: #666666;
        }
        .company-name {
            font-weight: 700;
            font-size: 14px;
            color: #1a1a1a;
            margin-bottom: 8px;
        }
        .amount-highlight {
            color: #ff6b35;
            font-weight: 600;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div>
                <img src="${logoUrl}" alt="Company Logo" class="logo" />
                <div class="company-info" style="margin-top: 16px;">
                    <div class="company-name">${invoice.business_info.name}</div>
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
                        <td class="label">Status:</td>
                        <td>
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
                    <div style="font-weight: 600; margin-bottom: 4px;">${invoice.billing_address.name}</div>
                    ${invoice.billing_address.attention ? `<div>Attn: ${invoice.billing_address.attention}</div>` : ''}
                    ${invoice.billing_address.street ? `<div>${invoice.billing_address.street}</div>` : ''}
                    ${invoice.billing_address.city ? `<div>${invoice.billing_address.city}, ${invoice.billing_address.state} ${invoice.billing_address.zip}</div>` : ''}
                    ${invoice.billing_address.country ? `<div>${invoice.billing_address.country}</div>` : ''}
                </div>
            </div>
            <div class="address-section">
                <h3>Project:</h3>
                <div class="address-box">
                    <div style="font-weight: 600; margin-bottom: 4px;">${invoice.project?.name || 'General Services'}</div>
                    <div>Invoice for services rendered as part of the project.</div>
                </div>
            </div>
        </div>

        <div>
            <h3 style="font-size: 16px; font-weight: 600; margin-bottom: 12px; color: #1a1a1a;">Invoice Items:</h3>
            <table class="items-table">
                <thead>
                    <tr>
                        <th>Description</th>
                        <th class="text-right">Quantity</th>
                        <th class="text-right">Unit Price</th>
                        <th class="text-right">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    ${invoice.items.map((item: any) => `
                    <tr>
                        <td>${item.description}</td>
                        <td class="text-right">${item.quantity}</td>
                        <td class="text-right">${formatCurrency(item.unit_price ?? 0)}</td>
                        <td class="text-right amount-highlight">${formatCurrency(item.amount ?? 0)}</td>
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
                    <td class="text-right amount-highlight">${formatCurrency(total)}</td>
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
            <p><strong>Thank you for your business!</strong></p>
            <p>If you have any questions about this invoice, please contact us at ${invoice.business_info.email} or ${invoice.business_info.phone}.</p>
            <p>Powered by JobSight Pro - Construction Management Software</p>
        </div>
    </div>
</body>
</html>`;

        return html;

    } catch (error) {
        console.error('Error generating invoice HTML:', error);
        throw new Error('Failed to generate invoice HTML');
    }
}
