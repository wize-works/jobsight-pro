import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"

// Server-side client for database operations only (no auth, no realtime)
export function createServerClient() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
        console.error("Supabase URL or Service Role Key is missing")
        return null
    }

    // Minimal configuration for database-only operations
    return createClient<Database>(supabaseUrl, supabaseServiceKey, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false,
        },
        global: {
            headers: {
                'x-application-name': 'jobsight-pro',
            },
        },
    })
}
