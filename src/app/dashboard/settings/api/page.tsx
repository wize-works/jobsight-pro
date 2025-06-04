
"use client"

import { useState } from "react"
import Link from "next/link"
import { toast } from "@/hooks/use-toast"

export default function APISettingsPage() {
    const [apiKeys, setApiKeys] = useState([
        {
            id: "1",
            name: "Production API Key",
            key: "jspro_prod_1234567890abcdef",
            created: "2024-10-15",
            lastUsed: "2024-11-20",
            permissions: ["read", "write"]
        },
        {
            id: "2",
            name: "Mobile App Integration",
            key: "jspro_mobile_abcdef1234567890",
            created: "2024-11-01",
            lastUsed: "2024-11-21",
            permissions: ["read"]
        }
    ])

    const [webhooks, setWebhooks] = useState([
        {
            id: "1",
            name: "Project Updates",
            url: "https://api.example.com/webhooks/projects",
            events: ["project.created", "project.updated", "project.completed"],
            active: true
        },
        {
            id: "2", 
            name: "Task Notifications",
            url: "https://notifications.example.com/webhook",
            events: ["task.created", "task.assigned", "task.completed"],
            active: false
        }
    ])

    const [showNewKeyModal, setShowNewKeyModal] = useState(false)
    const [showNewWebhookModal, setShowNewWebhookModal] = useState(false)

    const handleGenerateKey = () => {
        const newKey = {
            id: Date.now().toString(),
            name: "New API Key",
            key: `jspro_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`,
            created: new Date().toISOString().split('T')[0],
            lastUsed: "Never",
            permissions: ["read"]
        }
        setApiKeys([...apiKeys, newKey])
        setShowNewKeyModal(false)
        toast({ title: "Success", description: "New API key generated" })
    }

    const handleRevokeKey = (keyId: string) => {
        if (confirm("Are you sure you want to revoke this API key? This action cannot be undone.")) {
            setApiKeys(apiKeys.filter(key => key.id !== keyId))
            toast({ title: "Success", description: "API key revoked" })
        }
    }

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div className="flex items-center gap-2">
                    <Link href="/dashboard/settings" className="btn btn-ghost btn-sm">
                        <i className="fas fa-arrow-left"></i>
                    </Link>
                    <h1 className="text-2xl font-bold">API & Webhooks</h1>
                </div>
            </div>

            <div className="space-y-6">
                {/* API Keys */}
                <div className="card bg-base-100 shadow-lg">
                    <div className="card-body">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="card-title text-xl">API Keys</h2>
                            <button 
                                className="btn btn-primary btn-sm"
                                onClick={() => setShowNewKeyModal(true)}
                            >
                                <i className="fas fa-plus mr-2"></i>
                                Generate New Key
                            </button>
                        </div>
                        
                        <div className="overflow-x-auto">
                            <table className="table table-zebra">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Key</th>
                                        <th>Permissions</th>
                                        <th>Created</th>
                                        <th>Last Used</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {apiKeys.map((key) => (
                                        <tr key={key.id}>
                                            <td className="font-medium">{key.name}</td>
                                            <td>
                                                <code className="text-xs bg-base-200 px-2 py-1 rounded">
                                                    {key.key.substring(0, 20)}...
                                                </code>
                                            </td>
                                            <td>
                                                <div className="flex gap-1">
                                                    {key.permissions.map((perm) => (
                                                        <span key={perm} className="badge badge-outline badge-xs">
                                                            {perm}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td>{key.created}</td>
                                            <td>{key.lastUsed}</td>
                                            <td>
                                                <button
                                                    className="btn btn-ghost btn-xs text-error"
                                                    onClick={() => handleRevokeKey(key.id)}
                                                >
                                                    Revoke
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* API Documentation */}
                <div className="card bg-base-100 shadow-lg">
                    <div className="card-body">
                        <h2 className="card-title text-xl mb-4">API Documentation</h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="card border border-base-300">
                                <div className="card-body">
                                    <h3 className="font-semibold">REST API</h3>
                                    <p className="text-sm text-base-content/70 mb-4">
                                        Complete REST API documentation with examples
                                    </p>
                                    <button className="btn btn-outline btn-sm">
                                        <i className="fas fa-external-link-alt mr-2"></i>
                                        View Docs
                                    </button>
                                </div>
                            </div>

                            <div className="card border border-base-300">
                                <div className="card-body">
                                    <h3 className="font-semibold">SDKs & Libraries</h3>
                                    <p className="text-sm text-base-content/70 mb-4">
                                        Download SDKs for popular programming languages
                                    </p>
                                    <button className="btn btn-outline btn-sm">
                                        <i className="fas fa-download mr-2"></i>
                                        Download SDKs
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 p-4 bg-info bg-opacity-10 rounded-lg">
                            <div className="flex items-start gap-3">
                                <i className="fas fa-info-circle text-info mt-1"></i>
                                <div>
                                    <h4 className="font-semibold text-info">API Usage Limits</h4>
                                    <p className="text-sm mt-1">
                                        Your current plan allows up to 10,000 API requests per month. 
                                        You've used 2,345 requests this month (23.5%).
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Webhooks */}
                <div className="card bg-base-100 shadow-lg">
                    <div className="card-body">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="card-title text-xl">Webhooks</h2>
                            <button 
                                className="btn btn-primary btn-sm"
                                onClick={() => setShowNewWebhookModal(true)}
                            >
                                <i className="fas fa-plus mr-2"></i>
                                Add Webhook
                            </button>
                        </div>
                        
                        <div className="space-y-4">
                            {webhooks.map((webhook) => (
                                <div key={webhook.id} className="card border border-base-300">
                                    <div className="card-body">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="font-semibold">{webhook.name}</h3>
                                                <p className="text-sm text-base-content/70">{webhook.url}</p>
                                                <div className="flex gap-1 mt-2">
                                                    {webhook.events.map((event) => (
                                                        <span key={event} className="badge badge-outline badge-xs">
                                                            {event}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className={`badge ${webhook.active ? 'badge-success' : 'badge-error'}`}>
                                                    {webhook.active ? 'Active' : 'Inactive'}
                                                </span>
                                                <button className="btn btn-ghost btn-sm">
                                                    <i className="fas fa-edit"></i>
                                                </button>
                                                <button className="btn btn-ghost btn-sm text-error">
                                                    <i className="fas fa-trash"></i>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Available Events */}
                <div className="card bg-base-100 shadow-lg">
                    <div className="card-body">
                        <h2 className="card-title text-xl mb-4">Available Webhook Events</h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div>
                                <h3 className="font-semibold mb-2">Projects</h3>
                                <ul className="text-sm space-y-1">
                                    <li><code>project.created</code></li>
                                    <li><code>project.updated</code></li>
                                    <li><code>project.completed</code></li>
                                    <li><code>project.deleted</code></li>
                                </ul>
                            </div>
                            
                            <div>
                                <h3 className="font-semibold mb-2">Tasks</h3>
                                <ul className="text-sm space-y-1">
                                    <li><code>task.created</code></li>
                                    <li><code>task.assigned</code></li>
                                    <li><code>task.completed</code></li>
                                    <li><code>task.overdue</code></li>
                                </ul>
                            </div>
                            
                            <div>
                                <h3 className="font-semibold mb-2">Equipment</h3>
                                <ul className="text-sm space-y-1">
                                    <li><code>equipment.maintenance</code></li>
                                    <li><code>equipment.assigned</code></li>
                                    <li><code>equipment.returned</code></li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Generate API Key Modal */}
            {showNewKeyModal && (
                <div className="modal modal-open">
                    <div className="modal-box">
                        <h3 className="font-bold text-lg mb-4">Generate New API Key</h3>
                        
                        <div className="space-y-4">
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Key Name</span>
                                </label>
                                <input
                                    type="text"
                                    className="input input-bordered"
                                    placeholder="Enter a descriptive name"
                                />
                            </div>

                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Permissions</span>
                                </label>
                                <div className="space-y-2">
                                    <label className="cursor-pointer label justify-start gap-2">
                                        <input type="checkbox" className="checkbox checkbox-primary" defaultChecked />
                                        <span className="label-text">Read access</span>
                                    </label>
                                    <label className="cursor-pointer label justify-start gap-2">
                                        <input type="checkbox" className="checkbox checkbox-primary" />
                                        <span className="label-text">Write access</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="modal-action">
                            <button 
                                className="btn btn-ghost" 
                                onClick={() => setShowNewKeyModal(false)}
                            >
                                Cancel
                            </button>
                            <button 
                                className="btn btn-primary"
                                onClick={handleGenerateKey}
                            >
                                Generate Key
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Webhook Modal */}
            {showNewWebhookModal && (
                <div className="modal modal-open">
                    <div className="modal-box">
                        <h3 className="font-bold text-lg mb-4">Add New Webhook</h3>
                        
                        <div className="space-y-4">
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Webhook Name</span>
                                </label>
                                <input
                                    type="text"
                                    className="input input-bordered"
                                    placeholder="Enter webhook name"
                                />
                            </div>

                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Endpoint URL</span>
                                </label>
                                <input
                                    type="url"
                                    className="input input-bordered"
                                    placeholder="https://your-api.com/webhook"
                                />
                            </div>

                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Events</span>
                                </label>
                                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                                    {[
                                        'project.created', 'project.updated', 'project.completed',
                                        'task.created', 'task.assigned', 'task.completed',
                                        'equipment.maintenance', 'equipment.assigned'
                                    ].map((event) => (
                                        <label key={event} className="cursor-pointer label justify-start gap-2">
                                            <input type="checkbox" className="checkbox checkbox-primary checkbox-sm" />
                                            <span className="label-text text-xs">{event}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="modal-action">
                            <button 
                                className="btn btn-ghost" 
                                onClick={() => setShowNewWebhookModal(false)}
                            >
                                Cancel
                            </button>
                            <button 
                                className="btn btn-primary"
                                onClick={() => {
                                    setShowNewWebhookModal(false)
                                    toast({ title: "Success", description: "Webhook added successfully" })
                                }}
                            >
                                Add Webhook
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
