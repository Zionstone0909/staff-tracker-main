import React, { useState, useEffect, useMemo, PropsWithChildren, CSSProperties } from 'react';
import { db } from '../../firebase';
import {
    collection, query, orderBy, onSnapshot, doc, runTransaction,
    serverTimestamp, increment, Timestamp
} from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import {
    ShoppingCart, Plus, Minus, Trash2, CreditCard,
    Loader2, Search, Edit, History, LogOut, Save, 
    AlertTriangle, CheckCircle, User as UserIcon, X
} from 'lucide-react';
import { InventoryItem, Customer, SaleRecord, HistoryLog, CartItem, LegacyPaymentMethod, LedgerTransaction } from '../../types/types';
import { useAuth } from '../../contexts/AuthContext';

// --- STYLING CONSTANTS ---
const PrimaryColor = '#0B3D91';
const DestructiveColor = '#dc2626';
const MutedColor = '#6b7280';
const LightBg = '#f3f4f6';
const OutlineBorderColor = '#e5e7eb';

// --- UI COMPONENTS ---
const Button: React.FC<PropsWithChildren & React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'default' | 'ghost' | 'destructive' | 'icon' }> = ({ children, onClick, style, disabled, type = 'button', variant = 'default', ...props }) => {
    let backgroundColor = PrimaryColor;
    let color = 'white';
    let border = '1px solid transparent';
    let padding = '0.5rem 1rem';

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
    }

    const baseStyle: CSSProperties = {
        padding,
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
        gap: '0.5rem',
        ...style
    };

    return (
        <button onClick={onClick} style={baseStyle} disabled={disabled} type={type} {...props}>
            {children}
        </button>
    );
};

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
    <input {...props} style={{ padding: '0.6rem 0.8rem', border: '1px solid #ccc', borderRadius: '4px', width: '100%', boxSizing: 'border-box', height: 40, ...props.style }} />
);

const Card: React.FC<PropsWithChildren & { style?: CSSProperties }> = ({ children, style }) => <div style={{ border: '1px solid ' + OutlineBorderColor, borderRadius: '8px', padding: '1.5rem', marginBottom: '1.5rem', backgroundColor: '#fff', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)', ...style }}>{children}</div>;
const CardTitle: React.FC<PropsWithChildren & { style?: CSSProperties }> = ({ children, style }) => <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', ...style }}>{children}</h2>;
const Table: React.FC<PropsWithChildren & { style?: CSSProperties }> = ({ children, style }) => <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, ...style }}>{children}</table>;
const TableHeader: React.FC<PropsWithChildren> = ({ children }) => <thead>{children}</thead>;
const TableBody: React.FC<PropsWithChildren> = ({ children }) => <tbody>{children}</tbody>;
const TableRow: React.FC<PropsWithChildren & { style?: CSSProperties }> = ({ children, style }) => <tr style={{ borderBottom: '1px solid #eee', ...style }}>{children}</tr>;
const TableHead: React.FC<PropsWithChildren & { style?: CSSProperties }> = ({ children, style }) => (
    <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', borderBottom: '2px solid #ccc', backgroundColor: '#f9fafb', ...style }}>
        {children}
    </th>
);
const TableCell: React.FC<PropsWithChildren & { colSpan?: number, style?: CSSProperties }> = ({ children, style, colSpan }) => <td colSpan={colSpan} style={{ padding: '0.75rem', verticalAlign: 'middle', borderBottom: '1px solid #eee', ...style }}>{children}</td>;


// --- MAIN COMPONENT ---
const PAYMENT_METHODS: LegacyPaymentMethod[] = ["Cash", "Transfer", "POS", "Others"];

