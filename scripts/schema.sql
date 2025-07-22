-- JobSight Pro Database Schema - Updated from Current Supabase State

-- Set up extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- Businesses Table (replaces organizations)
CREATE TABLE IF NOT EXISTS public.businesses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  zip VARCHAR(20),
  country VARCHAR(100),
  phone VARCHAR(50),
  email VARCHAR(255),
  website VARCHAR(255),
  tax_id VARCHAR(50),
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT,
  updated_by TEXT,
  business_type VARCHAR(100),
  owner_id TEXT,
  setup_completed BOOLEAN DEFAULT FALSE,
  referral_code VARCHAR(20) UNIQUE
);

-- Users Table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id VARCHAR(255) UNIQUE,
  business_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(50),
  role VARCHAR(50),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT,
  updated_by TEXT,
  status VARCHAR(50),
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  email_verified_at TIMESTAMP WITH TIME ZONE,
  verification_token_sent_at TIMESTAMP WITH TIME ZONE
);

-- Clients Table
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100),
  contact_name VARCHAR(255),
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  zip VARCHAR(20),
  country VARCHAR(100),
  status VARCHAR(50) DEFAULT 'active',
  website VARCHAR(255),
  industry VARCHAR(100),
  tax_id VARCHAR(50),
  notes TEXT,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT,
  updated_by TEXT
);

-- Client Contacts Table
CREATE TABLE IF NOT EXISTS public.client_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  title VARCHAR(100),
  email VARCHAR(255),
  phone VARCHAR(50),
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT,
  updated_by TEXT,
  business_id UUID NOT NULL DEFAULT gen_random_uuid()
);

-- Client Interactions Table
CREATE TABLE IF NOT EXISTS public.client_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  type VARCHAR(50) NOT NULL,
  summary TEXT NOT NULL,
  staff VARCHAR(255),
  follow_up_date DATE,
  follow_up_task TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT,
  updated_by TEXT,
  business_id UUID NOT NULL DEFAULT gen_random_uuid()
);

-- Projects Table
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100),
  status VARCHAR(50) DEFAULT 'planning',
  start_date DATE,
  end_date DATE,
  budget NUMERIC,
  location TEXT,
  description TEXT,
  manager_id UUID,
  progress INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT,
  updated_by TEXT
);

-- Project Milestones Table
CREATE TABLE IF NOT EXISTS public.project_milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  due_date DATE,
  status VARCHAR(50) DEFAULT 'not_started',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  business_id UUID,
  created_by TEXT,
  updated_by TEXT
);

-- Tasks Table (Enhanced with milestone_id)
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  milestone_id UUID REFERENCES public.project_milestones(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'not_started',
  priority VARCHAR(50) DEFAULT 'medium',
  start_date DATE,
  end_date DATE,
  assigned_to UUID REFERENCES public.crews(id) ON DELETE SET NULL,
  progress INTEGER DEFAULT 0,
  created_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by TEXT
);

-- Subtasks Table
CREATE TABLE IF NOT EXISTS public.subtasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'not_started',
  assigned_to VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT,
  updated_by TEXT,
  business_id UUID,
  description TEXT
);

-- Task Dependencies Table
CREATE TABLE IF NOT EXISTS public.task_dependencies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  depends_on_task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  dependency_type VARCHAR(50) DEFAULT 'finish_to_start',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  business_id UUID,
  created_by TEXT,
  updated_by TEXT,
  UNIQUE(task_id, depends_on_task_id)
);

-- Task Notes Table
CREATE TABLE IF NOT EXISTS public.task_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  author VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  business_id UUID,
  created_by TEXT,
  updated_by TEXT
);

-- Crew Members Table
CREATE TABLE IF NOT EXISTS public.crew_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  role VARCHAR(100),
  experience VARCHAR(100),
  phone VARCHAR(50),
  email VARCHAR(255),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  business_id UUID,
  created_by TEXT,
  updated_by TEXT
);

-- Crews Table
CREATE TABLE IF NOT EXISTS public.crews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  leader_id UUID REFERENCES public.crew_members(id) ON DELETE SET NULL,
  specialty VARCHAR(255),
  status VARCHAR(50) DEFAULT '',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT,
  updated_by TEXT
);

-- Crew Member Assignments Table
CREATE TABLE IF NOT EXISTS public.crew_member_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT,
  updated_by TEXT,
  crew_id UUID NOT NULL REFERENCES public.crews(id) ON DELETE CASCADE,
  crew_member_id UUID NOT NULL REFERENCES public.crew_members(id) ON DELETE CASCADE
);

-- Project Crews Table
CREATE TABLE IF NOT EXISTS public.project_crews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  crew_id UUID NOT NULL REFERENCES public.crews(id) ON DELETE CASCADE,
  start_date DATE,
  end_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  business_id UUID,
  created_by TEXT,
  updated_by TEXT,
  active_range DATERANGE
);

