# Email Notifications Setup Guide

## Overview
JobSight Pro now supports email notifications in addition to in-app notifications. Users can receive emails for project updates, task assignments, equipment alerts, invoice updates, and system announcements based on their notification preferences.

## Setup Requirements

### 1. Environment Variables
Add the following environment variables to your `.env.local` file:

```bash
# Resend API Configuration
RESEND_API_KEY=your_resend_api_key_here
RESEND_FROM_EMAIL="JobSight Pro <notifications@yourdomain.com>"

# Application URL (for email links)
NEXT_PUBLIC_BASE_URL=https://yourdomain.com
```

### 2. Resend Account Setup
1. Sign up for a [Resend](https://resend.com) account
2. Verify your domain or use their sandbox domain for testing
3. Generate an API key from your Resend dashboard
4. Set up your "from" email address

### 3. Domain Verification (Production)
For production use, you'll need to:
1. Add your domain to Resend
2. Add the required DNS records (SPF, DKIM, DMARC)
3. Verify domain ownership

## Features

### 📧 **Email Notification Types**
- **Project Updates**: New projects, project changes, project deletions
- **Task Assignments**: Task creation, assignment, completion, updates
- **Equipment Alerts**: Equipment status changes, maintenance schedules, assignments
- **Invoice Updates**: Invoice creation, updates, payment status changes
- **System Announcements**: Important system-wide notifications

### 🎛️ **User Preferences**
- Global email notification toggle (enable/disable all emails)
- Per-notification-type email preferences
- In-app notification preferences remain independent
- Easy management through profile settings

### 🎨 **Email Templates**
- Responsive HTML email templates
- Branded design with business context
- Rich metadata display (project names, task details, etc.)
- Direct action links to relevant pages
- Unsubscribe/preference management links

## Implementation Details

### Core Functions

#### `createNotificationWithEmail()`
Creates both in-app and email notifications:
```typescript
await createNotificationWithEmail(
    businessId, 
    notificationData, 
    true, // Send email
    triggeredByUserId, // Exclude from notifications
    "Your Business Name" // For email branding
);
```

#### `sendBulkEmailNotifications()`
Handles bulk email sending with preference checking:
- Filters users by email preferences
- Respects global and type-specific settings
- Handles failures gracefully
- Returns detailed statistics

### Email Template System
Located in `src/components/email-templates/`:
- `general-notification.tsx` - Main notification template
- Includes business branding and metadata
- Responsive design for all devices
- Customizable per notification type

## User Experience

### Profile Settings
Users can manage email preferences in `/dashboard/profile`:
1. **Global Email Toggle**: Master switch for all email notifications
2. **Type-Specific Settings**: Control emails per notification type
3. **Test Notifications**: Send test emails to verify settings
4. **Real-time Updates**: Changes apply immediately

### Email Content
Each email includes:
- Clear notification type and priority
- Relevant business context (project names, task details, etc.)
- Direct link to view full details in the app
- Preference management link
- Professional branding

## Testing

### Test Notifications
Users can send test emails from their profile settings:
```typescript
// From the profile page
await sendTestNotification(notificationType);
```

### Development Testing
Use Resend's sandbox domain for development:
- No domain verification required
- Test with real email addresses
- All emails marked as test

## Security & Privacy

### Data Protection
- Email addresses are only used for notifications
- Users control their own notification preferences
- No third-party tracking in emails
- Secure API key handling

### Spam Prevention
- Users must explicitly enable email notifications
- Easy unsubscribe mechanism
- Rate limiting on email sending
- Professional sender reputation via Resend

## Troubleshooting

### Common Issues

1. **Emails not sending**
   - Check RESEND_API_KEY is set correctly
   - Verify domain setup in Resend dashboard
   - Check user has email notifications enabled

2. **Emails going to spam**
   - Ensure proper domain verification
   - Add SPF, DKIM, and DMARC records
   - Use professional "from" email address

3. **Template rendering issues**
   - Verify React email templates compile correctly
   - Check for missing environment variables
   - Review email client compatibility

### Debug Mode
Enable detailed logging by checking browser console for:
- Email sending attempts
- User preference filtering
- API responses from Resend

## Performance Considerations

### Optimization
- Bulk email sending with Promise.all()
- Preference checking to avoid unnecessary sends
- Error isolation (email failures don't break app notifications)
- Efficient user filtering

### Rate Limits
- Resend has generous rate limits (1000/day free tier)
- Bulk operations are optimized for efficiency
- Failed emails are logged but don't retry automatically

## Future Enhancements

### Planned Features
- Email notification digest (daily/weekly summaries)
- Advanced email templates per notification type
- Email analytics and open/click tracking
- Integration with other email providers
- SMS notifications option

### Customization Options
- Business-specific email branding
- Custom email templates
- Notification scheduling and grouping
- Advanced filtering and routing

---

## Quick Start Checklist

✅ **Setup Steps:**
1. [ ] Sign up for Resend account
2. [ ] Add environment variables to `.env.local`
3. [ ] Configure domain (if using custom domain)
4. [ ] Test with sandbox domain
5. [ ] Enable user email preferences
6. [ ] Send test notifications
7. [ ] Monitor email delivery and user feedback

The email notification system is now fully integrated and ready for production use!
