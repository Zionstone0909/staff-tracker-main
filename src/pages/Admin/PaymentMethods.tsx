"use client";

import React, { useState, useEffect, useCallback, CSSProperties } from "react";
import { // useMemo removed from imports
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
} from "recharts";
// Receipt removed from imports
import { DollarSign, Send, Landmark, Download, User, CreditCard } from "lucide-react";

// --- Styling Constants ---
const PrimaryColor = '#3b82f6'; // Blue-600
const SuccessColor = '#10b981'; // Green-600 (Cash)
const PosColor = '#f59e0b'; // Amber-500 (POS)
const CheckColor = '#8b5cf6'; // Violet-500 (Check)
const OutlineBorderColor = '#e5e7eb'; // Gray-200
const TextColor = '#111827'; // Gray-900
const MutedTextColor = '#6b7280'; // Gray-500
const BackgroundColor = '#f9fafb'; // Gray-50
const CardBg = '#fff';


// Mock the useRouter functionality for non-Next-js environments
const useMockRouter = () => ({
    back: () => window.history.back(),
});


// ------------------- LOCAL UI COMPONENTS -------------------

const Button: React.FC<React.PropsWithChildren<{ onClick?: () => void, style?: CSSProperties, variant?: 'destructive' | 'outline' | 'ghost' | 'default' | 'active', disabled?: boolean, title?: string, type?: "button" | "submit" | "reset" }>> = ({ children, onClick, style, variant = 'default', disabled = false, title = "" }) => {
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
        case "default":
        default:
            baseStyle = { ...baseStyle, backgroundColor: PrimaryColor, color: '#fff' };
            break;
    }

    return (
        <button
            onClick={onClick ? onClick : undefined}
            style={{ ...baseStyle, ...style }}
            disabled={disabled}
            title={title}
            type="button" 
        >
            {children}
        </button>
    );
};

const Card: React.FC<React.PropsWithChildren<{ style?: CSSProperties }>> = ({ children, style }) => (
    <div style={{ borderRadius: 12, backgroundColor: CardBg, border: '1px solid ' + OutlineBorderColor, ...style }}>{children}</div>
);
const CardHeader: React.FC<React.PropsWithChildren<{ style?: CSSProperties }>> = ({ children, style }) => (
    <div style={{ display: 'flex', flexDirection: 'column', padding: 24, ...style }}>{children}</div>
);
const CardTitle: React.FC<React.PropsWithChildren<{ style?: CSSProperties }>> = ({ children, style }) => (
    <h3 style={{ fontSize: 24, fontWeight: 600, lineHeight: 1.5, margin: 0, ...style }}>{children}</h3>
);
const CardContent: React.FC<React.PropsWithChildren<{ style?: CSSProperties }>> = ({ children, style }) => (
    <div style={{ padding: 24, paddingTop: 0, ...style }}>{children}</div>
);


// ------------------- TYPES -------------------

type DateRange = 'day' | 'week' | 'all';

interface PaymentSummary {
    cashTotal: number;
    transferTotal: number;
    posTotal: number;
    checkTotal: number;
}

interface ChartData {
    date: string;
    cash: number;
    transfer: number;
    pos: number;
    check: number;
    [key: string]: any; 
}

interface CurrentUser {
    userId: number;
    email: string;
    role: "admin" | "staff";
}

interface PieDataItem {
    name: string;
    value: number;
    percent?: number;
    [key: string]: any; 
}

