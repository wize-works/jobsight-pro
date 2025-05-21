"use client"

import { useState } from "react"
import Link from "next/link"

// Mock data for invoices
const mockInvoices = [
  {
    id: "INV-2025-001",
    client: "Oakridge Development",
    clientId: "client1",
    project: "Main Street Development",
    projectId: "proj1",
    amount: 12500.0,
    status: "paid",
    issueDate: "2025-04-15",
    dueDate: "2025-05-15",
    paidDate: "2025-05-10",
  },
  {
    id: "INV-2025-002",
    client: "Riverside Properties",
    clientId: "client2",
    project: "Riverside Apartments",
    projectId: "proj2",
    amount: 18750.0,
    status: "pending",
    issueDate: "2025-04-20",
    dueDate: "2025-05-20",
    paidDate: null,
  },
  {
    id: "INV-2025-003",
    client: "Metro City Government",
    clientId: "client3",
    project: "Downtown Project",
    projectId: "proj3",
    amount: 32000.0,
    status: "overdue",
    issueDate: "2025-03-25",
    dueDate: "2025-04-25",
    paidDate: null,
  },
  {
    id: "INV-2025-004",
    client: "Johnson Family",
    clientId: "client7",
    project: "Johnson Residence",
    projectId: "proj4",
    amount: 5800.0,
    status: "draft",
    issueDate: null,
    dueDate: null,
    paidDate: null,
  },
  {
    id: "INV-2025-005",
    client: "Oakridge Development",
    clientId: "client1",
    project: "Main Street Development",
    projectId: "proj1",
    amount: 15000.0,
    status: "pending",
    issueDate: "2025-05-01",
    dueDate: "2025-06-01",
    paidDate: null,
  },
  {
    id: "INV-2025-006",
    client: "Greenfield Homes",
    clientId: "client4",
    project: "Greenfield Homes Development",
    projectId: "proj5",
    amount: 9200.0,
    status: "paid",
    issueDate: "2025-04-05",
    dueDate: "2025-05-05",
    paidDate: "2025-04-28",
  },
]

// Mock data for clients (for filtering)
const mockClients = [
  { id: "client1", name: "Oakridge Development" },
  { id: "client2", name: "Riverside Properties" },
  { id: "client3", name: "Metro City Government" },
  { id: "client4", name: "Greenfield Homes" },
  { id: "client7", name: "Johnson Family" },
]

// Mock data for projects (for filtering)
const mockProjects = [
  { id: "proj1", name: "Main Street Development" },
  { id: "proj2", name: "Riverside Apartments" },
  { id: "proj3", name: "Downtown Project" },
  { id: "proj4", name: "Johnson Residence" },
  { id: "proj5", name: "Greenfield Homes Development" },
]

