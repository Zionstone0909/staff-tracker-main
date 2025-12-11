"use client";

import React, { useState, useEffect, CSSProperties, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getFirestore, collection, query, onSnapshot, where, orderBy, limit,
  Timestamp, DocumentData, CollectionReference
} from 'firebase/firestore';
import { 
  ShoppingCart, TrendingUp, Clock, CheckCircle, Package, AlertTriangle, 
  DollarSign, Users, TrendingDown, Bell, X 
} from "lucide-react";

// ========== FIREBASE CONFIGURATION & SETUP ==========

declare const __app_id: string;
declare const __firebase_config: string;

const VITE_CONFIG = {
  apiKey: "AIzaSyBU9zP00MdMLum9czZO_-AUfV8b8QqebFs",
  authDomain: "staff-tracker-main.firebaseapp.com",
  projectId: "staff-tracker-main",
  storageBucket: "staff-tracker-main.appspot.com",
  messagingSenderId: "270776261064",
  appId: "1:270776261064:web:f26b6eb3aedddc1232c8fd",
};

const APP_ID: string = typeof __app_id !== "undefined" && __app_id ? __app_id : VITE_CONFIG.appId;
const firebaseConfig = typeof __firebase_config !== "undefined" && __firebase_config ? JSON.parse(__firebase_config) : VITE_CONFIG;

let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig, APP_ID);
} else {
  try {
    app = getApp(APP_ID);
  } catch {
    app = getApps()[0];
  }
}

const db = getFirestore(app);

// ========== COLLECTION PATH HELPERS ==========
type CollectionSegments = readonly [string, string, string, string, string];
const BASE_PATH: readonly [string, string, string, string] = ["artifacts", APP_ID, "public", "data"] as const;
const getPath = (collectionName: string): CollectionSegments => [...BASE_PATH, collectionName] as CollectionSegments;
const getCollectionRef = (collectionName: string): CollectionReference<DocumentData> => collection(db, ...getPath(collectionName));

// ========== INTERFACES ==========
interface InventoryItem {
  id: string;
  name: string;
  sku?: string;
  units_available: number;
  unit_price: number;
  low_stock_threshold?: number;
}

interface SaleRecord {
  id: string;
  customerName: string;
  totalAmount: number;
  paymentMethod: string;
  date: Timestamp;
}

interface Customer {
  id: string;
  name: string;
  totalDue: number;
}

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

// ========== UI COMPONENTS ==========
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
      borderRadius: "0.375rem",
      cursor: "pointer",
      fontWeight: 600,
      transition: "background-color 0.2s",
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      justifyContent: 'center',
      ...style,
    }}
  >
    {children}
  </button>
);

