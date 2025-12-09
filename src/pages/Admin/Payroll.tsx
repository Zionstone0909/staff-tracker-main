// src/pages/Admin/Payroll.tsx
// All styles, types, and utility functions are derived from CompanyExpenses.tsx for consistency

"use client";
import { useState, useEffect, useCallback, FormEvent, ChangeEvent, PropsWithChildren, CSSProperties, useMemo } from "react";
import { Trash2, Edit, Save, Plus } from 'lucide-react'; 

// --- Shared Style Constants & Utilities (Copied from CompanyExpenses.tsx) ---
const PrimaryColor = '#0B3D91';
const DestructiveColor = '#dc2626';
const MutedColor = '#6b7280';
const LightBg = '#f3f4f6';
const OutlineBorderColor = '#e5e7eb';
const MutedTextColor = '#6b7280';

const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(amount);

// --- UI Components (Corrected to support 'size' prop on Button and 'style' prop on TableRow) ---

// FIX 1: Added 'size' to the Button props interface and logic to handle the 'sm' size.
const Button: React.FC<PropsWithChildren & React.ButtonHTMLAttributes<HTMLButtonElement> & { 
    variant?: 'default' | 'ghost' | 'destructive' | 'icon' | 'outline'; 
    size?: 'default' | 'sm'; // Added 'size' prop
}> = ({ children, onClick, style, disabled, type = 'button', variant = 'default', size = 'default', ...props }) => {
    let backgroundColor = PrimaryColor;
    let color = 'white';
    let border = '1px solid transparent';
    let padding = '0.5rem 1rem';
    let height = 'auto';

    if (variant === 'ghost') {
        backgroundColor = 'transparent';
        color = PrimaryColor;
        border = 'none';
    } else if (variant === 'destructive') {
        backgroundColor = DestructiveColor;
    } else if (variant === 'icon') {
        backgroundColor = 'transparent';
        color = MutedColor;
        padding = '0.2rem';
        border = 'none';
    } else if (variant === 'outline') {
        backgroundColor = 'transparent';
        color = PrimaryColor;
        border = `1px solid ${PrimaryColor}`;
    }
    
    if (size === 'sm') { // Logic for the 'sm' size
        padding = '0.3rem 0.6rem';
        height = '32px';
    }

    const baseStyle: CSSProperties = {
        padding,
        height,
        cursor: disabled ? 'not-allowed' : 'pointer',
        backgroundColor: disabled ? '#ccc' : backgroundColor,
        color: color,
        border: border,
        borderRadius: '4px',
        fontWeight: '500',
        transition: 'background-color 0.2s, opacity 0.2s',
        opacity: disabled ? 0.6 : 1,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        whiteSpace: 'nowrap',
        ...style
    };
    return (<button onClick={onClick} style={baseStyle} disabled={disabled} type={type} {...props} >{children}</button>);
};

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
    <input {...props} style={{ padding: '0.6rem 0.8rem', border: '1px solid #ccc', borderRadius: '4px', width: '100%', boxSizing: 'border-box', height: 40 }} />
);

const Card: React.FC<PropsWithChildren & { style?: CSSProperties }> = ({ children, style }) => 
    <div style={{ border: '1px solid ' + OutlineBorderColor, borderRadius: '8px', padding: '1.5rem', marginBottom: '1.5rem', backgroundColor: '#fff', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)', ...style }}>{children}</div>;

const CardHeader: React.FC<PropsWithChildren> = ({ children }) => <div>{children}</div>;
const CardTitle: React.FC<PropsWithChildren & { style?: CSSProperties }> = ({ children, style }) => 
    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem', ...style }}>{children}</h2>;
const CardContent: React.FC<PropsWithChildren & { style?: CSSProperties }> = ({ children, style }) => 
    <div style={{ paddingTop: '0.5rem', ...style }}>{children}</div>;

// Alert component copied from expenses.tsx
const Alert: React.FC<PropsWithChildren & { variant?: 'default' | 'destructive', customStyle?: CSSProperties }> = ({ children, variant, customStyle }) => {
    let bgColor = '#e0f7fa';
    let borderColor = '#00bcd4';
    let textColor = '#006064';
    if (variant === 'destructive') {
        bgColor = '#f8d7da';
        borderColor = '#f5c6cb';
        textColor = '#721c24';
    } else if (variant === 'default') {
        bgColor = '#d4edda';
        borderColor = '#c3e6cb';
        textColor = '#155724';
    }
    return (
        <div style={{ padding: '1rem', backgroundColor: bgColor, border: `1px solid ${borderColor}`, color: textColor, borderRadius: '4px', marginBottom: '1rem', ...customStyle }}>
            {children}
        </div>
    );
};
const AlertDescription: React.FC<PropsWithChildren> = ({ children }) => <p style={{ margin: 0 }}>{children}</p>;

// Table Components using styles from CompanyExpenses.tsx
const Table: React.FC<PropsWithChildren & { style?: CSSProperties }> = ({ children, style }) => <table style={{ width: '100%', borderCollapse: 'collapse', ...style }}>{children}</table>;
const TableHeader: React.FC<PropsWithChildren> = ({ children }) => <thead>{children}</thead>;
const TableBody: React.FC<PropsWithChildren> = ({ children }) => <tbody>{children}</tbody>;
// FIX 2: Added 'style' prop to the TableRow definition
const TableRow: React.FC<PropsWithChildren & { style?: CSSProperties }> = ({ children, style }) => <tr style={{ borderBottom: '1px solid #eee', ...style }}>{children}</tr>;
const TableHead: React.FC<PropsWithChildren & { style?: CSSProperties }> = ({ children, style }) => (
    <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 'bold', borderBottom: '2px solid #ccc', ...style }}>{children}</th>
);
const TableCell: React.FC<PropsWithChildren & { colSpan?: number, style?: CSSProperties }> = ({ children, style, colSpan }) => <td colSpan={colSpan} style={{ padding: '0.75rem', verticalAlign: 'middle', ...style }}>{children}</td>;


