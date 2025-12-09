// src/components/ProtectedRoute.tsx
import React, { ReactNode } from 'react';
import { Navigate, useLocation } from "react-router-dom";
// Ensure this import path is correct for your Role type
import { useAuth, Role } from "../contexts/AuthContext"; 

interface ProtectedRouteProps {
  // Use your defined Role type (likely "admin" | "staff")
  allowedRoles?: Role[]; 
  children: ReactNode;
}

export default function ProtectedRoute({ allowedRoles, children }: ProtectedRouteProps) {
  const { user, initialized } = useAuth();
  const location = useLocation();

  // 1. Show nothing/loader until Firebase auth is initialized.
  if (!initialized) {
    return <div>Loading application state...</div>;
  }

  // 2. Handle public routes where authentication doesn't matter.
  const isPublic = !allowedRoles || allowedRoles.length === 0;
  if (isPublic) {
    return <>{children}</>;
  }

  // --- Protected Routes Logic ---

  // 3. If the user is not logged in AND the route is protected, redirect to login.
  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // 4. If logged in, check role authorization.
  if (!allowedRoles.includes(user.role)) {
    // 5. If access is denied, redirect them to a sensible default page for their role.
    let redirectPath: string;

    // Since 'Role' can only be 'admin' or 'staff' based on your types:
    switch (user.role) {
        case "admin":
            redirectPath = "/admin";
            break;
        case "staff":
            redirectPath = "/staff";
            break;
        // The 'default' case should now handle unexpected roles or be a fallback 
        // that logically shouldn't be hit if your types are strictly correct.
        default:
            // If somehow the role isn't admin or staff, send them home/a general error page
            redirectPath = "/"; 
            break;
    }

    return <Navigate to={redirectPath} replace />;
  }

  // 6. If authenticated and authorized, render the children.
  return <>{children}</>;
}
