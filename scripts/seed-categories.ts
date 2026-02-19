import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase URL or Key')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

const CATEGORY_TREE = [
    // Track A: Variable Expenses
    {
        name: '생활', type: 'expense', ui_config: { icon: '🛒', color: 'blue' }, children: [
            { name: '식비', ui_config: { icon: '🍽️', color: 'orange' } },
            { name: '주거/통신', ui_config: { icon: '🏠', color: 'blue' } },
            { name: '패션/쇼핑', ui_config: { icon: '👗', color: 'pink' } },
            { name: '건강/성장', ui_config: { icon: '💪', color: 'green' } },
            { name: '교통/차량', ui_config: { icon: '🚌', color: 'slate' } },
        ]
    },
    // Track A: Fixed Expenses
    {
        name: '금융', type: 'expense', ui_config: { icon: '💸', color: 'red' }, children: [
            { name: '금융비용', ui_config: { icon: '💸', color: 'red' } },
            { name: '보험/세금', ui_config: { icon: '🛡️', color: 'indigo' } },
        ]
    },
    // Track A: Transfer
    {
        name: '이체/자산', type: 'transfer', ui_config: { icon: '🔄', color: 'gray' }, children: [
            { name: '저축/투자', ui_config: { icon: '💰', color: 'emerald' } },
            { name: '부채상환', ui_config: { icon: '📉', color: 'red' } },
        ]
    },
    // Track B: Business (Lighting Crew)
    {
        name: 'Lighting Crew', type: 'income', is_business_only: true, ui_config: { icon: '💡', color: 'yellow' }, children: [
            { name: 'Income', type: 'income', ui_config: { icon: '💵', color: 'green' } },
            { name: 'Expense', type: 'expense', ui_config: { icon: '🔌', color: 'yellow' } },
        ]
    },
    // Track B: Business (Design & Photo)
    {
        name: 'Design & Photo', type: 'income', is_business_only: true, ui_config: { icon: '🎨', color: 'purple' }, children: [
            { name: 'Income', type: 'income', ui_config: { icon: '🖼️', color: 'purple' } },
            { name: 'Expense', type: 'expense', ui_config: { icon: '☁️', color: 'blue' } },
        ]
    }
]

async function seedCategories() {
    console.log('🌱 Seeding Categories...')

    // 1. Clean up existing (optional, be careful in prod)
    const { error: deleteError } = await supabase.from('mdt_categories').delete().neq('id', 0)
    if (deleteError) {
        console.warn('⚠️ Clear failed (Row Level Security might block delete). Proceeding to insert...')
    } else {
        console.log('🧹 Cleared existing categories.')
    }

    // 2. Auth Check (Anonymous writes might be blocked by RLS if not configured)
    // Since we are using anon key, we need RLS policies that allow inserting.
    // Assuming the user hasn't set up complex RLS yet or allowed public insert for seeding.
    // If RLS blocks, we might need Service Role Key (which we don't have yet).
    // Let's try inserting with Anon Key. If fail, we ask user to insert manually via SQL.

    for (const group of CATEGORY_TREE) {
        // Insert Parent
        const { data: parent, error: parentError } = await supabase
            .from('mdt_categories')
            .insert({
                name: group.name,
                type: group.type,
                ui_config: group.ui_config,
                is_business_only: group.is_business_only || false,
                parent_id: null
            })
            .select()
            .single()

        if (parentError) {
            console.error(`❌ Failed to insert parent ${group.name}:`, parentError.message)
            continue
        }

        console.log(`✅ Created Parent: ${group.name}`)

        if (group.children) {
            for (const child of group.children) {
                const { error: childError } = await supabase
                    .from('mdt_categories')
                    .insert({
                        name: child.name,
                        type: (child as any).type || group.type, // Inherit type unless specified
                        ui_config: child.ui_config,
                        is_business_only: group.is_business_only || false,
                        parent_id: parent.id
                    })

                if (childError) {
                    console.error(`   ❌ Failed to insert child ${child.name}:`, childError.message)
                } else {
                    console.log(`   └─ Created Child: ${child.name}`)
                }
            }
        }
    }

    console.log('✨ Seed Complete!')
}

seedCategories()
