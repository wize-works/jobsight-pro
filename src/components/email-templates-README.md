# JobSight Pro Email Templates

Professional email templates that match the JobSight Pro design system and branding.

## Overview

The email template system provides a consistent, responsive, and brand-compliant way to send emails for various purposes within the JobSight Pro application.

## Features

- ✅ **Brand Consistent**: Matches JobSight Pro colors, fonts, and styling
- ✅ **Responsive Design**: Works on all email clients and devices
- ✅ **Multiple Types**: Pre-configured layouts for different email purposes
- ✅ **Accessible**: High contrast and screen reader friendly
- ✅ **Customizable**: Easy to extend and modify
- ✅ **TypeScript**: Full type safety and IntelliSense support

## Quick Start

```tsx
import EmailTemplate from '@/components/email-template';

// Basic usage
<EmailTemplate
  title="Welcome to JobSight Pro!"
  recipientName="John Smith"
  content="Your account has been created successfully."
  primaryAction={{
    text: 'Get Started',
    url: 'https://pro.jobsight.co/dashboard'
  }}
/>
```

## Email Types

### 1. Generic Email
Basic template for any content:

```tsx
<EmailTemplate
  type="generic"
  title="Your Custom Title"
  content="Your custom content here..."
/>
```

### 2. Notification Email
For system notifications and alerts:

```tsx
<EmailTemplate
  type="notification"
  title="New Task Assigned"
  recipientName="Jane Doe"
  content="You have been assigned a new task: Foundation Inspection"
  primaryAction={{
    text: 'View Task',
    url: 'https://pro.jobsight.co/tasks/123'
  }}
/>
```

### 3. Invoice Email
For billing and payment-related emails:

```tsx
<EmailTemplate
  type="invoice"
  title="Invoice #INV-2024-001"
  recipientName="Client Name"
  content="Please find your invoice for project work completed."
  primaryAction={{
    text: 'Pay Now',
    url: 'https://pay.jobsight.co/invoice/123'
  }}
  additionalData={{
    invoiceNumber: 'INV-2024-001',
    amount: '$2,500.00',
    dueDate: 'January 15, 2025'
  }}
/>
```

### 4. Welcome Email
For new user onboarding:

```tsx
<EmailTemplate
  type="welcome"
  title="Welcome to JobSight Pro!"
  recipientName="New User"
  content="Your construction management account is ready to go."
  primaryAction={{
    text: 'Get Started',
    url: 'https://pro.jobsight.co/onboarding'
  }}
/>
```

### 5. Project Update Email
For project-related notifications:

```tsx
<EmailTemplate
  type="project-update"
  title="Project Status Update"
  recipientName="Project Manager"
  content="Downtown Office Building project has been updated."
  primaryAction={{
    text: 'View Project',
    url: 'https://pro.jobsight.co/projects/456'
  }}
/>
```

## Pre-built Examples

Import ready-to-use email components:

```tsx
import { 
  WelcomeEmail,
  InvoiceEmail,
  ProjectUpdateEmail,
  EquipmentAlertEmail,
  TeamInvitationEmail,
  PasswordResetEmail 
} from '@/components/email-examples';

// Use pre-built templates
<WelcomeEmail
  recipientName="John Smith"
  businessName="Smith Construction"
  loginUrl="https://pro.jobsight.co/login"
/>

<InvoiceEmail
  recipientName="Client Name"
  invoiceNumber="INV-2024-001"
  amount="$2,500.00"
  dueDate="January 15, 2025"
  projectName="Downtown Office Building"
  invoiceUrl="https://pro.jobsight.co/invoices/123"
  paymentUrl="https://pay.jobsight.co/invoice/123"
/>
```

## Advanced Components

### EmailSection
Create custom content sections:

```tsx
import { EmailSection } from '@/components/email-template';

<EmailSection backgroundColor="#F0EFEC" padding="20px">
  <h3>Custom Section</h3>
  <p>Your content here...</p>
</EmailSection>
```

### EmailTable
Display tabular data:

```tsx
import { EmailTable } from '@/components/email-template';

<EmailTable
  headers={['Item', 'Quantity', 'Price']}
  rows={[
    ['Concrete', '10 yards', '$1,200.00'],
    ['Labor', '8 hours', '$640.00']
  ]}
/>
```

### EmailAlert
Add contextual alerts:

