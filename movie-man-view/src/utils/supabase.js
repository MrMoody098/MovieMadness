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
  if (!userId) return false;
  
  try {
    const { data, error } = await supabase
      .from('contributors')
      .select('is_approved')
      .eq('user_id', userId)
      .single();
    
    if (error || !data) return false;
    return data.is_approved === true;
  } catch (error) {
    console.error('Error checking user status:', error);
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
