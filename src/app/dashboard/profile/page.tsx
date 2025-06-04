"use client"

import { useKindeAuth } from "@kinde-oss/kinde-auth-nextjs";
import { useState, useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import Link from "next/link";

export default function ProfilePage() {
    const { user, isLoading } = useKindeAuth()
    const [isEditing, setIsEditing] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        phone: "",
        jobTitle: "",
        bio: "",
        department: "",
        location: ""
    })

    useEffect(() => {
        if (user) {
            setFormData({
                firstName: user.given_name || "",
                lastName: user.family_name || "",
                phone: "(555) 123-4567", // This would come from your database
                jobTitle: "Project Manager", // This would come from your database
                bio: "Experienced project manager with expertise in construction and team leadership.",
                department: "Construction Management",
                location: "San Francisco, CA"
            })
        }
    }, [user])

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }))
    }

    const handleSaveProfile = async () => {
        setIsSaving(true)
        try {
            // Here you would save the profile data to your database
            await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
            toast({ title: "Success", description: "Profile updated successfully" })
            setIsEditing(false)
        } catch (error) {
            toast({ title: "Error", description: "Failed to update profile", variant: "destructive" })
        } finally {
            setIsSaving(false)
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <span className="loading loading-spinner loading-lg text-primary"></span>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold">My Profile</h1>
                    <p className="text-base-content/70">Manage your personal information and details</p>
                </div>
                <div className="flex gap-2">
                    {!isEditing ? (
                        <button 
                            className="btn btn-primary"
                            onClick={() => setIsEditing(true)}
                        >
                            <i className="fas fa-edit mr-2"></i> Edit Profile
                        </button>
                    ) : (
                        <>
                            <button 
                                className="btn btn-ghost"
                                onClick={() => setIsEditing(false)}
                                disabled={isSaving}
                            >
                                Cancel
                            </button>
                            <button 
                                className="btn btn-primary"
                                onClick={handleSaveProfile}
                                disabled={isSaving}
                            >
                                {isSaving ? (
                                    <>
                                        <span className="loading loading-spinner loading-sm mr-2"></span>
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <i className="fas fa-save mr-2"></i> Save Changes
                                    </>
                                )}
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Quick Settings Links */}
            <div className="alert alert-info">
                <i className="fas fa-info-circle"></i>
                <div>
                    <h3 className="font-semibold">Looking for more settings?</h3>
                    <div className="flex flex-wrap gap-2 mt-2">
                        <Link href="/dashboard/settings/account" className="btn btn-sm btn-outline">
                            <i className="fas fa-cog mr-1"></i> Account Settings
                        </Link>
                        <Link href="/dashboard/settings" className="btn btn-sm btn-outline">
                            <i className="fas fa-bell mr-1"></i> Notifications
                        </Link>
                        <Link href="/dashboard/settings/security" className="btn btn-sm btn-outline">
                            <i className="fas fa-shield-alt mr-1"></i> Security
                        </Link>
                    </div>
                </div>
            </div>

            {/* Profile Information */}
            <div className="card bg-base-100 shadow-lg">
                <div className="card-body">
                    <div className="flex flex-col lg:flex-row gap-8">
                        {/* Avatar Section */}
                        <div className="lg:w-1/3 flex flex-col items-center">
                            <div className="avatar mb-4">
                                <div className="w-32 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                                    <img 
                                        src={user?.picture || "/placeholder-user.jpg"} 
                                        alt="Profile" 
                                        className="object-cover"
                                    />
                                </div>
                            </div>
                            <div className="text-center mb-4">
                                <h3 className="text-lg font-semibold">{user?.given_name} {user?.family_name}</h3>
                                <p className="text-sm text-base-content/70">{user?.email}</p>
                                <div className="badge badge-primary badge-sm mt-2">{formData.jobTitle}</div>
                            </div>
                            {isEditing && (
                                <div className="space-y-2 w-full">
                                    <button className="btn btn-outline btn-sm w-full">
                                        <i className="fas fa-upload mr-2"></i> Upload Photo
                                    </button>
                                    <button className="btn btn-ghost btn-sm text-error w-full">
                                        <i className="fas fa-trash mr-2"></i> Remove Photo
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Form Section */}
                        <div className="lg:w-2/3">
                            <h2 className="text-xl font-semibold mb-6">Personal Information</h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text font-medium">First Name</span>
                                    </label>
                                    <input 
                                        type="text" 
                                        className={`input input-bordered ${!isEditing ? 'input-disabled' : ''}`}
                                        value={formData.firstName}
                                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                                        disabled={!isEditing}
                                    />
                                </div>

                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text font-medium">Last Name</span>
                                    </label>
                                    <input 
                                        type="text" 
                                        className={`input input-bordered ${!isEditing ? 'input-disabled' : ''}`}
                                        value={formData.lastName}
                                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                                        disabled={!isEditing}
                                    />
                                </div>
                            </div>

                            <div className="form-control mt-4">
                                <label className="label">
                                    <span className="label-text font-medium">Email Address</span>
                                </label>
                                <input 
                                    type="email" 
                                    className="input input-bordered input-disabled" 
                                    value={user?.email || ""} 
                                    disabled 
                                />
                                <label className="label">
                                    <span className="label-text-alt text-info">
                                        <i className="fas fa-info-circle mr-1"></i>
                                        Email cannot be changed directly. <Link href="/dashboard/settings/account" className="link">Visit account settings</Link> for more options.
                                    </span>
                                </label>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text font-medium">Phone Number</span>
                                    </label>
                                    <input 
                                        type="tel" 
                                        className={`input input-bordered ${!isEditing ? 'input-disabled' : ''}`}
                                        value={formData.phone}
                                        onChange={(e) => handleInputChange('phone', e.target.value)}
                                        disabled={!isEditing}
                                    />
                                </div>

                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text font-medium">Job Title</span>
                                    </label>
                                    <input 
                                        type="text" 
                                        className={`input input-bordered ${!isEditing ? 'input-disabled' : ''}`}
                                        value={formData.jobTitle}
                                        onChange={(e) => handleInputChange('jobTitle', e.target.value)}
                                        disabled={!isEditing}
                                    />
                                </div>

                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text font-medium">Department</span>
                                    </label>
                                    <input 
                                        type="text" 
                                        className={`input input-bordered ${!isEditing ? 'input-disabled' : ''}`}
                                        value={formData.department}
                                        onChange={(e) => handleInputChange('department', e.target.value)}
                                        disabled={!isEditing}
                                    />
                                </div>

                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text font-medium">Location</span>
                                    </label>
                                    <input 
                                        type="text" 
                                        className={`input input-bordered ${!isEditing ? 'input-disabled' : ''}`}
                                        value={formData.location}
                                        onChange={(e) => handleInputChange('location', e.target.value)}
                                        disabled={!isEditing}
                                    />
                                </div>
                            </div>

                            <div className="form-control mt-4">
                                <label className="label">
                                    <span className="label-text font-medium">Bio</span>
                                </label>
                                <textarea 
                                    className={`textarea textarea-bordered h-24 ${!isEditing ? 'textarea-disabled' : ''}`}
                                    value={formData.bio}
                                    onChange={(e) => handleInputChange('bio', e.target.value)}
                                    disabled={!isEditing}
                                    placeholder="Tell us a bit about yourself..."
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Additional Profile Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Link href="/dashboard/settings/account" className="card bg-base-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                    <div className="card-body">
                        <div className="flex items-center gap-3">
                            <div className="bg-primary bg-opacity-20 p-3 rounded-full">
                                <i className="fas fa-cog text-primary"></i>
                            </div>
                            <div>
                                <h3 className="font-semibold">Account Settings</h3>
                                <p className="text-sm text-base-content/70">Language, timezone, and preferences</p>
                            </div>
                        </div>
                    </div>
                </Link>

                <Link href="/dashboard/settings/security" className="card bg-base-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                    <div className="card-body">
                        <div className="flex items-center gap-3">
                            <div className="bg-success bg-opacity-20 p-3 rounded-full">
                                <i className="fas fa-shield-alt text-success"></i>
                            </div>
                            <div>
                                <h3 className="font-semibold">Security</h3>
                                <p className="text-sm text-base-content/70">Password and two-factor authentication</p>
                            </div>
                        </div>
                    </div>
                </Link>

                <Link href="/dashboard/settings/notifications" className="card bg-base-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                    <div className="card-body">
                        <div className="flex items-center gap-3">
                            <div className="bg-warning bg-opacity-20 p-3 rounded-full">
                                <i className="fas fa-bell text-warning"></i>
                            </div>
                            <div>
                                <h3 className="font-semibold">Notifications</h3>
                                <p className="text-sm text-base-content/70">Email, push, and in-app preferences</p>
                            </div>
                        </div>
                    </div>
                </Link>
            </div>
        </div>
    )
}