import { createClient } from '../../src/shared/api/supabase/server';

async function testConnection() {
    console.log('🔌 Testing Supabase Connection...');
    const supabase = await createClient();

    // Try to fetch something simple (health check)
    const { data, error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });

    if (error) {
        // If table doesn't exist, it might still return a 404 or specific error,
        // but at least we hit the server. The connection itself is the key here.
        if (error.code === 'PGRST204' || error.message.includes('does not exist')) {
            console.log('✅ Connection OK! (Connected, but table not found - Schema pending)');
        } else {
            console.error('❌ Connection Failed:', error.message);
        }
    } else {
        console.log('✅ Connection Successful! (Database accessible)');
    }
}

testConnection();
