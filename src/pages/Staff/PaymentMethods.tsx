
"use client";

import React, { useState, useEffect, useCallback, CSSProperties, useMemo } from "react";
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
    getFirestore, collection, query, onSnapshot, where, Timestamp,
    DocumentData, CollectionReference
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
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell,
} from "recharts";
import { DollarSign, Send, Landmark, Download, CreditCard, TrendingUp, Calendar } from "lucide-react";

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

// ========== STYLING CONSTANTS ==========
const PrimaryColor = '#3b82f6';
const SuccessColor = '#10b981';
const PosColor = '#f59e0b';
const CheckColor = '#8b5cf6';
const OutlineBorderColor = '#e5e7eb';
const TextColor = '#111827';
const MutedTextColor = '#6b7280';
const BackgroundColor = '#f9fafb';
const CardBg = '#fff';

// ========== INTERFACES ==========
interface PaymentRecord {
    id: string;
    saleId: string;
    customerId: string;
    customerName: string;
    amount: number;
    method: 'Cash' | 'Card' | 'Transfer' | 'Credit';
    date: Timestamp;
    userId: string;
}

interface PaymentSummary {
    cashTotal: number;
    cardTotal: number;
    transferTotal: number;
    creditTotal: number;
}

interface ChartData {
    date: string;
    cash: number;
    card: number;
    transfer: number;
    credit: number;
}

// ✅ FIXED: Added index signature for recharts compatibility
interface PieDataItem {
    name: string;
    value: number;
    [key: string]: any;  // Required for recharts
}

type DateRange = 'day' | 'week' | 'month' | 'all';

// ========== UI COMPONENTS ==========
const Button: React.FC<React.PropsWithChildren<{ 
    onClick?: () => void, 
    style?: CSSProperties, 
    variant?: 'destructive' | 'outline' | 'ghost' | 'default' | 'active', 
    disabled?: boolean, 
    title?: string 
}>> = ({ children, onClick, style, variant = 'default', disabled = false, title = "" }) => {
    let baseStyle: CSSProperties = {
        padding: '0.5rem 1rem',
        fontSize: 14,
        fontWeight: 600,
        borderRadius: 8,
        transition: 'all 0.15s ease-in-out',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
    };
    
    switch (variant) {
        case "outline":
            baseStyle = { ...baseStyle, border: '1px solid ' + OutlineBorderColor, backgroundColor: CardBg, color: MutedTextColor };
            break;
        case "ghost":
            baseStyle = { ...baseStyle, backgroundColor: 'transparent', color: MutedTextColor, boxShadow: 'none' };
            break;
        case "active":
            baseStyle = { ...baseStyle, backgroundColor: PrimaryColor, color: '#fff', border: '1px solid ' + PrimaryColor };
            break;
        default:
            baseStyle = { ...baseStyle, backgroundColor: PrimaryColor, color: '#fff' };
            break;
    }

    return <button onClick={onClick} style={{ ...baseStyle, ...style }} disabled={disabled} title={title} type="button">{children}</button>;
};

const Card: React.FC<React.PropsWithChildren<{ style?: CSSProperties }>> = ({ children, style }) => (
    <div style={{ borderRadius: 12, backgroundColor: CardBg, border: '1px solid ' + OutlineBorderColor, padding: 24, ...style }}>{children}</div>
);

const CardHeader: React.FC<React.PropsWithChildren<{ style?: CSSProperties }>> = ({ children, style }) => (
    <div style={{ display: 'flex', flexDirection: 'column', marginBottom: 16, ...style }}>{children}</div>
);

const CardTitle: React.FC<React.PropsWithChildren<{ style?: CSSProperties }>> = ({ children, style }) => (
    <h3 style={{ fontSize: 24, fontWeight: 600, lineHeight: 1.5, margin: 0, ...style }}>{children}</h3>
);

const CardContent: React.FC<React.PropsWithChildren<{ style?: CSSProperties }>> = ({ children, style }) => (
    <div style={{ ...style }}>{children}</div>
);

const LoadingSpinner = () => (
    <div style={{ padding: 64, textAlign: 'center', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: BackgroundColor }}>
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
            marginBottom: '1rem' 
        }}></div>
        <p style={{ fontSize: 18, color: MutedTextColor, fontWeight: 600 }}>Loading payment data...</p>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
    </div>
);