export default function InvoicesPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [clientFilter, setClientFilter] = useState<string | null>(null)
  const [projectFilter, setProjectFilter] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState({ start: "", end: "" })
  const [showFilters, setShowFilters] = useState(false)

  // Filter invoices based on search query and filters
  const filteredInvoices = mockInvoices.filter((invoice) => {
    const matchesSearch =
      searchQuery === "" ||
      invoice.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.client.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === null || invoice.status === statusFilter
    const matchesClient = clientFilter === null || invoice.clientId === clientFilter
    const matchesProject = projectFilter === null || invoice.projectId === projectFilter

    let matchesDateRange = true
    if (dateRange.start && invoice.issueDate) {
      matchesDateRange = matchesDateRange && new Date(invoice.issueDate) >= new Date(dateRange.start)
    }
    if (dateRange.end && invoice.issueDate) {
      matchesDateRange = matchesDateRange && new Date(invoice.issueDate) <= new Date(dateRange.end)
    }

    return matchesSearch && matchesStatus && matchesClient && matchesProject && matchesDateRange
  })

  // Calculate totals
  const totalAmount = filteredInvoices.reduce((sum, invoice) => sum + invoice.amount, 0)
  const paidAmount = filteredInvoices
    .filter((invoice) => invoice.status === "paid")
    .reduce((sum, invoice) => sum + invoice.amount, 0)
  const pendingAmount = filteredInvoices
    .filter((invoice) => invoice.status === "pending" || invoice.status === "overdue")
    .reduce((sum, invoice) => sum + invoice.amount, 0)

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount)
  }

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-"
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "paid":
        return "badge-success"
      case "pending":
        return "badge-warning"
      case "overdue":
        return "badge-error"
      case "draft":
        return "badge-ghost"
      default:
        return "badge-ghost"
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold">Invoices</h1>
        <div className="flex gap-2">
          <Link href="/dashboard/invoices/new" className="btn btn-primary">
            <i className="fas fa-plus mr-2"></i> New Invoice
          </Link>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="stats shadow">
          <div className="stat">
            <div className="stat-title">Total Invoices</div>
            <div className="stat-value text-lg">{formatCurrency(totalAmount)}</div>
            <div className="stat-desc">{filteredInvoices.length} invoices</div>
          </div>
        </div>
        <div className="stats shadow">
          <div className="stat">
            <div className="stat-title">Paid</div>
            <div className="stat-value text-lg text-success">{formatCurrency(paidAmount)}</div>
            <div className="stat-desc">
              {filteredInvoices.filter((invoice) => invoice.status === "paid").length} invoices
            </div>
          </div>
        </div>
        <div className="stats shadow">
          <div className="stat">
            <div className="stat-title">Outstanding</div>
            <div className="stat-value text-lg text-warning">{formatCurrency(pendingAmount)}</div>
            <div className="stat-desc">
              {
                filteredInvoices.filter((invoice) => invoice.status === "pending" || invoice.status === "overdue")
                  .length
              }{" "}
              invoices
            </div>
          </div>
        </div>
      </div>

      {/* Search and filters */}
      <div className="bg-base-100 p-4 rounded-lg shadow-sm mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="form-control flex-1">
            <div className="input-group">
              <input
                type="text"
                placeholder="Search invoices..."
                className="input input-bordered w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button className="btn btn-square">
                <i className="fas fa-search"></i>
              </button>
            </div>
          </div>

          <div className="flex gap-2">
            <select
              className="select select-bordered"
              value={statusFilter || ""}
              onChange={(e) => setStatusFilter(e.target.value || null)}
            >
              <option value="">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
            </select>

            <button
              className={`btn ${showFilters ? "btn-primary" : "btn-outline"}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <i className="fas fa-filter mr-2"></i> Filters
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Client</span>
              </label>
              <select
                className="select select-bordered w-full"
                value={clientFilter || ""}
                onChange={(e) => setClientFilter(e.target.value || null)}
              >
                <option value="">All Clients</option>
                {mockClients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Project</span>
              </label>
              <select
                className="select select-bordered w-full"
                value={projectFilter || ""}
                onChange={(e) => setProjectFilter(e.target.value || null)}
              >
                <option value="">All Projects</option>
                {mockProjects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Date Range</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="date"
                  className="input input-bordered w-full"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                />
                <input
                  type="date"
                  className="input input-bordered w-full"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Invoices table */}
      <div className="bg-base-100 rounded-lg shadow-sm overflow-x-auto">
        <table className="table table-zebra w-full">
          <thead>
            <tr>
              <th>Invoice #</th>
              <th>Client</th>
              <th>Project</th>
              <th>Amount</th>
              <th>Issue Date</th>
              <th>Due Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredInvoices.map((invoice) => (
              <tr key={invoice.id}>
                <td>
                  <Link href={`/dashboard/invoices/${invoice.id}`} className="font-medium hover:underline">
                    {invoice.id}
                  </Link>
                </td>
                <td>
                  <Link href={`/dashboard/clients/${invoice.clientId}`} className="hover:underline">
                    {invoice.client}
                  </Link>
                </td>
                <td>
                  <Link href={`/dashboard/projects/${invoice.projectId}`} className="hover:underline">
                    {invoice.project}
                  </Link>
                </td>
                <td>{formatCurrency(invoice.amount)}</td>
                <td>{formatDate(invoice.issueDate)}</td>
                <td>{formatDate(invoice.dueDate)}</td>
                <td>
                  <div className={`badge ${getStatusBadgeColor(invoice.status)}`}>
                    {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                  </div>
                </td>
                <td>
                  <div className="flex gap-2">
                    <Link href={`/dashboard/invoices/${invoice.id}`} className="btn btn-ghost btn-xs">
                      <i className="fas fa-eye"></i>
                    </Link>
                    <Link href={`/dashboard/invoices/${invoice.id}/edit`} className="btn btn-ghost btn-xs">
                      <i className="fas fa-edit"></i>
                    </Link>
                    <div className="dropdown dropdown-end">
                      <div tabIndex={0} role="button" className="btn btn-ghost btn-xs">
                        <i className="fas fa-ellipsis-v"></i>
                      </div>
                      <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
                        <li>
                          <a>
                            <i className="fas fa-paper-plane mr-2"></i> Send Email
                          </a>
                        </li>
                        <li>
                          <a>
                            <i className="fas fa-print mr-2"></i> Print
                          </a>
                        </li>
                        <li>
                          <a>
                            <i className="fas fa-download mr-2"></i> Download PDF
                          </a>
                        </li>
                        <li>
                          <a>
                            <i className="fas fa-copy mr-2"></i> Duplicate
                          </a>
                        </li>
                        <li>
                          <a className="text-error">
                            <i className="fas fa-trash mr-2"></i> Delete
                          </a>
                        </li>
                      </ul>
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
