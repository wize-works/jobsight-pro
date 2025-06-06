import EmailTemplate, { EmailSection, EmailTable, EmailAlert } from '@/components/email-template';

// Example 1: Welcome Email
export function WelcomeEmail({
    recipientName,
    businessName,
    loginUrl = 'https://pro.jobsight.co/login'
}: {
    recipientName: string;
    businessName?: string;
    loginUrl?: string;
}) {
    return (
        <EmailTemplate
            type="welcome"
            title="Welcome to JobSight Pro!"
            recipientName={recipientName}
            businessName={businessName}
            content={
                <div>
                    <p>Your construction management account is now ready to go. Here's what you can do:</p>
                    <ul style={{ paddingLeft: '20px', lineHeight: '1.8' }}>
                        <li>📋 Create and manage projects</li>
                        <li>👥 Invite your team members</li>
                        <li>📝 Submit daily logs with photos</li>
                        <li>🧾 Generate professional invoices</li>
                        <li>📱 Access everything from your mobile device</li>
                    </ul>
                    <p>We recommend starting with our quick onboarding guide to get the most out of JobSight Pro.</p>
                </div>
            }
            primaryAction={{
                text: 'Get Started',
                url: loginUrl
            }}
            secondaryAction={{
                text: 'Watch Tutorial',
                url: 'https://help.jobsight.co/getting-started'
            }}
            footerContent="Need help getting started? Our support team is here to help you every step of the way."
        />
    );
}

// Example 2: Invoice Email
export function InvoiceEmail({
    recipientName,
    invoiceNumber,
    amount,
    dueDate,
    projectName,
    invoiceUrl,
    paymentUrl,
    businessInfo
}: {
    recipientName: string;
    invoiceNumber: string;
    amount: string;
    dueDate: string;
    projectName: string;
    invoiceUrl: string;
    paymentUrl?: string;
    businessInfo?: {
        name: string;
        address?: string;
        phone?: string;
        email?: string;
    };
}) {
    return (
        <EmailTemplate
            type="invoice"
            title={`Invoice ${invoiceNumber}`}
            recipientName={recipientName}
            businessName={businessInfo?.name}
            businessAddress={businessInfo?.address}
            businessPhone={businessInfo?.phone}
            businessEmail={businessInfo?.email}
            content={
                <div>
                    <p>Please find your invoice attached for the following project work:</p>

                    <EmailTable
                        headers={['Description', 'Amount', 'Due Date']}
                        rows={[
                            [projectName, amount, dueDate]
                        ]}
                    />

                    <EmailAlert type="info">
                        <strong>Payment Instructions:</strong> Please remit payment by the due date shown above.
                        {paymentUrl && ' You can pay online using the button below.'}
                    </EmailAlert>
                </div>
            }
            primaryAction={paymentUrl ? {
                text: 'Pay Now',
                url: paymentUrl
            } : {
                text: 'View Invoice',
                url: invoiceUrl
            }}
            secondaryAction={{
                text: 'Download PDF',
                url: invoiceUrl
            }}
            additionalData={{
                invoiceNumber,
                projectName,
                amount,
                dueDate
            }}
            footerContent="If you have any questions about this invoice, please don't hesitate to contact us."
        />
    );
}

// Example 3: Project Update Notification
export function ProjectUpdateEmail({
    recipientName,
    projectName,
    updateType,
    updateDetails,
    projectUrl,
    updatedBy
}: {
    recipientName: string;
    projectName: string;
    updateType: 'status_change' | 'new_task' | 'milestone_completed' | 'issue_reported';
    updateDetails: string;
    projectUrl: string;
    updatedBy: string;
}) {
    const getUpdateTitle = () => {
        switch (updateType) {
            case 'status_change': return '📊 Project Status Changed';
            case 'new_task': return '📋 New Task Assigned';
            case 'milestone_completed': return '🎉 Milestone Completed';
            case 'issue_reported': return '⚠️ Issue Reported';
            default: return '📢 Project Update';
        }
    };

    return (
        <EmailTemplate
            type="project-update"
            title={getUpdateTitle()}
            recipientName={recipientName}
            content={
                <div>
                    <p><strong>Project:</strong> {projectName}</p>
                    <p><strong>Updated by:</strong> {updatedBy}</p>

                    <EmailSection backgroundColor="#F0EFEC" padding="20px">
                        <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#080607' }}>
                            Update Details
                        </h3>
                        <p style={{ margin: '0', lineHeight: '1.6' }}>{updateDetails}</p>
                    </EmailSection>
                </div>
            }
            primaryAction={{
                text: 'View Project',
                url: projectUrl
            }}
            secondaryAction={{
                text: 'View All Projects',
                url: 'https://pro.jobsight.co/dashboard/projects'
            }}
            additionalData={{
                project: projectName,
                updateType: updateType.replace('_', ' '),
                updatedBy
            }}
        />
    );
}

