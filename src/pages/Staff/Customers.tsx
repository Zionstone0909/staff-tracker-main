// src/pages/Staff/Customers.tsx

"use client";

import React, { useState, useEffect, CSSProperties, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Plus, Search, Mail, Phone, ShoppingCart, Clock } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

// ====================================================================
// EXPORTED TYPES TO SUPPORT CustomerForm.tsx
// ====================================================================

// Define the expected structure for the user object from useAuth
export interface StaffUser {
  id: string; // The unique ID used to filter data (e.g., 'staff-001')
  email: string;
  role: string;
}

interface AuthContextType {
    user: StaffUser | null;
    logout: () => void;
    initialized: boolean;
}

export interface Payment {
    date: number; // Unix timestamp
    amount: number;
}

/**
 * CustomerRecord represents the full schema used for creation/editing 
 * (used by CustomerForm).
 */
export interface CustomerRecord {
    id: string;
    // Core data (matches what the form collects)
    name: string;
    email: string;
    phone: string;
    notes: string;
    
    // Financial/System data
    totalDue: number; 
    isFullyPaid: boolean; 
    lastPaymentDate: number | null; 
    creationDate: number; // <--- This was the missing required field in mock data
    createdBy: string; // Staff ID
    createdByName: string; // Staff name
    payments: Payment[]; 

    // Additional fields for display in this page (derived from CustomerRecord)
    totalSales: number; 
    lastActive: string; // Date string for display
}

/**
 * Customer type for display in the list view (simpler than CustomerRecord).
 * NOTE: 'creationDate' is explicitly included to fix the TypeScript error.
 */
type Customer = Omit<CustomerRecord, 'totalDue' | 'isFullyPaid' | 'payments' | 'createdBy' | 'createdByName' | 'lastPaymentDate'> & {
    totalSales: number; 
    lastActive: string; // Date string for display
    staffId: string; // Key for assignment/filtering
};

// ========== STYLING CONSTANTS ==========
const PrimaryColor = "#4f46e5";
const SecondaryColor = "#4338ca";
const TextColor = "#111827";
const MutedColor = "#6b7280";
const LightBg = "#f3f4f6";
const CardBg = "#fff";

// ========== UTILITY FUNCTIONS / HOOKS ==========
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

// ========== UI COMPONENTS (Hover Logic Corrected) ==========

interface CardProps {
  style?: CSSProperties;
  children: React.ReactNode;
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({ children, style, onClick }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const baseStyle: CSSProperties = {
    backgroundColor: CardBg,
    borderRadius: 8,
    boxShadow: "0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)",
    transition: 'box-shadow 0.2s, transform 0.2s',
    cursor: onClick ? 'pointer' : 'default',
    ...style,
  };
  
  // Conditional style for hover state
  const hoverStyle: CSSProperties = isHovered && onClick 
    ? { boxShadow: '0 4px 10px rgba(0,0,0,0.15)', transform: 'translateY(-2px)' }
    : {};

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ ...baseStyle, ...hoverStyle }}
    >
      {children}
    </div>
  );
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  onClick: () => void;
}

const Button: React.FC<ButtonProps> = ({ children, onClick, style, variant = 'primary', ...props }) => {
  const [isHovered, setIsHovered] = useState(false);

  const baseStyle: CSSProperties = {
    padding: "0.5rem 1rem",
    color: "#fff",
    border: "none",
    borderRadius: "0.375rem",
    cursor: "pointer",
    fontWeight: 600,
    transition: "background-color 0.2s",
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  };

  // Determine button color based on hover state
  const color = isHovered 
    ? (variant === 'primary' ? SecondaryColor : PrimaryColor) // Swap colors on hover
    : (variant === 'primary' ? PrimaryColor : SecondaryColor);

  const colorStyle: CSSProperties = { backgroundColor: color };

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ ...baseStyle, ...colorStyle, ...style }}
      {...props}
    >
      {children}
    </button>
  );
};


