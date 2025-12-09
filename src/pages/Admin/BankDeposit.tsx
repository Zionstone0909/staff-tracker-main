// src/pages/Admin/BankDeposit.tsx
"use client";

import { useState, useEffect, useMemo, FormEvent, CSSProperties, PropsWithChildren, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { useAuth, User as AuthUser } from "../../contexts/AuthContext";

// --- Styling Constants ---
const PrimaryColor = '#0B3D91';
const DestructiveColor = '#dc2626';

// --- UI Components ---
const Button: React.FC<PropsWithChildren & React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'default' | 'destructive' }> = ({
    children, onClick, style, disabled, type = 'button', variant = 'default', ...props
}) => {
    let backgroundColor = PrimaryColor;
    if (variant === 'destructive') backgroundColor = DestructiveColor;

    const baseStyle: CSSProperties = {
        padding: '0.5rem 1rem',
        cursor: disabled ? 'not-allowed' : 'pointer',
        backgroundColor: disabled ? '#ccc' : (style?.backgroundColor || backgroundColor),
        color: 'white',
        borderWidth: '0px',
        borderStyle: 'solid',
        borderColor: 'transparent',
        borderRadius: '4px',
        fontWeight: '500',
        transition: 'background-color 0.2s',
        opacity: disabled ? 0.6 : 1,
        ...style
    };

    return (
        <button onClick={onClick} style={baseStyle} disabled={disabled} type={type} {...props}>
            {children}
        </button>
    );
};

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
    <input {...props} style={{ padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px', width: '100%' }} />
);

const Card: React.FC<PropsWithChildren & { style?: CSSProperties }> = ({ children, style }) => (
    <div style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '1rem', marginBottom: '1rem', backgroundColor: '#fff', ...style }}>
        {children}
    </div>
);

const CardHeader: React.FC<PropsWithChildren> = ({ children }) => <div>{children}</div>;
const CardTitle: React.FC<PropsWithChildren> = ({ children }) => <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{children}</h2>;
const CardContent: React.FC<PropsWithChildren & { style?: CSSProperties }> = ({ children, style }) => <div style={style}>{children}</div>;

const Alert: React.FC<PropsWithChildren & { variant?: string }> = ({ children, variant }) => (
    <div style={{
        padding: '1rem',
        backgroundColor: variant === 'destructive' ? '#f8d7da' : '#e2e3e5',
        border: variant === 'destructive' ? '1px solid #f5c6cb' : '1px solid #d6d8da',
        color: variant === 'destructive' ? '#721c24' : '#383d41',
        borderRadius: '4px'
    }}>
        {children}
    </div>
);

const AlertDescription: React.FC<PropsWithChildren> = ({ children }) => <p>{children}</p>;

const Table: React.FC<PropsWithChildren & { style?: CSSProperties }> = ({ children, style }) => <table style={{ width: '100%', borderCollapse: 'collapse', ...style }}>{children}</table>;
const TableHeader: React.FC<PropsWithChildren> = ({ children }) => <thead>{children}</thead>;
const TableBody: React.FC<PropsWithChildren> = ({ children }) => <tbody>{children}</tbody>;
const TableRow: React.FC<PropsWithChildren> = ({ children }) => <tr style={{ borderBottom: '1px solid #eee' }}>{children}</tr>;
const TableHead: React.FC<PropsWithChildren & { style?: CSSProperties }> = ({ children, style }) => <th scope="col" style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 'bold', borderBottom: '2px solid #ccc', ...style }}>{children}</th>;
const TableCell: React.FC<PropsWithChildren & { colSpan?: number, style?: CSSProperties }> = ({ children, style, colSpan }) => <td colSpan={colSpan} style={{ padding: '0.75rem', ...style }}>{children}</td>;

// --- Data Structures ---
interface Deposit {
    id: number;
    amount: number;
    description: string;
    initiated_at: string;
    initiated_by_user_id: string;
}

const depositSchema = z.object({
    amount: z.number().positive("Amount must be a positive number"),
    description: z.string().min(1, "Description is required"),
});

// --- Helpers ---
const isToday = (dateString: string): boolean => {
    const today = new Date();
    const depositDate = new Date(dateString);
    return depositDate.getFullYear() === today.getFullYear() &&
        depositDate.getMonth() === today.getMonth() &&
        depositDate.getDate() === today.getDate();
};

const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(amount);

const formatDate = (date: string) =>
    new Date(date).toLocaleString();

// Helper to format date string for HTML date input (YYYY-MM-DD)
const toDateInputString = (date?: Date): string => {
    if (!date) return '';
    return date.toISOString().split('T')[0];
};

