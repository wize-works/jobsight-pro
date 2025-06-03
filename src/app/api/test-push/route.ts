
import { NextRequest, NextResponse } from 'next/server';
import { sendPushNotificationToBusiness } from '@/lib/push/actions';
import { withBusinessServer } from '@/lib/auth/with-business-server';

export async function POST(request: NextRequest) {
    try {
        await withBusinessServer(); // Ensure user is authenticated
        
        const { title, body, url } = await request.json();
        
        const result = await sendPushNotificationToBusiness(
            title || 'Test Notification',
            body || 'This is a test push notification from JobSight Pro',
            {},
            url || '/dashboard'
        );
        
        return NextResponse.json(result);
    } catch (error) {
        console.error('Error sending test push notification:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to send test notification' },
            { status: 500 }
        );
    }
}