// ========== LOW STOCK ALERT COMPONENT ==========
const LowStockAlerts: React.FC<{ lowStockItems: InventoryItem[], onDismiss: () => void }> = ({ lowStockItems, onDismiss }) => {
  if (lowStockItems.length === 0) return null;

  return (
    <div style={{ 
      position: 'fixed', 
      top: 20, 
      right: 20, 
      maxWidth: '400px', 
      zIndex: 1000,
      backgroundColor: '#FEF2F2',
      border: '2px solid #FCA5A5',
      borderRadius: 12,
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      animation: 'slideIn 0.3s ease-out'
    }}>
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(400px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>
      
      <div style={{ padding: '1rem', borderBottom: '1px solid #FCA5A5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Bell style={{ height: '1.25rem', width: '1.25rem', color: DangerColor, animation: 'pulse 2s ease-in-out infinite' }} />
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: DangerColor, margin: 0 }}>
            ⚠️ Low Stock Alert
          </h3>
        </div>
        <button 
          onClick={onDismiss}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
        >
          <X style={{ height: '1rem', width: '1rem', color: '#9CA3AF' }} />
        </button>
      </div>
      
      <div style={{ padding: '1rem', maxHeight: '300px', overflowY: 'auto' }}>
        <p style={{ fontSize: '0.875rem', color: '#B91C1C', fontWeight: 600, marginBottom: '0.75rem' }}>
          {lowStockItems.length} product{lowStockItems.length > 1 ? 's' : ''} running low!
        </p>
        <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', margin: 0, padding: 0, listStyle: 'none' }}>
          {lowStockItems.map((item) => (
            <li key={item.id} style={{ 
              padding: '0.75rem', 
              backgroundColor: '#FFFFFF', 
              borderRadius: 6, 
              border: '1px solid #FCA5A5',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: TextColor }}>
                  {item.name}
                </div>
                {item.sku && (
                  <div style={{ fontSize: '0.75rem', color: MutedColor, fontFamily: 'monospace' }}>
                    {item.sku}
                  </div>
                )}
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ 
                  fontSize: '1rem', 
                  fontWeight: 700, 
                  color: item.units_available === 0 ? DangerColor : WarningColor 
                }}>
                  {item.units_available}
                </div>
                <div style={{ fontSize: '0.625rem', color: MutedColor }}>
                  units left
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
      
      <div style={{ padding: '1rem', borderTop: '1px solid #FCA5A5', backgroundColor: '#FEE2E2' }}>
        <button
          onClick={() => window.location.href = '/admin/inventory'}
          style={{
            width: '100%',
            padding: '0.5rem',
            backgroundColor: DangerColor,
            color: 'white',
            border: 'none',
            borderRadius: 6,
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '0.875rem'
          }}
        >
          Go to Inventory →
        </button>
      </div>
    </div>
  );
};

// ========== NAV LINK COMPONENT ==========
const NavLink: React.FC<{ to: string; name: string }> = ({ to, name }) => {
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();
  const { user, initialized } = useAuth();

  if (!initialized) return null;
  if (!user) return null;

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

// ========== NAV LINKS ==========
const navLinks = [
{ name: "🏦 Bank Deposits", href: "/admin/bank-deposits" },
  { name: "📊 Company Expenses", href: "/admin/company-expenses" },
  { name: "📋 Customer Ledger", href: "/admin/customer-ledger" },
  { name: "👥 Customers", href: "/admin/customers" },
  { name: "📦 Inventory", href: "/admin/inventory" },
  { name: "💳 Payment Methods", href: "/admin/payments" },
  { name: "👤 Payroll", href: "/admin/payroll" },
  { name: "📈 Financial Reports", href: "/admin/reports" },
  { name: "🛒 Sales", href: "/admin/sales" },
  { name: "🔧 Stock Adjustment", href: "/admin/stock-adjustment" },
  { name: "📊 Stock Movements", href: "/admin/stock-movements" },
  { name: "📋 Supplier Ledger", href: "/admin/supplier-ledger" },
  { name: "🏭 Suppliers", href: "/admin/suppliers" },
  { name: "💰 Stock Valuation", href: "/admin/stock" },
];

// ========== MAIN COMPONENT ==========
export default function AdminDashboard() {
  const { user, logout, initialized } = useAuth();
  const navigate = useNavigate();
  const windowWidth = useWindowWidth();
  
  // No blocking loading state for data to ensure faster perceived load
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showLowStockAlert, setShowLowStockAlert] = useState(true);

  // ========== AUTH CHECK ==========
  useEffect(() => {
    if (initialized && !user) {
      navigate("/login", { replace: true });
    }
  }, [user, initialized, navigate]);

  // ========== DATA LOADING ==========
  useEffect(() => {
    // Load Inventory
    const inventoryCol = getCollectionRef('inventory');
    const unsubInventory = onSnapshot(inventoryCol, (snap) => {
      const inventoryData = snap.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          name: data.name || 'Unnamed Product',
          sku: data.sku || '',
          units_available: data.units_available || 0,
          unit_price: data.unit_price || 0,
          low_stock_threshold: data.low_stock_threshold || 5,
        } as InventoryItem;
      });
      setInventory(inventoryData);
    }, (err) => {
      console.error('Error fetching inventory:', err);
    });

    // Load Sales (recent 50)
    const salesCol = getCollectionRef('sales');
    const qSales = query(salesCol, orderBy('date', 'desc'), limit(50));
    
    const unsubSales = onSnapshot(qSales, (snap) => {
      const salesData = snap.docs.map(d => ({
        id: d.id,
        ...d.data()
      } as SaleRecord));
      setSales(salesData);
    }, (err) => {
      console.error('Error fetching sales:', err);
    });

    // Load Customers
    const customersCol = getCollectionRef('customers');
    const unsubCustomers = onSnapshot(customersCol, (snap) => {
      const customersData = snap.docs.map(d => ({
        id: d.id,
        ...d.data()
      } as Customer));
      setCustomers(customersData);
    }, (err) => {
      console.error('Error fetching customers:', err);
    });

    return () => {
      unsubInventory();
      unsubSales();
      unsubCustomers();
    };
  }, []);

  // ========== COMPUTED VALUES ==========
  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todaySales = sales.filter(sale => {
      const saleDate = new Date(sale.date.seconds * 1000);
      saleDate.setHours(0, 0, 0, 0);
      return saleDate.getTime() === today.getTime();
    });

    const totalRevenue = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const todayRevenue = todaySales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const totalInventoryValue = inventory.reduce((sum, item) => sum + (item.units_available * item.unit_price), 0);
    const customersWithDebt = customers.filter(c => c.totalDue > 0).length;
    const totalOutstanding = customers.reduce((sum, c) => sum + (c.totalDue > 0 ? c.totalDue : 0), 0);

    return {
      totalRevenue,
      todayRevenue,
      totalInventoryValue,
      totalSales: sales.length,
      todaySales: todaySales.length,
      totalCustomers: customers.length,
      customersWithDebt,
      totalOutstanding,
      lowStockCount: inventory.filter(item => item.units_available < 5).length
    };
  }, [sales, inventory, customers]);

  const lowStockItems = useMemo(() => {
    return inventory
      .filter(item => item.units_available < 5)
      .sort((a, b) => a.units_available - b.units_available);
  }, [inventory]);

  const recentActivities = useMemo(() => {
    return sales.slice(0, 5).map(sale => ({
      id: sale.id,
      description: `Sale to ${sale.customerName} - ${formatCurrency(sale.totalAmount)}`,
      timestamp: new Date(sale.date.seconds * 1000),
      type: sale.paymentMethod
    }));
  }, [sales]);

  // ========== HANDLERS ==========
  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  // ========== RESPONSIVE STYLES ==========
  const isSmallScreen = windowWidth < 640;
  const isMediumScreen = windowWidth >= 640 && windowWidth < 1024;

  const statsGridStyle: CSSProperties = {
    display: "grid",
    gap: "1.5rem",
    marginTop: 16,
    gridTemplateColumns: isSmallScreen ? "1fr" : isMediumScreen ? "repeat(2, 1fr)" : "repeat(4, 1fr)",
  };

  const navGridStyle: CSSProperties = {
    display: "grid",
    gap: "1rem",
    marginTop: 16,
    gridTemplateColumns: isSmallScreen ? "1fr" : isMediumScreen ? "repeat(2, 1fr)" : "repeat(3, 1fr)",
  };

  // ========== LOADING STATE ==========
  // Only block for auth initialization, not data fetching
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
          <p style={{ color: MutedColor, fontSize: 18, fontWeight: 600 }}>Loading...</p>
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  // ========== MAIN RENDER ==========
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
      {/* Low Stock Alerts (Floating) */}
      {showLowStockAlert && <LowStockAlerts lowStockItems={lowStockItems} onDismiss={() => setShowLowStockAlert(false)} />}

      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          // Use column-reverse on small screens to place Logout above title
          flexDirection: isSmallScreen ? "column-reverse" : "row",
          gap: isSmallScreen ? "1rem" : "0",
        }}
      >
        <div style={{ width: isSmallScreen ? "100%" : "auto" }}>
          <h1
            style={{
              fontSize: isSmallScreen ? "1.5rem" : "1.875rem",
              lineHeight: "2.25rem",
              fontWeight: "700",
              color: TextColor,
              margin: 0,
            }}
          >
            📊 Admin Dashboard
          </h1>
          <p style={{ fontSize: '0.875rem', color: MutedColor, marginTop: '0.25rem' }}>
            Welcome back, {user?.email || 'Administrator'}
          </p>
        </div>
        <Button 
          onClick={handleLogout} 
          style={{ 
            width: isSmallScreen ? "25%" : "auto", 
            justifyContent: 'center',
            alignSelf: isSmallScreen ? "flex-end" : "auto" 
          }}
        >
          <TrendingDown size={16} />
          Logout
        </Button>
      </div>
      
      <hr style={{ borderTop: "1px solid #e5e7eb", margin: 0 }} />

      {/* Low Stock Warning Banner */}
      {lowStockItems.length > 0 && (
        <div style={{ 
          padding: '1rem', 
          backgroundColor: '#FEF3C7', 
          border: '2px solid #FCD34D', 
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <AlertTriangle style={{ height: '1.5rem', width: '1.5rem', color: WarningColor }} />
            <div>
              <p style={{ fontSize: '0.875rem', fontWeight: 700, color: '#92400E', margin: 0 }}>
                ⚠️ {lowStockItems.length} Product{lowStockItems.length > 1 ? 's' : ''} Running Low!
              </p>
              <p style={{ fontSize: '0.75rem', color: '#78350F', margin: 0, marginTop: 4 }}>
                Stock below 5 units - Restock recommended
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/admin/inventory')}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: WarningColor,
              color: 'white',
              border: 'none',
              borderRadius: 6,
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: '0.875rem'
            }}
          >
            View Inventory
          </button>
        </div>
      )}

      {/* Stats Grid */}
      <div style={statsGridStyle}>
        {/* Today's Revenue */}
        <Card style={{ padding: "1.5rem", borderLeft: `4px solid ${PrimaryColor}` }}>
          <CardHeader style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 0 }}>
            <CardTitle style={{ color: MutedColor }}>Today's Sales</CardTitle>
            <ShoppingCart style={{ height: "1.5rem", width: "1.5rem", color: PrimaryColor }} />
          </CardHeader>
          <CardContent style={{ padding: 0, marginTop: 8 }}>
            <div style={{ fontSize: "1.875rem", fontWeight: "700", color: TextColor }}>
              {formatCurrency(stats.todayRevenue)}
            </div>
            <p style={{ fontSize: '0.75rem', color: MutedColor, marginTop: 4 }}>
              {stats.todaySales} transaction{stats.todaySales !== 1 ? 's' : ''} today
            </p>
          </CardContent>
        </Card>

        {/* Total Revenue */}
        <Card style={{ padding: "1.5rem", borderLeft: `4px solid ${SuccessColor}` }}>
          <CardHeader style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 0 }}>
            <CardTitle style={{ color: MutedColor }}>Total Revenue</CardTitle>
            <TrendingUp style={{ height: "1.5rem", width: "1.5rem", color: SuccessColor }} />
          </CardHeader>
          <CardContent style={{ padding: 0, marginTop: 8 }}>
            <div style={{ fontSize: "1.875rem", fontWeight: "700", color: TextColor }}>
              {formatCurrency(stats.totalRevenue)}
            </div>
            <p style={{ fontSize: '0.75rem', color: MutedColor, marginTop: 4 }}>
              {stats.totalSales} total sales
            </p>
          </CardContent>
        </Card>

        {/* Outstanding Payments */}
        <Card style={{ padding: "1.5rem", borderLeft: `4px solid ${DangerColor}` }}>
          <CardHeader style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 0 }}>
            <CardTitle style={{ color: MutedColor }}>Outstanding</CardTitle>
            <Clock style={{ height: "1.5rem", width: "1.5rem", color: DangerColor }} />
          </CardHeader>
          <CardContent style={{ padding: 0, marginTop: 8 }}>
            <div style={{ fontSize: "1.875rem", fontWeight: "700", color: TextColor }}>
              {formatCurrency(stats.totalOutstanding)}
            </div>
            <p style={{ fontSize: '0.75rem', color: MutedColor, marginTop: 4 }}>
              {stats.customersWithDebt} customer{stats.customersWithDebt !== 1 ? 's' : ''} with debt
            </p>
          </CardContent>
        </Card>

        {/* Inventory Value */}
        <Card style={{ padding: "1.5rem", borderLeft: `4px solid ${WarningColor}` }}>
          <CardHeader style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 0 }}>
            <CardTitle style={{ color: MutedColor }}>Inventory Value</CardTitle>
            <Package style={{ height: "1.5rem", width: "1.5rem", color: WarningColor }} />
          </CardHeader>
          <CardContent style={{ padding: 0, marginTop: 8 }}>
            <div style={{ fontSize: "1.875rem", fontWeight: "700", color: TextColor }}>
              {formatCurrency(stats.totalInventoryValue)}
            </div>
            <p style={{ fontSize: '0.75rem', color: stats.lowStockCount > 0 ? DangerColor : MutedColor, marginTop: 4, fontWeight: stats.lowStockCount > 0 ? 600 : 400 }}>
              {stats.lowStockCount > 0 ? `⚠️ ${stats.lowStockCount} low stock items` : '✓ All stock levels healthy'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions Navigation */}
      <div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: TextColor, marginBottom: '1rem' }}>
          Quick Actions
        </h2>
        <div style={navGridStyle}>
          {navLinks.map((link) => (
            <NavLink key={link.href} to={link.href} name={link.name} />
          ))}
        </div>
      </div>

      {/* Two Column Layout: Recent Activity & Low Stock Details */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: isSmallScreen ? '1fr' : 'repeat(2, 1fr)', 
        gap: '1.5rem',
        marginTop: '1rem'
      }}>
        
        {/* Recent Activity */}
        <Card style={{ backgroundColor: CardBg, boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }}>
          <CardHeader style={{ padding: "1.5rem", borderBottom: '1px solid #E5E7EB' }}>
            <CardTitle style={{ fontSize: "1.125rem", fontWeight: 600, color: TextColor }}>
              Recent Activity
            </CardTitle>
            <CardDescription style={{ color: MutedColor, fontSize: 0.875 + "rem", marginTop: 4 }}>
              Latest sales transactions
            </CardDescription>
          </CardHeader>
          <CardContent style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
            {recentActivities.length > 0 ? (
              recentActivities.map((activity, i) => (
                <div
                  key={activity.id}
                  style={{
                    display: "flex",
                    gap: "1rem",
                    border: "1px solid #e5e7eb",
                    borderRadius: "0.375rem",
                    padding: "1rem",
                    flexDirection: isSmallScreen ? "column" : "row",
                    alignItems: isSmallScreen ? "flex-start" : "center",
                    backgroundColor: '#F9FAFB'
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
                  <div style={{ flex: "1 1 0%", fontSize: "0.875rem", color: "#374151" }}>
                    {activity.description}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                    <div style={{ fontSize: "0.75rem", color: "#9ca3af", whiteSpace: "nowrap", flexShrink: 0 }}>
                      {activity.timestamp.toLocaleDateString()}
                    </div>
                    <span style={{
                      fontSize: '0.625rem',
                      padding: '2px 6px',
                      borderRadius: 4,
                      backgroundColor: activity.type === 'Cash' ? '#D1FAE5' : activity.type === 'Card' ? '#FEF3C7' : activity.type === 'Transfer' ? '#DBEAFE' : '#FEE2E2',
                      color: activity.type === 'Cash' ? '#065F46' : activity.type === 'Card' ? '#92400E' : activity.type === 'Transfer' ? '#1E40AF' : '#991B1B',
                      fontWeight: 600
                    }}>
                      {activity.type}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p style={{ color: MutedColor, fontSize: '0.875rem', textAlign: 'center', padding: '2rem' }}>
                No recent activity
              </p>
            )}
          </CardContent>
        </Card>

        {/* Low Stock Details */}
        <Card style={{ backgroundColor: CardBg, boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }}>
          <CardHeader style={{ padding: "1.5rem", borderBottom: '1px solid #E5E7EB' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <CardTitle style={{ fontSize: "1.125rem", fontWeight: 600, color: TextColor }}>
                  Low Stock Items
                </CardTitle>
                <CardDescription style={{ color: MutedColor, fontSize: 0.875 + "rem", marginTop: 4 }}>
                  Products below 5 units
                </CardDescription>
              </div>
              <div style={{ 
                padding: '0.5rem 0.75rem', 
                backgroundColor: lowStockItems.length > 0 ? '#FEE2E2' : '#D1FAE5',
                borderRadius: 9999,
                fontSize: '0.875rem',
                fontWeight: 700,
                color: lowStockItems.length > 0 ? DangerColor : SuccessColor
              }}>
                {lowStockItems.length}
              </div>
            </div>
          </CardHeader>
          <CardContent style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "0.75rem", maxHeight: '400px', overflowY: 'auto' }}>
            {lowStockItems.length > 0 ? (
              lowStockItems.map((item) => (
                <div
                  key={item.id}
                  style={{
                    padding: "0.75rem",
                    border: `1px solid ${item.units_available === 0 ? DangerColor : '#FCD34D'}`,
                    borderRadius: "0.375rem",
                    backgroundColor: item.units_available === 0 ? '#FEE2E2' : '#FFFBEB',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ fontSize: "0.875rem", fontWeight: 600, color: TextColor }}>
                      {item.name}
                    </div>
                    {item.sku && (
                      <div style={{ fontSize: "0.75rem", color: MutedColor, fontFamily: 'monospace', marginTop: 2 }}>
                        SKU: {item.sku}
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ 
                      fontSize: '1.25rem', 
                      fontWeight: 700, 
                      color: item.units_available === 0 ? DangerColor : WarningColor 
                    }}>
                      {item.units_available}
                    </div>
                    <div style={{ fontSize: '0.625rem', color: MutedColor }}>
                      {item.units_available === 0 ? 'OUT OF STOCK' : 'units left'}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ 
                padding: '2rem', 
                textAlign: 'center', 
                color: SuccessColor,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <CheckCircle size={48} style={{ opacity: 0.3 }} />
                <p style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>
                  ✓ All Stock Levels Healthy
                </p>
                <p style={{ fontSize: '0.875rem', color: MutedColor }}>
                  No products below the threshold
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Additional Stats Row */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: isSmallScreen ? '1fr' : 'repeat(3, 1fr)', 
        gap: '1.5rem' 
      }}>
        <Card style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <div>
              <p style={{ fontSize: '0.875rem', color: MutedColor, marginBottom: 8 }}>Total Customers</p>
              <p style={{ fontSize: '2rem', fontWeight: 700, color: TextColor, margin: 0 }}>
                {stats.totalCustomers}
              </p>
              <p style={{ fontSize: '0.75rem', color: MutedColor, marginTop: 4 }}>
                {stats.customersWithDebt} with outstanding debt
              </p>
            </div>
            <Users style={{ height: '2.5rem', width: '2.5rem', color: PrimaryColor, opacity: 0.3 }} />
          </div>
        </Card>

        <Card style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <div>
              <p style={{ fontSize: '0.875rem', color: MutedColor, marginBottom: 8 }}>Inventory Items</p>
              <p style={{ fontSize: '2rem', fontWeight: 700, color: TextColor, margin: 0 }}>
                {inventory.length}
              </p>
              <p style={{ fontSize: '0.75rem', color: MutedColor, marginTop: 4 }}>
                Total stock value: {formatCurrency(stats.totalInventoryValue)}
              </p>
            </div>
            <Package style={{ height: '2.5rem', width: '2.5rem', color: WarningColor, opacity: 0.3 }} />
          </div>
        </Card>

        <Card style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <div>
              <p style={{ fontSize: '0.875rem', color: MutedColor, marginBottom: 8 }}>Low Stock Alert</p>
              <p style={{ fontSize: '2rem', fontWeight: 700, color: lowStockItems.length > 0 ? DangerColor : SuccessColor, margin: 0 }}>
                {lowStockItems.length}
              </p>
              <p style={{ fontSize: '0.75rem', color: MutedColor, marginTop: 4 }}>
                Products need restocking
              </p>
            </div>
            <AlertTriangle style={{ height: '2.5rem', width: '2.5rem', color: lowStockItems.length > 0 ? DangerColor : SuccessColor, opacity: 0.3 }} />
          </div>
        </Card>
      </div>

      {/* System Features */}
      <div style={{ marginTop: '1rem', padding: '2rem', backgroundColor: CardBg, borderRadius: '0.75rem', border: '1px solid #e5e7eb' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: TextColor, marginBottom: '1rem' }}>
          🔥 System Features
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div style={{ padding: '1rem', backgroundColor: '#EFF6FF', borderRadius: '0.5rem', border: '1px solid #BFDBFE' }}>
            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Real-time Updates</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#2563EB' }}>Firebase Sync</div>
          </div>
          <div style={{ padding: '1rem', backgroundColor: '#D1FAE5', borderRadius: '0.5rem', border: '1px solid #6EE7B7' }}>
            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Data Security</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#059669' }}>Role-Based Access</div>
          </div>
          <div style={{ padding: '1rem', backgroundColor: '#FEF3C7', borderRadius: '0.5rem', border: '1px solid #FCD34D' }}>
            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Transaction Safety</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#D97706' }}>Atomic Updates</div>
          </div>
          <div style={{ padding: '1rem', backgroundColor: '#FCE7F3', borderRadius: '0.5rem', border: '1px solid #FBCFE8' }}>
            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Low Stock Monitoring</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#BE185D' }}>Auto Alerts</div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ marginTop: '2rem', textAlign: 'center', color: '#9ca3af', fontSize: '0.875rem', paddingBottom: '2rem' }}>
        <p>Powered by Patherfinder</p>
        <p style={{ marginTop: '0.5rem' }}> All rights reserved © {new Date().getFullYear()}</p>
      </div>
    </div>
  );
}