"use client";

import React, { useState, useEffect, FormEvent, ChangeEvent, useCallback, CSSProperties } from "react";
import { Trash2, Edit, Save, Users, User, X } from "lucide-react";

// --- Styling Constants ---
const PrimaryColor = '#3b82f6'; // Blue-600
const DestructiveColor = '#ef4444'; // Red-600
const OutlineBorderColor = '#e5e7eb'; // Gray-200
const HoverBgColor = '#f9fafb'; // Gray-50
const TextColor = '#111827'; // Gray-900
const MutedTextColor = '#6b7280'; // Gray-500
const BackgroundColor = '#f9fafb'; // Gray-50
const CardBg = '#fff';

// Status colors
const PaidBg = '#ecfdf5'; // Green-50
const PaidText = '#065f46'; // Green-800
const UnpaidBg = '#fef2f2'; // Red-50
const UnpaidText = '#991b1b'; // Red-800
const PendingBg = '#fffbeb'; // Yellow-50
const PendingText = '#854d0e'; // Yellow-800


// --- Mocking External Dependencies (Shadcn/UI and Next.js Router) ---

const useMockRouter = () => ({
    back: () => alert("Navigating back to the dashboard (mock action)."),
});

// Simple Button Component with inline styles
// FIX 1: Made onClick optional. FIX 2: Added optional size prop definition.
const Button: React.FC<React.PropsWithChildren<{ onClick?: () => void, style?: CSSProperties, variant?: 'destructive' | 'outline' | 'ghost' | 'default', disabled?: boolean, title?: string, type?: "button" | "submit" | "reset", size?: 'sm' | 'default' }>> = ({ children, onClick, style, variant = 'default', disabled = false, title = "", type = "button", size = 'default' }) => {
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
    
    if (size === 'sm') {
         baseStyle.padding = '0.25rem 0.5rem';
         baseStyle.fontSize = 12;
    }

    switch (variant) {
        case "outline":
            baseStyle = { ...baseStyle, border: '1px solid ' + OutlineBorderColor, backgroundColor: CardBg, color: MutedTextColor };
            break;
        case "ghost":
            baseStyle = { ...baseStyle, backgroundColor: 'transparent', color: MutedTextColor, boxShadow: 'none' };
            break;
        case "destructive":
            baseStyle = { ...baseStyle, backgroundColor: DestructiveColor, color: '#fff' };
            break;
        case "default":
        default:
            baseStyle = { ...baseStyle, backgroundColor: PrimaryColor, color: '#fff' };
            break;
    }

    return (
        <button
            // Only attach onClick if it exists (allows submit buttons without explicit handler)
            onClick={onClick ? onClick : undefined} 
            style={{ ...baseStyle, ...style }}
            disabled={disabled}
            title={title}
            type={type}
        >
            {children}
        </button>
    );
};

// Input Component (for visual consistency)
const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { className?: string }> = ({ value, onChange, placeholder, type = "text", style, disabled }) => (
    <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        style={{
            display: 'flex', height: 40, width: '100%', borderRadius: 8, border: '1px solid ' + OutlineBorderColor, 
            backgroundColor: CardBg, padding: '0px 12px', fontSize: 14, outline: 'none', 
            boxShadow: '0 0 0 1px transparent',
            opacity: disabled ? 0.5 : 1, cursor: disabled ? 'not-allowed' : 'auto',
            ...style
        }}
    />
);

// Card Components with inline styles
const Card: React.FC<React.PropsWithChildren<{ style?: CSSProperties }>> = ({ children, style }) => (
    <div style={{ borderRadius: 12, backgroundColor: CardBg, border: '1px solid ' + OutlineBorderColor, boxShadow: '0 4px 6px rgba(0,0,0,0.1)', ...style }}>{children}</div>
);
const CardHeader: React.FC<React.PropsWithChildren<{ style?: CSSProperties }>> = ({ children, style }) => (
    <div style={{ display: 'flex', flexDirection: 'column', padding: 24, borderBottom: '1px solid ' + OutlineBorderColor, ...style }}>{children}</div>
);
const CardTitle: React.FC<React.PropsWithChildren<{ style?: CSSProperties }>> = ({ children, style }) => (
    <h3 style={{ fontSize: 20, fontWeight: 600, lineHeight: 1.5, margin: 0, ...style }}>{children}</h3>
);
const CardContent: React.FC<React.PropsWithChildren<{ style?: CSSProperties }>> = ({ children, style }) => (
    <div style={{ padding: 24, paddingTop: 16, ...style }}>{children}</div>
);

