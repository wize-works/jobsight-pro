"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"

// Mock data for team members
const initialTeamMembers = [
  {
    id: "1",
    name: "Alex Johnson",
    email: "alex.johnson@example.com",
    role: "admin",
    department: "Management",
    status: "active",
    lastActive: "2025-05-19T15:30:00Z",
    avatar: "/placeholder.svg?key=3r07g",
  },
  {
    id: "2",
    name: "Sarah Williams",
    email: "sarah.williams@example.com",
    role: "manager",
    department: "Project Management",
    status: "active",
    lastActive: "2025-05-19T14:45:00Z",
    avatar: "/placeholder.svg?key=cbzq8",
  },
  {
    id: "3",
    name: "Michael Brown",
    email: "michael.brown@example.com",
    role: "user",
    department: "Construction",
    status: "active",
    lastActive: "2025-05-19T13:15:00Z",
    avatar: "/placeholder.svg?key=bvdcr",
  },
  {
    id: "4",
    name: "Emily Davis",
    email: "emily.davis@example.com",
    role: "user",
    department: "Engineering",
    status: "active",
    lastActive: "2025-05-19T12:30:00Z",
    avatar: "/placeholder.svg?key=iudt3",
  },
  {
    id: "5",
    name: "David Wilson",
    email: "david.wilson@example.com",
    role: "manager",
    department: "Finance",
    status: "active",
    lastActive: "2025-05-19T11:45:00Z",
    avatar: "/placeholder.svg?key=wqp1j",
  },
  {
    id: "6",
    name: "Jennifer Martinez",
    email: "jennifer.martinez@example.com",
    role: "user",
    department: "Human Resources",
    status: "inactive",
    lastActive: "2025-05-15T09:30:00Z",
    avatar: "/placeholder.svg?key=euef0",
  },
  {
    id: "7",
    name: "Robert Taylor",
    email: "robert.taylor@example.com",
    role: "user",
    department: "Construction",
    status: "pending",
    lastActive: null,
    avatar: "/placeholder.svg?key=avwzk",
  },
]

// Role options
const roles = [
  { value: "admin", label: "Administrator", description: "Full access to all features and settings" },
  { value: "manager", label: "Manager", description: "Can manage projects, crews, and view reports" },
  { value: "user", label: "User", description: "Standard user with limited access" },
]

// Department options
const departments = [
  { value: "Management", label: "Management" },
  { value: "Project Management", label: "Project Management" },
  { value: "Construction", label: "Construction" },
  { value: "Engineering", label: "Engineering" },
  { value: "Finance", label: "Finance" },
  { value: "Human Resources", label: "Human Resources" },
  { value: "Sales", label: "Sales" },
  { value: "Marketing", label: "Marketing" },
  { value: "IT", label: "IT" },
  { value: "Legal", label: "Legal" },
]

