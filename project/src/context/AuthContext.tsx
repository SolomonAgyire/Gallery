import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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
  provider?: string; // 'firebase' or 'email'
}

// Define auth context interface
interface AuthContextType {
  currentUser: User | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
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

// Mock user database for local development
interface StoredUser extends User {
  password: string;
}

// Environment check - in a real app, you would use environment variables
const IS_DEVELOPMENT = true; // Set to false for production

// Provider component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isVerificationEmailSent, setIsVerificationEmailSent] = useState<boolean>(false);

  // Initialize mock user database if it doesn't exist
  useEffect(() => {
    if (!localStorage.getItem('mockUserDb')) {
      // Create an empty database
      localStorage.setItem('mockUserDb', JSON.stringify([]));
    }
    
    // Add a demo account if it doesn't exist
    const mockDb = localStorage.getItem('mockUserDb');
    const users: StoredUser[] = mockDb ? JSON.parse(mockDb) : [];
    
    if (!users.some(u => u.email === 'demo@example.com')) {
      // Create demo user
      const demoUser: StoredUser = {
        id: 'demo_user',
        email: 'demo@example.com',
        firstName: 'Demo',
        lastName: 'User',
        isEmailVerified: true,
        provider: 'email',
        createdAt: new Date(),
        lastLoginAt: new Date(),
        password: 'Password123'
      };
      
      users.push(demoUser);
      localStorage.setItem('mockUserDb', JSON.stringify(users));
      console.log('Demo account created: demo@example.com / Password123');
    }
  }, []);

