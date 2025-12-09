// C:\Users\HP\Videos\staff-tracker-main\src\pages\Admin\PaymentMethods.tsx
"use client";
import React, { FC, useEffect, useMemo, useState, CSSProperties, ChangeEvent } from "react";
import { 
    collection, 
    query, 
    onSnapshot, 
    orderBy, 
    DocumentData,
    QueryDocumentSnapshot,
} from 'firebase/firestore';
// ✅ Import DB instance from your firebase setup file
import { db } from '../../firebase'; 

// --- Icon Imports (Assuming lucide-react or similar) ---
import { 
    DollarSign, 
    CreditCard, 
    Send, 
    Landmark, 
    Download
} from 'lucide-react';

/** ---------------- CONSTANTS ---------------- */
const SALES_COLLECTION = "sales"; // Collection to get payment data from
const CUSTOMERS_COLLECTION = "customers"; // Collection to get customer names from

const PaymentMethodColors = {
    Cash: '#10b981',    
    POS: '#f59e0b',     
    Transfer: '#3b82f6',
    Check: '#8b5cf6',   
};

/** ---------------- Interfaces ---------------- */
export interface Customer {
    id: string; // Firestore Document ID
    name: string;
    currentBalance: number; // The running balance/debt of the customer
}

export interface Sale {
    _id: string;
    customer_id: string; 
    saleDate: string; 
    totalAmount: number;
    paidAmount: number;
    dueAmount: number;
    status: "Pending" | "Completed";
    paymentMethod: "Cash" | "POS" | "Transfer" | "Check"; // Crucial field
}

export interface CustomerPayment {
    id: string; // Sale ID / Invoice ID
    customerName: string;
    customer_id: string;
    date: string;
    method: "Cash" | "POS" | "Transfer" | "Check";
    amount: number;
    balance: number;
}

interface SummaryData {
    method: keyof typeof PaymentMethodColors;
    icon: React.ReactNode;
    totalAmount: number;
    color: string;
}

