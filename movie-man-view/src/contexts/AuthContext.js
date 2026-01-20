import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase, isApprovedContributor, isAdmin } from '../utils/supabase';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    // Return default values if used outside provider (for safety)
    return {
      user: null,
      loading: false,
      isContributor: false,
      isAdmin: false,
      signUp: async () => ({ data: null, error: { message: 'Auth not initialized' } }),
      signIn: async () => ({ data: null, error: { message: 'Auth not initialized' } }),
      signOut: async () => ({ error: null }),
    };
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isContributor, setIsContributor] = useState(false);
  const [isUserAdmin, setIsUserAdmin] = useState(false);
  const isSigningInRef = useRef(false);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      console.log('Initial session check:', session?.user?.id || 'No session');
      if (session?.user) {
        // Check if user is approved before allowing them to stay signed in
        const isApproved = await isApprovedContributor(session.user.id);
        console.log('Initial session approval check:', isApproved);
        if (!isApproved) {
          // Sign out non-approved users automatically
          console.log('Initial session: User not approved, signing out');
          await supabase.auth.signOut();
          setUser(null);
          setIsContributor(false);
          setIsUserAdmin(false);
        } else {
          setUser(session.user);
          await checkContributorStatus(session.user.id);
        }
      } else {
        setUser(null);
        setIsContributor(false);
        setIsUserAdmin(false);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change event:', event, 'User:', session?.user?.id || 'None', 'isSigningIn:', isSigningInRef.current);
      
      // Don't interfere if we're in the middle of a sign-in process
      if (isSigningInRef.current && event === 'SIGNED_IN') {
        console.log('Sign-in in progress, skipping auth state change handler');
        return;
      }
      
      if (session?.user) {
        // Check if user is approved before allowing them to stay signed in
        console.log('Auth state change: Checking approval for', session.user.id);
        const isApproved = await isApprovedContributor(session.user.id);
        console.log('Auth state change: Approval status', isApproved);
        
        if (!isApproved) {
          // Sign out non-approved users automatically
          console.log('Auth state change: User not approved, signing out');
          await supabase.auth.signOut();
          setUser(null);
          setIsContributor(false);
          setIsUserAdmin(false);
        } else {
          console.log('Auth state change: User approved, setting user state');
          setUser(session.user);
          await checkContributorStatus(session.user.id);
        }
      } else {
        console.log('Auth state change: No session, clearing user state');
        setUser(null);
        setIsContributor(false);
        setIsUserAdmin(false);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkContributorStatus = async (userId) => {
    const approved = await isApprovedContributor(userId);
    const admin = await isAdmin(userId);
    setIsContributor(approved);
    setIsUserAdmin(admin);
  };

  const signUp = async (email, password, displayName) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName,
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        const { data: contributorData, error: contributorError } = await supabase
          .from('contributors')
          .insert({
            user_id: data.user.id,
            email: email,
            display_name: displayName,
            is_approved: false,
            is_admin: false,
            created_at: new Date().toISOString(),
          })
          .select();

        if (contributorError) {
          console.error('Error creating contributor record:', contributorError);
          // Return the error so it can be displayed to the user
          return { data: null, error: { message: `Account created but failed to set up profile: ${contributorError.message}` } };
        }
        
        console.log('Contributor record created:', contributorData);
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  const signIn = async (email, password) => {
    isSigningInRef.current = true;
    try {
      console.log('Starting sign in...');
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Sign in error:', error);
        isSigningInRef.current = false;
        throw error;
      }

      console.log('Sign in successful, user:', data.user?.id);

      if (data.user) {
        // Wait a moment for session to be fully established
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Verify session is active
        const { data: sessionData } = await supabase.auth.getSession();
        console.log('Session after sign-in:', sessionData.session ? 'Active' : 'Missing');
        
        if (!sessionData.session) {
          isSigningInRef.current = false;
          throw new Error('Session not established. Please try again.');
        }
        
        // Check if user is approved before allowing sign in
        console.log('Checking approval status...');
        const isApproved = await isApprovedContributor(data.user.id);
        console.log('Approval status:', isApproved);
        
        if (!isApproved) {
          console.log('User not approved, signing out...');
          // Check if user has a contributor record at all
          const { data: contributorData, error: contributorError } = await supabase
            .from('contributors')
            .select('id, is_approved')
            .eq('user_id', data.user.id)
            .maybeSingle();
          
          console.log('Contributor record check:', { contributorData, contributorError });
          
          // Sign them out immediately if not approved
          await supabase.auth.signOut();
          isSigningInRef.current = false;
          
          if (!contributorData && !contributorError) {
            throw new Error('Account not found. Please contact support or create a new account.');
          } else if (contributorError) {
            throw new Error(`Unable to verify account status: ${contributorError.message}. Please contact support.`);
          } else {
            throw new Error('Please wait for account approval before signing in.');
          }
        }

        console.log('User approved, checking contributor status...');
        await checkContributorStatus(data.user.id);
        
        // Set user state directly to avoid race condition with listener
        setUser(data.user);
        
        console.log('Sign in complete, user state set');
        
        // Wait a bit more before clearing the flag to let the listener know we handled it
        await new Promise(resolve => setTimeout(resolve, 500));
        isSigningInRef.current = false;
      }

      return { data, error: null };
    } catch (error) {
      console.error('Sign in failed:', error);
      isSigningInRef.current = false;
      return { data: null, error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setIsContributor(false);
      setIsUserAdmin(false);
      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const value = {
    user,
    loading,
    isContributor,
    isAdmin: isUserAdmin,
    signUp,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
