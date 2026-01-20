import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase credentials not found!');
  console.error('URL:', supabaseUrl || 'MISSING');
  console.error('Key:', supabaseAnonKey ? 'SET' : 'MISSING');
  console.error('Please set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY in GitHub Secrets');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder-key',
  {
    db: {
      schema: 'public',
    },
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
    global: {
      headers: { 'x-client-info': 'movie-madness' },
    },
  }
);

// Log Supabase configuration (without exposing the full key)
console.log('Supabase client initialized:', {
  url: supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'MISSING',
  hasKey: !!supabaseAnonKey,
  keyLength: supabaseAnonKey?.length || 0,
  fullUrl: supabaseUrl, // Log full URL for debugging
});

// Add request interceptor to log all database requests
if (typeof window !== 'undefined') {
  const originalFetch = window.fetch;
  // Avoid double-wrapping fetch during hot reloads
  if (!window.__movieMadnessSupabaseFetchWrapped) {
    window.__movieMadnessSupabaseFetchWrapped = true;
    window.fetch = function (...args) {
    const url = args[0];
    const urlStr = typeof url === 'string' ? url : (url?.url || '');
    const isSupabaseDb = typeof urlStr === 'string' && urlStr.includes('supabase.co') && (urlStr.includes('/rest/v1') || urlStr.includes('/rpc/v1'));

    if (isSupabaseDb) {
      let parsedBody = null;
      try {
        const body = args?.[1]?.body;
        if (typeof body === 'string') parsedBody = JSON.parse(body);
        else if (body) parsedBody = '[non-string body]';
      } catch {
        parsedBody = '[unparseable body]';
      }

      console.log('🔵 Supabase DB Request:', {
        url: urlStr,
        method: args?.[1]?.method || 'GET',
        body: parsedBody,
        timestamp: new Date().toISOString(),
      });
    }
    return originalFetch.apply(this, args).then(response => {
      if (isSupabaseDb) {
        console.log('🟢 Supabase DB Response:', {
          url: urlStr,
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
        });
        // Clone response to read body without consuming it
        response.clone().json().then(data => {
          console.log('🟢 Response data:', data);
        }).catch(() => {
          response.clone().text().then(text => {
            console.log('🟢 Response text:', text.substring(0, 200));
          });
        });
      }
      return response;
    });
    };
  }
}

// Test database connectivity
export const testDatabaseConnection = async () => {
  try {
    console.log('Testing database connection...');
    const { data, error } = await supabase
      .from('contributors')
      .select('count')
      .limit(0);
    
    if (error) {
      console.error('Database connection test failed:', error);
      return { success: false, error };
    }
    
    console.log('Database connection test successful');
    return { success: true, data };
  } catch (err) {
    console.error('Database connection test exception:', err);
    return { success: false, error: err };
  }
};

// Returns:
// - true: approved
// - false: explicitly not approved / no record
// - null: unknown (connectivity / timeout / cannot verify)
export const isApprovedContributor = async (userId, retries = 2) => {
  if (!userId) {
    console.log('isApprovedContributor: No userId provided');
    return false;
  }
  
  // Verify session is active before attempting query
  try {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData.session) {
      console.error('No active session for approval check:', sessionError);
      return null;
    }
    console.log('Session verified for approval check, user:', sessionData.session.user.id);
  } catch (sessionErr) {
    console.error('Failed to verify session:', sessionErr);
    return null;
  }
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      console.log(`Checking approval for user: ${userId} (attempt ${attempt + 1}/${retries + 1})`);
      
      // Small delay to ensure session is fully established after sign-in
      if (attempt === 0) {
        await new Promise(resolve => setTimeout(resolve, 500));
      } else {
        // Exponential backoff for retries
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
      }
      
      // Add timeout to prevent hanging (reduced to 10 seconds per attempt since we have retries)
      const timeoutId = Symbol('timeout');
      const timeoutPromise = new Promise((resolve) => 
        setTimeout(() => resolve({ timeout: true, id: timeoutId }), 10000)
      );
      
      // Try using RPC function first (bypasses RLS), fallback to direct query
      let data = null;
      let error = null;
      
      try {
        // Try RPC function first (more reliable, bypasses RLS)
        console.log('Attempting RPC call to is_user_approved...');
        const rpcResult = await Promise.race([
          supabase.rpc('is_user_approved', { user_uuid: userId }),
          timeoutPromise
        ]);
        
        if (rpcResult && rpcResult.timeout === true && rpcResult.id === timeoutId) {
          throw new Error('RPC call timeout after 10 seconds');
        }
        
        if (rpcResult.error) {
          console.warn('RPC call failed, falling back to direct query:', rpcResult.error);
          throw rpcResult.error;
        }
        
        // RPC succeeded
        const isApproved = rpcResult.data === true;
        console.log('RPC approval check result:', isApproved);
        return isApproved;
      } catch (rpcError) {
        console.log('RPC failed, trying direct query:', rpcError.message);
        
        // Fallback to direct query
        const queryResult = await Promise.race([
          supabase
            .from('contributors')
            .select('is_approved')
            .eq('user_id', userId)
            .maybeSingle(),
          timeoutPromise
        ]);
        
        if (queryResult && queryResult.timeout === true && queryResult.id === timeoutId) {
          throw new Error('Approval check timeout after 10 seconds');
        }
        
        data = queryResult.data;
        error = queryResult.error;
      }
      
      console.log('Approval check result:', { 
        data, 
        error, 
        errorCode: error?.code, 
        errorMessage: error?.message,
        hasData: !!data,
        isApproved: data?.is_approved
      });
      
      if (error) {
        // If timeout, retry if attempts remain
        if (error.message?.includes('timeout') && attempt < retries) {
          console.warn(`Approval check timed out, retrying... (${attempt + 1}/${retries})`);
          continue;
        }
        
        console.error('Error checking approval:', error);
        // If record doesn't exist (PGRST116), user is not approved
        if (error.code === 'PGRST116') {
          console.log('Contributor record does not exist');
          return false;
        }
        // If RLS policy blocks access, log it but still return false
        if (error.code === 'PGRST301' || error.message?.includes('permission denied') || error.message?.includes('RLS')) {
          console.error('RLS policy blocked approval check. User may not have a contributor record or RLS is misconfigured.');
          return null;
        }
        // For timeout errors on last attempt, return false
        if (error.message?.includes('timeout')) {
          console.error('Approval check timed out after all retries - this may indicate a network or RLS policy issue');
          return null;
        }
        // For other errors, log details and return false
        console.error('Unexpected error checking approval:', error);
        return null;
      }
      
      if (!data) {
        console.log('No data returned from approval check - record may not exist');
        return false;
      }
      
      const approved = data.is_approved === true;
      console.log('User approved status:', approved);
      return approved;
    } catch (error) {
      console.error(`Exception checking user status (attempt ${attempt + 1}):`, error);
      
      // Retry on timeout if attempts remain
      if (error.message?.includes('timeout') && attempt < retries) {
        console.warn(`Approval check exception, retrying... (${attempt + 1}/${retries})`);
        continue;
      }
      
      // If timeout or other error on last attempt, assume not approved for security
      return null;
    }
  }
  
  // Should never reach here, but just in case
  console.error('Approval check failed after all retries');
  return null;
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