export default function TeamSettingsPage() {
  const [teamMembers, setTeamMembers] = useState(initialTeamMembers)
  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState<string | null>(null)
  const [departmentFilter, setDepartmentFilter] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [isAddingMember, setIsAddingMember] = useState(false)
  const [newMember, setNewMember] = useState({
    name: "",
    email: "",
    role: "user",
    department: "",
    status: "pending",
  })

  // Filter team members based on search query and filters
  const filteredTeamMembers = teamMembers.filter((member) => {
    const matchesSearch =
      searchQuery === "" ||
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesRole = roleFilter === null || member.role === roleFilter
    const matchesDepartment = departmentFilter === null || member.department === departmentFilter
    const matchesStatus = statusFilter === null || member.status === statusFilter

    return matchesSearch && matchesRole && matchesDepartment && matchesStatus
  })

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never"
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
    })
  }

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setNewMember({ ...newMember, [name]: value })
  }

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const newId = (Math.max(...teamMembers.map((m) => Number.parseInt(m.id))) + 1).toString()
    const memberToAdd = {
      ...newMember,
      id: newId,
      lastActive: null,
      avatar: `/placeholder.svg?height=200&width=200&query=avatar${newId}`,
    }
    setTeamMembers([...teamMembers, memberToAdd])
    setNewMember({
      name: "",
      email: "",
      role: "user",
      department: "",
      status: "pending",
    })
    setIsAddingMember(false)
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="flex items-center gap-2">
          <Link href="/dashboard/settings" className="btn btn-ghost btn-sm">
            <i className="fas fa-arrow-left"></i>
          </Link>
          <h1 className="text-2xl font-bold">Team Members</h1>
        </div>
        <button className="btn btn-primary" onClick={() => setIsAddingMember(true)}>
          <i className="fas fa-user-plus mr-2"></i> Add Team Member
        </button>
      </div>

      {/* Search and filters */}
      <div className="bg-base-100 p-4 rounded-lg shadow-sm mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="form-control flex-1">
            <div className="input-group">
              <input
                type="text"
                placeholder="Search team members..."
                className="input input-bordered w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button className="btn btn-square">
                <i className="fas fa-search"></i>
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <select
              className="select select-bordered"
              value={roleFilter || ""}
              onChange={(e) => setRoleFilter(e.target.value || null)}
            >
              <option value="">All Roles</option>
              {roles.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>

            <select
              className="select select-bordered"
              value={departmentFilter || ""}
              onChange={(e) => setDepartmentFilter(e.target.value || null)}
            >
              <option value="">All Departments</option>
              {departments.map((dept) => (
                <option key={dept.value} value={dept.value}>
                  {dept.label}
                </option>
              ))}
            </select>

            <select
              className="select select-bordered"
              value={statusFilter || ""}
              onChange={(e) => setStatusFilter(e.target.value || null)}
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>
      </div>

      {/* Team members table */}
      <div className="bg-base-100 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Department</th>
                <th>Status</th>
                <th>Last Active</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTeamMembers.map((member) => (
                <tr key={member.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="avatar">
                        <div className="w-8 rounded-full">
                          <Image src={member.avatar || "/placeholder.svg"} alt={member.name} width={32} height={32} />
                        </div>
                      </div>
                      <div>{member.name}</div>
                    </div>
                  </td>
                  <td>{member.email}</td>
                  <td>
                    <div className="badge badge-outline">
                      {roles.find((r) => r.value === member.role)?.label || member.role}
                    </div>
                  </td>
                  <td>{member.department}</td>
                  <td>
                    <div
                      className={`badge ${member.status === "active" ? "badge-success" : member.status === "pending" ? "badge-warning" : "badge-error"}`}
                    >
                      {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                    </div>
                  </td>
                  <td>{formatDate(member.lastActive)}</td>
                  <td>
                    <div className="dropdown dropdown-end">
                      <div tabIndex={0} role="button" className="btn btn-ghost btn-xs">
                        <i className="fas fa-ellipsis-v"></i>
                      </div>
                      <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
                        <li>
                          <a>
                            <i className="fas fa-edit mr-2"></i> Edit
                          </a>
                        </li>
                        <li>
                          <a>
                            <i className="fas fa-key mr-2"></i> Reset Password
                          </a>
                        </li>
                        <li>
                          <a>
                            <i
                              className={`fas fa-${member.status === "active" ? "user-slash" : "user-check"} mr-2`}
                            ></i>
                            {member.status === "active" ? "Deactivate" : "Activate"}
                          </a>
                        </li>
                        <li>
                          <a className="text-error">
                            <i className="fas fa-trash mr-2"></i> Remove
                          </a>
                        </li>
                      </ul>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredTeamMembers.length === 0 && (
        <div className="bg-base-100 p-8 rounded-lg shadow-sm text-center mt-6">
          <i className="fas fa-users text-5xl text-base-content/30 mb-4"></i>
          <h3 className="text-lg font-semibold mb-2">No Team Members Found</h3>
          <p className="text-base-content/70 mb-6">
            No team members match your current search criteria. Try adjusting your filters or add a new team member.
          </p>
          <button className="btn btn-primary" onClick={() => setIsAddingMember(true)}>
            <i className="fas fa-user-plus mr-2"></i> Add Team Member
          </button>
        </div>
      )}

      {/* Add team member modal */}
      {isAddingMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="modal-box max-w-2xl">
            <h3 className="font-bold text-lg mb-4">Add Team Member</h3>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Full Name</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    className="input input-bordered"
                    value={newMember.name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Email Address</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    className="input input-bordered"
                    value={newMember.email}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Role</span>
                  </label>
                  <select
                    name="role"
                    className="select select-bordered w-full"
                    value={newMember.role}
                    onChange={handleChange}
                    required
                  >
                    {roles.map((role) => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                  <label className="label">
                    <span className="label-text-alt">{roles.find((r) => r.value === newMember.role)?.description}</span>
                  </label>
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Department</span>
                  </label>
                  <select
                    name="department"
                    className="select select-bordered w-full"
                    value={newMember.department}
                    onChange={handleChange}
                    required
                  >
                    <option value="" disabled>
                      Select Department
                    </option>
                    {departments.map((dept) => (
                      <option key={dept.value} value={dept.value}>
                        {dept.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-control mt-4">
                <label className="label cursor-pointer justify-start gap-2">
                  <input
                    type="checkbox"
                    className="checkbox"
                    checked={newMember.status === "active"}
                    onChange={(e) => setNewMember({ ...newMember, status: e.target.checked ? "active" : "pending" })}
                  />
                  <span className="label-text">Activate user immediately</span>
                </label>
              </div>

              <div className="modal-action">
                <button type="button" className="btn btn-outline" onClick={() => setIsAddingMember(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Add Team Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Role permissions section */}
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">Role Permissions</h2>
        <div className="bg-base-100 rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead>
                <tr>
                  <th>Permission</th>
                  <th className="text-center">Administrator</th>
                  <th className="text-center">Manager</th>
                  <th className="text-center">User</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>View Dashboard</td>
                  <td className="text-center">
                    <i className="fas fa-check text-success"></i>
                  </td>
                  <td className="text-center">
                    <i className="fas fa-check text-success"></i>
                  </td>
                  <td className="text-center">
                    <i className="fas fa-check text-success"></i>
                  </td>
                </tr>
                <tr>
                  <td>Manage Projects</td>
                  <td className="text-center">
                    <i className="fas fa-check text-success"></i>
                  </td>
                  <td className="text-center">
                    <i className="fas fa-check text-success"></i>
                  </td>
                  <td className="text-center">
                    <i className="fas fa-times text-error"></i>
                  </td>
                </tr>
                <tr>
                  <td>Manage Crews</td>
                  <td className="text-center">
                    <i className="fas fa-check text-success"></i>
                  </td>
                  <td className="text-center">
                    <i className="fas fa-check text-success"></i>
                  </td>
                  <td className="text-center">
                    <i className="fas fa-times text-error"></i>
                  </td>
                </tr>
                <tr>
                  <td>Manage Equipment</td>
                  <td className="text-center">
                    <i className="fas fa-check text-success"></i>
                  </td>
                  <td className="text-center">
                    <i className="fas fa-check text-success"></i>
                  </td>
                  <td className="text-center">
                    <i className="fas fa-times text-error"></i>
                  </td>
                </tr>
                <tr>
                  <td>Manage Clients</td>
                  <td className="text-center">
                    <i className="fas fa-check text-success"></i>
                  </td>
                  <td className="text-center">
                    <i className="fas fa-check text-success"></i>
                  </td>
                  <td className="text-center">
                    <i className="fas fa-times text-error"></i>
                  </td>
                </tr>
                <tr>
                  <td>Create/Edit Invoices</td>
                  <td className="text-center">
                    <i className="fas fa-check text-success"></i>
                  </td>
                  <td className="text-center">
                    <i className="fas fa-check text-success"></i>
                  </td>
                  <td className="text-center">
                    <i className="fas fa-times text-error"></i>
                  </td>
                </tr>
                <tr>
                  <td>View Reports</td>
                  <td className="text-center">
                    <i className="fas fa-check text-success"></i>
                  </td>
                  <td className="text-center">
                    <i className="fas fa-check text-success"></i>
                  </td>
                  <td className="text-center">
                    <i className="fas fa-times text-error"></i>
                  </td>
                </tr>
                <tr>
                  <td>Manage Team Members</td>
                  <td className="text-center">
                    <i className="fas fa-check text-success"></i>
                  </td>
                  <td className="text-center">
                    <i className="fas fa-times text-error"></i>
                  </td>
                  <td className="text-center">
                    <i className="fas fa-times text-error"></i>
                  </td>
                </tr>
                <tr>
                  <td>Manage Organization Settings</td>
                  <td className="text-center">
                    <i className="fas fa-check text-success"></i>
                  </td>
                  <td className="text-center">
                    <i className="fas fa-times text-error"></i>
                  </td>
                  <td className="text-center">
                    <i className="fas fa-times text-error"></i>
                  </td>
                </tr>
                <tr>
                  <td>Manage Billing & Subscription</td>
                  <td className="text-center">
                    <i className="fas fa-check text-success"></i>
                  </td>
                  <td className="text-center">
                    <i className="fas fa-times text-error"></i>
                  </td>
                  <td className="text-center">
                    <i className="fas fa-times text-error"></i>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { toast } from "@/hooks/use-toast"
import { getUsers, updateUser, deleteUser } from "@/app/actions/users"
import { User } from "@/types/users"

export default function TeamSettingsPage() {
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(true)
    const [editingUser, setEditingUser] = useState<User | null>(null)
    const [showInviteModal, setShowInviteModal] = useState(false)
    const [inviteData, setInviteData] = useState({
        email: "",
        role: "worker",
        department: ""
    })

    useEffect(() => {
        loadUsers()
    }, [])

    const loadUsers = async () => {
        try {
            const fetchedUsers = await getUsers()
            setUsers(fetchedUsers)
        } catch (error) {
            console.error("Error loading users:", error)
            toast({ title: "Error", description: "Failed to load team members", variant: "destructive" })
        } finally {
            setLoading(false)
        }
    }

    const handleUpdateUser = async (userId: string, updates: Partial<User>) => {
        try {
            await updateUser(userId, updates)
            await loadUsers()
            setEditingUser(null)
            toast({ title: "Success", description: "Team member updated successfully" })
        } catch (error) {
            console.error("Error updating user:", error)
            toast({ title: "Error", description: "Failed to update team member", variant: "destructive" })
        }
    }

    const handleDeleteUser = async (userId: string) => {
        if (!confirm("Are you sure you want to remove this team member?")) return

        try {
            await deleteUser(userId)
            await loadUsers()
            toast({ title: "Success", description: "Team member removed successfully" })
        } catch (error) {
            console.error("Error deleting user:", error)
            toast({ title: "Error", description: "Failed to remove team member", variant: "destructive" })
        }
    }

    const handleInvite = () => {
        // In a real implementation, this would send an invitation email
        toast({ title: "Feature Coming Soon", description: "Team invitations will be available soon" })
        setShowInviteModal(false)
        setInviteData({ email: "", role: "worker", department: "" })
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <span className="loading loading-spinner loading-lg"></span>
            </div>
        )
    }

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div className="flex items-center gap-2">
                    <Link href="/dashboard/settings" className="btn btn-ghost btn-sm">
                        <i className="fas fa-arrow-left"></i>
                    </Link>
                    <h1 className="text-2xl font-bold">Team Management</h1>
                </div>
                <button 
                    className="btn btn-primary"
                    onClick={() => setShowInviteModal(true)}
                >
                    <i className="fas fa-plus mr-2"></i>
                    Invite Team Member
                </button>
            </div>

            <div className="space-y-6">
                {/* Team Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="stat bg-base-100 shadow">
                        <div className="stat-title">Total Members</div>
                        <div className="stat-value text-primary">{users.length}</div>
                    </div>
                    <div className="stat bg-base-100 shadow">
                        <div className="stat-title">Active Members</div>
                        <div className="stat-value text-success">{users.filter(u => u.status === 'active').length}</div>
                    </div>
                    <div className="stat bg-base-100 shadow">
                        <div className="stat-title">Pending Invites</div>
                        <div className="stat-value text-warning">0</div>
                    </div>
                </div>

                {/* Team Members List */}
                <div className="card bg-base-100 shadow-lg">
                    <div className="card-body">
                        <h2 className="card-title text-xl mb-4">Team Members</h2>
                        
                        <div className="overflow-x-auto">
                            <table className="table table-zebra">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Role</th>
                                        <th>Department</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((user) => (
                                        <tr key={user.id}>
                                            <td>
                                                <div className="flex items-center gap-3">
                                                    <div className="avatar placeholder">
                                                        <div className="bg-neutral text-neutral-content rounded-full w-8">
                                                            <span className="text-xs">
                                                                {user.first_name?.charAt(0) || 'U'}
                                                                {user.last_name?.charAt(0) || ''}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="font-bold">
                                                            {user.first_name} {user.last_name}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>{user.email}</td>
                                            <td>
                                                <span className="badge badge-outline capitalize">
                                                    {user.role || 'No Role'}
                                                </span>
                                            </td>
                                            <td>{user.department || 'N/A'}</td>
                                            <td>
                                                <span className={`badge ${
                                                    user.status === 'active' ? 'badge-success' : 
                                                    user.status === 'inactive' ? 'badge-error' : 'badge-warning'
                                                }`}>
                                                    {user.status || 'Active'}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="flex gap-2">
                                                    <button
                                                        className="btn btn-sm btn-ghost"
                                                        onClick={() => setEditingUser(user)}
                                                    >
                                                        <i className="fas fa-edit"></i>
                                                    </button>
                                                    <button
                                                        className="btn btn-sm btn-ghost text-error"
                                                        onClick={() => handleDeleteUser(user.id)}
                                                    >
                                                        <i className="fas fa-trash"></i>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit User Modal */}
            {editingUser && (
                <div className="modal modal-open">
                    <div className="modal-box">
                        <h3 className="font-bold text-lg mb-4">Edit Team Member</h3>
                        
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text">First Name</span>
                                    </label>
                                    <input
                                        type="text"
                                        className="input input-bordered"
                                        value={editingUser.first_name || ""}
                                        onChange={(e) => setEditingUser({...editingUser, first_name: e.target.value})}
                                    />
                                </div>
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text">Last Name</span>
                                    </label>
                                    <input
                                        type="text"
                                        className="input input-bordered"
                                        value={editingUser.last_name || ""}
                                        onChange={(e) => setEditingUser({...editingUser, last_name: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Role</span>
                                </label>
                                <select
                                    className="select select-bordered"
                                    value={editingUser.role || ""}
                                    onChange={(e) => setEditingUser({...editingUser, role: e.target.value})}
                                >
                                    <option value="">Select Role</option>
                                    <option value="admin">Administrator</option>
                                    <option value="manager">Project Manager</option>
                                    <option value="foreman">Foreman</option>
                                    <option value="worker">Worker</option>
                                    <option value="office">Office Staff</option>
                                </select>
                            </div>

                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Department</span>
                                </label>
                                <input
                                    type="text"
                                    className="input input-bordered"
                                    value={editingUser.department || ""}
                                    onChange={(e) => setEditingUser({...editingUser, department: e.target.value})}
                                />
                            </div>
                        </div>

                        <div className="modal-action">
                            <button 
                                className="btn btn-ghost" 
                                onClick={() => setEditingUser(null)}
                            >
                                Cancel
                            </button>
                            <button 
                                className="btn btn-primary"
                                onClick={() => handleUpdateUser(editingUser.id, editingUser)}
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Invite Modal */}
            {showInviteModal && (
                <div className="modal modal-open">
                    <div className="modal-box">
                        <h3 className="font-bold text-lg mb-4">Invite Team Member</h3>
                        
                        <div className="space-y-4">
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Email Address</span>
                                </label>
                                <input
                                    type="email"
                                    className="input input-bordered"
                                    value={inviteData.email}
                                    onChange={(e) => setInviteData({...inviteData, email: e.target.value})}
                                    placeholder="Enter email address"
                                />
                            </div>

                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Role</span>
                                </label>
                                <select
                                    className="select select-bordered"
                                    value={inviteData.role}
                                    onChange={(e) => setInviteData({...inviteData, role: e.target.value})}
                                >
                                    <option value="worker">Worker</option>
                                    <option value="foreman">Foreman</option>
                                    <option value="manager">Project Manager</option>
                                    <option value="office">Office Staff</option>
                                    <option value="admin">Administrator</option>
                                </select>
                            </div>

                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Department</span>
                                </label>
                                <input
                                    type="text"
                                    className="input input-bordered"
                                    value={inviteData.department}
                                    onChange={(e) => setInviteData({...inviteData, department: e.target.value})}
                                    placeholder="Enter department"
                                />
                            </div>
                        </div>

                        <div className="modal-action">
                            <button 
                                className="btn btn-ghost" 
                                onClick={() => setShowInviteModal(false)}
                            >
                                Cancel
                            </button>
                            <button 
                                className="btn btn-primary"
                                onClick={handleInvite}
                                disabled={!inviteData.email}
                            >
                                Send Invitation
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