// --- DATA TYPES AND MOCK DATA ---
interface PayrollRecord {
    id: number;
    staff_id: string; // Staff ID or Name
    month: string;
    salary_amount: number;
    payment_date: string; // Editable date
    payment_method: "bank_transfer" | "cash" | "cheque"; // Editable method
    status: "paid" | "unpaid" | "pending";
}
type NewPayroll = Omit<PayrollRecord, "id" | "status">;

// Expense interface from CompanyExpenses.tsx
interface Expense {
    id: number
    category: string
    description: string
    amount: number
    expense_date: string
    payment_method: "cash" | "transfer" | "check"
}

// Initial data for demonstration and persistence setup
const initialMockPayroll: PayrollRecord[] = [
    { id: 1, staff_id: "S-1001 (John Doe)", month: "2024-10", salary_amount: 150000, payment_date: "2024-10-30", payment_method: "bank_transfer", status: "paid" },
    { id: 2, staff_id: "S-1002 (Jane Smith)", month: "2024-10", salary_amount: 95000, payment_date: "2024-10-30", payment_method: "cash", status: "paid" },
    { id: 3, staff_id: "S-1003 (Mark Lee)", month: "2024-11", salary_amount: 180000, payment_date: "", payment_method: "bank_transfer", status: "pending" },
    { id: 4, staff_id: "S-1004 (Lisa Chen)", month: "2024-11", salary_amount: 70000, payment_date: "", payment_method: "cheque", status: "unpaid" },
];

const PAYROLL_STORAGE_KEY = "mockPayrollData"; 
const EXPENSE_STORAGE_KEY = "companyExpenses"; // Key used by expenses.tsx

// ------------------- STORAGE & EXPENSE REFLECTION LOGIC -------------------

const getPayrollFromStorage = (): PayrollRecord[] => { 
    if (typeof window !== "undefined") {
        const stored = localStorage.getItem(PAYROLL_STORAGE_KEY);
        if (stored) {
            try { return JSON.parse(stored); } catch (e) { return initialMockPayroll; }
        }
    }
    return initialMockPayroll; 
};
const savePayrollToStorage = (data: PayrollRecord[]) => { 
    if (typeof window !== "undefined") { localStorage.setItem(PAYROLL_STORAGE_KEY, JSON.stringify(data)); } 
};

const getExpensesFromStorage = (): Expense[] => {
    if (typeof window !== "undefined") {
        const stored = localStorage.getItem(EXPENSE_STORAGE_KEY);
        if (stored) {
            try {
                return JSON.parse(stored);
            } catch (e) {
                return [];
            }
        }
    }
    return [];
};

const saveExpensesToStorage = (data: Expense[]) => {
    if (typeof window !== "undefined") {
        localStorage.setItem(EXPENSE_STORAGE_KEY, JSON.stringify(data));
    }
};

/**
 * Records a payroll payment as a "Salaries" expense in the expenses.tsx data structure.
 * This fulfills the requirement: "when payroll is added, it should reflect on expenses.tsx history table."
 * @param record The paid PayrollRecord.
 */
