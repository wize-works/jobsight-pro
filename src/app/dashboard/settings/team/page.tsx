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