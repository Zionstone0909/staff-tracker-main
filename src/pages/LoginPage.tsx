// src/pages/LoginPage.tsx
"use client";

import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
// Import the specific Role type from your context
import { useAuth, Role } from "../contexts/AuthContext"; 

// --- Use the lowercase Role types defined in your AuthContext for consistency ---
type UppercaseRole = "Admin" | "Staff";

interface MockUserCredential {
  role: UppercaseRole;
  email: string;
  password: string;
  id: string;
}

// ✅ Default users now use the MockUserCredential type
const defaultUsers: MockUserCredential[] = [
  { role: "Admin", email: "d62809238@gmail.com", password: "admin12345", id: "1" },
  { role: "Staff", email: "staff1@gmail.com", password: "staff001", id: "101" },
  { role: "Staff", email: "staff2@gmail.com", password: "staff211", id: "102" },
  { role: "Staff", email: "staff3@gmail.com", password: "staff131", id: "103" },
  // ... rest of staff users ...
  { role: "Staff", email: "staff4@gmail.com", password: "staff491", id: "104" },
  { role: "Staff", email: "staff5@gmail.com", password: "staff890", id: "105" },
  { role: "Staff", email: "staff6@gmail.com", password: "staff006", id: "106" },
  { role: "Staff", email: "staff7@gmail.com", password: "staff567", id: "107" },
  { role: "Staff", email: "staff8@gmail.com", password: "staff458", id: "108" },
  { role: "Staff", email: "staff9@gmail.com", password: "staff089", id: "109" },
  { role: "Staff", email: "staff10@gmail.com", password: "staff909", id: "110" },
];

// Helper to find user by role
const findUserByRole = (role: UppercaseRole) =>
  defaultUsers.find((user) => user.role === role);


export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation(); // Used to redirect user back to where they came from
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UppercaseRole>("Admin"); // Track the current form type
  const [error, setError] = useState<string | null>(null);

  // Define where the user should go after successful login
  const redirectPath = location.state?.from || "/dashboard";

  // Form submission
  const handleSubmit = (e?: React.FormEvent, userToLogin?: MockUserCredential) => {
    if (e) e.preventDefault();
    setError(null);

    const user =
      userToLogin || defaultUsers.find((u) => u.email === email && u.password === password);

    if (!user) {
      setError("Invalid email or password.");
      return;
    }

    // --- CORRECTION 1: Map uppercase roles to the lowercase 'Role' type defined in AuthContext ---
    const roleMap: Record<UppercaseRole, Role> = { Admin: "admin", Staff: "staff" };
    const userRoleInContext = roleMap[user.role];

    login({
      id: user.id,
      email: user.email,
      role: userRoleInContext,
    });

    // --- CORRECTION 2: Navigate using the determined redirectPath ---
    // This allows the ProtectedRoute logic to bring them back to the page they wanted.
    navigate(redirectPath, { replace: true });
  };

  // Prefill only when toggle button clicked
  const handlePrefill = (user: MockUserCredential) => {
    setEmail(user.email);
    setPassword(user.password);
    setRole(user.role);
    setError(null);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#000",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        animation: "fadeIn 0.8s ease-out",
      }}
    >
      {/* ... (rest of the UI/JSX is fine and does not need correction) ... */}
       <div
        style={{
          width: "100%",
          maxWidth: "400px",
          padding: "32px",
          borderRadius: "12px",
          backgroundColor: "#0f172a",
          color: "#e2e8f0",
          boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
        }}
      >
        <h2
          style={{
            textAlign: "center",
            fontSize: "24px",
            fontWeight: 600,
            marginBottom: "24px",
          }}
        >
          {role === "Admin" ? "Admin Login" : "Staff Login"}
        </h2>

        {/* Role Toggle Buttons */}
        <div style={{ display: "flex", justifyContent: "center", gap: "12px", marginBottom: "24px" }}>
          {["Admin", "Staff"].map((r) => (
            <button
              key={r}
              onClick={() => handlePrefill(findUserByRole(r as UppercaseRole)!)}
              style={{
                padding: "8px 16px",
                borderRadius: "20px",
                fontWeight: 500,
                border: "none",
                cursor: "pointer",
                backgroundColor: role === r ? "#1e3a8a" : "#1e293b",
                color: role === r ? "#fff" : "#94a3b8",
                boxShadow: role === r ? "0 4px 10px rgba(0,0,0,0.4)" : "none",
                transition: "0.3s",
              }}
            >
              {r}
            </button>
          ))}
        </div>

        {error && (
          <div
            style={{
              backgroundColor: "#dc2626",
              color: "#fff",
              padding: "10px",
              borderRadius: "6px",
              marginBottom: "16px",
              textAlign: "center",
            }}
          >
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ display: "flex", flexDirection: "column", marginBottom: "16px" }}>
            <label style={{ marginBottom: "6px", fontSize: "14px" }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                padding: "10px",
                borderRadius: "6px",
                border: "1px solid #334155",
                backgroundColor: "#000",
                color: "#fff",
              }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", marginBottom: "20px" }}>
            <label style={{ marginBottom: "6px", fontSize: "14px" }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                padding: "10px",
                borderRadius: "6px",
                border: "1px solid #334155",
                backgroundColor: "#000",
                color: "#fff",
              }}
            />
          </div>

          <button
            type="submit"
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "8px",
              backgroundColor: "#1e3a8a",
              color: "#fff",
              fontWeight: 600,
              border: "none",
              cursor: "pointer",
              transition: "0.3s",
            }}
          >
            Login
          </button>
        </form>

        {/* Quick Login Buttons */}
        <div style={{ marginTop: "20px", textAlign: "center" }}>
          <p style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "10px" }}>Quick Login Options:</p>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "8px" }}>
            {["Admin", "Staff"].map((r) => {
              const user = findUserByRole(r as UppercaseRole)!;
              return (
                <button
                  key={r}
                  onClick={() => handleSubmit(undefined, user)}
                  style={{
                    padding: "6px 10px",
                    borderRadius: "4px",
                    border: `1px solid ${r === "Admin" ? "#4ade80" : "#60a5fa"}`,
                    backgroundColor: "transparent",
                    color: r === "Admin" ? "#4ade80" : "#60a5fa",
                    cursor: "pointer",
                    fontSize: "12px",
                  }}
                >
                  {r} Login
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Fade-in Animation */}
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}
      </style>
    </div>
  );
}
