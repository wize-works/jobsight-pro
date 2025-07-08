import { createServerClient } from './supabase';

export async function checkIfUserNeedsSetup(userId: string): Promise<boolean> {
  const supabase = createServerClient();
  if (!supabase) return true;

  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('business_id, businesses!users_business_id_fkey(*)')
      .eq('auth_id', userId)
      .single();

    if (error || !user?.business_id) {
      return true; // User needs setup if no business found
    }

    const business = user.businesses as any;
    if (!business) {
      return true; // No business data found
    }

    // Only business owners can complete setup
    if (business.owner_id !== userId) {
      return false; // Non-owners don't need setup (they can't do it anyway)
    }
    
    // If setup_completed is explicitly set, use that
    if (business.setup_completed !== null) {
      return !business.setup_completed;
    }

    // Fallback: Check if business has any projects, crews, or equipment (for existing users)
    const { data: projects } = await supabase
      .from('projects')
      .select('id')
      .eq('business_id', user.business_id)
      .limit(1);

    const { data: crews } = await supabase
      .from('crews')
      .select('id')
      .eq('business_id', user.business_id)
      .limit(1);

    const { data: crewMembers } = await supabase
      .from('crew_members')
      .select('id')
      .eq('business_id', user.business_id)
      .limit(1);

    // If no projects, crews, or crew members, user needs setup
    const hasData = projects?.length || crews?.length || crewMembers?.length;
    
    // Auto-update setup_completed if we detect existing data
    if (hasData) {
      await supabase
        .from('businesses')
        .update({ setup_completed: true })
        .eq('id', user.business_id);
    }

    return !hasData;
  } catch (error) {
    console.error('Error checking user setup status:', error);
    return true; // Default to needing setup if we can't check
  }
}
