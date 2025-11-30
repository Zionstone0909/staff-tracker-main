// src/pages/AdminDashboard.tsx
"use client";

import React, { useState, useEffect, CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { ShoppingCart, TrendingUp, Clock, CheckCircle } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

// -------------------- MOCK DATA --------------------
const yearlyRevenueData = [
  { month: "Jan", revenue: 120000 },
  { month: "Feb", revenue: 150000 },
  { month: "Mar", revenue: 90000 },
  { month: "Apr", revenue: 200000 },
  { month: "May", revenue: 175000 },
  { month: "Jun", revenue: 220000 },
  { month: "Jul", revenue: 250000 },
  { month: "Aug", revenue: 190000 },
  { month: "Sep", revenue: 280000 },
  { month: "Oct", revenue: 300000 },
  { month: "Nov", revenue: 160000 },
  { month: "Dec", revenue: 350000 },
];

const useDashboardStats = () => ({
  loading: false,
  totalRevenue: 5000000,
  totalProfit: 1200000,
  outstandingSales: 5,
  completedSales: 95,
  recentActivities: [
    "Admin logged in successfully.",
    "Sales report generated for Q3.",
    "Inventory adjusted for item X.",
  ],
});

const getCurrentMonthIndex = () => new Date().getMonth();

const getSlidingRevenue = () => {
  const currentMonthIndex = getCurrentMonthIndex();
  const start = (currentMonthIndex - 5 + 12) % 12;
  const end = currentMonthIndex + 1;
  let slidingWindow = [];
  if (start <= currentMonthIndex) {
    slidingWindow = yearlyRevenueData.slice(start, end);
  } else {
    slidingWindow = [...yearlyRevenueData.slice(start), ...yearlyRevenueData.slice(0, end)];
  }
  return slidingWindow;
};

// -------------------- COLORS --------------------
const PrimaryColor = "#4f46e5";
const DangerColor = "#ef4444";
const SuccessColor = "#10b981";
const TextColor = "#111827";
const MutedColor = "#6b7280";
const LightBg = "#f3f4f6";
const CardBg = "#fff";

// -------------------- RESPONSIVENESS HOOK --------------------
const useWindowWidth = () => {
  const [width, setWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 1400);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  return width;
};

// -------------------- UI COMPONENTS --------------------
interface CardProps {
  style?: CSSProperties;
  children: React.ReactNode;
}
const Card: React.FC<CardProps> = ({ children, style }) => (
  <div
    style={{
      backgroundColor: CardBg,
      borderRadius: 8,
      boxShadow: "0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)",
      ...style,
    }}
  >
    {children}
  </div>
);

const CardHeader: React.FC<CardProps> = ({ children, style }) => <div style={style}>{children}</div>;
const CardContent: React.FC<CardProps> = ({ children, style }) => <div style={style}>{children}</div>;
const CardTitle: React.FC<CardProps> = ({ children, style }) => (
  <h2 style={{ fontSize: 16, fontWeight: 600, color: "inherit", margin: 0, ...style }}>{children}</h2>
);
const CardDescription: React.FC<CardProps> = ({ children, style }) => (
  <div style={{ fontSize: 14, color: "inherit", margin: 0, ...style }}>{children}</div>
);

interface ButtonProps {
  onClick: () => void;
  style?: CSSProperties;
  children: React.ReactNode;
}
const Button: React.FC<ButtonProps> = ({ children, onClick, style }) => (
  <button
    onClick={onClick}
    style={{
      padding: "0.5rem 1rem",
      backgroundColor: DangerColor,
      color: "#fff",
      border: "none",
      borderRadius: "0.25rem",
      cursor: "pointer",
      fontWeight: 600,
      transition: "background-color 0.2s",
      ...style,
    }}
  >
    {children}
  </button>
);

const NavLink: React.FC<{ to: string; name: string }> = ({ to, name }) => {
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate(); // <-- FIX: Use useNavigate
  const { user } = useAuth();
  if (!user) return null;

  const baseStyle: CSSProperties = {
    backgroundColor: CardBg,
    border: "1px solid #e5e7eb",
    padding: "0.75rem 1rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 500,
    fontSize: 0.875 + "rem",
    color: TextColor,
    textDecoration: "none",
    transition: "background-color 0.15s, border-color 0.15s",
    borderRadius: "0.375rem",
    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
    textAlign: "center",
    cursor: "pointer", // Added cursor style
  };
  const hoverStyle: CSSProperties = isHovered ? { backgroundColor: LightBg, borderColor: PrimaryColor } : {};
  
  return (
    <div // <-- FIX: Changed to <div> to use onClick for navigation
      onClick={() => navigate(to)} // <-- FIX: Client-side routing with useNavigate
      style={{ ...baseStyle, ...hoverStyle }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {name}
    </div>
  );
};

// -------------------- NAV LINKS --------------------
const navLinks = [
  { name: "Bank Deposits", href: "/admin/bank-deposits" },
  { name: "Company Expenses", href: "/admin/company-expenses" },
  { name: "Customer Ledger", href: "/admin/customer-ledger" },
  { name: "Customers", href: "/admin/customers" },
  { name: "Due Sales", href: "/admin/due-sales" },
  { name: "Inventory", href: "/admin/inventory" },
  { name: "Payment Methods", href: "/admin/payment-methods" },
  { name: "Payroll", href: "/admin/payroll" },
  { name: "Reports", href: "/admin/reports" },
  { name: "Sales", href: "/admin/sales" },
  { name: "Stock", href: "/admin/stock" },
  { name: "Stock Adjustment", href: "/admin/stock-adjustment" },
  { name: "Stock Movement", href: "/admin/stock-movement" },
  { name: "Supplier Ledger", href: "/admin/supplier-ledger" },
  { name: "Suppliers", href: "/admin/suppliers" },
];

// -------------------- ADMIN DASHBOARD --------------------
export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const windowWidth = useWindowWidth();
  const [monthlyRevenue, setMonthlyRevenue] = useState(getSlidingRevenue());
  const { totalRevenue, totalProfit, outstandingSales, completedSales, recentActivities, loading } = useDashboardStats();

  // -------------------- AUTH CHECK --------------------
  useEffect(() => {
    // This ensures that if the user state becomes null (e.g., token expires, or context resets), 
    // they are redirected to login. This is correct for protection.
    if (!user) navigate("/login", { replace: true });
  }, [user, navigate]);

  useEffect(() => {
    setMonthlyRevenue(getSlidingRevenue());
  }, []);

  // -------------------- LOGOUT --------------------
  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  // -------------------- REVENUE CHART --------------------
  const RevenueBarChart: React.FC = () => (
    <Card style={{ padding: "1.5rem", marginTop: "1.5rem" }}>
      <h3 style={{ margin: 0, color: TextColor }}>Revenue Performance</h3>
      <p style={{ margin: "0.5rem 0 0 0", color: MutedColor, fontSize: 0.875 + "rem" }}>
        Monthly revenue trends (Last 6 Months)
      </p>
      <div style={{ width: "100%", height: 250, marginTop: 16 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={monthlyRevenue} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid stroke="#f5f5f5" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="revenue" stroke={PrimaryColor} strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );

  const isSmallScreen = windowWidth < 640;
  const isMediumScreen = windowWidth >= 640 && windowWidth < 1024;

  const statsGridStyle: CSSProperties = {
    display: "grid",
    gap: "1.5rem",
    marginTop: 16,
    gridTemplateColumns: "repeat(4, 1fr)",
    ...(isMediumScreen && { gridTemplateColumns: "repeat(2, 1fr)" }),
    ...(isSmallScreen && { gridTemplateColumns: "1fr" }),
  };

  const navGridStyle: CSSProperties = {
    display: "grid",
    gap: "1rem",
    marginTop: 16,
    gridTemplateColumns: "repeat(3, 1fr)",
    ...(isMediumScreen && { gridTemplateColumns: "repeat(2, 1fr)" }),
    ...(isSmallScreen && { gridTemplateColumns: "1fr" }),
  };

  if (loading)
    return (
      <div style={{ textAlign: "center", marginTop: "5rem", color: MutedColor }}>Loading dashboard...</div>
    );

  return (
    <div
      style={{
        maxWidth: 1400,
        margin: "0 auto",
        padding: isSmallScreen ? "1rem" : "1.5rem",
        backgroundColor: LightBg,
        minHeight: "100vh",
        gap: "2rem",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexDirection: isSmallScreen ? "column" : "row",
          gap: isSmallScreen ? "1rem" : "0",
        }}
      >
        <h1
          style={{
            fontSize: isSmallScreen ? "1.5rem" : "1.875rem",
            lineHeight: "2.25rem",
            fontWeight: "700",
            color: TextColor,
            margin: 0,
          }}
        >
          Admin Dashboard
        </h1>
        <Button onClick={handleLogout} style={{ width: isSmallScreen ? "100%" : "auto" }}>
          Logout
        </Button>
      </div>
      <hr style={{ borderTop: "1px solid #e5e7eb", margin: 0 }} />

      {/* Stats Grid */}
      <div style={statsGridStyle}>
        <Card style={{ padding: "1.5rem" }}>
          <CardHeader style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 0 }}>
            <CardTitle style={{ color: MutedColor }}>Total Sales</CardTitle>
            <ShoppingCart style={{ height: "1.5rem", width: "1.5rem", color: PrimaryColor }} />
          </CardHeader>
          <CardContent style={{ padding: 0, marginTop: 8 }}>
            <div style={{ fontSize: "1.875rem", fontWeight: "700", color: TextColor }}>
              ₦{totalRevenue.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card style={{ padding: "1.5rem" }}>
          <CardHeader style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 0 }}>
            <CardTitle style={{ color: MutedColor }}>Total Profit</CardTitle>
            <TrendingUp style={{ height: "1.5rem", width: "1.5rem", color: SuccessColor }} />
          </CardHeader>
          <CardContent style={{ padding: 0, marginTop: 8 }}>
            <div style={{ fontSize: "1.875rem", fontWeight: "700", color: TextColor }}>
              ₦{totalProfit.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card style={{ padding: "1.5rem" }}>
          <CardHeader style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 0 }}>
            <CardTitle style={{ color: MutedColor }}>Outstanding Sales</CardTitle>
            <Clock style={{ height: "1.5rem", width: "1.5rem", color: DangerColor }} />
          </CardHeader>
          <CardContent style={{ padding: 0, marginTop: 8 }}>
            <div style={{ fontSize: "1.875rem", fontWeight: "700", color: TextColor }}>{outstandingSales}</div>
          </CardContent>
        </Card>

        <Card style={{ padding: "1.5rem" }}>
          <CardHeader style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 0 }}>
            <CardTitle style={{ color: MutedColor }}>Completed Sales</CardTitle>
            <CheckCircle style={{ height: "1.5rem", width: "1.5rem", color: SuccessColor }} />
          </CardHeader>
          <CardContent style={{ padding: 0, marginTop: 8 }}>
            <div style={{ fontSize: "1.875rem", fontWeight: "700", color: TextColor }}>{completedSales}</div>
          </CardContent>
        </Card>
      </div>

      {/* Navigation */}
      <div style={navGridStyle}>{navLinks.map((link) => <NavLink key={link.href} to={link.href} name={link.name} />)}</div>

      {/* Revenue Chart */}
      <RevenueBarChart />

      {/* Recent Activity */}
      <Card style={{ backgroundColor: CardBg, boxShadow: "0 4px 6px rgba(0,0,0,0.1)", marginTop: "1.5rem" }}>
        <CardHeader style={{ padding: "1.5rem" }}>
          <CardTitle style={{ fontSize: "1.125rem", fontWeight: 600, color: TextColor }}>Recent Activity</CardTitle>
          <CardDescription style={{ color: MutedColor, fontSize: 0.875 + "rem" }}>
            Overview of stock and sales activities
          </CardDescription>
        </CardHeader>
        <CardContent style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
          {recentActivities.map((act, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                gap: "1rem",
                border: "1px solid #e5e7eb",
                borderRadius: "0.375rem",
                padding: "1rem",
                flexDirection: isSmallScreen ? "column" : "row",
                alignItems: isSmallScreen ? "flex-start" : "center",
              }}
            >
              <div
                style={{
                  height: "2.25rem",
                  width: "2.25rem",
                  borderRadius: "9999px",
                  backgroundColor: "rgba(99,102,241,0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: PrimaryColor,
                  fontWeight: 600,
                  flexShrink: 0,
                }}
              >
                {i + 1}
              </div>
              <div style={{ flex: "1 1 0%", fontSize: "0.875rem", color: "#374151" }}>{act}</div>
              <div style={{ fontSize: "0.75rem", color: "#9ca3af", whiteSpace: "nowrap", flexShrink: 0 }}>
                {new Date().toLocaleDateString()}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}