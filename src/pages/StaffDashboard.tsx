// src/pages/StaffDashboard.tsx
"use client";

import React, { useEffect, useState, CSSProperties, PropsWithChildren } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogOut, Activity } from "lucide-react";
import { useAuth } from "../contexts/AuthContext"; // Use your real AuthContext

// ----- SALE TYPE -----
type Sale = {
  description: string;
  date: string;
  amount: number;
  profit: number;
};

// ----- MOCK DATA -----
const recentActivities = [
  { id: 1, text: "Processed customer payment for invoice #1002.", time: "1 hour ago" },
  { id: 2, text: "Updated inventory level for Item X (Stock Adjustment).", time: "3 hours ago" },
  { id: 3, text: "Generated daily Sales Report.", time: "5 hours ago" },
  { id: 4, text: "Added new supplier: Global Supplies Co.", time: "1 day ago" },
];

// ----- WINDOW WIDTH -----
const useWindowWidth = () => {
  const [width, setWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 1024);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  return {
    width,
    breakpoint: width >= 1024 ? "lg" : width >= 640 ? "md" : "sm",
  };
};

// ----- COLORS -----
const Primary = "#4f46e5";
const Muted = "#6b7280";
const Success = "#10b981";

// ---------- GLASSCARD ----------
const GlassCard: React.FC<
  PropsWithChildren<{
    style?: CSSProperties;
    onMouseEnter?: React.MouseEventHandler<HTMLDivElement>;
    onMouseLeave?: React.MouseEventHandler<HTMLDivElement>;
  }>
> = ({ children, style, onMouseEnter, onMouseLeave }) => (
  <div
    onMouseEnter={onMouseEnter}
    onMouseLeave={onMouseLeave}
    style={{
      padding: "1rem",
      borderRadius: 14,
      background: "rgba(255, 255, 255, 0.75)",
      backdropFilter: "blur(12px)",
      border: "1px solid rgba(255, 255, 255, 0.35)",
      boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
      transition: "0.2s",
      ...style,
    }}
  >
    {children}
  </div>
);

// ---------- NAV LINKS ----------
const navLinks = [
  { name: "Bank Deposits", href: "/staff/bank-deposits" },
  { name: "Company Expenses", href: "/staff/company-expenses" },
  { name: "Customer Ledger", href: "/staff/customer-ledger" },
  { name: "Customers", href: "/staff/customers" },
  { name: "Due Sales", href: "/staff/due-sales" },
  { name: "Inventory", href: "/staff/inventory" },
  { name: "Payment Methods", href: "/staff/payment-methods" },
  { name: "Payroll", href: "/staff/payroll" },
  { name: "Reports", href: "/staff/reports" },
  { name: "Sales", href: "/staff/sales" },
  { name: "Stock", href: "/staff/stock" },
  { name: "Stock Adjustment", href: "/staff/stock-adjustment" },
  { name: "Stock Movement", href: "/staff/stock-movement" },
  { name: "Supplier Ledger", href: "/staff/supplier-ledger" },
  { name: "Suppliers", href: "/staff/suppliers" },
];

// ---------- NAV CARD ----------
const NavCard: React.FC<{ name: string; to: string }> = ({ name, to }) => {
  const [hover, setHover] = useState(false);

  return (
    <Link
      to={to}
      style={{
        textDecoration: "none",
        color: "#111",
      }}
    >
      <GlassCard
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          padding: "1rem",
          textAlign: "center",
          cursor: "pointer",
          fontWeight: 600,
          transform: hover ? "translateY(-4px)" : "translateY(0)",
          boxShadow: hover
            ? "0 6px 24px rgba(0,0,0,0.08)"
            : "0 4px 16px rgba(0,0,0,0.05)",
        }}
      >
        {name}
      </GlassCard>
    </Link>
  );
};