-- Equipment Table
CREATE TABLE IF NOT EXISTS public.equipment (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100),
  make VARCHAR(100),
  model VARCHAR(100),
  year INTEGER,
  serial_number VARCHAR(100),
  status VARCHAR(50) DEFAULT '',
  purchase_date DATE,
  purchase_price NUMERIC,
  current_value NUMERIC,
  location VARCHAR(255),
  next_maintenance DATE,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT,
  updated_by TEXT
);

-- Equipment Specifications Table
CREATE TABLE IF NOT EXISTS public.equipment_specifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  equipment_id UUID NOT NULL REFERENCES public.equipment(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  value VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  business_id UUID,
  created_by TEXT,
  updated_by TEXT
);

-- Equipment Assignments Table
CREATE TABLE IF NOT EXISTS public.equipment_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  equipment_id UUID NOT NULL REFERENCES public.equipment(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  crew_id UUID REFERENCES public.crews(id) ON DELETE SET NULL,
  assigned_by TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  status VARCHAR(50) DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  business_id UUID,
  created_by TEXT,
  updated_by TEXT
);

-- Equipment Maintenance Table
CREATE TABLE IF NOT EXISTS public.equipment_maintenance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  equipment_id UUID NOT NULL REFERENCES public.equipment(id) ON DELETE CASCADE,
  maintenance_date DATE NOT NULL,
  maintenance_type VARCHAR(50),
  description TEXT NOT NULL,
  technician VARCHAR(255),
  cost NUMERIC,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  business_id UUID,
  created_by TEXT,
  updated_by TEXT,
  maintenance_status TEXT DEFAULT 'scheduled'
);

-- Equipment Usage Table
CREATE TABLE IF NOT EXISTS public.equipment_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  equipment_id UUID NOT NULL REFERENCES public.equipment(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  crew_id UUID REFERENCES public.crews(id) ON DELETE SET NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  hours_used DOUBLE PRECISION NOT NULL,
  fuel_consumed DOUBLE PRECISION,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  business_id UUID,
  created_by TEXT,
  updated_by TEXT
);

-- Daily Logs Table
CREATE TABLE IF NOT EXISTS public.daily_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  crew_id UUID REFERENCES public.crews(id) ON DELETE SET NULL,
  weather JSON,
  work_completed TEXT,
  work_planned TEXT,
  hours_worked INTEGER,
  start_time TIME,
  end_time TIME,
  overtime INTEGER,
  safety TEXT,
  quality TEXT,
  delays TEXT,
  notes TEXT,
  author_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by TEXT,
  created_by TEXT
);

-- Daily Log Materials Table
CREATE TABLE IF NOT EXISTS public.daily_log_materials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  daily_log_id UUID NOT NULL REFERENCES public.daily_logs(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  quantity VARCHAR(100) NOT NULL,
  cost NUMERIC,
  supplier VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  business_id UUID,
  created_by TEXT,
  updated_by TEXT,
  notes TEXT
);

-- Daily Log Equipment Table
CREATE TABLE IF NOT EXISTS public.daily_log_equipment (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  daily_log_id UUID NOT NULL REFERENCES public.daily_logs(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  hours INTEGER NOT NULL,
  operator VARCHAR(255),
  condition VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  business_id UUID,
  created_by TEXT,
  updated_by TEXT,
  equipment_id UUID REFERENCES public.equipment(id) ON DELETE SET NULL,
  crew_member_id UUID REFERENCES public.crew_members(id) ON DELETE SET NULL
);

-- Daily Log Images Table
CREATE TABLE IF NOT EXISTS public.daily_log_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  daily_log_id UUID NOT NULL REFERENCES public.daily_logs(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  caption VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  business_id UUID,
  created_by TEXT,
  updated_by TEXT
);

-- Media Table
CREATE TABLE IF NOT EXISTS public.media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  size VARCHAR(50),
  uploaded_by TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  url TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT,
  updated_by TEXT
);

-- Media Tags Table
CREATE TABLE IF NOT EXISTS public.media_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  media_id UUID NOT NULL REFERENCES public.media(id) ON DELETE CASCADE,
  tag VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  business_id UUID,
  created_by TEXT,
  updated_by TEXT,
  UNIQUE(media_id, tag)
);

-- Media Metadata Table
CREATE TABLE IF NOT EXISTS public.media_metadata (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  media_id UUID NOT NULL REFERENCES public.media(id) ON DELETE CASCADE,
  key VARCHAR(100) NOT NULL,
  value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  business_id UUID,
  created_by TEXT,
  updated_by TEXT
);

