// src/routes/ProtectedRoute.tsx
import React from 'react';
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

interface ProtectedRouteProps {
  allowedRoles: ("admin" | "staff")[];
  // Using React.ReactNode is a flexible type that handles JSX elements, strings, etc.
  children: React.ReactNode; 
}

// Removing the explicit return type annotation (like : JSX.Element) lets TypeScript infer it,
// which is usually safer if you have configuration issues.
export default function ProtectedRoute({ allowedRoles, children }: ProtectedRouteProps) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    // If the user is not logged in, redirect them to the login page.
    // The `state` object helps us redirect them back to where they were after they log in.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    // If the user is logged in but tries to access a restricted area (e.g., staff tries to access /admin)
    // redirect them to their correct dashboard.
    return <Navigate to={user.role === "admin" ? "/admin" : "/staff"} replace />;
  }

  // If the user is logged in and authorized, render the children (the actual page component).
  return <>{children}</>;
}
