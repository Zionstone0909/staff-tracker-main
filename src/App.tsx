// src/App.tsx
"use client";

import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import { routeConfig } from "./routes/routes";

// Pages
import LoginPage from "./pages/LoginPage";

export default function App() {
  return (
    <Routes>
      {/* Public route */}
      <Route path="/" element={<LoginPage />} />

      {/* Dynamically generate routes from routeConfig */}
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

      {/* Catch-all */}
      <Route path="*" element={<p>Page not found</p>} />
    </Routes>
  );
}