-- Media Links Table
CREATE TABLE IF NOT EXISTS public.media_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  media_id UUID REFERENCES public.media(id) ON DELETE SET NULL,
  linked_id UUID NOT NULL,
  linked_type TEXT NOT NULL,
  role TEXT,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  business_id UUID NOT NULL,
  created_by TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by TEXT,
  UNIQUE(media_id, linked_id, linked_type)
);

-- Documents Table
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50),
  url TEXT NOT NULL,
  uploaded_by VARCHAR(255),
  upload_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT,
  updated_by TEXT,
  media_id UUID REFERENCES public.media(id) ON DELETE SET NULL,
  size NUMERIC
);

-- Project Issues Table
CREATE TABLE IF NOT EXISTS public.project_issues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'open',
  priority VARCHAR(50) DEFAULT 'medium',
  reported_date DATE NOT NULL,
  reported_by VARCHAR(255),
  assigned_to VARCHAR(255),
  resolution TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  business_id UUID,
  created_by TEXT,
  updated_by TEXT
);

-- Invoices Table
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  invoice_number VARCHAR(50) NOT NULL,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE RESTRICT,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  amount NUMERIC NOT NULL,
  status VARCHAR(50) DEFAULT 'draft',
  issue_date DATE,
  due_date DATE,
  paid_date DATE,
  payment_method VARCHAR(100),
  notes TEXT,
  created_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by TEXT,
  tax_rate NUMERIC
);

-- Invoice Items Table
CREATE TABLE IF NOT EXISTS public.invoice_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity NUMERIC NOT NULL,
  unit_price NUMERIC NOT NULL,
  amount NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  business_id UUID,
  created_by TEXT,
  updated_by TEXT,
  total_price NUMERIC,
  tax_rate NUMERIC,
  tax_amount NUMERIC
);

-- Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id VARCHAR(255) NOT NULL,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB
);

-- User Notification Preferences Table
CREATE TABLE IF NOT EXISTS public.user_notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id VARCHAR(255) NOT NULL,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  email_enabled BOOLEAN DEFAULT TRUE,
  push_enabled BOOLEAN DEFAULT FALSE,
  in_app_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by VARCHAR(255),
  updated_by VARCHAR(255),
  UNIQUE(user_id, business_id)
);

-- User Notification Type Preferences Table
CREATE TABLE IF NOT EXISTS public.user_notification_type_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id VARCHAR(255) NOT NULL,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  notification_type VARCHAR(50) NOT NULL,
  email_enabled BOOLEAN DEFAULT TRUE,
  push_enabled BOOLEAN DEFAULT FALSE,
  in_app_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by VARCHAR(255),
  updated_by VARCHAR(255),
  UNIQUE(user_id, business_id, notification_type)
);

-- Push Subscriptions Table
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id VARCHAR(255) NOT NULL,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by VARCHAR(255),
  updated_by VARCHAR(255),
  last_used_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, endpoint)
);

-- Business Subscriptions Table
CREATE TABLE IF NOT EXISTS public.business_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  status TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  created_by TEXT,
  updated_at TIMESTAMP WITH TIME ZONE,
  updated_by TEXT,
  stripe_subscription_id TEXT,
  stripe_invoice_id TEXT,
  stripe_customer_id TEXT
);

-- Stripe Customers Table
CREATE TABLE IF NOT EXISTS public.stripe_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  stripe_customer_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE
);

-- Stripe Subscriptions Table
CREATE TABLE IF NOT EXISTS public.stripe_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT NOT NULL,
  plan_id TEXT,
  status TEXT,
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN,
  canceled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
);

-- Stripe Invoices Table
CREATE TABLE IF NOT EXISTS public.stripe_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  stripe_invoice_id TEXT NOT NULL,
  amount_due NUMERIC,
  amount_paid NUMERIC,
  status TEXT,
  due_date TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE
);

-- Stripe Payment Events Table
CREATE TABLE IF NOT EXISTS public.stripe_payment_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  event_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  data JSONB,
  created_at TIMESTAMP WITH TIME ZONE
);

-- Referrals Table
CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  referee_business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  referee_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  plan_type VARCHAR(50) NOT NULL CHECK (plan_type IN ('starter', 'pro', 'business')),
  subscription_id UUID REFERENCES public.business_subscriptions(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  confirmed_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  UNIQUE(referrer_business_id, referee_business_id)
);

-- Sweepstake Entries Table
CREATE TABLE IF NOT EXISTS public.sweepstake_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  entry_type VARCHAR(50) NOT NULL CHECK (entry_type IN ('business_signup', 'referral', 'bonus')),
  referral_id UUID REFERENCES public.referrals(id) ON DELETE SET NULL,
  plan_type VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL
);

-- AI Logs Table
CREATE TABLE IF NOT EXISTS public.ai_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id TEXT,
  object_type TEXT NOT NULL,
  object_id UUID,
  action TEXT NOT NULL,
  input TEXT,
  output TEXT,
  embedding VECTOR,
  tokens_prompt INTEGER,
  tokens_completion INTEGER,
  model TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Feedback Table
