
"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
    getFirestore, collection, query, onSnapshot, doc,
    Timestamp, orderBy, DocumentData, CollectionReference
} from 'firebase/firestore';
import { 
    getAuth, 
    onAuthStateChanged, 
    signInWithCustomToken, 
    signInAnonymously, 
    User as FirebaseAuthUser 
} from 'firebase/auth';
import { setLogLevel } from 'firebase/firestore';
import { 
    DollarSign, TrendingUp, Clock, Printer, Calendar, 
    CreditCard, Banknote, Send, Users, AlertTriangle, ShoppingCart, Package,
    ArrowUpRight, ArrowDownRight, Activity
} from "lucide-react";

// ========== FIREBASE CONFIGURATION & SETUP ==========
setLogLevel('debug');

declare const __app_id: string;
declare const __firebase_config: string;
declare const __initial_auth_token: string;

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

const auth = getAuth(app);
const db = getFirestore(app);

// ========== COLLECTION PATH HELPERS ==========
type CollectionSegments = readonly [string, string, string, string, string];
const BASE_PATH: readonly [string, string, string, string] = ["artifacts", APP_ID, "public", "data"] as const;
const getPath = (collectionName: string): CollectionSegments => [...BASE_PATH, collectionName] as CollectionSegments;
const getCollectionRef = (collectionName: string): CollectionReference<DocumentData> => collection(db, ...getPath(collectionName));
const getDocRef = (collectionName: string, docId: string) => doc(db, ...getPath(collectionName), docId);

// ========== INTERFACES ==========
interface SaleRecord {
    id: string;
    customerId: string;
    customerName: string;
    items: any[];
    totalAmount: number;
    amountPaid: number;
    paymentMethod: 'Cash' | 'Card' | 'Transfer' | 'Credit';
    date: Timestamp;
    userId: string;
}

interface DailyReport {
    date: string;
    totalSales: number;
    totalCash: number;
    totalCard: number;
    totalTransfer: number;
    totalCredit: number;
    transactionCount: number;
}

interface InventoryItem {
    id: string;
    name: string;
    sku?: string;
    units_available: number;
    unit_price: number;
    total_value: number;
}

interface StockMovement {
    id: string;
    productId: string;
    productName: string;
    type: 'IN' | 'OUT';
    quantity: number;
    reference: string;
    date: Timestamp;
}

interface ChartData {
    date: string;
    sales: number;
    cash: number;
    card: number;
    transfer: number;
    credit: number;
    transactions: number;
}

interface Summary {
    totalSales: number;
    totalCash: number;
    totalCard: number;
    totalTransfer: number;
    totalCredit: number;
    transactionCount: number;
    averageSaleValue: number;
    totalItemsSold: number;
    currentStockValue: number;
    lowStockCount: number;
}

