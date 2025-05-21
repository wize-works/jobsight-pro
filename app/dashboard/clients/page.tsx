"use client"

import { useState } from "react"
import Link from "next/link"

// Mock data for clients
const initialClients = [
  {
    id: "client1",
    name: "Oakridge Development Corp",
    type: "Commercial Developer",
    contactName: "Robert Chen",
    contactEmail: "robert.chen@oakridge.com",
    contactPhone: "(555) 123-4567",
    address: "1200 Market Street, Suite 500, Philadelphia, PA 19107",
    status: "active",
    totalProjects: 3,
    activeProjects: 2,
    totalValue: 1250000,
    image: "/client-logos/oakridge-development.png",
    notes: "Long-term client since 2020. Prefers weekly progress updates.",
  },
  {
    id: "client2",
    name: "Riverside Properties LLC",
    type: "Residential Developer",
    contactName: "Sarah Johnson",
    contactEmail: "sjohnson@riversideproperties.com",
    contactPhone: "(555) 234-5678",
    address: "450 Waterfront Drive, Pittsburgh, PA 15222",
    status: "active",
    totalProjects: 2,
    activeProjects: 1,
    totalValue: 850000,
    image: "/client-logos/riverside-properties.png",
    notes: "Focused on high-end residential developments. Very detail-oriented.",
  },
  {
    id: "client3",
    name: "Metro City Government",
    type: "Government",
    contactName: "Michael Williams",
    contactEmail: "m.williams@metrocity.gov",
    contactPhone: "(555) 345-6789",
    address: "100 City Hall Plaza, Metro City, PA 18001",
    status: "active",
    totalProjects: 1,
    activeProjects: 1,
    totalValue: 2750000,
    image: "/client-logos/metro-city-government.png",
    notes: "Requires detailed documentation and strict adherence to regulations.",
  },
  {
    id: "client4",
    name: "Greenfield Homes",
    type: "Residential Builder",
    contactName: "Jessica Martinez",
    contactEmail: "jmartinez@greenfieldhomes.com",
    contactPhone: "(555) 456-7890",
    address: "789 Builder Way, Greenfield, PA 17025",
    status: "inactive",
    totalProjects: 4,
    activeProjects: 0,
    totalValue: 1450000,
    image: "/client-logos/greenfield-homes.png",
    notes: "Previous projects completed successfully. Currently no active projects.",
  },
  {
    id: "client5",
    name: "Sunrise Senior Living",
    type: "Healthcare",
    contactName: "David Thompson",
    contactEmail: "dthompson@sunrisesenior.com",
    contactPhone: "(555) 567-8901",
    address: "2500 Sunrise Boulevard, Harrisburg, PA 17110",
    status: "active",
    totalProjects: 1,
    activeProjects: 1,
    totalValue: 3200000,
    image: "/client-logos/sunrise-senior-living.png",
    notes: "Specialized requirements for senior living facilities. Strict safety protocols.",
  },
  {
    id: "client6",
    name: "TechHub Innovations",
    type: "Commercial",
    contactName: "Amanda Lee",
    contactEmail: "alee@techhub.com",
    contactPhone: "(555) 678-9012",
    address: "350 Technology Drive, Pittsburgh, PA 15219",
    status: "active",
    totalProjects: 1,
    activeProjects: 1,
    totalValue: 1850000,
    image: "/client-logos/techhub-innovations.png",
    notes: "Tech company with specific requirements for office space. Emphasis on modern design.",
  },
  {
    id: "client7",
    name: "Parkview School District",
    type: "Education",
    contactName: "Thomas Wilson",
    contactEmail: "twilson@parkviewsd.edu",
    contactPhone: "(555) 789-0123",
    address: "400 Education Lane, Parkview, PA 16802",
    status: "active",
    totalProjects: 2,
    activeProjects: 1,
    totalValue: 4500000,
    image: "/client-logos/parkview-school-district.png",
    notes: "School renovation projects. Work must be scheduled around academic calendar.",
  },
  {
    id: "client8",
    name: "Mountainside Resorts",
    type: "Hospitality",
    contactName: "Jennifer Adams",
    contactEmail: "jadams@mountainside.com",
    contactPhone: "(555) 890-1234",
    address: "1800 Mountain Road, Seven Springs, PA 15622",
    status: "prospect",
    totalProjects: 0,
    activeProjects: 0,
    totalValue: 0,
    image: "/client-logos/mountainside-resorts.png",
    notes: "Potential client interested in resort expansion. Initial meetings conducted.",
  },
  {
    id: "client9",
    name: "Eastside Community Center",
    type: "Non-Profit",
    contactName: "Marcus Johnson",
    contactEmail: "mjohnson@eastsidecenter.org",
    contactPhone: "(555) 901-2345",
    address: "500 Community Way, Philadelphia, PA 19122",
    status: "active",
    totalProjects: 1,
    activeProjects: 1,
    totalValue: 950000,
    image: "/client-logos/eastside-community-center.png",
    notes: "Grant-funded project with strict budget constraints. Community involvement important.",
  },
  {
    id: "client10",
    name: "Retail Plaza Investments",
    type: "Commercial Developer",
    contactName: "Sophia Garcia",
    contactEmail: "sgarcia@retailplaza.com",
    contactPhone: "(555) 012-3456",
    address: "2200 Shopping Center Blvd, Allentown, PA 18104",
    status: "inactive",
    totalProjects: 3,
    activeProjects: 0,
    totalValue: 2100000,
    image: "/client-logos/retail-plaza-investments.png",
    notes: "Previous retail development projects. Currently evaluating future opportunities.",
  },
]

