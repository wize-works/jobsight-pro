"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

// Mock data for clients
const mockClients = [
  {
    id: "1",
    name: "Acme Construction",
    contactName: "John Smith",
    email: "john@acmeconstruction.com",
    phone: "(555) 123-4567",
    status: "Active",
    projects: 3,
    lastContact: "2023-05-15",
  },
  {
    id: "2",
    name: "BuildRight Inc.",
    contactName: "Sarah Johnson",
    email: "sarah@buildright.com",
    phone: "(555) 234-5678",
    status: "Active",
    projects: 2,
    lastContact: "2023-05-10",
  },
  {
    id: "3",
    name: "Metro Developers",
    contactName: "Michael Brown",
    email: "michael@metrodevelopers.com",
    phone: "(555) 345-6789",
    status: "Potential",
    projects: 0,
    lastContact: "2023-05-05",
  },
  {
    id: "4",
    name: "Skyline Properties",
    contactName: "Jessica Williams",
    email: "jessica@skylineproperties.com",
    phone: "(555) 456-7890",
    status: "Past",
    projects: 1,
    lastContact: "2023-04-20",
  },
  {
    id: "5",
    name: "Urban Renovations",
    contactName: "David Miller",
    email: "david@urbanrenovations.com",
    phone: "(555) 567-8901",
    status: "Active",
    projects: 2,
    lastContact: "2023-05-12",
  },
]

export default function ClientsPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")

  // Filter clients based on search term and status
  const filteredClients = mockClients.filter((client) => {
    const matchesSearch =
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "All" || client.status === statusFilter

    return matchesSearch && matchesStatus
  })

  return (
    <div className="container mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Clients</h1>
          <p className="text-base-content/70">Manage your clients and their projects</p>
        </div>
        <button className="btn btn-primary mt-4 md:mt-0" onClick={() => router.push("/dashboard/clients/create")}>
          <i className="fas fa-plus mr-2"></i>
          Add New Client
        </button>
      </div>

      <div className="card bg-base-100 shadow-md">
        <div className="card-body">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="form-control flex-1">
              <div className="input-group">
                <input
                  type="text"
                  placeholder="Search clients..."
                  className="input input-bordered w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button className="btn btn-square">
                  <i className="fas fa-search"></i>
                </button>
              </div>
            </div>
            <select
              className="select select-bordered"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Potential">Potential</option>
              <option value="Past">Past</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="table table-zebra w-full">
              <thead>
                <tr>
                  <th>Client Name</th>
                  <th>Contact Person</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th>Projects</th>
                  <th>Last Contact</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.map((client) => (
                  <tr key={client.id}>
                    <td>
                      <Link href={`/dashboard/clients/${client.id}`} className="font-medium hover:text-primary">
                        {client.name}
                      </Link>
                    </td>
                    <td>{client.contactName}</td>
                    <td>
                      <a href={`mailto:${client.email}`} className="hover:text-primary">
                        {client.email}
                      </a>
                    </td>
                    <td>
                      <a href={`tel:${client.phone}`} className="hover:text-primary">
                        {client.phone}
                      </a>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          client.status === "Active"
                            ? "badge-success"
                            : client.status === "Potential"
                              ? "badge-warning"
                              : "badge-ghost"
                        }`}
                      >
                        {client.status}
                      </span>
                    </td>
                    <td>{client.projects}</td>
                    <td>{new Date(client.lastContact).toLocaleDateString()}</td>
                    <td>
                      <div className="flex gap-2">
                        <Link
                          href={`/dashboard/clients/${client.id}`}
                          className="btn btn-sm btn-ghost btn-square"
                          aria-label="View client details"
                        >
                          <i className="fas fa-eye"></i>
                        </Link>
                        <Link
                          href={`/dashboard/clients/${client.id}/edit`}
                          className="btn btn-sm btn-ghost btn-square"
                          aria-label="Edit client"
                        >
                          <i className="fas fa-edit"></i>
                        </Link>
                        <button className="btn btn-sm btn-ghost btn-square text-error" aria-label="Delete client">
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredClients.length === 0 && (
            <div className="text-center py-4">
              <p className="text-base-content/70">No clients found matching your criteria.</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <div className="card bg-base-100 shadow-md">
          <div className="card-body">
            <h2 className="card-title">
              <i className="fas fa-user-tie text-primary mr-2"></i>
              Client Statistics
            </h2>
            <div className="stats stats-vertical shadow">
              <div className="stat">
                <div className="stat-title">Total Clients</div>
                <div className="stat-value">{mockClients.length}</div>
              </div>
              <div className="stat">
                <div className="stat-title">Active Clients</div>
                <div className="stat-value">{mockClients.filter((client) => client.status === "Active").length}</div>
              </div>
              <div className="stat">
                <div className="stat-title">Potential Clients</div>
                <div className="stat-value">{mockClients.filter((client) => client.status === "Potential").length}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-md">
          <div className="card-body">
            <h2 className="card-title">
              <i className="fas fa-calendar-alt text-primary mr-2"></i>
              Recent Activity
            </h2>
            <ul className="timeline timeline-compact timeline-snap-icon max-md:timeline-compact timeline-vertical">
              <li>
                <div className="timeline-middle">
                  <i className="fas fa-phone text-primary"></i>
                </div>
                <div className="timeline-end mb-4">
                  <time className="font-mono">2 days ago</time>
                  <div className="text-sm">Phone call with Urban Renovations</div>
                </div>
                <hr />
              </li>
              <li>
                <hr />
                <div className="timeline-middle">
                  <i className="fas fa-envelope text-primary"></i>
                </div>
                <div className="timeline-end mb-4">
                  <time className="font-mono">5 days ago</time>
                  <div className="text-sm">Email sent to Acme Construction</div>
                </div>
                <hr />
              </li>
              <li>
                <hr />
                <div className="timeline-middle">
                  <i className="fas fa-handshake text-primary"></i>
                </div>
                <div className="timeline-end mb-4">
                  <time className="font-mono">1 week ago</time>
                  <div className="text-sm">Meeting with BuildRight Inc.</div>
                </div>
              </li>
            </ul>
          </div>
        </div>

        <div className="card bg-base-100 shadow-md">
          <div className="card-body">
            <h2 className="card-title">
              <i className="fas fa-tasks text-primary mr-2"></i>
              Quick Actions
            </h2>
            <div className="flex flex-col gap-2">
              <button className="btn btn-outline btn-block justify-start">
                <i className="fas fa-plus-circle mr-2"></i>
                Add New Client
              </button>
              <button className="btn btn-outline btn-block justify-start">
                <i className="fas fa-file-contract mr-2"></i>
                Create Contract
              </button>
              <button className="btn btn-outline btn-block justify-start">
                <i className="fas fa-envelope mr-2"></i>
                Send Email Campaign
              </button>
              <button className="btn btn-outline btn-block justify-start">
                <i className="fas fa-file-export mr-2"></i>
                Export Client List
              </button>
              <button className="btn btn-outline btn-block justify-start">
                <i className="fas fa-chart-line mr-2"></i>
                View Client Reports
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
