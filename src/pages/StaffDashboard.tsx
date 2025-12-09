// src/pages/StaffDashboard.tsx

"use client";

import React, { useEffect, useState, CSSProperties, useMemo } from "react";
// Assuming you have 'react-router-dom' installed and configured for routing.
import { useNavigate } from "react-router-dom";
import { LogOut, Activity, ShoppingCart, Users, Package } from "lucide-react";
// Assuming AuthContext is correctly defined and provides a 'user' object with an 'id'.
import { useAuth } from "../contexts/AuthContext";

// Define the expected structure for the user object from useAuth
// IMPORTANT: Adjust this type to match the actual structure of your 'user' object from AuthContext, 
// especially ensuring an 'id' or 'staffId' is present for data filtering.
interface StaffUser {
  id: string; // The unique ID used to filter data
  email: string;
  role: string;
  // ... other properties (e.g., name)
}

// Extend the AuthContext return type to include the typed user
interface AuthContextType {
    user: StaffUser | null;
    logout: () => void;
    initialized: boolean;
}
// Note: The original file did not include the AuthContext definition, 
// so we assume the useAuth() hook returns an object matching AuthContextType.

// ========== STYLING CONSTANTS ==========
const PrimaryColor = "#4f46e5";
const DangerColor = "#ef4444";
const SuccessColor = "#10b981";
const WarningColor = "#f59e0b";
const TextColor = "#111827";
const MutedColor = "#6b7280";
const LightBg = "#f3f4f6";
const CardBg = "#fff";

// ========== UTILITY FUNCTIONS ==========
const formatCurrency = (value: number) => `₦${value.toLocaleString('en-NG', { minimumFractionDigits: 0 })}`;

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

// ========== UI COMPONENTS (Card, CardHeader, CardContent, CardTitle, Button, NavLink) remain the same ==========

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
      borderRadius: "0.375rem",
      cursor: "pointer",
      fontWeight: 600,
      transition: "background-color 0.2s",
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      ...style,
    }}
  >
    {children}
  </button>
);