CREATE TABLE IF NOT EXISTS public.feedback (
  id SERIAL PRIMARY KEY,
  message_id INTEGER NOT NULL,
  feedback_type TEXT NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  auth_id TEXT
);

-- Add billing rates for crew members
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'crew_members' AND column_name = 'hourly_rate') THEN
        ALTER TABLE public.crew_members ADD COLUMN hourly_rate DECIMAL(10,2) DEFAULT 0.00;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'crew_members' AND column_name = 'overtime_rate') THEN
        ALTER TABLE public.crew_members ADD COLUMN overtime_rate DECIMAL(10,2) DEFAULT 0.00;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'crew_members' AND column_name = 'doubletime_rate') THEN
        ALTER TABLE public.crew_members ADD COLUMN doubletime_rate DECIMAL(10,2) DEFAULT 0.00;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'crew_members' AND column_name = 'is_billable') THEN
        ALTER TABLE public.crew_members ADD COLUMN is_billable BOOLEAN DEFAULT true;
    END IF;
END $$;

-- Add billing rates for equipment
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'equipment' AND column_name = 'hourly_rate') THEN
        ALTER TABLE public.equipment ADD COLUMN hourly_rate DECIMAL(10,2) DEFAULT 0.00;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'equipment' AND column_name = 'is_billable') THEN
        ALTER TABLE public.equipment ADD COLUMN is_billable BOOLEAN DEFAULT true;
    END IF;
END $$;

-- Add invoice automation rules table
CREATE TABLE IF NOT EXISTS public.invoice_automation_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    rule_type VARCHAR(50) NOT NULL CHECK (rule_type IN ('time_based', 'milestone', 'retainer')),
    frequency VARCHAR(20) CHECK (frequency IN ('daily', 'weekly', 'monthly', 'project_completion')),
    auto_generate BOOLEAN DEFAULT false,
    require_approval BOOLEAN DEFAULT true,
    minimum_hours DECIMAL(5,2) DEFAULT 0.00,
    rounding_rule VARCHAR(20) DEFAULT 'nearest_quarter',
    config JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES public.users(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID REFERENCES public.users(id)
);

-- Add invoice approval workflow columns
DO $$
BEGIN
    -- Update existing status column to have proper constraints
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'status') THEN
        ALTER TABLE public.invoices DROP CONSTRAINT IF EXISTS invoices_status_check;
        ALTER TABLE public.invoices ADD CONSTRAINT invoices_status_check 
            CHECK (status IN ('draft', 'pending_approval', 'approved', 'sent', 'paid', 'cancelled'));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'approved_by') THEN
        ALTER TABLE public.invoices ADD COLUMN approved_by UUID REFERENCES public.users(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'approved_at') THEN
        ALTER TABLE public.invoices ADD COLUMN approved_at TIMESTAMP WITH TIME ZONE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'auto_generated') THEN
        ALTER TABLE public.invoices ADD COLUMN auto_generated BOOLEAN DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'source_rule_id') THEN
        ALTER TABLE public.invoices ADD COLUMN source_rule_id UUID REFERENCES public.invoice_automation_rules(id);
    END IF;
END $$;

-- Track daily log to invoice item relationships
CREATE TABLE IF NOT EXISTS public.daily_log_invoice_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    daily_log_id UUID NOT NULL REFERENCES public.daily_logs(id) ON DELETE CASCADE,
    invoice_item_id UUID NOT NULL REFERENCES public.invoice_items(id) ON DELETE CASCADE,
    item_type VARCHAR(20) NOT NULL CHECK (item_type IN ('labor', 'equipment', 'material')),
    source_id UUID, -- references daily_log_equipment.id, daily_log_materials.id, or crew_member_id for labor
    quantity DECIMAL(10,2),
    rate DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_invoice_automation_rules_business_client 
    ON public.invoice_automation_rules(business_id, client_id);
CREATE INDEX IF NOT EXISTS idx_invoice_automation_rules_project 
    ON public.invoice_automation_rules(project_id) WHERE project_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_daily_log_invoice_items_daily_log 
    ON public.daily_log_invoice_items(daily_log_id);
CREATE INDEX IF NOT EXISTS idx_daily_log_invoice_items_invoice_item 
    ON public.daily_log_invoice_items(invoice_item_id);
CREATE INDEX IF NOT EXISTS idx_daily_log_invoice_items_source 
    ON public.daily_log_invoice_items(source_id, item_type);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_businesses_owner_id ON public.businesses(owner_id);
