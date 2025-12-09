"use client";

import React, {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
  useMemo,
} from "react";

import { 
    auth, 
    onAuthStateChanged, 
    User as FirebaseUser,
    getRole,
    UserRole
} from "../firebase";

// -------------------- TYPES --------------------
export type Role = Exclude<UserRole, 'viewer' | 'unauthenticated'>; 

export interface User {
  id: string;
  email: string;
  role: Role; // e.g., 'admin' or 'staff'
  token?: string;
}

interface AuthContextType {
  user: User | null;
  login: (userData: User) => Promise<void>;
  logout: () => void;
  initialized: boolean;
  firebaseUser: FirebaseUser | null;
  
  // 💡 FIX 1: ADDED MISSING PROPERTIES FOR DashboardRedirector
  role: Role | null; // Represents user.role
  loading: boolean; // Represents the opposite of initialized
}

// -------------------- CONSTANTS --------------------
const USER_STORAGE_KEY = "currentUser";

// -------------------- CONTEXT --------------------
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// -------------------- PROVIDER --------------------
export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [initialized, setInitialized] = useState(false);

  // -------------------- INITIALIZE AUTH / LISTEN TO FIREBASE --------------------
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (authUser) => {
      setFirebaseUser(authUser);
      
      const determinedRole = authUser ? getRole(authUser) : null; 

      if (authUser && determinedRole !== 'unauthenticated') {
        const storedUser = localStorage.getItem(USER_STORAGE_KEY);
        
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser) as User;
          
          if (parsedUser.id === authUser.uid) {
            setUser(parsedUser);
          } else {
            localStorage.removeItem(USER_STORAGE_KEY);
            setUser(null);
          }
        } else {
          setUser(null);
        }
      } else {
        localStorage.removeItem(USER_STORAGE_KEY);
        setUser(null);
      }

      setInitialized(true);
    });

    return () => unsubscribe();
  }, []);

  // Sync user to localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_STORAGE_KEY);
    }
  }, [user]);

  // -------------------- LOGIN / LOGOUT --------------------
  const login = async (userData: User) => {
    setUser(userData);
  };

  const logout = () => {
    setUser(null);
    setFirebaseUser(null);
  };

  // -------------------- MEMO VALUE --------------------
  const contextValue = useMemo(() => {
    // Derive the required properties from existing state
    const role = user ? user.role : null;
    const loading = !initialized;
    
    // 💡 FIX 2: EXPORT the new properties
    return { 
      user, 
      login, 
      logout, 
      initialized, 
      firebaseUser, 
      role, 
      loading 
    };
  }, [user, initialized, firebaseUser]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// -------------------- CUSTOM HOOK --------------------
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};