const recordSalaryAsExpense = (record: PayrollRecord) => {
    const expenses = getExpensesFromStorage();
    const nextId = expenses.length ? Math.max(...expenses.map(e => e.id)) + 1 : 1;
    
    // Map payroll payment method to expense payment method
    const expensePaymentMethod: Expense["payment_method"] = 
        record.payment_method === 'bank_transfer' ? 'transfer' : 
        (record.payment_method === 'cheque' ? 'check' : 'cash');
    
    const expenseDescriptionCheck = `Salary payment for ${record.staff_id} (${record.month})`;
    
    const newExpense: Expense = {
        id: nextId, 
        category: "Salaries",
        description: expenseDescriptionCheck,
        amount: record.salary_amount,
        expense_date: record.payment_date || new Date().toISOString().split('T')[0],
        payment_method: expensePaymentMethod,
    };
    
    // Check if an existing expense for this salary month/staff exists to prevent duplicates
    const existingExpenseIndex = expenses.findIndex(e => 
        e.category === "Salaries" && e.description === expenseDescriptionCheck
    );

    let updatedExpenses: Expense[];

    if (existingExpenseIndex !== -1) {
        // Update the existing expense record, keeping its original ID
        updatedExpenses = expenses.map((e, index) => 
            index === existingExpenseIndex ? { ...newExpense, id: e.id } : e
        );
    } else {
        // Add a new expense record with the calculated next ID
        updatedExpenses = [...expenses, { ...newExpense, id: nextId }];
    }

    saveExpensesToStorage(updatedExpenses);
};


// ------------------- MAIN COMPONENT -------------------

