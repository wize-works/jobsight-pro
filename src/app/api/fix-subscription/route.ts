import { createServerClient } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const supabase = createServerClient();

        if (!supabase) {
            return NextResponse.json({ error: "Database connection failed" }, { status: 500 });
        }

        // Update all personal subscriptions to pro for development
        const { data, error } = await supabase
            .from('business_subscriptions')
            .update({ plan_id: 'pro' })
            .eq('plan_id', 'personal')
            .eq('status', 'active');

        if (error) {
            console.error('Error updating subscriptions:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        console.log('✅ Updated subscriptions to pro plan:', data);

        return NextResponse.json({
            success: true,
            message: 'Subscriptions updated to pro plan',
            updated: data
        });

    } catch (error) {
        console.error('Error in fix-subscription API:', error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
