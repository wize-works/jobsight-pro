"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"

// Integration categories
const categories = [
  { id: "all", name: "All Integrations" },
  { id: "accounting", name: "Accounting & Finance" },
  { id: "project", name: "Project Management" },
  { id: "communication", name: "Communication" },
  { id: "crm", name: "CRM & Sales" },
  { id: "calendar", name: "Calendar & Scheduling" },
  { id: "storage", name: "File Storage" },
  { id: "hr", name: "HR & Payroll" },
  { id: "analytics", name: "Analytics & Reporting" },
  { id: "other", name: "Other" },
]

// Integration data
const integrations = [
  {
    id: "quickbooks",
    name: "QuickBooks",
    description: "Connect your QuickBooks account to sync financial data, invoices, and expenses.",
    category: "accounting",
    icon: "/generic-accounting-software-logo.png",
    status: "connected",
    popular: true,
  },
  {
    id: "xero",
    name: "Xero",
    description: "Integrate with Xero accounting software for seamless financial management.",
    category: "accounting",
    icon: "/xero-logo.png",
    status: "disconnected",
    popular: true,
  },
  {
    id: "sage",
    name: "Sage",
    description: "Connect with Sage for accounting, payroll, and financial management.",
    category: "accounting",
    icon: "/sage-logo.png",
    status: "disconnected",
    popular: false,
  },
  {
    id: "asana",
    name: "Asana",
    description: "Sync projects and tasks with Asana for streamlined project management.",
    category: "project",
    icon: "/asana-logo.png",
    status: "connected",
    popular: true,
  },
  {
    id: "trello",
    name: "Trello",
    description: "Connect with Trello boards to manage projects and tasks visually.",
    category: "project",
    icon: "/placeholder-dnrof.png",
    status: "disconnected",
    popular: true,
  },
  {
    id: "jira",
    name: "Jira",
    description: "Integrate with Jira for advanced project tracking and issue management.",
    category: "project",
    icon: "/placeholder.svg?height=80&width=80&query=jira+logo",
    status: "disconnected",
    popular: false,
  },
  {
    id: "slack",
    name: "Slack",
    description: "Send notifications and updates to your team's Slack channels.",
    category: "communication",
    icon: "/placeholder.svg?height=80&width=80&query=slack+logo",
    status: "connected",
    popular: true,
  },
  {
    id: "teams",
    name: "Microsoft Teams",
    description: "Integrate with Microsoft Teams for communication and collaboration.",
    category: "communication",
    icon: "/placeholder.svg?height=80&width=80&query=microsoft+teams+logo",
    status: "disconnected",
    popular: true,
  },
  {
    id: "discord",
    name: "Discord",
    description: "Connect with Discord for team communication and notifications.",
    category: "communication",
    icon: "/placeholder.svg?height=80&width=80&query=discord+logo",
    status: "disconnected",
    popular: false,
  },
  {
    id: "salesforce",
    name: "Salesforce",
    description: "Sync client data and opportunities with Salesforce CRM.",
    category: "crm",
    icon: "/placeholder.svg?height=80&width=80&query=salesforce+logo",
    status: "disconnected",
    popular: true,
  },
  {
    id: "hubspot",
    name: "HubSpot",
    description: "Connect with HubSpot for CRM, marketing, and sales integration.",
    category: "crm",
    icon: "/placeholder.svg?height=80&width=80&query=hubspot+logo",
    status: "disconnected",
    popular: true,
  },
  {
    id: "zoho",
    name: "Zoho CRM",
    description: "Integrate with Zoho CRM to manage client relationships.",
    category: "crm",
    icon: "/placeholder.svg?height=80&width=80&query=zoho+logo",
    status: "disconnected",
    popular: false,
  },
  {
    id: "google-calendar",
    name: "Google Calendar",
    description: "Sync project schedules and events with Google Calendar.",
    category: "calendar",
    icon: "/placeholder.svg?height=80&width=80&query=google+calendar+logo",
    status: "connected",
    popular: true,
  },
  {
    id: "outlook",
    name: "Outlook Calendar",
    description: "Integrate with Outlook Calendar for scheduling and reminders.",
    category: "calendar",
    icon: "/placeholder.svg?height=80&width=80&query=outlook+logo",
    status: "disconnected",
    popular: true,
  },
  {
    id: "dropbox",
    name: "Dropbox",
    description: "Connect with Dropbox to store and share project files.",
    category: "storage",
    icon: "/placeholder.svg?height=80&width=80&query=dropbox+logo",
    status: "disconnected",
    popular: true,
  },
  {
    id: "google-drive",
    name: "Google Drive",
    description: "Integrate with Google Drive for document storage and collaboration.",
    category: "storage",
    icon: "/placeholder.svg?height=80&width=80&query=google+drive+logo",
    status: "connected",
    popular: true,
  },
  {
    id: "onedrive",
    name: "OneDrive",
    description: "Connect with Microsoft OneDrive for file storage and sharing.",
    category: "storage",
    icon: "/placeholder.svg?height=80&width=80&query=onedrive+logo",
    status: "disconnected",
    popular: false,
  },
  {
    id: "adp",
    name: "ADP",
    description: "Integrate with ADP for payroll and HR management.",
    category: "hr",
    icon: "/placeholder.svg?height=80&width=80&query=adp+logo",
    status: "disconnected",
    popular: true,
  },
  {
    id: "bamboo-hr",
    name: "BambooHR",
    description: "Connect with BambooHR for employee data and HR processes.",
    category: "hr",
    icon: "/placeholder.svg?height=80&width=80&query=bamboohr+logo",
    status: "disconnected",
    popular: false,
  },
  {
    id: "google-analytics",
    name: "Google Analytics",
    description: "Integrate with Google Analytics for website and app analytics.",
    category: "analytics",
    icon: "/placeholder.svg?height=80&width=80&query=google+analytics+logo",
    status: "disconnected",
    popular: true,
  },
  {
    id: "power-bi",
    name: "Power BI",
    description: "Connect with Microsoft Power BI for advanced data visualization.",
    category: "analytics",
    icon: "/placeholder.svg?height=80&width=80&query=power+bi+logo",
    status: "disconnected",
    popular: false,
  },
  {
    id: "zapier",
    name: "Zapier",
    description: "Connect JobSight Pro with thousands of apps through Zapier.",
    category: "other",
    icon: "/placeholder.svg?height=80&width=80&query=zapier+logo",
    status: "connected",
    popular: true,
  },
  {
    id: "ifttt",
    name: "IFTTT",
    description: "Automate workflows between JobSight Pro and other services.",
    category: "other",
    icon: "/placeholder.svg?height=80&width=80&query=ifttt+logo",
    status: "disconnected",
    popular: false,
  },
]

