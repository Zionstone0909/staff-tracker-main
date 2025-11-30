import React, { useState, useEffect, FormEvent, CSSProperties, PropsWithChildren, useMemo, ChangeEvent } from "react";

// FIX 1: Corrected useNavigate mock to explicitly type 'path' as string | number
const useNavigate = () => {
    // Mock navigate function for demonstration
    return (path: string | number) => { 
        if (typeof path === 'string' && path === '/login') {
            console.log("Redirecting to /login (Auth failed)");
        } else if (typeof path === 'number' && path === -1) {
            console.log("Navigating back one step.");
            // window.history.back(); // Mocked
        }
    };
};

// --- Styling Constants ---
const PRIMARY_COLOR = '#4f46e5';
const TEXT_COLOR = '#1f2937';
const BG_COLOR = '#f3f4f6';
const CARD_BG = '#ffffff';
const DANGER_COLOR = '#dc2626';

// --- MOCK UI Components (re-typed for proper TypeScript usage) ---

interface ButtonProps extends PropsWithChildren {
    onClick?: () => void;
    type?: 'submit' | 'button';
    disabled?: boolean;
    style?: CSSProperties;
    variant?: 'default' | 'ghost' | 'destructive' | 'secondary' | 'outline';
}

const Button: React.FC<ButtonProps> = ({ children, onClick, type = 'button', disabled, style, variant = 'default' }) => {
    
    let baseStyle: CSSProperties = {
        padding: '0.625rem 1rem',
        borderRadius: '0.375rem',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontWeight: '600',
        transition: 'background-color 0.2s, opacity 0.2s, border-color 0.2s',
        border: 'none',
        opacity: disabled ? 0.6 : 1,
        fontSize: '0.875rem',
        textAlign: 'center',
        minWidth: '70px',
    };

    if (variant === 'destructive') {
        baseStyle = { ...baseStyle, backgroundColor: DANGER_COLOR, color: '#fff' };
    } else if (variant === 'ghost') {
        baseStyle = { ...baseStyle, backgroundColor: 'transparent', color: PRIMARY_COLOR, border: '1px solid transparent' };
    } else if (variant === 'secondary') {
        baseStyle = { ...baseStyle, backgroundColor: '#e5e7eb', color: TEXT_COLOR };
    } else if (variant === 'outline') {
        baseStyle = { ...baseStyle, backgroundColor: 'transparent', color: PRIMARY_COLOR, border: '1px solid #e5e7eb' };
    }
     else { // default
        baseStyle = { ...baseStyle, backgroundColor: PRIMARY_COLOR, color: '#fff' };
    }

    return <button type={type} onClick={onClick} disabled={disabled} style={{ ...baseStyle, ...style }}>{children}</button>;
};

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
    <input
        {...props}
        style={{
            border: '1px solid #e5e7eb',
            borderRadius: '0.375rem',
            padding: '0.5rem 0.75rem',
            height: '2.5rem',
            width: '100%',
            backgroundColor: props.disabled ? BG_COLOR : CARD_BG,
            color: TEXT_COLOR,
            ...props.style
        }}
    />
);

const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = (props) => (
    <select
        {...props}
        style={{ 
            border: '1px solid #e5e7eb', 
            borderRadius: '0.375rem', 
            padding: '0.5rem 0.75rem', 
            height: '2.5rem', 
            width: '100%', 
            backgroundColor: props.disabled ? BG_COLOR : CARD_BG, 
            color: TEXT_COLOR,
            ...props.style
        }}
    >{props.children}</select>
);

const Alert: React.FC<PropsWithChildren<{ variant: 'destructive' }>> = ({ children, variant: _variant }) => {
    let style: CSSProperties = {
        padding: '1rem',
        borderRadius: '0.375rem',
        marginBottom: '1rem',
        backgroundColor: '#fee2e2',
        border: '1px solid #f87171',
        color: DANGER_COLOR
    };
    // Removed unused _variant check
    return <div style={style}>{children}</div>;
};

const AlertDescription: React.FC<PropsWithChildren<{}>> = ({ children }) => <p style={{ margin: 0 }}>{children}</p>;

