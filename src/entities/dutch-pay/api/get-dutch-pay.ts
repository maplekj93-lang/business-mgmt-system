'use server'

import { createClient } from '@/shared/api/supabase/server';
import { DutchPayGroup, DutchPayMember } from '../model/types';

export async function getDutchPayGroups(options?: { isSettled?: boolean }): Promise<DutchPayGroup[]> {
    const supabase = await createClient();
    
    let query = supabase
        .from('dutch_pay_groups')
        .select('*')
        .order('created_at', { ascending: false });
        
    if (options?.isSettled !== undefined) {
        query = query.eq('is_settled', options.isSettled);
    }
    
    const { data: groups, error } = await query;
    
    if (error) {
        console.error('Failed to fetch dutch pay groups:', error);
        return [];
    }
    
    const groupsWithMembers = await Promise.all((groups || []).map(async (group) => {
        const { data: members, error: mError } = await supabase
            .from('dutch_pay_members')
            .select('*')
            .eq('group_id', group.id);
            
        if (mError) {
            console.error(`Failed to fetch members for group ${group.id}:`, mError);
            return { ...group, members: [] } as DutchPayGroup;
        }
        
        return { ...group, members: members || [] } as DutchPayGroup;
    }));
    
    return groupsWithMembers;
}

export async function getUnsettledDutchPaySummary() {
    const groups = await getDutchPayGroups({ isSettled: false });
    
    // Calculate total amount to receive (where member is not '나' and is_paid is false)
    let totalToReceive = 0;
    groups.forEach(group => {
        group.members.forEach((member: DutchPayMember) => {
            if (member.name !== '나' && !member.is_paid) {
                totalToReceive += member.amount_to_pay;
            }
        });
    });
    
    return {
        count: groups.length,
        totalToReceive
    };
}
