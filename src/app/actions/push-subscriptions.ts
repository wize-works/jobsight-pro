"use server";

import { fetchByBusiness, deleteWithBusinessCheck, updateWithBusinessCheck, insertWithBusiness } from "@/lib/db";
import { PushSubscription, PushSubscriptionInsert, PushSubscriptionUpdate } from "@/types/notifications";
import { withBusinessServer } from "@/lib/auth/with-business-server";
import { applyCreated } from "@/utils/apply-created";
import { applyUpdated } from "@/utils/apply-updated";
import { ensureBusinessOrRedirect } from "@/lib/auth/ensure-business";

// Get all push subscriptions for a user
export const getPushSubscriptions = async (userId: string): Promise<PushSubscription[]> => {
    const { business } = await ensureBusinessOrRedirect();

    const { data, error } = await fetchByBusiness("push_subscriptions", business.id, "*", {
        filter: { user_id: userId },
    });

    if (error) {
        console.error("Error fetching push subscriptions:", error);
        return [];
    }

    if (!data || data.length === 0) {
        return [] as PushSubscription[];
    }

    return data as unknown as PushSubscription[];
};

// Create a new push subscription
export const createPushSubscription = async (subscription: PushSubscriptionInsert): Promise<PushSubscription | null> => {
    const { business } = await ensureBusinessOrRedirect();

    // Check if the subscription already exists
    const { data: existingSub } = await fetchByBusiness("push_subscriptions", business.id, "*", {
        filter: {
            user_id: subscription.user_id,
            endpoint: subscription.endpoint
        },
    });

    if (existingSub && existingSub.length > 0) {
        // Subscription already exists, update it
        const { data, error } = await updateWithBusinessCheck(
            "push_subscriptions",
            (existingSub[0] as unknown as PushSubscription).id,
            await applyUpdated<PushSubscriptionUpdate>(subscription),
            business.id
        );

        if (error) {
            console.error("Error updating existing push subscription:", error);
            return null;
        }

        return data as PushSubscription;
    }

    // Create new subscription
    const { data, error } = await insertWithBusiness(
        "push_subscriptions",
        await applyCreated<PushSubscriptionInsert>(subscription),
        business.id
    );

    if (error) {
        console.error("Error creating push subscription:", error);
        return null;
    }

    return data as PushSubscription;
};

// Delete a push subscription
export const deletePushSubscription = async (id: string): Promise<boolean> => {
    const { business } = await ensureBusinessOrRedirect();

    const { error } = await deleteWithBusinessCheck("push_subscriptions", id, business.id);

    if (error) {
        console.error("Error deleting push subscription:", error);
        return false;
    }

    return true;
};

// Delete a push subscription by endpoint
export const deletePushSubscriptionByEndpoint = async (userId: string, endpoint: string): Promise<boolean> => {
    const { business } = await ensureBusinessOrRedirect();

    // Find the subscription first
    const { data: subscriptions } = await fetchByBusiness("push_subscriptions", business.id, "*", {
        filter: {
            user_id: userId,
            endpoint
        },
    });

    if (!subscriptions || subscriptions.length === 0) {
        return true; // Nothing to delete
    }

    // Delete all matching subscriptions (should typically be just one)
    const deletePromises = (subscriptions as unknown as PushSubscription[]).map((sub) =>
        deleteWithBusinessCheck("push_subscriptions", sub.id, business.id)
    );

    try {
        await Promise.all(deletePromises);
        return true;
    } catch (error) {
        console.error("Error deleting push subscriptions:", error);
        return false;
    }
};

// Update a push subscription's last used timestamp
export const updatePushSubscriptionLastUsed = async (id: string): Promise<PushSubscription | null> => {
    const { business } = await ensureBusinessOrRedirect();

    const update = {
        last_used_at: new Date().toISOString(),
    } as PushSubscriptionUpdate;

    const { data, error } = await updateWithBusinessCheck(
        "push_subscriptions",
        id,
        update,
        business.id
    );

    if (error) {
        console.error("Error updating push subscription last used:", error);
        return null;
    }

    return data as PushSubscription;
};
