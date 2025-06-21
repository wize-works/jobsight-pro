import EmailTemplate from '@/components/email-template';
import { NotificationTypeOptions } from '@/types/notifications';

interface GeneralNotificationEmailProps {
    recipientName: string;
    title: string;
    message: string;
    actionUrl?: string;
    notificationType: NotificationTypeOptions;
    businessName?: string;
    metadata?: any;
}

export function GeneralNotificationEmail({
    recipientName,
    title,
    message,
    actionUrl,
    notificationType,
    businessName = "JobSight Pro",
    metadata
}: GeneralNotificationEmailProps) {

    // Get notification type display name
    const getTypeDisplayName = (type: NotificationTypeOptions): string => {
        switch (type) {
            case "projectUpdates":
                return "Project Update";
            case "taskAssignments":
                return "Task Assignment";
            case "equipmentAlerts":
                return "Equipment Alert";
            case "invoiceUpdates":
                return "Invoice Update";
            case "systemAnnouncements":
                return "System Announcement";
            default:
                return "Notification";
        }
    };

    // Get notification icon based on type
    const getTypeIcon = (type: NotificationTypeOptions): string => {
        switch (type) {
            case "projectUpdates":
                return "🏗️";
            case "taskAssignments":
                return "📋";
            case "equipmentAlerts":
                return "⚙️";
            case "invoiceUpdates":
                return "🧾";
            case "systemAnnouncements":
                return "📢";
            default:
                return "🔔";
        }
    };

    return (
        <EmailTemplate
            type="notification"
            title={`${getTypeIcon(notificationType)} ${title}`}
            recipientName={recipientName}
            businessName={businessName}
            content={
                <div>
                    <div style={{
                        padding: '16px',
                        backgroundColor: '#f8f9fa',
                        borderRadius: '8px',
                        marginBottom: '24px',
                        borderLeft: '4px solid #2563eb'
                    }}>
                        <div style={{
                            fontSize: '14px',
                            color: '#6b7280',
                            marginBottom: '8px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            fontWeight: '600'
                        }}>
                            {getTypeDisplayName(notificationType)}
                        </div>
                        <div style={{
                            fontSize: '16px',
                            lineHeight: '1.6',
                            color: '#111827'
                        }}>
                            {message}
                        </div>
                    </div>

                    {metadata && (
                        <div style={{
                            fontSize: '14px',
                            color: '#6b7280',
                            marginBottom: '16px'
                        }}>
                            <strong>Additional Details:</strong>
                            <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
                                {metadata.projectName && (
                                    <li>Project: {metadata.projectName}</li>
                                )}
                                {metadata.taskName && (
                                    <li>Task: {metadata.taskName}</li>
                                )}
                                {metadata.equipmentName && (
                                    <li>Equipment: {metadata.equipmentName}</li>
                                )}
                                {metadata.clientName && (
                                    <li>Client: {metadata.clientName}</li>
                                )}
                                {metadata.eventType && (
                                    <li>Action: {metadata.eventType}</li>
                                )}
                            </ul>
                        </div>
                    )}

                    <p style={{
                        fontSize: '14px',
                        color: '#6b7280',
                        marginTop: '24px'
                    }}>
                        You're receiving this because you have email notifications enabled for {getTypeDisplayName(notificationType).toLowerCase()}s in your JobSight Pro account.
                    </p>
                </div>
            }
            primaryAction={actionUrl ? {
                text: 'View Details',
                url: actionUrl
            } : undefined}
            secondaryAction={{
                text: 'Manage Notifications',
                url: `${process.env.NEXT_PUBLIC_BASE_URL || "https://pro.jobsight.co"}/dashboard/profile`
            }}
            footerContent="You can update your notification preferences anytime in your profile settings."
        />
    );
}
