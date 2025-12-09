"use client";
import React, { useState, useEffect, CSSProperties, PropsWithChildren } from 'react';
import {
  collection,
  onSnapshot,
  query,
  orderBy,
} from 'firebase/firestore';
import {
  db,
  auth,
  APP_ID,
  onAuthStateChanged,
} from '../../firebase';
import { useNavigate } from 'react-router-dom';
import {
  Loader2,
  FileText,
  Users,
  ArrowLeft,
  LogOut,
  ShoppingCart, // For Sales
  Package, // For Inventory
  DollarSign, // For Expenses
  User, // For Customers
  BarChart3 // For Reports
} from 'lucide-react';

// --- Data Paths ---
const getCollectionRef = (col: string) => collection(db, 'artifacts', APP_ID, 'public', 'data', col);

// --- Styling Constants (Extracted from code.docx) ---
const PrimaryColor = '#0B3D91';
const DestructiveColor = '#dc2626';
const LightBg = '#f3f4f6';
const BorderColor = '#e5e7eb';
const MutedColor = '#6b7280';
const TextColor = '#1f2937';

// --- Types for Card component (Fixes Error 2322) ---
interface CardProps extends PropsWithChildren {
    style?: CSSProperties;
    // Explicitly add mouse event handlers for navigation cards
    onClick?: React.MouseEventHandler<HTMLDivElement>;
    onMouseEnter?: React.MouseEventHandler<HTMLDivElement>;
    onMouseLeave?: React.MouseEventHandler<HTMLDivElement>;
}

// --- UI Components (Extracted from code.docx and refined for clarity) ---

const Button: React.FC<PropsWithChildren & React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'default' | 'destructive' | 'outline' | 'ghost' }> = ({
    children, onClick, style, disabled, type = 'button', variant = 'default', ...props
}) => {
    let backgroundColor = PrimaryColor;
    let color = 'white';
    let border = 'none';
    if (variant === 'destructive') {
        backgroundColor = DestructiveColor;
    } else if (variant === 'outline') {
        backgroundColor = 'transparent';
        color = PrimaryColor;
        border = `1px solid ${PrimaryColor}`;
    } else if (variant === 'ghost') {
        backgroundColor = 'transparent';
        color = TextColor;
        border = 'none';
    }
    const baseStyle: CSSProperties = {
        padding: '0.5rem 1rem',
        cursor: disabled ? 'not-allowed' : 'pointer',
        backgroundColor: disabled ? '#ccc' : (style?.backgroundColor || backgroundColor),
        color: disabled ? '#666' : (style?.color || color),
        border: style?.border || border,
        borderRadius: '4px',
        fontWeight: '500',
        transition: 'all 0.2s',
        opacity: disabled ? 0.6 : 1,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        fontSize: '0.875rem',
        ...style
    };
    return (
        <button onClick={onClick} style={baseStyle} disabled={disabled} type={type} {...props}>
            {children}
        </button>
    );
};

const Card: React.FC<CardProps> = ({ children, style, onClick, onMouseEnter, onMouseLeave }) => (
    <div 
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        style={{ 
            border: `1px solid ${BorderColor}`, 
            borderRadius: '8px', 
            padding: '1.5rem', 
            marginBottom: '1rem', 
            backgroundColor: '#fff', 
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)', 
            ...style 
        }} 
    >
        {children}
    </div>
);

// --- Main Component: Reports ---