// ------------------- COMPONENT -------------------
export default function PaymentMethodsPage() {
    const router = useMockRouter();
    const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
    const [dateRange, setDateRange] = useState<DateRange>('day'); 
    const [paymentSummary, setPaymentSummary] = useState<PaymentSummary>({
        cashTotal: 0, transferTotal: 0, posTotal: 0, checkTotal: 0,
    });
    const [paymentData, setPaymentData] = useState<ChartData[]>([]);
    const [loading, setLoading] = useState(true);

    const isAdmin = currentUser?.role === "admin";
    const isStaff = currentUser?.role === "staff";

    // ------------------- AUTH & ROLE TOGGLE -------------------
    
    const setRole = useCallback((role: "admin" | "staff") => {
        const mockUser: CurrentUser = { 
            userId: role === "admin" ? 1 : 2, email: role === "admin" ? "admin@store.com" : "staff@store.com", role: role 
        };
        localStorage.setItem("currentUser", JSON.stringify(mockUser));
        setCurrentUser(mockUser);
    }, []);

    useEffect(() => {
        const user = localStorage.getItem("currentUser");
        if (!user) {
            setRole("admin");
        } else {
            setCurrentUser(JSON.parse(user));
        }
    }, [setRole]);

    // Role Toggler Handler
    const handleToggleRole = () => {
        const newRole = currentUser?.role === "admin" ? "staff" : "admin";
        setRole(newRole);
    };

    // ------------------- DATA FETCHING & MOCKING -------------------

    const fetchPaymentMethods = useCallback(async (range: DateRange) => {
        setLoading(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 500)); 

            let mockData;

            if (range === 'day') {
                mockData = {
                    summary: { cashTotal: 50000, transferTotal: 80000, posTotal: 30000, checkTotal: 5000 },
                    chartData: [
                        { date: "09:00", cash: 10000, transfer: 5000, pos: 2000, check: 0 },
                        { date: "12:00", cash: 20000, transfer: 30000, pos: 15000, check: 1000 },
                        { date: "15:00", cash: 15000, transfer: 40000, pos: 10000, check: 4000 },
                        { date: "18:00", cash: 5000, transfer: 5000, pos: 3000, check: 0 },
                    ],
                };
            } else if (range === 'week') {
                 mockData = {
                    summary: { cashTotal: 350000, transferTotal: 600000, posTotal: 250000, checkTotal: 40000 },
                    chartData: [
                        { date: "Nov 11", cash: 50000, transfer: 80000, pos: 30000, check: 5000 },
                        { date: "Nov 12", cash: 70000, transfer: 100000, pos: 40000, check: 10000 },
                        { date: "Nov 13", cash: 100000, transfer: 120000, pos: 50000, check: 15000 },
                        { date: "Nov 14", cash: 130000, transfer: 150000, pos: 80000, check: 10000 },
                        { date: "Nov 15", cash: 0, transfer: 150000, pos: 50000, check: 0 },
                    ],
                };
            } else { // 'all' time
                 mockData = {
                    summary: { cashTotal: 550000, transferTotal: 850000, posTotal: 400000, checkTotal: 90000 },
                    chartData: [
                        { date: "Oct", cash: 200000, transfer: 400000, pos: 150000, check: 40000 },
                        { date: "Nov", cash: 350000, transfer: 450000, pos: 250000, check: 50000 },
                    ],
                };
            }
           
            setPaymentSummary(mockData.summary);
            setPaymentData(mockData.chartData);

        } catch (err) {
            console.error("Error fetching payment methods:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPaymentMethods(dateRange);
    }, [dateRange, fetchPaymentMethods]);

    // ------------------- CALCULATED VALUES & HANDLERS -------------------

    const totalRevenue = paymentSummary.cashTotal + paymentSummary.transferTotal + paymentSummary.posTotal + paymentSummary.checkTotal;
    
    // Pie chart data
    const pieData: PieDataItem[] =
        totalRevenue > 0
            ? [
                  { name: "Cash", value: paymentSummary.cashTotal },
                  { name: "Transfer", value: paymentSummary.transferTotal },
                  { name: "POS", value: paymentSummary.posTotal },
                  { name: "Check", value: paymentSummary.checkTotal },
              ]
            : [{ name: "No Data", value: 1 }];

    const COLORS = [SuccessColor, PrimaryColor, PosColor, CheckColor]; 

    const handleExportData = () => {
        const modalMessageElement = document.getElementById('permission-modal-message');
        const modalElement = document.getElementById('permission-modal');

        if (!modalMessageElement || !modalElement) {
            console.error("Modal elements not found in the DOM.");
            return; 
        }

        if (!isAdmin) {
            modalMessageElement.innerText = "Permission denied. Only Admins can export data.";
            modalElement.style.display = 'flex';
            return;
        }
        console.log("Exporting Payment Methods Data...");
        modalMessageElement.innerText = "Export initiated! (Mock feature)";
        modalElement.style.display = 'flex';
    };
    
    // Custom Tooltip for BarChart - Hides raw values for Staff
    const CustomBarTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div style={{ padding: 12, backgroundColor: CardBg, border: '1px solid ' + OutlineBorderColor, borderRadius: 8, boxShadow: '0 2px 4px rgba(0,0,0,0.1)', fontSize: 14 }}>
                    <p style={{ fontWeight: 700, color: TextColor, marginBottom: 4 }}>{label}</p>
                    {payload.map((entry: any, index: number) => {
                        const name = entry.name;
                        const value = entry.value;
                        const color = entry.color;
                        
                        let displayValue;
                        if (isAdmin) {
                            displayValue = `₦${value.toLocaleString()}`;
                        } else if (isStaff) {
                             displayValue = "Hidden (Staff View)";
                        }
                        
                        return (
                            <p key={`item-${index}`} style={{ color: color, marginTop: 2 }}>
                                {`${name}: ${displayValue}`}
                            </p>
                        );
                    })}
                </div>
            );
        }
        return null;
    };


    // Custom Tooltip for PieChart - Hides raw values for Staff
    const CustomPieTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload.payload;
            
            let displayValue;
            if (isAdmin) {
                displayValue = `₦${data.value.toLocaleString()}`;
            } else if (isStaff) {
                displayValue = "Hidden (Staff View)";
            }

            return (
                <div style={{ padding: 12, backgroundColor: CardBg, border: '1px solid ' + OutlineBorderColor, borderRadius: 8, boxShadow: '0 2px 4px rgba(0,0,0,0.1)', fontSize: 14 }}>
                    <p style={{ fontWeight: 700, color: TextColor }}>{data.name}</p>
                    <p>{displayValue}</p>
                </div>
            );
        }
        return null;
    };


    if (loading) {
        return <div style={{ padding: 32, textAlign: 'center', fontSize: 18 }}>Loading payment methods data...</div>;
    }

    return (
        <div style={{ padding: 32, backgroundColor: BackgroundColor, minHeight: '100vh', fontFamily: 'sans-serif' }}>
            <div style={{ maxWidth: 1400, margin: '0 auto' }}>
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                    <h1 style={{ fontSize: 36, fontWeight: 800, color: TextColor, margin: 0 }}>Payment Methods Dashboard</h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                         <Button onClick={() => router.back()} variant="outline" style={{ display: 'flex', alignItems: 'center' }}>
                            ← Back
                        </Button>
                        <Button onClick={handleToggleRole} variant="outline" style={{ display: 'flex', alignItems: 'center', gap: 8 }} title="Toggle User Role">
                            <User style={{ height: 16, width: 16 }} />
                            <span>Switch Role ({isAdmin ? "Admin" : "Staff"})</span>
                        </Button>
                        <Button onClick={handleExportData} style={{ display: 'flex', alignItems: 'center', gap: 8 }} title={isAdmin ? "Export Data" : "Permission Denied"}>
                            <Download style={{ height: 16, width: 16 }} />
                            <span>Export Data</span>
                        </Button>
                    </div>
                </header>

                {/* Role/Permission Modal */}
                <div id="permission-modal" style={{ display: 'none', position: 'fixed', inset: 0, backgroundColor: 'rgba(55, 65, 81, 0.5)', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
                    <Card style={{ padding: 24, maxWidth: 384 }}>
                        <p id="permission-modal-message" style={{ color: TextColor, marginBottom: 16 }}>Message</p>
                        <Button onClick={() => {
                            const modal = document.getElementById('permission-modal');
                            if (modal) modal.style.display = 'none';
                        }}>Close</Button>
                    </Card>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginBottom: 32 }}>
                    {/* Total Revenue Card */}
                    <Card style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <CardHeader style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: '0px 0px 8px 0px', borderBottom: 'none' }}>
                            <CardTitle style={{ fontSize: 14, fontWeight: 500 }}>Total Revenue</CardTitle>
                            <DollarSign style={{ height: 16, width: 16, color: MutedTextColor }} />
                        </CardHeader>
                        <CardContent style={{ padding: 0 }}>
                            <div style={{ fontSize: 30, fontWeight: 700, color: TextColor }}>
                                {isAdmin ? `₦${totalRevenue.toLocaleString()}` : "Hidden"}
                            </div>
                            <p style={{ fontSize: 12, color: MutedTextColor, marginTop: 4 }}>Overview ({dateRange})</p>
                        </CardContent>
                    </Card>

                    {/* Cash Total Card */}
                    <Card style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <CardHeader style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: '0px 0px 8px 0px', borderBottom: 'none' }}>
                            <CardTitle style={{ fontSize: 14, fontWeight: 500 }}>Cash Payments</CardTitle>
                            <Landmark style={{ height: 16, width: 16, color: SuccessColor }} />
                        </CardHeader>
                        <CardContent style={{ padding: 0 }}>
                            <div style={{ fontSize: 30, fontWeight: 700, color: TextColor }}>
                                {isAdmin ? `₦${paymentSummary.cashTotal.toLocaleString()}` : "Hidden"}
                            </div>
                            <p style={{ fontSize: 12, color: MutedTextColor, marginTop: 4 }}>Total Cash ({dateRange})</p>
                        </CardContent>
                    </Card>

                    {/* Transfer Total Card */}
                    <Card style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <CardHeader style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: '0px 0px 8px 0px', borderBottom: 'none' }}>
                            <CardTitle style={{ fontSize: 14, fontWeight: 500 }}>Bank Transfers</CardTitle>
                            <Send style={{ height: 16, width: 16, color: PrimaryColor }} />
                        </CardHeader>
                        <CardContent style={{ padding: 0 }}>
                            <div style={{ fontSize: 30, fontWeight: 700, color: TextColor }}>
                                {isAdmin ? `₦${paymentSummary.transferTotal.toLocaleString()}` : "Hidden"}
                            </div>
                            <p style={{ fontSize: 12, color: MutedTextColor, marginTop: 4 }}>Total Transfers ({dateRange})</p>
                        </CardContent>
                    </Card>

                    {/* POS Total Card */}
                    <Card style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <CardHeader style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: '0px 0px 8px 0px', borderBottom: 'none' }}>
                            <CardTitle style={{ fontSize: 14, fontWeight: 500 }}>POS Payments</CardTitle>
                            <CreditCard style={{ height: 16, width: 16, color: PosColor }} />
                        </CardHeader>
                        <CardContent style={{ padding: 0 }}>
                            <div style={{ fontSize: 30, fontWeight: 700, color: TextColor }}>
                                {isAdmin ? `₦${paymentSummary.posTotal.toLocaleString()}` : "Hidden"}
                            </div>
                            <p style={{ fontSize: 12, color: MutedTextColor, marginTop: 4 }}>Total POS ({dateRange})</p>
                        </CardContent>
                    </Card>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
                    {/* Daily Revenue Chart Card (Bar Chart) */}
                    <Card style={{ gridColumn: 'span 2' }}>
                        <CardHeader style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <CardTitle style={{ fontSize: 18 }}>Payment Methods Overview</CardTitle>
                            {/* Date Range Selector */}
                            <div style={{ display: 'flex', gap: 8 }}>
                                {(['day', 'week', 'all'] as DateRange[]).map((range) => (
                                    <Button 
                                        key={range} 
                                        onClick={() => setDateRange(range)} 
                                        variant={dateRange === range ? 'active' : 'outline'}
                                        style={{ textTransform: 'capitalize' }}
                                    >
                                        {range === 'day' ? 'Today' : range === 'week' ? 'This Week' : 'All Time'}
                                    </Button>
                                ))}
                            </div>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={400}>
                                <BarChart data={paymentData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                    <XAxis dataKey="date" />
                                    <YAxis 
                                        tickFormatter={(value) => isAdmin ? `₦${value.toLocaleString()}` : '...'} 
                                    />
                                    <Tooltip content={<CustomBarTooltip />} />
                                    <Legend />
                                    <Bar dataKey="cash" fill={SuccessColor} />
                                    <Bar dataKey="transfer" fill={PrimaryColor} />
                                    <Bar dataKey="pos" fill={PosColor} />
                                    <Bar dataKey="check" fill={CheckColor} />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Payment Method Distribution Card (Pie Chart) */}
                    <Card>
                        <CardHeader>
                            <CardTitle style={{ fontSize: 18 }}>Total Method Distribution</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div style={{ height: 400 }}>
                                <ResponsiveContainer width="100%" height="100%">
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
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
