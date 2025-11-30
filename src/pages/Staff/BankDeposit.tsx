// src/pages/Staff/BankDeposit.tsx
"use client";

import { useState, useEffect, FormEvent, CSSProperties, PropsWithChildren } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { useAuth } from "../../contexts/AuthContext";

// --- Styling Constants ---
const PrimaryColor = '#0B3D91';

// --- UI Components ---
const Button: React.FC<PropsWithChildren & React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'default' | 'destructive' }> = ({
    children, onClick, style, disabled, type = 'button', variant = 'default', ...props
}) => {
    const backgroundColor = variant === 'destructive' ? '#dc2626' : PrimaryColor;
    return (
        <button
            onClick={onClick}
            style={{
                padding: '0.5rem 1rem',
                cursor: disabled ? 'not-allowed' : 'pointer',
                backgroundColor: disabled ? '#ccc' : (style?.backgroundColor || backgroundColor),
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontWeight: '500',
                transition: 'background-color 0.2s',
                opacity: disabled ? 0.6 : 1,
                ...style
            }}
            disabled={disabled}
            type={type}
            {...props}
        >
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

const Table: React.FC<PropsWithChildren> = ({ children }) => <table style={{ width: '100%', borderCollapse: 'collapse' }}>{children}</table>;
const TableHeader: React.FC<PropsWithChildren> = ({ children }) => <thead>{children}</thead>;
const TableBody: React.FC<PropsWithChildren> = ({ children }) => <tbody>{children}</tbody>;
const TableRow: React.FC<PropsWithChildren> = ({ children }) => <tr style={{ borderBottom: '1px solid #eee' }}>{children}</tr>;
const TableHead: React.FC<PropsWithChildren> = ({ children }) => <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 'bold', borderBottom: '2px solid #ccc' }}>{children}</th>;
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

// --- Mock Data (for multiple staff) ---
const MOCK_DEPOSITS: Deposit[] = [
    { id: 1, amount: 500000, description: "Initial capital", initiated_at: new Date(Date.now() - 345600000).toISOString(), initiated_by_user_id: 'staff1' },
    { id: 2, amount: 150000, description: "Daily sales", initiated_at: new Date().toISOString(), initiated_by_user_id: 'staff2' },
    { id: 3, amount: 200000, description: "Daily sales", initiated_at: new Date().toISOString(), initiated_by_user_id: 'staff1' },
    { id: 4, amount: 100000, description: "Daily sales", initiated_at: new Date().toISOString(), initiated_by_user_id: 'staff3' },
];

// --- Helpers ---
const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(amount);

const formatDate = (date: string) =>
    new Date(date).toLocaleString();

const isToday = (dateString: string) => {
    const today = new Date();
    const d = new Date(dateString);
    return today.toDateString() === d.toDateString();
};

// --- Component ---
export default function StaffBankDepositsPage() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [deposits, setDeposits] = useState<Deposit[]>([]);
    const [newDeposit, setNewDeposit] = useState({ amount: "", description: "" });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!user || user.role !== "staff") {
            navigate("/unauthorized");
            return;
        }

        const storedData = localStorage.getItem('bankDeposits');
        const allDeposits: Deposit[] = storedData ? JSON.parse(storedData) : MOCK_DEPOSITS;

        if (!storedData) localStorage.setItem('bankDeposits', JSON.stringify(MOCK_DEPOSITS));

        const filtered = allDeposits
            .filter(d => d.initiated_by_user_id === user.id && isToday(d.initiated_at))
            .sort((a, b) => new Date(b.initiated_at).getTime() - new Date(a.initiated_at).getTime());

        setDeposits(filtered);
    }, [user, navigate]);

    if (!user) return null;

    const handleInput = (field: keyof typeof newDeposit) => (e: React.ChangeEvent<HTMLInputElement>) => {
        setNewDeposit(prev => ({ ...prev, [field]: e.target.value }));
    };

    const handleAddDeposit = (e: FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setLoading(true);
        setError(null);

        const amountNum = parseFloat(newDeposit.amount);
        const validation = depositSchema.safeParse({ amount: amountNum, description: newDeposit.description });
        if (!validation.success) {
            setError(validation.error.errors.map(err => err.message).join(", "));
            setLoading(false);
            return;
        }

        const storedData = localStorage.getItem('bankDeposits');
        const currentDeposits: Deposit[] = storedData ? JSON.parse(storedData) : MOCK_DEPOSITS;
        const nextId = currentDeposits.length ? Math.max(...currentDeposits.map(d => d.id)) + 1 : 1;

        const newRecord: Deposit = {
            id: nextId,
            amount: validation.data.amount,
            description: validation.data.description,
            initiated_at: new Date().toISOString(),
            initiated_by_user_id: user.id,
        };

        const updatedDeposits = [newRecord, ...currentDeposits];
        localStorage.setItem('bankDeposits', JSON.stringify(updatedDeposits));
        setDeposits(updatedDeposits.filter(d => d.initiated_by_user_id === user.id && isToday(d.initiated_at)));
        setNewDeposit({ amount: "", description: "" });
        setLoading(false);
    };

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6' }}>
            <nav style={{ borderBottom: '1px solid #e5e7eb', backgroundColor: '#fff', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Button style={{ backgroundColor: 'transparent', color: PrimaryColor, border: '1px solid #ccc' }} onClick={() => window.history.back()}>← Back</Button>
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
                                <Input type="number" placeholder="Amount" value={newDeposit.amount} onChange={handleInput("amount")} step="0.01" disabled={loading} />
                                <Input type="text" placeholder="Description" value={newDeposit.description} onChange={handleInput("description")} disabled={loading} />
                            </div>
                            <Button type="submit" style={{ width: '100%' }} disabled={loading}>{loading ? "Recording..." : "Record Deposit"}</Button>
                        </form>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Today's Deposits</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div style={{ overflowX: 'auto' }}>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Amount</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead>Initiated At</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {deposits.length > 0 ? deposits.map(d => (
                                        <TableRow key={d.id}>
                                            <TableCell>{formatCurrency(d.amount)}</TableCell>
                                            <TableCell>{d.description}</TableCell>
                                            <TableCell>{formatDate(d.initiated_at)}</TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={3} style={{ textAlign: 'center', color: '#6b7280' }}>
                                                No deposits found for today.
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