const AdminReports: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true); // Mock loading state

    useEffect(() => {
        // Simulate loading/auth check (Admin role check assumed to be successful here)
        const timeout = setTimeout(() => setLoading(false), 500);
        return () => clearTimeout(timeout);
    }, []);
    
    const handleLogout = () => {
        // In a real app, this would call firebase/auth signOut
        console.log("Logging out...");
        navigate('/login');
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: LightBg, flexDirection: 'column', color: PrimaryColor }}>
                <Loader2 style={{ animation: 'spin 1s linear infinite', marginBottom: '1rem' }} size={40} />
                <p style={{ fontWeight: 500 }}>Loading Reports Dashboard...</p>
            </div>
        );
    }

    // Navigation data for easy rendering
    const reportModules = [
        { 
            title: "Sales & Revenue", 
            description: "Detailed summary of all sales, transactions, and revenue generated.", 
            icon: <ShoppingCart size={24} />,
            route: '/admin/sales-report' 
        },
        { 
            title: "Inventory & Stock", 
            description: "Track stock levels, turnover rate, and cost of goods sold.", 
            icon: <Package size={24} />,
            route: '/admin/inventory-report' 
        },
        { 
            title: "Customer Activity", 
            description: "Analyze customer spending, loyalty, and outstanding balances (Ledger).", 
            icon: <Users size={24} />,
            route: '/admin/customer-ledger' 
        },
        { 
            title: "Expenses & Costs", 
            description: "Review operational expenses, supplier payments, and payroll costs.", 
            icon: <DollarSign size={24} />,
            route: '/admin/expenses-report' 
        },
    ];


    return (
        <div style={{ minHeight: '100vh', backgroundColor: LightBg, padding: 0, fontFamily: 'sans-serif', color: TextColor }}>
            {/* Navigation Bar */}
            <nav style={{ borderBottom: `1px solid ${BorderColor}`, backgroundColor: '#fff', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {/* Back Button */}
                    <Button 
                        variant="outline" 
                        onClick={() => navigate(-1)}
                        style={{ color: PrimaryColor, borderColor: BorderColor }}
                    >
                        <ArrowLeft size={16} /> Back
                    </Button>

                    {/* Main Modules Link (e.g., Inventory Management) */}
                    <Button 
                        variant="outline" 
                        onClick={() => navigate('/admin/inventory')}
                        style={{ color: MutedColor, borderColor: BorderColor }}
                    >
                        Inventory Module
                    </Button>

                    {/* Customer Management Link */}
                    <Button 
                        variant="outline" 
                        onClick={() => navigate('/admin/customers')}
                        style={{ color: MutedColor, borderColor: BorderColor }}
                    >
                        Customer List
                    </Button>
                </div>
                
                {/* Logout Button */}
                <Button variant="destructive" onClick={handleLogout}>
                    <LogOut size={16} /> Logout
                </Button>
            </nav>

            <div style={{ padding: '1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
                
                {/* Header */}
                <div style={{ marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: 0, color: PrimaryColor, display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <BarChart3 size={32} /> Management Reports Dashboard
                    </h1>
                    <p style={{ fontSize: '1rem', color: MutedColor, marginTop: '0.5rem' }}>Select a module below to view detailed analytics and performance reports.</p>
                </div>

                {/* Reports Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                    {reportModules.map((module) => (
                        <Card 
                            key={module.title}
                            style={{ 
                                cursor: 'pointer', 
                                transition: 'transform 0.2s, box-shadow 0.2s',
                                padding: '2rem',
                                display: 'flex',
                                flexDirection: 'column',
                                borderLeft: `5px solid ${PrimaryColor}`
                            }}
                            onClick={() => navigate(module.route)}
                            // Explicitly type 'e' to resolve Error 7006
                            onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => {
                                e.currentTarget.style.transform = 'translateY(-5px)';
                                e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
                            }}
                            // Explicitly type 'e' to resolve Error 7006
                            onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1)';
                            }}
                        >
                            <div style={{ color: PrimaryColor, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                {module.icon}
                                <span style={{ fontSize: '1.25rem', fontWeight: '600' }}>{module.title}</span>
                            </div>
                            <p style={{ color: MutedColor, marginBottom: '1.5rem', flexGrow: 1 }}>
                                {module.description}
                            </p>
                            <Button variant="outline" style={{ alignSelf: 'flex-start' }}>
                                <FileText size={16} /> View Full Report
                            </Button>
                        </Card>
                    ))}
                </div>

            </div>
        </div>
    );
};

export default AdminReports;