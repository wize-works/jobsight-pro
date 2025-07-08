-- JobSight Pro Database Schema - Enhanced Migration

-- Set up extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- This migration enhances the database schema with the Projects → Milestones → Tasks hierarchy
-- and ensures all foreign key constraints are properly established.

-- Add milestone_id to tasks table (linking tasks to milestones)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'milestone_id') THEN
        ALTER TABLE public.tasks ADD COLUMN milestone_id UUID REFERENCES public.project_milestones(id) ON DELETE SET NULL;
        CREATE INDEX IF NOT EXISTS idx_tasks_milestone_id ON public.tasks(milestone_id);
    END IF;
END $$;

-- Add business_id to project_milestones if missing
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'project_milestones' AND column_name = 'business_id') THEN
        ALTER TABLE public.project_milestones ADD COLUMN business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Clean up all orphaned audit data before adding any foreign key constraints
DO $$
BEGIN
    -- Clean up all created_by fields that reference non-existent users (including empty strings)
    UPDATE public.businesses SET created_by = NULL WHERE (created_by IS NOT NULL AND created_by != '') AND created_by NOT IN (SELECT auth_id FROM public.users WHERE auth_id IS NOT NULL);
    UPDATE public.businesses SET created_by = NULL WHERE created_by = '';
    UPDATE public.businesses SET updated_by = NULL WHERE (updated_by IS NOT NULL AND updated_by != '') AND updated_by NOT IN (SELECT auth_id FROM public.users WHERE auth_id IS NOT NULL);
    UPDATE public.businesses SET updated_by = NULL WHERE updated_by = '';
    
    UPDATE public.clients SET created_by = NULL WHERE (created_by IS NOT NULL AND created_by != '') AND created_by NOT IN (SELECT auth_id FROM public.users WHERE auth_id IS NOT NULL);
    UPDATE public.clients SET created_by = NULL WHERE created_by = '';
    UPDATE public.clients SET updated_by = NULL WHERE (updated_by IS NOT NULL AND updated_by != '') AND updated_by NOT IN (SELECT auth_id FROM public.users WHERE auth_id IS NOT NULL);
    UPDATE public.clients SET updated_by = NULL WHERE updated_by = '';
    
    UPDATE public.projects SET created_by = NULL WHERE (created_by IS NOT NULL AND created_by != '') AND created_by NOT IN (SELECT auth_id FROM public.users WHERE auth_id IS NOT NULL);
    UPDATE public.projects SET created_by = NULL WHERE created_by = '';
    UPDATE public.projects SET updated_by = NULL WHERE (updated_by IS NOT NULL AND updated_by != '') AND updated_by NOT IN (SELECT auth_id FROM public.users WHERE auth_id IS NOT NULL);
    UPDATE public.projects SET updated_by = NULL WHERE updated_by = '';
    
    UPDATE public.project_milestones SET created_by = NULL WHERE (created_by IS NOT NULL AND created_by != '') AND created_by NOT IN (SELECT auth_id FROM public.users WHERE auth_id IS NOT NULL);
    UPDATE public.project_milestones SET created_by = NULL WHERE created_by = '';
    UPDATE public.project_milestones SET updated_by = NULL WHERE (updated_by IS NOT NULL AND updated_by != '') AND updated_by NOT IN (SELECT auth_id FROM public.users WHERE auth_id IS NOT NULL);
    UPDATE public.project_milestones SET updated_by = NULL WHERE updated_by = '';
    
    UPDATE public.tasks SET created_by = NULL WHERE (created_by IS NOT NULL AND created_by != '') AND created_by NOT IN (SELECT auth_id FROM public.users WHERE auth_id IS NOT NULL);
    UPDATE public.tasks SET created_by = NULL WHERE created_by = '';
    UPDATE public.tasks SET updated_by = NULL WHERE (updated_by IS NOT NULL AND updated_by != '') AND updated_by NOT IN (SELECT auth_id FROM public.users WHERE auth_id IS NOT NULL);
    UPDATE public.tasks SET updated_by = NULL WHERE updated_by = '';
    
    UPDATE public.crews SET created_by = NULL WHERE (created_by IS NOT NULL AND created_by != '') AND created_by NOT IN (SELECT auth_id FROM public.users WHERE auth_id IS NOT NULL);
    UPDATE public.crews SET created_by = NULL WHERE created_by = '';
    UPDATE public.crews SET updated_by = NULL WHERE (updated_by IS NOT NULL AND updated_by != '') AND updated_by NOT IN (SELECT auth_id FROM public.users WHERE auth_id IS NOT NULL);
    UPDATE public.crews SET updated_by = NULL WHERE updated_by = '';
    
    UPDATE public.crew_members SET created_by = NULL WHERE (created_by IS NOT NULL AND created_by != '') AND created_by NOT IN (SELECT auth_id FROM public.users WHERE auth_id IS NOT NULL);
    UPDATE public.crew_members SET created_by = NULL WHERE created_by = '';
    UPDATE public.crew_members SET updated_by = NULL WHERE (updated_by IS NOT NULL AND updated_by != '') AND updated_by NOT IN (SELECT auth_id FROM public.users WHERE auth_id IS NOT NULL);
    UPDATE public.crew_members SET updated_by = NULL WHERE updated_by = '';
    
    UPDATE public.equipment SET created_by = NULL WHERE (created_by IS NOT NULL AND created_by != '') AND created_by NOT IN (SELECT auth_id FROM public.users WHERE auth_id IS NOT NULL);
    UPDATE public.equipment SET created_by = NULL WHERE created_by = '';
    UPDATE public.equipment SET updated_by = NULL WHERE (updated_by IS NOT NULL AND updated_by != '') AND updated_by NOT IN (SELECT auth_id FROM public.users WHERE auth_id IS NOT NULL);
    UPDATE public.equipment SET updated_by = NULL WHERE updated_by = '';
    
    UPDATE public.daily_logs SET created_by = NULL WHERE (created_by IS NOT NULL AND created_by != '') AND created_by NOT IN (SELECT auth_id FROM public.users WHERE auth_id IS NOT NULL);
    UPDATE public.daily_logs SET created_by = NULL WHERE created_by = '';
    UPDATE public.daily_logs SET updated_by = NULL WHERE (updated_by IS NOT NULL AND updated_by != '') AND updated_by NOT IN (SELECT auth_id FROM public.users WHERE auth_id IS NOT NULL);
    UPDATE public.daily_logs SET updated_by = NULL WHERE updated_by = '';
    UPDATE public.daily_logs SET author_id = NULL WHERE (author_id IS NOT NULL AND author_id != '') AND author_id NOT IN (SELECT auth_id FROM public.users WHERE auth_id IS NOT NULL);
    UPDATE public.daily_logs SET author_id = NULL WHERE author_id = '';
    
    -- Clean up other audit fields for existing tables
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subtasks') THEN
        UPDATE public.subtasks SET created_by = NULL WHERE (created_by IS NOT NULL AND created_by != '') AND created_by NOT IN (SELECT auth_id FROM public.users WHERE auth_id IS NOT NULL);
        UPDATE public.subtasks SET created_by = NULL WHERE created_by = '';
        UPDATE public.subtasks SET updated_by = NULL WHERE (updated_by IS NOT NULL AND updated_by != '') AND updated_by NOT IN (SELECT auth_id FROM public.users WHERE auth_id IS NOT NULL);
        UPDATE public.subtasks SET updated_by = NULL WHERE updated_by = '';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'task_dependencies') THEN
        UPDATE public.task_dependencies SET created_by = NULL WHERE (created_by IS NOT NULL AND created_by != '') AND created_by NOT IN (SELECT auth_id FROM public.users WHERE auth_id IS NOT NULL);
        UPDATE public.task_dependencies SET created_by = NULL WHERE created_by = '';
        UPDATE public.task_dependencies SET updated_by = NULL WHERE (updated_by IS NOT NULL AND updated_by != '') AND updated_by NOT IN (SELECT auth_id FROM public.users WHERE auth_id IS NOT NULL);
        UPDATE public.task_dependencies SET updated_by = NULL WHERE updated_by = '';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'task_notes') THEN
        UPDATE public.task_notes SET created_by = NULL WHERE (created_by IS NOT NULL AND created_by != '') AND created_by NOT IN (SELECT auth_id FROM public.users WHERE auth_id IS NOT NULL);
        UPDATE public.task_notes SET created_by = NULL WHERE created_by = '';
        UPDATE public.task_notes SET updated_by = NULL WHERE (updated_by IS NOT NULL AND updated_by != '') AND updated_by NOT IN (SELECT auth_id FROM public.users WHERE auth_id IS NOT NULL);
        UPDATE public.task_notes SET updated_by = NULL WHERE updated_by = '';
    END IF;
