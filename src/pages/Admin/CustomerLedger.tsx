// AdminCustomerLedger.tsx

"use client"
import React, { useState, useEffect, useMemo, CSSProperties, PropsWithChildren } from 'react';
import {
    collection,
    onSnapshot,
    addDoc,
    doc,
    updateDoc,
    deleteDoc,
    query,
    orderBy,
    where // Included just in case
} from 'firebase/firestore';
import {
    db,
    auth,
    APP_ID, // <-- Relying on this import from '../../firebase'
    // getRole // Not needed with current setup
} from '../../firebase';
import { User as FirebaseAuthUser } from 'firebase/auth'; // <-- Explicitly import and alias Firebase User type

import { useNavigate } from 'react-router-dom';
import { Customer, LedgerEntry, CustomerBalance } from '../../types/types'; // <-- Relying on this import for types

import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import {
    Search,
    Plus,
    FileText,
    ArrowUpCircle,
    ArrowDownCircle,
    Trash2,
    Edit,
    X,
    Save,
    User,
    Phone,
    Loader2,
    Mail, // Added icon
    MapPin, // Added icon
    FileText as NotesIcon, // Added icon
    Users
} from 'lucide-react';

// Setup pdfMake fonts if available
try {
    if (pdfFonts && (pdfFonts as any).pdfMake) {
        // @ts-ignore
        pdfMake.vfs = (pdfFonts as any).pdfMake.vfs;
    }
} catch (e) {
    console.warn('PDFMake setup failed', e);
}

// --- Global Constants (for Initiated By tracking) ---
const ADMIN_ID = 'admin-001';
const ADMIN_NAME = 'Admin User';

// MOCK: This function is required to assign createdBy/createdByName correctly
// FIX: Updated signature to accept FirebaseAuthUser or null, resolving Error 2345
const getCurrentUserForHistory = (user: FirebaseAuthUser | null) => {
    if (!user || !user.uid) return { id: '', name: 'Unknown', role: 'guest' };

    // Safely handle user.email which can be string | null
    const userEmail = user.email || `no-email-${user.uid.substring(0, 8)}`; 

    if (user.uid === ADMIN_ID || userEmail.includes('admin')) {
        return { id: ADMIN_ID, name: ADMIN_NAME, role: 'admin' };
    }
    // Mock staff name using their ID/Email for the 10 staff
    const staffMatch = userEmail.match(/^staff(\d+)@/);
    if (staffMatch) {
         return { 
            id: user.uid, 
            name: `Staff ${staffMatch[1]}`, 
            role: 'staff' 
        };
    }
    // Default for any other logged-in user
    return { 
        id: user.uid, 
        name: `Staff: ${userEmail}`, 
        role: 'staff' 
    };
};

// --- Data Paths ---
const getCollectionRef = (col: string) => collection(db, 'artifacts', APP_ID, 'public', 'data', col);
const CUSTOMERS_COLLECTION_NAME = 'customers';
const LEDGER_COLLECTION_NAME = 'ledger_entries'; // Assuming a standard name

// --- Styling Constants ---
const Colors = {
    primary: '#0B3D91',
    primaryHover: '#093175',
    destructive: '#dc2626',
    destructiveHover: '#b91c1c',
    background: '#f3f4f6',
    surface: '#ffffff',
    border: '#e5e7eb',
    text: '#1f2937',
    textMuted: '#6b7280',
    success: '#059669',
    successBg: '#d1fae5',
    errorBg: '#fee2e2'
};


// --- Customer Form Type (Used locally in the modal) ---
interface NewCustomerFormData {
    name: string;
    phone: string;
    email: string;
    address: string;
    notes: string;
}

