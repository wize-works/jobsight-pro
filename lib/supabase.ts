import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"

// Singleton pattern for browser client
// let supabaseBrowserClient: ReturnType<typeof createClient<Database>> | null = null

// export function getSupabaseBrowserClient() {
//     if (!supabaseBrowserClient && typeof window !== "undefined") {
//         const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
//         const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

//         if (!supabaseUrl || !supabaseAnonKey) {
//             console.error("Supabase URL or Anon Key is missing")
//             return null
//         }

//         supabaseBrowserClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
//             auth: {
//                 persistSession: true,
//             },
//         })
//     }

//     return supabaseBrowserClient
// }

// Server-side client
export function createServerClient() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
        console.error("Supabase URL or Service Role Key is missing")
        return null
    }

    return createClient<Database>(supabaseUrl, supabaseServiceKey, {
        auth: {
            persistSession: false,
        },
    })
}
