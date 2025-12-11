// src/contexts/AuthContext.tsx
"use client";

import React, {
    createContext,
    useContext,
    ReactNode,
    useState,
    useEffect,
    useMemo,
} from "react";

// Assuming these are all correctly exported from your custom '../firebase' file
import { 
    onAuthStateChanged, 
    signOut, 
    User as FirebaseUser,
    getRole,
    UserRole
} from "../firebase"; 

// -------------------- TYPES --------------------
/** The custom role type for the application's authenticated user. */
export type Role = Exclude<UserRole, 'viewer' | 'unauthenticated'>; 

/** The complete local user object stored in state and localStorage. */
export interface User {
    id: string;
    email: string;
    role: Role; // e.g., 'admin' or 'staff'
    token?: string; // Optional token for internal API use
}

/** The structure of the object provided by the useAuth hook. */
interface AuthContextType {
    user: User | null; // The local, application-specific user data (including role)
    login: (userData: User) => Promise<void>;
    logout: () => Promise<void>; // Modified to be async to handle Firebase sign out
    initialized: boolean;
    firebaseUser: FirebaseUser | null; // The raw Firebase user object
    
    // Derived properties for easy consumption
    role: Role | null;
    loading: boolean; // Same as !initialized
    isLoggedIn: boolean; // Convenience check
}

// -------------------- CONSTANTS --------------------
const USER_STORAGE_KEY = "currentUser";

// -------------------- CONTEXT --------------------
// We use 'undefined' as the initial value to force the hook to check for the provider
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// -------------------- PROVIDER --------------------
export const AuthProvider: React.FC<{ children: ReactNode }> = ({
    children,
}) => {
    const [user, setUser] = useState<User | null>(null);
    const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
    const [initialized, setInitialized] = useState(false); // Indicates if the initial Firebase check is complete

    // -------------------- INITIALIZE AUTH / LISTEN TO FIREBASE --------------------
    useEffect(() => {
        
        // FIX 1: Removed 'auth' argument and explicitly typed 'authUser' as 'FirebaseUser | null'
        const unsubscribe = onAuthStateChanged(async (authUser: FirebaseUser | null) => { 
            setFirebaseUser(authUser);
            
            const determinedRole = authUser ? getRole(authUser) : null; 

            if (authUser && determinedRole && determinedRole !== 'unauthenticated' && determinedRole !== 'viewer') {
                const storedUser = localStorage.getItem(USER_STORAGE_KEY);
                
                if (storedUser) {
                    const parsedUser = JSON.parse(storedUser) as User;
                    
                    // Sanity check: only restore stored user if UID matches current auth user
                    if (parsedUser.id === authUser.uid) {
                        setUser(parsedUser);
                    } else {
                        // Mismatch: clear stored user and local state
                        localStorage.removeItem(USER_STORAGE_KEY);
                        setUser(null);
                    }
                } else {
                    // Firebase user exists but no local data: set user to null, requiring a custom 'login' process after Firebase sign-in
                    // This handles cases where a user is signed in via Firebase but hasn't completed the app's internal 'login' process (which sets role/token)
                    setUser(null); 
                }
            } else {
                // Not authenticated or role is 'unauthenticated'/'viewer': clear local state
                localStorage.removeItem(USER_STORAGE_KEY);
                setUser(null);
            }

            // Authentication state has been checked and processed
            setInitialized(true);
        });

        // Cleanup function
        return () => unsubscribe();
    }, []); 

    // Sync user to localStorage whenever the local `user` state changes
    useEffect(() => {
        if (user) {
            localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
        } else {
            localStorage.removeItem(USER_STORAGE_KEY);
        }
    }, [user]);

    // -------------------- LOGIN / LOGOUT FUNCTIONS --------------------
    
    // Login stores the application-specific user data
    const login = async (userData: User) => {
        setUser(userData);
        // Note: Actual Firebase sign-in is expected to happen externally before this is called
    };

    // Logout handles both local state and Firebase sign out
    const logout = async () => {
        // 1. Clear local state first
        setUser(null);
        setFirebaseUser(null); 
        localStorage.removeItem(USER_STORAGE_KEY);
        
        // 2. Perform Firebase sign out
        // FIX 2: Removed 'auth' argument (assuming your firebase wrapper handles it internally)
        await signOut();
    };

    // -------------------- MEMO VALUE --------------------
    const contextValue = useMemo(() => {
        // Derive the required properties from existing state
        const role = user ? user.role : null;
        const loading = !initialized;
        const isLoggedIn = !!user; // Check based on the application user object
        
        return { 
            user, 
            login, 
            logout, 
            initialized, 
            firebaseUser, 
            role, 
            loading,
            isLoggedIn,
        };
    }, [user, initialized, firebaseUser]); // Dependencies are state variables; login/logout are stable if they don't change

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};

// -------------------- CUSTOM HOOK --------------------
/**
 * Custom hook to consume the AuthContext, providing user data, role, and auth functions.
 * @returns AuthContextType
 */
export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};