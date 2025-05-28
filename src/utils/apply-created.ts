"use server";

import { withBusinessServer } from "@/lib/auth/with-business-server";

export const applyCreated = async <T extends Object>(model: any): Promise<T> => {
    const business = await withBusinessServer();

    Object.assign(model, {
        business_id: business?.business.id || null,
        created_by: business?.userId || null,
        created_at: new Date().toISOString(),
        updated_by: business?.userId || null,
        updated_at: new Date().toISOString(),
    });

    return model as T;
}