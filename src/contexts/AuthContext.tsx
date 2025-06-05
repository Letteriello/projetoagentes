import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import firebase from 'firebase/app';
import 'firebase/auth';
import firebaseConfig from '../firebaseConfig'; // Assuming firebaseConfig.ts is in src/
import { useUserProfile } from '@/hooks/useUserProfile'; // Import useUserProfile
import { USER_ROLES } from '@/lib/zod-schemas'; // Import USER_ROLES for default

// Initialize Firebase if it hasn't been already
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  simulatedRole?: typeof USER_ROLES[number]; // Add simulatedRole
  // Add other Firebase user properties you might need
}

interface AuthContextType {
  user: User | null;
  login: (email?: string, password?: string) => Promise<void>; // Parameters will change for Firebase
  logout: () => Promise<void>;
  signup: (email?: string, password?: string) => Promise<void>; // New signup function
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { loadProfile } = useUserProfile(); // Get loadProfile function

  useEffect(() => {
    const unsubscribe = firebase.auth().onAuthStateChanged(async firebaseUser => { // make async
      if (firebaseUser) {
        const userProfile = loadProfile(); // Load profile from localStorage
        const role = userProfile?.simulatedRole || USER_ROLES[0]; // Default to "Usuário Padrão"

        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          simulatedRole: role, // Set the role
        });
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe(); // Cleanup subscription on unmount
  }, [loadProfile]); // Add loadProfile to dependency array

  const login = async (email?: string, password?: string) => {
    if (!email || !password) {
      throw new Error("Email and password are required for login.");
    }
    await firebase.auth().signInWithEmailAndPassword(email, password);
    // User state (including role via onAuthStateChanged) will be updated
  };

  const logout = async () => {
    await firebase.auth().signOut();
    // User state will be updated by onAuthStateChanged
  };

  const signup = async (email?: string, password?: string) => {
    if (!email || !password) {
      throw new Error("Email and password are required for signup.");
    }
    await firebase.auth().createUserWithEmailAndPassword(email, password);
    // User state (including role via onAuthStateChanged) will be updated
    // If a profile needs to be created here with a default role,
    // use saveProfile from useUserProfile after user creation.
    // For now, onAuthStateChanged handles loading existing profile or default.
  };

  // This effect will re-run if the user logs in/out, or if loadProfile changes (which it shouldn't).
  // If profile changes need to *immediately* reflect in AuthContext without re-login/refresh,
  // a more sophisticated state management or event bus between useUserProfile and AuthContext would be needed.
  // For this subtask, onAuthStateChanged loading the profile is sufficient.

  return (
    <AuthContext.Provider value={{ user, login, logout, signup, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};