CREATE INDEX IF NOT EXISTS idx_users_business_id ON public.users(business_id);
CREATE INDEX IF NOT EXISTS idx_users_auth_id ON public.users(auth_id);
CREATE INDEX IF NOT EXISTS idx_clients_business_id ON public.clients(business_id);
CREATE INDEX IF NOT EXISTS idx_projects_business_id ON public.projects(business_id);
CREATE INDEX IF NOT EXISTS idx_projects_client_id ON public.projects(client_id);
CREATE INDEX IF NOT EXISTS idx_project_milestones_project_id ON public.project_milestones(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_business_id ON public.tasks(business_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON public.tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_milestone_id ON public.tasks(milestone_id);
CREATE INDEX IF NOT EXISTS idx_crews_business_id ON public.crews(business_id);
CREATE INDEX IF NOT EXISTS idx_equipment_business_id ON public.equipment(business_id);
CREATE INDEX IF NOT EXISTS idx_daily_logs_business_id ON public.daily_logs(business_id);
CREATE INDEX IF NOT EXISTS idx_daily_logs_project_id ON public.daily_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_media_business_id ON public.media(business_id);
CREATE INDEX IF NOT EXISTS idx_invoices_business_id ON public.invoices(business_id);
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON public.invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_business ON public.notifications(business_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(user_id, business_id) WHERE (read = false);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);

-- Referral system indexes
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_business ON public.referrals(referrer_business_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referee_business ON public.referrals(referee_business_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON public.referrals(status);
CREATE INDEX IF NOT EXISTS idx_sweepstake_entries_business ON public.sweepstake_entries(business_id);
CREATE INDEX IF NOT EXISTS idx_sweepstake_entries_type ON public.sweepstake_entries(entry_type);
CREATE INDEX IF NOT EXISTS idx_businesses_referral_code ON public.businesses(referral_code);

-- Specialized indexes
CREATE INDEX IF NOT EXISTS no_overlapping_assignments ON public.project_crews USING GIST (project_id, crew_id, active_range);

-- Foreign key constraints that need special handling (conditional creation)
DO $$ 
BEGIN
    -- tasks_assigned_to_fkey
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'tasks_assigned_to_fkey') THEN
        ALTER TABLE public.tasks ADD CONSTRAINT tasks_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.crews(id) ON DELETE SET NULL;
    END IF;
    
    -- crews_leader_id_fkey  
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'crews_leader_id_fkey') THEN
        ALTER TABLE public.crews ADD CONSTRAINT crews_leader_id_fkey FOREIGN KEY (leader_id) REFERENCES public.crew_members(id) ON DELETE SET NULL;
    END IF;
    
    -- projects_created_by_fkey
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'projects_created_by_fkey') THEN
        ALTER TABLE public.projects ADD CONSTRAINT projects_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(auth_id) ON DELETE SET NULL;
    END IF;
    
    -- user_notification_preferences constraints
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'user_notification_preferences_user_id_fkey') THEN
        ALTER TABLE public.user_notification_preferences ADD CONSTRAINT user_notification_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(auth_id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'user_notification_preferences_created_by_fkey') THEN
        ALTER TABLE public.user_notification_preferences ADD CONSTRAINT user_notification_preferences_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(auth_id) ON DELETE SET NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'user_notification_preferences_updated_by_fkey') THEN
        ALTER TABLE public.user_notification_preferences ADD CONSTRAINT user_notification_preferences_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(auth_id) ON DELETE SET NULL;
    END IF;
    
    -- user_notification_type_preferences constraints
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'user_notification_type_preferences_user_id_fkey') THEN
        ALTER TABLE public.user_notification_type_preferences ADD CONSTRAINT user_notification_type_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(auth_id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'user_notification_type_preferences_created_by_fkey') THEN
        ALTER TABLE public.user_notification_type_preferences ADD CONSTRAINT user_notification_type_preferences_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(auth_id) ON DELETE SET NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'user_notification_type_preferences_updated_by_fkey') THEN
        ALTER TABLE public.user_notification_type_preferences ADD CONSTRAINT user_notification_type_preferences_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(auth_id) ON DELETE SET NULL;
    END IF;
    
    -- push_subscriptions constraints
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'push_subscriptions_user_id_fkey') THEN
        ALTER TABLE public.push_subscriptions ADD CONSTRAINT push_subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(auth_id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'push_subscriptions_created_by_fkey') THEN
        ALTER TABLE public.push_subscriptions ADD CONSTRAINT push_subscriptions_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(auth_id) ON DELETE SET NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'push_subscriptions_updated_by_fkey') THEN
        ALTER TABLE public.push_subscriptions ADD CONSTRAINT push_subscriptions_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(auth_id) ON DELETE SET NULL;
    END IF;
    
    -- notifications constraints
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'notifications_user_id_fkey') THEN
        ALTER TABLE public.notifications ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(auth_id) ON DELETE CASCADE;
    END IF;
    
    -- feedback constraints  
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'feedback_user_id_fkey') THEN
        ALTER TABLE public.feedback ADD CONSTRAINT feedback_user_id_fkey FOREIGN KEY (auth_id) REFERENCES public.users(auth_id) ON DELETE SET NULL;
    END IF;
