import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Load .env.local manually since we are running outside of Next.js
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase URL or Key in .env.local')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
    console.log('🔌 Testing Supabase Connection (Direct Mode)...')
    console.log(`   URL: ${supabaseUrl}`)

    // Try to access the 'profiles' table (even if empty, it checks auth/connection)
    const { data, error, count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })

    if (error) {
        // PGRST204 = Table not found (which is expected on fresh DB)
        if (error.code === '42P01' || error.message.includes('does not exist')) {
            console.log('✅ Connection Successful! (Credentials Valid, Table Missing)')
        } else {
            console.error('❌ Connection Failed:', error.message, error.code)
        }
    } else {
        console.log('✅ Connection Successful! (Database Accessible)')
    }
}

testConnection()