// Status options with colors and labels
const statusOptions = {
  active: { label: "Active", color: "badge-success" },
  inactive: { label: "Inactive", color: "badge-neutral" },
  prospect: { label: "Prospect", color: "badge-warning" },
}

export default function ClientsPage() {
  const [clients, setClients] = useState(initialClients)
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [showAddClientModal, setShowAddClientModal] = useState(false)
  const [newClient, setNewClient] = useState({
    name: "",
    type: "Commercial",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    address: "",
    status: "prospect",
  })

  // Filter clients based on search term, type, and status
  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.contactEmail.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = typeFilter === "all" || client.type.includes(typeFilter)
    const matchesStatus = statusFilter === "all" || client.status === statusFilter
    return matchesSearch && matchesType && matchesStatus
  })

  // Get unique client types for filter dropdown
  const clientTypes = ["all", ...new Set(clients.map((client) => client.type.split(" ")[0]))]

  const handleAddClient = () => {
    const client = {
      id: `client${clients.length + 1}`,
      ...newClient,
      totalProjects: 0,
      activeProjects: 0,
      totalValue: 0,
      image: `/placeholder.svg?height=100&width=100&query=${encodeURIComponent(newClient.name)}+logo`,
      notes: "",
    }
    setClients([...clients, client])
    setNewClient({
      name: "",
      type: "Commercial",
      contactName: "",
      contactEmail: "",
      contactPhone: "",
      address: "",
      status: "prospect",
    })
    setShowAddClientModal(false)
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Client Management</h1>
        <button className="btn btn-primary" onClick={() => setShowAddClientModal(true)}>
          <i className="fas fa-plus mr-2"></i> Add Client
        </button>
      </div>

      <div className="card bg-base-100 shadow-sm mb-6">
        <div className="card-body">
          <div className="flex flex-col md:flex-row gap-4">
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
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="all">All Types</option>
              {clientTypes
                .filter((type) => type !== "all")
                .map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
            </select>
            <select
              className="select select-bordered"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              {Object.entries(statusOptions).map(([value, { label }]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="table table-zebra w-full">
          <thead>
            <tr>
              <th>Client</th>
              <th>Contact</th>
              <th>Projects</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredClients.map((client) => (
              <tr key={client.id}>
                <td>
                  <div className="flex items-center gap-3">
                    <div className="avatar">
                      <div className="w-12 h-12 rounded-full bg-base-300 flex items-center justify-center">
                        {client.image ? (
                          <img src={client.image || "/placeholder.svg"} alt={`${client.name} logo`} />
                        ) : (
                          <span className="text-lg font-bold">{client.name.charAt(0)}</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="font-bold">{client.name}</div>
                      <div className="text-sm opacity-50">{client.type}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <div>{client.contactName}</div>
                  <div className="text-sm opacity-50">{client.contactEmail}</div>
                  <div className="text-sm opacity-50">{client.contactPhone}</div>
                </td>
                <td>
                  <div>
                    <span className="font-semibold">{client.activeProjects}</span> Active /{" "}
                    <span className="font-semibold">{client.totalProjects}</span> Total
                  </div>
                  <div className="text-sm opacity-50">${client.totalValue.toLocaleString()}</div>
                </td>
                <td>
                  <div className={`badge ${statusOptions[client.status].color}`}>
                    {statusOptions[client.status].label}
                  </div>
                </td>
                <td>
                  <div className="flex gap-2">
                    <Link href={`/dashboard/clients/${client.id}`} className="btn btn-sm btn-outline">
                      View
                    </Link>
                    <button className="btn btn-sm btn-ghost">
                      <i className="fas fa-ellipsis-v"></i>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredClients.length === 0 && (
        <div className="text-center py-12">
          <i className="fas fa-users text-4xl text-base-content/30 mb-4"></i>
          <h3 className="text-xl font-semibold mb-2">No clients found</h3>
          <p className="text-base-content/70">Try adjusting your search or filters</p>
        </div>
      )}

      {/* Add Client Modal */}
      {showAddClientModal && (
        <div className="modal modal-open">
          <div className="modal-box max-w-3xl">
            <h3 className="font-bold text-lg mb-4">Add New Client</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Client Name</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter client name"
                  className="input input-bordered"
                  value={newClient.name}
                  onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Client Type</span>
                </label>
                <select
                  className="select select-bordered"
                  value={newClient.type}
                  onChange={(e) => setNewClient({ ...newClient, type: e.target.value })}
                >
                  <option>Commercial</option>
                  <option>Residential</option>
                  <option>Government</option>
                  <option>Education</option>
                  <option>Healthcare</option>
                  <option>Hospitality</option>
                  <option>Non-Profit</option>
                  <option>Other</option>
                </select>
              </div>
            </div>

            <div className="divider">Contact Information</div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Contact Name</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter primary contact name"
                  className="input input-bordered"
                  value={newClient.contactName}
                  onChange={(e) => setNewClient({ ...newClient, contactName: e.target.value })}
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Contact Email</span>
                </label>
                <input
                  type="email"
                  placeholder="Enter email address"
                  className="input input-bordered"
                  value={newClient.contactEmail}
                  onChange={(e) => setNewClient({ ...newClient, contactEmail: e.target.value })}
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Contact Phone</span>
                </label>
                <input
                  type="tel"
                  placeholder="Enter phone number"
                  className="input input-bordered"
                  value={newClient.contactPhone}
                  onChange={(e) => setNewClient({ ...newClient, contactPhone: e.target.value })}
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Status</span>
                </label>
                <select
                  className="select select-bordered"
                  value={newClient.status}
                  onChange={(e) => setNewClient({ ...newClient, status: e.target.value })}
                >
                  <option value="prospect">Prospect</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="form-control mt-4">
              <label className="label">
                <span className="label-text">Address</span>
              </label>
              <textarea
                className="textarea textarea-bordered"
                placeholder="Enter client address"
                value={newClient.address}
                onChange={(e) => setNewClient({ ...newClient, address: e.target.value })}
              ></textarea>
            </div>

            <div className="modal-action">
              <button className="btn btn-ghost" onClick={() => setShowAddClientModal(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleAddClient}>
                Add Client
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setShowAddClientModal(false)}></div>
        </div>
      )}
    </div>
  )
}
