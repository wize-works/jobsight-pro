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

async function seedUsers() {
    console.log("Seeding users...")

    // Create two businesses
    const business1Id = uuidv4()
    const business2Id = uuidv4()

    const { error: business1Error } = await supabase.from("businesses").insert({
        id: business1Id,
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

    if (business1Error) {
        console.error("Error seeding business 1:", business1Error)
        return
    }

    const { error: business2Error } = await supabase.from("businesses").insert({
        id: business2Id,
        name: "BuildRight Contractors",
        address: "456 Oak Avenue",
        city: "Riverdale",
        state: "NY",
        zip: "67890",
        country: "United States",
        phone: "(555) 987-6543",
        email: "info@buildright.com",
        website: "https://buildright.com",
        tax_id: "98-7654321",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    })

    if (business2Error) {
        console.error("Error seeding business 2:", business2Error)
        return
    }

    console.log(`Created businesses with IDs: ${business1Id} and ${business2Id}`)

    // Create users with the provided Kinde IDs
    const user1Id = uuidv4()
    const user2Id = uuidv4()

    const { error: user1Error } = await supabase.from("users").insert({
        id: user1Id,
        auth_id: "kp_ecd695ce489643809b28af7094ed80ad", // First provided Kinde ID
        business_id: business1Id,
        first_name: "John",
        last_name: "Doe",
        email: "john.doe@acmeconstruction.com",
        phone: "(555) 111-2222",
        role: "Admin",
        avatar_url: "/diverse-avatars.png",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    })

    if (user1Error) {
        console.error("Error creating user 1:", user1Error)
        return
    }

    const { error: user2Error } = await supabase.from("users").insert({
        id: user2Id,
        auth_id: "kp_a48db0a030564ea29c3c070875aef0bc", // Second provided Kinde ID
        business_id: business2Id,
        first_name: "Jane",
        last_name: "Smith",
        email: "jane.smith@buildright.com",
        phone: "(555) 333-4444",
        role: "Admin",
        avatar_url: "/diverse-avatars.png",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    })

    if (user2Error) {
        console.error("Error creating user 2:", user2Error)
        return
    }

    console.log(`Created users with IDs: ${user1Id} and ${user2Id}`)
    console.log("Successfully seeded users and businesses")
}

seedUsers()
    .catch(console.error)
    .finally(() => {
        process.exit(0)
    })
