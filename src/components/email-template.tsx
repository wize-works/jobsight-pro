import React from 'react';

interface EmailTemplateProps {
    type?: 'notification' | 'invoice' | 'welcome' | 'project-update' | 'generic';
    title: string;
    recipientName?: string;
    content: string | React.ReactNode;
    primaryAction?: {
        text: string;
        url: string;
    };
    secondaryAction?: {
        text: string;
        url: string;
    };
    footerContent?: string;
    businessName?: string;
    businessAddress?: string;
    businessPhone?: string;
    businessEmail?: string;
    unsubscribeUrl?: string;
    companyLogo?: string;
    additionalData?: Record<string, any>;
}

export default function EmailTemplate({
    type = 'generic',
    title,
    recipientName,
    content,
    primaryAction,
    secondaryAction,
    footerContent,
    businessName = 'JobSight Pro',
    businessAddress,
    businessPhone,
    businessEmail = 'support@jobsight.co',
    unsubscribeUrl,
    companyLogo,
    additionalData
}: EmailTemplateProps) {

    // Email styles using inline CSS for maximum compatibility
    const styles = {
        container: {
            fontFamily: "'Outfit', 'Segoe UI', 'Roboto', 'Helvetica Neue', sans-serif",
            lineHeight: '1.6',
            color: '#080607',
            backgroundColor: '#FAFAF9',
            margin: '0',
            padding: '0',
            width: '100%',
        },
        wrapper: {
            maxWidth: '600px',
            margin: '0 auto',
            backgroundColor: '#FAFAF9',
            padding: '20px',
        },
        header: {
            backgroundColor: '#FFFFFF',
            padding: '30px 40px',
            textAlign: 'center' as const,
            borderTop: '4px solid #F87431',
            borderRadius: '8px 8px 0 0',
            boxShadow: '0 2px 4px rgba(8, 6, 7, 0.1)',
        },
        logo: {
            maxWidth: '180px',
            height: 'auto',
            marginBottom: '20px',
        },
        headerTitle: {
            color: '#080607',
            fontSize: '28px',
            fontWeight: '700',
            margin: '0 0 10px 0',
            lineHeight: '1.2',
        },
        headerSubtitle: {
            color: '#666',
            fontSize: '16px',
            margin: '0',
            fontWeight: '400',
        },
        body: {
            backgroundColor: '#FFFFFF',
            padding: '40px',
            borderRadius: '0',
            boxShadow: '0 2px 4px rgba(8, 6, 7, 0.1)',
        },
        greeting: {
            fontSize: '18px',
            fontWeight: '600',
            color: '#080607',
            marginBottom: '20px',
            margin: '0 0 20px 0',
        },
        content: {
            fontSize: '16px',
            color: '#080607',
            lineHeight: '1.6',
            marginBottom: '30px',
        },
        buttonContainer: {
            textAlign: 'center' as const,
            margin: '30px 0',
        },
        primaryButton: {
            display: 'inline-block',
            backgroundColor: '#F87431',
            color: '#FAFAF9',
            padding: '14px 28px',
            textDecoration: 'none',
            borderRadius: '6px',
            fontWeight: '600',
            fontSize: '16px',
            margin: '0 10px 10px 0',
            boxShadow: '0 2px 4px rgba(248, 116, 49, 0.3)',
        },
        secondaryButton: {
            display: 'inline-block',
            backgroundColor: 'transparent',
            color: '#02ACA3',
            padding: '14px 28px',
            textDecoration: 'none',
            borderRadius: '6px',
            fontWeight: '600',
            fontSize: '16px',
            border: '2px solid #02ACA3',
            margin: '0 10px 10px 0',
        },
        infoBox: {
            backgroundColor: '#F0EFEC',
            border: '1px solid #CCC9C0',
            borderRadius: '6px',
            padding: '20px',
            margin: '20px 0',
        },
        warningBox: {
            backgroundColor: '#FEF3CD',
            border: '1px solid #F5B400',
            borderRadius: '6px',
            padding: '20px',
            margin: '20px 0',
        },
        successBox: {
            backgroundColor: '#D4EDDA',
            border: '1px solid #34A432',
            borderRadius: '6px',
            padding: '20px',
            margin: '20px 0',
        },
        footer: {
            backgroundColor: '#2D2D2A',
            color: '#FAFAF9',
            padding: '30px 40px',
            borderRadius: '0 0 8px 8px',
            textAlign: 'center' as const,
        },
        footerText: {
            fontSize: '14px',
            color: '#FAFAF9',
            lineHeight: '1.5',
            margin: '0 0 15px 0',
        },
        footerLinks: {
            fontSize: '14px',
            margin: '15px 0',
        },
        footerLink: {
            color: '#F87431',
            textDecoration: 'none',
            margin: '0 15px',
        },
        unsubscribe: {
            fontSize: '12px',
            color: '#CCC9C0',
            margin: '20px 0 0 0',
        },
        divider: {
            borderTop: '1px solid #CCC9C0',
            margin: '20px 0',
        },
        table: {
            width: '100%',
            borderCollapse: 'collapse' as const,
            margin: '20px 0',
        },
        tableHeader: {
            backgroundColor: '#F0EFEC',
            padding: '12px',
            borderBottom: '1px solid #CCC9C0',
            fontWeight: '600',
            textAlign: 'left' as const,
        },
        tableCell: {
            padding: '12px',
            borderBottom: '1px solid #CCC9C0',
        },
    };

    const getTypeSpecificContent = () => {
        switch (type) {
            case 'notification':
                return (
                    <div style={styles.infoBox}>
                        <h3 style={{ margin: '0 0 10px 0', color: '#5C95FF', fontSize: '18px' }}>
                            📢 New Notification
                        </h3>
                        <div style={styles.content}>
                            {content}
                        </div>
                    </div>
                );

            case 'invoice':
                return (
                    <div style={styles.successBox}>
                        <h3 style={{ margin: '0 0 10px 0', color: '#34A432', fontSize: '18px' }}>
                            🧾 Invoice Details
                        </h3>
                        <div style={styles.content}>
                            {content}
                        </div>
                    </div>
                );

            case 'welcome':
                return (
                    <div>
                        <div style={styles.content}>
                            Welcome to JobSight Pro! We're excited to help you streamline your construction management.
                        </div>
                        <div style={styles.content}>
                            {content}
                        </div>
                    </div>
                );

            case 'project-update':
                return (
                    <div style={styles.warningBox}>
                        <h3 style={{ margin: '0 0 10px 0', color: '#F5B400', fontSize: '18px' }}>
                            🚧 Project Update
                        </h3>
                        <div style={styles.content}>
                            {content}
                        </div>
                    </div>
                );

            default:
                return <div style={styles.content}>{content}</div>;
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.wrapper}>                {/* Header */}
                <div style={styles.header}>
                    {/* Always show JobSight logo in header */}
                    <img
                        src="https://pro.jobsight.co/logo-full.png"
                        alt="JobSight Pro Logo"
                        style={styles.logo}
                        height={'80px'}
                    />

                    <h1 style={styles.headerTitle}>{title}</h1>

                    {/* Clear indication this is sent on behalf of business */}
                    {businessName && businessName !== 'JobSight Pro' && (
                        <p style={{
                            ...styles.headerSubtitle,
                            fontSize: '14px',
                            fontWeight: '500',
                            color: '#F87431',
                            margin: '5px 0 0 0'
                        }}>
                            Sent on behalf of {businessName}
                        </p>
                    )}

                    {type !== 'generic' && (
                        <p style={styles.headerSubtitle}>
                            {type === 'notification' && 'Important Update'}
                            {type === 'invoice' && 'Invoice & Payment Information'}
                            {type === 'welcome' && 'Welcome to Your New Account'}
                            {type === 'project-update' && 'Project Status Update'}
                        </p>
                    )}
                </div>

                {/* Body */}
                <div style={styles.body}>
                    {recipientName && (
                        <p style={styles.greeting}>
                            Hello {recipientName},
                        </p>
                    )}

                    {getTypeSpecificContent()}

                    {/* Additional Data Table */}
                    {additionalData && Object.keys(additionalData).length > 0 && (
                        <div>
                            <hr style={styles.divider} />
                            <table style={styles.table}>
                                <tbody>
                                    {Object.entries(additionalData).map(([key, value]) => (
                                        <tr key={key}>
                                            <td style={{ ...styles.tableCell, fontWeight: '600', width: '30%' }}>
                                                {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}:
                                            </td>
                                            <td style={styles.tableCell}>
                                                {typeof value === 'string' || typeof value === 'number' ? value : JSON.stringify(value)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Action Buttons */}
                    {(primaryAction || secondaryAction) && (
                        <div style={styles.buttonContainer}>
                            {primaryAction && (
                                <a href={primaryAction.url} style={styles.primaryButton}>
                                    {primaryAction.text}
                                </a>
                            )}
                            {secondaryAction && (
                                <a href={secondaryAction.url} style={styles.secondaryButton}>
                                    {secondaryAction.text}
                                </a>
                            )}
                        </div>
                    )}

                    {footerContent && (
                        <>
                            <hr style={styles.divider} />
                            <div style={styles.content}>
                                {footerContent}
                            </div>
                        </>
                    )}
                </div>                {/* Footer */}
                <div style={styles.footer}>
                    {/* Business Contact Information Section */}
                    {(businessName && businessName !== 'JobSight Pro') && (businessAddress || businessPhone || businessEmail) && (
                        <div style={{
                            backgroundColor: '#3D3D3A',
                            padding: '20px',
                            borderRadius: '6px',
                            marginBottom: '20px',
                            border: '1px solid #4A4A47'
                        }}>
                            <p style={{
                                ...styles.footerText,
                                fontSize: '16px',
                                fontWeight: '600',
                                marginBottom: '10px',
                                color: '#F87431'
                            }}>
                                Contact {businessName}:
                            </p>
                            <p style={styles.footerText}>
                                {businessAddress && <><strong>Address:</strong> {businessAddress}<br /></>}
                                {businessPhone && <><strong>Phone:</strong> {businessPhone}<br /></>}
                                {businessEmail && <><strong>Email:</strong> {businessEmail}</>}
                            </p>
                        </div>
                    )}

                    {/* JobSight Branding */}
                    <p style={styles.footerText}>
                        <strong>
                            <img
                                src="https://pro.jobsight.co/logo-full-white.png"
                                alt="JobSight Pro"
                                style={{ height: '24px', verticalAlign: 'middle' }}
                            />
                        </strong>
                        <br />
                        Construction Management Made Simple
                    </p>

                    <div style={styles.footerLinks}>
                        <a href="https://pro.jobsight.co/dashboard" style={styles.footerLink}>
                            Dashboard
                        </a>
                        <a href="https://help.jobsight.co" style={styles.footerLink}>
                            Help Center
                        </a>
                        <a href="mailto:support@jobsight.co" style={styles.footerLink}>
                            Support
                        </a>
                    </div>

                    {unsubscribeUrl && (
                        <p style={styles.unsubscribe}>
                            Don't want to receive these emails?{' '}
                            <a
                                href={unsubscribeUrl}
                                style={{ color: '#CCC9C0', textDecoration: 'underline' }}
                            >
                                Unsubscribe here
                            </a>
                        </p>
                    )}

                    <p style={{ ...styles.unsubscribe, marginTop: '10px' }}>
                        © {new Date().getFullYear()} JobSight Technologies. All rights reserved.
                    </p>

                    <p style={{ ...styles.unsubscribe, fontSize: '11px', opacity: '0.8' }}>
                        This email was sent by JobSight Pro on behalf of {businessName || 'your contractor'}.
                    </p>
                </div>
            </div>
        </div>
    );
}

// Export additional utility components for complex email layouts

export function EmailSection({
    children,
    backgroundColor = '#FFFFFF',
    padding = '20px',
    style = {}
}: {
    children: React.ReactNode;
    backgroundColor?: string;
    padding?: string;
    style?: React.CSSProperties;
}) {
    return (
        <div style={{
            backgroundColor,
            padding,
            margin: '10px 0',
            borderRadius: '6px',
            ...style
        }}>
            {children}
        </div>
    );
}

export function EmailTable({
    headers,
    rows
}: {
    headers: string[];
    rows: (string | number)[][];
}) {
    const tableStyle = {
        width: '100%',
        borderCollapse: 'collapse' as const,
        margin: '20px 0',
        fontSize: '14px',
    };

    const headerStyle = {
        backgroundColor: '#F0EFEC',
        padding: '12px',
        borderBottom: '1px solid #CCC9C0',
        fontWeight: '600',
        textAlign: 'left' as const,
    };

    const cellStyle = {
        padding: '12px',
        borderBottom: '1px solid #CCC9C0',
    };

    return (
        <table style={tableStyle}>
            <thead>
                <tr>
                    {headers.map((header, index) => (
                        <th key={index} style={headerStyle}>
                            {header}
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {rows.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                        {row.map((cell, cellIndex) => (
                            <td key={cellIndex} style={cellStyle}>
                                {cell}
                            </td>
                        ))}
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

export function EmailAlert({
    type = 'info',
    children
}: {
    type?: 'info' | 'warning' | 'success' | 'error';
    children: React.ReactNode;
}) {
    const alertStyles = {
        info: { backgroundColor: '#F0EFEC', borderColor: '#CCC9C0', color: '#5C95FF' },
        warning: { backgroundColor: '#FEF3CD', borderColor: '#F5B400', color: '#8B5A00' },
        success: { backgroundColor: '#D4EDDA', borderColor: '#34A432', color: '#1B5E20' },
        error: { backgroundColor: '#F8D7DA', borderColor: '#D1152B', color: '#721C24' },
    };

    const style = alertStyles[type];

    return (
        <div style={{
            backgroundColor: style.backgroundColor,
            border: `1px solid ${style.borderColor}`,
            borderRadius: '6px',
            padding: '15px',
            margin: '15px 0',
            color: style.color,
        }}>
            {children}
        </div>
    );
}