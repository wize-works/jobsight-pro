import { NextRequest, NextResponse } from 'next/server';
import { getSubscriptionPlansServer } from '@/lib/subscriptions/server';

export async function GET(request: NextRequest) {
    try {
        console.log('API: Fetching subscription plans');

        const plans = await getSubscriptionPlansServer();

        return NextResponse.json({
            success: true,
            plans
        });
    } catch (error) {
        console.error('API Error fetching subscription plans:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to fetch subscription plans'
            },
            { status: 500 }
        );
    }
}
