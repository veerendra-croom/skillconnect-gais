
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Profile, UserRole, WorkerStatus } from '../types';
import { supabase } from '../services/supabase';

interface AuthContextType {
  user: Profile | null;
  role: UserRole;
  login: (email: string, pass: string) => Promise<void>;
  register: (email: string, pass: string, name: string, role: UserRole, phone: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check active session
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          await fetchProfile(session.user.id);
        }
      } catch (error) {
        console.error('Session check failed', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        await fetchProfile(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      } else if (event === 'PASSWORD_RECOVERY') {
        // Handle password recovery event if needed
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        // Self-Healing: If profile missing (PGRST116), try to recreate it from auth metadata
        if (error.code === 'PGRST116') {
           const { data: { user: authUser } } = await supabase.auth.getUser();
           if (authUser) {
             console.log("Attempting self-healing for profile...");
             const { error: insertError } = await supabase.from('profiles').insert([{
                id: authUser.id,
                email: authUser.email,
                name: authUser.user_metadata?.name || 'User',
                role: authUser.user_metadata?.role || 'CUSTOMER',
                phone: authUser.user_metadata?.phone || ''
             }]);
             
             if (!insertError) {
                // Retry fetch
                const { data: retryData } = await supabase.from('profiles').select('*').eq('id', userId).single();
                if (retryData) {
                    if (retryData.worker_status === WorkerStatus.SUSPENDED) {
                        await supabase.auth.signOut();
                        setUser(null);
                        throw new Error("Your account has been suspended. Please contact support.");
                    }
                    setUser(retryData as Profile);
                }
                return;
             }
           }
        }
        return;
      }

      if (data) {
        if (data.worker_status === WorkerStatus.SUSPENDED) {
            console.warn("User is suspended, logging out.");
            await supabase.auth.signOut();
            setUser(null);
            // We can't easily throw to the UI here since this is often async background check
            // But state will remain null/logged out
            return;
        }
        setUser(data as Profile);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  const login = async (email: string, pass: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: pass,
    });

    if (error) {
      throw error;
    }
    
    // Check suspension immediately after login attempt logic
    // The onAuthStateChange will trigger fetchProfile, which handles the actual suspension check
  };

  const register = async (email: string, pass: string, name: string, role: UserRole, phone: string) => {
    // The SQL Trigger 'on_auth_user_created' handles creating the public.profiles row.
    const { error } = await supabase.auth.signUp({
      email,
      password: pass,
      options: {
        data: {
          name,
          role,
          phone
        }
      }
    });

    if (error) {
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    // For PWA, we usually redirect them to a page where they can enter new password
    // Ensure you have Site URL configured in Supabase Auth Settings
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/#/settings', // Redirect to settings page to update password
    });
    if (error) throw error;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        role: user ? user.role : UserRole.GUEST, 
        login, 
        register,
        resetPassword,
        logout,
        refreshProfile,
        isAuthenticated: !!user,
        isLoading
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