// ========== MOCK CUSTOMER DATA (Corrected to include creationDate) ==========
const ONE_YEAR_AGO = (Date.now() / 1000) - (365 * 24 * 60 * 60);

const mockCustomers: Customer[] = [
  // Staff 1 Customers (staff-001) - 3 Customers
  { id: 'C1001', staffId: 'staff-001', name: 'Alice Johnson', email: 'alice.j@mail.com', phone: '08011111111', totalSales: 55000, lastActive: '2025-12-08', notes: 'Loyal customer', creationDate: ONE_YEAR_AGO + 10000000 },
  { id: 'C1002', staffId: 'staff-001', name: 'Ben Carson', email: 'ben.c@mail.com', phone: '08022222222', totalSales: 12000, lastActive: '2025-12-05', notes: 'First-time buyer', creationDate: ONE_YEAR_AGO + 20000000 },
  { id: 'C1003', staffId: 'staff-001', name: 'Chris Evans', email: 'chris.e@mail.com', phone: '08033333333', totalSales: 80000, lastActive: '2025-11-30', notes: 'Bulk purchaser', creationDate: ONE_YEAR_AGO + 30000000 },
  
  // Staff 2 Customers (staff-002) - 2 Customers
  { id: 'C2001', staffId: 'staff-002', name: 'David Smith', email: 'david.s@mail.com', phone: '08044444444', totalSales: 45000, lastActive: '2025-12-07', notes: 'Regular visits', creationDate: ONE_YEAR_AGO + 40000000 },
  { id: 'C2002', staffId: 'staff-002', name: 'Emily White', email: 'emily.w@mail.com', phone: '08055555555', totalSales: 92000, lastActive: '2025-12-08', notes: 'New high-value client', creationDate: ONE_YEAR_AGO + 50000000 },
  
  // Staff 3 Customers (staff-003) - 1 Customer
  { id: 'C3001', staffId: 'staff-003', name: 'Frank Green', email: 'frank.g@mail.com', phone: '08066666666', totalSales: 150000, lastActive: '2025-12-01', notes: 'Wholesale account', creationDate: ONE_YEAR_AGO + 60000000 },
  
  // Staff 4 Customers (staff-004) - 4 Customers
  { id: 'C4001', staffId: 'staff-004', name: 'Grace Hall', email: 'grace.h@mail.com', phone: '08077777777', totalSales: 21000, lastActive: '2025-12-08', notes: 'Needs follow-up', creationDate: ONE_YEAR_AGO + 70000000 },
  { id: 'C4002', staffId: 'staff-004', name: 'Henry King', email: 'henry.k@mail.com', phone: '08088888888', totalSales: 34000, lastActive: '2025-12-06', notes: 'Standard client', creationDate: ONE_YEAR_AGO + 80000000 },
  { id: 'C4003', staffId: 'staff-004', name: 'Ivy Stone', email: 'ivy.s@mail.com', phone: '08099999999', totalSales: 10000, lastActive: '2025-12-04', notes: 'Small purchases', creationDate: ONE_YEAR_AGO + 90000000 },
  { id: 'C4004', staffId: 'staff-004', name: 'Jack Brown', email: 'jack.b@mail.com', phone: '08010101010', totalSales: 60000, lastActive: '2025-12-07', notes: 'Referred by another staff', creationDate: ONE_YEAR_AGO + 100000000 },
  
  // Staff 5 Customers (staff-005) - 2 Customers
  { id: 'C5001', staffId: 'staff-005', name: 'Kelly Lin', email: 'kelly.l@mail.com', phone: '08011121314', totalSales: 77000, lastActive: '2025-12-08', notes: 'VIP account', creationDate: ONE_YEAR_AGO + 110000000 },
  { id: 'C5002', staffId: 'staff-005', name: 'Liam Miller', email: 'liam.m@mail.com', phone: '08015161718', totalSales: 18000, lastActive: '2025-12-03', notes: 'Seasonal', creationDate: ONE_YEAR_AGO + 120000000 },
  
  // The remaining 5 staff members (006-010) are represented with customers as well.
  { id: 'C6001', staffId: 'staff-006', name: 'Mia Ross', email: 'mia.r@mail.com', phone: '08019202122', totalSales: 42000, lastActive: '2025-12-07', notes: '', creationDate: ONE_YEAR_AGO + 130000000 },
  { id: 'C7001', staffId: 'staff-007', name: 'Noah Perez', email: 'noah.p@mail.com', phone: '08023242526', totalSales: 85000, lastActive: '2025-12-05', notes: '', creationDate: ONE_YEAR_AGO + 140000000 },
  { id: 'C8001', staffId: 'staff-008', name: 'Olivia Scott', email: 'olivia.s@mail.com', phone: '08027282930', totalSales: 30000, lastActive: '2025-12-08', notes: '', creationDate: ONE_YEAR_AGO + 150000000 },
  { id: 'C9001', staffId: 'staff-009', name: 'Peter Tan', email: 'peter.t@mail.com', phone: '08031323334', totalSales: 10000, lastActive: '2025-12-06', notes: '', creationDate: ONE_YEAR_AGO + 160000000 },
  { id: 'C1000', staffId: 'staff-010', name: 'Quinn Vega', email: 'quinn.v@mail.com', phone: '08035363738', totalSales: 50000, lastActive: '2025-12-08', notes: '', creationDate: ONE_YEAR_AGO + 170000000 },
];


