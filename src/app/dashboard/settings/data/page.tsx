
"use client"

import { useState } from "react"
import Link from "next/link"
import { toast } from "@/hooks/use-toast"

export default function DataManagementPage() {
    const [exportLoading, setExportLoading] = useState(false)

    const handleExport = async (dataType: string) => {
        setExportLoading(true)
        try {
            // In a real implementation, this would trigger a data export
            await new Promise(resolve => setTimeout(resolve, 2000)) // Simulate API call
            toast({ title: "Success", description: `${dataType} export initiated. You'll receive a download link via email.` })
        } catch (error) {
            toast({ title: "Error", description: "Failed to initiate export", variant: "destructive" })
        } finally {
            setExportLoading(false)
        }
    }

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div className="flex items-center gap-2">
                    <Link href="/dashboard/settings" className="btn btn-ghost btn-sm">
                        <i className="fas fa-arrow-left"></i>
                    </Link>
                    <h1 className="text-2xl font-bold">Data Management</h1>
                </div>
            </div>

            <div className="space-y-6">
                {/* Data Export */}
                <div className="card bg-base-100 shadow-lg">
                    <div className="card-body">
                        <h2 className="card-title text-xl mb-4">Data Export</h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="card border border-base-300">
                                <div className="card-body">
                                    <h3 className="font-semibold">Projects Data</h3>
                                    <p className="text-sm text-base-content/70 mb-4">
                                        Export all projects, tasks, milestones, and related data
                                    </p>
                                    <button 
                                        className="btn btn-outline btn-sm"
                                        onClick={() => handleExport("Projects")}
                                        disabled={exportLoading}
                                    >
                                        <i className="fas fa-download mr-2"></i>
                                        Export Projects
                                    </button>
                                </div>
                            </div>

                            <div className="card border border-base-300">
                                <div className="card-body">
                                    <h3 className="font-semibold">Team Data</h3>
                                    <p className="text-sm text-base-content/70 mb-4">
                                        Export team members, crews, and assignments
                                    </p>
                                    <button 
                                        className="btn btn-outline btn-sm"
                                        onClick={() => handleExport("Team")}
                                        disabled={exportLoading}
                                    >
                                        <i className="fas fa-download mr-2"></i>
                                        Export Team Data
                                    </button>
                                </div>
                            </div>

                            <div className="card border border-base-300">
                                <div className="card-body">
                                    <h3 className="font-semibold">Equipment Data</h3>
                                    <p className="text-sm text-base-content/70 mb-4">
                                        Export equipment, maintenance records, and usage data
                                    </p>
                                    <button 
                                        className="btn btn-outline btn-sm"
                                        onClick={() => handleExport("Equipment")}
                                        disabled={exportLoading}
                                    >
                                        <i className="fas fa-download mr-2"></i>
                                        Export Equipment
                                    </button>
                                </div>
                            </div>

                            <div className="card border border-base-300">
                                <div className="card-body">
                                    <h3 className="font-semibold">Financial Data</h3>
                                    <p className="text-sm text-base-content/70 mb-4">
                                        Export invoices, payments, and financial records
                                    </p>
                                    <button 
                                        className="btn btn-outline btn-sm"
                                        onClick={() => handleExport("Financial")}
                                        disabled={exportLoading}
                                    >
                                        <i className="fas fa-download mr-2"></i>
                                        Export Financial
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 p-4 bg-info bg-opacity-10 rounded-lg">
                            <div className="flex items-start gap-3">
                                <i className="fas fa-info-circle text-info mt-1"></i>
                                <div>
                                    <h4 className="font-semibold text-info">Export Information</h4>
                                    <p className="text-sm mt-1">
                                        Exports are generated in CSV format and will be sent to your email address. 
                                        Large exports may take several minutes to process.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Data Import */}
                <div className="card bg-base-100 shadow-lg">
                    <div className="card-body">
                        <h2 className="card-title text-xl mb-4">Data Import</h2>
                        
                        <div className="space-y-4">
                            <div className="alert alert-warning">
                                <i className="fas fa-exclamation-triangle"></i>
                                <div>
                                    <h3 className="font-semibold">Important</h3>
                                    <p className="text-sm">
                                        Data imports will add to your existing data. Please ensure your CSV files follow our template format.
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="label">
                                        <span className="label-text font-medium">Import Type</span>
                                    </label>
                                    <select className="select select-bordered w-full">
                                        <option>Projects</option>
                                        <option>Team Members</option>
                                        <option>Equipment</option>
                                        <option>Clients</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="label">
                                        <span className="label-text font-medium">CSV File</span>
                                    </label>
                                    <input type="file" className="file-input file-input-bordered w-full" accept=".csv" />
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <button className="btn btn-primary">
                                    <i className="fas fa-upload mr-2"></i>
                                    Import Data
                                </button>
                                <button className="btn btn-outline">
                                    <i className="fas fa-download mr-2"></i>
                                    Download Template
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Backup Settings */}
                <div className="card bg-base-100 shadow-lg">
                    <div className="card-body">
                        <h2 className="card-title text-xl mb-4">Backup Settings</h2>
                        
                        <div className="space-y-4">
                            <div className="form-control">
                                <label className="label cursor-pointer justify-start gap-4">
                                    <input type="checkbox" className="toggle toggle-primary" defaultChecked />
                                    <div>
                                        <span className="label-text font-medium block">Automatic Backups</span>
                                        <span className="text-xs text-base-content/70">
                                            Create automatic backups of your data weekly
                                        </span>
                                    </div>
                                </label>
                            </div>

                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text font-medium">Backup Frequency</span>
                                </label>
                                <select className="select select-bordered max-w-xs">
                                    <option>Daily</option>
                                    <option selected>Weekly</option>
                                    <option>Monthly</option>
                                </select>
                            </div>

                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text font-medium">Retention Period</span>
                                </label>
                                <select className="select select-bordered max-w-xs">
                                    <option>30 days</option>
                                    <option selected>90 days</option>
                                    <option>1 year</option>
                                    <option>Forever</option>
                                </select>
                            </div>

                            <div className="mt-6">
                                <h3 className="font-semibold mb-3">Recent Backups</h3>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between p-3 bg-base-200 rounded">
                                        <div>
                                            <p className="font-medium">Weekly Backup - November 15, 2024</p>
                                            <p className="text-xs text-base-content/70">Size: 45.2 MB</p>
                                        </div>
                                        <button className="btn btn-ghost btn-sm">
                                            <i className="fas fa-download"></i>
                                        </button>
                                    </div>
                                    <div className="flex items-center justify-between p-3 bg-base-200 rounded">
                                        <div>
                                            <p className="font-medium">Weekly Backup - November 8, 2024</p>
                                            <p className="text-xs text-base-content/70">Size: 42.8 MB</p>
                                        </div>
                                        <button className="btn btn-ghost btn-sm">
                                            <i className="fas fa-download"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Data Cleanup */}
                <div className="card bg-warning/10 border border-warning/20 shadow-lg">
                    <div className="card-body">
                        <h2 className="card-title text-warning text-xl mb-4">
                            <i className="fas fa-exclamation-triangle mr-2"></i>
                            Data Cleanup
                        </h2>
                        
                        <div className="space-y-4">
                            <div>
                                <h3 className="font-semibold mb-2">Archive Old Projects</h3>
                                <p className="text-sm mb-3">
                                    Move completed projects older than 1 year to archive. Archived projects can still be accessed but won't appear in regular lists.
                                </p>
                                <button className="btn btn-outline btn-warning">
                                    Archive Old Projects
                                </button>
                            </div>

                            <div className="divider"></div>

                            <div>
                                <h3 className="font-semibold mb-2">Delete Unused Media</h3>
                                <p className="text-sm mb-3">
                                    Remove media files that are no longer associated with any projects, tasks, or documents.
                                </p>
                                <button className="btn btn-outline btn-warning">
                                    Clean Up Media
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
