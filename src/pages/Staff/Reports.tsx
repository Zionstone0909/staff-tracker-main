"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { DollarSign, TrendingUp, TrendingDown, Clock, Printer, Calendar, CreditCard, Banknote, Scan, Users, AlertTriangle } from "lucide-react";

// --- Mocking External Dependencies (Shadcn/UI, Next.js Router, Recharts, react-to-print) ---

// Mock Router
const useMockRouter = () => ({
    back: () => console.log("Navigating back to the dashboard (mock action)."),
});

// Mock react-to-print hook
const useReactToPrint = ({ content }: { content: () => HTMLElement | null }) => {
    return () => {
        const reportElement = content();
        if (reportElement) {
            console.log("Preparing report for print...");
            
            const printContent = reportElement.outerHTML;
            const printWindow = window.open('', '_blank');
            
            if (printWindow) {
                printWindow.document.write('<html><head><title>Financial Report</title>');
                // Ensure Tailwind is loaded for print styles
                printWindow.document.write('<script src="https://cdn.tailwindcss.com"></script>');
                printWindow.document.write('<style>');
                printWindow.document.write('@media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }');
                printWindow.document.write('body { font-family: sans-serif; padding: 20px; }');
                printWindow.document.write('</style>');
                printWindow.document.write('</head><body>');
                printWindow.document.write(`<div class="p-8">${printContent}</div>`);
                printWindow.document.close();
                
                // Give a moment for styles to load before printing
                setTimeout(() => printWindow.print(), 500);
            }
        }
    };
};

// Simple Button Component
const Button = ({ children, onClick, className = "", variant = "default", disabled = false, type = "button", style = {} }: any) => {
    const baseStyle = {
        padding: "8px 16px",
        fontSize: "14px",
        fontWeight: 600,
        borderRadius: "8px",
        transition: "all 0.15s ease-in-out",
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        ...style,
    };

    const stylesMap: Record<string, React.CSSProperties> = {
        default: { backgroundColor: "#2563EB", color: "#FFFFFF" },
        ghost: { backgroundColor: "transparent", color: "#4B5563", boxShadow: "none" },
        outline: { border: "1px solid #2563EB", color: "#2563EB", backgroundColor: "#FFFFFF" },
    };
    
    const variantStyle = stylesMap[variant] || stylesMap.default;

    return (
        <button
            onClick={onClick}
            style={{ ...baseStyle, ...variantStyle }}
            className={className}
            disabled={disabled}
            type={type}
        >
            {children}
        </button>
    );
};

// Input Component
const Input = ({ className = "", type = "text", value, onChange, placeholder, disabled = false, label }: any) => (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }} className={className}>
        {label && <label style={{ fontSize: "12px", fontWeight: 500, color: "#4B5563" }}>{label}</label>}
        <input
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            style={{
                display: "flex", height: "40px", width: "100%", borderRadius: "8px", border: "1px solid #D1D5DB",
                backgroundColor: "#FFFFFF", padding: "8px 12px", fontSize: "14px", outline: "none",
                transition: "all 0.15s ease-in-out", opacity: disabled ? 0.5 : 1, cursor: disabled ? "not-allowed" : "text",
            }}
            disabled={disabled}
        />
    </div>
);

