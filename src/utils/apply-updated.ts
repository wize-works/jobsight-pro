"use server";

import { ensureBusinessOrRedirect } from "@/lib/auth/ensure-business";
import { withBusinessServer } from "@/lib/auth/with-business-server";

export const applyUpdated = async <T extends Object>(model: any): Promise<T> => {
    const business = await ensureBusinessOrRedirect();

    Object.assign(model, {
        business_id: business?.business.id || null,
        updated_by: business?.userId || null,
        updated_at: new Date().toISOString(),
    });

    return model as T;
}