// --- Mock Data ---
const MOCK_DEPOSITS: Deposit[] = [
    { id: 1, amount: 500000, description: "Initial capital deposit", initiated_at: new Date(Date.now() - 345600000).toISOString(), initiated_by_user_id: '101' }, // 4 days ago
    { id: 2, amount: 250000, description: "Sales deposit from Week 1", initiated_at: new Date(Date.now() - 259200000).toISOString(), initiated_by_user_id: '202' }, // 3 days ago
    { id: 3, amount: 150000, description: "Daily sales deposit (Staff 202)", initiated_at: new Date().toISOString(), initiated_by_user_id: '202' }, // Today
    { id: 4, amount: 1000000, description: "Main capital injection (Admin 101)", initiated_at: new Date().toISOString(), initiated_by_user_id: '101' }, // Today
    { id: 5, amount: 750000, description: "Q1 Profit transfer", initiated_at: new Date(Date.now() - 1036800000).toISOString(), initiated_by_user_id: '101' }, // 12 days ago
];

// --- Printable Component for Deposit Records ---
const PrintableBankDeposits: React.FC<{ deposits: Deposit[]; userRole: 'admin' | 'staff'; dateRange: { start: string, end: string } }> = ({ deposits, userRole, dateRange }) => {
    const totalAmount = deposits.reduce((sum, d) => sum + d.amount, 0);
    const tableStyle: CSSProperties = {
        border: '1px solid black',
    };
    const cellStyle: CSSProperties = {
        border: '1px solid black',
        padding: '8px'
    };
    const headerStyle: CSSProperties = {
        borderBottom: '2px solid black',
        backgroundColor: '#f0f0f0'
    };

    const reportRange = userRole === 'staff' 
        ? "Today's Records" 
        : (dateRange.start || dateRange.end) 
            ? `From ${dateRange.start || 'Start'} to ${dateRange.end || 'End'}`
            : 'All Time Records';

    return (
        <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
            <h1 style={{ textAlign: 'center', marginBottom: '10px' }}>Bank Deposit Report</h1>
            <p style={{ marginBottom: '20px', textAlign: 'center', fontWeight: 'bold' }}>
                Report Period: {reportRange}
            </p>
            <p style={{ marginBottom: '20px', textAlign: 'center', fontSize: '0.9rem' }}>
                Generated On: {new Date().toLocaleString()}
            </p>

            <Table style={tableStyle}>
                <TableHeader>
                    <TableRow>
                        {userRole === "admin" && <TableHead style={{ ...cellStyle, ...headerStyle }}>User ID</TableHead>}
                        <TableHead style={{ ...cellStyle, ...headerStyle }}>Amount</TableHead>
                        <TableHead style={{ ...cellStyle, ...headerStyle }}>Description</TableHead>
                        <TableHead style={{ ...cellStyle, ...headerStyle }}>Initiated At</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {deposits.map(d => (
                        <TableRow key={d.id}>
                            {userRole === "admin" && <TableCell style={cellStyle}>{d.initiated_by_user_id}</TableCell>}
                            <TableCell style={cellStyle}>{formatCurrency(d.amount)}</TableCell>
                            <TableCell style={cellStyle}>{d.description}</TableCell>
                            <TableCell style={cellStyle}>{formatDate(d.initiated_at)}</TableCell>
                        </TableRow>
                    ))}
                    <TableRow>
                        <TableCell colSpan={userRole === "admin" ? 2 : 1} style={{ ...cellStyle, fontWeight: 'bold', textAlign: 'right' }}>Total:</TableCell>
                        <TableCell style={{ ...cellStyle, fontWeight: 'bold' }}>{formatCurrency(totalAmount)}</TableCell>
                        <TableCell colSpan={userRole === "admin" ? 2 : 1} style={cellStyle}></TableCell>
                    </TableRow>
                </TableBody>
            </Table>

            <div style={{ marginTop: '50px', paddingTop: '20px', borderTop: '1px dashed #ccc', display: 'flex', justifyContent: 'space-around', fontSize: '0.9rem' }}>
                <p>Signature (Prepared By): ___________________</p>
                <p>Signature (Approved By): ___________________</p>
            </div>
        </div>
    );
};

