export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      businesses: {
        Row: {
          address: string | null
          city: string | null
          country: string | null
          created_at: string
          email: string | null
          id: string
          logo_url: string | null
          name: string | null
          phone: string | null
          state: string | null
          tax_id: string | null
          updated_at: string | null
          website: string | null
          zip: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          phone?: string | null
          state?: string | null
          tax_id?: string | null
          updated_at?: string | null
          website?: string | null
          zip?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          phone?: string | null
          state?: string | null
          tax_id?: string | null
          updated_at?: string | null
          website?: string | null
          zip?: string | null
        }
        Relationships: []
      }
      client_contacts: {
        Row: {
          client_id: string | null
          created_at: string
          email: string | null
          id: string
          is_primary: boolean | null
          name: string | null
          phone: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_primary?: boolean | null
          name?: string | null
          phone?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_primary?: boolean | null
          name?: string | null
          phone?: string | null
          title?: string | null
          updated_at?: string | null
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
          client_id: string | null
          created_at: string
          date: string | null
          follow_up_date: string | null
          follow_up_task: string | null
          id: string
          staff: string | null
          summary: string | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          date?: string | null
          follow_up_date?: string | null
          follow_up_task?: string | null
          id?: string
          staff?: string | null
          summary?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string
          date?: string | null
          follow_up_date?: string | null
          follow_up_task?: string | null
          id?: string
          staff?: string | null
          summary?: string | null
          type?: string | null
          updated_at?: string | null
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
          address: string | null
          billing_contact_email: string | null
          billing_contact_name: string | null
          billing_contact_phone: string | null
          business_id: string
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          id: string
          image: string | null
          industry: string | null
          name: string
          notes: string | null
          status: string | null
          tax_id: string | null
          total_projects: number | null
          total_value: number | null
          type: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          billing_contact_email?: string | null
          billing_contact_name?: string | null
          billing_contact_phone?: string | null
          business_id: string
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          id: string
          image?: string | null
          industry?: string | null
          name: string
          notes?: string | null
          status?: string | null
          tax_id?: string | null
          total_projects?: number | null
          total_value?: number | null
          type?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          billing_contact_email?: string | null
          billing_contact_name?: string | null
          billing_contact_phone?: string | null
          business_id?: string
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          id?: string
          image?: string | null
          industry?: string | null
          name?: string
          notes?: string | null
          status?: string | null
          tax_id?: string | null
          total_projects?: number | null
          total_value?: number | null
          type?: string | null
          website?: string | null
        }
        Relationships: []
      }
      crews: {
        Row: {
          business_id: string
          certifications: string[] | null
          current_project: string | null
          id: string
          leader: string | null
          members: number | null
          name: string
          notes: string | null
          specialty: string | null
          status: string | null
        }
        Insert: {
          business_id: string
          certifications?: string[] | null
          current_project?: string | null
          id: string
          leader?: string | null
          members?: number | null
          name: string
          notes?: string | null
          specialty?: string | null
          status?: string | null
        }
        Update: {
          business_id?: string
          certifications?: string[] | null
          current_project?: string | null
          id?: string
          leader?: string | null
          members?: number | null
          name?: string
          notes?: string | null
          specialty?: string | null
          status?: string | null
        }
        Relationships: []
      }
      daily_logs: {
        Row: {
          author_id: string
          business_id: string
          created_at: string | null
          crew_id: string
          date: string
          delays_description: string | null
          delays_impact: string | null
          delays_resolution: string | null
          end_time: string
          hours_worked: number
          id: string
          notes: string | null
          overtime: number
          project_id: string
          quality_corrective: string | null
          quality_inspections: string | null
          quality_issues: string | null
          safety_corrective: string | null
          safety_hazards: string | null
          safety_incidents: string | null
          safety_inspections: string | null
          start_time: string
          updated_at: string | null
          weather_condition: string | null
          weather_notes: string | null
          weather_precipitation: string | null
          weather_temperature: string | null
          weather_wind_speed: string | null
          work_completed: string
          work_planned: string
        }
        Insert: {
          author_id: string
          business_id: string
          created_at?: string | null
          crew_id: string
          date: string
          delays_description?: string | null
          delays_impact?: string | null
          delays_resolution?: string | null
          end_time: string
          hours_worked: number
          id: string
          notes?: string | null
          overtime: number
          project_id: string
          quality_corrective?: string | null
          quality_inspections?: string | null
          quality_issues?: string | null
          safety_corrective?: string | null
          safety_hazards?: string | null
          safety_incidents?: string | null
          safety_inspections?: string | null
          start_time: string
          updated_at?: string | null
          weather_condition?: string | null
          weather_notes?: string | null
          weather_precipitation?: string | null
          weather_temperature?: string | null
          weather_wind_speed?: string | null
          work_completed: string
          work_planned: string
        }
        Update: {
          author_id?: string
          business_id?: string
          created_at?: string | null
          crew_id?: string
          date?: string
          delays_description?: string | null
          delays_impact?: string | null
          delays_resolution?: string | null
          end_time?: string
          hours_worked?: number
          id?: string
          notes?: string | null
          overtime?: number
          project_id?: string
          quality_corrective?: string | null
          quality_inspections?: string | null
          quality_issues?: string | null
          safety_corrective?: string | null
          safety_hazards?: string | null
          safety_incidents?: string | null
          safety_inspections?: string | null
          start_time?: string
          updated_at?: string | null
          weather_condition?: string | null
          weather_notes?: string | null
          weather_precipitation?: string | null
          weather_temperature?: string | null
          weather_wind_speed?: string | null
          work_completed?: string
          work_planned?: string
        }
        Relationships: []
      }
      equipment: {
        Row: {
          assigned_to: string | null
          business_id: string
          current_value: number | null
          description: string | null
          documents: Json[] | null
          id: string
          image: string | null
          location: string | null
          make: string | null
          model: string | null
          name: string
          next_maintenance: string | null
          purchase_date: string | null
          purchase_price: number | null
          serial_number: string | null
          specifications: Json | null
          status: string | null
          type: string | null
          year: number | null
        }
        Insert: {
          assigned_to?: string | null
          business_id: string
          current_value?: number | null
          description?: string | null
          documents?: Json[] | null
          id: string
          image?: string | null
          location?: string | null
          make?: string | null
          model?: string | null
          name: string
          next_maintenance?: string | null
          purchase_date?: string | null
          purchase_price?: number | null
          serial_number?: string | null
          specifications?: Json | null
          status?: string | null
          type?: string | null
          year?: number | null
        }
        Update: {
          assigned_to?: string | null
          business_id?: string
          current_value?: number | null
          description?: string | null
          documents?: Json[] | null
          id?: string
          image?: string | null
          location?: string | null
          make?: string | null
          model?: string | null
          name?: string
          next_maintenance?: string | null
          purchase_date?: string | null
          purchase_price?: number | null
          serial_number?: string | null
          specifications?: Json | null
          status?: string | null
          type?: string | null
          year?: number | null
        }
        Relationships: []
      }
      invoices: {
        Row: {
          amount: number | null
          billing_address: Json | null
          business_id: string
          client_id: string
          company_info: Json | null
          due_date: string | null
          id: string
          issue_date: string | null
          notes: string | null
          paid_date: string | null
          payment_instructions: Json | null
          payment_method: string | null
          project_id: string
          status: string | null
        }
        Insert: {
          amount?: number | null
          billing_address?: Json | null
          business_id: string
          client_id: string
          company_info?: Json | null
          due_date?: string | null
          id?: string
          issue_date?: string | null
          notes?: string | null
          paid_date?: string | null
          payment_instructions?: Json | null
          payment_method?: string | null
          project_id: string
          status?: string | null
        }
        Update: {
          amount?: number | null
          billing_address?: Json | null
          business_id?: string
          client_id?: string
          company_info?: Json | null
          due_date?: string | null
          id?: string
          issue_date?: string | null
          notes?: string | null
          paid_date?: string | null
          payment_instructions?: Json | null
          payment_method?: string | null
          project_id?: string
          status?: string | null
        }
        Relationships: []
      }
      projects: {
        Row: {
          budget: number | null
          business_id: string
          client_id: string
          description: string | null
          end_date: string | null
          id: string
          location: string | null
          manager: string | null
          name: string
          progress: number | null
          start_date: string | null
          status: string | null
          type: string | null
        }
        Insert: {
          budget?: number | null
          business_id: string
          client_id: string
          description?: string | null
          end_date?: string | null
          id?: string
          location?: string | null
          manager?: string | null
          name: string
          progress?: number | null
          start_date?: string | null
          status?: string | null
          type?: string | null
        }
        Update: {
          budget?: number | null
          business_id?: string
          client_id?: string
          description?: string | null
          end_date?: string | null
          id?: string
          location?: string | null
          manager?: string | null
          name?: string
          progress?: number | null
          start_date?: string | null
          status?: string | null
          type?: string | null
        }
        Relationships: []
      }
      tasks: {
        Row: {
          assigned_to: string | null
          business_id: string
          description: string | null
          end_date: string | null
          id: string
          name: string
          priority: string | null
          project_id: string
          progress: number | null
          start_date: string | null
          status: string | null
        }
        Insert: {
          assigned_to?: string | null
          business_id: string
          description?: string | null
          end_date?: string | null
          id?: string
          name: string
          priority?: string | null
          project_id: string
          progress?: number | null
          start_date?: string | null
          status?: string | null
        }
        Update: {
          assigned_to?: string | null
          business_id?: string
          description?: string | null
          end_date?: string | null
          id?: string
          name?: string
          priority?: string | null
          project_id?: string
          progress?: number | null
          start_date?: string | null
          status?: string | null
        }
        Relationships: []
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
  PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] & { row: any }) | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName]["Row"]
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] & { row: any })
    ? (Database["public"]["Tables"] & { row: any })[PublicTableNameOrOptions]["Row"]
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
