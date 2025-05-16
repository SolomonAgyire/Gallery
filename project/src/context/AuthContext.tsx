import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createClient, SupabaseClient, User as SupabaseUser } from '@supabase/supabase-js';

// Define user interface
export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  photoURL?: string;
  isEmailVerified: boolean;
  createdAt: Date;
  lastLoginAt: Date;
  provider?: string;
}

// Define auth context interface
interface AuthContextType {
  currentUser: User | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  signup: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  verifyEmail: () => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
  isVerificationEmailSent: boolean;
}

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

// Provider component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isVerificationEmailSent, setIsVerificationEmailSent] = useState<boolean>(false);

  // Check for stored user on mount and set up auth state listener
  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          throw sessionError;
        }

        if (session?.user) {
          await handleUserSession(session.user);
        } else {
          setCurrentUser(null);
          setIsAuthenticated(false);
        }
      } catch (err) {
        console.error('Error getting initial session:', err);
        setCurrentUser(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    getInitialSession();

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);
      
      if (event === 'SIGNED_IN' && session?.user) {
        await handleUserSession(session.user);
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
        setIsAuthenticated(false);
        setError(null);
      } else if (event === 'USER_UPDATED' && session?.user) {
        await handleUserSession(session.user);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Helper function to handle user session
  const handleUserSession = async (supabaseUser: SupabaseUser) => {
    try {
      // Get additional user data from your profiles table
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();

      if (profileError) {
        throw profileError;
      }

      const user: User = {
        id: supabaseUser.id,
        email: supabaseUser.email || '',
        firstName: profile?.first_name || supabaseUser.user_metadata?.first_name,
        lastName: profile?.last_name || supabaseUser.user_metadata?.last_name,
        photoURL: supabaseUser.user_metadata?.avatar_url,
        isEmailVerified: supabaseUser.email_confirmed_at !== null,
        provider: supabaseUser.app_metadata?.provider,
        createdAt: new Date(supabaseUser.created_at),
        lastLoginAt: new Date()
      };

      setCurrentUser(user);
      setIsAuthenticated(true);
      setError(null);
    } catch (err) {
      console.error('Error handling user session:', err);
      setError('Failed to load user data');
      setCurrentUser(null);
      setIsAuthenticated(false);
    }
  };

  // Login with email and password
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (signInError) {
        throw signInError;
      }

      if (!data.user) {
        throw new Error('No user data returned');
      }

      await handleUserSession(data.user);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to login';
      setError(errorMessage);
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Login with Google
  const loginWithGoogle = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) {
        throw error;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to login with Google';
      setError(errorMessage);
      console.error('Google login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Logout
  const logout = async () => {
    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }

      setCurrentUser(null);
      setIsAuthenticated(false);
    } catch (err) {
      console.error('Logout error:', err);
      setError('Failed to logout');
    } finally {
      setIsLoading(false);
    }
  };

  // Signup
  const signup = async (email: string, password: string, firstName: string, lastName: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName
          }
        }
      });

      if (signUpError) {
        throw signUpError;
      }

      if (!data.user) {
        throw new Error('No user data returned');
      }

      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([
          {
            id: data.user.id,
            first_name: firstName,
            last_name: lastName,
            email: email,
            updated_at: new Date().toISOString()
          }
        ]);

      if (profileError) {
        console.error('Profile creation error:', profileError);
      }

      setIsVerificationEmailSent(true);
      setCurrentUser({
        id: data.user.id,
        email: data.user.email || '',
        firstName,
        lastName,
        isEmailVerified: false,
        createdAt: new Date(data.user.created_at),
        lastLoginAt: new Date()
      });
      setIsAuthenticated(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create account';
      setError(errorMessage);
      console.error('Signup error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Reset password
  const resetPassword = async (email: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) {
        throw error;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send reset password email';
      setError(errorMessage);
      console.error('Reset password error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Update profile
  const updateProfile = async (data: Partial<User>) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Update auth metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          first_name: data.firstName,
          last_name: data.lastName
        }
      });

      if (authError) {
        throw authError;
      }

      // Update profile in profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          first_name: data.firstName,
          last_name: data.lastName
        })
        .eq('id', currentUser?.id);

      if (profileError) {
        throw profileError;
      }

      // Update local state
      if (currentUser) {
        setCurrentUser({
          ...currentUser,
          ...data
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update profile';
      setError(errorMessage);
      console.error('Update profile error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Send verification email
  const sendVerificationEmail = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: currentUser?.email || ''
      });

      if (error) {
        throw error;
      }

      setIsVerificationEmailSent(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send verification email';
      setError(errorMessage);
      console.error('Send verification email error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Verify email
  const verifyEmail = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { error } = await supabase.auth.verifyOtp({
        token_hash: window.location.hash,
        type: 'email'
      });

      if (error) {
        throw error;
      }

      // Refresh user session to get updated email verification status
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await handleUserSession(session.user);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to verify email';
      setError(errorMessage);
      console.error('Verify email error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    currentUser,
    isLoading,
    error,
    isAuthenticated,
    login,
    loginWithGoogle,
    logout,
    signup,
    resetPassword,
    updateProfile,
    verifyEmail,
    sendVerificationEmail,
    isVerificationEmailSent
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 