END $$;

-- Ensure all critical foreign key constraints exist (idempotent)
DO $$ 
BEGIN
    -- project_milestones_business_id_fkey
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'project_milestones_business_id_fkey') THEN
        ALTER TABLE public.project_milestones ADD CONSTRAINT project_milestones_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
    END IF;
    
    -- tasks_milestone_id_fkey (should be created by column addition above, but ensure it exists)
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tasks_milestone_id_fkey') THEN
        ALTER TABLE public.tasks ADD CONSTRAINT tasks_milestone_id_fkey FOREIGN KEY (milestone_id) REFERENCES public.project_milestones(id) ON DELETE SET NULL;
    END IF;
    
    -- Clean up orphaned audit data before adding constraints
    
    -- Clean up project_milestones audit fields
    UPDATE public.project_milestones 
    SET created_by = NULL 
    WHERE (created_by IS NOT NULL AND created_by != '') 
    AND created_by NOT IN (SELECT auth_id FROM public.users WHERE auth_id IS NOT NULL);
    
    UPDATE public.project_milestones SET created_by = NULL WHERE created_by = '';
    
    UPDATE public.project_milestones 
    SET updated_by = NULL 
    WHERE (updated_by IS NOT NULL AND updated_by != '') 
    AND updated_by NOT IN (SELECT auth_id FROM public.users WHERE auth_id IS NOT NULL);
    
    UPDATE public.project_milestones SET updated_by = NULL WHERE updated_by = '';
    
    -- Clean up tasks audit fields
    UPDATE public.tasks 
    SET created_by = NULL 
    WHERE (created_by IS NOT NULL AND created_by != '') 
    AND created_by NOT IN (SELECT auth_id FROM public.users WHERE auth_id IS NOT NULL);
    
    UPDATE public.tasks SET created_by = NULL WHERE created_by = '';
    
    UPDATE public.tasks 
    SET updated_by = NULL 
    WHERE (updated_by IS NOT NULL AND updated_by != '') 
    AND updated_by NOT IN (SELECT auth_id FROM public.users WHERE auth_id IS NOT NULL);
    
    UPDATE public.tasks SET updated_by = NULL WHERE updated_by = '';
    
    -- Ensure key audit field constraints exist
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'project_milestones_created_by_fkey') THEN
        ALTER TABLE public.project_milestones ADD CONSTRAINT project_milestones_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(auth_id) ON DELETE SET NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'project_milestones_updated_by_fkey') THEN
        ALTER TABLE public.project_milestones ADD CONSTRAINT project_milestones_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(auth_id) ON DELETE SET NULL;
    END IF;
    
    -- Ensure tasks audit constraints exist
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tasks_created_by_fkey') THEN
        ALTER TABLE public.tasks ADD CONSTRAINT tasks_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(auth_id) ON DELETE SET NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tasks_updated_by_fkey') THEN
        ALTER TABLE public.tasks ADD CONSTRAINT tasks_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(auth_id) ON DELETE SET NULL;
    END IF;
