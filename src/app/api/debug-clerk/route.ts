// Temporary debug endpoint - DELETE AFTER DEBUGGING
import { NextResponse } from 'next/server';

export async function GET() {
    const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
    const secretKey = process.env.CLERK_SECRET_KEY;
    
    return NextResponse.json({
        publishableKey: publishableKey ? `${publishableKey.substring(0, 20)}...` : 'MISSING',
        publishableKeyLength: publishableKey?.length || 0,
        secretKeyLength: secretKey?.length || 0,
        nodeEnv: process.env.NODE_ENV,
        hasValidPublishableKey: publishableKey?.startsWith('pk_') || false,
        hasValidSecretKey: secretKey?.startsWith('sk_') || false,
    });
}
