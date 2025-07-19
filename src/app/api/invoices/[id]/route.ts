import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { fetchByBusiness } from "@/lib/db";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const supabase = createServerClient();

        if (!supabase) {
            return NextResponse.json(
                { success: false, error: "Authentication required" },
                { status: 401 }
            );
        }

        // Get user and business
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json(
                { success: false, error: "Authentication required" },
                { status: 401 }
            );
        }

        // Get business ID from user's metadata or session
        const businessId = user.user_metadata?.business_id;
        if (!businessId) {
            return NextResponse.json(
                { success: false, error: "Business not found" },
                { status: 404 }
            );
        }

        // Fetch the specific invoice by ID
        const { data: invoices, error } = await fetchByBusiness("invoices", businessId, "*", {
            client: supabase
        });

        if (error) {
            console.error("Error fetching invoice:", error);
            return NextResponse.json(
                { success: false, error: "Failed to fetch invoice" },
                { status: 500 }
            );
        }

        // Find the specific invoice
        const invoice = invoices?.find(inv => inv.id === id);

        if (!invoice) {
            return NextResponse.json(
                { success: false, error: "Invoice not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: invoice
        });

    } catch (error) {
        console.error("API Error:", error);
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}