  // Check for stored user on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        // Convert date strings back to Date objects
        parsedUser.createdAt = new Date(parsedUser.createdAt);
        parsedUser.lastLoginAt = new Date(parsedUser.lastLoginAt);
        setCurrentUser(parsedUser);
        setIsAuthenticated(true);
      } catch (err) {
        console.error('Failed to parse stored user:', err);
        localStorage.removeItem('currentUser');
      }
    }
    setIsLoading(false);
  }, []);

  // Login with email and password
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (IS_DEVELOPMENT) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check our mock database for this user
        const mockDb = localStorage.getItem('mockUserDb');
        const users: StoredUser[] = mockDb ? JSON.parse(mockDb) : [];
        
        const user = users.find(u => u.email === email);
        
        if (!user) {
          throw new Error('No account found with this email. Please sign up first.');
        }
        
        if (user.password !== password) {
          throw new Error('Incorrect password. Please try again.');
        }
        
        // Update last login time
        user.lastLoginAt = new Date();
        localStorage.setItem('mockUserDb', JSON.stringify(users));
        
        // Remove password before setting as current user
        const { password: _, ...userWithoutPassword } = user;
        
        setCurrentUser(userWithoutPassword);
        setIsAuthenticated(true);
        localStorage.setItem('currentUser', JSON.stringify(userWithoutPassword));
        
        // If email is not verified, automatically send verification email
        if (!user.isEmailVerified && user.provider === 'email') {
          await sendVerificationEmail();
        }
      } else {
        // PRODUCTION IMPLEMENTATION WITH FIREBASE
        // This is where you would implement Firebase authentication
        // Example:
        /*
        try {
          const userCredential = await signInWithEmailAndPassword(auth, email, password);
          const firebaseUser = userCredential.user;
          
          // Create user object from Firebase user
          const user: User = {
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            firstName: firebaseUser.displayName?.split(' ')[0] || '',
            lastName: firebaseUser.displayName?.split(' ').slice(1).join(' ') || '',
            photoURL: firebaseUser.photoURL || undefined,
            isEmailVerified: firebaseUser.emailVerified,
            provider: 'firebase',
            createdAt: new Date(firebaseUser.metadata.creationTime || Date.now()),
            lastLoginAt: new Date(firebaseUser.metadata.lastSignInTime || Date.now())
          };
          
          setCurrentUser(user);
          setIsAuthenticated(true);
          localStorage.setItem('currentUser', JSON.stringify(user));
          
          // If email is not verified, automatically send verification email
          if (!user.isEmailVerified) {
            await sendVerificationEmail();
          }
        } catch (error) {
          if (error.code === 'auth/user-not-found') {
            throw new Error('No account found with this email. Please sign up first.');
          } else if (error.code === 'auth/wrong-password') {
            throw new Error('Incorrect password. Please try again.');
          } else {
            throw new Error('Failed to sign in. Please try again.');
          }
        }
        */
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to login. Please check your credentials.');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Logout
  const logout = async () => {
    setIsLoading(true);
    
    try {
      if (IS_DEVELOPMENT) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        setCurrentUser(null);
        setIsAuthenticated(false);
        localStorage.removeItem('currentUser');
      } else {
        // PRODUCTION IMPLEMENTATION WITH FIREBASE
        // Example:
        /*
        await signOut(auth);
        setCurrentUser(null);
        setIsAuthenticated(false);
        localStorage.removeItem('currentUser');
        */
      }
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Signup
  const signup = async (email: string, password: string, firstName: string, lastName: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (IS_DEVELOPMENT) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check if user already exists in our mock database
        const mockDb = localStorage.getItem('mockUserDb');
        const users: StoredUser[] = mockDb ? JSON.parse(mockDb) : [];
        
        if (users.some(u => u.email === email)) {
          throw new Error('An account with this email already exists. Please sign in instead.');
        }
        
        // Create new user
        const newUser: StoredUser = {
          id: `user_${Date.now()}`,
          email,
          firstName,
          lastName,
          isEmailVerified: false,
          provider: 'email',
          createdAt: new Date(),
          lastLoginAt: new Date(),
          password // In a real app, this would be hashed
        };
        
        // Add to mock database
        users.push(newUser);
        localStorage.setItem('mockUserDb', JSON.stringify(users));
        
        // Remove password before setting as current user
        const { password: _, ...userWithoutPassword } = newUser;
        
        setCurrentUser(userWithoutPassword);
        setIsAuthenticated(true);
        localStorage.setItem('currentUser', JSON.stringify(userWithoutPassword));
        
        // Send verification email automatically for new signups
        await sendVerificationEmail();
      } else {
        // PRODUCTION IMPLEMENTATION WITH FIREBASE
        // Example:
        /*
        try {
          // Create user with email and password
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          const firebaseUser = userCredential.user;
          
          // Update profile with name
          await updateProfile(firebaseUser, {
            displayName: `${firstName} ${lastName}`
          });
          
          // Create user object
          const user: User = {
            id: firebaseUser.uid,
            email: email,
            firstName: firstName,
            lastName: lastName,
            isEmailVerified: false,
            provider: 'firebase',
            createdAt: new Date(),
            lastLoginAt: new Date()
          };
          
          setCurrentUser(user);
          setIsAuthenticated(true);
          localStorage.setItem('currentUser', JSON.stringify(user));
          
          // Send verification email
          await sendVerificationEmail();
        } catch (error) {
          if (error.code === 'auth/email-already-in-use') {
            throw new Error('An account with this email already exists. Please sign in instead.');
          } else {
            throw new Error('Failed to create account. Please try again.');
          }
        }
        */
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create account. Please try again.');
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
      if (IS_DEVELOPMENT) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check if user exists in our mock database
        const mockDb = localStorage.getItem('mockUserDb');
        const users: StoredUser[] = mockDb ? JSON.parse(mockDb) : [];
        
        const user = users.find(u => u.email === email);
        
        if (!user) {
          throw new Error('No account found with this email address.');
        }
        
        // In a real app, this would send a password reset email
        console.log('Password reset email would be sent to:', email);
        
        // For demo purposes, we'll just reset the password to a known value
        if (user.provider === 'email') {
          user.password = 'Password123'; // In a real app, this would be a temporary token
          localStorage.setItem('mockUserDb', JSON.stringify(users));
        } else {
          throw new Error('Password reset is not available for accounts created with Firebase Sign-In.');
        }
      } else {
        // PRODUCTION IMPLEMENTATION WITH FIREBASE
        // Example:
        /*
        try {
          await sendPasswordResetEmail(auth, email);
        } catch (error) {
          if (error.code === 'auth/user-not-found') {
            throw new Error('No account found with this email address.');
          } else {
            throw new Error('Failed to send password reset email. Please try again.');
          }
        }
        */
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send password reset email. Please try again.');
      console.error('Password reset error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Update profile
  const updateProfile = async (data: Partial<User>) => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (IS_DEVELOPMENT) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        if (currentUser) {
          // Update user in mock database
          const mockDb = localStorage.getItem('mockUserDb');
          const users: StoredUser[] = mockDb ? JSON.parse(mockDb) : [];
          
          const userIndex = users.findIndex(u => u.id === currentUser.id);
          
          if (userIndex >= 0) {
            // If email is being changed, reset verification status
            if (data.email && data.email !== users[userIndex].email) {
              data.isEmailVerified = false;
            }
            
            // Update user data
            users[userIndex] = {
              ...users[userIndex],
              ...data,
              lastLoginAt: new Date()
            };
            
            localStorage.setItem('mockUserDb', JSON.stringify(users));
            
            // Update current user
            const updatedUser = { ...currentUser, ...data, lastLoginAt: new Date() };
            setCurrentUser(updatedUser);
            localStorage.setItem('currentUser', JSON.stringify(updatedUser));
          }
        }
      } else {
        // PRODUCTION IMPLEMENTATION WITH FIREBASE
        // Example:
        /*
        if (currentUser) {
          const firebaseUser = auth.currentUser;
          
          if (firebaseUser) {
            // Update display name if first or last name changed
            if (data.firstName || data.lastName) {
              const newFirstName = data.firstName || currentUser.firstName || '';
              const newLastName = data.lastName || currentUser.lastName || '';
              await updateProfile(firebaseUser, {
                displayName: `${newFirstName} ${newLastName}`
              });
            }
            
            // Update email if changed
            if (data.email && data.email !== currentUser.email) {
              await updateEmail(firebaseUser, data.email);
              // Email verification status will be reset automatically by Firebase
              data.isEmailVerified = false;
              await sendVerificationEmail();
            }
            
            // Update user in state
            const updatedUser = { ...currentUser, ...data, lastLoginAt: new Date() };
            setCurrentUser(updatedUser);
            localStorage.setItem('currentUser', JSON.stringify(updatedUser));
          }
        }
        */
      }
    } catch (err) {
      setError('Failed to update profile. Please try again.');
      console.error('Profile update error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Send verification email
  const sendVerificationEmail = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (IS_DEVELOPMENT) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        if (currentUser) {
          console.log(`Verification email sent to: ${currentUser.email}`);
          setIsVerificationEmailSent(true);
          
          // Reset the flag after 5 minutes
          setTimeout(() => {
            setIsVerificationEmailSent(false);
          }, 5 * 60 * 1000);
        }
      } else {
        // PRODUCTION IMPLEMENTATION WITH FIREBASE
        // Example:
        /*
        const firebaseUser = auth.currentUser;
        if (firebaseUser) {
          await sendEmailVerification(firebaseUser);
          setIsVerificationEmailSent(true);
          
          // Reset the flag after 5 minutes
          setTimeout(() => {
            setIsVerificationEmailSent(false);
          }, 5 * 60 * 1000);
        }
        */
      }
    } catch (err) {
      setError('Failed to send verification email. Please try again.');
      console.error('Email verification sending error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Verify email
  const verifyEmail = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (IS_DEVELOPMENT) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        if (currentUser) {
          // Update user in mock database
          const mockDb = localStorage.getItem('mockUserDb');
          const users: StoredUser[] = mockDb ? JSON.parse(mockDb) : [];
          
          const userIndex = users.findIndex(u => u.id === currentUser.id);
          
          if (userIndex >= 0) {
            users[userIndex].isEmailVerified = true;
            localStorage.setItem('mockUserDb', JSON.stringify(users));
            
            // Update current user
            const verifiedUser = { ...currentUser, isEmailVerified: true };
            setCurrentUser(verifiedUser);
            localStorage.setItem('currentUser', JSON.stringify(verifiedUser));
          }
        }
      } else {
        // PRODUCTION IMPLEMENTATION WITH FIREBASE
        // In Firebase, email verification is handled via the verification link sent to the user's email
        // This function would typically be used to refresh the user's verification status
        // Example:
        /*
        const firebaseUser = auth.currentUser;
        if (firebaseUser) {
          await firebaseUser.reload();
          
          if (firebaseUser.emailVerified) {
            const verifiedUser = { ...currentUser, isEmailVerified: true };
            setCurrentUser(verifiedUser);
            localStorage.setItem('currentUser', JSON.stringify(verifiedUser));
          }
        }
        */
      }
    } catch (err) {
      setError('Failed to verify email. Please try again.');
      console.error('Email verification error:', err);
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

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 