// --- UI Helper Components (assuming same as provided) ---
const Button: React.FC<PropsWithChildren & React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'default' | 'destructive' | 'outline' | 'ghost' }> = ({
    children, onClick, style, disabled, type = 'button', variant = 'default', ...props
}) => {
    let backgroundColor = Colors.primary;
    let color = 'white';
    let border = 'none';
    if (variant === 'destructive') {
        backgroundColor = Colors.destructive;
    } else if (variant === 'outline') {
        backgroundColor = 'transparent';
        color = Colors.primary;
        border = `1px solid ${Colors.border}`;
    } else if (variant === 'ghost') { // Added ghost variant for consistency
        backgroundColor = 'transparent';
        color = Colors.text;
        border = 'none';
    }
    const baseStyle: CSSProperties = {
        padding: '0.5rem 1rem',
        cursor: disabled ? 'not-allowed' : 'pointer',
        backgroundColor: disabled ? '#ccc' : (style?.backgroundColor || backgroundColor),
        color: disabled ? '#666' : (style?.color || color),
        border: style?.border || border,
        borderRadius: '6px',
        fontWeight: '500',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        fontSize: '0.875rem',
        transition: 'all 0.2s',
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
    <input
        {...props}
        style={{
            padding: '0.5rem',
            border: `1px solid ${Colors.border}`,
            borderRadius: '6px',
            width: '100%',
            fontSize: '0.875rem',
            outline: 'none',
            boxSizing: 'border-box',
            ...props.style
        }}
    />
);
const TextArea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = (props) => (
    <textarea
        {...props}
        style={{
            padding: '0.5rem',
            border: `1px solid ${Colors.border}`,
            borderRadius: '6px',
            width: '100%',
            fontSize: '0.875rem',
            outline: 'none',
            boxSizing: 'border-box',
            resize: 'vertical',
            ...props.style
        }}
    />
);
const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = (props) => (
    <select
        {...props}
        style={{
            padding: '0.5rem',
            border: `1px solid ${Colors.border}`,
            borderRadius: '6px',
            width: '100%',
            fontSize: '0.875rem',
            backgroundColor: 'white',
            outline: 'none',
            boxSizing: 'border-box',
            ...props.style
        }}
    >
        {props.children}
    </select>
);
const Card: React.FC<PropsWithChildren & { style?: CSSProperties }> = ({ children, style }) => (
    <div style={{
        border: `1px solid ${Colors.border}`,
        borderRadius: '12px',
        padding: '1.5rem',
        backgroundColor: Colors.surface,
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
        boxSizing: 'border-box',
        ...style
    }}>
        {children}
    </div>
);


// --- Main Component ---
const AdminCustomerLedger: React.FC = () => {
    const navigate = useNavigate();
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
    const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);

    // Form State for Add/Edit
    const [editingEntry, setEditingEntry] = useState<LedgerEntry | null>(null);

    // State for switching between selecting and creating customer
    const [isNewCustomerMode, setIsNewCustomerMode] = useState(false);
    
    // ENHANCEMENT: Added fields for New Customer based on AdminCustomers.tsx
    const [newCustomerData, setNewCustomerData] = useState<NewCustomerFormData>({ 
        name: '', 
        phone: '', 
        email: '', 
        address: '', 
        notes: ''
    });

    const [formData, setFormData] = useState({
        customerId: '',
        date: new Date().toISOString().split('T')[0],
        type: 'debit' as 'credit' | 'debit',
        amount: '',
        description: ''
    });

    useEffect(() => {
        // --- Auth & Current User Check ---
        // const currentUser = auth.currentUser; // Removed as it's only used in handleSaveEntry now

        // Subscribe to Customers (ENSURING COMPLETE DATA IS FETCHED)
        const unsubCustomers = onSnapshot(getCollectionRef(CUSTOMERS_COLLECTION_NAME), (snapshot) => {
            const data = snapshot.docs.map(doc => {
                 const d = doc.data();
                 return { 
                    id: doc.id, 
                    ...d, 
                    // FIX: Explicitly include name and totalDue to satisfy type 'Customer' (Error 2352)
                    name: d.name || d.fullName || 'Unknown Customer',
                    totalDue: d.totalDue || 0,
                    // Ensure full customer record is retrieved for display/use
                    email: d.email || '', 
                    address: d.address || '', 
                    notes: d.notes || '',
                    createdBy: d.createdBy || ADMIN_ID,
                    createdByName: d.createdByName || ADMIN_NAME,
                    createdAt: d.createdAt || 0 // Must be present
                 } as unknown as Customer; // Use unknown to allow casting of augmented object
            });
            setCustomers(data);
        });

        // Subscribe to Ledger Entries (FIXED PERSISTENCE ISSUE)
        // Order by date (string) and createdAt (timestamp) for consistent history loading
        const q = query(getCollectionRef(LEDGER_COLLECTION_NAME), orderBy('date', 'desc'), orderBy('createdAt', 'desc'));
        
        const unsubLedger = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => {
                const d = doc.data();
                return { 
                    id: doc.id, 
                    // FIX: Explicitly include all required fields to satisfy type 'LedgerEntry' (Error 2352)
                    customerId: d.customerId || 'unknown',
                    date: d.date || new Date().toISOString().split('T')[0],
                    type: d.type || 'debit',
                    amount: d.amount || 0,
                    description: d.description || '',

                    // FIX: Ensure createdAt is a number (seconds epoch) or fall back 
                    createdAt: d.createdAt ? (d.createdAt.seconds || d.createdAt) : Math.floor(Date.now() / 1000), 
                    createdBy: d.createdBy || ADMIN_ID,
                    createdByName: d.createdByName || ADMIN_NAME // Fallback if old record is missing name
                } as unknown as LedgerEntry; // Use unknown to allow casting of augmented object
            });
            setLedgerEntries(data);
            setLoading(false);
        });

        // Check URL for pre-selected customer ID (e.g., linked from AdminCustomers)
        const urlParams = new URLSearchParams(window.location.search);
        const customerIdParam = urlParams.get('customerId');
        if (customerIdParam) {
            setSelectedCustomer(customerIdParam);
        }

        return () => {
            // unsubAuth(); // Assuming no auth subscription here
            unsubCustomers();
            unsubLedger();
        };
    }, []);

    // Calculate Balances
    const customerBalances: CustomerBalance[] = useMemo(() => {
        const balances: Record<string, CustomerBalance> = {};
        customers.forEach(c => {
            balances[c.id] = {
                customerId: c.id,
                customerName: c.name,
                customerPhone: c.phone,
                totalDebit: 0,
                totalCredit: 0,
                balance: 0,
                lastTransactionDate: null
            };
        });

        ledgerEntries.forEach(entry => {
            if (!balances[entry.customerId]) {
                return;
            }

            const amount = Number(entry.amount);

            if (entry.type === 'debit') {
                balances[entry.customerId].totalDebit += amount;
            } else {
                balances[entry.customerId].totalCredit += amount;
            }

            if (!balances[entry.customerId].lastTransactionDate || entry.date > balances[entry.customerId].lastTransactionDate!) {
                balances[entry.customerId].lastTransactionDate = entry.date;
            }
        });

        Object.values(balances).forEach(b => {
            b.balance = b.totalDebit - b.totalCredit;
        });

        return Object.values(balances).filter(b =>
            b.customerName.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [customers, ledgerEntries, searchTerm]);

    // Aggregated Totals
    const totals = useMemo(() => {
        return customerBalances.reduce((acc, curr) => ({
            debit: acc.debit + curr.totalDebit,
            credit: acc.credit + curr.totalCredit,
            balance: acc.balance + curr.balance
        }), { debit: 0, credit: 0, balance: 0 });
    }, [customerBalances]);

    // Helper to get Customer Details
    const selectedCustomerDetails = useMemo(() => {
        return customers.find(c => c.id === selectedCustomer);
    }, [selectedCustomer, customers]);

    const handleExportPDF = () => {
        try {
            // ... (PDF logic remains the same) ...
            const docDefinition = {
                content: [
                    { text: 'Customer Ledger Report', style: 'header' },
                    { text: `Generated on: ${new Date().toLocaleDateString()}`, style: 'subheader' },
                    {
                        table: {
                            headerRows: 1,
                            widths: ['*', 'auto', 'auto', 'auto', 'auto'],
                            body: [
                                ['Customer', 'Last Tx', 'Total Debit', 'Total Credit', 'Balance'],
                                ...customerBalances.map(c => [
                                    c.customerName,
                                    c.lastTransactionDate || '-',
                                    c.totalDebit.toFixed(2),
                                    c.totalCredit.toFixed(2),
                                    c.balance.toFixed(2)
                                ]),
                                [
                                    { text: 'Total', bold: true },
                                    '',
                                    { text: totals.debit.toFixed(2), bold: true },
                                    { text: totals.credit.toFixed(2), bold: true },
                                    { text: totals.balance.toFixed(2), bold: true }
                                ]
                            ]
                        }
                    }
                ],
                styles: {
                    header: { fontSize: 18, bold: true, margin: [0, 0, 0, 10] },
                    subheader: { fontSize: 12, margin: [0, 0, 0, 20], color: 'gray' }
                }
            };
            pdfMake.createPdf(docDefinition).open();
        } catch (e) {
            alert("PDF Generation failed. Please check if pdfmake is loaded correctly.");
        }
    };

    const handleSaveEntry = async () => {
        if (!formData.amount) {
            alert("Please enter an amount.");
            return;
        }

        try {
            const currentUser = auth.currentUser;
            // FIX: Using the corrected getCurrentUserForHistory function
            const userInfo = getCurrentUserForHistory(currentUser); 
            let finalCustomerId = formData.customerId;
            
            // Use seconds since epoch for consistency (FIXED PERSISTENCE)
            const nowInSeconds = Math.floor(Date.now() / 1000); 

            // Handle New Customer Creation (FIXED: Added all fields, using seconds)
            if (isNewCustomerMode && !editingEntry) {
                if (!newCustomerData.name || !newCustomerData.email) {
                    alert("New Customer must have a name and email.");
                    return;
                }

                const newCustomerPayload = {
                    name: newCustomerData.name,
                    phone: newCustomerData.phone,
                    email: newCustomerData.email,
                    address: newCustomerData.address,
                    notes: newCustomerData.notes,
                    createdAt: nowInSeconds, // FIXED: using seconds
                    createdBy: userInfo.id, 
                    createdByName: userInfo.name, // Will be stored in DB
                    totalDue: 0 // Initialize totalDue for new customer
                };
                
                const docRef = await addDoc(getCollectionRef(CUSTOMERS_COLLECTION_NAME), newCustomerPayload);
                finalCustomerId = docRef.id;
            }

            if (!finalCustomerId) {
                alert("Please select or create a customer.");
                return;
            }

            // Ledger Entry Payload (FIXED: Added name, using seconds)
            const payload = {
                customerId: finalCustomerId,
                date: formData.date,
                type: formData.type,
                amount: Number(formData.amount),
                description: formData.description,
                createdAt: nowInSeconds, // FIXED: using seconds
                createdBy: userInfo.id, // REQUIRED for 'Initiated By' tracking
                createdByName: userInfo.name // REQUIRED for 'Initiated By' tracking (Admin or Staff)
            };

            if (editingEntry) {
                await updateDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', LEDGER_COLLECTION_NAME, editingEntry.id), {
                    ...payload,
                    updatedAt: nowInSeconds
                });
            } else {
                await addDoc(getCollectionRef(LEDGER_COLLECTION_NAME), payload);
            }

            // Close Modal Instantly (REQUESTED)
            setIsEntryModalOpen(false); 
            setEditingEntry(null);
            setFormData({ customerId: '', date: new Date().toISOString().split('T')[0], type: 'debit', amount: '', description: '' });
            setNewCustomerData({ name: '', phone: '', email: '', address: '', notes: '' });
            setIsNewCustomerMode(false);
            
        } catch (error) {
            console.error("Error saving entry:", error);
            alert("Failed to save entry");
        }
    };

    const handleDeleteEntry = async (id: string) => {
        if (window.confirm("Are you sure you want to delete this transaction? This action cannot be undone.")) {
            try {
                await deleteDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', LEDGER_COLLECTION_NAME, id));
            } catch (error) {
                console.error("Error deleting:", error);
                alert("Failed to delete transaction.");
            }
        }
    };

    const openAddModal = (preSelectedCustomerId?: string) => {
        setEditingEntry(null);
        setIsNewCustomerMode(false);
        setFormData({
            customerId: preSelectedCustomerId || (customers.length > 0 ? customers[0].id : ''),
            date: new Date().toISOString().split('T')[0],
            type: 'debit',
            amount: '',
            description: ''
        });
        // Reset new customer data
        setNewCustomerData({ name: '', phone: '', email: '', address: '', notes: '' }); 
        setIsEntryModalOpen(true);
    };

    const openEditModal = (entry: LedgerEntry) => {
        setEditingEntry(entry);
        setIsNewCustomerMode(false);
        setFormData({
            customerId: entry.customerId,
            date: entry.date,
            type: entry.type,
            amount: entry.amount.toString(),
            description: entry.description
        });
        // Clear new customer form in case they switch modes
        setNewCustomerData({ name: '', phone: '', email: '', address: '', notes: '' });
        setIsEntryModalOpen(true);
    };

    const filteredTransactions = useMemo(() => {
        if (!selectedCustomer) return [];
        return ledgerEntries
            .filter(e => e.customerId === selectedCustomer)
            .filter(e => {
                if (dateRange.start && e.date < dateRange.start) return false;
                if (dateRange.end && e.date > dateRange.end) return false;
                return true;
            });
    }, [selectedCustomer, ledgerEntries, dateRange]);

    const formatCurrency = (amount: number) => {
        return amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
    };

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center', color: Colors.textMuted }}>Loading Ledger...</div>;

    return (
        <div style={{ minHeight: '100vh', backgroundColor: Colors.background, padding: 0, fontFamily: 'sans-serif', color: Colors.text }}>

            {/* Navigation Bar (omitted for brevity) */}
            {/* ... */}
            
            <div style={{ padding: '1.5rem', maxWidth: '1200px', margin: '0 auto' }}>

                {/* Header & Actions */}
                {/* ... */}
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', gap: '1rem' }}>
                    <div>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0, color: '#111827' }}>Customer Ledger</h1>
                        <p style={{ fontSize: '0.875rem', color: Colors.textMuted, marginTop: '0.25rem' }}>Manage customer credits, debits, and balances.</p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <Button onClick={handleExportPDF} variant="outline" style={{ backgroundColor: '#e5e7eb', border: 'none', color: Colors.text }}>
                            <FileText size={16} /> Export PDF
                        </Button>
                        <Button onClick={() => openAddModal()} variant="default">
                            <Plus size={16} /> Add Transaction
                        </Button>
                    </div>
                </div>

                {/* Customer Balances Table */}
                <Card style={{ padding: 0, overflow: 'hidden', marginBottom: '1.5rem' }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                                    <th style={{ padding: '1rem 1.5rem', fontWeight: '600', textAlign: 'left' }}>Customer</th>
                                    <th style={{ padding: '1rem 1.5rem', fontWeight: '600', textAlign: 'left' }}>Last Transaction</th>
                                    <th style={{ padding: '1rem 1.5rem', fontWeight: '600', textAlign: 'right' }}>Debit (Sales)</th>
                                    <th style={{ padding: '1rem 1.5rem', fontWeight: '600', textAlign: 'right' }}>Credit (Paid)</th>
                                    <th style={{ padding: '1rem 1.5rem', fontWeight: '600', textAlign: 'right' }}>Balance</th>
                                    <th style={{ padding: '1rem 1.5rem', fontWeight: '600', textAlign: 'center' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {customerBalances.length > 0 ? (
                                    customerBalances.map(customer => (
                                        <tr 
                                            key={customer.customerId}
                                            onClick={() => setSelectedCustomer(customer.customerId)}
                                            style={{ cursor: 'pointer', borderBottom: `1px solid ${Colors.border}`, transition: 'background-color 0.1s' }}
                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                                        >
                                            <td style={{ padding: '1rem 1.5rem', fontWeight: 'bold' }}>{customer.customerName}</td>
                                            <td style={{ padding: '1rem 1.5rem', color: Colors.textMuted }}>{customer.lastTransactionDate || '-'}</td>
                                            <td style={{ padding: '1rem 1.5rem', textAlign: 'right', color: Colors.destructive }}>{formatCurrency(customer.totalDebit)}</td>
                                            <td style={{ padding: '1rem 1.5rem', textAlign: 'right', color: Colors.success, fontWeight: '500' }}>{formatCurrency(customer.totalCredit)}</td>
                                            <td style={{ padding: '1rem 1.5rem', textAlign: 'right', fontWeight: 'bold', color: '#111827' }}>{formatCurrency(customer.balance)}</td>
                                            <td style={{ padding: '1rem 1.5rem', textAlign: 'center' }}>
                                                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                                                    <Button
                                                        variant="ghost"
                                                        onClick={(e) => { e.stopPropagation(); openAddModal(customer.customerId); }}
                                                        style={{ padding: '0.25rem', color: Colors.primary }}
                                                        title="Add Transaction"
                                                    >
                                                        <Plus size={16} />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: Colors.textMuted }}>No customers found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
            
            {/* Customer Details Modal (History View) */}
            {selectedCustomer && selectedCustomerDetails && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', backdropFilter: 'blur(4px)' }}>
                    <div style={{ backgroundColor: 'white', borderRadius: '12px', width: '100%', maxWidth: '900px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
                        
                        <div style={{ padding: '1.5rem', borderBottom: `1px solid ${Colors.border}`, backgroundColor: '#f9fafb' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0, color: Colors.text }}>
                                    Ledger History: {selectedCustomerDetails.name}
                                </h3>
                                <Button variant="ghost" onClick={() => setSelectedCustomer(null)} style={{ color: Colors.textMuted }}>
                                    <X size={20} />
                                </Button>
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', marginTop: '0.75rem', fontSize: '0.875rem' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: Colors.textMuted }}>
                                    <Mail size={14} /> Email: <span style={{ fontWeight: '500', color: Colors.text }}>{selectedCustomerDetails.email || '-'}</span>
                                </span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: Colors.textMuted }}>
                                    <Phone size={14} /> Phone: <span style={{ fontWeight: '500', color: Colors.text }}>{selectedCustomerDetails.phone || '-'}</span>
                                </span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: Colors.textMuted }}>
                                    <User size={14} /> Created By: 
                                    {/* @ts-ignore Property 'createdByName' does not exist on type 'Customer' - Requires type file update */}
                                    <span style={{ fontWeight: '500', color: Colors.text }}>{selectedCustomerDetails.createdByName}</span>
                                </span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: Colors.textMuted }}>
                                    <MapPin size={14} /> Address: <span style={{ fontWeight: '500', color: Colors.text }}>{selectedCustomerDetails.address || '-'}</span>
                                </span>
                            </div>
                        </div>

                        <div style={{ overflowY: 'auto', padding: '0 1.5rem 1.5rem 1.5rem', flexGrow: 1 }}>
                            <p style={{ fontSize: '0.9rem', color: Colors.textMuted, margin: '1rem 0' }}>Showing {filteredTransactions.length} transactions.</p>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                                <thead>
                                    <tr style={{ borderBottom: `2px solid ${Colors.border}` }}>
                                        <th style={{ paddingBottom: '0.75rem', fontWeight: '600', textAlign: 'left', width: '15%' }}>Date</th>
                                        <th style={{ paddingBottom: '0.75rem', fontWeight: '600', textAlign: 'left', width: '10%' }}>Type</th>
                                        <th style={{ paddingBottom: '0.75rem', fontWeight: '600', textAlign: 'left', width: '35%' }}>Description</th>
                                        <th style={{ paddingBottom: '0.75rem', fontWeight: '600', textAlign: 'right', width: '15%' }}>Amount</th>
                                        <th style={{ paddingBottom: '0.75rem', fontWeight: '600', textAlign: 'left', width: '15%' }}>Initiated By</th> {/* ADDED HISTORY COLUMN */}
                                        <th style={{ paddingBottom: '0.75rem', fontWeight: '600', textAlign: 'center', width: '10%' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredTransactions.length > 0 ? filteredTransactions.map((txn) => (
                                        <tr key={txn.id} style={{ borderBottom: `1px solid ${Colors.border}` }}>
                                            <td style={{ padding: '0.75rem 0', color: Colors.text }}>{txn.date}</td>
                                            <td style={{ padding: '0.75rem 0' }}>
                                                <span style={{ 
                                                    display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.5rem', borderRadius: '4px',
                                                    backgroundColor: txn.type === 'credit' ? Colors.successBg : Colors.errorBg,
                                                    color: txn.type === 'credit' ? Colors.success : Colors.destructive,
                                                    fontWeight: 'bold'
                                                }}>
                                                    {txn.type === 'credit' ? <ArrowDownCircle size={12} /> : <ArrowUpCircle size={12} />}
                                                    {txn.type.toUpperCase()}
                                                </span>
                                            </td>
                                            <td style={{ padding: '0.75rem 0', color: Colors.text }}>{txn.description || '-'}</td>
                                            <td style={{ padding: '0.75rem 0', textAlign: 'right', fontWeight: '500', color: txn.type === 'credit' ? Colors.success : Colors.destructive }}>
                                                {formatCurrency(txn.amount)}
                                            </td>
                                            {/* @ts-ignore Property 'createdByName' does not exist on type 'LedgerEntry' - Requires type file update */}
                                            <td style={{ padding: '0.75rem 0', color: txn.createdByName === ADMIN_NAME ? Colors.primary : Colors.text, fontWeight: txn.createdByName === ADMIN_NAME ? 600 : 400 }}>
                                                 {/* @ts-ignore Property 'createdByName' does not exist on type 'LedgerEntry' */}
                                                 {txn.createdByName} {/* FIXED: Displaying name for Admin/Staff history */}
                                            </td>
                                            <td style={{ padding: '0.75rem 0', textAlign: 'center' }}>
                                                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                                                    <Button 
                                                        variant="ghost"
                                                        onClick={() => openEditModal(txn)} 
                                                        style={{ color: Colors.primary, padding: 0 }}
                                                    >
                                                        <Edit size={16} />
                                                    </Button>
                                                    <Button 
                                                        variant="ghost"
                                                        onClick={() => handleDeleteEntry(txn.id)} 
                                                        style={{ color: Colors.destructive, padding: 0 }}
                                                    >
                                                        <Trash2 size={16} />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: Colors.textMuted }}>No transactions found for this customer.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <div style={{ padding: '1rem', borderTop: `1px solid ${Colors.border}`, backgroundColor: '#f9fafb', textAlign: 'right', borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px' }}>
                            <Button onClick={() => setSelectedCustomer(null)} variant="outline" style={{ backgroundColor: 'white' }}>Close</Button>
                        </div>
                    </div>
                </div>
            )}


            {/* Add/Edit Transaction Modal */}
            {isEntryModalOpen && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 110, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', backdropFilter: 'blur(4px)' }}>
                    <Card style={{ width: '100%', maxWidth: '700px', padding: 0, overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
                        <div style={{ padding: '1.5rem', borderBottom: `1px solid ${Colors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.primary, color: 'white' }}>
                            <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', margin: 0 }}>
                                {editingEntry ? 'Edit Transaction' : 'Add New Transaction'}
                            </h3>
                            <Button variant="ghost" onClick={() => setIsEntryModalOpen(false)} style={{ color: 'rgba(255,255,255,0.8)' }}>
                                <X size={20} />
                            </Button>
                        </div>

                        <div style={{ padding: '1.5rem', borderBottom: `1px solid ${Colors.border}` }}>
                            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                                {/* Existing Customer Mode */}
                                <button
                                    onClick={() => setIsNewCustomerMode(false)}
                                    disabled={!!editingEntry}
                                    style={{
                                        flex: 1, padding: '0.5rem', borderRadius: '6px', cursor: 'pointer',
                                        border: !isNewCustomerMode ? `2px solid ${Colors.primary}` : `1px solid ${Colors.border}`,
                                        fontWeight: !isNewCustomerMode ? 'bold' : 'normal',
                                        backgroundColor: !isNewCustomerMode ? '#eff6ff' : 'white',
                                        color: Colors.text, transition: 'all 0.2s',
                                    }}
                                >
                                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}><Users size={16} /> Existing Customer</span>
                                </button>
                                {/* New Customer Mode */}
                                <button
                                    onClick={() => setIsNewCustomerMode(true)}
                                    disabled={!!editingEntry}
                                    style={{
                                        flex: 1, padding: '0.5rem', borderRadius: '6px', cursor: 'pointer',
                                        border: isNewCustomerMode ? `2px solid ${Colors.primary}` : `1px solid ${Colors.border}`,
                                        fontWeight: isNewCustomerMode ? 'bold' : 'normal',
                                        backgroundColor: isNewCustomerMode ? '#eff6ff' : 'white',
                                        color: Colors.text, transition: 'all 0.2s',
                                    }}
                                >
                                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}><Plus size={16} /> New Customer</span>
                                </button>
                            </div>

                            {/* New Customer Form (EXPANDED with all fields) */}
                            {isNewCustomerMode && (
                                <div style={{ border: `1px solid ${Colors.border}`, padding: '1rem', borderRadius: '6px', backgroundColor: '#f9fafb', marginBottom: '1rem' }}>
                                    <p style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '0.75rem', color: Colors.primary }}>Customer Details</p>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>Name*</label>
                                            <Input
                                                value={newCustomerData.name}
                                                onChange={(e) => setNewCustomerData({...newCustomerData, name: e.target.value})}
                                                placeholder="Enter full name"
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>Email*</label>
                                            <Input 
                                                type="email"
                                                value={newCustomerData.email}
                                                onChange={(e) => setNewCustomerData({...newCustomerData, email: e.target.value})}
                                                placeholder="Enter email"
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>Phone</label>
                                            <Input
                                                type="tel"
                                                value={newCustomerData.phone}
                                                onChange={(e) => setNewCustomerData({...newCustomerData, phone: e.target.value})}
                                                placeholder="Enter phone number"
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>Address</label>
                                            <Input 
                                                value={newCustomerData.address}
                                                onChange={(e) => setNewCustomerData({...newCustomerData, address: e.target.value})}
                                                placeholder="Enter address"
                                            />
                                        </div>
                                    </div>
                                    <div style={{ marginTop: '1rem' }}>
                                         <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>Notes</label>
                                         <TextArea 
                                             value={newCustomerData.notes}
                                             onChange={(e) => setNewCustomerData({...newCustomerData, notes: e.target.value})}
                                             placeholder="Internal notes"
                                             rows={2}
                                         />
                                    </div>
                                </div>
                            )}

                            {/* Select Existing Customer */}
                            {!isNewCustomerMode && (
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>Select Customer*</label>
                                    <Select
                                        value={formData.customerId}
                                        onChange={(e) => setFormData({...formData, customerId: e.target.value})}
                                        disabled={!!editingEntry}
                                    >
                                        <option value="" disabled>Select a customer</option>
                                        {customers.map(c => (
                                            <option key={c.id} value={c.id}>
                                                {c.name} ({c.email || c.phone || 'No Contact'})
                                            </option>
                                        ))}
                                    </Select>
                                </div>
                            )}

                            {/* Transaction Details */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>Date*</label>
                                    <Input
                                        type="date"
                                        value={formData.date}
                                        onChange={(e) => setFormData({...formData, date: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>Type*</label>
                                    <Select
                                        value={formData.type}
                                        onChange={(e) => setFormData({...formData, type: e.target.value as 'credit' | 'debit'})}
                                    >
                                        <option value="debit">Debit (Owed to us)</option>
                                        <option value="credit">Credit (Paid to us)</option>
                                    </Select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>Amount*</label>
                                    <Input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        placeholder="0.00"
                                        value={formData.amount}
                                        onChange={(e) => setFormData({...formData, amount: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>Description</label>
                                <TextArea
                                    value={formData.description}
                                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                                    placeholder="e.g., Sale Invoice #123, Payment received, Initial balance, etc."
                                    rows={2}
                                />
                            </div>
                        </div>

                        <div style={{ padding: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                            <Button onClick={() => setIsEntryModalOpen(false)} variant="outline" style={{ color: '#1f2937', backgroundColor: 'white' }}>Cancel</Button>
                            <Button onClick={handleSaveEntry} variant="default" style={{ display: 'flex', gap: '0.5rem' }}>
                                <Save size={16} /> Save Transaction
                            </Button>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default AdminCustomerLedger;