// Card Components
const Card = ({ children, className = "", style = {} }: any) => (
    <div 
        style={{ borderRadius: "12px", backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)", ...style }}
        className={className}
    >
        {children}
    </div>
);

const CardHeader = ({ children, className = "", style = {} }: any) => (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px", padding: "24px", borderBottom: "1px solid #E5E7EB", ...style }} className={className}>
        {children}
    </div>
);

const CardTitle = ({ children, className = "" }: any) => (
    <h3 style={{ fontSize: "20px", fontWeight: 600, lineHeight: 1.2, letterSpacing: "-0.025em" }} className={className}>
        {children}
    </h3>
);

const CardContent = ({ children, className = "", style = {} }: any) => (
    <div style={{ padding: "24px", paddingTop: "16px", ...style }} className={className}>
        {children}
    </div>
);

// Mock Recharts Components
const ResponsiveContainer = ({ children, width, height }: any) => (
    <div style={{ width: width, height: height }}>{children}</div>
);

const ChartPlaceholder = ({ title, chartData }: { title: string, chartData: any[] }) => (
    <div style={{ height: "400px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", backgroundColor: "#F9FAFB", borderRadius: "8px", color: "#6B7280", border: "1px dashed #D1D5DB", padding: "16px" }}>
        <p style={{ fontSize: "18px", fontWeight: 600 }}>{title} (Chart Placeholder)</p>
        <p style={{ marginTop: "8px", fontSize: "14px", color: "#4B5563" }}>Showing data for {chartData.length} day(s)</p>
        <ul style={{ marginTop: "16px", fontSize: "12px", textAlign: "left", maxWidth: "90%", maxHeight: "150px", overflowY: 'auto', borderTop: "1px solid #D1D5DB", paddingTop: "8px" }}>
            {chartData.map((d, index) => (
                <li key={index} style={{ listStyleType: 'disc', marginLeft: '20px', lineHeight: '1.5' }}>
                    {d.date}: Sales ${d.sales}, Profit ${d.profit}
                </li>
            ))}
        </ul>
    </div>
);

// Table Components
const Table = ({ children, className = "" }: any) => (<table style={{ width: "100%", captionSide: "bottom", fontSize: "14px", borderCollapse: "collapse" }} className={className}>{children}</table>);
const TableHeader = ({ children, className = "" }: any) => (<thead style={{ borderBottom: "1px solid #E5E7EB", backgroundColor: "#F9FAFB" }} className={className}>{children}</thead>);
const TableBody = ({ children, className = "" }: any) => (<tbody className={className}>{children}</tbody>);
const TableRow = ({ children, className = "" }: any) => (<tr style={{ borderBottom: "1px solid #E5E7EB", transition: "background-color 0.15s ease-in-out" }} className={className}>{children}</tr>);
const TableHead = ({ children, className = "" }: any) => (<th style={{ height: "40px", padding: "0 16px", textAlign: "left", verticalAlign: "middle", fontWeight: 500, color: "#6B7280", fontSize: "14px" }} className={className}>{children}</th>);
const TableCell = ({ children, className = "" }: any) => (<td style={{ padding: "16px", verticalAlign: "middle", fontSize: "14px" }} className={className}>{children}</td>);

// ----------------------
// Type definitions & Mock Data
// ----------------------
type PaymentMethod = "cash" | "pos" | "transfer" | "debit" | "other";
type PaymentsBreakdown = { [key in PaymentMethod]: number; };
type Expense = { id: number; date: string; description: string; amount: number; category: "Payroll" | "Rent" | "Utilities" | "Inventory" | "Marketing" | "Other"; };
type Summary = { totalSales: number; totalExpenses: number; totalProfit: number; totalPayroll: number; paymentTotals: PaymentsBreakdown; };
type ReportsData = { chartData: any[]; detailedExpenses: Expense[]; };

const MOCK_REPORTS_DATA: ReportsData = {
    chartData: [
        { date: "2024-11-15", sales: 450000, expenses: 120000, profit: 330000, payments: { cash: 150000, pos: 100000, transfer: 150000, debit: 50000, other: 0 } },
        { date: "2024-11-16", sales: 620000, expenses: 150000, profit: 470000, payments: { cash: 200000, pos: 220000, transfer: 100000, debit: 100000, other: 0 } },
        { date: "2024-11-17", sales: 510000, expenses: 140000, profit: 370000, payments: { cash: 80000, pos: 300000, transfer: 50000, debit: 80000, other: 0 } },
        { date: "2024-11-18", sales: 780000, expenses: 190000, profit: 590000, payments: { cash: 100000, pos: 400000, transfer: 200000, debit: 80000, other: 0 } },
        { date: "2024-11-19", sales: 900000, expenses: 210000, profit: 690000, payments: { cash: 250000, pos: 350000, transfer: 150000, debit: 150000, other: 0 } },
        { date: "2024-11-20", sales: 850000, expenses: 200000, profit: 650000, payments: { cash: 120000, pos: 430000, transfer: 100000, debit: 200000, other: 0 } },
    ],
    detailedExpenses: [
        { id: 1, date: "2024-11-15", description: "Monthly Rent Payment", amount: 450000, category: "Rent" },
        { id: 2, date: "2024-11-15", description: "Inventory Restock - Q1", amount: 200000, category: "Inventory" },
        { id: 3, date: "2024-11-16", description: "Team Payroll", amount: 150000, category: "Payroll" },
        { id: 4, date: "2024-11-17", description: "Marketing Campaign", amount: 50000, category: "Marketing" },
        { id: 5, date: "2024-11-18", description: "Office Supplies", amount: 10000, category: "Other" },
        { id: 6, date: "2024-11-20", description: "Delivery Worker Pay", amount: 20000, category: "Payroll" },
    ],
};

const formatCurrency = (value: number) => {
    // Handling negative numbers correctly for currency display
    const sign = value < 0 ? "-" : "";
    const absoluteValue = Math.abs(value);
    const formatted = new Intl.NumberFormat('en-US', { 
        style: 'currency', 
        currency: 'NGN', 
        minimumFractionDigits: 0, 
        maximumFractionDigits: 0 
    }).format(absoluteValue);
    return `${sign}${formatted.replace(new RegExp(`^-?${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'NGN' }).format(1).replace('1', '').trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`), '')}`;
};
const formatPercentage = (value: number) => `${value.toFixed(1)}%`;