END $$;

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

-- Specialized indexes
CREATE INDEX IF NOT EXISTS no_overlapping_assignments ON public.project_crews USING GIST (project_id, crew_id, active_range);

-- Foreign key constraints that need special handling (idempotent)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tasks_assigned_to_fkey') THEN
        ALTER TABLE public.tasks ADD CONSTRAINT tasks_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.crews(id) ON DELETE SET NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'crews_leader_id_fkey') THEN
        ALTER TABLE public.crews ADD CONSTRAINT crews_leader_id_fkey FOREIGN KEY (leader_id) REFERENCES public.crew_members(id) ON DELETE SET NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'projects_created_by_fkey') THEN
        ALTER TABLE public.projects ADD CONSTRAINT projects_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(auth_id) ON DELETE SET NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_notification_preferences_user_id_fkey') THEN
        ALTER TABLE public.user_notification_preferences ADD CONSTRAINT user_notification_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(auth_id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_notification_preferences_created_by_fkey') THEN
        ALTER TABLE public.user_notification_preferences ADD CONSTRAINT user_notification_preferences_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(auth_id) ON DELETE SET NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_notification_preferences_updated_by_fkey') THEN
        ALTER TABLE public.user_notification_preferences ADD CONSTRAINT user_notification_preferences_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(auth_id) ON DELETE SET NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_notification_type_preferences_user_id_fkey') THEN
        ALTER TABLE public.user_notification_type_preferences ADD CONSTRAINT user_notification_type_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(auth_id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_notification_type_preferences_created_by_fkey') THEN
        ALTER TABLE public.user_notification_type_preferences ADD CONSTRAINT user_notification_type_preferences_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(auth_id) ON DELETE SET NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_notification_type_preferences_updated_by_fkey') THEN
        ALTER TABLE public.user_notification_type_preferences ADD CONSTRAINT user_notification_type_preferences_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(auth_id) ON DELETE SET NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'push_subscriptions_user_id_fkey') THEN
        ALTER TABLE public.push_subscriptions ADD CONSTRAINT push_subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(auth_id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'push_subscriptions_created_by_fkey') THEN
        ALTER TABLE public.push_subscriptions ADD CONSTRAINT push_subscriptions_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(auth_id) ON DELETE SET NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'push_subscriptions_updated_by_fkey') THEN
        ALTER TABLE public.push_subscriptions ADD CONSTRAINT push_subscriptions_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(auth_id) ON DELETE SET NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'notifications_user_id_fkey') THEN
        ALTER TABLE public.notifications ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(auth_id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'feedback_user_id_fkey') THEN
        ALTER TABLE public.feedback ADD CONSTRAINT feedback_user_id_fkey FOREIGN KEY (auth_id) REFERENCES public.users(auth_id) ON DELETE SET NULL;
    END IF;