```tsx
import { EmailAlert } from '@/components/email-template';

<EmailAlert type="warning">
  Important: This invoice is due in 3 days.
</EmailAlert>

<EmailAlert type="success">
  Payment received successfully!
</EmailAlert>
```

## Customization

### Business Information
Configure your business details:

```tsx
<EmailTemplate
  businessName="Your Construction Company"
  businessAddress="123 Main St, City, State 12345"
  businessPhone="(555) 123-4567"
  businessEmail="info@yourcompany.com"
  companyLogo="https://yoursite.com/logo.png"
  // ... other props
/>
```

### Actions and Links
Add multiple call-to-action buttons:

```tsx
<EmailTemplate
  primaryAction={{
    text: 'Primary Action',
    url: 'https://example.com/primary'
  }}
  secondaryAction={{
    text: 'Secondary Action',
    url: 'https://example.com/secondary'
  }}
  // ... other props
/>
```

### Additional Data
Include structured data in a table format:

```tsx
<EmailTemplate
  additionalData={{
    projectName: 'Downtown Office Building',
    startDate: 'January 1, 2025',
    estimatedCompletion: 'June 30, 2025',
    projectManager: 'John Smith'
  }}
  // ... other props
/>
```

### Footer Customization
Add custom footer content:

```tsx
<EmailTemplate
  footerContent="Need help? Contact our support team at support@jobsight.co"
  unsubscribeUrl="https://pro.jobsight.co/unsubscribe?token=abc123"
  // ... other props
/>
```

## Styling Guidelines

The email templates follow JobSight Pro's design system:

- **Primary Color**: `#F87431` (Construction Orange)
- **Secondary Color**: `#02ACA3` (Teal)
- **Text Color**: `#080607` (Navy)
- **Background**: `#FAFAF9` (Off White)
- **Font**: Outfit (with fallbacks)

### Color Usage
- **Primary buttons**: Orange background with white text
- **Secondary buttons**: Transparent with teal border and text
- **Info alerts**: Light gray background with blue accent
- **Warning alerts**: Light yellow background with orange accent
- **Success alerts**: Light green background with green accent
- **Error alerts**: Light red background with red accent

## Email Client Compatibility

These templates are tested and compatible with:

- ✅ Gmail (Desktop & Mobile)
- ✅ Outlook (2016+, Web, Mobile)
- ✅ Apple Mail (Desktop & iOS)
- ✅ Yahoo Mail
- ✅ AOL Mail
- ✅ Thunderbird
- ✅ Most other modern email clients

## Best Practices

1. **Keep it concise**: Users scan emails quickly
2. **Clear call-to-action**: Make it obvious what action to take
3. **Mobile-first**: Most users check email on mobile
4. **Test thoroughly**: Preview in multiple email clients
5. **Accessibility**: Use high contrast and descriptive alt text
6. **Personalization**: Include recipient name when possible
7. **Branding consistency**: Use consistent colors and fonts

## Integration Examples

### With Resend
```tsx
import { Resend } from 'resend';
import { WelcomeEmail } from '@/components/email-examples';

const resend = new Resend(process.env.RESEND_API_KEY);

await resend.emails.send({
  from: 'noreply@jobsight.co',
  to: 'user@example.com',
  subject: 'Welcome to JobSight Pro!',
  react: WelcomeEmail({
    recipientName: 'John Smith',
    businessName: 'Smith Construction'
  }),
});
```

### With Nodemailer
```tsx
import nodemailer from 'nodemailer';
import { renderToString } from 'react-dom/server';
import { InvoiceEmail } from '@/components/email-examples';

const html = renderToString(
  InvoiceEmail({
    recipientName: 'Client Name',
    invoiceNumber: 'INV-2024-001',
    // ... other props
  })
);

await transporter.sendMail({
  from: 'noreply@jobsight.co',
  to: 'client@example.com',
  subject: 'Invoice INV-2024-001',
  html,
});
```

## Contributing

When adding new email templates:

1. Follow the existing component structure
2. Use the established color scheme
3. Ensure mobile responsiveness
4. Add TypeScript types
5. Include usage examples
6. Test in multiple email clients

## Support

For questions or issues with the email templates:

- 📧 Email: dev@jobsight.co
- 📚 Documentation: [help.jobsight.co](https://help.jobsight.co)
- 🐛 Bug Reports: GitHub Issues
