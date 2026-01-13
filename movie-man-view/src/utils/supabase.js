import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase credentials not found!');
  console.error('URL:', supabaseUrl || 'MISSING');
  console.error('Key:', supabaseAnonKey ? 'SET' : 'MISSING');
  console.error('Please set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY in GitHub Secrets');
}

export const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey || 'placeholder-key');

export const isApprovedContributor = async (userId) => {
  if (!userId) {
    console.log('isApprovedContributor: No userId provided');
    return false;
  }
  
  try {
    console.log('Checking approval for user:', userId);
    const { data, error } = await supabase
      .from('contributors')
      .select('is_approved')
      .eq('user_id', userId)
      .single();
    
    console.log('Approval check result:', { data, error });
    
    if (error) {
      console.error('Error checking approval:', error);
      // If record doesn't exist, user is not approved
      if (error.code === 'PGRST116') {
        console.log('Contributor record does not exist');
        return false;
      }
      return false;
    }
    
    if (!data) {
      console.log('No data returned from approval check');
      return false;
    }
    
    const approved = data.is_approved === true;
    console.log('User approved status:', approved);
    return approved;
  } catch (error) {
    console.error('Exception checking user status:', error);
    return false;
  }
};

export const isAdmin = async (userId) => {
  if (!userId) return false;
  
  try {
    const { data, error } = await supabase
      .from('contributors')
      .select('is_admin')
      .eq('user_id', userId)
      .single();
    
    if (error || !data) return false;
    return data.is_admin === true;
  } catch (error) {
    console.error('Error checking user role:', error);
    return false;
  }
};
