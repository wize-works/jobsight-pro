import { NextResponse } from 'next/server'
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server"
import { getUserBusiness } from "@/app/actions/business"

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
        return NextResponse.json({ success: false, error: 'User ID is required' })
    }

    try {
        const businessResponse = await getUserBusiness(userId)

        // If there's an authentication error
        if ('success' in businessResponse && !businessResponse.success) {
            return NextResponse.json({
                success: false,
                error: businessResponse.error
            })
        }

        // If user has no business
        if (!businessResponse || !('id' in businessResponse)) {
            return NextResponse.json({
                success: true,
                hasBusiness: false
            })
        }

        return NextResponse.json({
            success: true,
            hasBusiness: true,
            business: businessResponse
        })
    } catch (error) {
        console.error('Error in business check:', error)
        return NextResponse.json({
            success: false,
            error: 'Failed to verify business access'
        })
    }
}
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get("userId");

        if (!userId) {
            return NextResponse.json({ success: false, error: "User ID required" }, { status: 400 });
        }

        const supabase = createServerClient();
        
        // Check if user exists and has a business
        const { data: userData, error: userError } = await supabase
            .from("users")
            .select("business_id")
            .eq("auth_id", userId)
            .single();

        if (userError && userError.code !== 'PGRST116') {
            console.error("Error checking user business:", userError);
            return NextResponse.json({ success: false, error: "Database error" }, { status: 500 });
        }

        const hasBusiness = userData?.business_id ? true : false;

        return NextResponse.json({ 
            success: true, 
            hasBusiness,
            businessId: userData?.business_id || null 
        });

    } catch (error) {
        console.error("Error in business check API:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}