END $$;

-- Add missing foreign key constraints (with data cleanup)
DO $$
BEGIN
    -- Clean up orphaned data before adding constraints
    
    -- Clean up businesses.owner_id that don't exist in users.auth_id
    UPDATE public.businesses 
    SET owner_id = NULL 
    WHERE (owner_id IS NOT NULL AND owner_id != '') 
    AND owner_id NOT IN (SELECT auth_id FROM public.users WHERE auth_id IS NOT NULL);
    
    UPDATE public.businesses SET owner_id = NULL WHERE owner_id = '';
    
    -- Clean up projects.manager_id that don't exist in crew_members.id
    -- Note: manager_id is TEXT but crew_members.id is UUID, so we cast for comparison
    UPDATE public.projects 
    SET manager_id = NULL 
    WHERE (manager_id IS NOT NULL AND manager_id != '') 
    AND manager_id NOT IN (SELECT id::text FROM public.crew_members WHERE id IS NOT NULL);
    
    UPDATE public.projects SET manager_id = NULL WHERE manager_id = '';
    
    -- Convert projects.manager_id from TEXT to UUID for proper foreign key constraint
    -- First, set any invalid UUID strings to NULL
    UPDATE public.projects 
    SET manager_id = NULL 
    WHERE (manager_id IS NOT NULL AND manager_id != '') 
    AND manager_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
    
    -- Now alter the column type (check if it's still TEXT type)
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'projects' 
        AND column_name = 'manager_id' 
        AND data_type = 'text'
    ) THEN
        ALTER TABLE public.projects 
        ALTER COLUMN manager_id TYPE UUID USING manager_id::uuid;
    END IF;
    
    -- Clean up daily_logs.author_id that don't exist in users.auth_id
    UPDATE public.daily_logs 
    SET author_id = NULL 
    WHERE (author_id IS NOT NULL AND author_id != '') 
    AND author_id NOT IN (SELECT auth_id FROM public.users WHERE auth_id IS NOT NULL);
    
    UPDATE public.daily_logs SET author_id = NULL WHERE author_id = '';
    
    -- Clean up tasks.created_by that don't exist in users.auth_id
    UPDATE public.tasks 
    SET created_by = NULL 
    WHERE (created_by IS NOT NULL AND created_by != '') 
    AND created_by NOT IN (SELECT auth_id FROM public.users WHERE auth_id IS NOT NULL);
    
    UPDATE public.tasks SET created_by = NULL WHERE created_by = '';
    
    -- Clean up tasks.updated_by that don't exist in users.auth_id
    UPDATE public.tasks 
    SET updated_by = NULL 
    WHERE (updated_by IS NOT NULL AND updated_by != '') 
    AND updated_by NOT IN (SELECT auth_id FROM public.users WHERE auth_id IS NOT NULL);
    
    UPDATE public.tasks SET updated_by = NULL WHERE updated_by = '';
    
    -- Clean up project_milestones.created_by that don't exist in users.auth_id
    UPDATE public.project_milestones 
    SET created_by = NULL 
    WHERE (created_by IS NOT NULL AND created_by != '') 
    AND created_by NOT IN (SELECT auth_id FROM public.users WHERE auth_id IS NOT NULL);
    
    UPDATE public.project_milestones SET created_by = NULL WHERE created_by = '';
    
    -- Clean up project_milestones.updated_by that don't exist in users.auth_id
    UPDATE public.project_milestones 
    SET updated_by = NULL 
    WHERE (updated_by IS NOT NULL AND updated_by != '') 
    AND updated_by NOT IN (SELECT auth_id FROM public.users WHERE auth_id IS NOT NULL);
    
    UPDATE public.project_milestones SET updated_by = NULL WHERE updated_by = '';
    
    -- Now add the foreign key constraints
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
    
    -- Only add constraints for tables that exist
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'time_entries_business_id_fkey') THEN
            ALTER TABLE public.time_entries ADD CONSTRAINT time_entries_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
        END IF;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'task_dependencies_business_id_fkey') THEN
        ALTER TABLE public.task_dependencies ADD CONSTRAINT task_dependencies_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'task_comments') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'task_comments_business_id_fkey') THEN
            ALTER TABLE public.task_comments ADD CONSTRAINT task_comments_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
        END IF;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'activity_logs') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'activity_logs_business_id_fkey') THEN
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
    
    -- Crew related business_id constraints
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'crew_members_business_id_fkey') THEN
        ALTER TABLE public.crew_members ADD CONSTRAINT crew_members_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
    END IF;
    
    -- Client related business_id constraints  
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'client_contacts_business_id_fkey') THEN
        ALTER TABLE public.client_contacts ADD CONSTRAINT client_contacts_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'client_interactions_business_id_fkey') THEN
        ALTER TABLE public.client_interactions ADD CONSTRAINT client_interactions_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
    END IF;
    
    -- Task related business_id constraints
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'subtasks_business_id_fkey') THEN
        ALTER TABLE public.subtasks ADD CONSTRAINT subtasks_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'task_notes_business_id_fkey') THEN
        ALTER TABLE public.task_notes ADD CONSTRAINT task_notes_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
    END IF;
    
    -- Project related business_id constraints
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'project_crews_business_id_fkey') THEN
        ALTER TABLE public.project_crews ADD CONSTRAINT project_crews_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'project_issues_business_id_fkey') THEN
        ALTER TABLE public.project_issues ADD CONSTRAINT project_issues_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
    END IF;
    
    -- Equipment related business_id constraints
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'equipment_specifications_business_id_fkey') THEN
        ALTER TABLE public.equipment_specifications ADD CONSTRAINT equipment_specifications_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
    END IF;
    
    -- Daily log related business_id constraints
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'daily_log_materials_business_id_fkey') THEN
        ALTER TABLE public.daily_log_materials ADD CONSTRAINT daily_log_materials_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'daily_log_equipment_business_id_fkey') THEN
        ALTER TABLE public.daily_log_equipment ADD CONSTRAINT daily_log_equipment_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'daily_log_images_business_id_fkey') THEN
        ALTER TABLE public.daily_log_images ADD CONSTRAINT daily_log_images_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
    END IF;
    
    -- Media related constraints
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'media_tags_business_id_fkey') THEN
        ALTER TABLE public.media_tags ADD CONSTRAINT media_tags_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'media_metadata_business_id_fkey') THEN
        ALTER TABLE public.media_metadata ADD CONSTRAINT media_metadata_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'invoice_items_business_id_fkey') THEN
        ALTER TABLE public.invoice_items ADD CONSTRAINT invoice_items_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
    END IF;
    
    -- Add constraints for tables that might not exist in all environments
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'daily_log_photos') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'daily_log_photos_business_id_fkey') THEN
            ALTER TABLE public.daily_log_photos ADD CONSTRAINT daily_log_photos_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
        END IF;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'daily_log_notes') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'daily_log_notes_business_id_fkey') THEN
            ALTER TABLE public.daily_log_notes ADD CONSTRAINT daily_log_notes_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
        END IF;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'daily_log_time_entries') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'daily_log_time_entries_business_id_fkey') THEN
            ALTER TABLE public.daily_log_time_entries ADD CONSTRAINT daily_log_time_entries_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
        END IF;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_conversation_history') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ai_conversation_history_business_id_fkey') THEN
            ALTER TABLE public.ai_conversation_history ADD CONSTRAINT ai_conversation_history_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
        END IF;
    END IF;
