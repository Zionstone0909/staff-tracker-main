"use client"

import { useState, useEffect, useCallback, ChangeEvent, PropsWithChildren, CSSProperties, useMemo } from "react"
import { Trash2, ChevronDown, ChevronUp, Search } from 'lucide-react';

// Define local placeholder components with inline styles
const PrimaryColor = '#0B3D91';
const DestructiveColor = '#dc2626';
const MutedColor = '#6b7280';
const LightBg = '#f3f4f6';

// --- UI Components ---
const Button: React.FC<PropsWithChildren & React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'default' | 'ghost' | 'destructive' | 'icon' }> = ({ children, onClick, style, disabled, type = 'button', variant = 'default', className, ...props }) => {
    let backgroundColor = PrimaryColor;
    let color = 'white';
    
    if (variant === 'ghost') {
        backgroundColor = 'transparent';
        color = PrimaryColor;
    } else if (variant === 'destructive') {
        backgroundColor = DestructiveColor;
    } else if (variant === 'icon') {
        backgroundColor = 'transparent';
        color = MutedColor;
    }

    const baseStyle: CSSProperties = {
        padding: variant === 'icon' ? '0.2rem' : '0.5rem 1rem',
        cursor: disabled ? 'not-allowed' : 'pointer',
        backgroundColor: disabled ? '#ccc' : backgroundColor,
        color: color,
        border: variant === 'icon' ? 'none' : '1px solid transparent',
        borderRadius: '4px',
        fontWeight: '500',
        transition: 'background-color 0.2s, opacity 0.2s',
        opacity: disabled ? 0.6 : 1,
        ...style
    };

    return (
        <button 
            onClick={onClick} 
            style={baseStyle} 
            disabled={disabled} 
            type={type} 
            {...props}
        >
            {children}
        </button>
    );
};

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
    <input {...props} style={{ padding: '0.6rem 0.8rem', border: '1px solid #ccc', borderRadius: '4px', width: '100%' }} />
);

// CardTitle and TableCell definitions were correctly updated in the prior response
const Card: React.FC<PropsWithChildren & { style?: CSSProperties }> = ({ children, style }) => <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1.5rem', marginBottom: '1.5rem', backgroundColor: '#fff', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)', ...style }}>{children}</div>;
const CardHeader: React.FC<PropsWithChildren> = ({ children }) => <div>{children}</div>;
const CardTitle: React.FC<PropsWithChildren & { style?: CSSProperties }> = ({ children, style }) => <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem', ...style }}>{children}</h2>;
const CardContent: React.FC<PropsWithChildren & { style?: CSSProperties }> = ({ children, style }) => <div style={{ paddingTop: '0.5rem', ...style }}>{children}</div>;

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
        <div style={{ 
            padding: '1rem', 
            backgroundColor: bgColor, 
            border: `1px solid ${borderColor}`, 
            color: textColor, 
            borderRadius: '4px', 
            marginBottom: '1rem',
            ...customStyle 
        }}>
            {children}
        </div>
    );
};
const AlertDescription: React.FC<PropsWithChildren> = ({ children }) => <p style={{ margin: 0 }}>{children}</p>;

const Table: React.FC<PropsWithChildren> = ({ children }) => <table style={{ width: '100%', borderCollapse: 'collapse' }}>{children}</table>;
const TableHeader: React.FC<PropsWithChildren> = ({ children }) => <thead>{children}</thead>;
const TableBody: React.FC<PropsWithChildren> = ({ children }) => <tbody>{children}</tbody>;
const TableRow: React.FC<PropsWithChildren> = ({ children }) => <tr style={{ borderBottom: '1px solid #eee' }}>{children}</tr>;

const TableHead: React.FC<PropsWithChildren & { style?: CSSProperties, onClick?: () => void, isSortable?: boolean }> = ({ children, style, onClick, isSortable = false }) => (
    <th 
        onClick={onClick} 
        style={{ 
            padding: '0.75rem', 
            textAlign: 'left', 
            fontWeight: 'bold', 
            borderBottom: '2px solid #ccc', 
            cursor: isSortable ? 'pointer' : 'default',
            ...style 
        }}
    >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            {children}
            {isSortable && <ChevronDown size={14} style={{ opacity: 0.5 }} />}
        </div>
    </th>
);

const TableCell: React.FC<PropsWithChildren & { colSpan?: number, style?: CSSProperties }> = ({ children, style, colSpan }) => <td colSpan={colSpan} style={{ padding: '0.75rem', ...style }}>{children}</td>;