/** ---------------- Utility Functions (Styling & Formatting) ---------------- */
const formatCurrency = (n: number) => ` ৳ ${Number(n).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
const formatShortDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-US', {
    year: '2-digit', month: 'short', day: 'numeric'
});


/** ------------- Inline Components ------------- */
interface CardProps { children: React.ReactNode; style?: React.CSSProperties; }
const Card: FC<CardProps> = ({ children, style }) => (<div style={{borderRadius: 12, border: "1px solid #ccc", background: "#fff", padding: 16, boxShadow: "0 2px 6px rgba(0,0,0,0.08)", maxWidth: 1200, margin: "20px auto", ...style,}}>{children}</div>);
const CardHeader: FC<CardProps> = ({ children, style }) => (<div style={{ padding: 12, borderBottom: "1px solid #eee", ...style }}>{children}</div>);
const CardTitle: FC<CardProps> = ({ children, style }) => (<h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, ...style }}>{children}</h2>);
const CardContent: FC<CardProps> = ({ children, style }) => (<div style={{ padding: 12, ...style }}>{children}</div>);
const Button: FC<{ onClick?: (e?: any) => void; children: React.ReactNode; disabled?: boolean; style?: React.CSSProperties; type?: "button" | "submit" | "reset"; }> = ({ onClick, children, disabled, style, type = "button" }) => (<button type={type} onClick={onClick} disabled={disabled} style={{ padding: "8px 12px", borderRadius: 6, border: "none", background: disabled ? "#bdbdbd" : "#2563eb", color: "#fff", cursor: disabled ? "not-allowed" : "pointer", display: 'flex', alignItems: 'center', ...style, }}>{children}</button>);
const Input: FC<{ value: string; onChange: (e: ChangeEvent<HTMLInputElement>) => void; placeholder?: string; style?: CSSProperties; type?: string; readOnly?: boolean; }> = ({ value, onChange, placeholder, style, type = "text", readOnly = false }) => (<input value={value} onChange={onChange} placeholder={placeholder} type={type} readOnly={readOnly} style={{ padding: 8, borderRadius: 6, border: "1px solid #ccc", width: "100%", ...style, }} />);
const Table: FC<CardProps> = ({ children, style }) => (<table style={{ width: "100%", borderCollapse: "collapse", ...style }}>{children}</table>);
const TableRow: FC<CardProps & { style?: React.CSSProperties }> = ({ children, style }) => (<tr style={{ ...style }}>{children}</tr>);
const TableHeadCell: FC<{ children: React.ReactNode; onClick?: () => void; style?: React.CSSProperties }> = ({ children, onClick, style, }) => (<th onClick={onClick} style={{ padding: "10px 8px", border: "1px solid #cfcfcf", textAlign: "left", background: "#f5f7fb", cursor: onClick ? "pointer" : "default", userSelect: "none", ...style, }}>{children}</th>);
const TableCell: FC<{ children: React.ReactNode; colSpan?: number; style?: React.CSSProperties }> = ({ children, colSpan, style }) => (<td colSpan={colSpan} style={{ padding: "10px 8px", border: "1px solid #e5e7eb", ...style }}>{children}</td>);


const PaymentCard: FC<{ data: SummaryData; hideAmount: boolean }> = ({ data, hideAmount }) => (
    <div style={{ flex: 1, minWidth: '200px', padding: '16px', borderRadius: '12px', background: data.color, color: '#fff', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '14px', fontWeight: 600 }}>{data.method}</div>
            {data.icon}
        </div>
        <div style={{ fontSize: '28px', fontWeight: 800, marginTop: '8px' }}>
            {hideAmount ? '***' : formatCurrency(data.totalAmount)}
        </div>
        <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '4px' }}>Total Payments</div>
    </div>
);

const MockChart: FC<{ title: string; height: number }> = ({ title, height }) => (
    <div style={{ 
        height: height, 
        border: '1px dashed #ccc', 
        borderRadius: 8, 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        color: '#6b7280',
        fontSize: 14
    }}>
        {title} Placeholder
    </div>
);

/** ------------- Main Component ------------- */
export default function PaymentMethodsPage({
    currentUserRole = "Admin", // Default role
}: { currentUserRole?: "Admin" | "Staff"; }) {
    
    const [allSales, setAllSales] = useState<Sale[]>([]);
    const [allCustomers, setAllCustomers] = useState<Customer[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [searchTerm, setSearchTerm] = useState("");
    const [filterMethod, setFilterMethod] = useState<string>("All");
    const [sortField, setSortField] = useState<keyof CustomerPayment | null>("date");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    
    const isStaff = currentUserRole === "Staff";

    /** Firestore Real-time Listeners (onSnapshot) */
    useEffect(() => {
        // 1. Listen for Sales
        // Filter out sales where paidAmount is 0 if possible, but fetching all and filtering in-memory is safer
        const salesQuery = query(collection(db, SALES_COLLECTION), orderBy('saleDate', 'desc'));
        const unsubscribeSales = onSnapshot(salesQuery, (snapshot) => {
            const fetchedSales: Sale[] = snapshot.docs.map((doc) => ({
                _id: doc.id,
                // Ensure paymentMethod defaults if missing (important for older data)
                paymentMethod: (doc.data().paymentMethod || 'Cash') as Sale['paymentMethod'], 
                ...doc.data() as Omit<Sale, '_id' | 'paymentMethod'>,
            })).filter(sale => sale.paidAmount > 0); // Only process paid sales
            setAllSales(fetchedSales);
            setIsLoading(false);
        }, (error) => {
            console.error("Error listening to sales:", error);
            setIsLoading(false);
        });

        // 2. Listen for Customers
        // In a real app, this should only fetch necessary fields (id, name, currentBalance)
        const customersQuery = query(collection(db, CUSTOMERS_COLLECTION), orderBy('name'));
        const unsubscribeCustomers = onSnapshot(customersQuery, (snapshot) => {
            const fetchedCustomers: Customer[] = snapshot.docs.map((doc) => ({
                id: doc.id,
                name: doc.data().name || 'N/A',
                currentBalance: doc.data().currentBalance || 0 // Assuming this field tracks total debt
            }));
            setAllCustomers(fetchedCustomers);
        }, (error) => {
            console.error("Error listening to customers:", error);
        });

        return () => {
            unsubscribeSales();
            unsubscribeCustomers();
        };
    }, []);

    /** Data Processing: Payments Table Data & Summary */
    const { 
        paymentsData, 
        summary, 
        totalRevenue 
    } = useMemo(() => {
        const customerMap = new Map(allCustomers.map(c => [c.id, c]));
        
        const payments: CustomerPayment[] = [];
        let cashTotal = 0;
        let posTotal = 0;
        let transferTotal = 0;
        let checkTotal = 0;

        allSales.forEach(sale => {
            // Find the current balance for this customer
            const customer = customerMap.get(sale.customer_id);
            const customerBalance = customer?.currentBalance ?? 0;
            
            // Track totals
            switch (sale.paymentMethod) {
                case 'Cash': cashTotal += sale.paidAmount; break;
                case 'POS': posTotal += sale.paidAmount; break;
                case 'Transfer': transferTotal += sale.paidAmount; break;
                case 'Check': checkTotal += sale.paidAmount; break;
            }

            // Create the payment record for the table
            payments.push({
                id: sale._id,
                customerName: customer?.name || `Unknown Customer (${sale.customer_id.slice(0, 5)}...)`,
                customer_id: sale.customer_id,
                date: sale.saleDate,
                method: sale.paymentMethod,
                amount: sale.paidAmount,
                balance: customerBalance, 
            });
        });

        const totalRevenue = cashTotal + posTotal + transferTotal + checkTotal;

        const summaryData: SummaryData[] = [
            { method: 'Cash', icon: <DollarSign size={20} />, totalAmount: cashTotal, color: PaymentMethodColors.Cash },
            { method: 'POS', icon: <CreditCard size={20} />, totalAmount: posTotal, color: PaymentMethodColors.POS },
            { method: 'Transfer', icon: <Send size={20} />, totalAmount: transferTotal, color: PaymentMethodColors.Transfer },
            { method: 'Check', icon: <Landmark size={20} />, totalAmount: checkTotal, color: PaymentMethodColors.Check },
        ];

        return { paymentsData: payments, summary: summaryData, totalRevenue };

    }, [allSales, allCustomers]);


    /** Filtering, Sorting, and Pagination */
    const filteredPayments = useMemo(() => {
        let data = [...paymentsData];
        const s = searchTerm.trim().toLowerCase();

        // 1. Filtering
        if (s) {
            data = data.filter(p => 
                p.customerName.toLowerCase().includes(s) ||
                p.id.toLowerCase().includes(s)
            );
        }
        if (filterMethod !== "All") {
            data = data.filter(p => p.method === filterMethod);
        }

        // 2. Sorting
        if (sortField) {
            data.sort((a, b) => {
                const valA = a[sortField] ?? "";
                const valB = b[sortField] ?? "";
                if (sortField === 'date') {
                    // Treat dates/strings specially for consistent sorting
                    return sortOrder === 'asc' ? String(valA).localeCompare(String(valB)) : String(valB).localeCompare(String(valA));
                }
                if (typeof valA === "number" && typeof valB === "number") return sortOrder === "asc" ?
                    valA - valB : valB - valA;
                return sortOrder === "asc" ? String(valA).localeCompare(String(valB)) : String(valB).localeCompare(String(valA));
            });
        }
        return data;
    }, [paymentsData, searchTerm, filterMethod, sortField, sortOrder]);


    const totalPages = Math.max(1, Math.ceil(filteredPayments.length / itemsPerPage));
    const paginatedPayments = filteredPayments.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    /** Handlers */
    const handleSort = (field: keyof CustomerPayment) => {
        if (sortField === field) setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
        else {
            setSortField(field);
            setSortOrder("asc");
        }
    };
    
    const handleExport = () => {
        if (isStaff) {
            alert("Permission Denied: Staff roles cannot export payment data.");
            return;
        }
        // Admin export logic here
        alert(`Admin Exporting ${filteredPayments.length} records... (CSV/PDF logic needs to be implemented)`);
    };


    /** -------------- Render -------------- */
    return (
        <Card>
            <CardHeader style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <CardTitle>Customer Payment Dashboard ({currentUserRole})</CardTitle>
                <div style={{ fontSize: 13, color: "#666" }}>Real-time updates via **Firestore `onSnapshot`**</div>
            </CardHeader>
            <CardContent>
                <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                    
                    {/* Payment Summary Cards */}
                    <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: 'space-between' }}>
                        {summary.map(item => (
                            <PaymentCard key={item.method} data={item} hideAmount={isStaff} />
                        ))}
                        {/* Total Revenue Card */}
                        <div style={{ flex: 1, minWidth: '200px', padding: '16px', borderRadius: '12px', background: '#4f46e5', color: '#fff', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ fontSize: '14px', fontWeight: 600 }}>TOTAL REVENUE</div>
                                <DollarSign size={20} />
                            </div>
                            <div style={{ fontSize: '28px', fontWeight: 800, marginTop: '8px' }}>
                                {isStaff ? '***' : formatCurrency(totalRevenue)}
                            </div>
                            <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '4px' }}>All Payment Methods</div>
                        </div>
                    </div>
                    
                    {/* Charts Section */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24, marginTop: 12 }}>
                        <div style={{ height: 300 }}>
                            <MockChart title="Payments by Method (Bar Chart)" height={300} />
                        </div>
                        <div style={{ height: 300 }}>
                            <MockChart title="Payments Distribution (Pie Chart)" height={300} />
                        </div>
                    </div>

                    {/* Customer Payments Table */}
                    <h3 style={{ margin: '20px 0 10px 0', fontSize: 18, fontWeight: 700, borderBottom: '1px solid #eee', paddingBottom: 5 }}>Customer Payments History</h3>
                    
                    {/* Filters and Export */}
                    <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                        <div style={{ minWidth: 260, maxWidth: 400, width: "100%" }}>
                            <Input 
                                value={searchTerm} 
                                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} 
                                placeholder="Search customer or invoice ID..." 
                                style={{ flexGrow: 1 }}
                            />
                        </div>
                        <select 
                            value={filterMethod} 
                            onChange={(e) => { setFilterMethod(e.target.value); setCurrentPage(1); }}
                            style={{ padding: 8, borderRadius: 6, border: "1px solid #ccc", height: 36 }}
                        >
                            <option value="All">All Payment Methods</option>
                            {Object.keys(PaymentMethodColors).map(method => (
                                <option key={method} value={method}>{method}</option>
                            ))}
                        </select>
                        
                        {/* Role-Based Export Button */}
                        <Button 
                            onClick={handleExport} 
                            disabled={isStaff} 
                            style={{ marginLeft: "auto", background: isStaff ? "#bdbdbd" : "#059669" }}
                        >
                            <Download size={16} style={{ marginRight: 5 }} /> Export 
                        </Button>
                    </div>

                    {/* Table */}
                    <div style={{ border: "1px solid #d1d5db", borderRadius: 12, overflowX: "auto" }}>
                        <Table style={{ minWidth: 1000 }}>
                            <thead>
                                <TableRow>
                                    <TableHeadCell>#</TableHeadCell>
                                    <TableHeadCell onClick={() => handleSort("customerName")}>Customer Name</TableHeadCell>
                                    <TableHeadCell onClick={() => handleSort("date")}>Date of Sale</TableHeadCell>
                                    <TableHeadCell onClick={() => handleSort("id")}>Invoice / Sale ID</TableHeadCell>
                                    <TableHeadCell onClick={() => handleSort("method")}>Payment Method</TableHeadCell>
                                    <TableHeadCell onClick={() => handleSort("amount")}>Amount Paid</TableHeadCell>
                                    <TableHeadCell onClick={() => handleSort("balance")}>Balance (Debt)</TableHeadCell>
                                </TableRow>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={7} style={{ textAlign: "center", padding: 20 }}>Loading payment data...</TableCell>
                                    </TableRow>
                                ) : paginatedPayments.length ? (
                                    paginatedPayments.map((payment, idx) => {
                                        const customerDebt = allCustomers.find(c => c.id === payment.customer_id)?.currentBalance ?? 0;
                                        return (
                                            <TableRow key={payment.id}>
                                                <TableCell>{(currentPage - 1) * itemsPerPage + idx + 1}</TableCell>
                                                <TableCell>
                                                    {/* Optional: Link to customer details page */}
                                                    <a href={`/customers/${payment.customer_id}`} style={{ color: PaymentMethodColors.Transfer, textDecoration: 'none' }}>
                                                        {payment.customerName}
                                                    </a>
                                                </TableCell>
                                                <TableCell>{formatShortDate(payment.date)}</TableCell>
                                                <TableCell>{payment.id}</TableCell>
                                                <TableCell>
                                                    <span style={{ 
                                                        color: '#fff', 
                                                        background: PaymentMethodColors[payment.method],
                                                        padding: '3px 8px',
                                                        borderRadius: 4,
                                                        fontSize: 12,
                                                        fontWeight: 600
                                                    }}>{payment.method}</span>
                                                </TableCell>
                                                {/* Role-Based Access: Staff hides raw amounts */}
                                                <TableCell style={{ fontWeight: 600 }}>
                                                    {isStaff ? '***' : formatCurrency(payment.amount)}
                                                </TableCell>
                                                <TableCell>
                                                    <span style={{ 
                                                        color: customerDebt > 0 ? '#dc2626' : '#10b981', 
                                                        fontWeight: 600 
                                                    }}>
                                                        {formatCurrency(customerDebt)}
                                                    </span>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={7} style={{ textAlign: "center", padding: 20 }}>No payments found matching criteria.</TableCell>
                                    </TableRow>
                                )}
                            </tbody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 12 }}>
                        <Button disabled={currentPage === 1} onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}>Prev</Button>
                        <span style={{ alignSelf: "center" }}>{currentPage} / {totalPages}</span>
                        <Button disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}>Next</Button>
                    </div>

                </div>
            </CardContent>
        </Card>
    );
}