END $$;

-- Add missing created_by and updated_by foreign key constraints (idempotent)
DO $$
BEGIN
    -- Core table audit constraints
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'businesses_created_by_fkey') THEN
        ALTER TABLE public.businesses ADD CONSTRAINT businesses_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(auth_id) ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'businesses_updated_by_fkey') THEN
        ALTER TABLE public.businesses ADD CONSTRAINT businesses_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(auth_id) ON DELETE SET NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_created_by_fkey') THEN
        ALTER TABLE public.users ADD CONSTRAINT users_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(auth_id) ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_updated_by_fkey') THEN
        ALTER TABLE public.users ADD CONSTRAINT users_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(auth_id) ON DELETE SET NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'clients_created_by_fkey') THEN
        ALTER TABLE public.clients ADD CONSTRAINT clients_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(auth_id) ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'clients_updated_by_fkey') THEN
        ALTER TABLE public.clients ADD CONSTRAINT clients_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(auth_id) ON DELETE SET NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'projects_updated_by_fkey') THEN
        ALTER TABLE public.projects ADD CONSTRAINT projects_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(auth_id) ON DELETE SET NULL;
    END IF;
    
    -- Equipment related audit constraints
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'equipment_created_by_fkey') THEN
        ALTER TABLE public.equipment ADD CONSTRAINT equipment_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(auth_id) ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'equipment_updated_by_fkey') THEN
        ALTER TABLE public.equipment ADD CONSTRAINT equipment_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(auth_id) ON DELETE SET NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'equipment_assignments_created_by_fkey') THEN
        ALTER TABLE public.equipment_assignments ADD CONSTRAINT equipment_assignments_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(auth_id) ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'equipment_assignments_updated_by_fkey') THEN
        ALTER TABLE public.equipment_assignments ADD CONSTRAINT equipment_assignments_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(auth_id) ON DELETE SET NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'equipment_maintenance_created_by_fkey') THEN
        ALTER TABLE public.equipment_maintenance ADD CONSTRAINT equipment_maintenance_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(auth_id) ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'equipment_maintenance_updated_by_fkey') THEN
        ALTER TABLE public.equipment_maintenance ADD CONSTRAINT equipment_maintenance_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(auth_id) ON DELETE SET NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'equipment_usage_created_by_fkey') THEN
        ALTER TABLE public.equipment_usage ADD CONSTRAINT equipment_usage_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(auth_id) ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'equipment_usage_updated_by_fkey') THEN
        ALTER TABLE public.equipment_usage ADD CONSTRAINT equipment_usage_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(auth_id) ON DELETE SET NULL;
    END IF;
    
    -- Crew related audit constraints
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'crews_created_by_fkey') THEN
        ALTER TABLE public.crews ADD CONSTRAINT crews_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(auth_id) ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'crews_updated_by_fkey') THEN
        ALTER TABLE public.crews ADD CONSTRAINT crews_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(auth_id) ON DELETE SET NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'crew_members_created_by_fkey') THEN
        ALTER TABLE public.crew_members ADD CONSTRAINT crew_members_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(auth_id) ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'crew_members_updated_by_fkey') THEN
        ALTER TABLE public.crew_members ADD CONSTRAINT crew_members_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(auth_id) ON DELETE SET NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'crew_member_assignments_created_by_fkey') THEN
        ALTER TABLE public.crew_member_assignments ADD CONSTRAINT crew_member_assignments_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(auth_id) ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'crew_member_assignments_updated_by_fkey') THEN
        ALTER TABLE public.crew_member_assignments ADD CONSTRAINT crew_member_assignments_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(auth_id) ON DELETE SET NULL;
    END IF;
    
    -- Daily logs audit constraints
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'daily_logs_created_by_fkey') THEN
        ALTER TABLE public.daily_logs ADD CONSTRAINT daily_logs_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(auth_id) ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'daily_logs_updated_by_fkey') THEN
        ALTER TABLE public.daily_logs ADD CONSTRAINT daily_logs_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(auth_id) ON DELETE SET NULL;
    END IF;
    
    -- Task related audit constraints
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'task_dependencies_created_by_fkey') THEN
        ALTER TABLE public.task_dependencies ADD CONSTRAINT task_dependencies_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(auth_id) ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'task_dependencies_updated_by_fkey') THEN
        ALTER TABLE public.task_dependencies ADD CONSTRAINT task_dependencies_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(auth_id) ON DELETE SET NULL;
    END IF;
    
    -- Add constraints for tables that might not exist in all environments
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'project_contacts') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'project_contacts_created_by_fkey') THEN
            ALTER TABLE public.project_contacts ADD CONSTRAINT project_contacts_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(auth_id) ON DELETE SET NULL;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'project_contacts_updated_by_fkey') THEN
            ALTER TABLE public.project_contacts ADD CONSTRAINT project_contacts_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(auth_id) ON DELETE SET NULL;
        END IF;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'project_locations') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'project_locations_created_by_fkey') THEN
            ALTER TABLE public.project_locations ADD CONSTRAINT project_locations_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(auth_id) ON DELETE SET NULL;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'project_locations_updated_by_fkey') THEN
            ALTER TABLE public.project_locations ADD CONSTRAINT project_locations_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(auth_id) ON DELETE SET NULL;
        END IF;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'time_entries_created_by_fkey') THEN
            ALTER TABLE public.time_entries ADD CONSTRAINT time_entries_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(auth_id) ON DELETE SET NULL;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'time_entries_updated_by_fkey') THEN
            ALTER TABLE public.time_entries ADD CONSTRAINT time_entries_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(auth_id) ON DELETE SET NULL;
        END IF;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'task_comments') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'task_comments_created_by_fkey') THEN
            ALTER TABLE public.task_comments ADD CONSTRAINT task_comments_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(auth_id) ON DELETE SET NULL;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'task_comments_updated_by_fkey') THEN
            ALTER TABLE public.task_comments ADD CONSTRAINT task_comments_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(auth_id) ON DELETE SET NULL;
        END IF;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'activity_logs') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'activity_logs_created_by_fkey') THEN
            ALTER TABLE public.activity_logs ADD CONSTRAINT activity_logs_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(auth_id) ON DELETE SET NULL;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'activity_logs_updated_by_fkey') THEN
            ALTER TABLE public.activity_logs ADD CONSTRAINT activity_logs_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(auth_id) ON DELETE SET NULL;
        END IF;
    END IF;
    

    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'crew_assignments') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'crew_assignments_created_by_fkey') THEN
            ALTER TABLE public.crew_assignments ADD CONSTRAINT crew_assignments_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(auth_id) ON DELETE SET NULL;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'crew_assignments_updated_by_fkey') THEN
            ALTER TABLE public.crew_assignments ADD CONSTRAINT crew_assignments_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(auth_id) ON DELETE SET NULL;
        END IF;
    END IF;
END $$;

-- Create a test_connection view for connection testing
CREATE OR REPLACE VIEW public._test_connection AS
SELECT 1 as connected;
