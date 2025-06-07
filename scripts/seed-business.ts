import { createClient } from "@supabase/supabase-js"
import { v4 as uuidv4 } from "uuid"
import dotenv from "dotenv"

dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials")
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function seedBusinesses() {
    console.log("Seeding businesses...")

    // Create a business
    const businessId = uuidv4()
    const { error: businessError } = await supabase.from("businesses").insert({
        id: businessId,
        name: "Acme Construction",
        address: "123 Main Street",
        city: "Springfield",
        state: "CA",
        zip: "12345",
        country: "United States",
        phone: "(555) 123-4567",
        email: "info@acmeconstruction.com",
        website: "https://acmeconstruction.com",
        tax_id: "12-3456789",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    })

    if (businessError) {
        console.error("Error seeding business:", businessError)
        return
    }

    console.log(`Created business with ID: ${businessId}`)

    // Create a user (for testing)
    const userId = uuidv4()
    const { error: userError } = await supabase.auth.admin.createUser({
        email: "admin@acmeconstruction.com",
        password: "password123",
        email_confirm: true,
        user_metadata: {
            full_name: "John Doe",
            role: "Admin",
        },
    })

    if (userError) {
        console.error("Error creating user:", userError)
        return
    }

    console.log(`Created user with email: admin@acmeconstruction.com`)

    // Associate user with business
    const { error: userBusinessError } = await supabase.from("user_businesses").insert({
        id: uuidv4(),
        user_id: userId,
        business_id: businessId,
        role: "Admin",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    })

    if (userBusinessError) {
        console.error("Error associating user with business:", userBusinessError)
        return
    }

    console.log("Successfully seeded business data")
}

seedBusinesses()
    .catch(console.error)
    .finally(() => {
        process.exit(0)
    })
