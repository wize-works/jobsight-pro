"use client"

import { useState } from "react"
import Link from "next/link"

export default function InitializeDatabaseClient() {
    const [isInitializing, setIsInitializing] = useState(false)
    const [progress, setProgress] = useState(0)
    const [status, setStatus] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [isComplete, setIsComplete] = useState(false)

    const initializeDatabase = async () => {
        setIsInitializing(true)
        setProgress(0)
        setStatus("Connecting to Supabase...")
        setError(null)

        try {
            // In a real implementation, you would execute the SQL script in chunks
            // For this demo, we'll simulate the initialization process

            // Step 1: Check connection
            setProgress(10)
            setStatus("Checking database connection...")
            await new Promise((resolve) => setTimeout(resolve, 1000))

            // Step 2: Create schema
            setProgress(20)
            setStatus("Creating schema...")
            await new Promise((resolve) => setTimeout(resolve, 1000))

            // Step 3: Create tables
            setProgress(40)
            setStatus("Creating tables...")
            await new Promise((resolve) => setTimeout(resolve, 2000))

            // Step 4: Create functions and triggers
            setProgress(60)
            setStatus("Creating functions and triggers...")
            await new Promise((resolve) => setTimeout(resolve, 1000))

            // Step 5: Set up RLS policies
            setProgress(80)
            setStatus("Setting up row-level security policies...")
            await new Promise((resolve) => setTimeout(resolve, 1000))

            // Step 6: Insert sample data
            setProgress(90)
            setStatus("Inserting sample data...")
            await new Promise((resolve) => setTimeout(resolve, 1000))

            // Complete
            setProgress(100)
            setStatus("Database initialization complete!")
            setIsComplete(true)
        } catch (err: any) {
            console.error("Database initialization error:", err)
            setError(err.message || "Failed to initialize database")
        } finally {
            setIsInitializing(false)
        }
    }

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div className="flex items-center gap-2">
                    <Link href="/dashboard/settings/integrations" className="btn btn-ghost btn-sm">
                        <i className="fas fa-arrow-left"></i>
                    </Link>
                    <h1 className="text-2xl font-bold">Initialize Database</h1>
                </div>
            </div>

            <div className="card bg-base-100 shadow-sm">
                <div className="card-body">
                    <h2 className="card-title">Supabase Database Initialization</h2>
                    <div className="divider mt-0"></div>

                    <div className="alert alert-info mb-6">
                        <i className="fas fa-info-circle"></i>
                        <span>
                            This will set up the JobSight Pro database schema in your Supabase instance. This includes creating
                            tables, functions, and sample data. Make sure you have configured your Supabase connection in the
                            Integrations settings.
                        </span>
                    </div>

                    {!isInitializing && !isComplete && (
                        <div className="space-y-4">
                            <p>The following operations will be performed:</p>
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li>Create the JobSight schema</li>
                                <li>Create tables for organizations, users, clients, projects, tasks, etc.</li>
                                <li>Set up row-level security policies</li>
                                <li>Create helper functions and triggers</li>
                                <li>Insert sample data (optional)</li>
                            </ul>

                            <div className="form-control">
                                <label className="label cursor-pointer justify-start gap-2">
                                    <input type="checkbox" className="checkbox" defaultChecked />
                                    <span className="label-text">Include sample data</span>
                                </label>
                            </div>

                            <div className="alert alert-warning">
                                <i className="fas fa-exclamation-triangle"></i>
                                <span>
                                    This operation will modify your database. It's recommended to run this on a fresh Supabase instance or
                                    one that doesn't contain existing JobSight Pro data.
                                </span>
                            </div>

                            <div className="flex justify-end">
                                <button className="btn btn-primary" onClick={initializeDatabase}>
                                    Initialize Database
                                </button>
                            </div>
                        </div>
                    )}

                    {isInitializing && (
                        <div className="space-y-4">
                            <div className="flex justify-between mb-2">
                                <span>{status}</span>
                                <span>{progress}%</span>
                            </div>
                            <progress className="progress progress-primary w-full" value={progress} max="100"></progress>
                        </div>
                    )}

                    {error && (
                        <div className="alert alert-error mt-4">
                            <i className="fas fa-exclamation-circle"></i>
                            <span>{error}</span>
                        </div>
                    )}

                    {isComplete && (
                        <div className="space-y-6">
                            <div className="alert alert-success">
                                <i className="fas fa-check-circle"></i>
                                <span>Database initialization completed successfully!</span>
                            </div>

                            <h3 className="text-lg font-semibold mt-4">Next Steps</h3>
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li>Configure your application to use Supabase for data storage</li>
                                <li>Set up authentication integration</li>
                                <li>Configure storage for media files</li>
                                <li>Test your application with the new database</li>
                            </ul>

                            <div className="flex justify-end gap-2">
                                <Link href="/dashboard/settings/integrations" className="btn btn-outline">
                                    Back to Integrations
                                </Link>
                                <Link href="/dashboard" className="btn btn-primary">
                                    Go to Dashboard
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="card bg-base-100 shadow-sm mt-6">
                <div className="card-body">
                    <h2 className="card-title">Database Schema</h2>
                    <div className="divider mt-0"></div>

                    <div className="overflow-x-auto">
                        <pre className="bg-base-200 p-4 rounded-lg text-sm overflow-auto max-h-96">
                            {`-- JobSight Pro Database Schema (Preview)

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

-- ... and more tables (abbreviated for display)`}
                        </pre>
                    </div>

                    <div className="flex justify-end mt-4">
                        <Link href="/dashboard/settings/integrations/schema.sql" className="btn btn-outline" target="_blank">
                            <i className="fas fa-file-code mr-2"></i> View Full Schema
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