// Example 4: Equipment Alert Email
export function EquipmentAlertEmail({
    recipientName,
    equipmentName,
    alertType,
    description,
    equipmentUrl,
    priority = 'medium'
}: {
    recipientName: string;
    equipmentName: string;
    alertType: 'maintenance_due' | 'inspection_required' | 'issue_reported' | 'assigned';
    description: string;
    equipmentUrl: string;
    priority?: 'low' | 'medium' | 'high';
}) {
    const getAlertTitle = () => {
        switch (alertType) {
            case 'maintenance_due': return '🔧 Maintenance Due';
            case 'inspection_required': return '🔍 Inspection Required';
            case 'issue_reported': return '⚠️ Issue Reported';
            case 'assigned': return '📦 Equipment Assigned';
            default: return '🚨 Equipment Alert';
        }
    };

    const alertTypeMapping = {
        'low': 'info',
        'medium': 'warning',
        'high': 'error'
    } as const;

    return (
        <EmailTemplate
            type="notification"
            title={getAlertTitle()}
            recipientName={recipientName}
            content={
                <div>
                    <p><strong>Equipment:</strong> {equipmentName}</p>

                    <EmailAlert type={alertTypeMapping[priority]}>
                        <h4 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>
                            {alertType.replace('_', ' ').toUpperCase()}
                        </h4>
                        <p style={{ margin: '0' }}>{description}</p>
                    </EmailAlert>
                </div>
            }
            primaryAction={{
                text: 'View Equipment',
                url: equipmentUrl
            }}
            secondaryAction={{
                text: 'Equipment Dashboard',
                url: 'https://pro.jobsight.co/dashboard/equipment'
            }}
            additionalData={{
                equipment: equipmentName,
                alertType: alertType.replace('_', ' '),
                priority
            }}
        />
    );
}

// Example 5: Team Invitation Email
export function TeamInvitationEmail({
    recipientName,
    inviterName,
    businessName,
    role,
    invitationUrl,
    expirationDate
}: {
    recipientName: string;
    inviterName: string;
    businessName: string;
    role: string;
    invitationUrl: string;
    expirationDate: string;
}) {
    return (
        <EmailTemplate
            type="welcome"
            title="You're Invited to Join a Team!"
            recipientName={recipientName}
            businessName={businessName}
            content={
                <div>
                    <p>
                        <strong>{inviterName}</strong> has invited you to join <strong>{businessName}</strong>
                        on JobSight Pro as a <strong>{role}</strong>.
                    </p>

                    <EmailSection backgroundColor="#F0EFEC" padding="20px">
                        <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>What You'll Get Access To:</h3>
                        <ul style={{ paddingLeft: '20px', lineHeight: '1.8', margin: '0' }}>
                            <li>Project management tools</li>
                            <li>Daily logging and reporting</li>
                            <li>Team collaboration features</li>
                            <li>Mobile access for field work</li>
                            <li>Real-time notifications</li>
                        </ul>
                    </EmailSection>

                    <EmailAlert type="warning">
                        <strong>⏰ This invitation expires on {expirationDate}</strong>
                        <br />
                        Click the button below to accept and create your account.
                    </EmailAlert>
                </div>
            }
            primaryAction={{
                text: 'Accept Invitation',
                url: invitationUrl
            }}
            secondaryAction={{
                text: 'Learn More',
                url: 'https://jobsight.co/features'
            }}
            additionalData={{
                invitedBy: inviterName,
                businessName,
                role,
                expirationDate
            }}
            footerContent="If you're not expecting this invitation, you can safely ignore this email."
        />
    );
}

// Example 6: Password Reset Email
export function PasswordResetEmail({
    recipientName,
    resetUrl,
    expirationTime = '1 hour'
}: {
    recipientName: string;
    resetUrl: string;
    expirationTime?: string;
}) {
    return (
        <EmailTemplate
            type="notification"
            title="Reset Your Password"
            recipientName={recipientName}
            content={
                <div>
                    <p>We received a request to reset your JobSight Pro password.</p>

                    <EmailAlert type="warning">
                        <strong>⏰ Security Notice:</strong>
                        <br />
                        This password reset link will expire in {expirationTime}.
                        If you didn't request this reset, please ignore this email.
                    </EmailAlert>

                    <p>Click the button below to create a new password:</p>
                </div>
            }


// Team Invitation Email
export function TeamInvitationEmail({
    recipientName,
    inviterName,
    businessName,
    role,
    invitationUrl,
    expirationDate
}: {
    recipientName: string;
    inviterName: string;
    businessName: string;
    role: string;
    invitationUrl: string;
    expirationDate: string;
}) {
    return (
        <EmailTemplate
            type="welcome"
            title="You're Invited to Join a Team!"
            recipientName={recipientName}
            businessName={businessName}
            content={
                <div>
                    <p>
                        <strong>{inviterName}</strong> has invited you to join <strong>{businessName}</strong>
                        on JobSight Pro as a <strong>{role}</strong>.
                    </p>

                    <EmailSection backgroundColor="#F0EFEC" padding="20px">
                        <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>What You'll Get Access To:</h3>
                        <ul style={{ paddingLeft: '20px', lineHeight: '1.8', margin: '0' }}>
                            <li>Project management tools</li>
                            <li>Daily logging and reporting</li>
                            <li>Team collaboration features</li>
                            <li>Mobile access for field work</li>
                            <li>Real-time notifications</li>
                        </ul>
                    </EmailSection>

                    <EmailAlert type="warning">
                        <strong>⏰ This invitation expires on {expirationDate}</strong>
                        <br />
                        Click the button below to accept and create your account.
                    </EmailAlert>
                </div>
            }
            primaryAction={{
                text: 'Accept Invitation',
                url: invitationUrl
            }}
            secondaryAction={{
                text: 'Learn More',
                url: 'https://pro.jobsight.co/features'
            }}
            additionalData={{
                invitedBy: inviterName,
                businessName,
                role,
                expirationDate
            }}
            footerContent="If you're not expecting this invitation, you can safely ignore this email."
        />
    );
}

            primaryAction={{
                text: 'Reset Password',
                url: resetUrl
            }}
            secondaryAction={{
                text: 'Contact Support',
                url: 'mailto:support@jobsight.co'
            }}
            footerContent="If you're having trouble accessing your account, our support team is here to help."
        />
    );
}