// Table Components with inline styles
const Table: React.FC<React.PropsWithChildren<{}>> = ({ children }) => (
    <table style={{ width: '100%', captionSide: 'bottom', fontSize: 14 }}>{children}</table>
);
const TableHeader: React.FC<React.PropsWithChildren<{}>> = ({ children }) => (
    <thead style={{ borderBottom: '1px solid ' + OutlineBorderColor }}>{children}</thead>
);
const TableBody: React.FC<React.PropsWithChildren<{}>> = ({ children }) => (
    <tbody style={{}}>
        {children}
    </tbody>
);
const TableRow: React.FC<React.PropsWithChildren<{ style?: CSSProperties }>> = ({ children, style }) => (
    <tr style={{ borderBottom: '1px solid ' + OutlineBorderColor, transitionProperty: 'background-color', ...style }}>{children}</tr>
);
const TableHead: React.FC<React.PropsWithChildren<{ style?: CSSProperties }>> = ({ children, style }) => (
    <th style={{ height: 48, padding: '0 16px', textAlign: 'left', verticalAlign: 'middle', fontWeight: 500, color: MutedTextColor, ...style }}>{children}</th>
);
const TableCell: React.FC<React.PropsWithChildren<{ style?: CSSProperties }>> = ({ children, style }) => (
    <td style={{ padding: 16, verticalAlign: 'middle', ...style }}>{children}</td>
);

// Alert Component with inline styles
const Alert: React.FC<React.PropsWithChildren<{ variant?: "destructive" }>> = ({ children, variant }) => {
    let style: CSSProperties = {
        border: '1px solid', padding: 16, borderRadius: 8, display: 'flex', alignItems: 'flex-start', gap: 12
    };
    let icon = null;
    
    if (variant === "destructive") {
        style = { ...style, borderColor: '#f87171', backgroundColor: '#fef2f2', color: '#b91c1c' };
        icon = <X style={{ height: 16, width: 16, marginTop: 4 }} />;
    } else {
        style = { ...style, borderColor: OutlineBorderColor, backgroundColor: HoverBgColor, color: TextColor };
    }

    return <div style={style}>{icon}{children}</div>;
};

const AlertDescription: React.FC<React.PropsWithChildren<{}>> = ({ children }) => <p style={{ fontSize: 14, margin: 0 }}>{children}</p>;


// ------------------- TYPES -------------------

interface CurrentUser {
    id: number;
    role: "admin" | "staff";
    name: string;
}

interface PayrollRecord {
    id: number;
    staff_id: string;
    month: string;
    salary_amount: number;
    payment_date: string;
    payment_method: "bank_transfer" | "cash" | "cheque";
    status: "paid" | "unpaid" | "pending";
}

type NewPayroll = Omit<PayrollRecord, "id" | "status">;


// ------------------- MOCK DATA & PERSISTENCE -------------------
// ... (Persistence logic remains the same as previous versions) ...
const initialMockPayroll: PayrollRecord[] = [
    { id: 1, staff_id: "S-1001", month: "2024-10", salary_amount: 150000, payment_date: "2024-10-30", payment_method: "bank_transfer", status: "paid" },
    { id: 2, staff_id: "S-1002", month: "2024-10", salary_amount: 95000, payment_date: "2024-10-30", payment_method: "cash", status: "paid" },
    { id: 3, staff_id: "S-1003", month: "2024-11", salary_amount: 180000, payment_date: "", payment_method: "bank_transfer", status: "pending" },
    { id: 4, staff_id: "S-1004", month: "2024-11", salary_amount: 70000, payment_date: "", payment_method: "cheque", status: "unpaid" },
];

const STORAGE_KEY = "mockPayrollData";
const USER_KEY = "currentUser";