interface CardProps extends PropsWithChildren { style?: CSSProperties, className?: string }
const Card: React.FC<CardProps> = ({ children, style, className }) => {
    const marginStyle = className?.includes('mb-8') ? { marginBottom: '2rem' } : {};
    return <div style={{ backgroundColor: CARD_BG, borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)', ...marginStyle, ...style }}>{children}</div>;
};
const CardHeader: React.FC<CardProps> = ({ children, style }) => <div style={{ padding: '1.5rem 1.5rem 0.5rem', ...style }}>{children}</div>;
const CardTitle: React.FC<CardProps> = ({ children, style }) => <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0, color: TEXT_COLOR, ...style }}>{children}</h2>;
const CardContent: React.FC<CardProps> = ({ children, style, className }) => {
    const paddingStyle: CSSProperties = className?.includes('space-y-4') ? { display: 'flex', flexDirection: 'column', gap: '1rem' } : {}; 
    return <div style={{ padding: '1rem 1.5rem 1.5rem', ...paddingStyle, ...style }}>{children}</div>;
};

// ... Table components remain the same ...
const Table: React.FC<PropsWithChildren<{}>> = ({ children }) => <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>{children}</table>;
const TableHeader: React.FC<PropsWithChildren<{}>> = ({ children }) => <thead style={{ backgroundColor: BG_COLOR }}>{children}</thead>;
const TableBody: React.FC<PropsWithChildren<{}>> = ({ children }) => <tbody>{children}</tbody>;
const TableRow: React.FC<PropsWithChildren<{}>> = ({ children }) => <tr style={{ borderBottom: '1px solid #e5e7eb' }}>{children}</tr>;

// FIX 2: Added style prop to TableHead interface/implementation to resolve ts(2322) errors
const TableHead: React.FC<PropsWithChildren<{ style?: CSSProperties }>> = ({ children, style }) => <th style={{ 
    padding: '0.75rem', 
    textAlign: 'left', 
    color: TEXT_COLOR, 
    fontWeight: 600, 
    fontSize: '0.875rem', 
    textTransform: 'uppercase',
    ...style // Merge the passed-in style
}}>{children}</th>;

const TableCell: React.FC<PropsWithChildren<{ className?: string, colSpan?: number, style?: CSSProperties }>> = ({ children, className, colSpan, style }) => { 
    const isCenter = className?.includes('text-center');
    const isMuted = className?.includes('text-muted-foreground') ? { color: '#6b7280' } : {};
    const isGreen = className?.includes('text-green-600') ? { color: '#10b981' } : {};
    const isRed = className?.includes('text-red-600') ? { color: '#ef4444' } : {};
    const isBold = className?.includes('font-semibold') ? { fontWeight: 600 } : {};
    return <td colSpan={colSpan} style={{ padding: '0.75rem', verticalAlign: 'middle', textAlign: isCenter ? 'center' : 'left', ...isMuted, ...isGreen, ...isRed, ...isBold, ...style }}>{children}</td>; 
};


// --- Helper Function ---
const getInputValue = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    e.currentTarget.value

// --- Interfaces ---
interface LedgerEntry {
    id: number
    customer_id: number // Unique customer ID
    description: string
    amount: number // Positive for debt (sale), negative for credit (payment/return)
    transaction_date: string
    transaction_type: "sale" | "payment" | "return"
    status: "outstanding" | "completed"
}

interface CustomerBalance {
    customer_id: number;
    balance: number; // Positive is amount owed to us, negative is overpayment
}

// --- Mock Data and Storage Key ---
const STORAGE_KEY = "customerLedgerData";
const INITIAL_MOCK_LEDGER: LedgerEntry[] = [
    { id: 1, customer_id: 101, description: "Initial Inventory Sale", amount: 50000, transaction_date: "2025-10-01", transaction_type: "sale", status: "outstanding" },
    { id: 2, customer_id: 101, description: "Partial Payment", amount: -20000, transaction_date: "2025-10-05", transaction_type: "payment", status: "outstanding" },
    { id: 3, customer_id: 202, description: "Large Service Order", amount: 150000, transaction_date: "2025-10-10", transaction_type: "sale", status: "completed" },
    { id: 4, customer_id: 303, description: "Consulting Fee", amount: 75000, transaction_date: "2025-10-15", transaction_type: "sale", status: "outstanding" },
    { id: 5, customer_id: 202, description: "Final Payment", amount: -150000, transaction_date: "2025-10-11", transaction_type: "payment", status: "completed" },
    { id: 6, customer_id: 404, description: "Initial Payment/Credit", amount: -10000, transaction_date: "2025-11-01", transaction_type: "payment", status: "outstanding" },
];