// --- Component ---
export default function BankDepositsPage() {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const printAreaRef = useRef<HTMLDivElement>(null);

    const [deposits, setDeposits] = useState<Deposit[]>([]);
    const [newDeposit, setNewDeposit] = useState({ amount: "", description: "" });
    const [loading, setLoading] = useState(false);
    const [isFetchingDeposits, setIsFetchingDeposits] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // --- New State for Date Range Filtering ---
    const [startDate, setStartDate] = useState<string>(''); // YYYY-MM-DD
    const [endDate, setEndDate] = useState<string>(''); // YYYY-MM-DD

    // --- Mock Storage ---
    const mockSaveDeposits = (newDeposits: Deposit[]) => localStorage.setItem('bankDeposits', JSON.stringify(newDeposits));

    const mockFetchDeposits = async (currentUser: AuthUser) => {
        setIsFetchingDeposits(true);
        setError(null);
        try {
            await new Promise(resolve => setTimeout(resolve, 500));

            let storedData = localStorage.getItem('bankDeposits');
            let currentDeposits: Deposit[] = storedData ? JSON.parse(storedData) : MOCK_DEPOSITS;

            if (!storedData) mockSaveDeposits(currentDeposits);

            // Staff view is always filtered to today's deposits
            let depositsToDisplay = currentDeposits;
            if (currentUser.role === 'staff') {
                depositsToDisplay = currentDeposits.filter(d => isToday(d.initiated_at));
            }

            const sortedDeposits = depositsToDisplay.sort((a, b) => new Date(b.initiated_at).getTime() - new Date(a.initiated_at).getTime());

            setDeposits(sortedDeposits);
        } catch {
            setError("Local storage corrupted. Resetting mock data.");
            setDeposits(MOCK_DEPOSITS);
            mockSaveDeposits(MOCK_DEPOSITS);
        } finally {
            setIsFetchingDeposits(false);
        }
    };

    useEffect(() => {
        if (!user || !user.id) return;

        const isLocalhost = ["localhost", "127.0.0.1"].includes(window.location.hostname);
        if (isLocalhost) {
            mockFetchDeposits(user);
        }
    }, [user]);

    if (!user) return null;

    const handleInput = (field: keyof typeof newDeposit) => (e: React.ChangeEvent<HTMLInputElement>) => {
        setNewDeposit(prev => ({ ...prev, [field]: e.target.value }));
    };

    const handleAddDeposit = async (e: FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setLoading(true);
        setError(null);

        const amountNum = parseFloat(newDeposit.amount);
        if (isNaN(amountNum)) {
            setError("Amount must be a valid number");
            setLoading(false);
            return;
        }

        const validation = depositSchema.safeParse({ amount: amountNum, description: newDeposit.description });
        if (!validation.success) {
            setError(validation.error.errors.map(err => err.message).join(", "));
            setLoading(false);
            return;
        }

        const isLocalhost = ["localhost", "127.0.0.1"].includes(window.location.hostname);
        if (isLocalhost) {
            let storedData = localStorage.getItem('bankDeposits');
            let currentDeposits: Deposit[] = storedData ? JSON.parse(storedData) : MOCK_DEPOSITS;
            const nextId = currentDeposits.length ? Math.max(...currentDeposits.map(d => d.id)) + 1 : 1;

            const newRecord: Deposit = {
                id: nextId,
                amount: validation.data.amount,
                description: validation.data.description,
                initiated_at: new Date().toISOString(),
                initiated_by_user_id: user.id,
            };

            currentDeposits.push(newRecord);
            mockSaveDeposits(currentDeposits);
            setNewDeposit({ amount: "", description: "" });
            await mockFetchDeposits(user);
            setLoading(false);
        }
    };

    const handleDeleteDeposit = async (depositId: number) => {
        if (!user || user.role !== "admin") return alert("Not authorized");
        const confirmDelete = confirm("Delete this deposit?");
        if (!confirmDelete) return;

        const storedData = localStorage.getItem('bankDeposits');
        let currentDeposits: Deposit[] = storedData ? JSON.parse(storedData) : [];
        const updatedDeposits = currentDeposits.filter(d => d.id !== depositId);
        mockSaveDeposits(updatedDeposits);
        await mockFetchDeposits(user);
    };

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        if (printWindow && printAreaRef.current) {
            const printContent = printAreaRef.current.innerHTML;
            
            printWindow.document.write('<html><head><title>Bank Deposit Report</title>');
            // Inline print styles for better cross-browser print compatibility
            printWindow.document.write(`<style>
                body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid black; padding: 8px; text-align: left; }
                th { background-color: #f0f0f0; border-bottom: 2px solid black; }
                .total-row td { font-weight: bold; }
            </style>`);
            printWindow.document.write('</head><body>');
            printWindow.document.write(printContent);
            printWindow.document.write('</body></html>');
            printWindow.document.close();
            
            printWindow.onload = () => {
                printWindow.print();
            };
        }
    };

    // Memoized sorted/filtered deposits (Updated to include Date Range filtering)
    const displayedDeposits = useMemo(() => {
        let filtered = deposits;

        if (user.role === 'admin') {
            const start = startDate ? new Date(startDate).getTime() : 0;
            const end = endDate ? new Date(endDate).getTime() + (24 * 60 * 60 * 1000) : Infinity; // Add one day to include the entire end date

            filtered = deposits.filter(d => {
                const depositTime = new Date(d.initiated_at).getTime();
                return depositTime >= start && depositTime < end;
            });
        }
        
        return filtered;
    }, [deposits, startDate, endDate, user.role]);

    // Calculate total amount for the currently displayed (filtered) deposits
    const totalDisplayedAmount = useMemo(() => {
        return displayedDeposits.reduce((sum, d) => sum + d.amount, 0);
    }, [displayedDeposits]);

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6' }}>
            <nav style={{ borderBottom: '1px solid #e5e7eb', backgroundColor: '#fff', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Button variant="default" style={{ backgroundColor: 'transparent', color: PrimaryColor, borderWidth: '1px', borderStyle: 'solid', borderColor: '#ccc' }} onClick={() => window.history.back()}>← Back</Button>
                <Button variant="destructive" onClick={() => { logout(); navigate("/login"); }}>Logout</Button>
            </nav>

            <main style={{ maxWidth: '80rem', margin: '0 auto', padding: '2rem 1rem' }}>
                <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Bank Deposits</h1>

                <Card style={{ marginBottom: '2rem' }}>
                    <CardHeader><CardTitle>Record Bank Deposit</CardTitle></CardHeader>
                    <CardContent style={{ padding: '1rem 0 0 0' }}>
                        <form onSubmit={handleAddDeposit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                                <Input type="number" placeholder="Amount" value={newDeposit.amount} onChange={handleInput("amount")} step="0.01" disabled={loading || isFetchingDeposits} />
                                <Input type="text" placeholder="Description" value={newDeposit.description} onChange={handleInput("description")} disabled={loading || isFetchingDeposits} />
                            </div>
                            <Button type="submit" style={{ width: '100%' }} disabled={loading || isFetchingDeposits}>{loading ? "Recording..." : "Record Deposit"}</Button>
                        </form>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <CardTitle>
                                {user.role === 'admin' ? 'Bank Deposits History' : 'Today\'s Bank Deposits'}
                            </CardTitle>
                            <Button onClick={handlePrint} disabled={isFetchingDeposits || displayedDeposits.length === 0} style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
                                Print Records 🖨️
                            </Button>
                        </div>
                        {user.role === 'admin' && (
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Start Date</label>
                                    <Input 
                                        type="date" 
                                        value={startDate} 
                                        onChange={(e) => setStartDate(e.target.value)} 
                                        disabled={isFetchingDeposits} 
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>End Date</label>
                                    <Input 
                                        type="date" 
                                        value={endDate} 
                                        onChange={(e) => setEndDate(e.target.value)} 
                                        disabled={isFetchingDeposits} 
                                    />
                                </div>
                                <p style={{ fontSize: '0.875rem', color: PrimaryColor, fontWeight: 'bold' }}>
                                    Total: {formatCurrency(totalDisplayedAmount)}
                                </p>
                            </div>
                        )}
                    </CardHeader>
                    <CardContent>
                        {/* Hidden Printable Component linked by ref */}
                        <div ref={printAreaRef} style={{ display: 'none' }}>
                            <PrintableBankDeposits deposits={displayedDeposits} userRole={user.role} dateRange={{ start: startDate, end: endDate }} />
                        </div>
                        
                        {/* Display Table (Visible on screen) */}
                        <div style={{ overflowX: 'auto' }}>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        {user.role === "admin" && <TableHead>User ID</TableHead>}
                                        <TableHead>Amount</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead>Initiated At</TableHead>
                                        {user.role === "admin" && <TableHead>Actions</TableHead>}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isFetchingDeposits ? (
                                        <TableRow>
                                            <TableCell colSpan={user.role === "admin" ? 5 : 4} style={{ textAlign: 'center', color: '#6b7280' }}>
                                                Loading deposits...
                                            </TableCell>
                                        </TableRow>
                                    ) : displayedDeposits.length > 0 ? (
                                        displayedDeposits.map(d => (
                                            <TableRow key={d.id}>
                                                {user.role === "admin" && <TableCell>{d.initiated_by_user_id}</TableCell>}
                                                <TableCell>{formatCurrency(d.amount)}</TableCell>
                                                <TableCell>{d.description}</TableCell>
                                                <TableCell>{formatDate(d.initiated_at)}</TableCell>
                                                {user.role === "admin" && (
                                                    <TableCell>
                                                        <Button variant="destructive" onClick={() => handleDeleteDeposit(d.id)} style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>
                                                            Delete
                                                        </Button>
                                                    </TableCell>
                                                )}
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={user.role === "admin" ? 5 : 4} style={{ textAlign: 'center', color: '#6b7280' }}>
                                                No deposits found for the current view.
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
}