END $$;

-- Add missing foreign key constraints (idempotent)
DO $$
BEGIN
    -- Critical user references
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'businesses_owner_id_fkey') THEN
        ALTER TABLE public.businesses ADD CONSTRAINT businesses_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(auth_id) ON DELETE SET NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'projects_manager_id_fkey') THEN
        ALTER TABLE public.projects ADD CONSTRAINT projects_manager_id_fkey FOREIGN KEY (manager_id) REFERENCES public.crew_members(id) ON DELETE SET NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'daily_logs_author_id_fkey') THEN
        ALTER TABLE public.daily_logs ADD CONSTRAINT daily_logs_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.users(auth_id) ON DELETE SET NULL;
    END IF;
END $$;

-- Add missing business_id foreign key constraints (idempotent)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'project_milestones_business_id_fkey') THEN
        ALTER TABLE public.project_milestones ADD CONSTRAINT project_milestones_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'time_entries_business_id_fkey') THEN
        -- Only add if time_entries table exists (conditional table)
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries') THEN
            ALTER TABLE public.time_entries ADD CONSTRAINT time_entries_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
        END IF;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'task_dependencies_business_id_fkey') THEN
        ALTER TABLE public.task_dependencies ADD CONSTRAINT task_dependencies_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'task_comments_business_id_fkey') THEN
        -- Only add if task_comments table exists (conditional table)
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'task_comments') THEN
            ALTER TABLE public.task_comments ADD CONSTRAINT task_comments_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
        END IF;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'activity_logs_business_id_fkey') THEN
        -- Only add if activity_logs table exists (conditional table)
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'activity_logs') THEN
            ALTER TABLE public.activity_logs ADD CONSTRAINT activity_logs_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
        END IF;
    END IF;
    

    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'equipment_assignments_business_id_fkey') THEN
        ALTER TABLE public.equipment_assignments ADD CONSTRAINT equipment_assignments_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'equipment_maintenance_business_id_fkey') THEN
        ALTER TABLE public.equipment_maintenance ADD CONSTRAINT equipment_maintenance_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'equipment_usage_business_id_fkey') THEN
        ALTER TABLE public.equipment_usage ADD CONSTRAINT equipment_usage_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'daily_log_photos_business_id_fkey') THEN
        -- Only add if daily_log_photos table exists (conditional table)
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'daily_log_photos') THEN
            ALTER TABLE public.daily_log_photos ADD CONSTRAINT daily_log_photos_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
        END IF;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'daily_log_notes_business_id_fkey') THEN
        -- Only add if daily_log_notes table exists (conditional table)
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'daily_log_notes') THEN
            ALTER TABLE public.daily_log_notes ADD CONSTRAINT daily_log_notes_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
        END IF;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'daily_log_time_entries_business_id_fkey') THEN
        -- Only add if daily_log_time_entries table exists (conditional table)
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'daily_log_time_entries') THEN
            ALTER TABLE public.daily_log_time_entries ADD CONSTRAINT daily_log_time_entries_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
        END IF;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'media_tags_business_id_fkey') THEN
        ALTER TABLE public.media_tags ADD CONSTRAINT media_tags_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'media_metadata_business_id_fkey') THEN
        ALTER TABLE public.media_metadata ADD CONSTRAINT media_metadata_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ai_conversation_history_business_id_fkey') THEN
        -- Only add if ai_conversation_history table exists (conditional table)
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_conversation_history') THEN
            ALTER TABLE public.ai_conversation_history ADD CONSTRAINT ai_conversation_history_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
        END IF;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'invoice_items_business_id_fkey') THEN
        ALTER TABLE public.invoice_items ADD CONSTRAINT invoice_items_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
    END IF;
    
    -- Add missing business_id constraints for tables with nullable business_id fields
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'client_contacts_business_id_fkey') THEN
        ALTER TABLE public.client_contacts ADD CONSTRAINT client_contacts_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'client_interactions_business_id_fkey') THEN
        ALTER TABLE public.client_interactions ADD CONSTRAINT client_interactions_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'subtasks_business_id_fkey') THEN
        ALTER TABLE public.subtasks ADD CONSTRAINT subtasks_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'task_notes_business_id_fkey') THEN
        ALTER TABLE public.task_notes ADD CONSTRAINT task_notes_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'crew_members_business_id_fkey') THEN
        ALTER TABLE public.crew_members ADD CONSTRAINT crew_members_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'project_crews_business_id_fkey') THEN
        ALTER TABLE public.project_crews ADD CONSTRAINT project_crews_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'project_issues_business_id_fkey') THEN
        ALTER TABLE public.project_issues ADD CONSTRAINT project_issues_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'equipment_specifications_business_id_fkey') THEN
        ALTER TABLE public.equipment_specifications ADD CONSTRAINT equipment_specifications_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'daily_log_materials_business_id_fkey') THEN
        ALTER TABLE public.daily_log_materials ADD CONSTRAINT daily_log_materials_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'daily_log_equipment_business_id_fkey') THEN
        ALTER TABLE public.daily_log_equipment ADD CONSTRAINT daily_log_equipment_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'daily_log_images_business_id_fkey') THEN
        ALTER TABLE public.daily_log_images ADD CONSTRAINT daily_log_images_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add missing created_by and updated_by foreign key constraints (idempotent)
