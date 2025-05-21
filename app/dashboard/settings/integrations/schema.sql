-- JobSight Pro Database Schema

-- Enable RLS (Row Level Security)
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Create schema for JobSight Pro
CREATE SCHEMA IF NOT EXISTS jobsight;

-- Set up extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Organizations Table
CREATE TABLE IF NOT EXISTS jobsight.organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  industry VARCHAR(100),
  size VARCHAR(50),
  website VARCHAR(255),
  phone VARCHAR(50),
  email VARCHAR(255),
  tax_id VARCHAR(50),
  founded VARCHAR(4),
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Organization Addresses Table
CREATE TABLE IF NOT EXISTS jobsight.organization_addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES jobsight.organizations(id) ON DELETE CASCADE,
  name VARCHAR(100),
  is_primary BOOLEAN DEFAULT FALSE,
  street VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(100),
  zip VARCHAR(20),
  country VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users Table
CREATE TABLE IF NOT EXISTS jobsight.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id UUID UNIQUE,
  organization_id UUID REFERENCES jobsight.organizations(id) ON DELETE SET NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(50),
  job_title VARCHAR(100),
  department VARCHAR(100),
  avatar_url TEXT,
  timezone VARCHAR(50) DEFAULT 'UTC',
  language VARCHAR(10) DEFAULT 'en-US',
  role VARCHAR(20) DEFAULT 'user',
  status VARCHAR(20) DEFAULT 'pending',
  last_active TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Clients Table
CREATE TABLE IF NOT EXISTS jobsight.clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES jobsight.organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  industry VARCHAR(100),
  website VARCHAR(255),
  phone VARCHAR(50),
  email VARCHAR(255),
  logo_url TEXT,
  notes TEXT,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Client Addresses Table
CREATE TABLE IF NOT EXISTS jobsight.client_addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES jobsight.clients(id) ON DELETE CASCADE,
  name VARCHAR(100),
  is_primary BOOLEAN DEFAULT FALSE,
  street VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(100),
  zip VARCHAR(20),
  country VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Client Contacts Table
CREATE TABLE IF NOT EXISTS jobsight.client_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES jobsight.clients(id) ON DELETE CASCADE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  job_title VARCHAR(100),
  email VARCHAR(255),
  phone VARCHAR(50),
  is_primary BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Projects Table
