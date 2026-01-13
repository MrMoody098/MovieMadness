import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not found. Please set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY in your .env file');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper function to check if user is approved contributor
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
    console.error('Error checking contributor status:', error);
    return false;
  }
};

// Note: Streaming services (vidking.net, vidsrc.xyz) use direct embed URLs
// with TMDB IDs and don't require API keys. The api_keys table is optional
// and can be used if you need to store API keys for other services in the future.

// Helper function to check if user is admin
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
    console.error('Error checking admin status:', error);
    return false;
  }
};
