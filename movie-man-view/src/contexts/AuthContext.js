import React, { createContext, useContext, useState, useEffect } from 'react';
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

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        // Check if user is approved before allowing them to stay signed in
        const isApproved = await isApprovedContributor(session.user.id);
        if (!isApproved) {
          // Sign out non-approved users automatically
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
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        // Check if user is approved before allowing them to stay signed in
        const isApproved = await isApprovedContributor(session.user.id);
        if (!isApproved) {
          // Sign out non-approved users automatically
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
        const { error: contributorError } = await supabase
          .from('contributors')
          .insert({
            user_id: data.user.id,
            email: email,
            display_name: displayName,
            is_approved: false,
            is_admin: false,
            created_at: new Date().toISOString(),
          });

        if (contributorError) {
          console.error('Error creating contributor record:', contributorError);
        }
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  const signIn = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        // Check if user is approved before allowing sign in
        const isApproved = await isApprovedContributor(data.user.id);
        
        if (!isApproved) {
          // Sign them out immediately if not approved
          await supabase.auth.signOut();
          throw new Error('Please wait for account approval before signing in.');
        }

        await checkContributorStatus(data.user.id);
      }

      return { data, error: null };
    } catch (error) {
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
