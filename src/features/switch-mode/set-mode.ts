'use server';

import { cookies } from 'next/headers';

export async function setAppModeAction(mode: 'personal' | 'business' | 'total') {
    // Save mode to cookie (Valid for 30 days)
    (await cookies()).set('app-mode', mode, { path: '/', maxAge: 60 * 60 * 24 * 30 });
}
