"use server";

import { fetchByBusiness } from "@/lib/db";

export async function testClientQuery(businessId: string) {
    console.log(`Testing client query for business: ${businessId}`);

    try {
        const { data, error } = await fetchByBusiness("clients", businessId, "*", {
            orderBy: { column: "name", ascending: true }
        });

        console.log(`Client query result - Error: ${error ? error.message : 'none'}, Data count: ${data?.length || 0}`);

        if (data && data.length > 0) {
            console.log('Sample client data:', data.slice(0, 2).map(c => ({ id: c.id, name: c.name })));
        }

        return {
            success: !error,
            count: data?.length || 0,
            error: error?.message,
            data: data?.slice(0, 3) // Return first 3 clients for debugging
        };
    } catch (err) {
        console.error('Exception in testClientQuery:', err);
        return {
            success: false,
            count: 0,
            error: err instanceof Error ? err.message : 'Unknown error'
        };
    }
}
