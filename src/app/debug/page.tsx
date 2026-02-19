'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/shared/api/supabase/client';

export default function DebugPage() {
    const [logs, setLogs] = useState<string[]>([]);
    const supabase = createClient();

    useEffect(() => {
        async function runDebug() {
            setLogs(prev => [...prev, 'Starting Debug...']);

            const { data: { user }, error: authError } = await supabase.auth.getUser();
            setLogs(prev => [...prev, `User: ${user?.id} (Error: ${authError?.message})`]);

            if (user) {
                // 1. Total Count (Head)
                const { count, error: countError } = await supabase
                    .from('transactions')
                    .select('*', { count: 'exact', head: true });
                setLogs(prev => [...prev, `Total Transactions: ${count}, Error: ${countError?.message}`]);

                // 2. Personal Count (Business Unit IS NULL)
                const { count: personalCount, error: personalError } = await supabase
                    .from('transactions')
                    .select('*', { count: 'exact', head: true })
                    .is('business_unit_id', null);
                setLogs(prev => [...prev, `Personal (NULL Unit): ${personalCount}, Error: ${personalError?.message}`]);
            }
        }
        runDebug();
    }, []);

    return (
        <div className="p-10 font-mono text-sm whitespace-pre-wrap text-white bg-black">
            <h1>Debug Info</h1>
            {logs.map((log, i) => <div key={i}>{log}</div>)}
        </div>
    );
}
