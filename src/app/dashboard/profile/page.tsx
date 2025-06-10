"use client"

import { useKindeAuth } from "@kinde-oss/kinde-auth-nextjs";
import { useState, useEffect } from "react";
import PushManager from "@/components/push-manager";
import { useNotifications } from "@/hooks/use-notifications";
import { notificationTypeOptions } from "@/types/notifications";

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
        if (preferences) {
            setNotificationPreferences(preferences);
        }
    }, [preferences]);

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
        } catch (error) {
            console.error("Error updating notification preferences:", error);
            // TODO: Show error toast
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
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Profile Settings</h1>
                <button className="btn btn-primary">
                    <i className="fas fa-save mr-2"></i> Save Changes
                </button>
            </div>

            <div className="tabs tabs-box mb-6">
                <a className={`tab ${activeTab === "profile" ? "tab-active" : ""}`} onClick={() => setActiveTab("profile")}>
                    Personal Info
                </a>
                <a className={`tab ${activeTab === "account" ? "tab-active" : ""}`} onClick={() => setActiveTab("account")}>
                    Account Settings
                </a>
                <a
                    className={`tab ${activeTab === "notifications" ? "tab-active" : ""}`}
                    onClick={() => setActiveTab("notifications")}
                >
                    Notifications
                </a>
            </div>

            {activeTab === "profile" && (
                <div className="card bg-base-100 shadow-sm">
                    <div className="card-body">
                        <div className="flex flex-col md:flex-row gap-8">
                            <div className="md:w-1/3 flex flex-col items-center">
                                <div className="avatar">
                                    <div className="w-32 rounded-full">
                                        <img src={user?.picture || "/placeholder.svg?height=128&width=128&query=avatar"} alt="Profile" />
                                    </div>
                                </div>
                                <div className="mt-4 space-y-6">
                                    <button className="btn btn-outline btn-sm w-full">
                                        <i className="fas fa-upload mr-2"></i> Upload Photo
                                    </button>
                                    <button className="btn btn-ghost btn-sm text-error w-full">
                                        <i className="fas fa-trash mr-2"></i> Remove
                                    </button>
                                </div>
                            </div>

                            <div className="md:w-2/3">
                                <h2 className="text-xl font-semibold mb-4">Personal Information</h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text">First Name</span>
                                        </label>
                                        <input type="text" className="input input-bordered" defaultValue={user?.given_name || ""} />
                                    </div>

                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text">Last Name</span>
                                        </label>
                                        <input type="text" className="input input-bordered" defaultValue={user?.family_name || ""} />
                                    </div>
                                </div>

                                <div className="form-control mt-4">
                                    <label className="label">
                                        <span className="label-text">Email</span>
                                    </label>
                                    <input type="email" className="input input-bordered" defaultValue={user?.email || ""} disabled />
                                    <label className="label">
                                        <span className="label-text-alt">
                                            Email cannot be changed directly. Contact support for assistance.
                                        </span>
                                    </label>
                                </div>

                                <div className="form-control mt-4">
                                    <label className="label">
                                        <span className="label-text">Phone Number</span>
                                    </label>
                                    <input type="tel" className="input input-bordered" defaultValue="(555) 123-4567" />
                                </div>

                                <div className="form-control mt-4">
                                    <label className="label">
                                        <span className="label-text">Job Title</span>
                                    </label>
                                    <input type="text" className="input input-bordered" defaultValue="Project Manager" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === "account" && (
                <div className="card bg-base-100 shadow-sm">
                    <div className="card-body">
                        <h2 className="text-xl font-semibold mb-4">Account Settings</h2>

                        <div className="form-control mt-4">
                            <label className="label">
                                <span className="label-text">Username</span>
                            </label>
                            <input type="text" className="input input-bordered" defaultValue={user?.email || ""} />
                        </div>

                        <div className="form-control mt-4">
                            <label className="label">
                                <span className="label-text">Language</span>
                            </label>
                            <select className="select select-bordered w-full">
                                <option>English</option>
                                <option>Spanish</option>
                                <option>French</option>
                            </select>
                        </div>

                        <div className="form-control mt-4">
                            <label className="label">
                                <span className="label-text">Time Zone</span>
                            </label>
                            <select className="select select-bordered w-full">
                                <option>Pacific Time (PT)</option>
                                <option>Mountain Time (MT)</option>
                                <option>Central Time (CT)</option>
                                <option>Eastern Time (ET)</option>
                            </select>
                        </div>

                        <div className="divider"></div>

                        <h3 className="text-lg font-semibold mb-4">Security</h3>

                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">Change Password</span>
                            </label>
                            <button className="btn btn-outline">
                                <i className="fas fa-key mr-2"></i> Change Password
                            </button>
                        </div>

                        <div className="form-control mt-4">
                            <label className="label">
                                <span className="label-text">Two-Factor Authentication</span>
                            </label>
                            <div className="flex items-center">
                                <button className="btn btn-outline">
                                    <i className="fas fa-shield-alt mr-2"></i> Enable 2FA
                                </button>
                                <span className="ml-4 text-sm text-base-content/70">Not enabled</span>
                            </div>
                        </div>

                        <div className="divider"></div>

                        <h3 className="text-lg font-semibold mb-4">Danger Zone</h3>

                        <div className="bg-error/10 p-4 rounded-lg">
                            <h4 className="font-semibold text-error">Delete Account</h4>
                            <p className="text-sm mb-4">Once you delete your account, there is no going back. Please be certain.</p>
                            <button className="btn btn-error">
                                <i className="fas fa-trash mr-2"></i> Delete Account
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === "notifications" && (
                <div className="card bg-base-100 shadow-sm">
                    <div className="card-body">
                        <h2 className="text-xl font-semibold mb-4">Notification Preferences</h2>

                        <div className="space-y-6">
                            <div className="form-control">
                                <label className="label cursor-pointer justify-start gap-6">
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
                                <label className="label cursor-pointer justify-start gap-6">
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
                                <label className="label cursor-pointer justify-start gap-6">
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

                        <div className="divider"></div>

                        <h3 className="text-lg font-semibold mb-4">Notification Types</h3>

                        <div className="overflow-x-auto">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th className="w-1/2">Notification Type</th>
                                        <th className="w-1/6">Email</th>
                                        <th className="w-1/6">Push</th>
                                        <th className="w-1/6">In-App</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(Object.entries(notificationPreferences.types) as [NotificationType, any][]).map(([key, value]) => (
                                        <tr key={key}>
                                            <td className="flex items-center gap-2">
                                                {key.replace(/([A-Z])/g, ' $1').trim()}
                                                <button
                                                    className="btn btn-xs btn-ghost tooltip"
                                                    data-tip="Send test notification"
                                                    onClick={() => sendTestNotification(key as NotificationType)}
                                                >
                                                    <i className="fas fa-paper-plane"></i>
                                                </button>
                                            </td>
                                            <td>
                                                <input
                                                    type="checkbox"
                                                    className="checkbox checkbox-primary"
                                                    checked={value.email && notificationPreferences.email}
                                                    disabled={!notificationPreferences.email}
                                                    onChange={(e) => handleNotificationChange(key, 'email', e.target.checked)}
                                                />
                                            </td>
                                            <td>
                                                <input
                                                    type="checkbox"
                                                    className="checkbox checkbox-primary"
                                                    checked={value.push && notificationPreferences.push}
                                                    disabled={!notificationPreferences.push}
                                                    onChange={(e) => handleNotificationChange(key, 'push', e.target.checked)}
                                                />
                                            </td>
                                            <td>
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
            )}
        </div>
    )
}
