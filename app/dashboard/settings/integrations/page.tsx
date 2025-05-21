"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { getSupabaseBrowserClient } from "@/lib/supabase"

export default function IntegrationsSettingsPage() {
  const [activeTab, setActiveTab] = useState("supabase")
  const [isConfigured, setIsConfigured] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tables, setTables] = useState<any[]>([])

  const [config, setConfig] = useState({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
    supabaseServiceKey: "",
  })

  // Check if Supabase is configured
  useEffect(() => {
    const supabaseClient = getSupabaseBrowserClient()
    if (supabaseClient) {
      setIsConfigured(true)
      testConnection()
    }
  }, [])

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setConfig({ ...config, [name]: value })
  }

  // Test Supabase connection
  const testConnection = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const supabase = getSupabaseBrowserClient()
      if (!supabase) {
        throw new Error("Supabase client not initialized")
      }

      // Test query to check connection
      const { data, error } = await supabase.from("_test_connection").select("*").limit(1).maybeSingle()

      if (error && error.code !== "PGRST116") {
        // PGRST116 means relation doesn't exist, which is fine for testing connection
        throw error
      }

      // Fetch table list
      const { data: tableData, error: tableError } = await supabase.rpc("get_tables")

      if (tableError) {
        console.warn("Could not fetch tables:", tableError)
      } else if (tableData) {
        setTables(tableData)
      }

      setIsConnected(true)
    } catch (err: any) {
      console.error("Connection error:", err)
      setError(err.message || "Failed to connect to Supabase")
      setIsConnected(false)
    } finally {
      setIsLoading(false)
    }
  }

  // Save Supabase configuration
  const saveConfiguration = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      // In a real app, this would save to environment variables or a secure storage
      // For demo purposes, we'll just simulate saving
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // This is just for demo - in a real app, you would need to restart the server
      // or update environment variables through a backend API
      console.log("Saved configuration:", config)

      alert(
        "Configuration saved successfully! In a real app, you would need to restart the server for changes to take effect.",
      )

      // Test the connection with new config
      testConnection()
    } catch (err: any) {
      setError(err.message || "Failed to save configuration")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="flex items-center gap-2">
          <Link href="/dashboard/settings" className="btn btn-ghost btn-sm">
            <i className="fas fa-arrow-left"></i>
          </Link>
          <h1 className="text-2xl font-bold">Integrations</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left sidebar - Navigation */}
        <div className="lg:col-span-1">
          <div className="card bg-base-100 shadow-sm">
            <div className="card-body">
              <h2 className="card-title">Available Integrations</h2>
              <div className="divider mt-0"></div>
              <ul className="menu bg-base-100 w-full p-0">
                <li>
                  <a className={activeTab === "supabase" ? "active" : ""} onClick={() => setActiveTab("supabase")}>
                    <i className="fas fa-database"></i> Supabase
                  </a>
                </li>
                <li>
                  <a className={activeTab === "stripe" ? "active" : ""} onClick={() => setActiveTab("stripe")}>
                    <i className="fab fa-stripe"></i> Stripe
                  </a>
                </li>
                <li>
                  <a className={activeTab === "twilio" ? "active" : ""} onClick={() => setActiveTab("twilio")}>
                    <i className="fas fa-sms"></i> Twilio
                  </a>
                </li>
                <li>
                  <a className={activeTab === "aws" ? "active" : ""} onClick={() => setActiveTab("aws")}>
                    <i className="fab fa-aws"></i> AWS
                  </a>
                </li>
                <li>
                  <a className={activeTab === "google" ? "active" : ""} onClick={() => setActiveTab("google")}>
                    <i className="fab fa-google"></i> Google APIs
                  </a>
                </li>
                <li>
                  <a className={activeTab === "openai" ? "active" : ""} onClick={() => setActiveTab("openai")}>
                    <i className="fas fa-robot"></i> OpenAI
                  </a>
                </li>
                <li>
                  <a className={activeTab === "zapier" ? "active" : ""} onClick={() => setActiveTab("zapier")}>
                    <i className="fas fa-bolt"></i> Zapier
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Right content - Integration settings */}
        <div className="lg:col-span-3">
          {activeTab === "supabase" && (
            <div className="space-y-6">
              <div className="card bg-base-100 shadow-sm">
                <div className="card-body">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="bg-[#3ECF8E] bg-opacity-20 p-3 rounded-full">
                        <i className="fas fa-database text-[#3ECF8E]"></i>
                      </div>
                      <div>
                        <h2 className="card-title">Supabase Integration</h2>
                        <p className="text-sm text-base-content/70">
                          Connect to your Supabase instance for database, authentication, and storage
                        </p>
                      </div>
                    </div>
                    <div className="badge badge-lg">
                      {isConfigured ? (
                        isConnected ? (
                          <span className="text-success flex items-center gap-1">
                            <i className="fas fa-circle text-xs"></i> Connected
                          </span>
                        ) : (
                          <span className="text-error flex items-center gap-1">
                            <i className="fas fa-circle text-xs"></i> Disconnected
                          </span>
                        )
                      ) : (
                        <span className="text-warning flex items-center gap-1">
                          <i className="fas fa-circle text-xs"></i> Not Configured
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="divider mt-0"></div>

                  <form onSubmit={saveConfiguration}>
                    <div className="space-y-4">
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text">Supabase URL</span>
                          <span className="label-text-alt">Required</span>
                        </label>
                        <input
                          type="url"
                          name="supabaseUrl"
                          placeholder="https://your-project.supabase.co"
                          className="input input-bordered"
                          value={config.supabaseUrl}
                          onChange={handleChange}
                          required
                        />
                        <label className="label">
                          <span className="label-text-alt">Your Supabase project URL</span>
                        </label>
                      </div>

                      <div className="form-control">
                        <label className="label">
                          <span className="label-text">Supabase Anon Key</span>
                          <span className="label-text-alt">Required</span>
                        </label>
                        <input
                          type="password"
                          name="supabaseAnonKey"
                          placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                          className="input input-bordered"
                          value={config.supabaseAnonKey}
                          onChange={handleChange}
                          required
                        />
                        <label className="label">
                          <span className="label-text-alt">Public API key for client-side access</span>
                        </label>
                      </div>

                      <div className="form-control">
                        <label className="label">
                          <span className="label-text">Supabase Service Role Key</span>
                          <span className="label-text-alt">Optional</span>
                        </label>
                        <input
                          type="password"
                          name="supabaseServiceKey"
                          placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                          className="input input-bordered"
                          value={config.supabaseServiceKey}
                          onChange={handleChange}
                        />
                        <label className="label">
                          <span className="label-text-alt">
                            Secret key for server-side operations (keep this secure)
                          </span>
                        </label>
                      </div>

                      {error && (
                        <div className="alert alert-error">
                          <i className="fas fa-exclamation-circle"></i>
                          <span>{error}</span>
                        </div>
                      )}

                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          className="btn btn-outline"
                          onClick={testConnection}
                          disabled={isLoading || !config.supabaseUrl || !config.supabaseAnonKey}
                        >
                          {isLoading ? (
                            <>
                              <span className="loading loading-spinner loading-xs"></span>
                              Testing...
                            </>
                          ) : (
                            <>Test Connection</>
                          )}
                        </button>
                        <button
                          type="submit"
                          className="btn btn-primary"
                          disabled={isLoading || !config.supabaseUrl || !config.supabaseAnonKey}
                        >
                          {isLoading ? (
                            <>
                              <span className="loading loading-spinner loading-xs"></span>
                              Saving...
                            </>
                          ) : (
                            <>Save Configuration</>
                          )}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>

              {isConnected && (
                <div className="card bg-base-100 shadow-sm">
                  <div className="card-body">
                    <h2 className="card-title">Database Tables</h2>
                    <div className="divider mt-0"></div>

                    {tables.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="table w-full">
                          <thead>
                            <tr>
                              <th>Table Name</th>
                              <th>Schema</th>
                              <th>Row Count</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {tables.map((table, index) => (
                              <tr key={index}>
                                <td>{table.name}</td>
                                <td>{table.schema || "public"}</td>
                                <td>{table.row_count || "Unknown"}</td>
                                <td>
                                  <button className="btn btn-xs btn-outline">
                                    <i className="fas fa-table mr-1"></i> View
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="alert">
                        <i className="fas fa-info-circle"></i>
                        <span>No tables found or unable to fetch table information.</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="card bg-base-100 shadow-sm">
                <div className="card-body">
                  <h2 className="card-title">Supabase Features</h2>
                  <div className="divider mt-0"></div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="card bg-base-200">
                      <div className="card-body p-4">
                        <h3 className="font-semibold flex items-center gap-2">
                          <i className="fas fa-database text-primary"></i> Database
                        </h3>
                        <p className="text-sm">PostgreSQL database with real-time capabilities</p>
                        <div className="card-actions justify-end mt-2">
                          <button className="btn btn-xs btn-outline" disabled={!isConnected}>
                            Configure
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="card bg-base-200">
                      <div className="card-body p-4">
                        <h3 className="font-semibold flex items-center gap-2">
                          <i className="fas fa-user-shield text-primary"></i> Authentication
                        </h3>
                        <p className="text-sm">User management and authentication services</p>
                        <div className="card-actions justify-end mt-2">
                          <button className="btn btn-xs btn-outline" disabled={!isConnected}>
                            Configure
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="card bg-base-200">
                      <div className="card-body p-4">
                        <h3 className="font-semibold flex items-center gap-2">
                          <i className="fas fa-cloud-upload-alt text-primary"></i> Storage
                        </h3>
                        <p className="text-sm">File storage and management</p>
                        <div className="card-actions justify-end mt-2">
                          <button className="btn btn-xs btn-outline" disabled={!isConnected}>
                            Configure
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="card bg-base-200">
                      <div className="card-body p-4">
                        <h3 className="font-semibold flex items-center gap-2">
                          <i className="fas fa-code text-primary"></i> Edge Functions
                        </h3>
                        <p className="text-sm">Serverless functions for backend logic</p>
                        <div className="card-actions justify-end mt-2">
                          <button className="btn btn-xs btn-outline" disabled={!isConnected}>
                            Configure
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card bg-base-100 shadow-sm">
                <div className="card-body">
                  <h2 className="card-title">Data Synchronization</h2>
                  <div className="divider mt-0"></div>

                  <p className="mb-4">Configure how JobSight Pro synchronizes data with your Supabase instance.</p>

                  <div className="form-control">
                    <label className="label cursor-pointer justify-start gap-2">
                      <input type="checkbox" className="toggle toggle-primary" disabled={!isConnected} />
                      <span className="label-text">Enable real-time data synchronization</span>
                    </label>
                  </div>

                  <div className="form-control mt-2">
                    <label className="label cursor-pointer justify-start gap-2">
                      <input type="checkbox" className="toggle toggle-primary" disabled={!isConnected} />
                      <span className="label-text">Sync user authentication with Supabase</span>
                    </label>
                  </div>

                  <div className="form-control mt-2">
                    <label className="label cursor-pointer justify-start gap-2">
                      <input type="checkbox" className="toggle toggle-primary" disabled={!isConnected} />
                      <span className="label-text">Use Supabase Storage for media files</span>
                    </label>
                  </div>

                  <div className="mt-4">
                    <h3 className="font-semibold mb-2">Sync Frequency</h3>
                    <select className="select select-bordered w-full max-w-xs" disabled={!isConnected}>
                      <option value="realtime">Real-time</option>
                      <option value="1min">Every minute</option>
                      <option value="5min">Every 5 minutes</option>
                      <option value="15min">Every 15 minutes</option>
                      <option value="30min">Every 30 minutes</option>
                      <option value="1hour">Every hour</option>
                      <option value="manual">Manual only</option>
                    </select>
                  </div>

                  <div className="flex justify-end mt-4">
                    <button className="btn btn-primary" disabled={!isConnected}>
                      Save Sync Settings
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab !== "supabase" && (
            <div className="card bg-base-100 shadow-sm">
              <div className="card-body text-center py-12">
                <i className="fas fa-tools text-5xl text-base-content/30 mb-4"></i>
                <h3 className="text-xl font-bold mb-2">Coming Soon</h3>
                <p className="text-base-content/70 max-w-md mx-auto">
                  The {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} integration is currently under
                  development and will be available soon.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