const loadLedger = (): LedgerEntry[] => {
    const storedData = localStorage.getItem(STORAGE_KEY);
    if (!storedData) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_MOCK_LEDGER));
        return INITIAL_MOCK_LEDGER;
    }
    // ** FINAL FIX for TS2345: Type assertion to LedgerEntry[] **
    return JSON.parse(storedData) as LedgerEntry[];
};

const saveLedger = (data: LedgerEntry[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

// --- Main Component ---
const App: React.FC = () => {
    const navigate = useNavigate();
    const [ledger, setLedger] = useState<LedgerEntry[]>([]);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [newEntry, setNewEntry] = useState<Omit<LedgerEntry, "id">>({
        customer_id: 0,
        description: "",
        amount: 0,
        transaction_date: new Date().toISOString().split('T')[0],
        transaction_type: "sale",
        status: "outstanding",
    });
    const [selectedCustomerId, setSelectedCustomerId] = useState<number>(0); 


    // --- Role and Access Control ---
    const storedUser = JSON.parse(localStorage.getItem("currentUser") || '{"role": "staff"}');
    const role = storedUser.role || 'staff';
    const isAdmin = role === 'admin';
    const isStaffOrAdmin = role === 'staff' || isAdmin;
    // --- End Role Check ---

    const fetchLedger = async (_authToken: string) => { 
        setLoading(true);
        setError(null);
        
        try {
            await new Promise(resolve => setTimeout(resolve, 500)); // Simulate delay
            const data = loadLedger();
            // Sort by date descending
            setLedger(data.sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime()));
        } catch (err) {
            setError("Error loading mock ledger data.");
            console.error("Error loading mock ledger:", err);
        } finally {
            setLoading(false);
        }
    };

    // Calculate Customer Balances using useMemo for efficiency
    const allCustomerBalances: CustomerBalance[] = useMemo(() => {
        const balancesMap: { [key: number]: number } = {};
        
        ledger.forEach(entry => {
            balancesMap[entry.customer_id] = (balancesMap[entry.customer_id] || 0) + entry.amount;
        });

        return Object.keys(balancesMap).map(id => ({
            customer_id: Number(id),
            balance: balancesMap[Number(id)],
        })).sort((a, b) => a.customer_id - b.customer_id); // Sort by ID
    }, [ledger]);
    
    // Filtered Balances based on selectedCustomerId
    const filteredCustomerBalances = useMemo(() => {
        if (selectedCustomerId === 0) {
            return allCustomerBalances;
        }
        return allCustomerBalances.filter(b => b.customer_id === selectedCustomerId);
    }, [allCustomerBalances, selectedCustomerId]);

    // Extracted unique customer IDs for the new entry dropdown
    const uniqueCustomerIds = useMemo(() => {
        const ids = new Set<number>(ledger.map(e => e.customer_id));
        if (newEntry.customer_id !== 0) {
             ids.add(newEntry.customer_id);
        }
        return Array.from(ids).sort((a, b) => a - b);
    }, [ledger, newEntry.customer_id]);


    // Authentication check and initial fetch
    useEffect(() => {
        const storedToken = localStorage.getItem("jwtToken");
        
        if (!isStaffOrAdmin || !storedToken) {
            navigate("/login");
            return;
        }
        setToken(storedToken);
        fetchLedger(storedToken);
    }, [navigate, isStaffOrAdmin]);

    // Function to update local storage and refresh state
    const updateLedgerAndRefresh = (updatedLedger: LedgerEntry[]) => {
        saveLedger(updatedLedger);
        fetchLedger(token!);
    }

    // --- Transaction Management Handlers ---

    // 1. Handle Add new ledger entry (Admin Only)
    const handleAddEntry = async (e: FormEvent) => {
        e.preventDefault();

        if (!isAdmin) {
            setError("Access Denied: Only Admins can record new ledger entries.");
            return;
        }
        
        if (!token) {
            setError("Not authenticated.");
            return;
        }
        setError(null);

        // Validation
        if (newEntry.customer_id <= 0 || newEntry.amount <= 0 || !newEntry.transaction_date) {
            setError("Customer ID must be selected, Amount must be positive, and Date must be filled.");
            return;
        }
        setLoading(true);

        try {
            await new Promise(resolve => setTimeout(resolve, 500));
            const currentLedger = loadLedger();
            const nextId = currentLedger.length ? Math.max(...currentLedger.map(e => e.id)) + 1 : 1;
            
            // Ensure amount is correctly signed: payment/return should be negative
            const signedAmount = (newEntry.transaction_type === "payment" || newEntry.transaction_type === "return") 
                ? -Math.abs(newEntry.amount) 
                : Math.abs(newEntry.amount);

            const entryToAdd: LedgerEntry = {
                ...newEntry,
                id: nextId,
                amount: signedAmount,
                customer_id: Number(newEntry.customer_id),
            };

            const updatedLedger = [...currentLedger, entryToAdd];
            updateLedgerAndRefresh(updatedLedger); // This line is correct as `updatedLedger` is built from a strongly typed array
            
            // Reset form fields
            setNewEntry(prev => ({ 
                ...prev, 
                customer_id: 0, // Reset customer ID
                description: "", 
                amount: 0,
                transaction_date: new Date().toISOString().split('T')[0],
            }));
            // Update filter to show the new customer/entry if not already showing all
            setSelectedCustomerId(Number(newEntry.customer_id)); 
        } catch (err) {
            setError("Error recording mock transaction.");
        } finally {
            setLoading(false);
        }
    };

    // 2. Handle Deleting a ledger entry (Admin Only)
    const handleDeleteEntry = async (id: number) => {
        if (!isAdmin) {
            setError("Access Denied: Only Admins can delete transactions.");
            return;
        }
        
        setLoading(true);
        setError(null);

        try {
            await new Promise(resolve => setTimeout(resolve, 300));
            const currentLedger = loadLedger();
            
            // ** FIX: Explicitly type the result of the filter operation **
            const updatedLedger: LedgerEntry[] = currentLedger.filter(entry => entry.id !== id);
            
            updateLedgerAndRefresh(updatedLedger); // This line is now correct
            console.log(`Deleted transaction ID: ${id}`);
        } catch (err) {
            setError("Error deleting mock transaction.");
        } finally {
            setLoading(false);
        }
    }

    // 3. Handle Status Update (Staff/Admin)
    const handleUpdateStatus = async (id: number) => {
        if (!isStaffOrAdmin) {
            setError("Access Denied: You do not have permission to update transaction status.");
            return;
        }
        
        setLoading(true);
        setError(null);

        try {
            await new Promise(resolve => setTimeout(resolve, 300));
            const currentLedger = loadLedger();
            
            // ** FIX: Explicitly type the result of the map operation **
            const updatedLedger: LedgerEntry[] = currentLedger.map(entry => 
                entry.id === id ? { ...entry, status: "completed" } : entry
            );
            
            updateLedgerAndRefresh(updatedLedger); // This line is now correct
            console.log(`Updated status for transaction ID: ${id}`);
        } catch (err) {
            setError("Error updating transaction status.");
        } finally {
            setLoading(false);
        }
    }

    const handleLogout = () => {
        localStorage.removeItem("currentUser");
        localStorage.removeItem("jwtToken");
        navigate("/login");
    };
    
    // Formatting helper
    const formatCurrency = (amount: number) => `₦${Math.abs(amount).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    return (
        <div style={{ minHeight: '100vh', backgroundColor: BG_COLOR, fontFamily: 'Inter, sans-serif' }}>
            {/* NAVIGATION BAR with Back and Logout */}
            <nav style={{ borderBottom: '1px solid #e5e7eb', backgroundColor: CARD_BG, padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Button variant="ghost" onClick={() => navigate(-1)}>
                        ← Back
                    </Button>
                    <span style={{ fontSize: '0.875rem', color: '#4b5563' }}>
                        Current Role: <b style={{ color: isAdmin ? PRIMARY_COLOR : '#059669', textTransform: 'uppercase' }}>{role}</b>
                    </span>
                </div>
                <Button variant="destructive" onClick={handleLogout}>
                    Logout
                </Button>
            </nav>

            <main style={{ maxWidth: '1120px', margin: '0 auto', padding: '2rem 1rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '1.5rem', color: TEXT_COLOR }}>Financial Dashboard</h1>

                {/* ERROR/STATUS ALERT */}
                {error && (
                    <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}
                
                {/* Customer Balance Summary (Staff/Admin) */}
                <Card className="mb-8">
                    <CardHeader style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <CardTitle>Customer Balance Summary</CardTitle>
                        {/* Customer ID Filter for Summary */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '0.875rem', color: TEXT_COLOR }}>Filter:</span>
                            <Select
                                style={{ width: '150px' }}
                                value={selectedCustomerId || 0}
                                onChange={(e) => setSelectedCustomerId(parseInt(getInputValue(e)) || 0)}
                            >
                                <option value={0}>All Customers</option>
                                {allCustomerBalances.map(b => (
                                    <option key={b.customer_id} value={b.customer_id}>
                                        ID: {b.customer_id}
                                    </option>
                                ))}
                            </Select>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {filteredCustomerBalances.length > 0 ? (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
                                {filteredCustomerBalances.map(balanceEntry => (
                                    <div 
                                        key={balanceEntry.customer_id} 
                                        style={{ 
                                            padding: '1rem', 
                                            borderRadius: '0.375rem', 
                                            border: `1px solid ${balanceEntry.balance > 0 ? '#fca5a5' : '#a7f3d0'}`,
                                            backgroundColor: balanceEntry.balance > 0 ? '#fef2f2' : '#ecfdf5',
                                        }}
                                    >
                                        <div style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: 500 }}>
                                            Customer ID: <b>{balanceEntry.customer_id}</b>
                                        </div>
                                        <div 
                                            style={{ 
                                                fontSize: '1.5rem', 
                                                fontWeight: 700, 
                                                color: balanceEntry.balance > 0 ? DANGER_COLOR : '#10b981' 
                                            }}
                                        >
                                            {balanceEntry.balance > 0 && '+'}
                                            {formatCurrency(balanceEntry.balance)}
                                        </div>
                                        <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                                            {balanceEntry.balance > 0 ? 'OWED TO US' : 'PREPAID / CREDIT'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p style={{ color: '#6b7280' }}>
                                {selectedCustomerId === 0 ? "No customer balances to display." : `No transactions found for Customer ID: ${selectedCustomerId}.`}
                            </p>
                        )}
                    </CardContent>
                </Card>


                {/* New Entry Form (ADMIN ONLY) */}
                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle>Record Customer Transaction (Admin Only)</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {!isAdmin ? (
                            <Alert variant="destructive">
                                <AlertDescription>
                                    Access Denied: Your current role ({role.toUpperCase()}) does not permit recording new transactions.
                                </AlertDescription>
                            </Alert>
                        ) : (
                            <form onSubmit={handleAddEntry} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                                    {/* Customer ID Select dropdown */}
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.25rem', color: '#4b5563' }}>Customer ID</label>
                                        <Select
                                            value={newEntry.customer_id || ""}
                                            onChange={(e) =>
                                                setNewEntry({ ...newEntry, customer_id: parseInt(getInputValue(e)) || 0 })
                                            }
                                            disabled={loading}
                                        >
                                            <option value={0} disabled>Select Customer ID</option>
                                            {uniqueCustomerIds.map(id => (
                                                <option key={id} value={id}>ID: {id}</option>
                                            ))}
                                        </Select>
                                    </div>

                                    {/* Description */}
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.25rem', color: '#4b5563' }}>Description</label>
                                        <Input
                                            type="text"
                                            placeholder="Description"
                                            value={newEntry.description}
                                            onChange={(e) => setNewEntry({ ...newEntry, description: getInputValue(e) })}
                                            disabled={loading}
                                        />
                                    </div>

                                    {/* Amount */}
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.25rem', color: '#4b5563' }}>Amount (Absolute Value)</label>
                                        <Input
                                            type="number"
                                            placeholder="Amount (e.g., 50000.00)"
                                            value={newEntry.amount || ""}
                                            onChange={(e) =>
                                                setNewEntry({ ...newEntry, amount: parseFloat(getInputValue(e)) || 0 })
                                            }
                                            step="0.01"
                                            min="0.01"
                                            disabled={loading}
                                        />
                                    </div>

                                    {/* Date */}
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.25rem', color: '#4b5563' }}>Transaction Date</label>
                                        <Input
                                            type="date"
                                            value={newEntry.transaction_date}
                                            onChange={(e) => setNewEntry({ ...newEntry, transaction_date: getInputValue(e) })}
                                            disabled={loading}
                                        />
                                    </div>

                                    {/* Type */}
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.25rem', color: '#4b5563' }}>Transaction Type</label>
                                        <Select
                                            value={newEntry.transaction_type}
                                            onChange={(e) =>
                                                setNewEntry({ ...newEntry, transaction_type: getInputValue(e) as LedgerEntry["transaction_type"] })
                                            }
                                            disabled={loading}
                                        >
                                            <option value="sale">Sale (Increases Debt)</option>
                                            <option value="payment">Payment (Reduces Debt/Creates Credit)</option>
                                            <option value="return">Return (Reduces Debt/Creates Credit)</option>
                                        </Select>
                                    </div>

                                    {/* Status (Default to outstanding for new entries) */}
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.25rem', color: '#4b5563' }}>Status (Fixed)</label>
                                        <Select
                                            style={{ backgroundColor: BG_COLOR }}
                                            value={newEntry.status}
                                            onChange={(e) =>
                                                setNewEntry({ ...newEntry, status: getInputValue(e) as LedgerEntry["status"] })
                                            }
                                            disabled={true} // New entries should default to outstanding
                                        >
                                            <option value="outstanding">Outstanding (Default)</option>
                                            <option value="completed" disabled>Completed</option>
                                        </Select>
                                    </div>
                                </div>
                                <Button type="submit" style={{ width: '100%' }} disabled={loading || newEntry.customer_id === 0 || newEntry.amount <= 0}>
                                    {loading ? "Recording..." : "Record Transaction"}
                                </Button>
                            </form>
                        )}
                    </CardContent>
                </Card>


                {/* Ledger Table (Visible to all) */}
                <Card>
                    <CardHeader>
                        <CardTitle>Detailed Transaction Ledger</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div style={{ overflowX: 'auto' }}>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>ID</TableHead>
                                        <TableHead>Customer ID</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead style={{ textAlign: 'right' }}>Amount (₦)</TableHead>
                                        <TableHead style={{ textAlign: 'center' }}>Type</TableHead>
                                        <TableHead style={{ textAlign: 'center' }}>Status</TableHead>
                                        <TableHead style={{ textAlign: 'center' }}>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {ledger.length === 0 && !loading ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center text-muted-foreground">
                                                No ledger entries found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        ledger.map(entry => (
                                            <TableRow key={entry.id}>
                                                <TableCell>{entry.id}</TableCell>
                                                <TableCell className="font-semibold">{entry.customer_id}</TableCell>
                                                <TableCell>{entry.description}</TableCell>
                                                <TableCell 
                                                    className={entry.amount > 0 ? "text-red-600 font-semibold" : "text-green-600"}
                                                    style={{ textAlign: 'right' }} 
                                                >
                                                    {entry.amount > 0 ? formatCurrency(entry.amount) : `(${formatCurrency(entry.amount)})`}
                                                </TableCell>
                                                <TableCell className="font-semibold text-center">{entry.transaction_type.toUpperCase()}</TableCell>
                                                <TableCell className="text-center">
                                                    <span style={{
                                                        display: 'inline-block',
                                                        padding: '0.25rem 0.5rem',
                                                        borderRadius: '9999px',
                                                        backgroundColor: entry.status === 'outstanding' ? '#fef3c7' : '#d1fae5',
                                                        color: entry.status === 'outstanding' ? '#f59e0b' : '#059669',
                                                        fontSize: '0.75rem',
                                                        fontWeight: 600,
                                                    }}>
                                                        {entry.status.toUpperCase()}
                                                    </span>
                                                </TableCell>
                                                <TableCell style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                                    {entry.status === 'outstanding' && isStaffOrAdmin && (
                                                        <Button 
                                                            variant="secondary" 
                                                            onClick={() => handleUpdateStatus(entry.id)} 
                                                            disabled={loading}
                                                            style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
                                                        >
                                                            Mark Paid
                                                        </Button>
                                                    )}
                                                    {isAdmin && (
                                                        <Button 
                                                            variant="destructive" 
                                                            onClick={() => handleDeleteEntry(entry.id)} 
                                                            disabled={loading}
                                                            style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
                                                        >
                                                            Delete
                                                        </Button>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                    {loading && (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center text-muted-foreground">
                                                Loading ledger data...
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

            </main>
        </div>
    );
};

// Export the main component
export default App;