const NavLink: React.FC<{ to: string; name: string }> = ({ to, name }) => {
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();

  const baseStyle: CSSProperties = {
    backgroundColor: CardBg,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "#e5e7eb",
    padding: "0.75rem 1rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 500,
    fontSize: "0.875rem",
    color: TextColor,
    textDecoration: "none",
    transition: "all 0.15s",
    borderRadius: "0.375rem",
    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
    textAlign: "center",
    cursor: "pointer",
  };

  const hoverStyle: CSSProperties = isHovered
    ? { backgroundColor: LightBg, borderColor: PrimaryColor, transform: 'translateY(-2px)', boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)" }
    : {};

  return (
    <div
      onClick={() => navigate(to)}
      style={{ ...baseStyle, ...hoverStyle }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {name}
    </div>
  );
};


// ========== SALE TYPE (Modified to include staffId) ==========
type Sale = {
  staffId: string; // The ID of the staff member who made the sale
  description: string;
  date: string;
  amount: number;
  profit: number;
};

// ========== ACTIVITY TYPE (Modified to include staffId) ==========
type StaffActivity = {
  id: number;
  staffId: string; // The ID of the staff member related to the activity
  text: string;
  time: string;
};

// ========== MOCK DATA (Structured to support 10 users) ==========

// Mock data for 10 users: U1 to U10
const mockSales: Sale[] = [
  // User U1 (e.g., Staff ID 'staff-001')
  { staffId: "staff-001", description: "Sold Item A", date: "2025-11-18", amount: 10000, profit: 3000 },
  { staffId: "staff-001", description: "Sold Item B", date: "2025-11-18", amount: 20000, profit: 6000 },
  { staffId: "staff-001", description: "Payment Received", date: "2025-11-18", amount: 5000, profit: 0 },
  // User U2 (e.g., Staff ID 'staff-002') - Different data
  { staffId: "staff-002", description: "Sold Item C", date: "2025-11-18", amount: 15000, profit: 4500 },
  { staffId: "staff-002", description: "Invoice #105 Paid", date: "2025-11-17", amount: 8000, profit: 0 },
  // ... continue for staff-003 to staff-010 with unique data for each
  { staffId: "staff-003", description: "Sold Item D (Bulk)", date: "2025-11-16", amount: 50000, profit: 15000 },
  { staffId: "staff-010", description: "Sold Item Z", date: "2025-11-18", amount: 1000, profit: 100 },
];

const mockActivities: StaffActivity[] = [
  // User U1 Activity
  { id: 1, staffId: "staff-001", text: "Processed customer payment for invoice #1002.", time: "1 hour ago" },
  { id: 2, staffId: "staff-001", text: "Updated inventory level for Item X (Stock Adjustment).", time: "3 hours ago" },
  // User U2 Activity
  { id: 3, staffId: "staff-002", text: "Generated daily Sales Report.", time: "5 hours ago" },
  { id: 4, staffId: "staff-002", text: "Added new supplier: Global Supplies Co.", time: "1 day ago" },
  // User U10 Activity
  { id: 5, staffId: "staff-010", text: "Checked stock of low-volume items.", time: "2 hours ago" },
];


// ========== NAV LINKS (remain the same) ==========
const navLinks = [
  { name: "📋 Customer Ledger", href: "/staff/customer-ledger" },
  { name: "👥 Customers", href: "/staff/customers" },
  { name: "💳 Payment Methods", href: "/staff/payment-methods" },
  { name: "🛒 Sales", href: "/staff/sales" },
];

// ========== MAIN COMPONENT ==========
export default function StaffDashboard() {
  // Use the typed AuthContextType for destructuring
  const { user, logout, initialized } = useAuth() as AuthContextType; 
  const navigate = useNavigate();
  const windowWidth = useWindowWidth();

  // State to hold data for the current user
  const [currentUserSales, setCurrentUserSales] = useState<Sale[]>([]);
  const [currentUserActivities, setCurrentUserActivities] = useState<StaffActivity[]>([]);

  // ========== AUTH CHECK ==========
  useEffect(() => {
    // Redirect if not initialized or user is null (not logged in)
    if (initialized && !user) {
      navigate("/login", { replace: true });
    }
  }, [user, initialized, navigate]);

  // ========== DATA LOADING / FILTERING (Crucial Update) ==========
  useEffect(() => {
    if (user?.id) {
      // 1. Filter sales data based on the logged-in user's ID
      const salesForUser = mockSales.filter(sale => sale.staffId === user.id);
      setCurrentUserSales(salesForUser);

      // 2. Filter activities data based on the logged-in user's ID
      const activitiesForUser = mockActivities.filter(activity => activity.staffId === user.id);
      setCurrentUserActivities(activitiesForUser);
    } else {
        // Clear data if user logs out or is null
        setCurrentUserSales([]);
        setCurrentUserActivities([]);
    }
  }, [user]); // Re-run effect whenever the user object changes (e.g., after login/logout)

  // ========== COMPUTED VALUES (useMemo for efficiency) ==========
  const totalSales = useMemo(() => currentUserSales.reduce((sum, sale) => sum + sale.amount, 0), [currentUserSales]);
  const totalProfit = useMemo(() => currentUserSales.reduce((sum, sale) => sum + sale.profit, 0), [currentUserSales]);
  const transactionsCount = useMemo(() => currentUserSales.length, [currentUserSales]);


  // ========== HANDLERS ==========
  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  // ========== RESPONSIVE STYLES (remain the same) ==========
  const isSmallScreen = windowWidth < 640;
  const isMediumScreen = windowWidth >= 640 && windowWidth < 1024;

  const statsGridStyle: CSSProperties = {
    display: "grid",
    gap: "1.5rem",
    marginTop: 16,
    gridTemplateColumns: isSmallScreen ? "1fr" : isMediumScreen ? "repeat(2, 1fr)" : "repeat(3, 1fr)",
  };

  const navGridStyle: CSSProperties = {
    display: "grid",
    gap: "1rem",
    marginTop: 16,
    gridTemplateColumns: isSmallScreen ? "1fr" : isMediumScreen ? "repeat(2, 1fr)" : "repeat(3, 1fr)",
  };

  // ========== LOADING STATE (remain the same) ==========
  if (!initialized) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: LightBg }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            animation: 'spin 1s linear infinite', 
            borderRadius: '50%', 
            height: '4rem', 
            width: '4rem', 
            borderTop: '4px solid',
            borderRight: '4px solid transparent',
            borderBottom: '4px solid',
            borderLeft: '4px solid transparent',
            borderColor: PrimaryColor, 
            margin: '0 auto 1rem' 
          }}></div>
          <p style={{ color: MutedColor, fontSize: 18, fontWeight: 600 }}>Loading dashboard...</p>
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  // If initialized but no user (and auth check didn't redirect yet)
  if (!user) return null;

  // ========== MAIN RENDER (using filtered data) ==========
  return (
    <div
      style={{
        maxWidth: 1200,
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
        <div>
          <h1
            style={{
              fontSize: isSmallScreen ? "1.5rem" : "1.875rem",
              lineHeight: "2.25rem",
              fontWeight: "700",
              color: TextColor,
              margin: 0,
            }}
          >
            👋 Welcome Back, {user.role || 'Staff'} ({user.id})
          </h1>
          <p style={{ fontSize: '0.875rem', color: MutedColor, marginTop: '0.25rem' }}>
            {user.email}
          </p>
        </div>
        <Button onClick={handleLogout} style={{ width: isSmallScreen ? "100%" : "auto" }}>
          <LogOut size={16} />
          Logout
        </Button>
      </div>

      <hr style={{ borderTop: "1px solid #e5e7eb", margin: 0 }} />

      {/* Stats Grid */}
      <div style={statsGridStyle}>
        {/* Total Sales (Uses computed totalSales) */}
        <Card style={{ padding: "1.5rem", borderLeft: `4px solid ${SuccessColor}` }}>
          <CardHeader style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 0 }}>
            <CardTitle style={{ color: MutedColor }}>Total Sales</CardTitle>
            <ShoppingCart style={{ height: "1.5rem", width: "1.5rem", color: SuccessColor }} />
          </CardHeader>
          <CardContent style={{ padding: 0, marginTop: 8 }}>
            <div style={{ fontSize: "1.875rem", fontWeight: "700", color: TextColor }}>
              {formatCurrency(totalSales)}
            </div>
            <p style={{ fontSize: '0.75rem', color: MutedColor, marginTop: 4 }}>
              {transactionsCount} transaction{transactionsCount !== 1 ? 's' : ''} recorded
            </p>
          </CardContent>
        </Card>

        {/* Total Profit (Uses computed totalProfit) */}
        <Card style={{ padding: "1.5rem", borderLeft: `4px solid ${PrimaryColor}` }}>
          <CardHeader style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 0 }}>
            <CardTitle style={{ color: MutedColor }}>Total Profit</CardTitle>
            <Package style={{ height: "1.5rem", width: "1.5rem", color: PrimaryColor }} />
          </CardHeader>
          <CardContent style={{ padding: 0, marginTop: 8 }}>
            <div style={{ fontSize: "1.875rem", fontWeight: "700", color: TextColor }}>
              {formatCurrency(totalProfit)}
            </div>
            <p style={{ fontSize: '0.75rem', color: MutedColor, marginTop: 4 }}>
              From **your** sales
            </p>
          </CardContent>
        </Card>

        {/* Transactions (Uses computed transactionsCount) */}
        <Card style={{ padding: "1.5rem", borderLeft: `4px solid ${WarningColor}` }}>
          <CardHeader style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 0 }}>
            <CardTitle style={{ color: MutedColor }}>Transactions</CardTitle>
            <Users style={{ height: "1.5rem", width: "1.5rem", color: WarningColor }} />
          </CardHeader>
          <CardContent style={{ padding: 0, marginTop: 8 }}>
            <div style={{ fontSize: "1.875rem", fontWeight: "700", color: TextColor }}>
              {transactionsCount}
            </div>
            <p style={{ fontSize: '0.75rem', color: MutedColor, marginTop: 4 }}>
              Total **you** processed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Navigation (remain the same) */}
      <div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: TextColor, marginBottom: '1rem' }}>
          Quick Navigation
        </h2>
        <div style={navGridStyle}>
          {navLinks.map((link) => (
            <NavLink key={link.href} to={link.href} name={link.name} />
          ))}
        </div>
      </div>

      {/* Two Column Layout: Recent Activity & Recent Sales */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: isSmallScreen ? '1fr' : 'repeat(2, 1fr)', 
        gap: '1.5rem',
        marginTop: '1rem'
      }}>
        
        {/* Recent Activity (Uses filtered currentUserActivities) */}
        <Card style={{ backgroundColor: CardBg, boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }}>
          <CardHeader style={{ padding: "1.5rem", borderBottom: '1px solid #E5E7EB' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Activity style={{ height: "1.25rem", width: "1.25rem", color: SuccessColor }} />
              <CardTitle style={{ fontSize: "1.125rem", fontWeight: 600, color: TextColor }}>
                Your Recent Activity
              </CardTitle>
            </div>
            <p style={{ color: MutedColor, fontSize: '0.875rem', marginTop: 4, margin: 0 }}>
              Latest system activities related to your account
            </p>
          </CardHeader>
          <CardContent style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {currentUserActivities.length > 0 ? (
                currentUserActivities.map((activity) => (
                    <div
                        key={activity.id}
                        style={{
                            padding: "0.75rem",
                            borderBottom: "1px solid #f3f4f6",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            flexDirection: isSmallScreen ? "column" : "row",
                        }}
                    >
                        <div style={{ fontWeight: 500, color: "#333", fontSize: '0.875rem' }}>
                            {activity.text}
                        </div>
                        <div
                            style={{
                                color: MutedColor,
                                fontSize: '0.75rem',
                                marginTop: isSmallScreen ? 4 : 0,
                                flexShrink: 0,
                                whiteSpace: "nowrap",
                            }}
                        >
                            {activity.time}
                        </div>
                    </div>
                ))
            ) : (
                <p style={{ color: MutedColor, textAlign: 'center' }}>No recent activity recorded for your account.</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Transactions (Uses filtered currentUserSales) */}
        <Card style={{ backgroundColor: CardBg, boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }}>
          <CardHeader style={{ padding: "1.5rem", borderBottom: '1px solid #E5E7EB' }}>
            <CardTitle style={{ fontSize: "1.125rem", fontWeight: 600, color: TextColor }}>
              Your Recent Transactions
            </CardTitle>
            <p style={{ color: MutedColor, fontSize: '0.875rem', marginTop: 4, margin: 0 }}>
              Latest sales and payments **you** processed
            </p>
          </CardHeader>
          <CardContent style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {currentUserSales.length > 0 ? (
                currentUserSales.map((sale, i) => (
                    <div
                        key={i}
                        style={{
                            padding: "0.75rem",
                            borderRadius: "0.375rem",
                            backgroundColor: '#F9FAFB',
                            border: "1px solid #e5e7eb",
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                flexDirection: isSmallScreen ? "column" : "row",
                                gap: isSmallScreen ? '0.5rem' : '0',
                            }}
                        >
                            <div>
                                <strong style={{ fontSize: '0.875rem', color: TextColor }}>
                                    {sale.description}
                                </strong>
                                <div style={{ fontSize: '0.75rem', color: MutedColor, marginTop: 2 }}>
                                    {sale.date}
                                </div>
                            </div>
                            <div style={{ textAlign: isSmallScreen ? 'left' : 'right' }}>
                                <div style={{ color: PrimaryColor, fontWeight: 600, fontSize: '0.875rem' }}>
                                    {formatCurrency(sale.amount)}
                                </div>
                                {sale.profit > 0 && (
                                    <div style={{ fontSize: '0.75rem', color: SuccessColor }}>
                                        +{formatCurrency(sale.profit)} profit
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))
            ) : (
                <p style={{ color: MutedColor, textAlign: 'center' }}>No recent sales recorded for your account.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <div style={{ marginTop: '2rem', textAlign: 'center', color: '#9ca3af', fontSize: '0.875rem', paddingBottom: '2rem' }}>
        <p>Powered by Patherfinder</p>
        <p style={{ marginTop: '0.5rem' }}>All rights reserved © {new Date().getFullYear()}</p>
      </div>
    </div>
  );
}