// ========== UTILITY FUNCTIONS ==========
const formatCurrency = (value: number) => {
    const sign = value < 0 ? "-" : "";
    const absoluteValue = Math.abs(value);
    return `${sign}₦${absoluteValue.toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

const formatPercentage = (value: number) => `${value.toFixed(1)}%`;

// ========== UI COMPONENTS ==========
const Button = ({ children, onClick, className = "", variant = "default", disabled = false, style = {} }: any) => {
    const baseStyle = {
        padding: "8px 16px", fontSize: "14px", fontWeight: 600, borderRadius: "8px",
        transition: "all 0.15s ease-in-out", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
        display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
        cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1, border: 'none',
        ...style,
    };

    const stylesMap: Record<string, React.CSSProperties> = {
        default: { backgroundColor: "#2563EB", color: "#FFFFFF" },
        ghost: { backgroundColor: "transparent", color: "#4B5563", boxShadow: "none" },
        outline: { border: "1px solid #D1D5DB", color: "#4B5563", backgroundColor: "#FFFFFF" },
        success: { backgroundColor: "#059669", color: "#FFFFFF" },
    };
    
    return <button onClick={onClick} style={{ ...baseStyle, ...(stylesMap[variant] || stylesMap.default) }} className={className} disabled={disabled}>{children}</button>;
};

const Input = ({ type = "text", value, onChange, label, style = {} }: any) => (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px", ...style }}>
        {label && <label style={{ fontSize: "12px", fontWeight: 500, color: "#4B5563" }}>{label}</label>}
        <input
            type={type} value={value} onChange={onChange}
            style={{
                height: "40px", width: "100%", borderRadius: "8px", border: "1px solid #D1D5DB",
                backgroundColor: "#FFFFFF", padding: "8px 12px", fontSize: "14px", outline: "none",
            }}
        />
    </div>
);

const Card = ({ children, style = {} }: any) => (
    <div style={{ borderRadius: "12px", backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)", ...style }}>
        {children}
    </div>
);

const CardHeader = ({ children, style = {} }: any) => (
    <div style={{ padding: "24px", borderBottom: "1px solid #E5E7EB", ...style }}>{children}</div>
);

const CardTitle = ({ children, style = {} }: any) => (
    <h3 style={{ fontSize: "20px", fontWeight: 600, lineHeight: 1.2, margin: 0, ...style }}>{children}</h3>
);

const CardContent = ({ children, style = {} }: any) => (
    <div style={{ padding: "24px", paddingTop: "16px", ...style }}>{children}</div>
);

const Table = ({ children }: any) => (<table style={{ width: "100%", fontSize: "14px", borderCollapse: "collapse" }}>{children}</table>);
const TableHeader = ({ children }: any) => (<thead style={{ borderBottom: "2px solid #E5E7EB", backgroundColor: "#F9FAFB" }}>{children}</thead>);
const TableBody = ({ children }: any) => (<tbody>{children}</tbody>);
const TableRow = ({ children }: any) => (<tr style={{ borderBottom: "1px solid #E5E7EB" }}>{children}</tr>);
const TableHead = ({ children, style = {} }: any) => (<th style={{ height: "40px", padding: "12px 16px", textAlign: "left", fontWeight: 600, color: "#6B7280", fontSize: "12px", textTransform: 'uppercase', ...style }}>{children}</th>);
const TableCell = ({ children, style = {} }: any) => (<td style={{ padding: "12px 16px", fontSize: "14px", ...style }}>{children}</td>);

const LoadingSpinner = () => (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F3F4F6' }}>
        <div style={{ textAlign: 'center' }}>
            <div style={{ 
                animation: 'spin 1s linear infinite', borderRadius: '50%', height: '4rem', width: '4rem',
                borderTop: '4px solid #2563EB', borderRight: '4px solid transparent',
                borderBottom: '4px solid #2563EB', borderLeft: '4px solid transparent',
                margin: '0 auto 1rem' 
            }}></div>
            <p style={{ fontSize: 18, fontWeight: 600, color: '#6B7280' }}>Loading reports...</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    </div>
);

// ========== PAYMENT METHOD BREAKDOWN ==========
const PaymentMethodBreakdown = ({ payments, totalSales }: any) => {
    const paymentDetails = [
        { method: "Cash", amount: payments.cash || 0, icon: Banknote, color: "#10B981" },
        { method: "Card/POS", amount: payments.card || 0, icon: CreditCard, color: "#F59E0B" },
        { method: "Transfer", amount: payments.transfer || 0, icon: Send, color: "#8B5CF6" },
        { method: "Credit", amount: payments.credit || 0, icon: AlertTriangle, color: "#DC2626" },
    ];

    return (
        <Card>
            <CardHeader><CardTitle style={{ fontSize: "18px" }}>Sales by Payment Method</CardTitle></CardHeader>
            <CardContent style={{ gap: "16px", display: "flex", flexDirection: "column" }}>
                {paymentDetails.map((detail) => {
                    const percentage = totalSales > 0 ? (detail.amount / totalSales) * 100 : 0;
                    const Icon = detail.icon;
                    return (
                        <div key={detail.method} style={{ gap: "8px", display: "flex", flexDirection: "column" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <Icon size={16} style={{ color: detail.color }} />
                                    <span style={{ fontSize: 14, fontWeight: 500 }}>{detail.method}</span>
                                </div>
                                <span style={{ fontWeight: 700, fontSize: 16 }}>{formatCurrency(detail.amount)}</span>
                            </div>
                            <div style={{ width: "100%", backgroundColor: "#E5E7EB", borderRadius: "9999px", height: "8px" }}>
                                <div style={{ height: "8px", borderRadius: "9999px", backgroundColor: detail.color, width: `${Math.min(100, percentage)}%`, transition: 'width 0.3s' }}></div>
                            </div>
                            <p style={{ fontSize: "12px", color: "#6B7280", textAlign: "right" }}>{formatPercentage(percentage)}</p>
                        </div>
                    );
                })}
                {totalSales === 0 && <p style={{ color: "#EF4444", fontSize: "14px", textAlign: "center", marginTop: 10 }}>No sales recorded.</p>}
            </CardContent>
        </Card>
    );
};

// ========== MAIN COMPONENT ==========
export default function ReportsPage() {
    const todayDate = new Date().toISOString().split('T')[0];
    
    const [currentUser, setCurrentUser] = useState<FirebaseAuthUser | null>(null);
    const [userRole, setUserRole] = useState<'staff' | 'admin'>('staff');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    const [sales, setSales] = useState<SaleRecord[]>([]);
    const [dailyReports, setDailyReports] = useState<DailyReport[]>([]);
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
    
    const [startDate, setStartDate] = useState(todayDate);
    const [endDate, setEndDate] = useState(todayDate);
    const [dateError, setDateError] = useState<string | null>(null);
    
    const reportRef = useRef<HTMLDivElement>(null);

    // ========== AUTH & DATA LOADING ==========
    useEffect(() => {
        const unsubAuth = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setCurrentUser(user);
                const tokenResult = await user.getIdTokenResult();
                const role = tokenResult.claims.role || 'staff';
                setUserRole(role as 'staff' | 'admin');
            } else {
                const token = typeof __initial_auth_token !== "undefined" ? __initial_auth_token : "";
                try {
                    if (token) await signInWithCustomToken(auth, token);
                    else await signInAnonymously(auth);
                } catch (e) {
                    console.error("Auth Error:", e);
                    signInAnonymously(auth).catch(console.error);
                }
            }
        });

        // Load Sales
        const salesCol = getCollectionRef('sales');
        const qSales = query(salesCol, orderBy('date', 'desc'));
        const unsubSales = onSnapshot(qSales, (snap) => {
            setSales(snap.docs.map(d => ({ id: d.id, ...d.data() } as SaleRecord)));
        }, (err) => {
            console.error('Error fetching sales:', err);
            setError('Failed to load sales data.');
        });

        // Load Daily Reports (created by Sales page)
        const reportsCol = getCollectionRef('reports');
        const unsubReports = onSnapshot(reportsCol, (snap) => {
            const reportsData = snap.docs.map(d => {
                const data = d.data();
                return {
                    date: d.id.replace('daily_', ''),
                    totalSales: data.totalSales || 0,
                    totalCash: data.totalCash || 0,
                    totalCard: data.totalCard || 0,
                    totalTransfer: data.totalTransfer || 0,
                    totalCredit: data.totalCredit || 0,
                    transactionCount: data.transactionCount || 0
                } as DailyReport;
            });
            setDailyReports(reportsData);
        });

        // Load Current Inventory (for stock status)
        const inventoryCol = getCollectionRef('inventory');
        const unsubInventory = onSnapshot(inventoryCol, (snap) => {
            setInventory(snap.docs.map(d => {
                const data = d.data();
                return {
                    id: d.id,
                    name: data.name || '',
                    sku: data.sku || '',
                    units_available: data.units_available || 0,
                    unit_price: data.unit_price || 0,
                    total_value: data.total_value || 0
                } as InventoryItem;
            }));
            setLoading(false);
        });

        // Load Stock Movements (to track changes)
        const movementsCol = getCollectionRef('stockMovements');
        const qMovements = query(movementsCol, orderBy('date', 'desc'));
        const unsubMovements = onSnapshot(qMovements, (snap) => {
            setStockMovements(snap.docs.map(d => ({ id: d.id, ...d.data() } as StockMovement)));
        });

        return () => {
            unsubAuth();
            unsubSales();
            unsubReports();
            unsubInventory();
            unsubMovements();
        };
    }, []);

    // ========== DATE VALIDATION ==========
    useEffect(() => {
        if (startDate > endDate && userRole === 'admin') {
            setDateError("Start date cannot be after end date.");
        } else {
            setDateError(null);
        }
    }, [startDate, endDate, userRole]);

    // ========== COMPUTED VALUES ==========
    const { summary, chartData, topSales, effectiveStartDate, effectiveEndDate, stockSummary } = useMemo(() => {
        const effectiveStartDate = userRole === 'staff' ? todayDate : startDate;
        const effectiveEndDate = userRole === 'staff' ? todayDate : endDate;

        // Filter sales by date range
        const filteredSales = sales.filter(sale => {
            const saleDate = new Date(sale.date.seconds * 1000).toISOString().split('T')[0];
            return saleDate >= effectiveStartDate && saleDate <= effectiveEndDate;
        });

        // Filter stock movements by date range
        const filteredMovements = stockMovements.filter(movement => {
            const movementDate = new Date(movement.date.seconds * 1000).toISOString().split('T')[0];
            return movementDate >= effectiveStartDate && movementDate <= effectiveEndDate;
        });

        // Calculate summary
        const summary: Summary = {
            totalSales: 0,
            totalCash: 0,
            totalCard: 0,
            totalTransfer: 0,
            totalCredit: 0,
            transactionCount: filteredSales.length,
            averageSaleValue: 0,
            totalItemsSold: 0,
            currentStockValue: inventory.reduce((sum, item) => sum + item.total_value, 0),
            lowStockCount: inventory.filter(item => item.units_available <= 5).length
        };

        // Group by date for chart
        const dailyData: { [key: string]: ChartData } = {};

        filteredSales.forEach(sale => {
            const saleDate = new Date(sale.date.seconds * 1000).toISOString().split('T')[0];
            
            summary.totalSales += sale.totalAmount;
            summary.totalItemsSold += sale.items.reduce((sum, item) => sum + item.quantity, 0);
            
            // Payment method totals
            switch (sale.paymentMethod) {
                case 'Cash':
                    summary.totalCash += sale.amountPaid;
                    break;
                case 'Card':
                    summary.totalCard += sale.amountPaid;
                    break;
                case 'Transfer':
                    summary.totalTransfer += sale.amountPaid;
                    break;
                case 'Credit':
                    summary.totalCredit += sale.totalAmount;
                    break;
            }

            if (!dailyData[saleDate]) {
                dailyData[saleDate] = {
                    date: saleDate,
                    sales: 0,
                    cash: 0,
                    card: 0,
                    transfer: 0,
                    credit: 0,
                    transactions: 0
                };
            }

            dailyData[saleDate].sales += sale.totalAmount;
            dailyData[saleDate].transactions += 1;
            
            switch (sale.paymentMethod) {
                case 'Cash':
                    dailyData[saleDate].cash += sale.amountPaid;
                    break;
                case 'Card':
                    dailyData[saleDate].card += sale.amountPaid;
                    break;
                case 'Transfer':
                    dailyData[saleDate].transfer += sale.amountPaid;
                    break;
                case 'Credit':
                    dailyData[saleDate].credit += sale.totalAmount;
                    break;
            }
        });

        summary.averageSaleValue = summary.transactionCount > 0 ? summary.totalSales / summary.transactionCount : 0;

        const chartData = Object.values(dailyData).sort((a, b) => a.date.localeCompare(b.date));
        const topSales = filteredSales.sort((a, b) => b.totalAmount - a.totalAmount).slice(0, 5);

        // Stock summary
        const stockSummary = {
            totalStockOut: filteredMovements.filter(m => m.type === 'OUT').reduce((sum, m) => sum + m.quantity, 0),
            totalStockIn: filteredMovements.filter(m => m.type === 'IN').reduce((sum, m) => sum + m.quantity, 0),
            netStockChange: 0
        };
        stockSummary.netStockChange = stockSummary.totalStockIn - stockSummary.totalStockOut;

        return { summary, chartData, topSales, effectiveStartDate, effectiveEndDate, stockSummary };
    }, [sales, inventory, stockMovements, startDate, endDate, userRole, todayDate]);

    // ========== PRINT HANDLER ==========
    const handlePrint = () => {
        const reportElement = reportRef.current;
        if (reportElement) {
            const printWindow = window.open('', '_blank');
            if (printWindow) {
                printWindow.document.write(`
                    <html><head><title>Financial Report</title>
                    <style>
                        @media print { body { -webkit-print-color-adjust: exact; } }
                        body { font-family: sans-serif; padding: 20px; color: #111827; }
                        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                        th, td { border: 1px solid #e5e7eb; padding: 12px; text-align: left; }
                        th { background-color: #f9fafb; font-weight: 600; }
                        .no-print { display: none; }
                    </style>
                    </head><body>
                    <div style="text-align: center; margin-bottom: 2rem; border-bottom: 2px solid #2563EB; padding-bottom: 1rem;">
                        <h1 style="font-size: 28px; margin-bottom: 8px;">Staff Tracker POS - Financial Report</h1>
                        <p style="color: #6B7280;">Period: ${effectiveStartDate} to ${effectiveEndDate}</p>
                        <p style="font-size: 12px; color: #9CA3AF;">Generated: ${new Date().toLocaleString()}</p>
                    </div>
                    ${reportElement.innerHTML}
                    <div style="margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #E5E7EB; text-align: center; color: #9CA3AF; font-size: 12px;">
                        <p>Powered by Staff Tracker POS</p>
                    </div>
                    </body></html>
                `);
                printWindow.document.close();
                setTimeout(() => { printWindow.print(); printWindow.close(); }, 500);
            }
        }
    };

    if (loading) return <LoadingSpinner />;

    const isAdmin = userRole === 'admin';

    return (
        <div style={{ minHeight: "100vh", backgroundColor: "#F9FAFB", fontFamily: "Inter, sans-serif" }}>
            
            {/* Navigation */}
            <nav style={{ borderBottom: "1px solid #E5E7EB", backgroundColor: "#FFF", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)", padding: "16px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 10 }}>
                <Button variant="ghost" onClick={() => window.history.back()}>← Back</Button>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <div style={{ fontSize: 12, padding: '8px 12px', borderRadius: 8, backgroundColor: isAdmin ? '#d1fae5' : '#dbeafe', color: isAdmin ? '#065f46' : '#1e40af', fontWeight: 600 }}>
                        {isAdmin ? '👑 Admin' : '👤 Staff'}
                    </div>
                    <Button onClick={handlePrint} style={{ backgroundColor: "#059669" }}>
                        <Printer size={16} /> Print Report
                    </Button>
                </div>
            </nav>

            <main style={{ padding: 32, maxWidth: 1400, margin: '0 auto' }}>
                <h1 style={{ fontSize: 28, fontWeight: 700, color: "#111827", marginBottom: 8 }}>
                    📊 Financial Reports {userRole === 'staff' ? '- End of Day' : '- Historical Analysis'}
                </h1>
                <p style={{ fontSize: 14, color: "#6B7280", marginBottom: 24 }}>Sales, payments, and stock updates from Firebase</p>

                {error && (
                    <div style={{ marginBottom: 24, padding: 16, backgroundColor: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 8, color: '#b91c1c', display: 'flex', alignItems: 'center' }}>
                        <AlertTriangle size={16} style={{ marginRight: 8 }} /> {error}
                    </div>
                )}

                {/* Date Range (Admin) */}
                {isAdmin && (
                    <Card style={{ marginBottom: 32, padding: 24 }}>
                        <div style={{ display: "flex", alignItems: "flex-end", gap: 16, flexWrap: "wrap" }}>
                            <Calendar size={24} style={{ color: "#2563EB", marginBottom: 8 }} />
                            <Input label="Start Date" type="date" value={startDate} onChange={(e: any) => setStartDate(e.target.value)} style={{ flex: 1, minWidth: 200 }} />
                            <span style={{ fontSize: 18, fontWeight: 700, color: "#6B7280", marginBottom: 8 }}>to</span>
                            <Input label="End Date" type="date" value={endDate} onChange={(e: any) => setEndDate(e.target.value)} style={{ flex: 1, minWidth: 200 }} />
                        </div>
                        {dateError && (
                            <div style={{ marginTop: 16, padding: 12, backgroundColor: "#FEF2F2", borderLeft: "4px solid #EF4444", color: "#B91C1C", borderRadius: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                                <AlertTriangle size={16}/> <span style={{ fontSize: 14 }}>{dateError}</span>
                            </div>
                        )}
                    </Card>
                )}

                {/* Printable Content */}
                <div ref={reportRef}>
                    <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24, color: "#374151" }}>
                        📅 Report Period: {effectiveStartDate === effectiveEndDate ? new Date(effectiveStartDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : `${effectiveStartDate} - ${effectiveEndDate}`}
                    </h2>
                    
                    {/* Summary Cards Grid */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20, marginBottom: 32 }}>
                        
                        {/* Total Sales */}
                        <Card style={{ borderLeft: "4px solid #2563EB", padding: 20 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                <div>
                                    <p style={{ fontSize: 12, color: "#6B7280", marginBottom: 8, textTransform: 'uppercase', fontWeight: 600 }}>Total Sales</p>
                                    <p style={{ fontSize: 32, fontWeight: 800, color: "#2563EB", margin: 0 }}>{formatCurrency(summary.totalSales)}</p>
                                    <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 4 }}>{summary.transactionCount} transactions</p>
                                </div>
                                <TrendingUp size={32} style={{ color: '#2563EB', opacity: 0.2 }} />
                            </div>
                        </Card>

                        {/* Average Sale */}
                        <Card style={{ borderLeft: "4px solid #10B981", padding: 20 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                <div>
                                    <p style={{ fontSize: 12, color: "#6B7280", marginBottom: 8, textTransform: 'uppercase', fontWeight: 600 }}>Avg Sale</p>
                                    <p style={{ fontSize: 32, fontWeight: 800, color: "#059669", margin: 0 }}>{formatCurrency(summary.averageSaleValue)}</p>
                                    <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 4 }}>Per transaction</p>
                                </div>
                                <ShoppingCart size={32} style={{ color: '#10B981', opacity: 0.2 }} />
                            </div>
                        </Card>

                        {/* Items Sold */}
                        <Card style={{ borderLeft: "4px solid #F59E0B", padding: 20 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                <div>
                                    <p style={{ fontSize: 12, color: "#6B7280", marginBottom: 8, textTransform: 'uppercase', fontWeight: 600 }}>Items Sold</p>
                                    <p style={{ fontSize: 32, fontWeight: 800, color: "#D97706", margin: 0 }}>{summary.totalItemsSold}</p>
                                    <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 4 }}>Units</p>
                                </div>
                                <Package size={32} style={{ color: '#F59E0B', opacity: 0.2 }} />
                            </div>
                        </Card>

                        {/* Current Stock Value */}
                        <Card style={{ borderLeft: "4px solid #8B5CF6", padding: 20 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                <div>
                                    <p style={{ fontSize: 12, color: "#6B7280", marginBottom: 8, textTransform: 'uppercase', fontWeight: 600 }}>Stock Value</p>
                                    <p style={{ fontSize: 32, fontWeight: 800, color: "#7C3AED", margin: 0 }}>{formatCurrency(summary.currentStockValue)}</p>
                                    <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 4 }}>Current inventory</p>
                                </div>
                                <DollarSign size={32} style={{ color: '#8B5CF6', opacity: 0.2 }} />
                            </div>
                        </Card>

                        {/* Cash Collected */}
                        <Card style={{ borderLeft: "4px solid #059669", padding: 20 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                <div>
                                    <p style={{ fontSize: 12, color: "#6B7280", marginBottom: 8, textTransform: 'uppercase', fontWeight: 600 }}>Cash</p>
                                    <p style={{ fontSize: 32, fontWeight: 800, color: "#059669", margin: 0 }}>{formatCurrency(summary.totalCash)}</p>
                                    <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 4 }}>{formatPercentage((summary.totalCash / summary.totalSales) * 100 || 0)}</p>
                                </div>
                                <Banknote size={32} style={{ color: '#059669', opacity: 0.2 }} />
                            </div>
                        </Card>

                        {/* Card/POS */}
                        <Card style={{ borderLeft: "4px solid #F59E0B", padding: 20 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                <div>
                                    <p style={{ fontSize: 12, color: "#6B7280", marginBottom: 8, textTransform: 'uppercase', fontWeight: 600 }}>Card/POS</p>
                                    <p style={{ fontSize: 32, fontWeight: 800, color: "#D97706", margin: 0 }}>{formatCurrency(summary.totalCard)}</p>
                                    <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 4 }}>{formatPercentage((summary.totalCard / summary.totalSales) * 100 || 0)}</p>
                                </div>
                                <CreditCard size={32} style={{ color: '#F59E0B', opacity: 0.2 }} />
                            </div>
                        </Card>

                        {/* Transfers */}
                        <Card style={{ borderLeft: "4px solid #8B5CF6", padding: 20 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                <div>
                                    <p style={{ fontSize: 12, color: "#6B7280", marginBottom: 8, textTransform: 'uppercase', fontWeight: 600 }}>Transfers</p>
                                    <p style={{ fontSize: 32, fontWeight: 800, color: "#7C3AED", margin: 0 }}>{formatCurrency(summary.totalTransfer)}</p>
                                    <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 4 }}>{formatPercentage((summary.totalTransfer / summary.totalSales) * 100 || 0)}</p>
                                </div>
                                <Send size={32} style={{ color: '#8B5CF6', opacity: 0.2 }} />
                            </div>
                        </Card>

                        {/* Credit Sales */}
                        <Card style={{ borderLeft: "4px solid #DC2626", padding: 20 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                <div>
                                    <p style={{ fontSize: 12, color: "#6B7280", marginBottom: 8, textTransform: 'uppercase', fontWeight: 600 }}>Credit Sales</p>
                                    <p style={{ fontSize: 32, fontWeight: 800, color: "#B91C1C", margin: 0 }}>{formatCurrency(summary.totalCredit)}</p>
                                    <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 4 }}>Outstanding</p>
                                </div>
                                <AlertTriangle size={32} style={{ color: '#DC2626', opacity: 0.2 }} />
                            </div>
                        </Card>
                    </div>

                    {/* Staff EOD Cash Reconciliation */}
                    {userRole === 'staff' && (
                        <Card style={{ marginBottom: 32, border: "2px solid #3B82F6", backgroundColor: '#EFF6FF' }}>
                            <CardHeader style={{ backgroundColor: '#DBEAFE', borderBottom: '2px solid #3B82F6' }}>
                                <CardTitle style={{ fontSize: 18, display: "flex", alignItems: "center", color: '#1E40AF' }}>
                                    <Banknote size={20} style={{ marginRight: 8 }}/> 💰 End of Day Cash Reconciliation
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                                    <div style={{ padding: 20, backgroundColor: '#FFFFFF', borderRadius: 8, border: '2px solid #93C5FD' }}>
                                        <p style={{ fontSize: 12, color: '#6B7280', marginBottom: 8, fontWeight: 600 }}>Expected Cash (System)</p>
                                        <p style={{ fontSize: 36, fontWeight: 800, color: '#059669' }}>{formatCurrency(summary.totalCash)}</p>
                                        <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>From {sales.filter(s => s.paymentMethod === 'Cash').length} cash transactions</p>
                                    </div>
                                    <div style={{ padding: 20, backgroundColor: '#FEF3C7', borderRadius: 8, border: '2px solid #FCD34D' }}>
                                        <p style={{ fontSize: 12, color: '#92400E', marginBottom: 8, fontWeight: 600 }}>⚠️ Action Required</p>
                                        <p style={{ fontSize: 14, color: '#78350F', lineHeight: 1.5 }}>
                                            Count physical cash in register and verify it matches the expected amount.
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Stock Status Summary */}
                    <Card style={{ marginBottom: 32 }}>
                        <CardHeader style={{ backgroundColor: '#F9FAFB' }}>
                            <CardTitle style={{ fontSize: 18, display: 'flex', alignItems: 'center' }}>
                                <Activity size={20} style={{ marginRight: 8, color: '#8B5CF6' }} /> Stock Movement Summary
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                                <div style={{ padding: 16, backgroundColor: '#FEE2E2', borderRadius: 8, border: '1px solid #FCA5A5' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                        <ArrowDownRight size={20} style={{ color: '#DC2626' }} />
                                        <p style={{ fontSize: 12, color: '#991B1B', fontWeight: 600 }}>STOCK OUT</p>
                                    </div>
                                    <p style={{ fontSize: 28, fontWeight: 800, color: '#DC2626' }}>{stockSummary.totalStockOut}</p>
                                    <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>Units sold</p>
                                </div>
                                <div style={{ padding: 16, backgroundColor: '#D1FAE5', borderRadius: 8, border: '1px solid #6EE7B7' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                        <ArrowUpRight size={20} style={{ color: '#059669' }} />
                                        <p style={{ fontSize: 12, color: '#065F46', fontWeight: 600 }}>STOCK IN</p>
                                    </div>
                                    <p style={{ fontSize: 28, fontWeight: 800, color: '#059669' }}>{stockSummary.totalStockIn}</p>
                                    <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>Units added</p>
                                </div>
                                <div style={{ padding: 16, backgroundColor: stockSummary.netStockChange >= 0 ? '#DBEAFE' : '#FEF3C7', borderRadius: 8, border: `1px solid ${stockSummary.netStockChange >= 0 ? '#93C5FD' : '#FCD34D'}` }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                        <Package size={20} style={{ color: stockSummary.netStockChange >= 0 ? '#2563EB' : '#D97706' }} />
                                        <p style={{ fontSize: 12, color: stockSummary.netStockChange >= 0 ? '#1E40AF' : '#92400E', fontWeight: 600 }}>NET CHANGE</p>
                                    </div>
                                    <p style={{ fontSize: 28, fontWeight: 800, color: stockSummary.netStockChange >= 0 ? '#2563EB' : '#D97706' }}>
                                        {stockSummary.netStockChange >= 0 ? '+' : ''}{stockSummary.netStockChange}
                                    </p>
                                    <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>Units net</p>
                                </div>
                                <div style={{ padding: 16, backgroundColor: summary.lowStockCount > 0 ? '#FEF3C7' : '#F3F4F6', borderRadius: 8, border: `1px solid ${summary.lowStockCount > 0 ? '#FCD34D' : '#E5E7EB'}` }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                        <AlertTriangle size={20} style={{ color: summary.lowStockCount > 0 ? '#D97706' : '#9CA3AF' }} />
                                        <p style={{ fontSize: 12, color: summary.lowStockCount > 0 ? '#92400E' : '#6B7280', fontWeight: 600 }}>LOW STOCK</p>
                                    </div>
                                    <p style={{ fontSize: 28, fontWeight: 800, color: summary.lowStockCount > 0 ? '#D97706' : '#6B7280' }}>{summary.lowStockCount}</p>
                                    <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>Items ≤ 5 units</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Daily Sales Trend Table */}
                    <Card style={{ marginBottom: 32 }}>
                        <CardHeader>
                            <CardTitle>📈 Daily Sales Breakdown ({chartData.length} days)</CardTitle>
                        </CardHeader>
                        <CardContent style={{ padding: 0 }}>
                            {chartData.length === 0 ? (
                                <p style={{ padding: 32, textAlign: "center", color: "#6B7280" }}>No sales data for selected period.</p>
                            ) : (
                                <div style={{ overflowX: 'auto' }}>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Date</TableHead>
                                                <TableHead style={{ textAlign: 'center' }}>Transactions</TableHead>
                                                <TableHead style={{ textAlign: 'right' }}>Total Sales</TableHead>
                                                <TableHead style={{ textAlign: 'right' }}>Cash</TableHead>
                                                <TableHead style={{ textAlign: 'right' }}>Card</TableHead>
                                                <TableHead style={{ textAlign: 'right' }}>Transfer</TableHead>
                                                <TableHead style={{ textAlign: 'right' }}>Credit</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {chartData.map((day, idx) => (
                                                <TableRow key={idx}>
                                                    <TableCell style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
                                                        {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                                    </TableCell>
                                                    <TableCell style={{ textAlign: 'center', fontWeight: 600, color: '#6B7280' }}>
                                                        {day.transactions}
                                                    </TableCell>
                                                    <TableCell style={{ textAlign: 'right', fontWeight: 700, color: '#2563EB', fontSize: 15 }}>
                                                        {formatCurrency(day.sales)}
                                                    </TableCell>
                                                    <TableCell style={{ textAlign: 'right', color: '#059669', fontWeight: 600 }}>
                                                        {formatCurrency(day.cash)}
                                                    </TableCell>
                                                    <TableCell style={{ textAlign: 'right', color: '#D97706', fontWeight: 600 }}>
                                                        {formatCurrency(day.card)}
                                                    </TableCell>
                                                    <TableCell style={{ textAlign: 'right', color: '#7C3AED', fontWeight: 600 }}>
                                                        {formatCurrency(day.transfer)}
                                                    </TableCell>
                                                    <TableCell style={{ textAlign: 'right', color: '#B91C1C', fontWeight: 600 }}>
                                                        {formatCurrency(day.credit)}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            <TableRow style={{ backgroundColor: '#F9FAFB', fontWeight: 700 }}>
                                                <TableCell style={{ fontWeight: 700, fontSize: 14 }}>PERIOD TOTALS</TableCell>
                                                <TableCell style={{ textAlign: 'center', fontWeight: 700, color: '#374151' }}>
                                                    {summary.transactionCount}
                                                </TableCell>
                                                <TableCell style={{ textAlign: 'right', fontWeight: 800, fontSize: 16, color: '#2563EB' }}>
                                                    {formatCurrency(summary.totalSales)}
                                                </TableCell>
                                                <TableCell style={{ textAlign: 'right', fontWeight: 700, color: '#059669' }}>
                                                    {formatCurrency(summary.totalCash)}
                                                </TableCell>
                                                <TableCell style={{ textAlign: 'right', fontWeight: 700, color: '#D97706' }}>
                                                    {formatCurrency(summary.totalCard)}
                                                </TableCell>
                                                <TableCell style={{ textAlign: 'right', fontWeight: 700, color: '#7C3AED' }}>
                                                    {formatCurrency(summary.totalTransfer)}
                                                </TableCell>
                                                <TableCell style={{ textAlign: 'right', fontWeight: 700, color: '#B91C1C' }}>
                                                    {formatCurrency(summary.totalCredit)}
                                                </TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Payment Methods & Top Sales Grid */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 24, marginBottom: 32 }}>
                        
                        {/* Payment Distribution */}
                        <PaymentMethodBreakdown 
                            payments={{
                                cash: summary.totalCash,
                                card: summary.totalCard,
                                transfer: summary.totalTransfer,
                                credit: summary.totalCredit
                            }} 
                            totalSales={summary.totalSales} 
                        />
                        
                        {/* Top 5 Sales */}
                        <Card>
                            <CardHeader><CardTitle style={{ fontSize: 18 }}>🏆 Top 5 Sales</CardTitle></CardHeader>
                            <CardContent style={{ gap: 12, display: "flex", flexDirection: "column" }}>
                                {topSales.length > 0 ? (
                                    topSales.map((sale, idx) => (
                                        <div key={sale.id} style={{ 
                                            padding: 12, 
                                            backgroundColor: idx === 0 ? '#FEF3C7' : '#F9FAFB', 
                                            borderLeft: `4px solid ${idx === 0 ? '#F59E0B' : '#E5E7EB'}`, 
                                            borderRadius: 8 
                                        }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                                                <p style={{ fontWeight: 700, color: idx === 0 ? '#D97706' : '#059669', fontSize: 18 }}>
                                                    {idx + 1}. {formatCurrency(sale.totalAmount)}
                                                </p>
                                                <span style={{ fontSize: 11, color: "#6B7280" }}>
                                                    {new Date(sale.date.seconds * 1000).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <p style={{ fontSize: 14, fontWeight: 500, color: "#111827", marginBottom: 4 }}>{sale.customerName}</p>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                                                <span style={{ 
                                                    fontSize: 10, fontWeight: 600, padding: "3px 8px",
                                                    backgroundColor: sale.paymentMethod === 'Cash' ? '#d1fae5' : sale.paymentMethod === 'Card' ? '#fef3c7' : sale.paymentMethod === 'Transfer' ? '#dbeafe' : '#fee2e2',
                                                    color: sale.paymentMethod === 'Cash' ? '#065f46' : sale.paymentMethod === 'Card' ? '#92400e' : sale.paymentMethod === 'Transfer' ? '#1e40af' : '#991b1b',
                                                    borderRadius: 4 
                                                }}>
                                                    {sale.paymentMethod}
                                                </span>
                                                <span style={{ fontSize: 11, color: '#9CA3AF', fontFamily: 'monospace' }}>#{sale.id.slice(0, 8)}</span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p style={{ color: "#6B7280", fontSize: 14, textAlign: "center", padding: 20 }}>No sales for this period.</p>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Low Stock Alert (if any) */}
                    {summary.lowStockCount > 0 && (
                        <Card style={{ marginBottom: 32, border: '2px solid #F59E0B', backgroundColor: '#FFFBEB' }}>
                            <CardHeader style={{ backgroundColor: '#FEF3C7', borderBottom: '2px solid #F59E0B' }}>
                                <CardTitle style={{ fontSize: 18, color: '#92400E', display: 'flex', alignItems: 'center' }}>
                                    <AlertTriangle size={20} style={{ marginRight: 8 }} /> ⚠️ Low Stock Alert
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p style={{ fontSize: 14, color: '#78350F', marginBottom: 16 }}>
                                    <strong>{summary.lowStockCount}</strong> item{summary.lowStockCount > 1 ? 's' : ''} currently have 5 or fewer units in stock. Restock recommended.
                                </p>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                                    {inventory.filter(item => item.units_available <= 5).slice(0, 6).map(item => (
                                        <div key={item.id} style={{ padding: 12, backgroundColor: '#FFF', borderRadius: 6, border: '1px solid #FCD34D' }}>
                                            <p style={{ fontSize: 13, fontWeight: 600, color: '#111827', marginBottom: 4 }}>{item.name}</p>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ fontSize: 11, color: '#9CA3AF' }}>{item.sku || 'No SKU'}</span>
                                                <span style={{ 
                                                    fontSize: 12, 
                                                    fontWeight: 700, 
                                                    padding: '2px 8px',
                                                    backgroundColor: '#FEE2E2',
                                                    color: '#DC2626',
                                                    borderRadius: 4
                                                }}>
                                                    {item.units_available} left
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* All Transactions (Admin) */}
                    {isAdmin && sales.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Complete Transaction Log ({summary.transactionCount})</CardTitle>
                                <p style={{ fontSize: 14, color: "#6B7280", marginTop: 4 }}>All sales for the selected period</p>
                            </CardHeader>
                            <CardContent style={{ padding: 0 }}>
                                <div style={{ overflowX: "auto", maxHeight: 500, overflowY: 'auto' }}>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Date & Time</TableHead>
                                                <TableHead>Customer</TableHead>
                                                <TableHead style={{ textAlign: 'center' }}>Items</TableHead>
                                                <TableHead style={{ textAlign: 'right' }}>Total</TableHead>
                                                <TableHead style={{ textAlign: 'right' }}>Paid</TableHead>
                                                <TableHead style={{ textAlign: 'center' }}>Method</TableHead>
                                                <TableHead>Sale ID</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {sales.filter(sale => {
                                                const saleDate = new Date(sale.date.seconds * 1000).toISOString().split('T')[0];
                                                return saleDate >= effectiveStartDate && saleDate <= effectiveEndDate;
                                            }).map((sale) => (
                                                <TableRow key={sale.id}>
                                                    <TableCell style={{ whiteSpace: 'nowrap' }}>
                                                        <div style={{ fontWeight: 600, fontSize: 13 }}>{new Date(sale.date.seconds * 1000).toLocaleDateString()}</div>
                                                        <div style={{ fontSize: 11, color: '#9CA3AF' }}>{new Date(sale.date.seconds * 1000).toLocaleTimeString()}</div>
                                                    </TableCell>
                                                    <TableCell style={{ fontWeight: 500 }}>{sale.customerName}</TableCell>
                                                    <TableCell style={{ textAlign: 'center', color: '#6B7280' }}>{sale.items.length}</TableCell>
                                                    <TableCell style={{ textAlign: 'right', fontWeight: 700, color: '#2563EB' }}>{formatCurrency(sale.totalAmount)}</TableCell>
                                                    <TableCell style={{ textAlign: 'right', fontWeight: 600, color: sale.amountPaid < sale.totalAmount ? '#DC2626' : '#059669' }}>
                                                        {formatCurrency(sale.amountPaid)}
                                                    </TableCell>
                                                    <TableCell style={{ textAlign: 'center' }}>
                                                        <span style={{
                                                            fontSize: 10, fontWeight: 600, padding: "4px 8px", borderRadius: 4,
                                                            backgroundColor: sale.paymentMethod === 'Cash' ? '#d1fae5' : sale.paymentMethod === 'Card' ? '#fef3c7' : sale.paymentMethod === 'Transfer' ? '#dbeafe' : '#fee2e2',
                                                            color: sale.paymentMethod === 'Cash' ? '#065f46' : sale.paymentMethod === 'Card' ? '#92400e' : sale.paymentMethod === 'Transfer' ? '#1e40af' : '#991b1b'
                                                        }}>
                                                            {sale.paymentMethod}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell style={{ fontFamily: 'monospace', fontSize: 11, color: '#9CA3AF' }}>{sale.id.slice(0, 8)}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </main>
        </div>
    );
}
