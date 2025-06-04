"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useKindeAuth } from "@kinde-oss/kinde-auth-nextjs"
import { toast } from "@/hooks/use-toast"
import { updateUser, getUserById } from "@/app/actions/users"
import { User } from "@/types/users"

export default function AccountSettingsPage() {
    const { user } = useKindeAuth()
    const [userData, setUserData] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [formData, setFormData] = useState({
        first_name: "",
        last_name: "",
        email: "",
        phone_number: "",
        role: "",
        department: "",
        timezone: "America/Los_Angeles",
        language: "en",
        date_format: "MM/dd/yyyy",
        time_format: "12h"
    })

    useEffect(() => {
        async function loadUserData() {
            if (user?.id) {
                try {
                    const fetchedUser = await getUserById(user.id)
                    if (fetchedUser) {
                        setUserData(fetchedUser)
                        setFormData({
                            first_name: fetchedUser.first_name || "",
                            last_name: fetchedUser.last_name || "",
                            email: fetchedUser.email || "",
                            phone_number: fetchedUser.phone_number || "",
                            role: fetchedUser.role || "",
                            department: fetchedUser.department || "",
                            timezone: fetchedUser.timezone || "America/Los_Angeles",
                            language: fetchedUser.language || "en",
                            date_format: fetchedUser.date_format || "MM/dd/yyyy",
                            time_format: "12h"
                        })
                    }
                } catch (error) {
                    console.error("Error loading user data:", error)
                    toast({ title: "Error", description: "Failed to load user data", variant: "destructive" })
                } finally {
                    setLoading(false)
                }
            }
        }

        loadUserData()
    }, [user?.id])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user?.id) return

        setSaving(true)
        try {
            await updateUser(user.id, formData)
            toast({ title: "Success", description: "Account settings updated successfully" })
        } catch (error) {
            console.error("Error updating user:", error)
            toast({ title: "Error", description: "Failed to update account settings", variant: "destructive" })
        } finally {
            setSaving(false)
        }
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
                    <h1 className="text-2xl font-bold">Account Settings</h1>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Personal Information */}
                <div className="card bg-base-100 shadow-lg">
                    <div className="card-body">
                        <h2 className="card-title text-xl mb-4">Personal Information</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text font-medium">First Name</span>
                                </label>
                                <input
                                    type="text"
                                    className="input input-bordered"
                                    value={formData.first_name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                                />
                            </div>

                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text font-medium">Last Name</span>
                                </label>
                                <input
                                    type="text"
                                    className="input input-bordered"
                                    value={formData.last_name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                                />
                            </div>

                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text font-medium">Email</span>
                                </label>
                                <input
                                    type="email"
                                    className="input input-bordered"
                                    value={formData.email}
                                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                />
                            </div>

                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text font-medium">Phone Number</span>
                                </label>
                                <input
                                    type="tel"
                                    className="input input-bordered"
                                    value={formData.phone_number}
                                    onChange={(e) => setFormData(prev => ({ ...prev, phone_number: e.target.value }))}
                                />
                            </div>

                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text font-medium">Role</span>
                                </label>
                                <select
                                    className="select select-bordered"
                                    value={formData.role}
                                    onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
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
                                    <span className="label-text font-medium">Department</span>
                                </label>
                                <input
                                    type="text"
                                    className="input input-bordered"
                                    value={formData.department}
                                    onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Preferences */}
                <div className="card bg-base-100 shadow-lg">
                    <div className="card-body">
                        <h2 className="card-title text-xl mb-4">Preferences</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text font-medium">Timezone</span>
                                </label>
                                <select
                                    className="select select-bordered"
                                    value={formData.timezone}
                                    onChange={(e) => setFormData(prev => ({ ...prev, timezone: e.target.value }))}
                                >
                                    <option value="America/Los_Angeles">Pacific Time (UTC-8)</option>
                                    <option value="America/Denver">Mountain Time (UTC-7)</option>
                                    <option value="America/Chicago">Central Time (UTC-6)</option>
                                    <option value="America/New_York">Eastern Time (UTC-5)</option>
                                    <option value="UTC">UTC</option>
                                </select>
                            </div>

                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text font-medium">Language</span>
                                </label>
                                <select
                                    className="select select-bordered"
                                    value={formData.language}
                                    onChange={(e) => setFormData(prev => ({ ...prev, language: e.target.value }))}
                                >
                                    <option value="en">English</option>
                                    <option value="es">Spanish</option>
                                    <option value="fr">French</option>
                                </select>
                            </div>

                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text font-medium">Date Format</span>
                                </label>
                                <select
                                    className="select select-bordered"
                                    value={formData.date_format}
                                    onChange={(e) => setFormData(prev => ({ ...prev, date_format: e.target.value }))}
                                >
                                    <option value="MM/dd/yyyy">MM/dd/yyyy</option>
                                    <option value="dd/MM/yyyy">dd/MM/yyyy</option>
                                    <option value="yyyy-MM-dd">yyyy-MM-dd</option>
                                </select>
                            </div>

                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text font-medium">Time Format</span>
                                </label>
                                <select
                                    className="select select-bordered"
                                    value={formData.time_format}
                                    onChange={(e) => setFormData(prev => ({ ...prev, time_format: e.target.value }))}
                                >
                                    <option value="12h">12 Hour</option>
                                    <option value="24h">24 Hour</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end">
                    <button 
                        type="submit" 
                        className="btn btn-primary"
                        disabled={saving}
                    >
                        {saving && <span className="loading loading-spinner loading-sm"></span>}
                        Save Changes
                    </button>
                </div>
            </form>
        </div>
    )
}