DO $$
BEGIN
    -- businesses audit constraints
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'businesses_created_by_fkey') THEN
        ALTER TABLE public.businesses ADD CONSTRAINT businesses_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(auth_id) ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'businesses_updated_by_fkey') THEN
        ALTER TABLE public.businesses ADD CONSTRAINT businesses_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(auth_id) ON DELETE SET NULL;
    END IF;
    
    -- users audit constraints
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_created_by_fkey') THEN
        ALTER TABLE public.users ADD CONSTRAINT users_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(auth_id) ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_updated_by_fkey') THEN
        ALTER TABLE public.users ADD CONSTRAINT users_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(auth_id) ON DELETE SET NULL;
    END IF;
    
    -- clients audit constraints
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'clients_created_by_fkey') THEN
        ALTER TABLE public.clients ADD CONSTRAINT clients_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(auth_id) ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'clients_updated_by_fkey') THEN
        ALTER TABLE public.clients ADD CONSTRAINT clients_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(auth_id) ON DELETE SET NULL;
    END IF;
    
    -- project_contacts audit constraints (conditional table)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'project_contacts') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'project_contacts_created_by_fkey') THEN
            ALTER TABLE public.project_contacts ADD CONSTRAINT project_contacts_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(auth_id) ON DELETE SET NULL;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'project_contacts_updated_by_fkey') THEN
            ALTER TABLE public.project_contacts ADD CONSTRAINT project_contacts_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(auth_id) ON DELETE SET NULL;
        END IF;
    END IF;
    
    -- project_locations audit constraints (conditional table)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'project_locations') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'project_locations_created_by_fkey') THEN
            ALTER TABLE public.project_locations ADD CONSTRAINT project_locations_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(auth_id) ON DELETE SET NULL;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'project_locations_updated_by_fkey') THEN
            ALTER TABLE public.project_locations ADD CONSTRAINT project_locations_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(auth_id) ON DELETE SET NULL;
        END IF;
    END IF;
    
    -- projects audit constraints (projects_created_by_fkey already defined above)
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'projects_updated_by_fkey') THEN
        ALTER TABLE public.projects ADD CONSTRAINT projects_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(auth_id) ON DELETE SET NULL;
    END IF;
    
    -- project_milestones audit constraints
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'project_milestones_created_by_fkey') THEN
        ALTER TABLE public.project_milestones ADD CONSTRAINT project_milestones_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(auth_id) ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'project_milestones_updated_by_fkey') THEN
        ALTER TABLE public.project_milestones ADD CONSTRAINT project_milestones_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(auth_id) ON DELETE SET NULL;
    END IF;
    
    -- tasks audit constraints
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tasks_created_by_fkey') THEN
        ALTER TABLE public.tasks ADD CONSTRAINT tasks_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(auth_id) ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tasks_updated_by_fkey') THEN
        ALTER TABLE public.tasks ADD CONSTRAINT tasks_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(auth_id) ON DELETE SET NULL;
    END IF;
    
    -- time_entries audit constraints (conditional table)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'time_entries_created_by_fkey') THEN
            ALTER TABLE public.time_entries ADD CONSTRAINT time_entries_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(auth_id) ON DELETE SET NULL;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'time_entries_updated_by_fkey') THEN
            ALTER TABLE public.time_entries ADD CONSTRAINT time_entries_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(auth_id) ON DELETE SET NULL;
        END IF;
    END IF;
    
    -- task_dependencies audit constraints
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'task_dependencies_created_by_fkey') THEN
        ALTER TABLE public.task_dependencies ADD CONSTRAINT task_dependencies_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(auth_id) ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'task_dependencies_updated_by_fkey') THEN
        ALTER TABLE public.task_dependencies ADD CONSTRAINT task_dependencies_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(auth_id) ON DELETE SET NULL;
    END IF;
    
    -- task_comments audit constraints (conditional table)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'task_comments') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'task_comments_created_by_fkey') THEN
            ALTER TABLE public.task_comments ADD CONSTRAINT task_comments_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(auth_id) ON DELETE SET NULL;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'task_comments_updated_by_fkey') THEN
            ALTER TABLE public.task_comments ADD CONSTRAINT task_comments_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(auth_id) ON DELETE SET NULL;
        END IF;
    END IF;
    
    -- activity_logs audit constraints (conditional table)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'activity_logs') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'activity_logs_created_by_fkey') THEN
            ALTER TABLE public.activity_logs ADD CONSTRAINT activity_logs_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(auth_id) ON DELETE SET NULL;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'activity_logs_updated_by_fkey') THEN
            ALTER TABLE public.activity_logs ADD CONSTRAINT activity_logs_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(auth_id) ON DELETE SET NULL;
        END IF;
    END IF;
    
    -- crews audit constraints
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'crews_created_by_fkey') THEN
        ALTER TABLE public.crews ADD CONSTRAINT crews_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(auth_id) ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'crews_updated_by_fkey') THEN
        ALTER TABLE public.crews ADD CONSTRAINT crews_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(auth_id) ON DELETE SET NULL;
    END IF;
    
    -- crew_members audit constraints
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'crew_members_created_by_fkey') THEN
        ALTER TABLE public.crew_members ADD CONSTRAINT crew_members_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(auth_id) ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'crew_members_updated_by_fkey') THEN
        ALTER TABLE public.crew_members ADD CONSTRAINT crew_members_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(auth_id) ON DELETE SET NULL;
    END IF;
    
    -- crew_assignments audit constraints
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'crew_assignments_created_by_fkey') THEN
        ALTER TABLE public.crew_member_assignments ADD CONSTRAINT crew_assignments_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(auth_id) ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'crew_assignments_updated_by_fkey') THEN
        ALTER TABLE public.crew_member_assignments ADD CONSTRAINT crew_assignments_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(auth_id) ON DELETE SET NULL;
    END IF;
    
    -- equipment audit constraints
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'equipment_created_by_fkey') THEN
        ALTER TABLE public.equipment ADD CONSTRAINT equipment_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(auth_id) ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'equipment_updated_by_fkey') THEN
        ALTER TABLE public.equipment ADD CONSTRAINT equipment_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(auth_id) ON DELETE SET NULL;
    END IF;
    

    
    -- equipment_assignments audit constraints
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'equipment_assignments_created_by_fkey') THEN
        ALTER TABLE public.equipment_assignments ADD CONSTRAINT equipment_assignments_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(auth_id) ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'equipment_assignments_updated_by_fkey') THEN
        ALTER TABLE public.equipment_assignments ADD CONSTRAINT equipment_assignments_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(auth_id) ON DELETE SET NULL;
    END IF;
    
    -- equipment_maintenance audit constraints
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'equipment_maintenance_created_by_fkey') THEN
        ALTER TABLE public.equipment_maintenance ADD CONSTRAINT equipment_maintenance_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(auth_id) ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'equipment_maintenance_updated_by_fkey') THEN
        ALTER TABLE public.equipment_maintenance ADD CONSTRAINT equipment_maintenance_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(auth_id) ON DELETE SET NULL;
    END IF;
    
    -- equipment_usage audit constraints
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'equipment_usage_created_by_fkey') THEN
        ALTER TABLE public.equipment_usage ADD CONSTRAINT equipment_usage_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(auth_id) ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'equipment_usage_updated_by_fkey') THEN
        ALTER TABLE public.equipment_usage ADD CONSTRAINT equipment_usage_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(auth_id) ON DELETE SET NULL;
    END IF;
    
    -- daily_logs audit constraints
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'daily_logs_created_by_fkey') THEN
        ALTER TABLE public.daily_logs ADD CONSTRAINT daily_logs_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(auth_id) ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'daily_logs_updated_by_fkey') THEN
        ALTER TABLE public.daily_logs ADD CONSTRAINT daily_logs_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(auth_id) ON DELETE SET NULL;
    END IF;
    
    -- referrals audit constraints
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'referrals_created_by_fkey') THEN
        ALTER TABLE public.referrals ADD CONSTRAINT referrals_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'referrals_updated_by_fkey') THEN
        ALTER TABLE public.referrals ADD CONSTRAINT referrals_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(id) ON DELETE SET NULL;
    END IF;
    
    -- sweepstake_entries audit constraints
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sweepstake_entries_created_by_fkey') THEN
        ALTER TABLE public.sweepstake_entries ADD CONSTRAINT sweepstake_entries_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sweepstake_entries_updated_by_fkey') THEN
        ALTER TABLE public.sweepstake_entries ADD CONSTRAINT sweepstake_entries_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Create a test_connection view for connection testing
CREATE OR REPLACE VIEW public._test_connection AS
SELECT 1 as connected;