export default function IntegrationsSettingsPage() {
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [showConnected, setShowConnected] = useState(false)
  const [showPopular, setShowPopular] = useState(false)
  const [selectedIntegration, setSelectedIntegration] = useState<string | null>(null)
  const [isConfiguring, setIsConfiguring] = useState(false)

  // Filter integrations based on category, search query, and filters
  const filteredIntegrations = integrations.filter((integration) => {
    const matchesCategory = selectedCategory === "all" || integration.category === selectedCategory
    const matchesSearch =
      searchQuery === "" ||
      integration.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      integration.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesConnected = !showConnected || integration.status === "connected"
    const matchesPopular = !showPopular || integration.popular

    return matchesCategory && matchesSearch && matchesConnected && matchesPopular
  })

  // Get the selected integration details
  const integrationDetails = selectedIntegration
    ? integrations.find((integration) => integration.id === selectedIntegration)
    : null

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="flex items-center gap-2">
          <Link href="/dashboard/settings" className="btn btn-ghost btn-sm">
            <i className="fas fa-arrow-left"></i>
          </Link>
          <h1 className="text-2xl font-bold">API Integrations</h1>
        </div>
        <button className="btn btn-primary">
          <i className="fas fa-plus mr-2"></i> Add Custom Integration
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left sidebar - Categories */}
        <div className="lg:col-span-1">
          <div className="card bg-base-100 shadow-sm mb-6">
            <div className="card-body">
              <h2 className="card-title">Categories</h2>
              <div className="divider mt-0"></div>
              <ul className="menu bg-base-100 w-full p-0">
                {categories.map((category) => (
                  <li key={category.id}>
                    <a
                      className={selectedCategory === category.id ? "active" : ""}
                      onClick={() => setSelectedCategory(category.id)}
                    >
                      {category.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="card bg-base-100 shadow-sm">
            <div className="card-body">
              <h2 className="card-title">Filters</h2>
              <div className="divider mt-0"></div>
              <div className="form-control">
                <label className="label cursor-pointer justify-start gap-2">
                  <input
                    type="checkbox"
                    className="checkbox"
                    checked={showConnected}
                    onChange={() => setShowConnected(!showConnected)}
                  />
                  <span className="label-text">Connected Only</span>
                </label>
              </div>
              <div className="form-control">
                <label className="label cursor-pointer justify-start gap-2">
                  <input
                    type="checkbox"
                    className="checkbox"
                    checked={showPopular}
                    onChange={() => setShowPopular(!showPopular)}
                  />
                  <span className="label-text">Popular Only</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Right content - Integrations */}
        <div className="lg:col-span-3">
          {/* Search */}
          <div className="mb-6">
            <div className="form-control">
              <div className="input-group">
                <input
                  type="text"
                  placeholder="Search integrations..."
                  className="input input-bordered w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button className="btn btn-square">
                  <i className="fas fa-search"></i>
                </button>
              </div>
            </div>
          </div>

          {/* Integration cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredIntegrations.map((integration) => (
              <div
                key={integration.id}
                className="card bg-base-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => {
                  setSelectedIntegration(integration.id)
                  setIsConfiguring(false)
                }}
              >
                <div className="card-body p-4">
                  <div className="flex items-center gap-3">
                    <div className="avatar">
                      <div className="w-12 h-12 rounded-lg">
                        <Image
                          src={integration.icon || "/placeholder.svg"}
                          alt={integration.name}
                          width={48}
                          height={48}
                        />
                      </div>
                    </div>
                    <div>
                      <h2 className="card-title text-base">{integration.name}</h2>
                      <div
                        className={`badge badge-sm ${
                          integration.status === "connected" ? "badge-success" : "badge-outline"
                        }`}
                      >
                        {integration.status === "connected" ? "Connected" : "Not Connected"}
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-base-content/70 mt-2 line-clamp-2">{integration.description}</p>
                </div>
              </div>
            ))}
          </div>

          {filteredIntegrations.length === 0 && (
            <div className="bg-base-100 p-8 rounded-lg shadow-sm text-center">
              <i className="fas fa-plug text-5xl text-base-content/30 mb-4"></i>
              <h3 className="text-lg font-semibold mb-2">No Integrations Found</h3>
              <p className="text-base-content/70 mb-6">
                No integrations match your current search criteria. Try adjusting your filters or search query.
              </p>
              <button
                className="btn btn-primary"
                onClick={() => {
                  setSelectedCategory("all")
                  setSearchQuery("")
                  setShowConnected(false)
                  setShowPopular(false)
                }}
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Integration details modal */}
      {selectedIntegration && integrationDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="modal-box max-w-3xl">
            <button
              className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
              onClick={() => setSelectedIntegration(null)}
            >
              ✕
            </button>

            {!isConfiguring ? (
              <>
                <div className="flex items-center gap-4 mb-4">
                  <div className="avatar">
                    <div className="w-16 h-16 rounded-lg">
                      <Image
                        src={integrationDetails.icon || "/placeholder.svg"}
                        alt={integrationDetails.name}
                        width={64}
                        height={64}
                      />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{integrationDetails.name}</h3>
                    <div
                      className={`badge ${
                        integrationDetails.status === "connected" ? "badge-success" : "badge-outline"
                      }`}
                    >
                      {integrationDetails.status === "connected" ? "Connected" : "Not Connected"}
                    </div>
                  </div>
                </div>

                <p className="py-4">{integrationDetails.description}</p>

                <div className="bg-base-200 p-4 rounded-lg mb-6">
                  <h4 className="font-semibold mb-2">Features</h4>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Automatic data synchronization</li>
                    <li>Bidirectional updates</li>
                    <li>Custom field mapping</li>
                    <li>Scheduled sync intervals</li>
                    <li>Error notifications and logging</li>
                  </ul>
                </div>

                {integrationDetails.status === "connected" ? (
                  <div className="space-y-4">
                    <div className="bg-base-200 p-4 rounded-lg">
                      <h4 className="font-semibold mb-2">Connection Details</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2">
                        <div>
                          <span className="text-sm text-base-content/70">Connected Account</span>
                          <div>johnsonconstruction@example.com</div>
                        </div>
                        <div>
                          <span className="text-sm text-base-content/70">Connected On</span>
                          <div>May 15, 2025</div>
                        </div>
                        <div>
                          <span className="text-sm text-base-content/70">Last Sync</span>
                          <div>Today at 9:45 AM</div>
                        </div>
                        <div>
                          <span className="text-sm text-base-content/70">Sync Frequency</span>
                          <div>Every 30 minutes</div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between">
                      <button className="btn btn-outline" onClick={() => setIsConfiguring(true)}>
                        <i className="fas fa-cog mr-2"></i> Configure
                      </button>
                      <div className="space-x-2">
                        <button className="btn btn-outline">
                          <i className="fas fa-sync-alt mr-2"></i> Sync Now
                        </button>
                        <button className="btn btn-outline btn-error">
                          <i className="fas fa-unlink mr-2"></i> Disconnect
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-end">
                    <button className="btn btn-primary" onClick={() => setIsConfiguring(true)}>
                      <i className="fas fa-plug mr-2"></i> Connect
                    </button>
                  </div>
                )}
              </>
            ) : (
              <>
                <h3 className="font-bold text-lg mb-4">
                  {integrationDetails.status === "connected" ? "Configure" : "Connect"} {integrationDetails.name}
                </h3>

                <div className="space-y-4">
                  {integrationDetails.status !== "connected" && (
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Authentication Method</span>
                      </label>
                      <select className="select select-bordered w-full">
                        <option>OAuth 2.0</option>
                        <option>API Key</option>
                        <option>Username/Password</option>
                      </select>
                    </div>
                  )}

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Sync Frequency</span>
                    </label>
                    <select className="select select-bordered w-full">
                      <option>Real-time (webhook)</option>
                      <option>Every 15 minutes</option>
                      <option>Every 30 minutes</option>
                      <option>Hourly</option>
                      <option>Daily</option>
                      <option>Manual only</option>
                    </select>
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Data to Sync</span>
                    </label>
                    <div className="space-y-2">
                      <label className="label cursor-pointer justify-start gap-2">
                        <input type="checkbox" className="checkbox" defaultChecked />
                        <span className="label-text">Projects</span>
                      </label>
                      <label className="label cursor-pointer justify-start gap-2">
                        <input type="checkbox" className="checkbox" defaultChecked />
                        <span className="label-text">Tasks</span>
                      </label>
                      <label className="label cursor-pointer justify-start gap-2">
                        <input type="checkbox" className="checkbox" defaultChecked />
                        <span className="label-text">Clients</span>
                      </label>
                      <label className="label cursor-pointer justify-start gap-2">
                        <input type="checkbox" className="checkbox" defaultChecked />
                        <span className="label-text">Invoices</span>
                      </label>
                      <label className="label cursor-pointer justify-start gap-2">
                        <input type="checkbox" className="checkbox" />
                        <span className="label-text">Equipment</span>
                      </label>
                      <label className="label cursor-pointer justify-start gap-2">
                        <input type="checkbox" className="checkbox" />
                        <span className="label-text">Crews</span>
                      </label>
                    </div>
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Sync Direction</span>
                    </label>
                    <select className="select select-bordered w-full">
                      <option>Bidirectional (both systems)</option>
                      <option>JobSight Pro to {integrationDetails.name}</option>
                      <option>{integrationDetails.name} to JobSight Pro</option>
                    </select>
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Conflict Resolution</span>
                    </label>
                    <select className="select select-bordered w-full">
                      <option>JobSight Pro takes precedence</option>
                      <option>{integrationDetails.name} takes precedence</option>
                      <option>Most recently updated wins</option>
                      <option>Ask me for each conflict</option>
                    </select>
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Error Notifications</span>
                    </label>
                    <select className="select select-bordered w-full">
                      <option>Email and in-app notifications</option>
                      <option>Email only</option>
                      <option>In-app only</option>
                      <option>None</option>
                    </select>
                  </div>
                </div>

                <div className="modal-action">
                  <button className="btn btn-outline" onClick={() => setIsConfiguring(false)}>
                    Cancel
                  </button>
                  <button className="btn btn-primary">
                    {integrationDetails.status === "connected" ? "Save Changes" : "Connect"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* API Keys section */}
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">API Keys</h2>
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <p className="mb-4">
              Use these API keys to access the JobSight Pro API directly or to authenticate custom integrations.
            </p>

            <div className="overflow-x-auto">
              <table className="table w-full">
                <thead>
                  <tr>
                    <th>Key Name</th>
                    <th>Created</th>
                    <th>Last Used</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Production API Key</td>
                    <td>May 10, 2025</td>
                    <td>Today at 8:30 AM</td>
                    <td>
                      <div className="badge badge-success">Active</div>
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button className="btn btn-xs btn-outline">
                          <i className="fas fa-eye"></i>
                        </button>
                        <button className="btn btn-xs btn-outline btn-error">
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td>Development API Key</td>
                    <td>May 12, 2025</td>
                    <td>Yesterday at 2:15 PM</td>
                    <td>
                      <div className="badge badge-success">Active</div>
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button className="btn btn-xs btn-outline">
                          <i className="fas fa-eye"></i>
                        </button>
                        <button className="btn btn-xs btn-outline btn-error">
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td>Testing API Key</td>
                    <td>May 5, 2025</td>
                    <td>May 15, 2025</td>
                    <td>
                      <div className="badge badge-error">Revoked</div>
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button className="btn btn-xs btn-outline" disabled>
                          <i className="fas fa-eye"></i>
                        </button>
                        <button className="btn btn-xs btn-outline btn-error">
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-4">
              <button className="btn btn-outline btn-sm">
                <i className="fas fa-plus mr-2"></i> Generate New API Key
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Webhooks section */}
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">Webhooks</h2>
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <p className="mb-4">
              Webhooks allow external services to receive notifications when events occur in your JobSight Pro account.
            </p>

            <div className="overflow-x-auto">
              <table className="table w-full">
                <thead>
                  <tr>
                    <th>Webhook Name</th>
                    <th>URL</th>
                    <th>Events</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Project Updates</td>
                    <td className="truncate max-w-xs">https://example.com/webhooks/jobsight/projects</td>
                    <td>project.created, project.updated</td>
                    <td>
                      <div className="badge badge-success">Active</div>
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button className="btn btn-xs btn-outline">
                          <i className="fas fa-edit"></i>
                        </button>
                        <button className="btn btn-xs btn-outline btn-error">
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td>Invoice Notifications</td>
                    <td className="truncate max-w-xs">https://example.com/webhooks/jobsight/invoices</td>
                    <td>invoice.created, invoice.paid</td>
                    <td>
                      <div className="badge badge-success">Active</div>
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button className="btn btn-xs btn-outline">
                          <i className="fas fa-edit"></i>
                        </button>
                        <button className="btn btn-xs btn-outline btn-error">
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-4">
              <button className="btn btn-outline btn-sm">
                <i className="fas fa-plus mr-2"></i> Add Webhook
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Developer Resources section */}
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">Developer Resources</h2>
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="card bg-base-200">
                <div className="card-body p-4">
                  <h3 className="card-title text-base">
                    <i className="fas fa-book mr-2"></i> API Documentation
                  </h3>
                  <p className="text-sm">Comprehensive documentation for the JobSight Pro API.</p>
                  <div className="card-actions justify-end mt-2">
                    <button className="btn btn-sm btn-outline">View Docs</button>
                  </div>
                </div>
              </div>

              <div className="card bg-base-200">
                <div className="card-body p-4">
                  <h3 className="card-title text-base">
                    <i className="fas fa-code mr-2"></i> Code Samples
                  </h3>
                  <p className="text-sm">Example code in various languages to help you get started.</p>
                  <div className="card-actions justify-end mt-2">
                    <button className="btn btn-sm btn-outline">View Samples</button>
                  </div>
                </div>
              </div>

              <div className="card bg-base-200">
                <div className="card-body p-4">
                  <h3 className="card-title text-base">
                    <i className="fas fa-question-circle mr-2"></i> Developer Support
                  </h3>
                  <p className="text-sm">Get help with API integration and development questions.</p>
                  <div className="card-actions justify-end mt-2">
                    <button className="btn btn-sm btn-outline">Contact Support</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
