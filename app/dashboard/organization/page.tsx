"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function OrganizationPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("profile")

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Organization Settings</h1>
          <p className="text-base-content/70">Manage your business profile and team</p>
        </div>
      </div>

      <div className="tabs tabs-boxed bg-base-200 p-1">
        <button
          className={`tab ${activeTab === "profile" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("profile")}
        >
          Business Profile
        </button>
        <button className={`tab ${activeTab === "team" ? "tab-active" : ""}`} onClick={() => setActiveTab("team")}>
          Team Members
        </button>
        <button className={`tab ${activeTab === "roles" ? "tab-active" : ""}`} onClick={() => setActiveTab("roles")}>
          Roles & Permissions
        </button>
        <button
          className={`tab ${activeTab === "billing" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("billing")}
        >
          Billing
        </button>
      </div>

      {activeTab === "profile" && <BusinessProfileTab />}
      {activeTab === "team" && <TeamMembersTab />}
      {activeTab === "roles" && <RolesPermissionsTab />}
      {activeTab === "billing" && <BillingTab />}
    </div>
  )
}

function BusinessProfileTab() {
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: "Acme Construction",
    type: "construction",
    address: "123 Builder St, Construction City, CC 12345",
    phone: "(555) 123-4567",
    email: "info@acmeconstruction.com",
    website: "www.acmeconstruction.com",
    description:
      "Acme Construction is a full-service construction company specializing in commercial and residential projects. With over 20 years of experience, we deliver quality workmanship and exceptional customer service.",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // In a real app, you would save this data to your database
    setIsEditing(false)
    // Show success toast
  }

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <div className="flex justify-between items-center">
          <h2 className="card-title">Business Profile</h2>
          {!isEditing && (
            <button className="btn btn-primary btn-sm" onClick={() => setIsEditing(true)}>
              <i className="fas fa-edit mr-2"></i>
              Edit Profile
            </button>
          )}
        </div>

        {isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Business Name</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="input input-bordered"
                required
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Business Type</span>
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="select select-bordered"
                required
              >
                <option value="construction">Construction</option>
                <option value="electrical">Electrical</option>
                <option value="plumbing">Plumbing</option>
                <option value="hvac">HVAC</option>
                <option value="landscaping">Landscaping</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Business Address</span>
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="input input-bordered"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Phone Number</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="input input-bordered"
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Email Address</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="input input-bordered"
                  required
                />
              </div>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Website</span>
              </label>
              <input
                type="text"
                name="website"
                value={formData.website}
                onChange={handleChange}
                className="input input-bordered"
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Business Description</span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="textarea textarea-bordered h-24"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button type="button" className="btn btn-ghost" onClick={() => setIsEditing(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Save Changes
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-lg">Business Information</h3>
                <div className="mt-2 space-y-2">
                  <div>
                    <span className="font-medium">Name:</span> {formData.name}
                  </div>
                  <div>
                    <span className="font-medium">Type:</span>{" "}
                    {formData.type.charAt(0).toUpperCase() + formData.type.slice(1)}
                  </div>
                  <div>
                    <span className="font-medium">Address:</span> {formData.address}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-lg">Contact Information</h3>
                <div className="mt-2 space-y-2">
                  <div>
                    <span className="font-medium">Phone:</span> {formData.phone}
                  </div>
                  <div>
                    <span className="font-medium">Email:</span> {formData.email}
                  </div>
                  <div>
                    <span className="font-medium">Website:</span> {formData.website}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <h3 className="font-semibold text-lg">Description</h3>
              <p className="mt-2">{formData.description}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function TeamMembersTab() {
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState("member")
  const [teamMembers, setTeamMembers] = useState([
    { id: 1, name: "John Doe", email: "john.doe@example.com", role: "Admin", status: "Active", avatar: null },
    {
      id: 2,
      name: "Jane Smith",
      email: "jane.smith@example.com",
      role: "Project Manager",
      status: "Active",
      avatar: null,
    },
    {
      id: 3,
      name: "Bob Johnson",
      email: "bob.johnson@example.com",
      role: "Field Worker",
      status: "Active",
      avatar: null,
    },
    {
      id: 4,
      name: "Alice Williams",
      email: "alice.williams@example.com",
      role: "Office Staff",
      status: "Pending",
      avatar: null,
    },
  ])

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault()
    // In a real app, you would send an invitation email
    setTeamMembers([
      ...teamMembers,
      {
        id: teamMembers.length + 1,
        name: inviteEmail.split("@")[0],
        email: inviteEmail,
        role: inviteRole.charAt(0).toUpperCase() + inviteRole.slice(1),
        status: "Pending",
        avatar: null,
      },
    ])
    setInviteEmail("")
    setInviteRole("member")
    setShowInviteModal(false)
  }

  const handleRemoveMember = (id: number) => {
    setTeamMembers(teamMembers.filter((member) => member.id !== id))
  }

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <div className="flex justify-between items-center">
          <h2 className="card-title">Team Members</h2>
          <button className="btn btn-primary btn-sm" onClick={() => setShowInviteModal(true)}>
            <i className="fas fa-user-plus mr-2"></i>
            Invite Member
          </button>
        </div>

        <div className="overflow-x-auto mt-4">
          <table className="table table-zebra w-full">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {teamMembers.map((member) => (
                <tr key={member.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="avatar">
                        <div className="w-10 rounded-full">
                          {member.avatar ? (
                            <img src={member.avatar || "/placeholder.svg"} alt={member.name} />
                          ) : (
                            <div className="bg-primary text-primary-content flex items-center justify-center h-full text-lg font-semibold">
                              {member.name.charAt(0)}
                            </div>
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="font-bold">{member.name}</div>
                      </div>
                    </div>
                  </td>
                  <td>{member.email}</td>
                  <td>{member.role}</td>
                  <td>
                    <div className={`badge ${member.status === "Active" ? "badge-success" : "badge-warning"}`}>
                      {member.status}
                    </div>
                  </td>
                  <td>
                    <div className="flex gap-2">
                      <button className="btn btn-ghost btn-xs">
                        <i className="fas fa-edit"></i>
                      </button>
                      <button className="btn btn-ghost btn-xs text-error" onClick={() => handleRemoveMember(member.id)}>
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Invite Modal */}
        {showInviteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="modal-box">
              <h3 className="font-bold text-lg">Invite Team Member</h3>
              <form onSubmit={handleInvite} className="mt-4 space-y-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Email Address</span>
                  </label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="input input-bordered"
                    placeholder="colleague@example.com"
                    required
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Role</span>
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="select select-bordered"
                    required
                  >
                    <option value="admin">Admin</option>
                    <option value="project_manager">Project Manager</option>
                    <option value="field_worker">Field Worker</option>
                    <option value="office_staff">Office Staff</option>
                    <option value="member">Member</option>
                  </select>
                </div>

                <div className="modal-action">
                  <button type="button" className="btn btn-ghost" onClick={() => setShowInviteModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Send Invitation
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function RolesPermissionsTab() {
  const [roles, setRoles] = useState([
    {
      id: 1,
      name: "Admin",
      description: "Full access to all features",
      permissions: {
        projects: { create: true, read: true, update: true, delete: true },
        tasks: { create: true, read: true, update: true, delete: true },
        crews: { create: true, read: true, update: true, delete: true },
        equipment: { create: true, read: true, update: true, delete: true },
        invoices: { create: true, read: true, update: true, delete: true },
        settings: { create: true, read: true, update: true, delete: true },
      },
    },
    {
      id: 2,
      name: "Project Manager",
      description: "Manage projects, tasks, and crews",
      permissions: {
        projects: { create: true, read: true, update: true, delete: false },
        tasks: { create: true, read: true, update: true, delete: true },
        crews: { create: true, read: true, update: true, delete: false },
        equipment: { create: false, read: true, update: true, delete: false },
        invoices: { create: true, read: true, update: true, delete: false },
        settings: { create: false, read: true, update: false, delete: false },
      },
    },
    {
      id: 3,
      name: "Field Worker",
      description: "Update tasks and daily logs",
      permissions: {
        projects: { create: false, read: true, update: false, delete: false },
        tasks: { create: false, read: true, update: true, delete: false },
        crews: { create: false, read: true, update: false, delete: false },
        equipment: { create: false, read: true, update: true, delete: false },
        invoices: { create: false, read: false, update: false, delete: false },
        settings: { create: false, read: false, update: false, delete: false },
      },
    },
    {
      id: 4,
      name: "Office Staff",
      description: "Manage invoices and reports",
      permissions: {
        projects: { create: false, read: true, update: false, delete: false },
        tasks: { create: false, read: true, update: false, delete: false },
        crews: { create: false, read: true, update: false, delete: false },
        equipment: { create: false, read: true, update: false, delete: false },
        invoices: { create: true, read: true, update: true, delete: false },
        settings: { create: false, read: true, update: false, delete: false },
      },
    },
  ])

  const [selectedRole, setSelectedRole] = useState<number | null>(null)
  const [showRoleModal, setShowRoleModal] = useState(false)
  const [newRoleName, setNewRoleName] = useState("")
  const [newRoleDescription, setNewRoleDescription] = useState("")

  const handleAddRole = (e: React.FormEvent) => {
    e.preventDefault()
    // In a real app, you would save this to your database
    setRoles([
      ...roles,
      {
        id: roles.length + 1,
        name: newRoleName,
        description: newRoleDescription,
        permissions: {
          projects: { create: false, read: true, update: false, delete: false },
          tasks: { create: false, read: true, update: false, delete: false },
          crews: { create: false, read: true, update: false, delete: false },
          equipment: { create: false, read: true, update: false, delete: false },
          invoices: { create: false, read: true, update: false, delete: false },
          settings: { create: false, read: false, update: false, delete: false },
        },
      },
    ])
    setNewRoleName("")
    setNewRoleDescription("")
    setShowRoleModal(false)
  }

  const togglePermission = (roleId: number, module: string, action: string) => {
    setRoles(
      roles.map((role) => {
        if (role.id === roleId) {
          return {
            ...role,
            permissions: {
              ...role.permissions,
              [module]: {
                ...role.permissions[module as keyof typeof role.permissions],
                [action]:
                  !role.permissions[module as keyof typeof role.permissions][
                    action as keyof (typeof role.permissions)[keyof typeof role.permissions]
                  ],
              },
            },
          }
        }
        return role
      }),
    )
  }

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <div className="flex justify-between items-center">
          <h2 className="card-title">Roles & Permissions</h2>
          <button className="btn btn-primary btn-sm" onClick={() => setShowRoleModal(true)}>
            <i className="fas fa-plus mr-2"></i>
            Add Role
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
          <div className="md:col-span-1 space-y-2">
            <h3 className="font-semibold">Available Roles</h3>
            <ul className="menu bg-base-200 rounded-box">
              {roles.map((role) => (
                <li key={role.id}>
                  <a className={selectedRole === role.id ? "active" : ""} onClick={() => setSelectedRole(role.id)}>
                    {role.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-3">
            {selectedRole ? (
              <div>
                {roles
                  .filter((r) => r.id === selectedRole)
                  .map((role) => (
                    <div key={role.id}>
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="text-xl font-bold">{role.name}</h3>
                          <p className="text-base-content/70">{role.description}</p>
                        </div>
                        <button className="btn btn-ghost btn-sm">
                          <i className="fas fa-edit mr-2"></i>
                          Edit Role
                        </button>
                      </div>

                      <div className="divider"></div>

                      <h4 className="font-semibold mb-4">Permissions</h4>

                      <div className="overflow-x-auto">
                        <table className="table table-zebra w-full">
                          <thead>
                            <tr>
                              <th>Module</th>
                              <th className="text-center">Create</th>
                              <th className="text-center">View</th>
                              <th className="text-center">Edit</th>
                              <th className="text-center">Delete</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries(role.permissions).map(([module, actions]) => (
                              <tr key={module}>
                                <td className="font-medium">{module.charAt(0).toUpperCase() + module.slice(1)}</td>
                                <td className="text-center">
                                  <input
                                    type="checkbox"
                                    className="checkbox checkbox-primary checkbox-sm"
                                    checked={actions.create}
                                    onChange={() => togglePermission(role.id, module, "create")}
                                  />
                                </td>
                                <td className="text-center">
                                  <input
                                    type="checkbox"
                                    className="checkbox checkbox-primary checkbox-sm"
                                    checked={actions.read}
                                    onChange={() => togglePermission(role.id, module, "read")}
                                  />
                                </td>
                                <td className="text-center">
                                  <input
                                    type="checkbox"
                                    className="checkbox checkbox-primary checkbox-sm"
                                    checked={actions.update}
                                    onChange={() => togglePermission(role.id, module, "update")}
                                  />
                                </td>
                                <td className="text-center">
                                  <input
                                    type="checkbox"
                                    className="checkbox checkbox-primary checkbox-sm"
                                    checked={actions.delete}
                                    onChange={() => togglePermission(role.id, module, "delete")}
                                  />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-12">
                <i className="fas fa-user-shield text-4xl text-base-content/30 mb-4"></i>
                <p className="text-base-content/50">Select a role to view and edit permissions</p>
              </div>
            )}
          </div>
        </div>

        {/* Add Role Modal */}
        {showRoleModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="modal-box">
              <h3 className="font-bold text-lg">Add New Role</h3>
              <form onSubmit={handleAddRole} className="mt-4 space-y-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Role Name</span>
                  </label>
                  <input
                    type="text"
                    value={newRoleName}
                    onChange={(e) => setNewRoleName(e.target.value)}
                    className="input input-bordered"
                    placeholder="e.g. Supervisor"
                    required
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Description</span>
                  </label>
                  <textarea
                    value={newRoleDescription}
                    onChange={(e) => setNewRoleDescription(e.target.value)}
                    className="textarea textarea-bordered"
                    placeholder="Describe the role's responsibilities"
                    required
                  />
                </div>

                <div className="modal-action">
                  <button type="button" className="btn btn-ghost" onClick={() => setShowRoleModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Create Role
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function BillingTab() {
  const [currentPlan, setCurrentPlan] = useState({
    name: "Tier 2",
    price: "$99/month",
    billingCycle: "Monthly",
    nextBillingDate: "June 15, 2025",
    features: [
      "Up to 15 users",
      "Unlimited projects",
      "Advanced reporting",
      "25GB storage",
      "Priority email support",
      "Client portal access",
    ],
  })

  const [paymentMethod, setPaymentMethod] = useState({
    type: "Credit Card",
    last4: "4242",
    expiry: "05/26",
    name: "John Doe",
  })

  const [billingHistory, setBillingHistory] = useState([
    { id: 1, date: "May 15, 2025", amount: "$99.00", status: "Paid", invoice: "#INV-001" },
    { id: 2, date: "April 15, 2025", amount: "$99.00", status: "Paid", invoice: "#INV-002" },
    { id: 3, date: "March 15, 2025", amount: "$99.00", status: "Paid", invoice: "#INV-003" },
  ])

  return (
    <div className="space-y-6">
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">Current Plan</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            <div>
              <div className="bg-base-200 p-6 rounded-lg">
                <h3 className="text-xl font-bold">{currentPlan.name}</h3>
                <p className="text-2xl font-bold mt-2">{currentPlan.price}</p>
                <p className="text-sm text-base-content/70">Billed {currentPlan.billingCycle.toLowerCase()}</p>

                <div className="divider"></div>

                <ul className="space-y-2">
                  {currentPlan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <i className="fas fa-check text-success mt-1 mr-2"></i>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-6 space-y-2">
                  <button className="btn btn-primary w-full">Upgrade Plan</button>
                  <button className="btn btn-outline w-full">Cancel Subscription</button>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-4">Billing Information</h3>

              <div className="space-y-4">
                <div>
                  <p className="font-medium">Next Billing Date</p>
                  <p>{currentPlan.nextBillingDate}</p>
                </div>

                <div>
                  <div className="flex justify-between items-center">
                    <p className="font-medium">Payment Method</p>
                    <button className="btn btn-ghost btn-xs">
                      <i className="fas fa-edit"></i>
                    </button>
                  </div>
                  <div className="flex items-center mt-2">
                    <i className="fas fa-credit-card text-xl mr-2"></i>
                    <div>
                      <p>
                        {paymentMethod.type} ending in {paymentMethod.last4}
                      </p>
                      <p className="text-sm text-base-content/70">Expires {paymentMethod.expiry}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center">
                    <p className="font-medium">Billing Address</p>
                    <button className="btn btn-ghost btn-xs">
                      <i className="fas fa-edit"></i>
                    </button>
                  </div>
                  <p className="mt-2">123 Builder St, Construction City, CC 12345</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">Billing History</h2>

          <div className="overflow-x-auto mt-4">
            <table className="table table-zebra w-full">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Invoice</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {billingHistory.map((item) => (
                  <tr key={item.id}>
                    <td>{item.date}</td>
                    <td>{item.amount}</td>
                    <td>
                      <div className="badge badge-success">{item.status}</div>
                    </td>
                    <td>{item.invoice}</td>
                    <td>
                      <button className="btn btn-ghost btn-xs">
                        <i className="fas fa-download mr-1"></i>
                        PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
