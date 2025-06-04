
"use client"

import { useState, useEffect } from "react";
import Link from "next/link";
import { useKindeAuth } from "@kinde-oss/kinde-auth-nextjs";
import PushManager from "@/components/push-manager";
import { useNotifications } from "@/hooks/use-notifications";
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

export default function NotificationsSettingsPage() {
    const { user } = useKindeAuth();
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
            toast({ title: "Success", description: "Notification preferences updated" })
        } catch (error) {
            console.error("Error updating notification preferences:", error);
            toast({ title: "Error", description: "Failed to update notification preferences", variant: "destructive" })
        }
    };

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div className="flex items-center gap-2">
                    <Link href="/dashboard/settings" className="btn btn-ghost btn-sm">
                        <i className="fas fa-arrow-left"></i>
                    </Link>
                    <h1 className="text-2xl font-bold">Notification Settings</h1>
                </div>
            </div>

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

                {/* Notification Schedule */}
                <div className="card bg-base-100 shadow-lg">
                    <div className="card-body">
                        <h2 className="card-title text-xl mb-4">Notification Schedule</h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text font-medium">Quiet Hours Start</span>
                                </label>
                                <input type="time" className="input input-bordered" defaultValue="22:00" />
                            </div>
                            
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text font-medium">Quiet Hours End</span>
                                </label>
                                <input type="time" className="input input-bordered" defaultValue="08:00" />
                            </div>
                        </div>

                        <div className="form-control mt-4">
                            <label className="label cursor-pointer justify-start gap-4">
                                <input type="checkbox" className="checkbox checkbox-primary" defaultChecked />
                                <span className="label-text">Respect quiet hours for push notifications</span>
                            </label>
                        </div>

                        <div className="form-control">
                            <label className="label cursor-pointer justify-start gap-4">
                                <input type="checkbox" className="checkbox checkbox-primary" defaultChecked />
                                <span className="label-text">Send digest emails instead of individual notifications</span>
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