CREATE TABLE IF NOT EXISTS jobsight.projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES jobsight.organizations(id) ON DELETE CASCADE,
  client_id UUID REFERENCES jobsight.clients(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'planning',
  start_date DATE,
  end_date DATE,
  budget DECIMAL(12, 2),
  location TEXT,
  manager_id UUID REFERENCES jobsight.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tasks Table
CREATE TABLE IF NOT EXISTS jobsight.tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES jobsight.organizations(id) ON DELETE CASCADE,
  project_id UUID REFERENCES jobsight.projects(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  priority VARCHAR(20) DEFAULT 'medium',
  due_date TIMESTAMP WITH TIME ZONE,
  assigned_to UUID REFERENCES jobsight.users(id) ON DELETE SET NULL,
  created_by UUID REFERENCES jobsight.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crews Table
CREATE TABLE IF NOT EXISTS jobsight.crews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES jobsight.organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  leader_id UUID REFERENCES jobsight.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crew Members Table
CREATE TABLE IF NOT EXISTS jobsight.crew_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  crew_id UUID NOT NULL REFERENCES jobsight.crews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES jobsight.users(id) ON DELETE CASCADE,
  role VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(crew_id, user_id)
);

-- Equipment Table
CREATE TABLE IF NOT EXISTS jobsight.equipment (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES jobsight.organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100),
  model VARCHAR(100),
  serial_number VARCHAR(100),
  purchase_date DATE,
  purchase_cost DECIMAL(12, 2),
  status VARCHAR(50) DEFAULT 'available',
  location TEXT,
  notes TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Equipment Assignments Table
CREATE TABLE IF NOT EXISTS jobsight.equipment_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  equipment_id UUID NOT NULL REFERENCES jobsight.equipment(id) ON DELETE CASCADE,
  project_id UUID REFERENCES jobsight.projects(id) ON DELETE SET NULL,
  assigned_to UUID REFERENCES jobsight.users(id) ON DELETE SET NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Daily Logs Table
CREATE TABLE IF NOT EXISTS jobsight.daily_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES jobsight.organizations(id) ON DELETE CASCADE,
  project_id UUID REFERENCES jobsight.projects(id) ON DELETE CASCADE,
  log_date DATE NOT NULL,
  weather TEXT,
  temperature VARCHAR(20),
  work_performed TEXT,
  issues TEXT,
  visitors TEXT,
  created_by UUID REFERENCES jobsight.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Media Table
CREATE TABLE IF NOT EXISTS jobsight.media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES jobsight.organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  file_type VARCHAR(50),
  file_size INTEGER,
  mime_type VARCHAR(100),
  description TEXT,
  uploaded_by UUID REFERENCES jobsight.users(id) ON DELETE SET NULL,
  project_id UUID REFERENCES jobsight.projects(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Invoices Table
CREATE TABLE IF NOT EXISTS jobsight.invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES jobsight.organizations(id) ON DELETE CASCADE,
  client_id UUID REFERENCES jobsight.clients(id) ON DELETE SET NULL,
  project_id UUID REFERENCES jobsight.projects(id) ON DELETE SET NULL,
  invoice_number VARCHAR(50) NOT NULL,
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  status VARCHAR(50) DEFAULT 'draft',
  subtotal DECIMAL(12, 2) NOT NULL,
  tax_rate DECIMAL(5, 2),
  tax_amount DECIMAL(12, 2),
  discount_amount DECIMAL(12, 2),
  total_amount DECIMAL(12, 2) NOT NULL,
  notes TEXT,
  created_by UUID REFERENCES jobsight.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Invoice Items Table
CREATE TABLE IF NOT EXISTS jobsight.invoice_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID NOT NULL REFERENCES jobsight.invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity DECIMAL(10, 2) NOT NULL,
  unit_price DECIMAL(12, 2) NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reports Table
CREATE TABLE IF NOT EXISTS jobsight.reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES jobsight.organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  report_type VARCHAR(50) NOT NULL,
  config JSONB NOT NULL,
  is_favorite BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES jobsight.users(id) ON DELETE SET NULL,
  last_run_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create a function to get tables
CREATE OR REPLACE FUNCTION jobsight.get_tables()
RETURNS TABLE (
  name text,
  schema text,
  row_count bigint
) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.relname::text AS name,
    n.nspname::text AS schema,
    pg_stat_get_live_tuples(c.oid)::bigint AS row_count
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE c.relkind = 'r'
  AND n.nspname = 'jobsight'
  ORDER BY n.nspname, c.relname;
END;
$$;

-- Create RLS policies
-- Example policy for organizations
ALTER TABLE jobsight.organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY organization_select ON jobsight.organizations
  FOR SELECT USING (true);

CREATE POLICY organization_insert ON jobsight.organizations
  FOR INSERT WITH CHECK (true);

CREATE POLICY organization_update ON jobsight.organizations
  FOR UPDATE USING (true);

-- Add more policies for other tables as needed

-- Create sample data
INSERT INTO jobsight.organizations (name, industry, size, website, phone, email, tax_id, founded, logo_url)
VALUES ('Johnson Construction', 'construction', '51-200', 'https://johnsonconstruction.example.com', '(555) 987-6543', 'info@johnsonconstruction.example.com', '12-3456789', '2005', '/logo.png');

-- Get the organization ID
DO $$
DECLARE
  org_id UUID;
BEGIN
  SELECT id INTO org_id FROM jobsight.organizations WHERE name = 'Johnson Construction' LIMIT 1;

  -- Insert sample users
  INSERT INTO jobsight.users (organization_id, first_name, last_name, email, phone, job_title, department, role, status)
  VALUES 
    (org_id, 'Alex', 'Johnson', 'alex.johnson@example.com', '(555) 123-4567', 'CEO', 'Management', 'admin', 'active'),
    (org_id, 'Sarah', 'Williams', 'sarah.williams@example.com', '(555) 234-5678', 'Project Manager', 'Project Management', 'manager', 'active'),
    (org_id, 'Michael', 'Brown', 'michael.brown@example.com', '(555) 345-6789', 'Foreman', 'Construction', 'user', 'active');

  -- Insert sample clients
  INSERT INTO jobsight.clients (organization_id, name, industry, website, phone, email, status)
  VALUES 
    (org_id, 'Oakridge Development', 'real_estate', 'https://oakridge.example.com', '(555) 456-7890', 'info@oakridge.example.com', 'active'),
    (org_id, 'Metro City Government', 'government', 'https://metrocity.example.com', '(555) 567-8901', 'info@metrocity.example.com', 'active');

  -- Get client IDs
  DECLARE
    client1_id UUID;
    client2_id UUID;
  BEGIN
    SELECT id INTO client1_id FROM jobsight.clients WHERE name = 'Oakridge Development' LIMIT 1;
    SELECT id INTO client2_id FROM jobsight.clients WHERE name = 'Metro City Government' LIMIT 1;

    -- Insert sample projects
    INSERT INTO jobsight.projects (organization_id, client_id, name, description, status, start_date, end_date, budget)
    VALUES 
      (org_id, client1_id, 'Riverside Apartments', 'Construction of a new apartment complex', 'in_progress', '2025-01-15', '2025-12-31', 2500000.00),
      (org_id, client2_id, 'Downtown Revitalization', 'City center renovation project', 'planning', '2025-06-01', '2026-05-31', 5000000.00);
  END;
END $$;

-- Create a test_connection view for connection testing
CREATE OR REPLACE VIEW jobsight._test_connection AS
SELECT 1 as connected;
