'use client';

import { useState } from 'react';
import EmailTemplate, { EmailSection, EmailTable, EmailAlert } from '@/components/email-template';
import {
    WelcomeEmail,
    InvoiceEmail,
    ProjectUpdateEmail,
    EquipmentAlertEmail,
    TeamInvitationEmail,
    PasswordResetEmail
} from '@/components/email-examples';

export default function EmailTemplateDemo() {
    const [selectedTemplate, setSelectedTemplate] = useState('welcome');
    const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');

    const templates = {
        welcome: {
            name: 'Welcome Email',
            component: (
                <WelcomeEmail
                    recipientName="John Smith"
                    businessName="Smith Construction"
                    loginUrl="https://pro.jobsight.co/login"
                />
            )
        },
        invoice: {
            name: 'Invoice Email',
            component: (
                <InvoiceEmail
                    recipientName="Michael Thompson"
                    invoiceNumber="INV-2024-001"
                    amount="$3,450.00"
                    dueDate="January 15, 2025"
                    projectName="Downtown Office Building - Phase 1"
                    invoiceUrl="https://pro.jobsight.co/invoices/123"
                    paymentUrl="https://pay.jobsight.co/invoice/123"
                    businessInfo={{
                        name: "Smith Construction Co.",
                        address: "123 Construction Ave, Builder City, BC 12345",
                        phone: "(555) 123-4567",
                        email: "billing@smithconstruction.com"
                    }}
                />
            )
        },
        projectUpdate: {
            name: 'Project Update',
            component: (
                <ProjectUpdateEmail
                    recipientName="Sarah Johnson"
                    projectName="Downtown Office Building"
                    updateType="milestone_completed"
                    updateDetails="Foundation work has been completed successfully. Ready to begin framing phase next week."
                    projectUrl="https://pro.jobsight.co/projects/456"
                    updatedBy="Mike Rodriguez"
                />
            )
        },
        equipmentAlert: {
            name: 'Equipment Alert',
            component: (
                <EquipmentAlertEmail
                    recipientName="Tom Wilson"
                    equipmentName="Excavator CAT 320"
                    alertType="maintenance_due"
                    description="Regular maintenance is due for Excavator CAT 320. Please schedule service within the next 5 days to avoid downtime."
                    equipmentUrl="https://pro.jobsight.co/equipment/789"
                    priority="high"
                />
            )
        },
        teamInvitation: {
            name: 'Team Invitation',
            component: (
                <TeamInvitationEmail
                    recipientName="Alex Chen"
                    inviterName="Sarah Johnson"
                    businessName="Smith Construction Co."
                    role="Project Manager"
                    invitationUrl="https://pro.jobsight.co/invite/accept/abc123"
                    expirationDate="January 20, 2025"
                />
            )
        },
        passwordReset: {
            name: 'Password Reset',
            component: (
                <PasswordResetEmail
                    recipientName="John Smith"
                    resetUrl="https://pro.jobsight.co/reset-password/xyz789"
                    expirationTime="1 hour"
                />
            )
        },
        custom: {
            name: 'Custom Template',
            component: (
                <EmailTemplate
                    type="notification"
                    title="Custom Email Template"
                    recipientName="Demo User"
                    content={
                        <div>
                            <p>This is a custom email template demonstration showing various components:</p>

                            <EmailSection backgroundColor="#F0EFEC" padding="20px">
                                <h3 style={{ margin: '0 0 10px 0', fontSize: '18px' }}>📋 Project Summary</h3>
                                <p style={{ margin: '0' }}>Current status and recent activities for your construction projects.</p>
                            </EmailSection>

                            <EmailTable
                                headers={['Project', 'Status', 'Progress', 'Due Date']}
                                rows={[
                                    ['Downtown Office', 'In Progress', '65%', 'June 30, 2025'],
                                    ['Residential Complex', 'Planning', '15%', 'August 15, 2025'],
                                    ['Shopping Center', 'Completed', '100%', 'December 1, 2024']
                                ]}
                            />

                            <EmailAlert type="info">
                                <strong>💡 Pro Tip:</strong> Use the mobile app to submit daily logs from the field and keep your projects on track.
                            </EmailAlert>

                            <EmailAlert type="warning">
                                <strong>⚠️ Attention:</strong> Two equipment inspections are due this week.
                            </EmailAlert>

                            <EmailAlert type="success">
                                <strong>🎉 Congratulations!</strong> You've completed 3 projects this quarter.
                            </EmailAlert>
                        </div>
                    }
                    primaryAction={{
                        text: 'View Dashboard',
                        url: 'https://pro.jobsight.co/dashboard'
                    }}
                    secondaryAction={{
                        text: 'Download Report',
                        url: 'https://pro.jobsight.co/reports/quarterly'
                    }}
                    additionalData={{
                        totalProjects: '15',
                        completedThisMonth: '3',
                        activeTeamMembers: '12',
                        upcomingDeadlines: '5'
                    }}
                    footerContent="This email demonstrates the flexibility of our email template system with custom content, tables, alerts, and data."
                />
            )
        }
    };

    return (
        <div className="min-h-screen bg-base-200 p-4">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-base-content mb-2">
                        📧 JobSight Pro Email Templates
                    </h1>
                    <p className="text-base-content/70">
                        Interactive demo of all available email templates matching JobSight Pro's design system
                    </p>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                    {/* Template Selection Sidebar */}
                    <div className="xl:col-span-1">
                        <div className="card bg-base-100 shadow-lg">
                            <div className="card-body">
                                <h2 className="card-title text-lg mb-4">📋 Templates</h2>

                                <div className="space-y-2">
                                    {Object.entries(templates).map(([key, template]) => (
                                        <button
                                            key={key}
                                            onClick={() => setSelectedTemplate(key)}
                                            className={`btn btn-sm w-full justify-start ${selectedTemplate === key ? 'btn-primary' : 'btn-ghost'
                                                }`}
                                        >
                                            {template.name}
                                        </button>
                                    ))}
                                </div>

                                <div className="divider"></div>

                                <h3 className="font-semibold text-sm mb-3">👀 View Mode</h3>
                                <div className="btn-group w-full">
                                    <button
                                        onClick={() => setViewMode('desktop')}
                                        className={`btn btn-sm flex-1 ${viewMode === 'desktop' ? 'btn-primary' : 'btn-outline'
                                            }`}
                                    >
                                        🖥️ Desktop
                                    </button>
                                    <button
                                        onClick={() => setViewMode('mobile')}
                                        className={`btn btn-sm flex-1 ${viewMode === 'mobile' ? 'btn-primary' : 'btn-outline'
                                            }`}
                                    >
                                        📱 Mobile
                                    </button>
                                </div>

                                <div className="divider"></div>

                                <div className="text-xs text-base-content/60 space-y-2">
                                    <p><strong>📚 Features:</strong></p>
                                    <ul className="list-disc list-inside space-y-1 text-xs">
                                        <li>Brand consistent colors</li>
                                        <li>Responsive design</li>
                                        <li>Multiple email types</li>
                                        <li>Custom components</li>
                                        <li>TypeScript support</li>
                                        <li>Email client compatible</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Email Preview */}
                    <div className="xl:col-span-3">
                        <div className="card bg-base-100 shadow-lg">
                            <div className="card-body p-0">
                                <div className="flex items-center justify-between p-4 border-b border-base-300">
                                    <h2 className="card-title text-lg">
                                        📧 {templates[selectedTemplate as keyof typeof templates].name}
                                    </h2>

                                    <div className="flex items-center gap-2">
                                        <div className="badge badge-outline">
                                            {viewMode === 'desktop' ? '🖥️ Desktop' : '📱 Mobile'}
                                        </div>

                                        <div className="dropdown dropdown-end">
                                            <label tabIndex={0} className="btn btn-sm btn-circle btn-ghost">
                                                <i className="fas fa-ellipsis-vertical"></i>
                                            </label>
                                            <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
                                                <li>
                                                    <a onClick={() => {
                                                        const emailContent = document.getElementById('email-preview')?.innerHTML;
                                                        if (emailContent) {
                                                            const blob = new Blob([emailContent], { type: 'text/html' });
                                                            const url = URL.createObjectURL(blob);
                                                            const link = document.createElement('a');
                                                            link.href = url;
                                                            link.download = `jobsight-email-${selectedTemplate}.html`;
                                                            link.click();
                                                            URL.revokeObjectURL(url);
                                                        }
                                                    }}>
                                                        <i className="fas fa-download"></i>
                                                        Download HTML
                                                    </a>
                                                </li>
                                                <li>
                                                    <a onClick={() => {
                                                        const emailElement = document.getElementById('email-preview');
                                                        if (emailElement) {
                                                            const range = document.createRange();
                                                            range.selectNode(emailElement);
                                                            window.getSelection()?.removeAllRanges();
                                                            window.getSelection()?.addRange(range);
                                                            navigator.clipboard.writeText(emailElement.innerHTML);
                                                        }
                                                    }}>
                                                        <i className="fas fa-copy"></i>
                                                        Copy HTML
                                                    </a>
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4">
                                    <div
                                        id="email-preview"
                                        className={`border border-base-300 rounded-lg overflow-hidden bg-white transition-all duration-300 ${viewMode === 'mobile'
                                                ? 'max-w-sm mx-auto'
                                                : 'w-full'
                                            }`}
                                        style={{
                                            maxHeight: '80vh',
                                            overflowY: 'auto'
                                        }}
                                    >
                                        {templates[selectedTemplate as keyof typeof templates].component}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Usage Instructions */}
                <div className="mt-8">
                    <div className="card bg-base-100 shadow-lg">
                        <div className="card-body">
                            <h2 className="card-title text-xl mb-4">🛠️ Usage Instructions</h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h3 className="font-semibold text-lg mb-3">📦 Installation</h3>
                                    <div className="mockup-code">
                                        <pre data-prefix="$"><code>npm install react react-dom</code></pre>
                                        <pre data-prefix=">" className="text-warning"><code>Copy components to your project</code></pre>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="font-semibold text-lg mb-3">🚀 Quick Start</h3>
                                    <div className="mockup-code text-xs">
                                        <pre data-prefix="1"><code>import EmailTemplate from '@/components/email-template';</code></pre>
                                        <pre data-prefix="2"><code></code></pre>
                                        <pre data-prefix="3"><code>&lt;EmailTemplate</code></pre>
                                        <pre data-prefix="4"><code>  title="Welcome!"</code></pre>
                                        <pre data-prefix="5"><code>  content="Hello world"</code></pre>
                                        <pre data-prefix="6"><code>/&gt;</code></pre>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6">
                                <h3 className="font-semibold text-lg mb-3">📋 Available Components</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="card bg-base-200 shadow-sm">
                                        <div className="card-body py-4">
                                            <h4 className="font-semibold">EmailTemplate</h4>
                                            <p className="text-sm text-base-content/70">Main template component</p>
                                        </div>
                                    </div>
                                    <div className="card bg-base-200 shadow-sm">
                                        <div className="card-body py-4">
                                            <h4 className="font-semibold">EmailSection</h4>
                                            <p className="text-sm text-base-content/70">Custom content sections</p>
                                        </div>
                                    </div>
                                    <div className="card bg-base-200 shadow-sm">
                                        <div className="card-body py-4">
                                            <h4 className="font-semibold">EmailTable</h4>
                                            <p className="text-sm text-base-content/70">Responsive data tables</p>
                                        </div>
                                    </div>
                                    <div className="card bg-base-200 shadow-sm">
                                        <div className="card-body py-4">
                                            <h4 className="font-semibold">EmailAlert</h4>
                                            <p className="text-sm text-base-content/70">Contextual alerts</p>
                                        </div>
                                    </div>
                                    <div className="card bg-base-200 shadow-sm">
                                        <div className="card-body py-4">
                                            <h4 className="font-semibold">Pre-built Examples</h4>
                                            <p className="text-sm text-base-content/70">Ready-to-use templates</p>
                                        </div>
                                    </div>
                                    <div className="card bg-base-200 shadow-sm">
                                        <div className="card-body py-4">
                                            <h4 className="font-semibold">TypeScript Support</h4>
                                            <p className="text-sm text-base-content/70">Full type safety</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 p-4 bg-primary/10 rounded-lg border border-primary/20">
                                <div className="flex items-start gap-3">
                                    <i className="fas fa-lightbulb text-primary mt-1"></i>
                                    <div>
                                        <h4 className="font-semibold text-primary mb-2">💡 Pro Tips</h4>
                                        <ul className="text-sm text-base-content/80 space-y-1">
                                            <li>• Test emails in multiple clients before production</li>
                                            <li>• Use the mobile view to ensure responsive design</li>
                                            <li>• Customize business information for your company</li>
                                            <li>• Check the README for integration examples</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