// ----------------------
// Helper Component for Payment Breakdown
// ----------------------
const PaymentMethodBreakdown = ({ payments, totalSales }: { payments: PaymentsBreakdown, totalSales: number }) => {
    const tailwindStyles: Record<string, string> = {
        "bg-green-500": "#10B981", "text-green-600": "#059669",
        "bg-blue-500": "#3B82F6", "text-blue-600": "#2563EB",
        "bg-purple-500": "#8B5CF6", "text-purple-600": "#7C3AED",
        "bg-yellow-500": "#F59E0B", "text-yellow-600": "#D97706",
        "bg-gray-200": "#E5E7EB",
    };

    const paymentDetails = [
        { method: "Cash", amount: payments.cash || 0, icon: Banknote, color: tailwindStyles["bg-green-500"], iconColor: tailwindStyles["text-green-600"] },
        { method: "POS", amount: payments.pos || 0, icon: CreditCard, color: tailwindStyles["bg-blue-500"], iconColor: tailwindStyles["text-blue-600"] },
        { method: "Transfer", amount: payments.transfer || 0, icon: Scan, color: tailwindStyles["bg-purple-500"], iconColor: tailwindStyles["text-purple-600"] },
        { method: "Debit/Credit", amount: payments.debit || 0, icon: CreditCard, color: tailwindStyles["bg-yellow-500"], iconColor: tailwindStyles["text-yellow-600"] },
    ];

    return (
        <Card>
            <CardHeader>
                <CardTitle style={{ fontSize: "18px" }}>Sales by Payment Method</CardTitle>
            </CardHeader>
            <CardContent style={{ gap: "16px", display: "flex", flexDirection: "column" }}>
                {paymentDetails.map((detail) => {
                    const percentage = totalSales > 0 ? (detail.amount / totalSales) * 100 : 0;
                    return (
                        <div key={detail.method} style={{ gap: "4px", display: "flex", flexDirection: "column" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "14px", fontWeight: 500 }}>
                                <div style={{ display: "flex", alignItems: "center" }}>
                                    <detail.icon size={16} style={{ marginRight: "8px", color: detail.iconColor }} />
                                    <span>{detail.method}</span>
                                </div>
                                <span style={{ color: "#111827" }}>{formatCurrency(detail.amount)}</span>
                            </div>
                            <div style={{ width: "100%", backgroundColor: tailwindStyles["bg-gray-200"], borderRadius: "9999px", height: "8px" }}>
                                <div 
                                    style={{ height: "8px", borderRadius: "9999px", backgroundColor: detail.color, width: `${Math.min(100, percentage).toFixed(1)}%` }}
                                    title={`${percentage.toFixed(1)}% of total sales`}
                                ></div>
                            </div>
                            <p style={{ fontSize: "12px", color: "#6B7280", textAlign: "right" }}>{formatPercentage(percentage)}</p>
                        </div>
                    );
                })}
                {totalSales === 0 && (
                    <p style={{ color: "#EF4444", fontSize: "14px", textAlign: "center", marginTop: "10px" }}>No sales recorded for this period.</p>
                )}
            </CardContent>
        </Card>
    );
};