// ========== MAIN COMPONENT ==========
export default function PaymentMethodsPage() {
    const [currentUser, setCurrentUser] = useState<FirebaseAuthUser | null>(null);
    const [userRole, setUserRole] = useState<"admin" | "staff">("staff");
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState<DateRange>('day');
    const [payments, setPayments] = useState<PaymentRecord[]>([]);

    // ========== AUTH & DATA LOADING ==========
    useEffect(() => {
        const unsubAuth = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setCurrentUser(user);
                const tokenResult = await user.getIdTokenResult();
                const role = tokenResult.claims.role || 'staff';
                setUserRole(role as "admin" | "staff");
            } else {
                const token = typeof __initial_auth_token !== "undefined" ? __initial_auth_token : "";
                try {
                    if (token) {
                        await signInWithCustomToken(auth, token);
                    } else {
                        await signInAnonymously(auth);
                    }
                } catch (e) {
                    console.error("Firebase Auth Error:", e);
                    signInAnonymously(auth).then(cred => setCurrentUser(cred.user)).catch(console.error);
                }
            }
        });

        // Load Payments from Firebase
        const paymentsCol = getCollectionRef('paymentMethods');
        const unsubPayments = onSnapshot(paymentsCol, (snap) => {
            const paymentsData = snap.docs.map(d => ({
                id: d.id,
                ...d.data()
            } as PaymentRecord));
            
            console.log('💳 Loaded payments from Firebase:', paymentsData);
            setPayments(paymentsData);
            setLoading(false);
        }, (err) => {
            console.error('Error fetching payments:', err);
            setLoading(false);
        });

        return () => {
            unsubAuth();
            unsubPayments();
        };
    }, []);

    // ========== COMPUTED VALUES ==========
    const filteredPayments = useMemo(() => {
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);

        return payments.filter(payment => {
            const paymentDate = new Date(payment.date.seconds * 1000);
            
            switch (dateRange) {
                case 'day':
                    return paymentDate >= startOfDay;
                case 'week':
                    return paymentDate >= startOfWeek;
                case 'month':
                    return paymentDate >= startOfMonth;
                case 'all':
                default:
                    return true;
            }
        });
    }, [payments, dateRange]);

    const paymentSummary: PaymentSummary = useMemo(() => {
        return filteredPayments.reduce((acc, payment) => {
            switch (payment.method) {
                case 'Cash':
                    acc.cashTotal += payment.amount;
                    break;
                case 'Card':
                    acc.cardTotal += payment.amount;
                    break;
                case 'Transfer':
                    acc.transferTotal += payment.amount;
                    break;
                case 'Credit':
                    acc.creditTotal += payment.amount;
                    break;
            }
            return acc;
        }, { cashTotal: 0, cardTotal: 0, transferTotal: 0, creditTotal: 0 });
    }, [filteredPayments]);

    const chartData: ChartData[] = useMemo(() => {
        const groupedData: { [key: string]: ChartData } = {};

        filteredPayments.forEach(payment => {
            const date = new Date(payment.date.seconds * 1000);
            let key: string;

            if (dateRange === 'day') {
                key = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
            } else if (dateRange === 'week') {
                key = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            } else if (dateRange === 'month') {
                key = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            } else {
                key = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
            }

            if (!groupedData[key]) {
                groupedData[key] = { date: key, cash: 0, card: 0, transfer: 0, credit: 0 };
            }

            switch (payment.method) {
                case 'Cash':
                    groupedData[key].cash += payment.amount;
                    break;
                case 'Card':
                    groupedData[key].card += payment.amount;
                    break;
                case 'Transfer':
                    groupedData[key].transfer += payment.amount;
                    break;
                case 'Credit':
                    groupedData[key].credit += payment.amount;
                    break;
            }
        });

        return Object.values(groupedData);
    }, [filteredPayments, dateRange]);

    const totalRevenue = paymentSummary.cashTotal + paymentSummary.cardTotal + paymentSummary.transferTotal + paymentSummary.creditTotal;

    // ✅ FIXED: pieData now has proper type with index signature
    const pieData: PieDataItem[] = totalRevenue > 0 ? [
        { name: "Cash", value: paymentSummary.cashTotal },
        { name: "Card/POS", value: paymentSummary.cardTotal },
        { name: "Transfer", value: paymentSummary.transferTotal },
        { name: "Credit", value: paymentSummary.creditTotal },
    ].filter(item => item.value > 0) : [{ name: "No Data", value: 1 }];

    const COLORS = [SuccessColor, PosColor, PrimaryColor, CheckColor];

    // ========== EXPORT DATA ==========
    const handleExportData = () => {
        if (userRole !== 'admin') {
            alert("Permission denied. Only Admins can export data.");
            return;
        }

        const headers = ['Date', 'Customer', 'Amount', 'Method', 'Sale ID'];
        const rows = filteredPayments.map(p => [
            new Date(p.date.seconds * 1000).toLocaleString(),
            p.customerName,
            p.amount.toFixed(2),
            p.method,
            p.saleId.slice(0, 8)
        ]);

        const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `payments_${dateRange}_${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    };

    // ========== TOOLTIPS ==========
    const CustomBarTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div style={{ padding: 12, backgroundColor: CardBg, border: '1px solid ' + OutlineBorderColor, borderRadius: 8, boxShadow: '0 2px 4px rgba(0,0,0,0.1)', fontSize: 14 }}>
                    <p style={{ fontWeight: 700, color: TextColor, marginBottom: 4 }}>{label}</p>
                    {payload.map((entry: any, index: number) => (
                        <p key={`item-${index}`} style={{ color: entry.color, marginTop: 2 }}>
                            {`${entry.name}: ${userRole === 'admin' ? `₦${entry.value.toLocaleString()}` : "Hidden (Staff View)"}`}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    const CustomPieTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div style={{ padding: 12, backgroundColor: CardBg, border: '1px solid ' + OutlineBorderColor, borderRadius: 8, boxShadow: '0 2px 4px rgba(0,0,0,0.1)', fontSize: 14 }}>
                    <p style={{ fontWeight: 700, color: TextColor }}>{data.name}</p>
                    <p>{userRole === 'admin' ? `₦${data.value.toLocaleString()}` : "Hidden (Staff View)"}</p>
                </div>
            );
        }
        return null;
    };

    // ========== RENDER ==========
    if (loading) return <LoadingSpinner />;

    const isAdmin = userRole === "admin";

    return (
        <div style={{ padding: 32, backgroundColor: BackgroundColor, minHeight: '100vh', fontFamily: 'sans-serif' }}>
            <div style={{ maxWidth: 1400, margin: '0 auto' }}>
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
                    <div>
                        <h1 style={{ fontSize: 36, fontWeight: 800, color: TextColor, margin: 0, marginBottom: 8 }}>💳 Payment Methods Dashboard</h1>
                        <p style={{ fontSize: 14, color: MutedTextColor }}>Real-time payment tracking and analytics</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ 
                            fontSize: 12, 
                            padding: '0.5rem 0.75rem', 
                            borderRadius: 8, 
                            backgroundColor: isAdmin ? '#d1fae5' : '#dbeafe',
                            color: isAdmin ? '#065f46' : '#1e40af',
                            fontWeight: 600
                        }}>
                            {isAdmin ? '👑 Admin' : '👤 Staff'}
                        </div>
                        <Button onClick={() => window.history.back()} variant="outline">
                            ← Back
                        </Button>
                        <Button onClick={handleExportData} title={isAdmin ? "Export Data" : "Permission Denied"} disabled={!isAdmin}>
                            <Download style={{ height: 16, width: 16, marginRight: 8 }} />
                            Export CSV
                        </Button>
                    </div>
                </header>

                {/* Summary Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 24, marginBottom: 32 }}>
                    <Card style={{ padding: 20 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                            <div>
                                <p style={{ fontSize: 14, fontWeight: 500, color: MutedTextColor, marginBottom: 8 }}>Total Revenue</p>
                                <p style={{ fontSize: 32, fontWeight: 700, color: TextColor, margin: 0 }}>
                                    {isAdmin ? `₦${totalRevenue.toLocaleString()}` : "Hidden"}
                                </p>
                                <p style={{ fontSize: 12, color: MutedTextColor, marginTop: 4 }}>
                                    {filteredPayments.length} transactions
                                </p>
                            </div>
                            <DollarSign style={{ height: 40, width: 40, color: PrimaryColor, opacity: 0.3 }} />
                        </div>
                    </Card>

                    <Card style={{ padding: 20 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                            <div>
                                <p style={{ fontSize: 14, fontWeight: 500, color: MutedTextColor, marginBottom: 8 }}>Cash Payments</p>
                                <p style={{ fontSize: 32, fontWeight: 700, color: SuccessColor, margin: 0 }}>
                                    {isAdmin ? `₦${paymentSummary.cashTotal.toLocaleString()}` : "Hidden"}
                                </p>
                                <p style={{ fontSize: 12, color: MutedTextColor, marginTop: 4 }}>
                                    {filteredPayments.filter(p => p.method === 'Cash').length} transactions
                                </p>
                            </div>
                            <Landmark style={{ height: 40, width: 40, color: SuccessColor, opacity: 0.3 }} />
                        </div>
                    </Card>

                    <Card style={{ padding: 20 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                            <div>
                                <p style={{ fontSize: 14, fontWeight: 500, color: MutedTextColor, marginBottom: 8 }}>Bank Transfers</p>
                                <p style={{ fontSize: 32, fontWeight: 700, color: PrimaryColor, margin: 0 }}>
                                    {isAdmin ? `₦${paymentSummary.transferTotal.toLocaleString()}` : "Hidden"}
                                </p>
                                <p style={{ fontSize: 12, color: MutedTextColor, marginTop: 4 }}>
                                    {filteredPayments.filter(p => p.method === 'Transfer').length} transactions
                                </p>
                            </div>
                            <Send style={{ height: 40, width: 40, color: PrimaryColor, opacity: 0.3 }} />
                        </div>
                    </Card>

                    <Card style={{ padding: 20 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                            <div>
                                <p style={{ fontSize: 14, fontWeight: 500, color: MutedTextColor, marginBottom: 8 }}>Card/POS Payments</p>
                                <p style={{ fontSize: 32, fontWeight: 700, color: PosColor, margin: 0 }}>
                                    {isAdmin ? `₦${paymentSummary.cardTotal.toLocaleString()}` : "Hidden"}
                                </p>
                                <p style={{ fontSize: 12, color: MutedTextColor, marginTop: 4 }}>
                                    {filteredPayments.filter(p => p.method === 'Card').length} transactions
                                </p>
                            </div>
                            <CreditCard style={{ height: 40, width: 40, color: PosColor, opacity: 0.3 }} />
                        </div>
                    </Card>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
                    {/* Payment Methods Overview Chart */}
                    <Card style={{ gridColumn: 'span 2', padding: 0 }}>
                        <CardHeader style={{ padding: 24, display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 0 }}>
                            <CardTitle style={{ fontSize: 18 }}>Payment Methods Over Time</CardTitle>
                            <div style={{ display: 'flex', gap: 8 }}>
                                {(['day', 'week', 'month', 'all'] as DateRange[]).map((range) => (
                                    <Button 
                                        key={range} 
                                        onClick={() => setDateRange(range)} 
                                        variant={dateRange === range ? 'active' : 'outline'}
                                        style={{ textTransform: 'capitalize', padding: '0.375rem 0.75rem' }}
                                    >
                                        {range === 'day' ? 'Today' : range === 'week' ? 'Week' : range === 'month' ? 'Month' : 'All'}
                                    </Button>
                                ))}
                            </div>
                        </CardHeader>
                        <CardContent style={{ padding: 24, paddingTop: 0 }}>
                            {chartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={400}>
                                    <BarChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                        <XAxis dataKey="date" style={{ fontSize: 12 }} />
                                        <YAxis tickFormatter={(value) => isAdmin ? `₦${value.toLocaleString()}` : '...'} style={{ fontSize: 12 }} />
                                        <Tooltip content={<CustomBarTooltip />} />
                                        <Legend />
                                        <Bar dataKey="cash" fill={SuccessColor} name="Cash" />
                                        <Bar dataKey="card" fill={PosColor} name="Card/POS" />
                                        <Bar dataKey="transfer" fill={PrimaryColor} name="Transfer" />
                                        <Bar dataKey="credit" fill={CheckColor} name="Credit" />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div style={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', color: MutedTextColor }}>
                                    <p>No payment data for selected period</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Payment Distribution Pie Chart - ✅ FIXED */}
                    <Card style={{ padding: 0 }}>
                        <CardHeader style={{ padding: 24, marginBottom: 0 }}>
                            <CardTitle style={{ fontSize: 18 }}>Payment Distribution</CardTitle>
                        </CardHeader>
                        <CardContent style={{ padding: 24, paddingTop: 0 }}>
                            <ResponsiveContainer width="100%" height={400}>
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => 
                                            isAdmin && percent !== undefined ? 
                                            `${name}: ${(percent * 100).toFixed(0)}%` : 
                                            name
                                        }
                                        outerRadius={120}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {pieData.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomPieTooltip />} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>

                {/* Recent Transactions Table */}
                <Card style={{ marginTop: 24, padding: 0 }}>
                    <CardHeader style={{ padding: 24, marginBottom: 0 }}>
                        <CardTitle style={{ fontSize: 18 }}>Recent Transactions ({filteredPayments.length})</CardTitle>
                    </CardHeader>
                    <CardContent style={{ padding: 0 }}>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead style={{ backgroundColor: '#f9fafb', borderBottom: `2px solid ${OutlineBorderColor}` }}>
                                    <tr>
                                        <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: 12, fontWeight: 600, color: MutedTextColor, textTransform: 'uppercase' }}>Date & Time</th>
                                        <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: 12, fontWeight: 600, color: MutedTextColor, textTransform: 'uppercase' }}>Customer</th>
                                        <th style={{ padding: '0.75rem', textAlign: 'right', fontSize: 12, fontWeight: 600, color: MutedTextColor, textTransform: 'uppercase' }}>Amount</th>
                                        <th style={{ padding: '0.75rem', textAlign: 'center', fontSize: 12, fontWeight: 600, color: MutedTextColor, textTransform: 'uppercase' }}>Method</th>
                                        <th style={{ padding: '0.75rem', textAlign: 'center', fontSize: 12, fontWeight: 600, color: MutedTextColor, textTransform: 'uppercase' }}>Sale ID</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredPayments.length > 0 ? (
                                        filteredPayments.slice(0, 20).map((payment) => {
                                            let methodColor = SuccessColor;
                                            let methodBg = '#d1fae5';
                                            
                                            switch (payment.method) {
                                                case 'Card':
                                                    methodColor = PosColor;
                                                    methodBg = '#fef3c7';
                                                    break;
                                                case 'Transfer':
                                                    methodColor = PrimaryColor;
                                                    methodBg = '#dbeafe';
                                                    break;
                                                case 'Credit':
                                                    methodColor = CheckColor;
                                                    methodBg = '#ede9fe';
                                                    break;
                                            }

                                            return (
                                                <tr key={payment.id} style={{ borderBottom: `1px solid ${OutlineBorderColor}` }}>
                                                    <td style={{ padding: '0.75rem' }}>
                                                        <div style={{ fontSize: 14, fontWeight: 600 }}>
                                                            {new Date(payment.date.seconds * 1000).toLocaleDateString()}
                                                        </div>
                                                        <div style={{ fontSize: 12, color: MutedTextColor }}>
                                                            {new Date(payment.date.seconds * 1000).toLocaleTimeString()}
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '0.75rem', fontWeight: 500 }}>{payment.customerName}</td>
                                                    <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 700, fontSize: 16, color: TextColor }}>
                                                        {isAdmin ? `₦${payment.amount.toLocaleString()}` : "Hidden"}
                                                    </td>
                                                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                                        <span style={{
                                                            padding: '0.25rem 0.75rem',
                                                            borderRadius: '9999px',
                                                            fontSize: 12,
                                                            fontWeight: 600,
                                                            backgroundColor: methodBg,
                                                            color: methodColor
                                                        }}>
                                                            {payment.method}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '0.75rem', textAlign: 'center', fontFamily: 'monospace', fontSize: 12, color: MutedTextColor }}>
                                                        {payment.saleId.slice(0, 8)}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: MutedTextColor }}>
                                                No payment records found for the selected period.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
