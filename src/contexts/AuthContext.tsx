// src/contexts/AuthContext.tsx
"use client";

import { createContext, useContext, ReactNode, useState, useEffect } from "react";

// -------------------- TYPES --------------------
export type Role = "admin" | "staff";

export interface User {
  id: string;           // or string | number if backend uses numeric IDs
  email: string;
  role: Role;
  token?: string;       // optional authentication token
}

interface AuthContextType {
  user: User | null;
  login: (userData: User) => void;
  logout: () => void;
  initialized: boolean; // Indicates if auth state is loaded (useful for guards)
}

// -------------------- CONTEXT --------------------
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// -------------------- PROVIDER --------------------
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [initialized, setInitialized] = useState(false);

  const USER_STORAGE_KEY = "currentUser";

  // Load user from localStorage on mount (optional persistence)
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem(USER_STORAGE_KEY);
      if (storedUser) {
        setUser(JSON.parse(storedUser) as User);
      }
    } catch (error) {
      console.error("Failed to load user from localStorage:", error);
      localStorage.removeItem(USER_STORAGE_KEY);
    } finally {
      setInitialized(true);
    }
  }, []);

  // Sync user to localStorage when it changes
  useEffect(() => {
    if (user) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_STORAGE_KEY);
    }
  }, [user]);

  // -------------------- LOGIN / LOGOUT --------------------
  const login = (userData: User) => setUser(userData);
  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, login, logout, initialized }}>
      {children}
    </AuthContext.Provider>
  );
};

// -------------------- CUSTOM HOOK --------------------
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
