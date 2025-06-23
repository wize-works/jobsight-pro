"use server";

import { getClientDetailsByID } from "./clients";
import { getDailyLogWithDetailsById } from "./daily-logs";
import { getUserBusiness, getBusinessById } from "./business";

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
        // Fetch client data using existing server action
        const clientDetails = await getClientDetailsByID(businessId, clientId);

        if (!clientDetails) {
            throw new Error('Client not found');
        }

        const { client, projects, contacts, interactions } = clientDetails;        // Get business info separately
        const business = await getBusinessById(businessId);

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
        // Fetch daily log data using existing server action
        const log = await getDailyLogWithDetailsById(businessId, logId);

        if (!log) {
            throw new Error('Daily log not found');
        }        // Get business info separately
        const business = await getBusinessById(businessId);

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
        };

        // Generate HTML for daily log
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
        .log-info {
            text-align: right;
        }
        .log-title {
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
        .footer {
            text-align: center;
            color: #6b7280;
            font-size: 14px;
            margin-top: 40px;
            border-top: 1px solid #e5e7eb;
            padding-top: 20px;
        }
        .weather-icon {
            display: inline-block;
            margin-right: 8px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">            <div>
                <img src="${getAbsoluteUrl(businessInfo.logo_url || '/logo-full.png')}" alt="Company Logo" class="logo" />
                <div style="margin-top: 20px;">
                    <div style="font-weight: bold; font-size: 16px;">${businessInfo.name}</div>
                    <div>${businessInfo.street}</div>
                    <div>${businessInfo.city}, ${businessInfo.state} ${businessInfo.zip}</div>
                    <div>${businessInfo.country}</div>
                    <div>Phone: ${businessInfo.phone}</div>
                    <div>Email: ${businessInfo.email}</div>
                </div>
            </div>
            <div class="log-info">
                <div class="log-title">DAILY LOG</div>
                <table class="info-table">
                    <tr>
                        <td class="label">Date:</td>
                        <td>${formatDate(log.date)}</td>
                    </tr>
                    <tr>
                        <td class="label">Log ID:</td>
                        <td>${log.id.slice(-8).toUpperCase()}</td>
                    </tr>
                    <tr>
                        <td class="label">Weather:</td>
                        <td>${log.weather || 'Not recorded'}</td>
                    </tr>
                    <tr>
                        <td class="label">Hours Worked:</td>
                        <td>${log.hours_worked || 0} hours</td>
                    </tr>
                </table>
            </div>
        </div>

        <!-- Project Information -->
        <div class="details-section">
            <h3>Project Information</h3>
            <div class="details-grid">
                <div>
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
        </div>

        <!-- Work Details -->
        <div class="details-section">
            <h3>Work Completed</h3>
            <div class="detail-value">
                ${log.work_completed || 'No work details recorded'}
            </div>
        </div>

        <!-- Materials -->
        ${log.materials && log.materials.length > 0 ? `
        <div class="details-section">
            <h3>Materials Used (${log.materials.length})</h3>
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
                        <td>${material.name}</td>
                        <td class="text-right">${material.quantity || 0}</td>
                        <td class="text-right">${formatCurrency(material.cost || 0)}</td>
                        <td class="text-right">${formatCurrency((material.cost || 0) * (material.quantity || 0))}</td>
                    </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        ` : ''}

        <!-- Equipment -->
        ${log.equipment && log.equipment.length > 0 ? `
        <div class="details-section">
            <h3>Equipment Used (${log.equipment.length})</h3>
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
                        <td>${equip.name}</td>
                        <td class="text-right">${equip.hours || 0}h</td>
                    </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        ` : ''}

        <!-- Notes and Issues -->
        ${(log.safety && log.safety !== "None reported") || (log.delays && log.delays !== "No delays reported") || log.quality ? `
        <div class="details-section">
            <h3>Notes & Issues</h3>
            ${log.safety && log.safety !== "None reported" ? `
                <div class="detail-item">
                    <div class="detail-label">Safety Notes</div>
                    <div class="detail-value">${log.safety}</div>
                </div>
            ` : ''}
            ${log.delays && log.delays !== "No delays reported" ? `
                <div class="detail-item">
                    <div class="detail-label">Delays</div>
                    <div class="detail-value">${log.delays}</div>
                </div>
            ` : ''}
            ${log.quality ? `
                <div class="detail-item">
                    <div class="detail-label">Quality Notes</div>
                    <div class="detail-value">${log.quality}</div>
                </div>
            ` : ''}
        </div>
        ` : ''}        <div class="footer">
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