// --- DATA TYPES AND MOCK DATA ---
interface Expense {
    id: number
    category: string
    description: string
    amount: number
    expense_date: string
    payment_method: "cash" | "transfer" | "check"
    // userId is used to filter staff-specific expenses
    userId: number
}

// Allowed expense categories for filtering/dropdowns
const EXPENSE_CATEGORIES = [
    "Fuel", "Salaries", "Maintenance", "Office Supplies", "Rent", "Utilities", "Travel", "Uncategorized"
];

// Mock Expenses: User 1 and 2 are Staff, User 99 is Admin/System
const INITIAL_MOCK_EXPENSES: Expense[] = [
    { id: 1, category: "Maintenance", description: "Oil change and tire replacement (User 1)", amount: 150000, expense_date: "2025-11-17", payment_method: "cash", userId: 1 },
    { id: 2, category: "Fuel", description: "Diesel for trucks (User 2)", amount: 80000, expense_date: "2025-11-15", payment_method: "transfer", userId: 2 },
    { id: 3, category: "Office Supplies", description: "Stationery and printer ink (User 1)", amount: 15000, expense_date: "2025-11-10", payment_method: "check", userId: 1 },
    { id: 4, category: "Salaries", description: "Monthly staff salary payment (Admin)", amount: 1200000, expense_date: "2025-11-01", payment_method: "transfer", userId: 99 }, 
    { id: 5, category: "Fuel", description: "Petrol for company car (User 1)", amount: 12000, expense_date: "2025-11-18", payment_method: "cash", userId: 1 },
    { id: 6, category: "Travel", description: "Flight ticket to Lagos (User 2)", amount: 50000, expense_date: "2025-11-19", payment_method: "transfer", userId: 2 },
    { id: 7, category: "Utilities", description: "Electricity bill (User 1)", amount: 25000, expense_date: "2025-11-20", payment_method: "transfer", userId: 1 },
    { id: 8, category: "Maintenance", description: "Server maintenance (Admin)", amount: 500000, expense_date: "2025-11-20", payment_method: "check", userId: 99 },
    // Mock expense for Staff ID 5 (for testing the new flow)
    { id: 9, category: "Travel", description: "Toll fare and parking (User 5)", amount: 3000, expense_date: "2025-11-21", payment_method: "cash", userId: 5 },
    { id: 10, category: "Office Supplies", description: "New external monitor (User 5)", amount: 90000, expense_date: "2025-11-12", payment_method: "transfer", userId: 5 }, // Older expense
];


type SortKeys = keyof Pick<Expense, 'amount' | 'expense_date'>;
type SortDirection = 'asc' | 'desc';

