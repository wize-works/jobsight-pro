"use server"
import { createBusiness } from "@/app/actions/business"
import { createServerClient } from "@/lib/supabase"

type CreateBusinessParams = {
    userId: string // This should be the database UUID, not the Kinde ID
    businessName: string
    businessType: string
    phoneNumber?: string
    website?: string
    address?: string
    city?: string
    state?: string
    zipCode?: string
    country?: string
    email?: string
}

// Re-export the createBusiness function to maintain compatibility
export { createBusiness }

export async function acceptInvitation(
    invitedUserId: string,
    kindeAuthId: string,
    email: string
) {
    try {
        const supabase = createServerClient();

        // First, verify the invited user exists and has the correct email
        const { data: invitedUser, error: fetchError } = await supabase
            .from("users")
            .select("*")
            .eq("id", invitedUserId)
            .eq("email", email)
            .eq("status", "invited")
            .single();

        if (fetchError || !invitedUser) {
            return {
                success: false,
                error: "Invalid invitation or user not found"
            };
        }

        // Check if this Kinde auth_id is already in use by another user
        const { data: existingUser } = await supabase
            .from("users")
            .select("id")
            .eq("auth_id", kindeAuthId)
            .neq("id", invitedUserId)
            .single();

        if (existingUser) {
            return {
                success: false,
                error: "This account is already associated with another user"
            };
        }

        // Update the invited user record with the real Kinde auth_id and set status to active
        const { error: updateError } = await supabase
            .from("users")
            .update({
                auth_id: kindeAuthId,
                status: "active",
                updated_at: new Date().toISOString()
            })
            .eq("id", invitedUserId);

        if (updateError) {
            console.error("Error updating user:", updateError);
            return {
                success: false,
                error: "Failed to update user record"
            };
        }

        return {
            success: true,
            message: "Invitation accepted successfully"
        };

    } catch (error) {
        console.error("Error accepting invitation:", error);
        return {
            success: false,
            error: "Failed to accept invitation"
        };
    }
}