const getPayrollFromStorage = (): PayrollRecord[] => {
    if (typeof window !== "undefined") {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : initialMockPayroll;
    }
    return initialMockPayroll;
};

const savePayrollToStorage = (data: PayrollRecord[]) => {
    if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
};

const getRoleFromStorage = (): CurrentUser => {
    if (typeof window !== "undefined") {
        const stored = localStorage.getItem(USER_KEY);
        if (stored) return JSON.parse(stored);
    }
    return { id: 1, role: "admin", name: "Admin" }; 
}


// ------------------- MAIN COMPONENT -------------------

export default function PayrollPage() {
    const router = useMockRouter();
    const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
    const [payroll, setPayroll] = useState<PayrollRecord[]>([]);
    const [loading, setLoading] = useState(false);
    const [newPayroll, setNewPayroll] = useState<NewPayroll>({
        staff_id: "",
        month: "",
        salary_amount: 0,
        payment_date: "",
        payment_method: "bank_transfer",
    });
    const [error, setError] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<number | null>(null);

    const isAdmin = currentUser?.role === "admin";
    const isStaff = currentUser?.role === "staff";

    // ------------------- AUTH & ROLE MANAGEMENT -------------------
    // ... (Auth logic remains the same) ...

    const setRole = useCallback((role: "admin" | "staff") => {
        const mockUser: CurrentUser = role === "admin"
            ? { id: 1, role: "admin", name: "Admin Manager" }
            : { id: 2, role: "staff", name: "Staff Viewer" };
        
        localStorage.setItem(USER_KEY, JSON.stringify(mockUser));
        setCurrentUser(mockUser);
        setError(null);
    }, []);

    useEffect(() => {
        setCurrentUser(getRoleFromStorage());
        fetchPayroll();
    }, [setRole]);

    const handleToggleRole = () => {
        const newRole = isAdmin ? "staff" : "admin";
        setRole(newRole);
        setEditingId(null); 
    };

    // ------------------- DATA OPERATIONS -------------------
    // ... (Data operations remain the same) ...

    const fetchPayroll = () => {
        setLoading(true);
        setError(null);
        try {
            setTimeout(() => {
                const data = getPayrollFromStorage();
                setPayroll(data);
                setLoading(false);
            }, 300);
        } catch (err: any) {
            setError(err.message || "Failed to fetch payroll data");
            setLoading(false);
        }
    };

    const handleFormChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setNewPayroll(prev => ({
            ...prev,
            [name]: name === 'salary_amount' ? Number(value) : value,
        }));
    };

    const handleAddPayroll = (e: FormEvent) => {
        e.preventDefault();
        if (!isAdmin) {
            setError("Permission denied. Only admins can add payroll records.");
            return;
        }
        if (!newPayroll.staff_id || !newPayroll.month || newPayroll.salary_amount <= 0) {
            setError("Please fill in all required fields.");
            return;
        }

        const recordToAdd: PayrollRecord = {
            ...newPayroll,
            id: Date.now(), 
            status: "unpaid",
        };

        const updatedPayroll = [...payroll, recordToAdd];
        savePayrollToStorage(updatedPayroll);
        setPayroll(updatedPayroll);
        setNewPayroll({ staff_id: "", month: "", salary_amount: 0, payment_date: "", payment_method: "bank_transfer" });
        setError(null);
    };

    const handleSaveItem = async (item: PayrollRecord) => {
        // This function definition was missing from the scope where the error occurred
        handleUpdateRecord(item.id, item); 
    }

    const handleUpdateRecord = (id: number, updates: Partial<PayrollRecord>) => {
        if (!isAdmin) {
            setError("Permission denied. Only admins can update payroll records.");
            return;
        }
        const updatedPayroll = payroll.map(record =>
            record.id === id ? { ...record, ...updates } : record
        );
        savePayrollToStorage(updatedPayroll);
        setPayroll(updatedPayroll);
        setEditingId(null);
        setError(null);
    };

    const handleDeleteRecord = (id: number) => {
        if (!isAdmin) {
            setError("Permission denied. Only admins can delete payroll records.");
            return;
        }
        if (!window.confirm("Are you sure you want to delete this payroll record?")) return;

        const updatedPayroll = payroll.filter(record => record.id !== id);
        savePayrollToStorage(updatedPayroll);
        setPayroll(updatedPayroll);
        setError(null);
    };

    const handleMarkAsPaid = (record: PayrollRecord) => {
        if (!isAdmin) {
            setError("Permission denied. Only admins can update payment status.");
            return;
        }
        if (record.status === "paid") return;

        handleUpdateRecord(record.id, { 
            status: "paid", 
            payment_date: new Date().toISOString().split('T')[0] // Get YYYY-MM-DD string
        });
    };
    
    // Helper function to render table cells conditionally based on edit state
    const renderCell = (record: PayrollRecord, field: keyof PayrollRecord) => {
        const isEditing = editingId === record.id;
        const isDisabled = isStaff || (field === 'status' || field === 'payment_date');

        if (!isEditing) {
            if (field === 'salary_amount') return `₦${record.salary_amount.toLocaleString()}`;
            if (field === 'payment_date' && !record.payment_date) return 'N/A';
            return record[field];
        }

        if (field === 'payment_method') {
             return (
                <select
                    name={field}
                    value={record[field]}
                    onChange={(e) => handleUpdateRecord(record.id, { [field]: e.target.value as PayrollRecord['payment_method'] })}
                    disabled={isDisabled}
                    style={{ height: 40, width: '100%', borderRadius: 8, border: '1px solid ' + OutlineBorderColor, backgroundColor: CardBg, padding: '0px 12px', fontSize: 14, opacity: isDisabled ? 0.5 : 1, cursor: isDisabled ? 'not-allowed' : 'auto' }}
                >
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="cash">Cash</option>
                    <option value="cheque">Cheque</option>
                </select>
             );
        }

        // For inputs, use the mock Input component
        return (
            <Input
                type={field === 'salary_amount' ? 'number' : field === 'payment_date' ? 'date' : 'text'}
                value={record[field]}
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                    const value = field === 'salary_amount' ? Number(e.target.value) : e.target.value;
                    handleUpdateRecord(record.id, { [field]: value });
                }}
                disabled={isDisabled}
            />
        );
    };


    if (!currentUser || loading) {
        return <div style={{ padding: 32, textAlign: 'center', fontSize: 18 }}>Loading payroll dashboard...</div>;
    }

    return (
        <div style={{ padding: 16, maxWidth: 1400, margin: '0 auto', backgroundColor: BackgroundColor, minHeight: '100vh', fontFamily: 'sans-serif' }}>
            <div style={{ maxWidth: 1400, margin: '0 auto' }}>
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                    <h1 style={{ fontSize: 36, fontWeight: 800, color: TextColor, margin: 0 }}>Payroll Management</h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <Button onClick={() => router.back()} variant="outline">
                            ← Back
                        </Button>
                        <Button onClick={handleToggleRole} variant="outline" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            {isAdmin ? <User style={{ height: 16, width: 16 }} /> : <Users style={{ height: 16, width: 16 }} />}
                            <span>Switch Role ({isAdmin ? "Admin" : "Staff"})</span>
                        </Button>
                    </div>
                </header>

                {error && (
                    <div style={{ marginBottom: 24 }}>
                        <Alert variant="destructive">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: isAdmin ? '1fr 2fr' : '1fr', gap: 32 }}>
                    {/* Add Payroll Record Card (Admin Only) */}
                    {isAdmin && (
                        <Card style={{ height: 'fit-content' }}>
                            <CardHeader>
                                <CardTitle>Add New Payroll Record</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleAddPayroll} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                    <Input
                                        placeholder="Staff ID (e.g., S-1001)"
                                        name="staff_id"
                                        value={newPayroll.staff_id}
                                        onChange={handleFormChange}
                                    />
                                    <Input
                                        placeholder="Month (YYYY-MM)"
                                        type="month"
                                        name="month"
                                        value={newPayroll.month}
                                        onChange={handleFormChange}
                                    />
                                    <Input
                                        placeholder="Salary Amount (₦)"
                                        type="number"
                                        name="salary_amount"
                                        value={newPayroll.salary_amount}
                                        onChange={handleFormChange}
                                        min="0"
                                    />
                                    <select
                                        name="payment_method"
                                        value={newPayroll.payment_method}
                                        onChange={handleFormChange}
                                        style={{ height: 40, width: '100%', borderRadius: 8, border: '1px solid ' + OutlineBorderColor, backgroundColor: CardBg, padding: '0px 12px', fontSize: 14, outline: 'none' }}
                                    >
                                        <option value="bank_transfer">Bank Transfer</option>
                                        <option value="cash">Cash</option>
                                        <option value="cheque">Cheque</option>
                                    </select>
                                    {/* FIX 1 applied here: Button handles submit event without needing an onClick prop */}
                                    <Button type="submit" style={{ width: '100%' }}>
                                        Add Record
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    )}

                    {/* Payroll Table Card */}
                    <Card style={{ gridColumn: isAdmin ? 'span 2' : 'span 3' }}>
                        <CardHeader>
                            <CardTitle>Payroll History</CardTitle>
                        </CardHeader>
                        <CardContent style={{ padding: 0, overflowX: 'auto' }}>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Staff ID</TableHead>
                                        <TableHead>Month</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead>Method</TableHead>
                                        <TableHead>Date Paid</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead style={{textAlign: 'right'}}>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {payroll.map((record) => (
                                        <TableRow 
                                            key={record.id} 
                                            style={{ 
                                                backgroundColor: record.status === 'paid' ? PaidBg : record.status === 'unpaid' ? UnpaidBg : PendingBg
                                            }}
                                        >
                                            <TableCell>{renderCell(record, 'staff_id')}</TableCell>
                                            <TableCell>{renderCell(record, 'month')}</TableCell>
                                            <TableCell>{renderCell(record, 'salary_amount')}</TableCell>
                                            <TableCell>{renderCell(record, 'payment_method')}</TableCell>
                                            <TableCell>{renderCell(record, 'payment_date')}</TableCell>
                                            <TableCell>
                                                <span style={{ 
                                                    padding: '4px 12px', 
                                                    display: 'inline-flex', 
                                                    fontSize: 12, 
                                                    lineHeight: 1.25, 
                                                    fontWeight: 600, 
                                                    borderRadius: 9999,
                                                    backgroundColor: record.status === 'paid' ? PaidBg : record.status === 'unpaid' ? UnpaidBg : PendingBg,
                                                    color: record.status === 'paid' ? PaidText : record.status === 'unpaid' ? UnpaidText : PendingText,
                                                }}>
                                                    {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                                                </span>
                                            </TableCell>
                                            <TableCell style={{ textAlign: 'right' }}>
                                                {isAdmin ? (
                                                    editingId === record.id ? (
                                                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                                                            {/* FIX 2 Applied: size prop is now valid */}
                                                            <Button size="sm" onClick={() => handleSaveItem(record)}>
                                                                <Save style={{ height: 16, width: 16, marginRight: 4 }} /> Save
                                                            </Button>
                                                            {/* FIX 2 Applied: size prop is now valid */}
                                                            <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                                                                <X style={{ height: 16, width: 16, marginRight: 4 }} /> Cancel
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                                                            {record.status !== 'paid' && (
                                                                // FIX 2 Applied: size prop is now valid
                                                                <Button size="sm" onClick={() => handleMarkAsPaid(record)} variant="default">
                                                                    Mark Paid
                                                                </Button>
                                                            )}
                                                            {/* FIX 2 Applied: size prop is now valid */}
                                                            <Button size="sm" variant="outline" onClick={() => setEditingId(record.id)}>
                                                                <Edit style={{ height: 16, width: 16 }} />
                                                            </Button>
                                                            {/* FIX 2 Applied: size prop is now valid */}
                                                            <Button size="sm" variant="destructive" onClick={() => handleDeleteRecord(record.id)}>
                                                                <Trash2 style={{ height: 16, width: 16 }} />
                                                            </Button>
                                                        </div>
                                                    )
                                                ) : (
                                                    <span style={{ fontSize: 12, color: MutedTextColor }}>View Only (Staff)</span>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