// --- CORE COMPONENT ---
const CompanyExpensesPageBase: React.FC<{ role: 'admin' | 'staff' }> = ({ role }) => {
    
    const isAdmin = role === 'admin';
    // MOCK STAFF ID: For staff roles, we assign a specific ID (e.g., 5). 
    // This allows testing the filtering/submission for a specific staff member.
    const currentUserId = isAdmin ? 99 : 5; // Admin ID is 99, Staff ID is 5 (mock)

    const [expenses, setExpenses] = useState<Expense[]>([])
    const [newExpense, setNewExpense] = useState<Omit<Expense, "id" | "userId">>({
        category: EXPENSE_CATEGORIES[0], 
        description: "",
        amount: 0,
        expense_date: new Date().toISOString().split('T')[0],
        payment_method: "cash",
    })
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const [successMessage, setSuccessMessage] = useState<string | null>(null)

    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [sortBy, setSortBy] = useState<SortKeys>('expense_date');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
    
    // Helper to get the date 7 days ago
    const getSevenDaysAgo = () => {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        return d.toISOString().split('T')[0];
    };

    // Data Persistence Logic
    useEffect(() => {
        const persistedExpenses = localStorage.getItem("companyExpenses")
        if (persistedExpenses) {
            try {
                setExpenses(JSON.parse(persistedExpenses))
            } catch (e) {
                setExpenses(INITIAL_MOCK_EXPENSES)
            }
        } else {
            setExpenses(INITIAL_MOCK_EXPENSES)
            localStorage.setItem("companyExpenses", JSON.stringify(INITIAL_MOCK_EXPENSES))
        }
    }, []) 

    const getNextId = useCallback(() => {
        return expenses.length ? Math.max(...expenses.map(e => e.id)) + 1 : 1
    }, [expenses])

    const updateLocalStorage = useCallback((updatedExpenses: Expense[]) => {
        localStorage.setItem("companyExpenses", JSON.stringify(updatedExpenses));
        setExpenses(updatedExpenses);
    }, []);

    const handleDeleteExpense = (id: number) => {
        // PERMISSION CHECK: Only Admin can delete
        if (!isAdmin) {
            setErrorMessage("You do not have permission to delete expenses. This feature is restricted to Admin.");
            setSuccessMessage(null);
            return;
        }

        if (window.confirm("Are you sure you want to delete this expense record?")) {
            const updatedExpenses = expenses.filter(e => e.id !== id);
            updateLocalStorage(updatedExpenses);
            setSuccessMessage(`Expense ID ${id} deleted successfully.`);
            setErrorMessage(null);
        }
    };

    const handleSort = (key: SortKeys) => {
        if (sortBy === key) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(key);
            setSortDirection('desc');
        }
    };
    
    const handleAddExpense = () => {
        // PERMISSION CHANGE: Staff (currentUserId > 0) can now record expenses, Admin (ID 99) can too.
        if (currentUserId === null) {
            setErrorMessage("Cannot determine user ID for recording expense.");
            setSuccessMessage(null);
            return;
        }

        if (!newExpense.description || !newExpense.amount || !newExpense.expense_date || newExpense.amount <= 0) {
            setErrorMessage("Description, a positive amount, and date are required.")
            setSuccessMessage(null)
            return
        }

        const expenseToAdd: Expense = { 
            id: getNextId(), 
            ...newExpense,
            category: newExpense.category || "Uncategorized",
            // Use the staff's actual ID (currentUserId) for recording.
            userId: currentUserId 
        }

        const updatedExpenses = [...expenses, expenseToAdd];
        updateLocalStorage(updatedExpenses);
        
        setSuccessMessage(`Expense recorded successfully for User ID ${currentUserId}!`)
        setErrorMessage(null)
        
        setNewExpense({ 
            category: EXPENSE_CATEGORIES[0], 
            description: "", 
            amount: 0, 
            expense_date: new Date().toISOString().split('T')[0], 
            payment_method: "cash" 
        })
    }

    const handleAmountChange = (e: ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const amount = parseFloat(value) || 0;
        setNewExpense({ ...newExpense, amount });
    };
    
    // Summary expenses calculated for the last 7 days (all users)
    const summaryExpenses = useMemo(() => {
        const sevenDaysAgo = getSevenDaysAgo();
        // The summary card always reflects ALL company expenses over the last 7 days (Admin view only)
        return expenses.filter(e => e.expense_date >= sevenDaysAgo && e.userId !== 99); // Exclude system expenses from this tally if desired, but keeping all for clarity.
    }, [expenses]);
    
    // Summary Calculation for the last 7 days
    const expenseSummary = useMemo(() => {
        const total = summaryExpenses.reduce((sum, e) => sum + e.amount, 0);
        const breakdown: { [key: string]: number } = {};
        summaryExpenses.forEach(e => {
            breakdown[e.category] = (breakdown[e.category] || 0) + e.amount;
        });
        return { total, breakdown };
    }, [summaryExpenses]);


    // Table Data: Staff get their expenses for 7 days (their own only); Admin gets all (full history).
    const filteredAndSortedExpenses = useMemo(() => {
        let currentExpenses = [...expenses];
        const sevenDaysAgo = getSevenDaysAgo();
        
        // **STAFF RESTRICTIONS** (Role 'staff' and currentUserId is a staff ID)
        if (!isAdmin && currentUserId !== 99) {
            // 1. Filter by Current User ID (Staff sees theirs only)
            currentExpenses = currentExpenses.filter(expense => expense.userId === currentUserId);
            
            // 2. Filter by Last 7 Days (Staff history is 7 days)
            currentExpenses = currentExpenses.filter(expense => expense.expense_date >= sevenDaysAgo);
        }
        // Admin sees all expenses (all users, all history) by default, no need for the initial filters above.

        // 3. Search and Category Filtering (Applies to both roles, on their respective datasets)
        currentExpenses = currentExpenses.filter(expense => {
            const matchesCategory = !filterCategory || expense.category === filterCategory;
            const matchesSearch = !searchTerm || 
                expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                expense.category.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesCategory && matchesSearch;
        });

        // 4. Sorting
        currentExpenses.sort((a, b) => {
            let comparison = 0;
            if (sortBy === 'amount') {
                comparison = a.amount - b.amount;
            } else if (sortBy === 'expense_date') {
                if (a.expense_date > b.expense_date) comparison = 1;
                if (a.expense_date < b.expense_date) comparison = -1;
            }
            
            return sortDirection === 'asc' ? comparison : comparison * -1;
        });

        return currentExpenses;
    }, [expenses, searchTerm, filterCategory, sortBy, sortDirection, isAdmin, currentUserId]);

    // --- RENDER ---
    return (
        <div style={{ minHeight: '100vh', backgroundColor: LightBg }}>
            <nav style={{ borderBottom: '1px solid #e5e7eb', backgroundColor: '#fff', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Button variant="ghost" onClick={() => window.history.back()}>
                    ← Back
                </Button>
                <Button variant="destructive" onClick={() => {
                    localStorage.removeItem("currentUser");
                    window.location.href = "/login";
                }}>
                    Logout (Mock)
                </Button>
            </nav>

            <main style={{ maxWidth: '80rem', margin: '0 auto', padding: '2rem 1rem' }}>
                <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
                    Company Expenses ({role.toUpperCase()} - User ID: {currentUserId})
                </h1>
                
                {/* --- EXPENSE SUMMARY (7 Days) --- */}
                {isAdmin && (
                    <Card style={{backgroundColor: '#e3f2fd', marginBottom: '2rem'}}>
                        <CardTitle style={{fontSize: '1.25rem', marginBottom: '0.75rem', color: PrimaryColor}}>
                            💸 Company Summary (Last 7 Days)
                        </CardTitle>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                            <Card style={{ padding: '1.5rem', backgroundColor: '#fff', border: '1px solid #b3e5fc' }}>
                                <CardTitle style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: PrimaryColor }}>Total Expenses</CardTitle>
                                <div style={{ fontSize: '2.5rem', fontWeight: '700', color: PrimaryColor }}>
                                    ₦{expenseSummary.total.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                                </div>
                                <p style={{ fontSize: '0.75rem', color: MutedColor, margin: 0 }}>Total amount recorded in the last 7 days.</p>
                            </Card>

                            <Card style={{ padding: '1.5rem', backgroundColor: '#fff', border: '1px solid #b3e5fc' }}>
                                <CardTitle style={{ fontSize: '1.125rem', marginBottom: '0.75rem' }}>Category Breakdown</CardTitle>
                                <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.875rem' }}>
                                    {Object.entries(expenseSummary.breakdown).sort(([, a], [, b]) => b - a).map(([category, amount]) => (
                                        <li key={category} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0', borderBottom: '1px dotted #eee' }}>
                                            <span style={{ fontWeight: '500' }}>{category}</span>
                                            <span>₦{amount.toLocaleString("en-NG", { minimumFractionDigits: 2 })}</span>
                                        </li>
                                    ))}
                                </ul>
                            </Card>
                        </div>
                    </Card>
                )}
                {/* ------------------------- */}
                
                {/* --- RECORD EXPENSE (Staff & Admin) --- */}
                {/* Now available to both Admin and Staff (based on currentUserId being set) */}
                <Card style={{ marginBottom: '2rem' }}>
                    <CardHeader>
                        <CardTitle>Record {isAdmin ? 'Company' : 'Personal'} Expense</CardTitle>
                    </CardHeader>
                    <CardContent style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {/* Alert Messages */}
                        {errorMessage && (
                            <Alert variant="destructive">
                                <AlertDescription>⚠️ {errorMessage}</AlertDescription>
                            </Alert>
                        )}
                        {successMessage && (
                            <Alert variant="default" customStyle={{ backgroundColor: '#d4edda', borderColor: '#c3e6cb', color: '#155724' }}> 
                                <AlertDescription>✅ {successMessage}</AlertDescription>
                            </Alert>
                        )}
                        {/* Form Fields */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                            {/* Category select dropdown */}
                            <select
                                style={{ border: '1px solid #ccc', borderRadius: '4px', padding: '0.6rem 0.8rem', fontSize: '1rem', color: '#374151', backgroundColor: 'white', width: '100%' }}
                                value={newExpense.category}
                                onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                            >
                                {EXPENSE_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </select>

                            <Input
                                type="text"
                                placeholder="Description (Required)"
                                value={newExpense.description}
                                onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                            />
                            <Input
                                type="number"
                                placeholder="Amount (Required)"
                                value={newExpense.amount === 0 ? "" : newExpense.amount}
                                onChange={handleAmountChange}
                                min="0.01"
                                step="0.01"
                            />
                            <Input
                                type="date"
                                placeholder="Date (Required)"
                                value={newExpense.expense_date}
                                onChange={(e) => setNewExpense({ ...newExpense, expense_date: e.target.value })}
                            />
                            <select
                                style={{ border: '1px solid #ccc', borderRadius: '4px', padding: '0.6rem 0.8rem', fontSize: '1rem', color: '#374151', backgroundColor: 'white', width: '100%' }}
                                value={newExpense.payment_method}
                                onChange={(e) => setNewExpense({ ...newExpense, payment_method: e.target.value as Expense["payment_method"] })}
                            >
                                <option value="cash">Cash</option>
                                <option value="transfer">Transfer</option>
                                <option value="check">Check</option>
                            </select>
                        </div>

                        <Button onClick={handleAddExpense} style={{ width: '100%' }}>
                            Record Expense
                        </Button>
                    </CardContent>
                </Card>
                {/* ----------------------------------- */}

                <Card>
                    <CardHeader>
                        <CardTitle style={{ marginBottom: isAdmin ? '1rem' : '0.5rem' }}>
                            📊 Expense Records ({isAdmin ? "All" : "Your Last 7 Days"})
                        </CardTitle>
                        {
                           
                        }
                    </CardHeader>
                    <CardContent>
                        {/* --- Search and Filter Bar --- */}
                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', alignItems: 'center' }}>
                            <div style={{ position: 'relative', flexGrow: 1 }}>
                                <Input
                                    type="text"
                                    placeholder="Search description or category..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    style={{ paddingLeft: '3rem' }} 
                                />
                                <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: MutedColor }} />
                            </div>
                            
                            <select
                                style={{ border: '1px solid #ccc', borderRadius: '4px', padding: '0.6rem 0.8rem', fontSize: '1rem', color: '#374151', backgroundColor: 'white', width: '250px' }}
                                value={filterCategory}
                                onChange={(e) => setFilterCategory(e.target.value)}
                            >
                                <option value="">Filter by Category (All)</option>
                                {EXPENSE_CATEGORIES.map(cat => <option key={`filter-${cat}`} value={cat}>{cat}</option>)}
                            </select>
                        </div>
                        {/* ------------------------------ */}

                        <div style={{ overflowX: 'auto' }}>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Category</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead 
                                            style={{ textAlign: 'right' }} 
                                            isSortable 
                                            onClick={() => handleSort('amount')}
                                        >
                                            Amount (₦) {sortBy === 'amount' && (sortDirection === 'desc' ? <ChevronDown size={14} /> : <ChevronUp size={14} />)}
                                        </TableHead> 
                                        <TableHead>Payment Method</TableHead>
                                        <TableHead 
                                            isSortable 
                                            onClick={() => handleSort('expense_date')}
                                        >
                                            Date {sortBy === 'expense_date' && (sortDirection === 'desc' ? <ChevronDown size={14} /> : <ChevronUp size={14} />)}
                                        </TableHead>
                                        <TableHead style={{ width: isAdmin ? '50px' : 'auto', textAlign: isAdmin ? 'center' : 'left' }}>
                                            {isAdmin ? 'Actions' : 'User ID'} {/* Staff view: shows User ID instead of actions */}
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredAndSortedExpenses.length > 0 ? (
                                        filteredAndSortedExpenses.map((expense) => (
                                            <TableRow key={expense.id}>
                                                <TableCell style={{ fontWeight: '500' }}>{expense.category}</TableCell>
                                                <TableCell>{expense.description}</TableCell>
                                                <TableCell style={{ textAlign: 'right', fontWeight: '600' }}>₦{expense.amount.toLocaleString("en-NG", { minimumFractionDigits: 2 })}</TableCell>
                                                <TableCell>{expense.payment_method}</TableCell>
                                                <TableCell>{expense.expense_date}</TableCell>
                                                <TableCell style={{ textAlign: 'center' }}>
                                                    {isAdmin ? (
                                                        <Button 
                                                            variant="icon" 
                                                            onClick={() => handleDeleteExpense(expense.id)}
                                                            style={{ color: DestructiveColor }}
                                                        >
                                                            <Trash2 size={16} />
                                                        </Button>
                                                    ) : (
                                                        // Staff view: show User ID instead of action button
                                                        <span style={{ color: MutedColor, fontSize: '0.75rem' }}>{expense.userId}</span>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={6} style={{ textAlign: 'center', color: MutedColor, padding: '1.5rem 0' }}>
                                                {isAdmin 
                                                    ? "No expenses found matching the current criteria." 
                                                    : "No personal expenses found in the last 7 days matching the current criteria."
                                                }
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

// Staff-specific export: Passes 'staff' role
export default function StaffCompanyExpensesPage() {
    return <CompanyExpensesPageBase role="staff" />;
}