const AdminSalesPage: React.FC = () => {
    const navigate = useNavigate();

    // Auth State from Context (Prevents Logout Race Condition)
    const { user, initialized, logout } = useAuth();

    // Data State
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [allSales, setAllSales] = useState<SaleRecord[]>([]);
    const [historyLogs, setHistoryLogs] = useState<HistoryLog[]>([]);

    // POS / New Sale State
    const [searchTerm, setSearchTerm] = useState('');
    const [customerSearchTerm, setCustomerSearchTerm] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [discount, setDiscount] = useState(0);
    const [amountPaid, setAmountPaid] = useState(0);
    const [paymentMethod, setPaymentMethod] = useState<LegacyPaymentMethod>(PAYMENT_METHODS[0]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [posMessage, setPosMessage] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    // UI View State
    const [activeTab, setActiveTab] = useState<'pos' | 'history'>('pos');

    // Modal State
    const [editingSale, setEditingSale] = useState<SaleRecord | null>(null);
    const [deletingSaleId, setDeletingSaleId] = useState<string | null>(null);

    /* ====================================================================== */
    /* AUTH CHECK                                                             */
    /* ====================================================================== */
    useEffect(() => {
        // Only redirect if initialization is complete AND user is missing
        if (initialized && !user) {
            navigate('/login');
        }
    }, [initialized, user, navigate]);

    /* ====================================================================== */
    /* DATA FETCHING                                                          */
    /* ====================================================================== */
    useEffect(() => {
        if (!user) return;

        // 1. Inventory
        const qInv = query(collection(db, 'inventory'), orderBy('name'));
        const unsubInv = onSnapshot(qInv, (snap) => {
            setInventory(snap.docs.map(d => ({ id: d.id, ...d.data() } as InventoryItem)));
        });

        // 2. Customers
        const qCust = query(collection(db, 'customers'), orderBy('name'));
        const unsubCust = onSnapshot(qCust, (snap) => {
            setCustomers(snap.docs.map(d => ({ id: d.id, ...d.data() } as Customer)));
        });

        // 3. Sales
        const qSales = query(collection(db, 'sales'), orderBy('timestamp', 'desc'));
        const unsubSales = onSnapshot(qSales, (snap) => {
            setAllSales(snap.docs.map(d => ({ id: d.id, ...d.data() } as SaleRecord)));
        });

        // 4. History
        const qHist = query(collection(db, 'salesHistory'), orderBy('timestamp', 'desc'));
        const unsubHistory = onSnapshot(qHist, (snap) => {
            setHistoryLogs(snap.docs.map(d => ({ id: d.id, ...d.data() } as HistoryLog)));
        });

        return () => { unsubInv(); unsubCust(); unsubSales(); unsubHistory(); };
    }, [user]);

    /* ====================================================================== */
    /* LOGIC                                                                  */
    /* ====================================================================== */
    const filteredInventory = useMemo(() => {
        const term = searchTerm.toLowerCase();
        return inventory.filter(item =>
            item.units_available > 0 &&
            (item.name.toLowerCase().includes(term) || item.sku?.toLowerCase().includes(term))
        );
    }, [inventory, searchTerm]);

    const filteredCustomers = useMemo(() => {
        const term = customerSearchTerm.toLowerCase();
        if (!term) return customers;
        return customers.filter(c =>
            c.name.toLowerCase().includes(term) ||
            ((c as any).fullName?.toLowerCase().includes(term))
        );
    }, [customers, customerSearchTerm]);

    const posCalculations = useMemo(() => {
        const subtotal = cart.reduce((acc, item) => acc + (item.unit_price * item.quantity), 0);
        const grandTotal = Math.max(0, subtotal - discount);
        const balance = Math.max(0, grandTotal - amountPaid);
        const excess = Math.max(0, amountPaid - grandTotal);
        return { subtotal, grandTotal, balance, excess };
    }, [cart, discount, amountPaid]);

    const addToCart = (item: InventoryItem) => {
        setCart(prev => {
            const exists = prev.find(p => p.id === item.id);
            if (exists) {
                return exists.quantity < item.units_available
                    ? prev.map(p => p.id === item.id ? { ...p, quantity: p.quantity + 1 } : p)
                    : prev;
            }
            return [...prev, { ...item, quantity: 1, units_available: item.units_available, sku: item.sku }];
        });
        setPosMessage(null);
    };

    const updateCartQty = (id: string, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.id === id) {
                const newQty = item.quantity + delta;
                const availableStock = inventory.find(i => i.id === id)?.units_available || item.units_available;

                if (newQty > 0 && newQty <= availableStock) return { ...item, quantity: newQty };
                if (newQty <= 0) return null; // Remove item if quantity is zero
            }
            return item;
        }).filter(Boolean) as CartItem[]);
    };

    const removeFromCart = (id: string) => setCart(prev => prev.filter(i => i.id !== id));

    const clearPOS = () => {
        setCart([]);
        setSelectedCustomer(null);
        setDiscount(0);
        setAmountPaid(0);
        setCustomerSearchTerm('');
        setPosMessage(null);
    };

    const handleCreateSale = async () => {
        if (!user || !selectedCustomer || cart.length === 0) {
            setPosMessage({ type: 'error', message: 'Please select a customer and add items to the cart.' });
            return;
        }

        setIsProcessing(true);

        try {
            await runTransaction(db, async (transaction) => {
                const saleRef = doc(collection(db, 'sales'));
                const { subtotal, grandTotal, balance, excess } = posCalculations;

                // 1. Update Inventory Stock
                for (const item of cart) {
                    const invRef = doc(db, 'inventory', item.id);
                    const invDoc = await transaction.get(invRef);

                    if (!invDoc.exists()) throw new Error(`Item ${item.name} missing from inventory.`);
                    const currentStock = (invDoc.data() as InventoryItem).units_available;

                    if (currentStock < item.quantity) throw new Error(`Stock mismatch for ${item.name}. Available: ${currentStock}, Needed: ${item.quantity}`);

                    transaction.update(invRef, { units_available: currentStock - item.quantity });
                }

                // 2. Create Sale Record
                const saleData: SaleRecord = {
                    saleId: saleRef.id,
                    customerId: selectedCustomer.id,
                    customerName: (selectedCustomer as any).fullName || selectedCustomer.name, 
                    items: cart.map(c => ({ itemId: c.id, itemName: c.name, quantity: c.quantity, price: c.unit_price, sku: c.sku })),
                    subtotal, discount, total: grandTotal, paid: amountPaid, balance, excess,
                    paymentMethod: paymentMethod as LegacyPaymentMethod, 
                    timestamp: Timestamp.now(),
                    userId: (user as any).uid, 
                    userEmail: user.email || 'N/A',
                    userRole: "admin",
                    userName: "Admin"
                };

                transaction.set(saleRef, saleData);

                // 3. Update Customer Ledger
                const ledgerRef = doc(collection(db, 'customerLedger', selectedCustomer.id, 'transactions'));
                const ledgerData: LedgerTransaction = {
                    transactionType: 'sale',
                    saleId: saleRef.id,
                    amount: grandTotal,
                    paid: amountPaid,
                    balance,
                    excess,
                    items: saleData.items,
                    date: Timestamp.now(),
                    timestamp: serverTimestamp(),
                    userId: (user as any).uid, 
                    status: balance > 0 ? "owing" : excess > 0 ? "overpaid" : "paid",
                    note: 'New Sale'
                };
                transaction.set(ledgerRef, ledgerData);

                // 4. Update Customer totalDue (using the 'balance' field on the Customer)
                if (balance > 0) {
                    const customerRef = doc(db, 'customers', selectedCustomer.id);
                    transaction.update(customerRef, { balance: increment(balance) });
                }
            });

            setPosMessage({ type: 'success', message: 'Sale created successfully!' });
            clearPOS();
        } catch (err: any) {
            setPosMessage({ type: 'error', message: err.message });
        } finally {
            setIsProcessing(false);
        }
    };

    const confirmDelete = async () => {
        if (!deletingSaleId || !user) return;
        setIsProcessing(true);

        try {
            await runTransaction(db, async (transaction) => {
                const saleRef = doc(db, 'sales', deletingSaleId);
                const saleDoc = await transaction.get(saleRef);

                if (!saleDoc.exists()) throw new Error("Sale not found");

                const saleData = saleDoc.data() as SaleRecord;

                // 1. Restore Inventory Stock
                for (const item of saleData.items) {
                    const invRef = doc(db, 'inventory', item.itemId);
                    transaction.update(invRef, { units_available: increment(item.quantity) });
                }

                // 2. Delete Sale Record
                transaction.delete(saleRef);

                // 3. Log History
                const historyRef = doc(collection(db, 'salesHistory'));
                transaction.set(historyRef, {
                    action: 'delete',
                    saleId: deletingSaleId,
                    previousData: saleData,
                    performedBy: user.email || 'Admin',
                    role: 'admin',
                    timestamp: Timestamp.now()
                });

                // 4. Update Customer totalDue (reverse the balance impact)
                if (saleData.balance > 0) {
                    const customerRef = doc(db, 'customers', saleData.customerId);
                    transaction.update(customerRef, { balance: increment(-saleData.balance) });
                }
            });

            setDeletingSaleId(null);
            setPosMessage({ type: 'success', message: 'Sale deleted and inventory restored.' });
        } catch (err: any) {
            setPosMessage({ type: 'error', message: "Delete failed: " + err.message });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSaveEdit = async () => {
        if (!editingSale || !user || !editingSale.id) return;
        setIsProcessing(true);

        try {
            await runTransaction(db, async (transaction) => {
                const saleRef = doc(db, 'sales', editingSale.id!);
                const originalSaleDoc = await transaction.get(saleRef);

                if (!originalSaleDoc.exists()) throw new Error("Original sale missing");

                const originalData = originalSaleDoc.data() as SaleRecord;

                // 1. Reverse original inventory changes
                for (const oldItem of originalData.items) {
                    const invRef = doc(db, 'inventory', oldItem.itemId);
                    transaction.update(invRef, { units_available: increment(oldItem.quantity) });
                }

                // 2. Apply new inventory changes
                for (const newItem of editingSale.items) {
                    const invRef = doc(db, 'inventory', newItem.itemId);
                    // Check stock availability (simplified check for editing)
                    const invDoc = await transaction.get(invRef);
                    if (!invDoc.exists()) throw new Error(`Item ${newItem.itemName} missing.`);
                    const currentStock = (invDoc.data() as InventoryItem).units_available;
                    
                    // Find the quantity of this item in the *original* sale data to determine max available
                    const originalQtyInSale = originalData.items.find(i => i.itemId === newItem.itemId)?.quantity || 0;
                    
                    // Stock available for the *new* sale quantity = current stock + original quantity sold
                    const stockAfterReversal = currentStock + originalQtyInSale;

                    if (stockAfterReversal < newItem.quantity) throw new Error(`Stock mismatch for ${newItem.itemName}. New quantity exceeds available stock (${stockAfterReversal}).`); 

                    transaction.update(invRef, { units_available: increment(-newItem.quantity) });
                }

                // 3. Update Sale Record
                transaction.update(saleRef, { ...editingSale });

                // 4. Log Ledger Correction
                const ledgerRef = doc(collection(db, 'customerLedger', editingSale.customerId, 'transactions'));
                const ledgerData: LedgerTransaction = {
                    transactionType: 'edit_correction',
                    saleId: editingSale.saleId,
                    amount: editingSale.total,
                    paid: editingSale.paid,
                    balance: editingSale.balance,
                    excess: editingSale.excess,
                    date: Timestamp.now(),
                    timestamp: serverTimestamp(),
                    userId: (user as any).uid, 
                    status: 'correction',
                    note: `Admin correction of Sale #${editingSale.saleId}`
                };
                transaction.set(ledgerRef, ledgerData);

                // 5. Log History
                const historyRef = doc(collection(db, 'salesHistory'));
                transaction.set(historyRef, {
                    action: 'edit',
                    saleId: editingSale.saleId,
                    previousData: originalData,
                    updatedData: editingSale,
                    performedBy: user.email || 'Admin',
                    role: 'admin',
                    timestamp: Timestamp.now()
                });

                // 6. Update Customer totalDue (Reverse old balance, apply new balance)
                const customerRef = doc(db, 'customers', editingSale.customerId);
                transaction.update(customerRef, { balance: increment(-originalData.balance + editingSale.balance) });
            });

            setEditingSale(null);
            setPosMessage({ type: 'success', message: 'Sale updated successfully.' });
        } catch (err: any) {
            setPosMessage({ type: 'error', message: 'Edit failed: ' + err.message });
        } finally {
            setIsProcessing(false);
        }
    };

    if (!initialized) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: LightBg }}><Loader2 className="animate-spin" size={48} color={PrimaryColor} /></div>;

    return (
        <div style={{ minHeight: '100vh', backgroundColor: LightBg, color: '#1f2937', fontFamily: 'Arial, sans-serif' }}>
            {/* --- TOP NAV --- */}
            <nav style={{ backgroundColor: '#fff', borderBottom: `1px solid ${OutlineBorderColor}`, padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 10, boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ backgroundColor: PrimaryColor, color: 'white', padding: '0.5rem', borderRadius: '0.5rem' }}>
                        <ShoppingCart size={24} />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: PrimaryColor, lineHeight: 1 }}>Admin Sales Dashboard</h1>
                        <span style={{ fontSize: '0.75rem', color: MutedColor, fontWeight: '500' }}>Logged in as: {user?.email}</span>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ display: 'flex', backgroundColor: LightBg, padding: '0.25rem', borderRadius: '0.5rem' }}>
                        <Button
                            variant="ghost"
                            onClick={() => setActiveTab('pos')}
                            style={{ backgroundColor: activeTab === 'pos' ? '#fff' : 'transparent', boxShadow: activeTab === 'pos' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none', color: activeTab === 'pos' ? PrimaryColor : MutedColor }}
                        >
                            Point of Sale
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={() => setActiveTab('history')}
                            style={{ backgroundColor: activeTab === 'history' ? '#fff' : 'transparent', boxShadow: activeTab === 'history' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none', color: activeTab === 'history' ? PrimaryColor : MutedColor }}
                        >
                            History & Logs
                        </Button>
                    </div>
                    <Button variant="ghost" onClick={() => navigate('/admin/inventory')}>Stock</Button>
                    <Button
                        variant="default"
                        style={{ backgroundColor: 'transparent', color: PrimaryColor, borderWidth: '1px', borderStyle: 'solid', borderColor: '#ccc' }}
                        onClick={() => window.history.back()}
                    >
                        ← Back
                    </Button>
                    <Button variant="destructive" onClick={() => { logout(); navigate('/login'); }} style={{ borderRadius: '9999px', padding: '0.5rem' }}>
                        <LogOut size={20} />
                    </Button>
                </div>
            </nav>

            <main style={{ maxWidth: '1600px', margin: '0 auto', padding: '1.5rem' }}>
                {posMessage && (
                    <div style={{ padding: '1rem', borderRadius: '0.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', backgroundColor: posMessage.type === 'success' ? '#dcfce7' : '#fee2e2', color: posMessage.type === 'success' ? '#166534' : '#991b1b', border: `1px solid ${posMessage.type === 'success' ? '#bbf7d0' : '#fecaca'}` }}>
                        {posMessage.type === 'success' ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
                        {posMessage.message}
                    </div>
                )}

                {/* --- TAB: POS & ACTIVE SALES --- */}
                {activeTab === 'pos' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '1.5rem' }}>
                        {/* LEFT: POS INPUTS */}
                        <div style={{ gridColumn: 'span 7', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                            {/* Customer Selector */}
                            <Card>
                                <CardTitle style={{ fontSize: '1.125rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#374151' }}>
                                    <UserIcon size={20} color={PrimaryColor}/> Customer Selection
                                </CardTitle>
                                <div style={{ position: 'relative', marginTop: '1rem' }}>
                                    <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: MutedColor }} />
                                    <Input
                                        type="text"
                                        placeholder="Search customer..."
                                        style={{ paddingLeft: '2.5rem' }}
                                        value={customerSearchTerm}
                                        onChange={(e) => setCustomerSearchTerm(e.target.value)}
                                    />
                                </div>
                                <div style={{ marginTop: '0.75rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.5rem', maxHeight: '160px', overflowY: 'auto' }}>
                                    {customers.length === 0 && <p style={{ color: MutedColor, fontStyle: 'italic', padding: '0.5rem' }}>No customers found.</p>}
                                    {filteredCustomers.map(c => (
                                        <button
                                            key={c.id}
                                            onClick={() => setSelectedCustomer(c)}
                                            style={{ textAlign: 'left', padding: '0.5rem', borderRadius: '0.25rem', border: `1px solid ${selectedCustomer?.id === c.id ? PrimaryColor : '#eee'}`, backgroundColor: selectedCustomer?.id === c.id ? '#eff6ff' : 'transparent', color: selectedCustomer?.id === c.id ? PrimaryColor : 'inherit', cursor: 'pointer', transition: 'all 0.2s', maxHeight: '60px', overflow: 'hidden' }}
                                        >
                                            <div style={{ fontWeight: 'bold', fontSize: '0.875rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{(c as any).fullName || c.name}</div>
                                            <div style={{ fontSize: '0.75rem', color: MutedColor }}>{c.phone || 'No Phone'}</div>
                                        </button>
                                    ))}
                                </div>
                            </Card>

                            {/* Inventory List */}
                            <Card style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '500px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                    <CardTitle style={{ fontSize: '1.125rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#374151' }}>
                                        <ShoppingCart size={20} color={PrimaryColor}/> Available Stock
                                    </CardTitle>
                                </div>
                                <div style={{ position: 'relative', marginBottom: '1rem' }}>
                                    <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: MutedColor }} />
                                    <Input
                                        type="text"
                                        placeholder="Search item name or SKU..."
                                        style={{ paddingLeft: '2.5rem' }}
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                
                                <div style={{ overflowY: 'auto', flex: 1, border: `1px solid ${OutlineBorderColor}`, borderRadius: '4px' }}>
                                    <Table>
                                        <TableHeader>
                                            <TableRow style={{ backgroundColor: LightBg }}>
                                                <TableHead>Item</TableHead>
                                                <TableHead style={{ width: 100, textAlign: 'right' }}>Price</TableHead>
                                                <TableHead style={{ width: 80, textAlign: 'center' }}>Stock</TableHead>
                                                <TableHead style={{ width: 60, textAlign: 'center' }}>Action</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredInventory.length === 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={4} style={{ textAlign: 'center', color: MutedColor, fontStyle: 'italic' }}>
                                                        {inventory.length === 0 ? 'Loading inventory...' : 'No matching items in stock.'}
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                            {filteredInventory.map(item => (
                                                <TableRow key={item.id}>
                                                    <TableCell>
                                                        <div style={{ fontWeight: '500' }}>{item.name}</div>
                                                        <div style={{ fontSize: '0.75rem', color: MutedColor }}>SKU: {item.sku || 'N/A'}</div>
                                                    </TableCell>
                                                    <TableCell style={{ textAlign: 'right', fontWeight: 'bold' }}>₦{item.unit_price.toLocaleString()}</TableCell>
                                                    <TableCell style={{ textAlign: 'center' }}>{item.units_available}</TableCell>
                                                    <TableCell style={{ textAlign: 'center' }}>
                                                        <Button 
                                                            variant="default" 
                                                            onClick={() => addToCart(item)} 
                                                            disabled={!selectedCustomer}
                                                            style={{ padding: '0.3rem', height: 'auto', width: 'auto' }}
                                                        >
                                                            <Plus size={16} />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </Card>
                        </div>

                        {/* RIGHT: CART & CALCULATIONS */}
                        <div style={{ gridColumn: 'span 5', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            {/* Cart */}
                            <Card style={{ padding: 0, minHeight: '300px' }}>
                                <div style={{ padding: '1rem', borderBottom: `1px solid ${OutlineBorderColor}`, backgroundColor: '#f9fafb' }}>
                                    <CardTitle style={{ fontSize: '1.125rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#374151' }}>
                                        Cart
                                    </CardTitle>
                                    {selectedCustomer && (
                                        <div style={{ fontSize: '0.875rem', color: PrimaryColor, fontWeight: 'bold', marginTop: '0.25rem' }}>
                                            Selected Customer: {(selectedCustomer as any).fullName || selectedCustomer.name}
                                        </div>
                                    )}
                                </div>
                                <div style={{ overflowY: 'auto', maxHeight: '400px' }}>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Item</TableHead>
                                                <TableHead style={{ textAlign: 'center' }}>Qty</TableHead>
                                                <TableHead style={{ textAlign: 'right' }}>Total</TableHead>
                                                <TableHead style={{ width: 40 }}></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {cart.length === 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={4} style={{ textAlign: 'center', color: MutedColor, fontStyle: 'italic' }}>
                                                        Cart is empty. Select a customer and add items from stock.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                            {cart.map(item => (
                                                <TableRow key={item.id}>
                                                    <TableCell>
                                                        <div style={{ fontWeight: '500' }}>{item.name}</div>
                                                        <div style={{ fontSize: '0.75rem', color: MutedColor }}>₦{item.unit_price.toLocaleString()} x {item.quantity}</div>
                                                    </TableCell>
                                                    <TableCell style={{ textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', padding: '0.75rem 0' }}>
                                                        <Button variant="icon" onClick={() => updateCartQty(item.id, -1)} style={{ padding: '0.1rem' }}><Minus size={14} /></Button>
                                                        <span style={{ minWidth: '20px', textAlign: 'center' }}>{item.quantity}</span>
                                                        <Button variant="icon" onClick={() => updateCartQty(item.id, 1)} disabled={item.quantity >= item.units_available} style={{ padding: '0.1rem' }}><Plus size={14} /></Button>
                                                    </TableCell>
                                                    <TableCell style={{ textAlign: 'right', fontWeight: 'bold' }}>₦{(item.unit_price * item.quantity).toLocaleString()}</TableCell>
                                                    <TableCell style={{ paddingRight: 0 }}>
                                                        <Button variant="icon" onClick={() => removeFromCart(item.id)} style={{ padding: '0.1rem', color: DestructiveColor }}><Trash2 size={16} /></Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </Card>

                            {/* Payment & Summary */}
                            <Card>
                                <CardTitle style={{ fontSize: '1.125rem', color: '#374151', marginBottom: '1rem' }}>Summary & Payment</CardTitle>
                                
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: `1px dashed ${OutlineBorderColor}` }}>
                                    <span style={{ color: MutedColor }}>Subtotal:</span>
                                    <span style={{ fontWeight: '500' }}>₦{posCalculations.subtotal.toLocaleString()}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: `1px dashed ${OutlineBorderColor}` }}>
                                    <span style={{ color: MutedColor }}>Discount:</span>
                                    <Input 
                                        type="number" 
                                        value={discount} 
                                        onChange={(e) => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))} 
                                        style={{ width: '100px', padding: '0.25rem', height: '30px', textAlign: 'right' }} 
                                    />
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', fontWeight: 'bold', fontSize: '1.25rem', borderBottom: `2px solid ${PrimaryColor}` }}>
                                    <span style={{ color: PrimaryColor }}>GRAND TOTAL:</span>
                                    <span style={{ color: PrimaryColor }}>₦{posCalculations.grandTotal.toLocaleString()}</span>
                                </div>

                                <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>Payment Method:</label>
                                        <select
                                            value={paymentMethod} 
                                            onChange={(e) => setPaymentMethod(e.target.value as LegacyPaymentMethod)}
                                            style={{ padding: '0.5rem', border: `1px solid ${OutlineBorderColor}`, borderRadius: '4px', height: '40px', width: '100%' }}
                                        >
                                            {PAYMENT_METHODS.map(m => 
                                                <option key={m} value={m}>{m}</option>
                                            )}
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>Amount Paid:</label>
                                        <Input
                                            type="number"
                                            value={amountPaid}
                                            onChange={(e) => setAmountPaid(Math.max(0, parseFloat(e.target.value) || 0))}
                                            style={{ height: '40px' }}
                                        />
                                    </div>
                                </div>
                                
                                <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', fontSize: '1.1rem' }}>
                                    <span style={{ color: posCalculations.balance > 0 ? DestructiveColor : MutedColor, fontWeight: 'bold' }}>
                                        {posCalculations.balance > 0 ? 'Balance Due:' : 'Change/Excess:'}
                                    </span>
                                    <span style={{ fontWeight: 'bold', color: posCalculations.balance > 0 ? DestructiveColor : PrimaryColor }}>
                                        ₦{(posCalculations.balance > 0 ? posCalculations.balance : posCalculations.excess).toLocaleString()}
                                    </span>
                                </div>

                                <Button
                                    onClick={handleCreateSale}
                                    disabled={!selectedCustomer || cart.length === 0 || isProcessing}
                                    style={{ width: '100%', marginTop: '1.5rem', height: '48px', fontSize: '1.1rem' }}
                                >
                                    {isProcessing ? <Loader2 size={24} className="animate-spin" /> : <CreditCard size={24} />}
                                    {isProcessing ? 'Processing Sale...' : 'Finalize Sale'}
                                </Button>
                            </Card>

                            {/* Recent Sales (Active Sales) */}
                            <Card style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 0 }}>
                                <div style={{ padding: '1rem', borderBottom: `1px solid ${OutlineBorderColor}`, backgroundColor: '#f9fafb' }}>
                                    <h2 style={{ fontWeight: 'bold', color: '#374151' }}>Recent Sales (Admin Control)</h2>
                                </div>
                                <div style={{ overflowY: 'auto', flex: 1, maxHeight: '400px' }}>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>ID / Customer</TableHead>
                                                <TableHead style={{ textAlign: 'right' }}>Total</TableHead>
                                                <TableHead style={{ textAlign: 'center', width: 100 }}>Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {allSales.slice(0, 10).map(sale => (
                                                <TableRow key={sale.id}>
                                                    <TableCell>
                                                        <div style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: MutedColor }}>#{sale.saleId.slice(0, 8)}</div>
                                                        <div style={{ fontWeight: '500' }}>{sale.customerName}</div>
                                                    </TableCell>
                                                    <TableCell style={{ textAlign: 'right', fontWeight: '500' }}>₦{sale.total.toLocaleString()}</TableCell>
                                                    <TableCell style={{ textAlign: 'center' }}>
                                                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                                            <Button variant="icon" onClick={() => setEditingSale(sale)} title="Edit Sale"><Edit size={16} /></Button>
                                                            <Button variant="icon" onClick={() => setDeletingSaleId(sale.id!)} style={{ color: DestructiveColor }} title="Delete Sale (Restock)"><Trash2 size={16} /></Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            {allSales.length === 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={3} style={{ textAlign: 'center', color: MutedColor, fontStyle: 'italic' }}>No active sales found.</TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </Card>
                        </div>
                    </div>
                )}

                {/* --- TAB: HISTORY & LOGS --- */}
                {activeTab === 'history' && (
                    <Card style={{ padding: 0 }}>
                        <div style={{ padding: '1rem', borderBottom: `1px solid ${OutlineBorderColor}`, backgroundColor: '#f9fafb' }}>
                            <CardTitle style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#374151' }}>
                                <History size={24} color={PrimaryColor}/> Sale History & Admin Logs
                            </CardTitle>
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead style={{ width: 150 }}>Time</TableHead>
                                        <TableHead style={{ width: 100 }}>Admin</TableHead>
                                        <TableHead style={{ width: 80, textAlign: 'center' }}>Action</TableHead>
                                        <TableHead>Details</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {historyLogs.map(log => (
                                        <TableRow key={log.id}>
                                            <TableCell>
                                                {log.timestamp instanceof Timestamp ? log.timestamp.toDate().toLocaleString() : 'N/A'}
                                            </TableCell>
                                            <TableCell>{log.performedBy}</TableCell>
                                            <TableCell style={{ textAlign: 'center' }}>
                                                <span style={{ padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', backgroundColor: log.action === 'delete' ? '#fee2e2' : '#fef3c7', color: log.action === 'delete' ? '#b91c1c' : '#b45309' }}>
                                                    {log.action}
                                                </span>
                                            </TableCell>
                                            <TableCell style={{ color: MutedColor, maxWidth: '400px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {log.action === 'delete' ? 
                                                    `Deleted Sale #${log.saleId.slice(0,8)} for customer ${log.previousData?.customerName}. Total: ₦${log.previousData?.total.toLocaleString()}` :
                                                log.action === 'edit' ? 
                                                    `Edited Sale #${log.saleId.slice(0,8)}. Total changed from ₦${log.previousData?.total.toLocaleString()} to ₦${log.updatedData?.total.toLocaleString()}.` :
                                                    `Action on Sale #${log.saleId?.slice(0,8)}`
                                                }
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {historyLogs.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={4} style={{ textAlign: 'center', color: MutedColor, fontStyle: 'italic' }}>No history logs available.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </Card>
                )}

                {/* --- MODAL: CONFIRM DELETE --- */}
                {deletingSaleId && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
                        <Card style={{ width: '400px', padding: '2rem' }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: DestructiveColor }}>
                                <AlertTriangle size={20} /> Confirm Deletion
                            </h3>
                            <p style={{ marginBottom: '1.5rem', color: '#374151' }}>
                                Are you sure you want to delete this sale? **This action is irreversible** and the sold items will be **restored to inventory**.
                            </p>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                                <Button variant="ghost" onClick={() => setDeletingSaleId(null)} disabled={isProcessing}>Cancel</Button>
                                <Button variant="destructive" onClick={confirmDelete} disabled={isProcessing}>
                                    {isProcessing ? <Loader2 size={20} className="animate-spin" /> : <Trash2 size={20} />}
                                    {isProcessing ? 'Deleting...' : 'Delete Sale'}
                                </Button>
                            </div>
                        </Card>
                    </div>
                )}

                {/* --- MODAL: EDIT SALE (Simplified) --- */}
                {editingSale && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, overflowY: 'auto', padding: '2rem' }}>
                        <Card style={{ width: '800px', maxWidth: '90%', padding: '2rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${OutlineBorderColor}`, paddingBottom: '1rem', marginBottom: '1rem' }}>
                                <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem', color: PrimaryColor }}>
                                    <Edit size={24} /> Edit Sale #{editingSale.saleId?.slice(0, 8)}
                                </h3>
                                <Button variant="icon" onClick={() => setEditingSale(null)}><X size={24} /></Button>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>Customer:</label>
                                    <Input value={editingSale.customerName} disabled style={{ backgroundColor: LightBg }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>Total (Recalculated):</label>
                                    <Input value={`₦${editingSale.total.toLocaleString()}`} disabled style={{ backgroundColor: LightBg, fontWeight: 'bold' }} />
                                </div>
                            </div>
                            
                            <h4 style={{ fontWeight: 'bold', marginBottom: '0.5rem', marginTop: '1rem' }}>Items in Sale (Update quantities and list):</h4>
                            <div style={{ maxHeight: '300px', overflowY: 'auto', border: `1px solid ${OutlineBorderColor}`, borderRadius: '4px' }}>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Item</TableHead>
                                            <TableHead style={{ textAlign: 'center' }}>Qty</TableHead>
                                            <TableHead style={{ textAlign: 'right' }}>Price</TableHead>
                                            <TableHead style={{ width: 40 }}></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {editingSale.items.map((item, index) => {
                                            const originalItem = inventory.find(i => i.id === item.itemId);
                                            const availableStock = originalItem?.units_available || 0; 
                                            
                                            const originalSaleItem = allSales.find(s => s.id === editingSale.id)?.items.find(i => i.itemId === item.itemId);
                                            const originalQtyInSale = originalSaleItem?.quantity || 0;

                                            const maxQty = availableStock + originalQtyInSale; 

                                            const updateItemQty = (delta: number) => {
                                                const newQty = item.quantity + delta;
                                                
                                                if (newQty <= 0) {
                                                    setEditingSale({
                                                        ...editingSale,
                                                        items: editingSale.items.filter((_, i) => i !== index)
                                                    });
                                                } else if (newQty <= maxQty) {
                                                    const updatedItems = editingSale.items.map((i, iIndex) => 
                                                        iIndex === index ? { ...i, quantity: newQty } : i
                                                    );
                                                    
                                                    const newSubtotal = updatedItems.reduce((acc, i) => acc + (i.price * i.quantity), 0);
                                                    const newTotal = Math.max(0, newSubtotal - editingSale.discount);
                                                    const newPaid = editingSale.paid; 
                                                    const newBalance = Math.max(0, newTotal - newPaid);
                                                    const newExcess = Math.max(0, newPaid - newTotal);

                                                    setEditingSale({
                                                        ...editingSale,
                                                        items: updatedItems,
                                                        subtotal: newSubtotal,
                                                        total: newTotal,
                                                        balance: newBalance,
                                                        excess: newExcess
                                                    });
                                                }
                                            };

                                            return (
                                                <TableRow key={item.itemId}>
                                                    <TableCell>
                                                        <div style={{ fontWeight: '500' }}>{item.itemName}</div>
                                                        <div style={{ fontSize: '0.75rem', color: MutedColor }}>SKU: {item.sku || 'N/A'}</div>
                                                    </TableCell>
                                                    <TableCell style={{ textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', padding: '0.75rem 0' }}>
                                                        <Button variant="icon" onClick={() => updateItemQty(-1)} style={{ padding: '0.1rem' }}><Minus size={14} /></Button>
                                                        <span style={{ minWidth: '20px', textAlign: 'center' }}>{item.quantity}</span>
                                                        <Button variant="icon" onClick={() => updateItemQty(1)} disabled={item.quantity >= maxQty} style={{ padding: '0.1rem' }}><Plus size={14} /></Button>
                                                    </TableCell>
                                                    <TableCell style={{ textAlign: 'right', fontWeight: 'bold' }}>₦{(item.price).toLocaleString()}</TableCell>
                                                    <TableCell style={{ paddingRight: 0 }}>
                                                        <Button variant="icon" onClick={() => updateItemQty(-item.quantity)} style={{ padding: '0.1rem', color: DestructiveColor }}><Trash2 size={16} /></Button>
                                                    </TableCell>
                                                </TableRow>
                                            )
                                        })}
                                    </TableBody>
                                </Table>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginTop: '1rem', borderTop: `1px solid ${OutlineBorderColor}`, paddingTop: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>Discount:</label>
                                    <Input 
                                        type="number" 
                                        value={editingSale.discount} 
                                        onChange={(e) => {
                                            const newDiscount = Math.max(0, parseFloat(e.target.value) || 0);
                                            const newTotal = Math.max(0, editingSale.subtotal - newDiscount);
                                            const newPaid = editingSale.paid;
                                            const newBalance = Math.max(0, newTotal - newPaid);
                                            const newExcess = Math.max(0, newPaid - newTotal);
                                            setEditingSale({ ...editingSale, discount: newDiscount, total: newTotal, balance: newBalance, excess: newExcess });
                                        }} 
                                        style={{ height: '40px' }} 
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>Amount Paid:</label>
                                    <Input 
                                        type="number" 
                                        value={editingSale.paid} 
                                        onChange={(e) => {
                                            const newPaid = Math.max(0, parseFloat(e.target.value) || 0);
                                            const newTotal = editingSale.total;
                                            const newBalance = Math.max(0, newTotal - newPaid);
                                            const newExcess = Math.max(0, newPaid - newTotal);
                                            setEditingSale({ ...editingSale, paid: newPaid, balance: newBalance, excess: newExcess });
                                        }} 
                                        style={{ height: '40px' }} 
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>Payment Method:</label>
                                    <select
                                        value={editingSale.paymentMethod}
                                        onChange={(e) => { // FIX: Added function body braces
                                            setEditingSale({ ...editingSale, paymentMethod: e.target.value as LegacyPaymentMethod });
                                        }} // FIX: Added function body braces
                                        style={{ padding: '0.5rem', border: `1px solid ${OutlineBorderColor}`, borderRadius: '4px', height: '40px', width: '100%' }}
                                    >
                                        {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                                    </select>
                                </div>
                            </div>
                            
                            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                                <Button variant="ghost" onClick={() => setEditingSale(null)} disabled={isProcessing}>Cancel</Button>
                                <Button onClick={handleSaveEdit} disabled={isProcessing || editingSale.items.length === 0}>
                                    {isProcessing ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                                    {isProcessing ? 'Saving...' : 'Save Changes'}
                                </Button>
                            </div>
                        </Card>
                    </div>
                )}
            </main>
        </div>
    );
};

export default AdminSalesPage;