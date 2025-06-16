// lib/cookies/set-bizstate.ts
'use server';

import { cookies } from 'next/headers';

export async function setBizStateCookie({
    hasBusiness,
    hasSubscription,
}: {
    hasBusiness: boolean;
    hasSubscription: boolean;
}) {
    const payload = JSON.stringify({ hasBusiness, hasSubscription });
    (await cookies()).set('bizstate', payload, {
        path: '/',
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
    });
}
