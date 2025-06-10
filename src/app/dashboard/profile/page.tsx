
"use client";

import { useState, useEffect, useRef } from "react";
import { useKindeAuth } from "@kinde-oss/kinde-auth-nextjs";
import PushManager from "@/components/push-manager";
import { useNotifications } from "@/hooks/use-notifications";
import { toast } from "@/hooks/use-toast";
import { uploadUserAvatar } from "@/app/actions/user-avatar";
import { getUserById } from "@/app/actions/users";

type NotificationType =
    | "projectUpdates"
    | "taskAssignments"
    | "equipmentAlerts"
    | "invoiceUpdates"
    | "systemAnnouncements";
type NotificationChannel = "email" | "push" | "inApp";

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
    const { user, isLoading } = useKindeAuth();
    const [isSaving, setIsSaving] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Profile form state
    const [profileForm, setProfileForm] = useState<UserProfile>({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        jobTitle: "",
        language: "English",
        timeZone: "Pacific Time (PT)",
    });

    const [notificationPreferences, setNotificationPreferences] =
        useState<NotificationPreferences>({
            email: true,
            push: false,
            inApp: true,
            types: {
                projectUpdates: { email: true, push: true, inApp: true },
                taskAssignments: { email: true, push: true, inApp: true },
                equipmentAlerts: { email: true, push: true, inApp: true },
                invoiceUpdates: { email: true, push: false, inApp: true },
                systemAnnouncements: { email: true, push: false, inApp: true },
            },
        });

    const {
        loading: notificationsLoading,
        preferences,
        updateGlobalPreferences,
        updateTypePreferences,
        sendTestNotification,
    } = useNotifications({
        userId: user?.id || "",
    });

    // Load user data when component mounts
    useEffect(() => {
        if (user && !isLoading) {
            // Load current user data from database first
            loadCurrentUser();
        }
    }, [user, isLoading]);

    const loadCurrentUser = async () => {
        if (!user?.id) return;

        try {
            const dbUser = await getUserById(user.id);
            if (dbUser) {
                setCurrentUser(dbUser);
                setAvatarUrl(dbUser.avatar_url);
                // Set profile form from database data, fallback to Kinde only if db data is empty
                setProfileForm({
                    firstName: dbUser.first_name || user.given_name || "",
                    lastName: dbUser.last_name || user.family_name || "",
                    email: dbUser.email || user.email || "",
                    phone: dbUser.phone || "",
                    jobTitle: "", // This should come from database or be empty
                    language: "English", // This should come from database or default
                    timeZone: "Pacific Time (PT)", // This should come from database or default
                });
            } else {
                // Only use Kinde data if no database user exists (shouldn't happen in normal flow)
                setProfileForm({
                    firstName: user.given_name || "",
                    lastName: user.family_name || "",
                    email: user.email || "",
                    phone: "",
                    jobTitle: "",
                    language: "English",
                    timeZone: "Pacific Time (PT)",
                });
            }
        } catch (error) {
            console.error("Error loading user data:", error);
        }
    };

    // Initialize notification preferences
    useEffect(() => {
        if (preferences) {
            setNotificationPreferences(preferences);
        }
    }, [preferences]);

    // Handle profile form changes
    const handleProfileChange = (field: keyof UserProfile, value: string) => {
        setProfileForm((prev) => ({
            ...prev,
            [field]: value,
        }));
        setHasUnsavedChanges(true);
    };

    const handleSaveProfile = async () => {
        setIsSaving(true);
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setIsSaving(false);
        setHasUnsavedChanges(false);
        toast({
            title: "Profile saved",
            description: "Your profile has been updated successfully.",
        });
    };

    const handleAvatarUpload = async (
        event: React.ChangeEvent<HTMLInputElement>,
    ) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsUploadingAvatar(true);

        try {
            const result = await uploadUserAvatar(file);

            if (result.success && result.avatarUrl) {
                setAvatarUrl(result.avatarUrl);
                toast({
                    title: "Avatar updated",
                    description:
                        "Your profile picture has been updated successfully.",
                });
                // Reload user data to get the latest info
                await loadCurrentUser();
            } else {
                toast({
                    title: "Upload failed",
                    description: result.error || "Failed to upload avatar",
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error("Error uploading avatar:", error);
            toast({
                title: "Upload failed",
                description:
                    "An unexpected error occurred while uploading your avatar.",
                variant: "destructive",
            });
        } finally {
            setIsUploadingAvatar(false);
            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    // Handle notification preference changes
    const handleNotificationChange = async (
        type: "general" | NotificationType,
        channel: NotificationChannel,
        value: boolean,
    ) => {
        try {
            if (type === "general") {
                await updateGlobalPreferences(channel, value);
                setNotificationPreferences((prev) => ({
                    ...prev,
                    [channel]: value,
                }));
                toast.success(
                    `${channel} notifications ${value ? "enabled" : "disabled"}`,
                );
            } else {
                await updateTypePreferences(type, channel, value);
                setNotificationPreferences((prev) => ({
                    ...prev,
                    types: {
                        ...prev.types,
                        [type]: {
                            ...prev.types[type],
                            [channel]: value,
                        },
                    },
                }));
                toast.success("Notification preferences updated");
            }
        } catch (error) {
            console.error("Error updating notification preferences:", error);
            toast.error("Failed to update notification preferences");
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <span className="loading loading-spinner loading-lg text-primary"></span>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Profile Settings</h1>
                {hasUnsavedChanges && (
                    <button
                        className={`btn btn-primary ${isSaving ? "loading" : ""}`}
                        onClick={handleSaveProfile}
                        disabled={isSaving}
                    >
                        {!isSaving && <i className="fas fa-save mr-2"></i>}
                        {isSaving ? "Saving..." : "Save Changes"}
                    </button>
                )}
            </div>

            {/* Profile Photo & Personal Information */}
            <div className="card bg-base-100 shadow-lg">
                <div className="card-body">
                    <div className="flex flex-col lg:flex-row gap-8">
                        <div className="lg:w-1/3 flex flex-col items-center">
                            {/* Avatar Section */}
                            <div className="flex items-center space-x-6 mb-8">
                                <div className="relative">
                                    {avatarUrl ? (
                                        <div className="avatar">
                                            <div className="w-24 rounded-full">
                                                <img
                                                    src={avatarUrl}
                                                    alt="Profile"
                                                    className=""
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="avatar avatar-placeholder">
                                            <div className="bg-neutral text-neutral-content w-12 rounded-full">
                                                <i className="fas fa-user"></i>
                                            </div>
                                        </div>
                                    )}
                                    <button
                                        onClick={triggerFileInput}
                                        disabled={isUploadingAvatar}
                                        className="btn btn-primary btn-circle absolute bottom-0 right-0"
                                    >
                                        {isUploadingAvatar ? (
                                            <i className="fas fa-spinner fa-spin text-sm"></i>
                                        ) : (
                                            <i className="fas fa-camera text-sm"></i>
                                        )}
                                    </button>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleAvatarUpload}
                                        className="hidden"
                                    />
                                </div>

                                <div>
                                    <h3 className="text-lg font-semibold mb-2">
                                        Profile Photo
                                    </h3>
                                    <p className="text-base-content/70 text-sm mb-4">
                                        Update your profile photo to help
                                        others recognize you. Max file size:
                                        5MB.
                                    </p>
                                    <button
                                        onClick={triggerFileInput}
                                        disabled={isUploadingAvatar}
                                        className="btn btn-outline btn-sm"
                                    >
                                        {isUploadingAvatar ? (
                                            <>
                                                <i className="fas fa-spinner fa-spin mr-2"></i>
                                                Uploading...
                                            </>
                                        ) : (
                                            "Change Photo"
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="lg:w-2/3">
                            <h2 className="text-xl font-semibold mb-6">
                                Personal Information
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text font-medium">
                                            First Name
                                        </span>
                                    </label>
                                    <input
                                        type="text"
                                        className="input input-bordered focus:input-primary"
                                        value={profileForm.firstName}
                                        onChange={(e) =>
                                            handleProfileChange(
                                                "firstName",
                                                e.target.value,
                                            )
                                        }
                                        placeholder="Enter your first name"
                                    />
                                </div>

                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text font-medium">
                                            Last Name
                                        </span>
                                    </label>
                                    <input
                                        type="text"
                                        className="input input-bordered focus:input-primary"
                                        value={profileForm.lastName}
                                        onChange={(e) =>
                                            handleProfileChange(
                                                "lastName",
                                                e.target.value,
                                            )
                                        }
                                        placeholder="Enter your last name"
                                    />
                                </div>
                            </div>

                            <div className="form-control mt-6">
                                <label className="label">
                                    <span className="label-text font-medium">
                                        Email
                                    </span>
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
                                        Email cannot be changed directly.
                                        Contact support for assistance.
                                    </span>
                                </label>
                            </div>

                            <div className="form-control mt-6">
                                <label className="label">
                                    <span className="label-text font-medium">
                                        Phone Number
                                    </span>
                                </label>
                                <input
                                    type="tel"
                                    className="input input-bordered focus:input-primary"
                                    value={profileForm.phone}
                                    onChange={(e) =>
                                        handleProfileChange(
                                            "phone",
                                            e.target.value,
                                        )
                                    }
                                    placeholder="(555) 123-4567"
                                />
                            </div>

                            <div className="form-control mt-6">
                                <label className="label">
                                    <span className="label-text font-medium">
                                        Job Title
                                    </span>
                                </label>
                                <input
                                    type="text"
                                    className="input input-bordered focus:input-primary"
                                    value={profileForm.jobTitle}
                                    onChange={(e) =>
                                        handleProfileChange(
                                            "jobTitle",
                                            e.target.value,
                                        )
                                    }
                                    placeholder="e.g., Project Manager"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Account Settings */}
            <div className="card bg-base-100 shadow-lg">
                <div className="card-body">
                    <h2 className="text-xl font-semibold mb-6">
                        Account Settings
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text font-medium">
                                    Language
                                </span>
                            </label>
                            <select
                                className="select select-bordered focus:select-primary w-full"
                                value={profileForm.language}
                                onChange={(e) =>
                                    handleProfileChange(
                                        "language",
                                        e.target.value,
                                    )
                                }
                            >
                                <option>English</option>
                                <option>Spanish</option>
                                <option>French</option>
                            </select>
                        </div>

                        <div className="form-control">
                            <label className="label">
                                <span className="label-text font-medium">
                                    Time Zone
                                </span>
                            </label>
                            <select
                                className="select select-bordered focus:select-primary w-full"
                                value={profileForm.timeZone}
                                onChange={(e) =>
                                    handleProfileChange(
                                        "timeZone",
                                        e.target.value,
                                    )
                                }
                            >
                                <option>Pacific Time (PT)</option>
                                <option>Mountain Time (MT)</option>
                                <option>Central Time (CT)</option>
                                <option>Eastern Time (ET)</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Notification Preferences */}
            <div className="card bg-base-100 shadow-lg">
                <div className="card-body">
                    <h2 className="text-xl font-semibold mb-6">
                        Notification Preferences
                    </h2>

                    {notificationsLoading ? (
                        <div className="flex justify-center py-8">
                            <span className="loading loading-spinner loading-lg"></span>
                        </div>
                    ) : (
                        <>
                            <div className="space-y-6 mb-8">
                                <div className="form-control">
                                    <label className="label cursor-pointer justify-start gap-4">
                                        <input
                                            type="checkbox"
                                            className="toggle toggle-primary"
                                            checked={
                                                notificationPreferences.email
                                            }
                                            onChange={(e) =>
                                                handleNotificationChange(
                                                    "general",
                                                    "email",
                                                    e.target.checked,
                                                )
                                            }
                                        />
                                        <div className="flex-1">
                                            <div className="font-medium">
                                                Email Notifications
                                            </div>
                                            <div className="text-sm text-base-content/70">
                                                Receive email notifications
                                                for important updates
                                            </div>
                                        </div>
                                    </label>
                                </div>

                                <div className="form-control">
                                    <label className="label cursor-pointer justify-start gap-4">
                                        <input
                                            type="checkbox"
                                            className="toggle toggle-primary"
                                            checked={
                                                notificationPreferences.push
                                            }
                                            onChange={(e) =>
                                                handleNotificationChange(
                                                    "general",
                                                    "push",
                                                    e.target.checked,
                                                )
                                            }
                                        />
                                        <div className="flex-1">
                                            <div className="font-medium">
                                                Push Notifications
                                            </div>
                                            <div className="text-sm text-base-content/70">
                                                Receive push notifications
                                                on your device
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
                                            checked={
                                                notificationPreferences.inApp
                                            }
                                            onChange={(e) =>
                                                handleNotificationChange(
                                                    "general",
                                                    "inApp",
                                                    e.target.checked,
                                                )
                                            }
                                        />
                                        <div className="flex-1">
                                            <div className="font-medium">
                                                In-App Notifications
                                            </div>
                                            <div className="text-sm text-base-content/70">
                                                Receive notifications within
                                                the application
                                            </div>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            <div className="divider"></div>

                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-semibold">
                                    Notification Types
                                </h3>
                                <div className="text-sm text-base-content/70">
                                    Configure which types of notifications
                                    you want to receive
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="table table-zebra">
                                    <thead>
                                        <tr>
                                            <th className="font-semibold">
                                                Notification Type
                                            </th>
                                            <th className="text-center">
                                                Email
                                            </th>
                                            <th className="text-center">
                                                Push
                                            </th>
                                            <th className="text-center">
                                                In-App
                                            </th>
                                            <th className="text-center">
                                                Test
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(
                                            Object.entries(
                                                notificationPreferences.types,
                                            ) as [NotificationType, any][]
                                        ).map(([key, value]) => (
                                            <tr key={key}>
                                                <td className="font-medium">
                                                    {key
                                                        .replace(
                                                            /([A-Z])/g,
                                                            " $1",
                                                        )
                                                        .trim()}
                                                </td>
                                                <td className="text-center">
                                                    <input
                                                        type="checkbox"
                                                        className="checkbox checkbox-primary"
                                                        checked={
                                                            value.email &&
                                                            notificationPreferences.email
                                                        }
                                                        disabled={
                                                            !notificationPreferences.email
                                                        }
                                                        onChange={(e) =>
                                                            handleNotificationChange(
                                                                key,
                                                                "email",
                                                                e.target
                                                                    .checked,
                                                            )
                                                        }
                                                    />
                                                </td>
                                                <td className="text-center">
                                                    <input
                                                        type="checkbox"
                                                        className="checkbox checkbox-primary"
                                                        checked={
                                                            value.push &&
                                                            notificationPreferences.push
                                                        }
                                                        disabled={
                                                            !notificationPreferences.push
                                                        }
                                                        onChange={(e) =>
                                                            handleNotificationChange(
                                                                key,
                                                                "push",
                                                                e.target
                                                                    .checked,
                                                            )
                                                        }
                                                    />
                                                </td>
                                                <td className="text-center">
                                                    <input
                                                        type="checkbox"
                                                        className="checkbox checkbox-primary"
                                                        checked={
                                                            value.inApp &&
                                                            notificationPreferences.inApp
                                                        }
                                                        disabled={
                                                            !notificationPreferences.inApp
                                                        }
                                                        onChange={(e) =>
                                                            handleNotificationChange(
                                                                key,
                                                                "inApp",
                                                                e.target
                                                                    .checked,
                                                            )
                                                        }
                                                    />
                                                </td>
                                                <td className="text-center">
                                                    <button
                                                        className="btn btn-xs btn-ghost tooltip"
                                                        data-tip="Send test notification"
                                                        onClick={() =>
                                                            sendTestNotification(
                                                                key as NotificationType,
                                                            )
                                                        }
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

            {/* Danger Zone */}
            <div className="card bg-base-100 shadow-lg">
                <div className="card-body">
                    <h3 className="text-lg font-semibold mb-4 text-error">
                        Danger Zone
                    </h3>

                    <div className="alert alert-error shadow-lg">
                        <div>
                            <i className="fas fa-exclamation-triangle"></i>
                            <div>
                                <h4 className="font-bold">
                                    Delete Account
                                </h4>
                                <div className="text-xs">
                                    Once you delete your account, there is
                                    no going back. Please be certain.
                                </div>
                            </div>
                        </div>
                        <div className="flex-none">
                            <button className="btn btn-sm btn-error">
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