// ---------- STAFF DASHBOARD ----------
export default function StaffDashboard() {
  const { user, logout } = useAuth(); // Reactive user from AuthContext
  const navigate = useNavigate();
  const { breakpoint } = useWindowWidth();

  const [sales, setSales] = useState<Sale[]>([]);

  useEffect(() => {
    // Redirect to login if no user
    if (!user) {
      navigate("/login", { replace: true });
    }

    // Mock sales fetch
    setSales([
      { description: "Sold Item A", date: "2025-11-18", amount: 10000, profit: 3000 },
      { description: "Sold Item B", date: "2025-11-18", amount: 20000, profit: 6000 },
      { description: "Payment Received", date: "2025-11-18", amount: 5000, profit: 0 },
    ]);
  }, [user, navigate]);

  const handleLogout = () => {
    logout(); // This clears the user state
    navigate("/login", { replace: true });
  };

  // --- Responsive styles ---
  const mainContainerStyle: CSSProperties = {
    padding: breakpoint === "sm" ? "1rem" : "2rem",
    minHeight: "100vh",
    background: "#eef1f6",
    display: "flex",
    flexDirection: "column",
    gap: breakpoint === "sm" ? "1.5rem" : "2rem",
    maxWidth: 1200,
    margin: "0 auto",
  };

  const navGridColumns =
    breakpoint === "lg" ? "repeat(4, 1fr)" : breakpoint === "md" ? "repeat(3, 1fr)" : "repeat(2, 1fr)";

  if (!user) return null; // Prevent rendering if user is not logged in

  return (
    <div style={mainContainerStyle}>
      {/* HEADER */}
      <div
        style={{
          display: "flex",
          flexDirection: breakpoint === "sm" ? "column" : "row",
          justifyContent: "space-between",
          alignItems: breakpoint === "sm" ? "flex-start" : "center",
          gap: "1rem",
        }}
      >
        <h1 style={{ fontSize: breakpoint === "sm" ? 22 : 28, fontWeight: 800, margin: 0 }}>
          Welcome Back, {user.role}
        </h1>

        <div
          style={{
            display: "flex",
            gap: "1rem",
            alignItems: "center",
            width: breakpoint === "sm" ? "100%" : "auto",
          }}
        >
          <span style={{ color: Muted, display: breakpoint === "sm" ? "none" : "block" }}>{user.email}</span>

          <button
            onClick={handleLogout}
            style={{
              padding: "0.6rem 1rem",
              background: "#ef4444",
              border: "none",
              borderRadius: 8,
              color: "#fff",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            <LogOut size={16} />
            {breakpoint === "sm" ? "Log Out" : "Logout"}
          </button>
        </div>
      </div>

      {/* NAV GRID */}
      <div>
        <h2 style={{ fontSize: breakpoint === "sm" ? 18 : 22, marginBottom: "1rem" }}>Quick Navigation</h2>
        <div
          style={{
            display: "grid",
            gap: "1rem",
            gridTemplateColumns: navGridColumns,
          }}
        >
          {navLinks.map((l) => (
            <NavCard key={l.href} to={l.href} name={l.name} />
          ))}
        </div>
      </div>

      {/* RECENT ACTIVITY */}
      <GlassCard>
        <h3
          style={{
            marginBottom: "1rem",
            fontSize: breakpoint === "sm" ? 18 : 20,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <Activity size={20} color={Success} /> Recent Activity
        </h3>

        {recentActivities.map((activity) => (
          <div
            key={activity.id}
            style={{
              padding: "0.75rem 0",
              borderBottom: "1px solid rgba(0,0,0,0.05)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              flexDirection: breakpoint === "sm" ? "column" : "row",
            }}
          >
            <div style={{ fontWeight: 500, color: "#333" }}>{activity.text}</div>
            <div
              style={{
                color: Muted,
                fontSize: 12,
                marginTop: breakpoint === "sm" ? 4 : 0,
                flexShrink: 0,
              }}
            >
              {activity.time}
            </div>
          </div>
        ))}
      </GlassCard>

      {/* RECENT SALES */}
      <GlassCard>
        <h3 style={{ marginBottom: "1rem", fontSize: breakpoint === "sm" ? 18 : 20, fontWeight: 600 }}>
          Recent Transactions
        </h3>

        {sales.map((sale, i) => (
          <div
            key={i}
            style={{
              padding: "0.75rem 0",
              borderBottom: "1px solid rgba(0,0,0,0.05)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                flexDirection: breakpoint === "sm" ? "column" : "row",
              }}
            >
              <strong>{sale.description}</strong>
              <div style={{ color: Primary, fontWeight: 600, marginTop: breakpoint === "sm" ? 4 : 0 }}>
                ₦{sale.amount.toLocaleString()}
              </div>
            </div>
          </div>
        ))}
      </GlassCard>
    </div>
  );
}
