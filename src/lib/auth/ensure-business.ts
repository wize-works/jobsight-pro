// lib/auth/ensure-business.ts
'use server';

import { redirect } from 'next/navigation';
import { withBusinessServer, WithBusinessResult } from './with-business-server';

export async function ensureBusinessOrRedirect(): Promise<Exclude<WithBusinessResult, { redirectTo: string }>> {
    const result = await withBusinessServer();
    if ('redirectTo' in result) {
        redirect(result.redirectTo);
    }

    return result;
}
