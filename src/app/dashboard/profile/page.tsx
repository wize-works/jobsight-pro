
"use client"

import { useKindeAuth } from "@kinde-oss/kinde-auth-nextjs";
import { useState, useEffect } from "react";
import PushManager from "@/components/push-manager";
import { useNotifications } from "@/hooks/use-notifications";
import { toast } from "react-hot-toast";

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

interface UserProfile {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    jobTitle: string;
    language: string;
    timeZone: string;
}

export default function ProfilePage() {
    const { user, isLoading } = useKindeAuth()
    const [activeTab, setActiveTab] = useState("profile")
    const [isSaving, setIsSaving] = useState(false)
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
    
    // Profile form state
    const [profileForm, setProfileForm] = useState<UserProfile>({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        jobTitle: '',
        language: 'English',
        timeZone: 'Pacific Time (PT)'
    });

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

    const { 
        loading: notificationsLoading, 
        preferences, 
        updateGlobalPreferences, 
        updateTypePreferences, 
        sendTestNotification 
    } = useNotifications({
        userId: user?.id || ""
    });

    // Initialize form data when user loads
    useEffect(() => {
        if (user) {
            setProfileForm({
                firstName: user.given_name || '',
                lastName: user.family_name || '',
                email: user.email || '',
                phone: '',
                jobTitle: '',
                language: 'English',
                timeZone: 'Pacific Time (PT)'
            });
        }
    }, [user]);

    // Initialize notification preferences
    useEffect(() => {
        if (preferences) {
            setNotificationPreferences(preferences);
        }
    }, [preferences]);

    // Handle profile form changes
    const handleProfileChange = (field: keyof UserProfile, value: string) => {
        setProfileForm(prev => ({
            ...prev,
            [field]: value
        }));
        setHasUnsavedChanges(true);
    };

    // Save profile changes
    const handleSaveProfile = async () => {
        if (!user?.id) return;
        
        setIsSaving(true);
        try {
            // In a real app, you'd save to your database
            // For now, we'll simulate the API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            setHasUnsavedChanges(false);
            toast.success('Profile updated successfully!');
        } catch (error) {
            console.error('Error saving profile:', error);
            toast.error('Failed to save profile. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    // Handle notification preference changes
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
                toast.success(`${channel} notifications ${value ? 'enabled' : 'disabled'}`);
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
                toast.success('Notification preferences updated');
            }
        } catch (error) {
            console.error("Error updating notification preferences:", error);
            toast.error('Failed to update notification preferences');
        }
    };

    // Handle photo upload
    const handlePhotoUpload = () => {
        // In a real app, you'd implement file upload
        toast.info('Photo upload feature coming soon!');
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <span className="loading loading-spinner loading-lg text-primary"></span>
            </div>
        )
    }

    return (
        <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Profile Settings</h1>
                {hasUnsavedChanges && (
                    <button 
                        className={`btn btn-primary ${isSaving ? 'loading' : ''}`}
                        onClick={handleSaveProfile}
                        disabled={isSaving}
                    >
                        {!isSaving && <i className="fas fa-save mr-2"></i>}
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                )}
            </div>

            <div className="tabs tabs-boxed mb-6 bg-base-100 p-1">
                <a 
                    className={`tab ${activeTab === "profile" ? "tab-active" : ""}`} 
                    onClick={() => setActiveTab("profile")}
                >
                    <i className="fas fa-user mr-2"></i>
                    Personal Info
                </a>
                <a 
                    className={`tab ${activeTab === "account" ? "tab-active" : ""}`} 
                    onClick={() => setActiveTab("account")}
                >
                    <i className="fas fa-cog mr-2"></i>
                    Account Settings
                </a>
                <a
                    className={`tab ${activeTab === "notifications" ? "tab-active" : ""}`}
                    onClick={() => setActiveTab("notifications")}
                >
                    <i className="fas fa-bell mr-2"></i>
                    Notifications
                </a>
            </div>

            {activeTab === "profile" && (
                <div className="card bg-base-100 shadow-lg">
                    <div className="card-body">
                        <div className="flex flex-col lg:flex-row gap-8">
                            <div className="lg:w-1/3 flex flex-col items-center">
                                <div className="avatar">
                                    <div className="w-32 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                                        <img 
                                            src={user?.picture || "/placeholder-user.jpg"} 
                                            alt="Profile" 
                                            className="object-cover"
                                        />
                                    </div>
                                </div>
                                <div className="mt-4 space-y-2 w-full max-w-xs">
                                    <button 
                                        className="btn btn-outline btn-sm w-full"
                                        onClick={handlePhotoUpload}
                                    >
                                        <i className="fas fa-upload mr-2"></i> 
                                        Upload Photo
                                    </button>
                                    <button className="btn btn-ghost btn-sm text-error w-full">
                                        <i className="fas fa-trash mr-2"></i> 
                                        Remove
                                    </button>
                                </div>
                            </div>

                            <div className="lg:w-2/3">
                                <h2 className="text-xl font-semibold mb-6">Personal Information</h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-medium">First Name</span>
                                        </label>
                                        <input 
                                            type="text" 
                                            className="input input-bordered focus:input-primary" 
                                            value={profileForm.firstName}
                                            onChange={(e) => handleProfileChange('firstName', e.target.value)}
                                            placeholder="Enter your first name"
                                        />
                                    </div>

                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-medium">Last Name</span>
                                        </label>
                                        <input 
                                            type="text" 
                                            className="input input-bordered focus:input-primary" 
                                            value={profileForm.lastName}
                                            onChange={(e) => handleProfileChange('lastName', e.target.value)}
                                            placeholder="Enter your last name"
                                        />
                                    </div>
                                </div>

                                <div className="form-control mt-6">
                                    <label className="label">
                                        <span className="label-text font-medium">Email</span>
                                    </label>
                                    <input 
                                        type="email" 
                                        className="input input-bordered" 
                                        value={profileForm.email} 
                                        disabled 
                                    />
                                    <label className="label">
                                        <span className="label-text-alt text-warning">
                                            <i className="fas fa-info-circle mr-1"></i>
                                            Email cannot be changed directly. Contact support for assistance.
                                        </span>
                                    </label>
                                </div>

                                <div className="form-control mt-6">
                                    <label className="label">
                                        <span className="label-text font-medium">Phone Number</span>
                                    </label>
                                    <input 
                                        type="tel" 
                                        className="input input-bordered focus:input-primary" 
                                        value={profileForm.phone}
                                        onChange={(e) => handleProfileChange('phone', e.target.value)}
                                        placeholder="(555) 123-4567"
                                    />
                                </div>

                                <div className="form-control mt-6">
                                    <label className="label">
                                        <span className="label-text font-medium">Job Title</span>
                                    </label>
                                    <input 
                                        type="text" 
                                        className="input input-bordered focus:input-primary" 
                                        value={profileForm.jobTitle}
                                        onChange={(e) => handleProfileChange('jobTitle', e.target.value)}
                                        placeholder="e.g., Project Manager"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === "account" && (
                <div className="card bg-base-100 shadow-lg">
                    <div className="card-body">
                        <h2 className="text-xl font-semibold mb-6">Account Settings</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text font-medium">Language</span>
                                </label>
                                <select 
                                    className="select select-bordered focus:select-primary w-full"
                                    value={profileForm.language}
                                    onChange={(e) => handleProfileChange('language', e.target.value)}
                                >
                                    <option>English</option>
                                    <option>Spanish</option>
                                    <option>French</option>
                                </select>
                            </div>

                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text font-medium">Time Zone</span>
                                </label>
                                <select 
                                    className="select select-bordered focus:select-primary w-full"
                                    value={profileForm.timeZone}
                                    onChange={(e) => handleProfileChange('timeZone', e.target.value)}
                                >
                                    <option>Pacific Time (PT)</option>
                                    <option>Mountain Time (MT)</option>
                                    <option>Central Time (CT)</option>
                                    <option>Eastern Time (ET)</option>
                                </select>
                            </div>
                        </div>

                        <div className="divider mt-8"></div>

                        <h3 className="text-lg font-semibold mb-6">Security</h3>

                        <div className="space-y-4">
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text font-medium">Password</span>
                                </label>
                                <button className="btn btn-outline max-w-xs">
                                    <i className="fas fa-key mr-2"></i> 
                                    Change Password
                                </button>
                                <label className="label">
                                    <span className="label-text-alt">Managed through your authentication provider</span>
                                </label>
                            </div>

                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text font-medium">Two-Factor Authentication</span>
                                </label>
                                <div className="flex items-center gap-4">
                                    <button className="btn btn-outline">
                                        <i className="fas fa-shield-alt mr-2"></i> 
                                        Enable 2FA
                                    </button>
                                    <div className="badge badge-warning">Not enabled</div>
                                </div>
                            </div>
                        </div>

                        <div className="divider mt-8"></div>

                        <h3 className="text-lg font-semibold mb-4 text-error">Danger Zone</h3>

                        <div className="alert alert-error shadow-lg">
                            <div>
                                <i className="fas fa-exclamation-triangle"></i>
                                <div>
                                    <h4 className="font-bold">Delete Account</h4>
                                    <div className="text-xs">Once you delete your account, there is no going back. Please be certain.</div>
                                </div>
                            </div>
                            <div className="flex-none">
                                <button className="btn btn-sm btn-error">Delete</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === "notifications" && (
                <div className="card bg-base-100 shadow-lg">
                    <div className="card-body">
                        <h2 className="text-xl font-semibold mb-6">Notification Preferences</h2>

                        {notificationsLoading ? (
                            <div className="flex justify-center py-8">
                                <span className="loading loading-spinner loading-lg"></span>
                            </div>
                        ) : (
                            <>
                                <div className="space-y-6">
                                    <div className="form-control">
                                        <label className="label cursor-pointer justify-start gap-4">
                                            <input
                                                type="checkbox"
                                                className="toggle toggle-primary"
                                                checked={notificationPreferences.email}
                                                onChange={(e) => handleNotificationChange('general', 'email', e.target.checked)}
                                            />
                                            <div className="flex-1">
                                                <div className="font-medium">Email Notifications</div>
                                                <div className="text-sm text-base-content/70">
                                                    Receive email notifications for important updates
                                                </div>
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
                                            <div className="flex-1">
                                                <div className="font-medium">Push Notifications</div>
                                                <div className="text-sm text-base-content/70">
                                                    Receive push notifications on your device
                                                </div>
                                            </div>
                                        </label>
                                        {notificationPreferences.push && (
                                            <div className="ml-16 mt-2">
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
                                            <div className="flex-1">
                                                <div className="font-medium">In-App Notifications</div>
                                                <div className="text-sm text-base-content/70">
                                                    Receive notifications within the application
                                                </div>
                                            </div>
                                        </label>
                                    </div>
                                </div>

                                <div className="divider mt-8"></div>

                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-lg font-semibold">Notification Types</h3>
                                    <div className="text-sm text-base-content/70">
                                        Configure which types of notifications you want to receive
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="table table-zebra">
                                        <thead>
                                            <tr>
                                                <th className="font-semibold">Notification Type</th>
                                                <th className="text-center">Email</th>
                                                <th className="text-center">Push</th>
                                                <th className="text-center">In-App</th>
                                                <th className="text-center">Test</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(Object.entries(notificationPreferences.types) as [NotificationType, any][]).map(([key, value]) => (
                                                <tr key={key}>
                                                    <td className="font-medium">
                                                        {key.replace(/([A-Z])/g, ' $1').trim()}
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
                                                    <td className="text-center">
                                                        <button
                                                            className="btn btn-xs btn-ghost tooltip"
                                                            data-tip="Send test notification"
                                                            onClick={() => sendTestNotification(key as NotificationType)}
                                                        >
                                                            <i className="fas fa-paper-plane"></i>
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