// ----------------------
// Main Component
// ----------------------
export default function App() {
    const todayDate = "2024-11-20"; // Mock today's date
    const [userRole, setUserRole] = useState<'staff' | 'admin'>('admin'); 
    const router = useMockRouter();
    const [data, setData] = useState<ReportsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const reportRef = useRef<HTMLDivElement>(null); 
    
    // Admin state for date filtering
    const [startDate, setStartDate] = useState("2024-11-15");
    const [endDate, setEndDate] = useState(todayDate);
    const [dateError, setDateError] = useState<string | null>(null);

    // Filtered data calculation
    const calculateReports = useCallback((start: string, end: string, sourceData: ReportsData | null, role: 'staff' | 'admin') => {
        if (!sourceData) return { summary: null, filteredChartData: [], filteredExpenses: [], topExpenses: [], effectiveStartDate: start, effectiveEndDate: end };

        // Staff view is limited to the current day
        const effectiveStartDate = role === 'staff' ? todayDate : start;
        const effectiveEndDate = role === 'staff' ? todayDate : end;

        // 1. Filter Sales/Profit Chart Data
        const filteredChartData = sourceData.chartData.filter(entry => 
            entry.date >= effectiveStartDate && entry.date <= effectiveEndDate
        );

        // 2. Filter Expenses (Crucial Correction: Expenses must be filtered by date range too)
        const filteredExpenses = sourceData.detailedExpenses.filter(expense =>
            expense.date >= effectiveStartDate && expense.date <= effectiveEndDate
        );

        // 3. Calculate Summary
        const summary: Summary = filteredChartData.reduce((acc, entry) => {
            acc.totalSales += entry.sales;
            acc.totalExpenses += entry.expenses;
            acc.totalProfit += entry.profit;
            (Object.keys(entry.payments) as PaymentMethod[]).forEach(method => {
                acc.paymentTotals[method] = (acc.paymentTotals[method] || 0) + entry.payments[method];
            });
            return acc;
        }, {
            totalSales: 0, totalExpenses: 0, totalProfit: 0,
            // Correction: totalPayroll must now come from the filtered expenses
            totalPayroll: filteredExpenses.reduce((sum, exp) => exp.category === 'Payroll' ? sum + exp.amount : sum, 0), 
            paymentTotals: {} as PaymentsBreakdown,
        });

        // 4. Calculate Top Expenses
        const topExpenses = filteredExpenses
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 3);

        return { summary, filteredChartData, filteredExpenses, topExpenses, effectiveStartDate, effectiveEndDate };
    }, [todayDate]);

    // Data fetching effect
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                // Mock API delay
                await new Promise(resolve => setTimeout(resolve, 500));
                setData(MOCK_REPORTS_DATA);
            } catch (err) {
                setError("Failed to fetch reports data.");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Date Validation and Application
    useEffect(() => {
        if (startDate > endDate && userRole === 'admin') {
            setDateError("Start date cannot be after the end date.");
        } else {
            setDateError(null);
        }
    }, [startDate, endDate, userRole]);


    const handlePrint = useReactToPrint({ content: () => reportRef.current });

    const { summary, filteredChartData, filteredExpenses, topExpenses, effectiveStartDate, effectiveEndDate } = useMemo(() => 
        calculateReports(startDate, endDate, data, userRole), 
        [startDate, endDate, data, calculateReports, userRole]
    );

    if (loading) { return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#F3F4F6", padding: "32px" }}><p style={{ fontSize: "18px", fontWeight: 600, color: "#6B7280" }}>Loading...</p></div>; }
    if (error || !data || !summary) { return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#F3F4F6", padding: "32px" }}><p style={{ fontSize: "18px", fontWeight: 600, color: "#EF4444" }}>{error || "Failed to load data."}</p></div>; }

    const grossProfitMargin = summary.totalSales > 0 ? ((summary.totalProfit / summary.totalSales) * 100) : 0;
    // Net profit calculation uses gross profit minus payroll expenses from the filtered period
    const netProfit = summary.totalProfit - summary.totalPayroll; 
    const netProfitMargin = summary.totalSales > 0 ? ((netProfit / summary.totalSales) * 100) : 0;

    return (
        <div style={{ minHeight: "100vh", backgroundColor: "#F9FAFB", fontFamily: "Inter, system-ui, -apple-system, sans-serif" }}>
            
            {/* Navigation & Actions */}
            <nav style={{ borderBottom: "1px solid #E5E7EB", backgroundColor: "#FFFFFF", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)", padding: "16px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 10 }}>
                <Button variant="ghost" onClick={() => router.back()}>← Back to Dashboard</Button>
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", border: "1px solid #D1D5DB", borderRadius: "8px", padding: "4px 8px", backgroundColor: "#FFFFFF" }}>
                        <Users size={16} style={{ color: "#4B5563" }}/>
                        <select 
                            value={userRole} 
                            onChange={(e) => {
                                setUserRole(e.target.value as 'staff' | 'admin');
                                setDateError(null); // Clear error on role switch
                            }} 
                            style={{ border: "none", outline: "none", backgroundColor: "transparent", cursor: "pointer", fontSize: "14px" }}
                        >
                            <option value="admin">Admin View (Full Access)</option>
                            <option value="staff">Staff View (Today Only)</option>
                        </select>
                    </div>
                    <Button onClick={handlePrint} style={{ backgroundColor: "#059669" }}>
                        <Printer size={16} />
                        <span>Print/Export PDF</span>
                    </Button>
                </div>
            </nav>

            <main style={{ padding: "32px", maxWidth: "1400px", margin: "0 auto" }}>
                <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#111827", marginBottom: "24px" }}>
                    📊 Financial Reports - {userRole === 'staff' ? 'End of Day' : 'Historical Analysis'}
                </h1>

                {/* Date Range Selector (Only visible to Admins) */}
                {userRole === 'admin' && (
                    <Card style={{ marginBottom: "32px", padding: "24px" }}>
                        <div style={{ display: "flex", alignItems: "flex-end", gap: "16px", width: "100%", flexWrap: "wrap" }}>
                            <Calendar size={24} style={{ color: "#2563EB" }} />
                            <Input label="Start Date" type="date" value={startDate} onChange={(e: any) => setStartDate(e.target.value)} className="flex-1"/>
                            <span style={{ fontSize: "18px", fontWeight: 700, color: "#6B7280", marginBottom: "8px" }}>to</span>
                            <Input label="End Date" type="date" value={endDate} onChange={(e: any) => setEndDate(e.target.value)} className="flex-1"/>
                            {/* Button removed as filtering is automatic on state change, but keep the space if needed for a complex trigger */}
                        </div>
                        {dateError && (
                            <div style={{ marginTop: "16px", padding: "8px 16px", backgroundColor: "#FEF2F2", borderLeft: "4px solid #EF4444", color: "#B91C1C", display: "flex", alignItems: "center", gap: "8px", borderRadius: "4px" }}>
                                <AlertTriangle size={16}/>
                                <span style={{fontSize: "14px"}}>{dateError}</span>
                            </div>
                        )}
                    </Card>
                )}

                {/* Content Container for Printing */}
                <div ref={reportRef}>
                    <h2 style={{ fontSize: "24px", fontWeight: 700, marginBottom: "24px", color: "#374151" }}>
                        Report for {effectiveStartDate} {effectiveStartDate !== effectiveEndDate ? ` - ${effectiveEndDate}` : ''}
                    </h2>
                    
                    {/* Financial Summary Cards (Adjusted grid for better responsiveness) */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "24px", marginBottom: "32px" }}>
                        
                        {/* Total Sales Card */}
                        <Card style={{ borderLeft: "4px solid #2563EB" }}>
                            <CardHeader style={{ borderBottom: "none", paddingBottom: "0" }}>
                                <CardTitle style={{ fontSize: "14px", fontWeight: 500, color: "#6B7280", display: "flex", alignItems: "center" }}><TrendingUp size={16} style={{ marginRight: "8px", color: "#2563EB" }}/> **Total Sales**</CardTitle>
                            </CardHeader>
                            <CardContent style={{ paddingTop: "8px" }}>
                                <p style={{ fontSize: "36px", fontWeight: 800, color: "#111827" }}>{formatCurrency(summary.totalSales)}</p>
                            </CardContent>
                        </Card>
                        
                        {/* Total Expenses Card */}
                        <Card style={{ borderLeft: "4px solid #DC2626" }}>
                            <CardHeader style={{ borderBottom: "none", paddingBottom: "0" }}>
                                <CardTitle style={{ fontSize: "14px", fontWeight: 500, color: "#6B7280", display: "flex", alignItems: "center" }}><TrendingDown size={16} style={{ marginRight: "8px", color: "#DC2626" }}/> **Total Expenses**</CardTitle>
                            </CardHeader>
                            <CardContent style={{ paddingTop: "8px" }}>
                                <p style={{ fontSize: "36px", fontWeight: 800, color: "#111827" }}>{formatCurrency(summary.totalExpenses)}</p>
                            </CardContent>
                        </Card>
                        
                        {/* Gross Profit Card (based on Sales - Expenses in chart data) */}
                        <Card style={{ borderLeft: "4px solid #059669" }}>
                            <CardHeader style={{ borderBottom: "none", paddingBottom: "0" }}>
                                <CardTitle style={{ fontSize: "14px", fontWeight: 500, color: "#6B7280", display: "flex", alignItems: "center" }}><DollarSign size={16} style={{ marginRight: "8px", color: "#059669" }}/> **Gross Profit**</CardTitle>
                            </CardHeader>
                            <CardContent style={{ paddingTop: "8px" }}>
                                <p style={{ fontSize: "36px", fontWeight: 800, color: summary.totalProfit >= 0 ? '#059669' : '#DC2626' }}>{formatCurrency(summary.totalProfit)}</p>
                            </CardContent>
                        </Card>

                        {/* Gross Margin Card */}
                        <Card style={{ borderLeft: "4px solid #F59E0B" }}>
                            <CardHeader style={{ borderBottom: "none", paddingBottom: "0" }}>
                                <CardTitle style={{ fontSize: "14px", fontWeight: 500, color: "#6B7280", display: "flex", alignItems: "center" }}><Clock size={16} style={{ marginRight: "8px", color: "#F59E0B" }}/> **Gross Margin**</CardTitle>
                            </CardHeader>
                            <CardContent style={{ paddingTop: "8px" }}>
                                <p style={{ fontSize: "36px", fontWeight: 800, color: "#111827" }}>{formatPercentage(grossProfitMargin)}</p>
                            </CardContent>
                        </Card>

                        {/* Net Profit Card (Admin Only) */}
                        {userRole === 'admin' && (
                             <Card style={{ borderLeft: "4px solid #EC4899" }}>
                                 <CardHeader style={{ borderBottom: "none", paddingBottom: "0" }}>
                                     <CardTitle style={{ fontSize: "14px", fontWeight: 500, color: "#6B7280", display: "flex", alignItems: "center" }}><DollarSign size={16} style={{ marginRight: "8px", color: "#EC4899" }}/> **Net Profit**</CardTitle>
                                 </CardHeader>
                                 <CardContent style={{ paddingTop: "8px" }}>
                                     {/* Net Profit based on Gross Profit - Payroll (from filtered expenses) */}
                                     <p style={{ fontSize: "36px", fontWeight: 800, color: netProfit >= 0 ? '#059669' : '#DC2626' }}>{formatCurrency(netProfit)}</p>
                                 </CardContent>
                             </Card>
                        )}
                           {/* Net Margin Card (Admin Only) */}
                        {userRole === 'admin' && (
                             <Card style={{ borderLeft: "4px solid #7C3AED" }}>
                                 <CardHeader style={{ borderBottom: "none", paddingBottom: "0" }}>
                                     <CardTitle style={{ fontSize: "14px", fontWeight: 500, color: "#6B7280", display: "flex", alignItems: "center" }}><Clock size={16} style={{ marginRight: "8px", color: "#7C3AED" }}/> **Net Margin**</CardTitle>
                                 </CardHeader>
                                 <CardContent style={{ paddingTop: "8px" }}>
                                     <p style={{ fontSize: "36px", fontWeight: 800, color: "#111827" }}>{formatPercentage(netProfitMargin)}</p>
                                 </CardContent>
                             </Card>
                        )}
                    </div>

                    {/* Staff EOD: Cash Reconciliation (Placeholder UI) */}
                    {userRole === 'staff' && (
                        <Card style={{ marginBottom: "32px", border: "2px solid #3B82F6" }}>
                            <CardHeader>
                                <CardTitle style={{ fontSize: "18px", display: "flex", alignItems: "center" }}><Banknote size={20} style={{marginRight: "8px", color: "#3B82F6"}}/> **Daily Cash Reconciliation**</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p style={{ color: "#6B7280", fontStyle: "italic", fontSize: "14px" }}>System Cash Sales for Today: <strong style={{ color: "#111827" }}>{formatCurrency(summary.paymentTotals.cash)}</strong>. A real application would require staff to enter the physical cash count here to reconcile.</p>
                            </CardContent>
                        </Card>
                    )}


                    {/* Main Chart, Payment Breakdown, and Top Expenses */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "24px" }}>
                        
                        {/* Revenue Trend Chart */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Daily Financial Trend</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {dateError ? (
                                    <p style={{ padding: "32px 0", textAlign: "center", color: "#EF4444", fontSize: "14px", fontWeight: 700 }}>
                                        {dateError}
                                    </p>
                                ) : filteredChartData.length === 0 ? (
                                    <p style={{ padding: "32px 0", textAlign: "center", color: "#6B7280", fontSize: "14px", fontWeight: 400 }}>
                                        No daily data available for the selected range.
                                    </p>
                                ) : (
                                    <ResponsiveContainer width="100%" height={400}>
                                        {/* Now the ChartPlaceholder always displays if data is found and there's no date error. */}
                                        <ChartPlaceholder 
                                            title={`Daily Sales, Expenses, and Profit Trend (${filteredChartData.length} Days)`} 
                                            chartData={filteredChartData}
                                        />
                                        
                                        

[Image of a line chart showing sales, expenses, and profit trending over a week]


                                    </ResponsiveContainer>
                                )}
                            </CardContent>
                        </Card>
                        
                        {/* Sales by Payment Method & Top Expensive Payments */}
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px" }}>
                            <PaymentMethodBreakdown payments={summary.paymentTotals} totalSales={summary.totalSales} />
                            
                            {/* Top Expensive Payments */}
                            <Card>
                                <CardHeader>
                                    <CardTitle style={{ fontSize: "18px" }}>Top 3 Most Expensive Payments (Period)</CardTitle>
                                </CardHeader>
                                <CardContent style={{ gap: "12px", display: "flex", flexDirection: "column" }}>
                                    {topExpenses.length > 0 ? (
                                        <ul style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                                            {topExpenses.map((expense) => (
                                                <li key={expense.id} style={{ padding: "12px", backgroundColor: "#FEF2F2", borderLeft: "4px solid #F87171", borderRadius: "8px", boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)" }}>
                                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                                        <span style={{ fontWeight: 700, color: "#B91C1C", fontSize: "16px" }}>{formatCurrency(expense.amount)}</span>
                                                        <span style={{ fontSize: "12px", color: "#4B5563" }}>{expense.date}</span>
                                                    </div>
                                                    <p style={{ fontSize: "14px", color: "#111827", marginTop: "4px" }}>{expense.description}</p>
                                                    <span style={{ fontSize: "12px", fontWeight: 500, color: "#F87171", display: "inline-block", marginTop: "4px", padding: "2px 8px", backgroundColor: "#FEE2E2", borderRadius: "4px" }}>{expense.category}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p style={{ color: "#6B7280", fontStyle: "italic", fontSize: "14px", textAlign: "center", padding: "20px 0" }}>
                                            No expenses found for the selected period.
                                        </p>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Detailed Expenses Table (Admin Only) */}
                        {userRole === 'admin' && (
                            <Card style={{ marginTop: "24px" }}>
                                <CardHeader>
                                    <CardTitle>Detailed Expenses Ledger</CardTitle>
                                    <p style={{ fontSize: "14px", color: "#6B7280" }}>All non-sales transactions for the period, totaling: {formatCurrency(summary.totalExpenses)}</p>
                                </CardHeader>
                                <CardContent style={{ padding: 0 }}>
                                    {filteredExpenses.length > 0 ? (
                                        <div style={{ overflowX: "auto" }}>
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Date</TableHead>
                                                        <TableHead>Description</TableHead>
                                                        <TableHead>Category</TableHead>
                                                        <TableHead style={{ textAlign: "right" }}>Amount</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {filteredExpenses.map((expense) => (
                                                        <TableRow key={expense.id}>
                                                            <TableCell style={{ color: "#4B5563" }}>{expense.date}</TableCell>
                                                            <TableCell>{expense.description}</TableCell>
                                                            <TableCell>
                                                                <span style={{ 
                                                                    fontSize: "12px", 
                                                                    fontWeight: 500, 
                                                                    padding: "4px 8px", 
                                                                    borderRadius: "4px",
                                                                    backgroundColor: expense.category === 'Payroll' ? '#FEE2E2' : expense.category === 'Rent' ? '#EFF6FF' : '#F3F4F6',
                                                                    color: expense.category === 'Payroll' ? '#B91C1C' : expense.category === 'Rent' ? '#1D4ED8' : '#4B5563'
                                                                }}>
                                                                    {expense.category}
                                                                </span>
                                                            </TableCell>
                                                            <TableCell style={{ textAlign: "right", fontWeight: 600, color: "#DC2626" }}>{formatCurrency(expense.amount)}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    ) : (
                                        <p style={{ color: "#6B7280", fontStyle: "italic", fontSize: "14px", textAlign: "center", padding: "24px" }}>
                                            No detailed expenses recorded for this period.
                                        </p>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                    </div>
                </div>
            </main>
        </div>
    );
}