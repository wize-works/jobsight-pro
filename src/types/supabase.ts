export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
    public: {
        Tables: {
            businesses: {
                Row: {
                    id: string
                    address: string | null
                    business_type: string | null // Added this line
                    city: string | null
                    state: string | null
                    zip: string | null
                    country: string | null
                    email: string | null
                    name: string | null
                    website: string | null
                    logo_url: string | null
                    phone: string | null
                    tax_id: string | null
                    updated_at: string | null
                    updated_by: string | null
                    created_at: string
                    created_by: string | null
                }
                Insert: {
                    id: string
                    address: string | null
                    business_type: string | null // Added this line
                    city: string | null
                    state: string | null
                    zip: string | null
                    country: string | null
                    email: string | null
                    name: string | null
                    website: string | null
                    logo_url: string | null
                    phone: string | null
                    tax_id: string | null
                    updated_at: string | null
                    updated_by: string | null
                    created_at: string
                    created_by: string | null
                }
                Update: {
                    id: string
                    address: string | null
                    business_type: string | null // Added this line
                    city: string | null
                    state: string | null
                    zip: string | null
                    country: string | null
                    email: string | null
                    name: string | null
                    website: string | null
                    logo_url: string | null
                    phone: string | null
                    tax_id: string | null
                    updated_at: string | null
                    updated_by: string | null
                    created_at: string
                    created_by: string | null
                }
                Relationships: []
            }

            business_subscriptions: {
                Row: {
                    id: string
                    business_id: string
                    plan_id: string
                    start_date: string | null
                    end_date: string | null
                    status: string | null
                    created_at: string | null
                    created_by: string | null
                    updated_at: string | null
                    updated_by: string | null
                    stripe_subscription_id: string | null // <-- Add this
                    stripe_invoice_id: string | null // <-- Optional
                    stripe_customer_id: string | null // <-- Optional
                }
                Insert: {
                    id: string
                    business_id: string
                    plan_id: string
                    start_date: string | null
                    end_date: string | null
                    status: string | null
                    created_at: string | null
                    created_by: string | null
                    updated_at: string | null
                    updated_by: string | null
                    stripe_subscription_id?: string | null // <-- Add this
                    stripe_invoice_id?: string | null // <-- Optional
                    stripe_customer_id?: string | null // <-- Optional
                }
                Update: {
                    id: string
                    business_id: string
                    plan_id: string
                    start_date: string | null
                    end_date: string | null
                    status: string | null
                    created_at: string | null
                    created_by: string | null
                    updated_at: string | null
                    updated_by: string | null
                    stripe_subscription_id?: string | null // <-- Add this
                    stripe_invoice_id?: string | null // <-- Optional
                    stripe_customer_id?: string | null // <-- Optional
                }
                Relationships: [
                    {
                        foreignKeyName: "business_subscriptions_business_id_fkey"
                        columns: ["business_id"]
                        referencedRelation: "businesses"
                        referencedColumns: ["id"]
                    },
                ]
            }
            stripe_customers: {
                Row: {
                    id: string
                    business_id: string
                    stripe_customer_id: string
                    created_at: string | null
                }
                Insert: {
                    id: string
                    business_id: string
                    stripe_customer_id: string
                    created_at?: string | null
                }
                Update: {
                    id?: string
                    business_id?: string
                    stripe_customer_id?: string
                    created_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "stripe_customers_business_id_fkey"
                        columns: ["business_id"]
                        referencedRelation: "businesses"
                        referencedColumns: ["id"]
                    }
                ]
            }

            stripe_subscriptions: {
                Row: {
                    id: string
                    business_id: string
                    stripe_subscription_id: string
                    plan_id: string | null
                    status: string | null
                    current_period_start: string | null
                    current_period_end: string | null
                    cancel_at_period_end: boolean | null
                    canceled_at: string | null
                    created_at: string | null
                    updated_at: string | null
                }
                Insert: {
                    id: string
                    business_id: string
                    stripe_subscription_id: string
                    plan_id?: string | null
                    status?: string | null
                    current_period_start?: string | null
                    current_period_end?: string | null
                    cancel_at_period_end?: boolean | null
                    canceled_at?: string | null
                    created_at?: string | null
                    updated_at?: string | null
                }
                Update: {
                    id?: string
                    business_id?: string
                    stripe_subscription_id?: string
                    plan_id?: string | null
                    status?: string | null
                    current_period_start?: string | null
                    current_period_end?: string | null
                    cancel_at_period_end?: boolean | null
                    canceled_at?: string | null
                    created_at?: string | null
                    updated_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "stripe_subscriptions_business_id_fkey"
                        columns: ["business_id"]
                        referencedRelation: "businesses"
                        referencedColumns: ["id"]
                    }
                ]
            }

            stripe_invoices: {
                Row: {
                    id: string
                    business_id: string
                    stripe_invoice_id: string
                    amount_due: number | null
                    amount_paid: number | null
                    status: string | null
                    due_date: string | null
                    paid_at: string | null
                    created_at: string | null
                }
                Insert: {
                    id: string
                    business_id: string
                    stripe_invoice_id: string
                    amount_due?: number | null
                    amount_paid?: number | null
                    status?: string | null
                    due_date?: string | null
                    paid_at?: string | null
                    created_at?: string | null
                }
                Update: {
                    id?: string
                    business_id?: string
                    stripe_invoice_id?: string
                    amount_due?: number | null
                    amount_paid?: number | null
                    status?: string | null
                    due_date?: string | null
                    paid_at?: string | null
                    created_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "stripe_invoices_business_id_fkey"
                        columns: ["business_id"]
                        referencedRelation: "businesses"
                        referencedColumns: ["id"]
                    }
                ]
            }

            stripe_payment_events: {
                Row: {
                    id: string
                    business_id: string
                    event_id: string
                    event_type: string
                    data: Json | null
                    created_at: string | null
                }
                Insert: {
                    id: string
                    business_id: string
                    event_id: string
                    event_type: string
                    data?: Json | null
                    created_at?: string | null
                }
                Update: {
                    id?: string
                    business_id?: string
                    event_id?: string
                    event_type?: string
                    data?: Json | null
                    created_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "stripe_payment_events_business_id_fkey"
                        columns: ["business_id"]
                        referencedRelation: "businesses"
                        referencedColumns: ["id"]
                    }
                ]
            }
            client_contacts: {
                Row: {
                    id: string
                    client_id: string | null
                    business_id: string
                    name: string | null
                    title: string | null
                    phone: string | null
                    email: string | null
                    is_primary: boolean | null
                    created_at: string
                    created_by: string | null
                    updated_at: string | null
                    updated_by: string | null
                }
                Insert: {
                    id: string
                    client_id: string | null
                    business_id: string
                    name: string | null
                    title: string | null
                    phone: string | null
                    email: string | null
                    is_primary: boolean | null
                    created_at: string
                    created_by: string | null
                    updated_at: string | null
                    updated_by: string | null
                }
                Update: {
                    id: string
                    client_id: string | null
                    business_id: string
                    name: string | null
                    title: string | null
                    phone: string | null
                    email: string | null
                    is_primary: boolean | null
                    created_at: string
                    created_by: string | null
                    updated_at: string | null
                    updated_by: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "client_contacts_client_id_fkey"
                        columns: ["client_id"]
                        referencedRelation: "clients"
                        referencedColumns: ["id"]
                    },
                ]
            }
            client_interactions: {
                Row: {
                    id: string
                    client_id: string | null
                    business_id: string
                    date: string | null
                    type: string | null
                    staff: string | null
                    summary: string | null
                    follow_up_date: string | null
                    follow_up_task: string | null
                    updated_at: string | null
                    updated_by: string | null
                    created_at: string
                    created_by: string | null
                }
                Insert: {
                    id: string
                    client_id: string | null
                    business_id: string
                    date: string | null
                    type: string | null
                    staff: string | null
                    summary: string | null
                    follow_up_date: string | null
                    follow_up_task: string | null
                    updated_at: string | null
                    updated_by: string | null
                    created_at: string
                    created_by: string | null
                }
                Update: {
                    id: string
                    client_id: string | null
                    business_id: string
                    date: string | null
                    type: string | null
                    staff: string | null
                    summary: string | null
                    follow_up_date: string | null
                    follow_up_task: string | null
                    updated_at: string | null
                    updated_by: string | null
                    created_at: string
                    created_by: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "client_interactions_client_id_fkey"
                        columns: ["client_id"]
                        referencedRelation: "clients"
                        referencedColumns: ["id"]
                    },
                ]
            }
            clients: {
                Row: {
                    id: string
                    business_id: string
                    name: string
                    type: string | null
                    address: string | null
                    city: string | null
                    state: string | null
                    zip: string | null
                    country: string | null
                    contact_email: string | null
                    contact_name: string | null
                    contact_phone: string | null
                    logo_url: string | null
                    status: string | null
                    website: string | null
                    industry: string | null
                    tax_id: string | null
                    notes: string | null
                    created_at: string | null
                    created_by: string | null
                    updated_at: string | null
                    updated_by: string | null
                }
                Insert: {
                    id: string
                    business_id: string
                    name: string
                    type: string | null
                    address: string | null
                    city: string | null
                    state: string | null
                    zip: string | null
                    country: string | null
                    contact_email: string | null
                    contact_name: string | null
                    contact_phone: string | null
                    logo_url: string | null
                    status: string | null
                    website: string | null
                    industry: string | null
                    tax_id: string | null
                    notes: string | null
                    created_at: string | null
                    created_by: string | null
                    updated_at: string | null
                    updated_by: string | null
                }
                Update: {
                    id: string
                    business_id: string
                    name: string
                    type: string | null
                    address: string | null
                    city: string | null
                    state: string | null
                    zip: string | null
                    country: string | null
                    contact_email: string | null
                    contact_name: string | null
                    contact_phone: string | null
                    logo_url: string | null
                    status: string | null
                    website: string | null
                    industry: string | null
                    tax_id: string | null
                    notes: string | null
                    created_at: string | null
                    created_by: string | null
                    updated_at: string | null
                    updated_by: string | null
                }
                Relationships: []
            }
            crews: {
                Row: {
                    id: string
                    business_id: string
                    leader_id: string | null
                    //certifications: string[] | null //add back later
                    name: string
                    specialty: string | null
                    status: string | null
                    notes: string | null
                    created_by: string | null
                    created_at: string | null
                    updated_by: string | null
                    updated_at: string | null
                }
                Insert: {
                    id: string
                    business_id: string
                    leader_id: string | null
                    //certifications: string[] | null //add back later
                    name: string
                    specialty: string | null
                    status: string | null
                    notes: string | null
                    created_by: string | null
                    created_at: string | null
                    updated_by: string | null
                    updated_at: string | null
                }
                Update: {
                    id: string
                    business_id: string
                    leader_id: string | null
                    //certifications: string[] | null //add back later
                    name: string
                    specialty: string | null
                    status: string | null
                    notes: string | null
                    created_by: string | null
                    created_at: string | null
                    updated_by: string | null
                    updated_at: string | null
                }
                Relationships: []
            }
            crew_members: {
                Row: {
                    id: string
                    business_id: string
                    name: string
                    phone: string | null
                    email: string | null
                    avatar_url: string | null
                    role: string | null
                    experience: number | null
                    status: string | null
                    notes: string | null
                    created_at: string | null
                    updated_at: string | null
                    created_by: string | null
                    updated_by: string | null
                }
                Insert: {
                    id: string
                    business_id: string
                    name: string
                    phone: string | null
                    email: string | null
                    avatar_url: string | null
                    role: string | null
                    experience: number | null
                    status: string | null
                    notes: string | null
                    created_at: string | null
                    updated_at: string | null
                    created_by: string | null
                    updated_by: string | null
                }
                Update: {
                    id: string
                    business_id: string
                    name: string
                    phone: string | null
                    email: string | null
                    avatar_url: string | null
                    role: string | null
                    experience: number | null
                    status: string | null
                    notes: string | null
                    created_at: string | null
                    updated_at: string | null
                    created_by: string | null
                    updated_by: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "crew_usiness_id_fkey"
                        columns: ["business_id"]
                        referencedRelation: "businesses"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "crew_leader_id_fkey"
                        columns: ["leader_id"]
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "crew_updated_by_fkey"
                        columns: ["updated_by"]
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "crew_created_by_fkey"
                        columns: ["created_by"]
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                ]
            }

            crew_member_assignments: {
                Row: {
                    id: string
                    business_id: string
                    crew_id: string
                    crew_member_id: string
                    created_at: string
                    created_by: string | null
                    updated_at: string | null
                    updated_by: string | null
                }
                Insert: {
                    id: string
                    business_id: string
                    crew_id: string
                    crew_member_id: string
                    created_at: string
                    created_by?: string | null
                    updated_at?: string | null
                    updated_by?: string | null
                }
                Update: {
                    id?: string
                    business_id?: string
                    crew_id?: string
                    crew_member_id?: string
                    created_at?: string
                    created_by?: string | null
                    updated_at?: string | null
                    updated_by?: string | null
                }
            }

            daily_logs: {
                Row: {
                    id: string
                    author_id: string
                    business_id: string
                    project_id: string
                    crew_id: string
                    date: string
                    start_time: string
                    end_time: string
                    work_planned: string
                    work_completed: string
                    hours_worked: number
                    overtime: number
                    notes: string | null
                    safety: string | null
                    quality: string | null
                    delays: string | null
                    weather: string | null
                    created_at: string | null
                    created_by: string | null
                    updated_at: string | null
                    updated_by: string | null
                }
                Insert: {
                    id: string
                    author_id: string
                    business_id: string
                    project_id: string
                    crew_id: string
                    date: string
                    start_time: string
                    end_time: string
                    work_planned: string
                    work_completed: string
                    hours_worked: number
                    overtime: number
                    notes: string | null
                    safety: string | null
                    quality: string | null
                    delays: string | null
                    weather: string | null
                    created_at: string | null
                    created_by: string | null
                    updated_at: string | null
                    updated_by: string | null
                }
                Update: {
                    id: string
                    author_id: string
                    business_id: string
                    project_id: string
                    crew_id: string
                    date: string
                    start_time: string
                    end_time: string
                    work_planned: string
                    work_completed: string
                    hours_worked: number
                    overtime: number
                    notes: string | null
                    safety: string | null
                    quality: string | null
                    delays: string | null
                    weather: string | null
                    created_at: string | null
                    created_by: string | null
                    updated_at: string | null
                    updated_by: string | null
                }
                Relationships: []
            }
            daily_log_equipment: {
                Row: {
                    id: string
                    daily_log_id: string
                    equipment_id: string
                    business_id: string
                    crew_member_id: string | null
                    name: string | null
                    operator: string | null
                    hours: number | null
                    condition: string | null
                    created_at: string | null
                    created_by: string | null
                    updated_at: string | null
                    updated_by: string | null
                }
                Insert: {
                    id: string
                    daily_log_id: string
                    equipment_id: string
                    business_id: string
                    crew_member_id: string | null
                    name: string | null
                    operator: string | null
                    hours: number | null
                    condition: string | null
                    created_at: string | null
                    created_by: string | null
                    updated_at: string | null
                    updated_by: string | null
                }
                Update: {
                    id: string
                    daily_log_id: string
                    equipment_id: string
                    business_id: string
                    crew_member_id: string | null
                    name: string | null
                    operator: string | null
                    hours: number | null
                    condition: string | null
                    created_at: string | null
                    created_by: string | null
                    updated_at: string | null
                    updated_by: string | null
                }
                relationships: []
            }
            daily_log_images: {
                Row: {
                    id: string
                    daily_log_id: string
                    business_id: string
                    media_id: string | null
                    url: string | null
                    caption: string | null
                    created_at: string | null
                    created_by: string | null
                    updated_at: string | null
                    updated_by: string | null
                }
                Insert: {
                    id: string
                    daily_log_id: string
                    business_id: string
                    media_id: string | null
                    url: string | null
                    caption: string | null
                    created_at: string | null
                    created_by: string | null
                    updated_at: string | null
                    updated_by: string | null
                }
                Update: {
                    id: string
                    daily_log_id: string
                    business_id: string
                    media_id: string | null
                    url: string | null
                    caption: string | null
                    created_at: string | null
                    created_by: string | null
                    updated_at: string | null
                    updated_by: string | null
                }
                Relationships: []
            }
            daily_log_materials: {
                Row: {
                    id: string
                    daily_log_id: string
                    business_id: string
                    name: string
                    quantity: number | null
                    cost: number | null
                    supplier: string | null
                    notes: string | null
                    created_at: string | null
                    created_by: string | null
                    updated_at: string | null
                    updated_by: string | null
                }
                Insert: {
                    id: string
                    daily_log_id: string
                    business_id: string
                    name: string
                    quantity: number | null
                    cost: number | null
                    supplier: string | null
                    notes: string | null
                    created_at: string | null
                    created_by: string | null
                    updated_at: string | null
                    updated_by: string | null
                }
                Update: {
                    id: string
                    daily_log_id: string
                    business_id: string
                    name: string
                    quantity: number | null
                    cost: number | null
                    supplier: string | null
                    notes: string | null
                    created_at: string | null
                    created_by: string | null
                    updated_at: string | null
                    updated_by: string | null
                }
                Relationships: []
            }
            documents: {
                Row: {
                    id: string
                    business_id: string
                    project_id: string | null
                    name: string
                    type: string | null
                    url: string | null
                    media_id: string | null
                    size: number | null
                    created_at: string | null
                    created_by: string | null
                    updated_at: string | null
                    updated_by: string | null
                }
                Insert: {
                    id: string
                    business_id: string
                    project_id: string | null
                    name: string
                    type: string | null
                    url: string | null
                    media_id: string | null
                    size: number | null
                    created_at: string | null
                    created_by: string | null
                    updated_at: string | null
                    updated_by: string | null
                }
                Update: {
                    id: string
                    business_id: string
                    project_id: string | null
                    name: string
                    type: string | null
                    url: string | null
                    media_id: string | null
                    size: number | null
                    created_at: string | null
                    created_by: string | null
                    updated_at: string | null
                    updated_by: string | null
                }
                Relationships: []
            }
            equipment: {
                Row: {
                    id: string
                    business_id: string
                    name: string
                    type: string | null
                    make: string | null
                    model: string | null
                    year: number | null
                    serial_number: string | null
                    status: string | null
                    purchase_date: string | null
                    purchase_price: number | null
                    current_value: number | null
                    location: string | null
                    next_maintenance: string | null
                    description: string | null
                    image_url: string | null
                    created_at: string
                    created_by: string
                    updated_at: string
                    updated_by: string
                }
                Insert: {
                    id: string
                    business_id: string
                    name: string
                    type: string | null
                    make: string | null
                    model: string | null
                    year: number | null
                    serial_number: string | null
                    status: string | null
                    purchase_date: string | null
                    purchase_price: number | null
                    current_value: number | null
                    location: string | null
                    next_maintenance: string | null
                    description: string | null
                    image_url: string | null
                    created_at: string
                    created_by: string
                    updated_at: string
                    updated_by: string
                }
                Update: {
                    id: string
                    business_id: string
                    name: string
                    type: string | null
                    make: string | null
                    model: string | null
                    year: number | null
                    serial_number: string | null
                    status: string | null
                    purchase_date: string | null
                    purchase_price: number | null
                    current_value: number | null
                    location: string | null
                    next_maintenance: string | null
                    description: string | null
                    image_url: string | null
                    created_at: string
                    created_by: string
                    updated_at: string
                    updated_by: string
                }
                Relationships: []
            }
            equipment_assignments: {
                Row: {
                    id: string
                    equipment_id: string
                    business_id: string
                    crew_id: string
                    project_id: string
                    assigned_by: string | null
                    start_date: string
                    end_date: string | null
                    status: string | null
                    notes: string | null
                    created_at: string
                    created_by: string | null
                    updated_at: string | null
                    updated_by: string | null
                }
                Insert: {
                    id: string
                    equipment_id: string
                    business_id: string
                    crew_id: string
                    project_id: string
                    assigned_by: string | null
                    start_date: string
                    end_date: string | null
                    status: string | null
                    notes: string | null
                    created_at: string
                    created_by: string | null
                    updated_at: string | null
                    updated_by: string | null
                }
                Update: {
                    id: string
                    equipment_id: string
                    business_id: string
                    crew_id: string
                    project_id: string
                    assigned_by: string | null
                    start_date: string
                    end_date: string | null
                    status: string | null
                    notes: string | null
                    created_at: string
                    created_by: string | null
                    updated_at: string | null
                    updated_by: string | null
                }
                Relationships: []
            }
            equipment_maintenance: {
                Row: {
                    id: string
                    equipment_id: string
                    business_id: string
                    maintenance_date: string | null
                    maintenance_type: string | null
                    maintenance_status: string | null
                    description: string | null
                    technician: string | null
                    cost: number | null
                    date: string | null
                    notes: string | null
                    created_at: string
                    created_by: string | null
                    updated_at: string | null
                    updated_by: string | null
                }
                Insert: {
                    id: string
                    equipment_id: string
                    business_id: string
                    maintenance_date: string | null
                    maintenance_type: string | null
                    maintenance_status: string | null
                    description: string | null
                    technician: string | null
                    cost: number | null
                    date: string | null
                    notes: string | null
                    created_at: string
                    created_by: string | null
                    updated_at: string | null
                    updated_by: string | null
                }
                Update: {
                    id: string
                    equipment_id: string
                    business_id: string
                    maintenance_date: string | null
                    maintenance_type: string | null
                    maintenance_status: string | null
                    description: string | null
                    technician: string | null
                    cost: number | null
                    date: string | null
                    notes: string | null
                    created_at: string
                    created_by: string | null
                    updated_at: string | null
                    updated_by: string | null
                }
            }

            equipment_specifications: {
                Row: {
                    id: string
                    equipment_id: string
                    business_id: string
                    name: string
                    value: string | null
                    created_at: string
                    created_by: string | null
                    updated_at: string | null
                    updated_by: string | null
                }
                Insert: {
                    id: string
                    equipment_id: string
                    business_id: string
                    name: string
                    value: string | null
                    created_at: string
                    created_by: string | null
                    updated_at: string | null
                    updated_by: string | null
                }
                Update: {
                    id: string
                    equipment_id: string
                    business_id: string
                    name: string
                    value: string | null
                    created_at: string
                    created_by: string | null
                    updated_at: string | null
                    updated_by: string | null
                }
            }

            equipment_usage: {
                Row: {
                    id: string
                    equipment_id: string
                    business_id: string
                    project_id: string | null
                    crew_id: string | null
                    start_date: string | null
                    end_date: string | null
                    hours_used: number | 0.0
                    fuel_consumed: number | 0.0
                    created_at: string
                    created_by: string | null
                    updated_at: string | null
                    updated_by: string | null
                }
                Insert: {
                    id: string
                    equipment_id: string
                    business_id: string
                    project_id: string | null
                    crew_id: string | null
                    start_date: string | null
                    end_date: string | null
                    hours_used: number | 0.0
                    fuel_consumed: number | 0.0
                    created_at: string
                    created_by: string | null
                    updated_at: string | null
                    updated_by: string | null
                }
                Update: {
                    id: string
                    equipment_id: string
                    business_id: string
                    project_id: string | null
                    crew_id: string | null
                    start_date: string | null
                    end_date: string | null
                    hours_used: number | 0.0
                    fuel_consumed: number | 0.0
                    created_at: string
                    created_by: string | null
                    updated_at: string | null
                    updated_by: string | null
                }
            }

            invoices: {
                Row: {
                    id: string
                    business_id: string
                    invoice_number: string
                    client_id: string
                    project_id: string
                    amount: number | null
                    tax_rate: number | null
                    status: string | null
                    issue_date: string | null
                    due_date: string | null
                    paid_date: string | null
                    payment_method: string | null
                    notes: string | null
                    created_at: string
                    created_by: string | null
                    updated_at: string | null
                    updated_by: string | null
                }
                Insert: {
                    id: string
                    business_id: string
                    invoice_number: string
                    client_id: string
                    project_id: string
                    amount: number | null
                    tax_rate: number | null
                    status: string | null
                    issue_date: string | null
                    due_date: string | null
                    paid_date: string | null
                    payment_method: string | null
                    notes: string | null
                    created_at: string
                    created_by: string | null
                    updated_at: string | null
                    updated_by: string | null
                }
                Update: {
                    id: string
                    business_id: string
                    invoice_number: string
                    client_id: string
                    project_id: string
                    amount: number | null
                    tax_rate: number | null
                    status: string | null
                    issue_date: string | null
                    due_date: string | null
                    paid_date: string | null
                    payment_method: string | null
                    notes: string | null
                    created_at: string
                    created_by: string | null
                    updated_at: string | null
                    updated_by: string | null
                }
                Relationships: []
            }

            invoice_items: {
                Row: {
                    id: string
                    invoice_id: string
                    business_id: string
                    description: string | null
                    quantity: number | null
                    unit_price: number | null
                    amount: number | null
                    tax_rate: number | null
                    tax_amount: number | null
                    total_price: number | null
                    created_at: string
                    created_by: string | null
                    updated_at: string | null
                    updated_by: string | null
                }
                Insert: {
                    id: string
                    invoice_id: string
                    business_id: string
                    description: string | null
                    quantity: number | null
                    unit_price: number | null
                    amount: number | null
                    tax_rate: number | null
                    tax_amount: number | null
                    total_price: number | null
                    created_at: string
                    created_by: string | null
                    updated_at: string | null
                    updated_by: string | null
                }
                Update: {
                    id: string
                    invoice_id: string
                    business_id: string
                    description: string | null
                    quantity: number | null
                    unit_price: number | null
                    amount: number | null
                    tax_rate: number | null
                    tax_amount: number | null
                    total_price: number | null
                    created_at: string
                    created_by: string | null
                    updated_at: string | null
                    updated_by: string | null
                }
            }

            media: {
                Row: {
                    id: string
                    business_id: string
                    project_id: string | null
                    url: string
                    name: string | null
                    description: string | null
                    type: string | null
                    size: number | null
                    uploaded_by: string | null
                    uploaded_at: string | null
                    created_at: string | null
                    created_by: string | null
                    updated_at: string | null
                    updated_by: string | null
                }
                Insert: {
                    id: string
                    business_id: string
                    project_id: string | null
                    url: string
                    name: string | null
                    description: string | null
                    type: string | null
                    size: number | null
                    uploaded_by: string | null
                    uploaded_at: string | null
                    created_at: string | null
                    created_by: string | null
                    updated_at: string | null
                    updated_by: string | null
                }
                Update: {
                    id: string
                    business_id: string
                    project_id: string | null
                    url: string
                    name: string | null
                    description: string | null
                    type: string | null
                    size: number | null
                    uploaded_by: string | null
                    uploaded_at: string | null
                    created_at: string | null
                    created_by: string | null
                    updated_at: string | null
                    updated_by: string | null
                }
            }

            media_links: {
                Row: {

                    id: string
                    business_id: string
                    media_id: string
                    linked_id: string
                    linked_type: string
                    created_at: string | null
                    created_by: string | null
                    updated_at: string | null
                    updated_by: string | null
                }
                Insert: {

                    id: string
                    business_id: string
                    media_id: string
                    linked_id: string
                    linked_type: string
                    created_at: string | null
                    created_by: string | null
                    updated_at: string | null
                    updated_by: string | null
                }
                Update: {

                    id: string
                    business_id: string
                    media_id: string
                    linked_id: string
                    linked_type: string
                    created_at: string | null
                    created_by: string | null
                    updated_at: string | null
                    updated_by: string | null
                }
            }

            media_metadata: {
                Row: {
                    id: string
                    business_id: string
                    media_id: string
                    key: string
                    value: string | null
                    created_at: string | null
                    created_by: string | null
                    updated_at: string | null
                    updated_by: string | null
                }
                Insert: {
                    id: string
                    media_id: string
                    business_id: string
                    key: string
                    value?: string | null
                    created_at?: string | null
                    created_by?: string | null
                    updated_at?: string | null
                    updated_by?: string | null
                }
                Update: {
                    id?: string
                    media_id?: string
                    business_id?: string
                    key?: string
                    value?: string | null
                    created_at?: string | null
                    created_by?: string | null
                    updated_at?: string | null
                    updated_by?: string | null
                }
            }

            media_tags: {
                Row: {
                    id: string
                    media_id: string
                    business_id: string
                    tag: string
                    created_at: string | null
                    created_by: string | null
                    updated_at: string | null
                    updated_by: string | null
                }
                Insert: {
                    id: string
                    media_id: string
                    business_id: string
                    tag: string
                    created_at?: string | null
                    created_by?: string | null
                    updated_at?: string | null
                    updated_by?: string | null
                }
                Update: {
                    id?: string
                    media_id?: string
                    business_id?: string
                    tag?: string
                    created_at?: string | null
                    created_by?: string | null
                    updated_at?: string | null
                    updated_by?: string | null
                }
            }

            projects: {
                Row: {
                    id: string
                    business_id: string
                    client_id: string
                    name: string
                    type: string | null
                    status: string | null
                    start_date: string | null
                    end_date: string | null
                    budget: number | null
                    location: string | null
                    description: string | null
                    manager_id: string | null
                    progress: number | null
                    created_by: string | null
                    created_at: string | null
                    updated_by: string | null
                    updated_at: string | null
                }
                Insert: {
                    id: string
                    business_id: string
                    client_id: string
                    name: string
                    type: string | null
                    status: string | null
                    start_date: string | null
                    end_date: string | null
                    budget: number | null
                    location: string | null
                    description: string | null
                    manager_id: string | null
                    progress: number | null
                    created_by: string | null
                    created_at: string | null
                    updated_by: string | null
                    updated_at: string | null
                }
                Update: {
                    id: string
                    business_id: string
                    client_id: string
                    name: string
                    type: string | null
                    status: string | null
                    start_date: string | null
                    end_date: string | null
                    budget: number | null
                    location: string | null
                    description: string | null
                    manager_id: string | null
                    progress: number | null
                    created_by: string | null
                    created_at: string | null
                    updated_by: string | null
                    updated_at: string | null
                }
                Relationships: []
            }
            project_crews: {
                Row: {
                    id: string
                    crew_id: string
                    project_id: string
                    business_id: string
                    start_date: string
                    end_date: string | null
                    notes: string | null
                    created_at: string
                    created_by: string | null
                    updated_at: string | null
                    updated_by: string | null
                }
                Insert: {
                    id: string
                    crew_id: string
                    project_id: string
                    business_id: string
                    start_date: string
                    end_date: string | null
                    notes: string | null
                    created_at: string
                    created_by: string | null
                    updated_at: string | null
                    updated_by: string | null
                }
                Update: {
                    id: string
                    crew_id: string
                    project_id: string
                    business_id: string
                    start_date: string
                    end_date: string | null
                    notes: string | null
                    created_at: string
                    created_by: string | null
                    updated_at: string | null
                    updated_by: string | null
                }
                Relationships: []
            }

            project_issues: {
                Row: {
                    id: string
                    project_id: string
                    business_id: string
                    title: string
                    description: string | null
                    status: string | null
                    priority: string | null
                    reported_date: string | null
                    reported_by: string | null
                    assigned_to: string | null
                    resolution: string | null
                    created_by: string | null
                    created_at: string | null
                    updated_by: string | null
                    updated_at: string | null
                }
                Insert: {
                    id: string
                    project_id: string
                    business_id: string
                    title: string
                    description: string | null
                    status: string | null
                    priority: string | null
                    reported_date: string | null
                    reported_by: string | null
                    assigned_to: string | null
                    resolution: string | null
                    created_by: string | null
                    created_at: string | null
                    updated_by: string | null
                    updated_at: string | null
                }
                Update: {
                    id: string
                    project_id: string
                    business_id: string
                    title: string
                    description: string | null
                    status: string | null
                    priority: string | null
                    reported_date: string | null
                    reported_by: string | null
                    assigned_to: string | null
                    resolution: string | null
                    created_by: string | null
                    created_at: string | null
                    updated_by: string | null
                    updated_at: string | null
                }
            }

            project_milestones: {
                Row: {
                    id: string
                    project_id: string
                    business_id: string
                    name: string
                    description: string | null
                    due_date: string | null
                    status: string | null
                    created_by: string | null
                    created_at: string | null
                    updated_by: string | null
                    updated_at: string | null
                }
                Insert: {
                    id: string
                    project_id: string
                    business_id: string
                    name: string
                    description?: string | null
                    due_date?: string | null
                    status?: string | null
                    created_by?: string | null
                    created_at?: string | null
                    updated_by?: string | null
                    updated_at?: string | null
                }
                Update: {
                    id?: string
                    project_id?: string
                    business_id?: string
                    name?: string
                    description?: string | null
                    due_date?: string | null
                    status?: string | null
                    created_by?: string | null
                    created_at?: string | null
                    updated_by?: string | null
                    updated_at?: string | null
                }
            }

            tasks: {
                Row: {
                    id: string
                    business_id: string
                    project_id: string
                    name: string
                    description: string | null
                    status: string | null
                    priority: string | null
                    start_date: string | null
                    end_date: string | null
                    assigned_to: string | null
                    progress: number | null
                    created_by: string | null
                    created_at: string | null
                    updated_by: string | null
                    updated_at: string | null
                }
                Insert: {
                    id: string
                    business_id: string
                    project_id: string
                    name: string
                    description: string | null
                    status: string | null
                    priority: string | null
                    start_date: string | null
                    end_date: string | null
                    assigned_to: string | null
                    progress: number | null
                    created_by: string | null
                    created_at: string | null
                    updated_by: string | null
                    updated_at: string | null
                }
                Update: {
                    id: string
                    business_id: string
                    project_id: string
                    name: string
                    description: string | null
                    status: string | null
                    priority: string | null
                    start_date: string | null
                    end_date: string | null
                    assigned_to: string | null
                    progress: number | null
                    created_by: string | null
                    created_at: string | null
                    updated_by: string | null
                    updated_at: string | null
                }
                Relationships: []
            }
            subtasks: {
                Row: {
                    id: string
                    task_id: string
                    business_id: string
                    name: string
                    description: string | null
                    status: string | null
                    priority: string | null
                    assigned_to: string | null
                    created_by: string | null
                    created_at: string | null
                    updated_by: string | null
                    updated_at: string | null
                }
                Insert: {
                    id: string
                    task_id: string
                    business_id: string
                    name: string
                    description: string | null
                    status: string | null
                    priority: string | null
                    assigned_to: string | null
                    created_by: string | null
                    created_at: string | null
                    updated_by: string | null
                    updated_at: string | null
                }
                Update: {
                    id: string
                    task_id: string
                    business_id: string
                    name: string
                    description: string | null
                    status: string | null
                    priority: string | null
                    assigned_to: string | null
                    created_by: string | null
                    created_at: string | null
                    updated_by: string | null
                    updated_at: string | null
                }
            }

            task_dependencies: {
                Row: {
                    id: string
                    task_id: string
                    business_id: string
                    dependency_on_task_id: string
                    dependency_type: string | null
                    created_at: string | null
                    created_by: string | null
                    updated_at: string | null
                    updated_by: string | null
                }
                Insert: {
                    id: string
                    task_id: string
                    business_id: string
                    dependency_on_task_id: string
                    dependency_type: string | null
                    created_at: string | null
                    created_by: string | null
                    updated_at: string | null
                    updated_by: string | null
                }
                Update: {
                    id: string
                    task_id: string
                    business_id: string
                    dependency_on_task_id: string
                    dependency_type: string | null
                    created_at: string | null
                    created_by: string | null
                    updated_at: string | null
                    updated_by: string | null
                }
                Relationships: []
            }

            task_notes: {
                Row: {
                    id: string
                    task_id: string
                    business_id: string
                    content: string | null
                    author_id: string | null
                    date: string | null
                    created_by: string | null
                    created_at: string | null
                    updated_by: string | null
                    updated_at: string | null
                }
                Insert: {
                    id: string
                    task_id: string
                    business_id: string
                    content: string | null
                    author_id: string | null
                    date: string | null
                    created_by: string | null
                    created_at: string | null
                    updated_by: string | null
                    updated_at: string | null
                }
                Update: {
                    id: string
                    task_id: string
                    business_id: string
                    content: string | null
                    author_id: string | null
                    date: string | null
                    created_by: string | null
                    created_at: string | null
                    updated_by: string | null
                    updated_at: string | null
                }
            }

            users: {
                Row: {
                    id: string
                    business_id: string | null
                    auth_id: string | null
                    first_name: string | null
                    last_name: string | null
                    email: string | null
                    phone: string | null
                    role: string | null
                    avatar_url: string | null
                    created_at: string | null
                    updated_at: string | null
                }
                Insert: {
                    auth_id?: string | null
                    avatar_url?: string | null
                    business_id?: string | null
                    created_at?: string | null
                    email?: string | null
                    first_name?: string | null
                    id: string
                    last_name?: string | null
                    phone?: string | null
                    role?: string | null
                    updated_at?: string | null
                }
                Update: {
                    auth_id?: string | null
                    avatar_url?: string | null
                    business_id?: string | null
                    created_at?: string | null
                    email?: string | null
                    first_name?: string | null
                    id?: string
                    last_name?: string | null
                    phone?: string | null
                    role?: string | null
                    updated_at?: string | null
                }
                Relationships: []
            }

            user_notification_preferences: {
                Row: {
                    id: string
                    user_id: string
                    business_id: string
                    email_enabled: boolean
                    push_enabled: boolean
                    in_app_enabled: boolean
                    created_at: string | null
                    updated_at: string | null
                    created_by: string | null
                    updated_by: string | null
                }
                Insert: {
                    id?: string
                    user_id: string
                    business_id?: string
                    email_enabled?: boolean
                    push_enabled?: boolean
                    in_app_enabled?: boolean
                    created_at?: string | null
                    updated_at?: string | null
                    created_by: string | null
                    updated_by: string | null
                }
                Update: {
                    id?: string
                    user_id?: string
                    business_id?: string
                    email_enabled?: boolean
                    push_enabled?: boolean
                    in_app_enabled?: boolean
                    created_at?: string | null
                    updated_at?: string | null
                    created_by: string | null
                    updated_by: string | null
                }
            }

            user_notification_type_preferences: {
                Row: {
                    id: string
                    user_id: string
                    business_id: string
                    notification_type: string
                    email_enabled: boolean
                    push_enabled: boolean
                    in_app_enabled: boolean
                    created_at: string | null
                    updated_at: string | null
                    created_by: string | null
                    updated_by: string | null
                }
                Insert: {
                    id?: string
                    user_id: string
                    business_id?: string
                    notification_type: string
                    email_enabled?: boolean
                    push_enabled?: boolean
                    in_app_enabled?: boolean
                    created_at?: string | null
                    updated_at?: string | null
                    created_by: string | null
                    updated_by: string | null
                }
                Update: {
                    id?: string
                    user_id?: string
                    business_id?: string
                    notification_type?: string
                    email_enabled?: boolean
                    push_enabled?: boolean
                    in_app_enabled?: boolean
                    created_at?: string | null
                    updated_at?: string | null
                    created_by: string | null
                    updated_by: string | null
                }
            }

            push_subscriptions: {
                Row: {
                    id: string
                    user_id: string
                    business_id: string
                    endpoint: string
                    p256dh: string
                    auth: string
                    user_agent: string | null
                    last_used_at: string | null
                    created_at: string | null
                    updated_at: string | null
                    created_by: string | null
                    updated_by: string | null
                }
                Insert: {
                    id?: string
                    user_id: string
                    business_id?: string
                    endpoint: string
                    p256dh: string
                    auth: string
                    user_agent: string | null
                    last_used_at: string | null
                    created_at: string | null
                    updated_at: string | null
                    created_by: string | null
                    updated_by: string | null
                }
                Update: {
                    id?: string
                    user_id?: string
                    business_id?: string
                    endpoint?: string
                    p256dh?: string
                    auth?: string
                    user_agent: string | null
                    last_used_at: string | null
                    created_at: string | null
                    updated_at: string | null
                    created_by: string | null
                    updated_by: string | null
                }
            }

            notifications: {
                Row: {
                    id: string
                    user_id: string
                    business_id: string
                    type: string
                    title: string
                    message: string
                    link: string | null
                    read: boolean
                    read_at: string | null
                    metadata: Record<string, any> | null
                    created_at: string | null
                    updated_at: string | null
                }
                Insert: {
                    id?: string
                    user_id: string
                    business_id?: string
                    type: string
                    title: string
                    message: string
                    link?: string | null
                    read?: boolean
                    read_at: string | null
                    metadata?: Record<string, any> | null
                    created_at?: string | null
                    updated_at?: string | null
                }
                Update: {
                    id?: string
                    user_id?: string
                    business_id?: string
                    type?: string
                    title?: string
                    message?: string
                    link?: string | null
                    read?: boolean
                    read_at: string | null
                    metadata?: Record<string, any> | null
                    created_at?: string | null
                    updated_at?: string | null
                }
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            [_ in never]: never
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}

export type Tables<
    PublicTableNameOrOptions extends keyof Database["public"]["Tables"] | { schema: keyof Database },
    TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
    ? TableName extends keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName]["Row"]
    : never
    : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? "Row" extends keyof Database["public"]["Tables"][PublicTableNameOrOptions]
    ? Database["public"]["Tables"][PublicTableNameOrOptions]["Row"]
    : never
    : never

export type TablesInsert<
    PublicTableNameOrOptions extends keyof Database["public"]["Tables"] | { schema: keyof Database },
    TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
    ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName]["Insert"]
    : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][TableName]["Insert"]
    : never

export type TablesUpdate<
    PublicTableNameOrOptions extends keyof Database["public"]["Tables"] | { schema: keyof Database },
    TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
    ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName]["Update"]
    : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][TableName]["Update"]
    : never
