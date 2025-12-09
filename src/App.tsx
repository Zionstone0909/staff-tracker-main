// src/App.tsx
"use client";

// We no longer import Routes, Route, or Navigate from 'react-router-dom' 
// in this version, as the logic is handled by the map. We *can* keep them,
// but we must remove the conflicting hardcoded routes.

import { Routes, Route } from "react-router-dom"; // Keep Route and Routes for the wrapper
import ProtectedRoute from "../src/routes/ProtectedRoute";
import { routeConfig } from "./routes/routes"; // Import your config file
import { useAuth } from "./contexts/AuthContext";

export default function App() {
  const { initialized } = useAuth();

  if (!initialized) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', fontSize: '18px' }}>
        Loading application...
      </div>
    );
  }

  // Once initialized, render the router configuration.
  return (
    <Routes>
      {/* Dynamically generate ALL routes from routeConfig */}
      {routeConfig.map(({ path, component: Component, allowedRoles }) => (
        <Route
          key={path}
          path={path}
          element={
            <ProtectedRoute allowedRoles={allowedRoles}>
              <Component />
            </ProtectedRoute>
          }
        />
      ))}

      {/* 
        ✅ REMOVED the conflicting hardcoded routes for '/' and '*' 
        because those paths are already defined in your routeConfig.
      */}
      
    </Routes>
  );
}