// ========== MAIN COMPONENT ==========

export default function StaffCustomersPage() {
  const { user, initialized } = useAuth() as AuthContextType; 
  const navigate = useNavigate();
  const windowWidth = useWindowWidth();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Redirect if not authenticated
  useEffect(() => {
    if (initialized && (!user || user.role !== 'staff')) {
      navigate("/login", { replace: true });
    }
  }, [user, initialized, navigate]);

  // Data Filtering Effect (Core Logic)
  useEffect(() => {
    if (user?.id) {
      // Filter customers to show only those assigned to the logged-in staff member
      const customersForUser = mockCustomers.filter(customer => customer.staffId === user.id);
      setCustomers(customersForUser);
    } else {
      setCustomers([]);
    }
  }, [user]);

  // Search/Filter Memoization
  const filteredCustomers = useMemo(() => {
    if (!searchTerm) return customers;
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return customers.filter(customer =>
      customer.name.toLowerCase().includes(lowerCaseSearchTerm) ||
      customer.email.toLowerCase().includes(lowerCaseSearchTerm) ||
      customer.phone.includes(lowerCaseSearchTerm)
    );
  }, [customers, searchTerm]);
  
  // Stats
  const totalCustomerSales = useMemo(() => 
    customers.reduce((sum, c) => sum + c.totalSales, 0), [customers]
  );

  // Responsive Styles
  const isSmallScreen = windowWidth < 640;
  const listGridStyle: CSSProperties = {
    display: "grid",
    gap: "1rem",
    gridTemplateColumns: isSmallScreen ? "1fr" : "repeat(auto-fill, minmax(280px, 1fr))",
    marginTop: "1.5rem",
  };
  
  // Loading State
  if (!initialized || !user) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: LightBg }}>
        <p style={{ color: MutedColor, fontSize: 18, fontWeight: 600 }}>Loading...</p>
      </div>
    );
  }

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
      {/* Header and Controls */}
      <div 
        style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          flexDirection: isSmallScreen ? "column" : "row",
          gap: isSmallScreen ? "1rem" : "0",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: isSmallScreen ? "1.5rem" : "1.875rem",
              fontWeight: "700",
              color: TextColor,
              margin: 0,
            }}
          >
            Your Customers
          </h1>
          <p style={{ color: MutedColor, marginTop: '0.25rem' }}>
            Viewing **{customers.length}** customers assigned to **{user.id}**
          </p>
        </div>
        
        <Button 
          onClick={() => alert("Open CustomerForm modal/page")}
          style={{ width: isSmallScreen ? "100%" : "auto" }}
        >
          <Plus size={16} />
          Add New Customer
        </Button>
      </div>
      
      <hr style={{ borderTop: "1px solid #e5e7eb", margin: 0 }} />
      
      {/* Overview Card */}
      <Card style={{ padding: "1.5rem", borderLeft: `4px solid ${PrimaryColor}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ color: MutedColor, fontSize: 16, fontWeight: 600, margin: 0 }}>Total Sales from Your Customers</h2>
            <ShoppingCart style={{ height: "1.5rem", width: "1.5rem", color: PrimaryColor }} />
        </div>
        <div style={{ fontSize: "1.875rem", fontWeight: "700", color: TextColor, marginTop: 8 }}>
            {formatCurrency(totalCustomerSales)}
        </div>
        <p style={{ fontSize: '0.75rem', color: MutedColor, marginTop: 4 }}>
            Total revenue generated by your assigned customers.
        </p>
      </Card>
      
      {/* Search Bar */}
      <div style={{ position: 'relative' }}>
        <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', height: 18, width: 18, color: MutedColor }} />
        <input
          type="text"
          placeholder="Search by name, email, or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            padding: '0.75rem 0.75rem 0.75rem 40px',
            border: '1px solid #e5e7eb',
            borderRadius: '0.375rem',
            fontSize: '1rem',
            color: TextColor,
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
          }}
        />
      </div>

      {/* Customer List */}
      <div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: TextColor, marginBottom: '1rem' }}>
          Customer List ({filteredCustomers.length})
        </h2>
        
        {filteredCustomers.length === 0 ? (
          <Card style={{ padding: '2rem', textAlign: 'center' }}>
            <p style={{ color: MutedColor }}>
              {searchTerm 
                ? `No customers matched the search term: "${searchTerm}".` 
                : "You currently have no customers assigned to your account."
              }
            </p>
          </Card>
        ) : (
          <div style={listGridStyle}>
            {filteredCustomers.map((customer) => (
              <Card 
                key={customer.id} 
                onClick={() => alert(`Viewing details for: ${customer.name}`)}
                style={{ padding: "1.5rem" }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', borderBottom: '1px solid #f3f4f6', paddingBottom: '1rem', marginBottom: '1rem' }}>
                  <Users style={{ height: "1.5rem", width: "1.5rem", color: PrimaryColor }} />
                  <strong style={{ fontSize: '1.125rem', fontWeight: 700, color: TextColor }}>{customer.name}</strong>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: MutedColor }}>
                    <Mail size={14} />
                    <span>{customer.email}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: MutedColor }}>
                    <Phone size={14} />
                    <span>{customer.phone}</span>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '1rem', marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ textAlign: 'left' }}>
                        <div style={{ color: TextColor, fontWeight: 600 }}>{formatCurrency(customer.totalSales)}</div>
                        <div style={{ fontSize: '0.75rem', color: MutedColor, display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem' }}>
                            <ShoppingCart size={12} />
                            Total Sales
                        </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ color: TextColor, fontWeight: 600 }}>{customer.lastActive}</div>
                        <div style={{ fontSize: '0.75rem', color: MutedColor, display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem' }}>
                            <Clock size={12} />
                            Last Activity
                        </div>
                    </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Footer (Consistency) */}
      <div style={{ marginTop: '2rem', textAlign: 'center', color: '#9ca3af', fontSize: '0.875rem', paddingBottom: '2rem' }}>
        <p>Powered by Patherfinder</p>
        <p style={{ marginTop: '0.5rem' }}>All rights reserved © {new Date().getFullYear()}</p>
      </div>
    </div>
  );
}