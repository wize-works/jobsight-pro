
"use client";

import { useEffect, useState } from "react";
import { useKindeAuth } from "@kinde-oss/kinde-auth-nextjs";
import { useBusiness } from "@/lib/business-context";
import { getNotificationsByUserId, markNotificationAsRead, markAllNotificationsAsRead } from "@/app/actions/notifications";
import type { Notification } from "@/types/notifications";
import { toast } from "@/hooks/use-toast";
import Link from "next/link";
import NotificationsLoading from "./loading";

export default function NotificationsPage() {
    const { user } = useKindeAuth();
    const { businessId } = useBusiness();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'unread'>('all');

    useEffect(() => {
        if (user?.id && businessId) {
            loadNotifications();
        }
    }, [user?.id, businessId]);

    const loadNotifications = async () => {
        if (!user?.id || !businessId) return;

        try {
            setLoading(true);
            const allNotifications = await getNotificationsByUserId(businessId, user.id);
            setNotifications(allNotifications);
        } catch (error) {
            console.error("Error loading notifications:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsRead = async (notificationId: string) => {
        if (!businessId) return;

        try {
            await markNotificationAsRead(businessId, notificationId);
            setNotifications(prev =>
                prev.map(n => n.id === notificationId ? { ...n, read: true, read_at: new Date().toISOString() } : n)
            );
        } catch (error) {
            console.error("Error marking notification as read:", error);
            toast.error("Failed to mark notification as read");
        }
    };

    const handleMarkAllAsRead = async () => {
        if (!user?.id || !businessId) return;

        try {
            await markAllNotificationsAsRead(businessId, user.id);
            setNotifications(prev =>
                prev.map(n => ({ ...n, read: true, read_at: new Date().toISOString() }))
            );
            toast.success("All notifications marked as read");
        } catch (error) {
            console.error("Error marking all notifications as read:", error);
            toast.error("Failed to mark all notifications as read");
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'projectUpdates':
                return 'fas fa-project-diagram text-accent';
            case 'taskAssignments':
                return 'fas fa-tasks text-info';
            case 'equipmentAlerts':
                return 'fas fa-exclamation-triangle text-warning';
            case 'invoiceUpdates':
                return 'fas fa-file-invoice-dollar text-success';
            case 'systemAnnouncements':
                return 'fas fa-bullhorn text-secondary';
            default:
                return 'fas fa-bell text-primary';
        }
    };

    const filteredNotifications = notifications.filter(n =>
        filter === 'all' || (filter === 'unread' && !n.read)
    ); if (!user?.id || !businessId) {
        return <NotificationsLoading />;
    }

    if (loading) {
        return <NotificationsLoading />;
    }

    return (
        <div className="min-h-screen bg-base-100">
            <div className="container mx-auto px-4 py-6 max-w-4xl">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold">Notifications</h1>
                    <div className="flex gap-2">
                        <div className="join">
                            <button
                                className={`btn join-item btn-sm ${filter === 'all' ? 'btn-active' : ''}`}
                                onClick={() => setFilter('all')}
                            >
                                All
                            </button>
                            <button
                                className={`btn join-item btn-sm ${filter === 'unread' ? 'btn-active' : ''}`}
                                onClick={() => setFilter('unread')}
                            >
                                Unread ({notifications.filter(n => !n.read).length})
                            </button>
                        </div>
                        {notifications.some(n => !n.read) && (
                            <button
                                className="btn btn-sm btn-outline"
                                onClick={handleMarkAllAsRead}
                            >
                                <i className="fas fa-check-double"></i>
                                Mark all read
                            </button>
                        )}
                    </div>
                </div>                {filteredNotifications.length === 0 ? (
                    <div className="text-center py-12">
                        <i className="fas fa-bell-slash fa-4x text-base-content/30 mb-4"></i>
                        <h3 className="text-xl font-semibold mb-2">No notifications</h3>
                        <p className="text-base-content/60">
                            {filter === 'unread' ? 'No unread notifications' : 'You have no notifications yet'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {filteredNotifications.map((notification) => (
                            <div
                                key={notification.id}
                                className={`card bg-base-100 border ${!notification.read ? 'border-primary/30 bg-primary/5' : 'border-base-300'} hover:shadow-md transition-all`}
                            >
                                <div className="card-body p-4">
                                    <div className="flex items-start gap-4">
                                        <div className="mt-1">
                                            <i className={`${getNotificationIcon(notification.type)} fa-lg`}></i>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start gap-2">
                                                <h3 className="font-semibold text-base">
                                                    {notification.title}
                                                    {!notification.read && (
                                                        <span className="badge badge-primary badge-xs ml-2">New</span>
                                                    )}
                                                </h3>
                                                <span className="text-xs text-base-content/60 whitespace-nowrap">
                                                    {formatDate(notification.created_at || '')}
                                                </span>
                                            </div>
                                            <p className="text-sm text-base-content/80 mt-1">
                                                {notification.message}
                                            </p>
                                            <div className="flex justify-between items-center mt-3">
                                                <div className="flex gap-2">
                                                    {notification.link && (
                                                        <Link
                                                            href={notification.link}
                                                            className="btn btn-xs btn-primary"
                                                            onClick={() => !notification.read && handleMarkAsRead(notification.id)}
                                                        >
                                                            <i className="fas fa-external-link-alt"></i>
                                                            View
                                                        </Link>
                                                    )}
                                                    {!notification.read && (
                                                        <button
                                                            className="btn btn-xs btn-outline"
                                                            onClick={() => handleMarkAsRead(notification.id)}
                                                        >
                                                            <i className="fas fa-check"></i>
                                                            Mark as read
                                                        </button>
                                                    )}
                                                </div>
                                                <span className="badge badge-ghost badge-sm">
                                                    {notification.type.replace(/([A-Z])/g, ' $1').trim()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
