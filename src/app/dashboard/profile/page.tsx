
"use client"

import { useKindeAuth } from "@kinde-oss/kinde-auth-nextjs";
import { useState, useEffect } from "react";
import PushManager from "@/components/push-manager";
import { useNotifications } from "@/hooks/use-notifications";
import { notificationTypeOptions } from "@/types/notifications";
import { toast } from "@/hooks/use-toast";

type NotificationType = 'projectUpdates' | 'taskAssignments' | 'equipmentAlerts' | 'invoiceUpdates' | 'systemAnnouncements';
type NotificationChannel = 'email' | 'push' | 'inApp';

interface NotificationPreferences {
    email: boolean;
    push: boolean;
    inApp: boolean;
    types: {
        [K in NotificationType]: {
            [C in NotificationChannel]: boolean;
        };
    };
}

export default function ProfilePage() {
    const { user, isLoading } = useKindeAuth()
    const [activeTab, setActiveTab] = useState("profile")
    const [isEditing, setIsEditing] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        phone: "",
        jobTitle: "",
        language: "English",
        timeZone: "Pacific Time (PT)"
    })
    
    const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreferences>({
        email: true,
        push: false,
        inApp: true,
        types: {
            projectUpdates: { email: true, push: true, inApp: true },
            taskAssignments: { email: true, push: true, inApp: true },
            equipmentAlerts: { email: true, push: true, inApp: true },
            invoiceUpdates: { email: true, push: false, inApp: true },
            systemAnnouncements: { email: true, push: false, inApp: true }
        }
    });

    const { loading: notificationsLoading, preferences, updateGlobalPreferences, updateTypePreferences, sendTestNotification } = useNotifications({
        userId: user?.id || ""
    });

    useEffect(() => {
        if (user) {
            setFormData({
                firstName: user.given_name || "",
                lastName: user.family_name || "",
                phone: "(555) 123-4567", // This would come from your database
                jobTitle: "Project Manager", // This would come from your database
                language: "English",
                timeZone: "Pacific Time (PT)"
            })
        }
    }, [user])

    useEffect(() => {
        if (preferences) {
            setNotificationPreferences(preferences);
        }
    }, [preferences]);

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

    // Handler for updating notification preferences
    const handleNotificationChange = async (
        type: 'general' | NotificationType,
        channel: NotificationChannel,
        value: boolean
    ) => {
        try {
            if (type === 'general') {
                await updateGlobalPreferences(channel, value);
                setNotificationPreferences(prev => ({
                    ...prev,
                    [channel]: value
                }));
            } else {
                await updateTypePreferences(type, channel, value);
                setNotificationPreferences(prev => ({
                    ...prev,
                    types: {
                        ...prev.types,
                        [type]: {
                            ...prev.types[type],
                            [channel]: value
                        }
                    }
                }));
            }
            toast({ title: "Success", description: "Notification preferences updated" })
        } catch (error) {
            console.error("Error updating notification preferences:", error);
            toast({ title: "Error", description: "Failed to update notification preferences", variant: "destructive" })
        }
    };

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
                    <h1 className="text-2xl font-bold">Profile Settings</h1>
                    <p className="text-base-content/70">Manage your personal information and preferences</p>
                </div>
                {activeTab === "profile" && (
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
                )}
            </div>

            {/* Tabs */}
            <div className="tabs tabs-boxed bg-base-200 p-1">
                <button 
                    className={`tab flex-1 ${activeTab === "profile" ? "tab-active" : ""}`} 
                    onClick={() => setActiveTab("profile")}
                >
                    <i className="fas fa-user mr-2"></i>
                    Personal Info
                </button>
                <button 
                    className={`tab flex-1 ${activeTab === "account" ? "tab-active" : ""}`} 
                    onClick={() => setActiveTab("account")}
                >
                    <i className="fas fa-cog mr-2"></i>
                    Account Settings
                </button>
                <button
                    className={`tab flex-1 ${activeTab === "notifications" ? "tab-active" : ""}`}
                    onClick={() => setActiveTab("notifications")}
                >
                    <i className="fas fa-bell mr-2"></i>
                    Notifications
                </button>
            </div>

            {/* Profile Tab */}
            {activeTab === "profile" && (
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
                                            Email cannot be changed directly. Contact support for assistance.
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
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Account Tab */}
            {activeTab === "account" && (
                <div className="space-y-6">
                    {/* General Settings */}
                    <div className="card bg-base-100 shadow-lg">
                        <div className="card-body">
                            <h2 className="card-title text-xl mb-4">General Settings</h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text font-medium">Language</span>
                                    </label>
                                    <select className="select select-bordered">
                                        <option>English</option>
                                        <option>Spanish</option>
                                        <option>French</option>
                                    </select>
                                </div>

                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text font-medium">Time Zone</span>
                                    </label>
                                    <select className="select select-bordered">
                                        <option>Pacific Time (PT)</option>
                                        <option>Mountain Time (MT)</option>
                                        <option>Central Time (CT)</option>
                                        <option>Eastern Time (ET)</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Security Settings */}
                    <div className="card bg-base-100 shadow-lg">
                        <div className="card-body">
                            <h2 className="card-title text-xl mb-4">Security</h2>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 bg-base-200 rounded-lg">
                                    <div>
                                        <h3 className="font-medium">Password</h3>
                                        <p className="text-sm text-base-content/70">Last changed 2 months ago</p>
                                    </div>
                                    <button className="btn btn-outline">
                                        <i className="fas fa-key mr-2"></i> Change Password
                                    </button>
                                </div>

                                <div className="flex items-center justify-between p-4 bg-base-200 rounded-lg">
                                    <div>
                                        <h3 className="font-medium">Two-Factor Authentication</h3>
                                        <p className="text-sm text-base-content/70">Add an extra layer of security</p>
                                    </div>
                                    <button className="btn btn-outline">
                                        <i className="fas fa-shield-alt mr-2"></i> Enable 2FA
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Danger Zone */}
                    <div className="card bg-error/10 border border-error/20 shadow-lg">
                        <div className="card-body">
                            <h2 className="card-title text-error text-xl mb-4">
                                <i className="fas fa-exclamation-triangle mr-2"></i>
                                Danger Zone
                            </h2>
                            <div className="space-y-4">
                                <div>
                                    <h3 className="font-semibold text-error mb-2">Delete Account</h3>
                                    <p className="text-sm mb-4">
                                        Once you delete your account, there is no going back. All your data will be permanently removed.
                                    </p>
                                    <button className="btn btn-error">
                                        <i className="fas fa-trash mr-2"></i> Delete Account
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Notifications Tab */}
            {activeTab === "notifications" && (
                <div className="space-y-6">
                    {/* Global Settings */}
                    <div className="card bg-base-100 shadow-lg">
                        <div className="card-body">
                            <h2 className="card-title text-xl mb-4">Global Notification Settings</h2>

                            <div className="space-y-4">
                                <div className="form-control">
                                    <label className="label cursor-pointer justify-start gap-4">
                                        <input
                                            type="checkbox"
                                            className="toggle toggle-primary"
                                            checked={notificationPreferences.email}
                                            onChange={(e) => handleNotificationChange('general', 'email', e.target.checked)}
                                        />
                                        <div>
                                            <span className="label-text font-medium block">Email Notifications</span>
                                            <span className="text-xs text-base-content/70">
                                                Receive email notifications for important updates
                                            </span>
                                        </div>
                                    </label>
                                </div>

                                <div className="form-control">
                                    <label className="label cursor-pointer justify-start gap-4">
                                        <input
                                            type="checkbox"
                                            className="toggle toggle-primary"
                                            checked={notificationPreferences.push}
                                            onChange={(e) => handleNotificationChange('general', 'push', e.target.checked)}
                                        />
                                        <div>
                                            <span className="label-text font-medium block">Push Notifications</span>
                                            <span className="text-xs text-base-content/70">
                                                Receive push notifications on your device
                                            </span>
                                        </div>
                                    </label>
                                    {notificationPreferences.push && (
                                        <div className="ml-14 mt-2">
                                            <PushManager />
                                        </div>
                                    )}
                                </div>

                                <div className="form-control">
                                    <label className="label cursor-pointer justify-start gap-4">
                                        <input
                                            type="checkbox"
                                            className="toggle toggle-primary"
                                            checked={notificationPreferences.inApp}
                                            onChange={(e) => handleNotificationChange('general', 'inApp', e.target.checked)}
                                        />
                                        <div>
                                            <span className="label-text font-medium block">In-App Notifications</span>
                                            <span className="text-xs text-base-content/70">
                                                Receive notifications within the application
                                            </span>
                                        </div>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Notification Types */}
                    <div className="card bg-base-100 shadow-lg">
                        <div className="card-body">
                            <h2 className="card-title text-xl mb-4">Notification Types</h2>

                            <div className="overflow-x-auto">
                                <table className="table table-zebra">
                                    <thead>
                                        <tr>
                                            <th className="w-1/2">Notification Type</th>
                                            <th className="w-1/6 text-center">Email</th>
                                            <th className="w-1/6 text-center">Push</th>
                                            <th className="w-1/6 text-center">In-App</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(Object.entries(notificationPreferences.types) as [NotificationType, any][]).map(([key, value]) => (
                                            <tr key={key}>
                                                <td className="flex items-center gap-2">
                                                    <span className="font-medium">
                                                        {key.replace(/([A-Z])/g, ' $1').trim()}
                                                    </span>
                                                    <button
                                                        className="btn btn-xs btn-ghost tooltip"
                                                        data-tip="Send test notification"
                                                        onClick={() => sendTestNotification(key as NotificationType)}
                                                    >
                                                        <i className="fas fa-paper-plane"></i>
                                                    </button>
                                                </td>
                                                <td className="text-center">
                                                    <input
                                                        type="checkbox"
                                                        className="checkbox checkbox-primary"
                                                        checked={value.email && notificationPreferences.email}
                                                        disabled={!notificationPreferences.email}
                                                        onChange={(e) => handleNotificationChange(key, 'email', e.target.checked)}
                                                    />
                                                </td>
                                                <td className="text-center">
                                                    <input
                                                        type="checkbox"
                                                        className="checkbox checkbox-primary"
                                                        checked={value.push && notificationPreferences.push}
                                                        disabled={!notificationPreferences.push}
                                                        onChange={(e) => handleNotificationChange(key, 'push', e.target.checked)}
                                                    />
                                                </td>
                                                <td className="text-center">
                                                    <input
                                                        type="checkbox"
                                                        className="checkbox checkbox-primary"
                                                        checked={value.inApp && notificationPreferences.inApp}
                                                        disabled={!notificationPreferences.inApp}
                                                        onChange={(e) => handleNotificationChange(key, 'inApp', e.target.checked)}
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