export default function PayrollPage() {
    const [payroll, setPayroll] = useState<PayrollRecord[]>([]);
    const [loading, setLoading] = useState(false);
    const [newPayroll, setNewPayroll] = useState<NewPayroll>({
        staff_id: "",
        month: new Date().toISOString().slice(0, 7), // YYYY-MM
        salary_amount: 0,
        payment_date: "",
        payment_method: "bank_transfer",
    });
    const [error, setError] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editingRecord, setEditingRecord] = useState<PayrollRecord | null>(null);
    
    const isAdmin = true; // Mock Admin role

    const fetchPayroll = useCallback(() => {
        setLoading(true);
        setError(null);
        try {
            setTimeout(() => {
                const data = getPayrollFromStorage();
                setPayroll(data);
                setLoading(false);
            }, 500);
        } catch (e) {
            setError("Failed to fetch payroll data.");
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        // Initialize payroll from storage
        fetchPayroll();
    }, [fetchPayroll]);

    // Handle form input changes for new record
    const handleNewChange = (field: keyof NewPayroll, value: any) => {
        setNewPayroll(prev => ({ ...prev, [field]: value }));
    };

    // Handle form input changes for editing record
    const handleEditChange = (field: keyof PayrollRecord, value: any) => {
        setEditingRecord(prev => prev ? ({ ...prev, [field]: value }) : null);
    };

    // Add new payroll record
    const handleAddPayroll = (e: FormEvent) => {
        e.preventDefault();
        if (!newPayroll.staff_id || !newPayroll.month || newPayroll.salary_amount <= 0) {
            setError("Please ensure Staff ID/Name, Month, and a positive Salary Amount are filled.");
            return;
        }
        
        const recordToAdd: PayrollRecord = {
            ...newPayroll,
            id: Date.now(), 
            status: "unpaid", // Newly added records start as unpaid
        };
        
        const updatedPayroll = [...payroll, recordToAdd];
        savePayrollToStorage(updatedPayroll);
        setPayroll(updatedPayroll);
        setNewPayroll({ staff_id: "", month: new Date().toISOString().slice(0, 7), salary_amount: 0, payment_date: "", payment_method: "bank_transfer" });
        setError(null);
    };

    // Save edited item (end edit mode)
    const handleSaveItem = () => {
        if (!editingRecord) return;
        
        if (!editingRecord.staff_id || !editingRecord.month || editingRecord.salary_amount <= 0) {
            setError("Please ensure Staff ID/Name, Month, and a positive Salary Amount are filled.");
            return;
        }

        const oldRecord = payroll.find(r => r.id === editingRecord.id);

        const updatedPayroll = payroll.map(record =>
            record.id === editingId ? editingRecord : record
        );

        // --- EXPENSE REFLECTION LOGIC ---
        // Trigger expense recording if status changed TO 'paid' 
        if (editingRecord.status === 'paid' && oldRecord?.status !== 'paid') {
            recordSalaryAsExpense(editingRecord);
        }
        // --- END EXPENSE REFLECTION LOGIC ---
        
        savePayrollToStorage(updatedPayroll);
        setPayroll(updatedPayroll);
        setEditingId(null);
        setEditingRecord(null);
        setError(null);
    };

    const handleStartEdit = (record: PayrollRecord) => {
        setEditingId(record.id);
        setEditingRecord(record);
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditingRecord(null);
    }

    const handleDeleteRecord = (id: number) => {
        if (!window.confirm("Are you sure you want to delete this payroll record?")) return;
        const updatedPayroll = payroll.filter(record => record.id !== id);
        savePayrollToStorage(updatedPayroll);
        setPayroll(updatedPayroll);
    };

    // Helper to render the cell content (for table editing)
    const renderCellContent = (record: PayrollRecord, field: keyof PayrollRecord) => {
        const isCurrentlyEditing = editingId === record.id;
        const currentEditValue = editingRecord ? editingRecord[field] : record[field];
        // Allow editing for these specific fields
        const isEditableField = ['payment_date', 'payment_method', 'status', 'staff_id', 'salary_amount', 'month'].includes(field);
        
        if (!isCurrentlyEditing || !isEditableField) {
            if (field === 'salary_amount') return formatCurrency(record.salary_amount);
            if (field === 'payment_date' && !record.payment_date) return 'N/A';
            if (field === 'payment_method') return record[field].replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
            if (field === 'status') {
                let color = MutedColor;
                if (record.status === 'paid') color = '#10b981'; // green
                else if (record.status === 'unpaid') color = DestructiveColor;
                else if (record.status === 'pending') color = '#f59e0b'; // amber
                return <span style={{ fontWeight: 'bold', color }}>{record.status.toUpperCase()}</span>;
            }
            return String(record[field]);
        }
        
        // --- Render Edit Inputs/Selects --- 
        if (field === 'payment_method') {
            return (
                <select 
                    name={field}
                    value={currentEditValue as PayrollRecord['payment_method']}
                    onChange={(e) => handleEditChange(field, e.target.value as PayrollRecord['payment_method'])}
                    style={{ height: 32, padding: '0 8px', border: '1px solid #ccc', borderRadius: 4, width: '100%' }}
                >
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="cash">Cash</option>
                    <option value="cheque">Cheque</option>
                </select>
            );
        } else if (field === 'status') {
             return (
                <select 
                    name={field}
                    value={currentEditValue as PayrollRecord['status']}
                    onChange={(e) => handleEditChange(field, e.target.value as PayrollRecord['status'])}
                    style={{ height: 32, padding: '0 8px', border: '1px solid #ccc', borderRadius: 4, width: '100%' }}
                >
                    <option value="paid">Paid</option>
                    <option value="unpaid">Unpaid</option>
                    <option value="pending">Pending</option>
                </select>
            );
        } else if (field === 'payment_date') {
            return (
                <Input 
                    type="date"
                    value={currentEditValue as string}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => handleEditChange(field, e.target.value)}
                    style={{ height: 32 }}
                />
            );
        } else if (field === 'staff_id') {
            return (
                <Input 
                    type="text"
                    value={currentEditValue as string}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => handleEditChange(field, e.target.value)}
                    style={{ height: 32 }}
                />
            );
        } else if (field === 'salary_amount') {
            return (
                <Input 
                    type="number"
                    value={currentEditValue as number}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => handleEditChange(field, Number(e.target.value))}
                    style={{ height: 32 }}
                    min="0"
                />
            );
        } else if (field === 'month') {
             return (
                <Input 
                    type="month"
                    value={currentEditValue as string}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => handleEditChange(field, e.target.value)}
                    style={{ height: 32 }}
                />
            );
        }

        return String(record[field]);
    };

    return (
        <div style={{ minHeight: '100vh', backgroundColor: LightBg }}>
            <nav style={{ borderBottom: '1px solid #e5e7eb', backgroundColor: '#fff', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Button variant="default" style={{ backgroundColor: 'transparent', color: PrimaryColor, borderWidth: '1px', borderStyle: 'solid', borderColor: '#ccc' }} onClick={() => window.history.back()}>← Back</Button>
                <Button variant="destructive" onClick={() => window.location.href = "/login"}>Logout (Mock)</Button>
            </nav>

            <main style={{ maxWidth: '80rem', margin: '0 auto', padding: '2rem 1rem' }}>
                <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Company Payroll Management</h1>

                {/* --- ADD NEW PAYROLL RECORD --- */}
                {isAdmin && (
                    <Card style={{ marginBottom: '2rem' }}>
                        <CardHeader>
                            <CardTitle style={{ marginBottom: '0.5rem' }}>Add New Payroll Record</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {error && (
                                <Alert variant="destructive" customStyle={{ marginBottom: 16 }}>
                                    <AlertDescription> ⚠️  {error}</AlertDescription>
                                </Alert>
                            )}
                            <form onSubmit={handleAddPayroll} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                                <Input type="text" placeholder="Staff ID/Name (Required)" value={newPayroll.staff_id} onChange={(e) => handleNewChange('staff_id', e.target.value)} required />
                                <Input type="month" placeholder="Month (Required)" value={newPayroll.month} onChange={(e) => handleNewChange('month', e.target.value)} required />
                                <Input type="number" placeholder="Salary Amount (Required)" value={newPayroll.salary_amount === 0 ? "" : newPayroll.salary_amount} onChange={(e) => handleNewChange('salary_amount', Number(e.target.value))} min="0.01" step="0.01" required />
                                <Input type="date" placeholder="Payment Date (Optional)" value={newPayroll.payment_date} onChange={(e) => handleNewChange('payment_date', e.target.value)} />
                                <select 
                                    style={{ border: '1px solid #ccc', borderRadius: '4px', padding: '0.6rem 0.8rem', fontSize: '1rem', color: '#374151', backgroundColor: 'white', height: 40 }}
                                    value={newPayroll.payment_method}
                                    onChange={(e) => handleNewChange('payment_method', e.target.value as PayrollRecord['payment_method'])}
                                >
                                    <option value="bank_transfer">Bank Transfer</option>
                                    <option value="cash">Cash</option>
                                    <option value="cheque">Cheque</option>
                                </select>
                                <Button type="submit" style={{ gridColumn: 'span 1 / auto' }}>
                                    <Plus size={16} style={{ marginRight: '0.5rem' }} /> Add Payroll
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                )}
                
                {/* --- PAYROLL TABLE (Uses expenses.tsx table style) --- */}
                <Card>
                    <CardTitle style={{ marginBottom: '1rem' }}>Payroll History</CardTitle>
                    <div style={{ overflowX: 'auto' }}>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Staff ID/Name</TableHead>
                                    <TableHead>Month</TableHead>
                                    <TableHead style={{ textAlign: 'right' }}>Amount</TableHead>
                                    <TableHead>Method</TableHead>
                                    <TableHead>Date Paid</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead style={{ minWidth: 120 }}>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {payroll.length > 0 ? (
                                    payroll.map((record) => (
                                        <TableRow key={record.id}>
                                            <TableCell>{renderCellContent(record, 'staff_id')}</TableCell>
                                            <TableCell>{renderCellContent(record, 'month')}</TableCell>
                                            <TableCell style={{ textAlign: 'right' }}>{renderCellContent(record, 'salary_amount')}</TableCell>
                                            <TableCell>{renderCellContent(record, 'payment_method')}</TableCell>
                                            <TableCell>{renderCellContent(record, 'payment_date')}</TableCell>
                                            <TableCell>{renderCellContent(record, 'status')}</TableCell>
                                            <TableCell>
                                                {editingId === record.id ? (
                                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                        <Button variant="default" size="sm" onClick={handleSaveItem} title="Save Changes">
                                                            <Save size={16} />
                                                        </Button>
                                                        <Button variant="ghost" size="sm" onClick={handleCancelEdit} title="Cancel Edit">
                                                            Cancel
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                        <Button variant="outline" size="sm" onClick={() => handleStartEdit(record)} title="Edit Record">
                                                            <Edit size={16} />
                                                        </Button>
                                                        <Button variant="destructive" size="sm" onClick={() => handleDeleteRecord(record.id)} title="Delete Record">
                                                            <Trash2 size={16} />
                                                        </Button>
                                                    </div>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={7} style={{ textAlign: 'center', color: MutedColor, padding: '1.5rem 0' }}>No payroll records found.</TableCell>
                                    </TableRow>
                                )}
                                {/* Total Row (Uses the corrected TableRow to accept style prop) */}
                                <TableRow style={{ borderTop: '2px solid ' + PrimaryColor, backgroundColor: '#f0f4ff' }}>
                                    <TableCell colSpan={2} style={{ fontWeight: 'bold', fontSize: '1.125rem' }}>Total Payroll Due/Paid:</TableCell>
                                    <TableCell style={{ textAlign: 'right', fontWeight: 'bold', fontSize: '1.125rem', color: PrimaryColor }}>
                                        {formatCurrency(payroll.reduce((sum, e) => sum + e.salary_amount, 0))}
                                    </TableCell>
                                    <TableCell colSpan={4}></TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </div>
                </Card>
            </main>
        </div>
    );
}