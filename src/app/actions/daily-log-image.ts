"use server";

import { fetchByBusiness, deleteWithBusinessCheck, updateWithBusinessCheck, insertWithBusiness } from "@/lib/db";
import { DailyLogImage, DailyLogImageInsert, DailyLogImageUpdate } from "@/types/daily-log-image";
import { getUserBusiness } from "@/app/actions/business";
import { auth } from "@clerk/nextjs/server";
import { withBusinessServer } from "@/lib/auth/with-business-server";
import { applyCreated } from "@/utils/apply-created";
import { applyUpdated } from "@/utils/apply-updated";
import { createNotification } from "@/app/actions/notifications";
import { getUsers } from "@/app/actions/users";
import { NotificationInsert } from "@/types/notifications";

export const getDailyLogImages = async (businessId: string): Promise<DailyLogImage[]> => {
    const { data, error } = await fetchByBusiness("daily_log_images", businessId);

    if (error) {
        console.error("Error fetching daily log images:", error);
        return [];
    }

    if (!data || data.length === 0) {
        return [] as DailyLogImage[];
    }

    return data as unknown as DailyLogImage[];
};

export const getDailyLogImageById = async (businessId: string, id: string): Promise<DailyLogImage | null> => {
    const { data, error } = await fetchByBusiness("daily_log_images", businessId, "*", {
        filter: { id: id }
    });

    if (error) {
        console.error("Error fetching daily log image by ID:", error);
        return null;
    }

    if (data && data[0]) {
        return data[0] as unknown as DailyLogImage;
    }

    return null;
};

export const createDailyLogImage = async (businessId: string, image: DailyLogImageInsert, triggeredBy?: string): Promise<DailyLogImage | null> => {
    image = await applyCreated<DailyLogImageInsert>(image);

    const { data, error } = await insertWithBusiness("daily_log_images", image, businessId);

    if (error) {
        console.error("Error creating daily log image:", error);
        return null;
    }

    const result = data as unknown as DailyLogImage;

    // Create notification for the new daily log image
    if (result) {
        await createDailyLogImageNotification(businessId, result, "created", triggeredBy);
    }

    return result;
};

export const updateDailyLogImage = async (businessId: string, id: string, image: DailyLogImageUpdate, triggeredBy?: string): Promise<DailyLogImage | null> => {
    image = await applyUpdated<DailyLogImageUpdate>(image);

    const { data, error } = await updateWithBusinessCheck("daily_log_images", id, image, businessId);

    if (error) {
        console.error("Error updating daily log image:", error);
        return null;
    }

    const result = data as unknown as DailyLogImage;

    // Create notification for the updated daily log image
    if (result) {
        await createDailyLogImageNotification(businessId, result, "updated", triggeredBy);
    }

    return result;
};

export const deleteDailyLogImage = async (businessId: string, id: string, triggeredBy?: string): Promise<boolean> => {
    // Get the image data before deletion for notification
    let imageData = null;
    try {
        imageData = await getDailyLogImageById(businessId, id);
    } catch (error) {
        console.error("Error fetching daily log image before deletion:", error);
    }

    const { error } = await deleteWithBusinessCheck("daily_log_images", id, businessId);

    if (error) {
        console.error("Error deleting daily log image:", error);
        return false;
    }

    // Create notification for the deleted daily log image
    if (imageData) {
        await createDailyLogImageNotification(businessId, imageData, "deleted", triggeredBy);
    }

    return true;
};

export const searchDailyLogImages = async (businessId: string, query: string): Promise<DailyLogImage[]> => {
    const { data, error } = await fetchByBusiness("daily_log_images", businessId, "*", {
        filter: {
            or: [
                { image_url: { ilike: `%${query}%` } },
                { caption: { ilike: `%${query}%` } },
            ],
        },
        orderBy: { column: "id", ascending: true },
    });

    if (error) {
        console.error("Error searching daily log images:", error);
        return [];
    }

    return data as unknown as DailyLogImage[];
};

// Helper function to create notifications for daily log image actions
const createDailyLogImageNotification = async (
    businessId: string,
    imageData: any,
    eventType: "created" | "updated" | "deleted",
    triggeredBy?: string
) => {
    try {
        const users = await getUsers(businessId);

        if (users.length === 0) {
            console.log("No users found for business:", businessId);
            return;
        }

        // Get daily log and project info for context
        let dailyLogInfo = null;
        let projectName = "Unknown Project";

        if (imageData.daily_log_id) {
            try {
                const { data: dailyLogData } = await fetchByBusiness("daily_logs", businessId, "*", {
                    filter: { id: imageData.daily_log_id }
                });

                if (dailyLogData && dailyLogData[0]) {
                    dailyLogInfo = dailyLogData[0];

                    if (dailyLogInfo.project_id) {
                        const { data: projectData } = await fetchByBusiness("projects", businessId, "*", {
                            filter: { id: dailyLogInfo.project_id }
                        });

                        if (projectData && projectData[0]) {
                            projectName = projectData[0].name || "Unknown Project";
                        }
                    }
                }
            } catch (error) {
                console.error("Error fetching daily log or project info:", error);
            }
        }

        const imageCaption = imageData.caption || "image";

        const title = eventType === "created"
            ? "Daily Log Image Added"
            : eventType === "updated"
                ? "Daily Log Image Updated"
                : "Daily Log Image Removed";

        const message = eventType === "created"
            ? `A new image "${imageCaption}" has been added to a daily log for ${projectName}.`
            : eventType === "updated"
                ? `Image "${imageCaption}" has been updated in daily log for ${projectName}.`
                : `Image "${imageCaption}" has been removed from daily log for ${projectName}.`;

        // Create notifications for all users in the business
        const notificationPromises = users.map(async (user) => {
            // Skip users without auth_id or the user who triggered the action
            if (!user.auth_id || user.auth_id === triggeredBy) {
                return;
            }

            const notificationData: NotificationInsert = {
                user_id: user.auth_id,
                type: "projectUpdates", // Daily log images are project-related
                title,
                message,
                link: dailyLogInfo ? `/dashboard/daily-logs/${dailyLogInfo.id}` : `/dashboard/daily-logs`,
                read: false,
                read_at: null,
                metadata: {
                    dailyLogImageId: imageData.id,
                    dailyLogId: imageData.daily_log_id,
                    imageUrl: imageData.image_url,
                    imageCaption,
                    projectName,
                    eventType,
                    triggeredBy
                }
            };

            return createNotification(businessId, notificationData);
        });

        // Wait for all notifications to be created
        await Promise.all(notificationPromises.filter(Boolean));

        console.log(`Notifications created for daily log image ${imageData.id} - ${eventType} for ${users.length} users`);
    } catch (error) {
        console.error("Error creating daily log image notification:", error);
    }
}
