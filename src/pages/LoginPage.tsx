// src/pages/LoginPage.tsx
"use client";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, Role } from "../contexts/AuthContext";

interface UserCredential {
  role: "Admin" | "Staff";
  email: string;
  password: string;
  id: string;
}

// ✅ Default users
const defaultUsers: UserCredential[] = [
  { role: "Admin", email: "d62809238@gmail.com", password: "admin12345", id: "1" },
  { role: "Staff", email: "staff1@gmail.com", password: "staff001", id: "101" },
  { role: "Staff", email: "staff2@gmail.com", password: "staff211", id: "102" },
  { role: "Staff", email: "staff3@gmail.com", password: "staff131", id: "103" },
  { role: "Staff", email: "staff4@gmail.com", password: "staff491", id: "104" },
  { role: "Staff", email: "staff5@gmail.com", password: "staff890", id: "105" },
  { role: "Staff", email: "staff6@gmail.com", password: "staff006", id: "106" },
  { role: "Staff", email: "staff7@gmail.com", password: "staff567", id: "107" },
  { role: "Staff", email: "staff8@gmail.com", password: "staff458", id: "108" },
  { role: "Staff", email: "staff9@gmail.com", password: "staff089", id: "109" },
  { role: "Staff", email: "staff10@gmail.com", password: "staff909", id: "110" },
];

// Helper to find user by role
const findUserByRole = (role: "Admin" | "Staff") =>
  defaultUsers.find((user) => user.role === role);

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  // 🛑 Start with empty credentials to prevent automatic login
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"Admin" | "Staff">("Admin");
  const [error, setError] = useState<string | null>(null);

  // Form submission
  const handleSubmit = (e?: React.FormEvent, userToLogin?: UserCredential) => {
    if (e) e.preventDefault();
    setError(null);

    // Use passed user for quick login or find from form
    const user =
      userToLogin || defaultUsers.find((u) => u.email === email && u.password === password);

    if (!user) {
      setError("Invalid email or password.");
      return;
    }

    // Map to context Role type
    const roleMap: Record<"Admin" | "Staff", Role> = { Admin: "admin", Staff: "staff" };
    login({
      id: user.id,
      email: user.email,
      role: roleMap[user.role],
    });

    // Navigate based on role
    navigate(user.role === "Admin" ? "/admin" : "/staff");
  };

  // Prefill only when toggle button clicked
  const handlePrefill = (user: UserCredential) => {
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
              onClick={() => handlePrefill(findUserByRole(r as "Admin" | "Staff")!)}
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
              const user = findUserByRole(r as "Admin" | "Staff")!;
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
