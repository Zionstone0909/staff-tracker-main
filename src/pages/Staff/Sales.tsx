// src/pages/Admin/Sales.tsx
"use client"
import React, { useState, useEffect, useMemo, PropsWithChildren, CSSProperties, useCallback, ChangeEvent } from 'react';
import { app, auth, db, APP_ID, onAuthStateChanged } from '../../firebase'; // Assuming firebase.ts exports these
import {
    collection, query, onSnapshot, doc, runTransaction,
    Timestamp, orderBy, limit, DocumentData, DocumentReference, serverTimestamp, increment, FieldValue, where
} from 'firebase/firestore';
import { User, signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import {
    ShoppingCart, Plus, Minus, Trash2, User as UserIcon, CreditCard,
    Loader2, AlertTriangle, Search, ChevronDown, ChevronUp, DollarSign, X
} from 'lucide-react';

/* ========================================================================== */
/* CONFIG & UI STYLES (INLINE CSS TEMPLATE)                                   */
/* ========================================================================== */

// --- Inline CSS Style Definitions (Consistent with CompanyExpenses.tsx) ---
const PrimaryColor = '#0B3D91';
const DestructiveColor = '#dc2626';
const SuccessColor = '#15803d';
const MutedColor = '#6b7280';
const LightBg = '#f3f4f6';
const OutlineBorderColor = '#e5e7eb';
const WarningColor = '#d97706';

// --- Placeholder UI Components (using inline styles) ---

const Button: React.FC<PropsWithChildren & React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'default' | 'ghost' | 'destructive' | 'icon' | 'success' }> = ({ children, onClick, style, disabled, type = 'button', variant = 'default', ...props }) => { 
    let backgroundColor = PrimaryColor;
    let color = 'white';
    let border = '1px solid transparent';
    let padding = '0.5rem 1rem';

    if (variant === 'ghost') {
        backgroundColor = 'transparent';
        color = PrimaryColor;
        border = '1px solid transparent';
    } else if (variant === 'destructive') {
        backgroundColor = DestructiveColor;
    } else if (variant === 'success') {
        backgroundColor = SuccessColor;
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
    <input 
        {...props} 
        style={{ 
            padding: '0.6rem 0.8rem', 
            border: '1px solid #ccc', 
            borderRadius: '4px', 
            width: '100%', 
            boxSizing: 'border-box', 
            height: 40, 
            ...props.style
        }} 
    />
);

const Card: React.FC<PropsWithChildren & { style?: CSSProperties }> = ({ children, style }) => <div style={{ border: '1px solid ' + OutlineBorderColor, borderRadius: '8px', padding: '1.5rem', marginBottom: '1.5rem', backgroundColor: '#fff', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)', ...style }}>{children}</div>;
const CardHeader: React.FC<PropsWithChildren> = ({ children }) => <div>{children}</div>;
const CardTitle: React.FC<PropsWithChildren & { style?: CSSProperties }> = ({ children, style }) => <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem', ...style }}>{children}</h2>;
const CardContent: React.FC<PropsWithChildren & { style?: CSSProperties }> = ({ children, style }) => <div style={{ paddingTop: '0.5rem', ...style }}>{children}</div>;

const Alert: React.FC<PropsWithChildren & { variant?: 'default' | 'destructive' | 'warning', customStyle?: CSSProperties }> = ({ children, variant, customStyle }) => {
    let bgColor = '#d4edda';
    let borderColor = '#c3e6cb';
    let textColor = '#155724';
    if (variant === 'destructive') {
        bgColor = '#f8d7da';
        borderColor = '#f5c6cb';
        textColor = '#721c24';
    } else if (variant === 'warning') {
        bgColor = '#fff3cd';
        borderColor = '#ffeeba';
        textColor = '#856404';
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

const Table: React.FC<PropsWithChildren & { style?: CSSProperties }> = ({ children, style }) => <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, ...style }}>{children}</table>;
const TableHeader: React.FC<PropsWithChildren> = ({ children }) => <thead>{children}</thead>;
const TableBody: React.FC<PropsWithChildren> = ({ children }) => <tbody>{children}</tbody>;
const TableRow: React.FC<PropsWithChildren & { style?: CSSProperties }> = ({ children, style }) => <tr style={{ borderBottom: '1px solid #eee', ...style }}>{children}</tr>;
const TableHead: React.FC<PropsWithChildren & { style?: CSSProperties, onClick?: () => void, isSortable?: boolean }> = ({ children, style, onClick, isSortable = false }) => (
    <th
        onClick={onClick}
        style={{
            padding: '0.75rem',
            textAlign: 'left',
            fontWeight: '600',
            borderBottom: '2px solid #ccc',
            backgroundColor: '#f9fafb',
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
const TableCell: React.FC<PropsWithChildren & { colSpan?: number, style?: CSSProperties }> = ({ children, style, colSpan }) => <td colSpan={colSpan} style={{ padding: '0.75rem', verticalAlign: 'middle', borderBottom: '1px solid #eee', ...style }}>{children}</td>;


// --- Utility Functions ---
const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(amount);

/* ========================================================================== */
/* DATA TYPES (REQUIRED BY PROMPT)                                            */
/* ========================================================================== */

interface InventoryItem {
    id: string;
    name: string;
    sku?: string;
    units_available: number; // Stock level
    unit_price: number; // Selling price
    low_stock_threshold?: number;
}
interface Customer {
    id: string;
    name: string; // Shorter name for display
    fullName: string;
    phone?: string;
    email?: string;
}
interface SaleItem {
    itemId: string;
    itemName: string;
    quantity: number;
    price: number; // Unit price at the time of sale (this is where item.unit_price is mapped)
}
// CartItem extends InventoryItem, so it has all InventoryItem properties including 'unit_price'
interface CartItem extends InventoryItem {
    quantity: number;
}
interface SaleRecord {
    saleId: string;
    customerId: string;
    customerName: string;
    items: SaleItem[];
    subtotal: number;
    discount: number;
    total: number;
    paid: number;
    balance: number;
    excess: number;
    paymentMethod: "Cash" | "Transfer" | "POS" | "Others";
    timestamp: Timestamp;
    userId: string;
    userName: string;
}
interface LedgerTransaction {
    transactionType: "sale" | "payment";
    saleId?: string;
    paymentId?: string;
    amount: number; // Total value of the transaction
    paid: number; // Actual amount paid in this transaction
    balance: number; // Balance remaining (owing)
    excess: number; // Excess remaining (overpaid)
    items?: SaleItem[];
    date: Timestamp;
    timestamp: FieldValue;
    userId: string;
    status: "owing" | "paid" | "overpaid";
}

// --- Constants ---
const PAYMENT_METHODS: SaleRecord["paymentMethod"][] = ["Cash", "Transfer", "POS", "Others"];

/* ========================================================================== */
/* CORE COMPONENT: SalesPageBase                                              */
/* ========================================================================== */

const SalesPage: React.FC = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState<User | null>(null);
    const [userRole, setUserRole] = useState<'admin' | 'staff' | 'unknown'>('unknown'); // Used for routing/permissions
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);

    // Sales Form State
    const [searchTerm, setSearchTerm] = useState(''); // For searching inventory
    const [customerSearchTerm, setCustomerSearchTerm] = useState(''); // For searching customers
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [discount, setDiscount] = useState(0);
    const [amountPaid, setAmountPaid] = useState(0);
    const [paymentMethod, setPaymentMethod] = useState<SaleRecord["paymentMethod"]>(PAYMENT_METHODS[0]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [transactionMessage, setTransactionMessage] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    // --- Firebase Auth & Role Check ---
    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                const path = window.location.pathname;
                if (path.startsWith('/admin')) {
                    setUserRole('admin');
                } else {
                    setUserRole('staff');
                }
            } else {
                navigate('/login'); // Redirect to login if not authenticated
            }
        });
        return () => unsubscribeAuth();
    }, [navigate]);

    // --- Firestore Listeners for Inventory and Customers ---
    useEffect(() => {
        if (!user) return;
        setTransactionMessage(null);

        // 1. Inventory Listener
        const inventoryRef = collection(db, 'inventory');
        const qInv = query(inventoryRef, orderBy('name'));
        const unsubscribeInv = onSnapshot(qInv, (snapshot) => {
            const items: InventoryItem[] = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data() as Omit<InventoryItem, 'id'>
            }));
            setInventory(items);
        }, (error) => console.error("Error fetching inventory:", error));

        // 2. Customers Listener
        const customersRef = collection(db, 'customers');
        const qCust = query(customersRef, orderBy('name'));
        const unsubscribeCust = onSnapshot(qCust, (snapshot) => {
            const custs: Customer[] = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data() as Omit<Customer, 'id'>
            }));
            setCustomers(custs);
        }, (error) => console.error("Error fetching customers:", error));

        return () => {
            unsubscribeInv();
            unsubscribeCust();
        };
    }, [user]);

    // --- Data Processing & Calculations ---
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
            c.name.toLowerCase().includes(term) || c.fullName.toLowerCase().includes(term)
        );
    }, [customers, customerSearchTerm]);

    const calculations = useMemo(() => {
        // ✅ FIX: Corrected item.price to item.unit_price (Error 1 fix)
        const subtotal = cart.reduce((total, item) => total + item.unit_price * item.quantity, 0); 
        const grandTotal = Math.max(0, subtotal - discount); // Grand Total cannot be negative
        const balance = Math.max(0, grandTotal - amountPaid);
        const excess = Math.max(0, amountPaid - grandTotal);
        
        return { subtotal, grandTotal, balance, excess };
    }, [cart, discount, amountPaid]);

    const canCheckout = useMemo(() => {
        return cart.length > 0 && selectedCustomer !== null && calculations.grandTotal > 0 && !isProcessing;
    }, [cart.length, selectedCustomer, calculations.grandTotal, isProcessing]);

    // --- Cart Actions ---
    const handleAddToCart = (item: InventoryItem) => {
        setTransactionMessage(null);
        setCart(prevCart => {
            const existingItem = prevCart.find(c => c.id === item.id);
            if (existingItem) {
                if (existingItem.quantity + 1 > item.units_available) {
                    setTransactionMessage({ type: 'error', message: `Cannot add more than ${item.units_available} units of ${item.name}.` });
                    return prevCart;
                }
                return prevCart.map(c =>
                    c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c
                );
            } else {
                if (item.units_available <= 0) {
                     setTransactionMessage({ type: 'error', message: `No stock for ${item.name}.` });
                    return prevCart;
                }
                // ✅ FIX: Cleaned up object creation using spread operator for all InventoryItem properties (Error 2 fix context)
                return [...prevCart, { 
                    ...item,
                    quantity: 1 
                }];
            }
        });
    };

    const updateCartQuantity = (itemId: string, delta: number) => {
        setTransactionMessage(null);
        setCart(prevCart => {
            const itemToUpdate = prevCart.find(c => c.id === itemId);
            if (!itemToUpdate) return prevCart;

            const newQuantity = itemToUpdate.quantity + delta;

            if (newQuantity > itemToUpdate.units_available) {
                 setTransactionMessage({ type: 'error', message: `Cannot exceed ${itemToUpdate.units_available} units.` });
                 return prevCart;
            }

            const updatedCart = prevCart.map(c => {
                if (c.id === itemId) {
                    if (newQuantity < 1) return null;
                    return { ...c, quantity: newQuantity };
                }
                return c;
            }).filter(Boolean) as CartItem[];
            
            return updatedCart;
        });
    };

    const removeFromCart = (itemId: string) => {
        setTransactionMessage(null);
        setCart(prevCart => prevCart.filter(c => c.id !== itemId));
    };
    
    const clearCart = () => {
        setCart([]);
        setSelectedCustomer(null);
        setDiscount(0);
        setAmountPaid(0);
        setPaymentMethod(PAYMENT_METHODS[0]);
        setTransactionMessage(null);
        setCustomerSearchTerm('');
    };

    // --- Checkout Logic (Firestore runTransaction) ---
    const handleCheckout = async () => {
        if (!canCheckout || !user) {
            setTransactionMessage({ type: 'error', message: "Please select a customer and add items to the cart." });
            return;
        }

        setIsProcessing(true);
        setTransactionMessage(null);
        
        const customerRef = doc(db, 'customers', selectedCustomer!.id);
        const saleRef = doc(collection(db, 'sales'));
        const ledgerRef = doc(collection(db, `customerLedger/${selectedCustomer!.id}/transactions`));

        const { subtotal, grandTotal, balance, excess } = calculations;

        try {
            await runTransaction(db, async (transaction) => {
                
                // 1. Check Inventory Stock and Update
                const inventoryUpdates: { ref: DocumentReference, quantitySold: number, newStock: number }[] = [];

                for (const item of cart) {
                    const inventoryDocRef = doc(db, 'inventory', item.id);
                    const inventoryDoc = await transaction.get(inventoryDocRef);
                    
                    if (!inventoryDoc.exists()) {
                        throw new Error(`Item ${item.name} not found in inventory.`);
                    }
                    
                    const currentStock = inventoryDoc.data()?.units_available || 0;
                    const newStock = currentStock - item.quantity;
                    
                    if (newStock < 0) {
                        throw new Error(`Insufficient stock for ${item.name}. Available: ${currentStock}, Requested: ${item.quantity}.`);
                    }
                    
                    inventoryUpdates.push({ ref: inventoryDocRef, quantitySold: item.quantity, newStock });
                }

                // 2. Execute Inventory Updates (Batch update simulated via transaction)
                inventoryUpdates.forEach(update => {
                    transaction.update(update.ref, { units_available: update.newStock });
                });

                // 3. Create Sale Record
                const saleRecord: SaleRecord = {
                    saleId: saleRef.id,
                    customerId: selectedCustomer!.id,
                    customerName: selectedCustomer!.name,
                    items: cart.map(item => ({ 
                        itemId: item.id, 
                        itemName: item.name, 
                        quantity: item.quantity, 
                        // ✅ FIX: Corrected mapping from item.unit_price (CartItem) to price (SaleItem)
                        price: item.unit_price 
                    })),
                    subtotal,
                    discount,
                    total: grandTotal,
                    paid: amountPaid,
                    balance,
                    excess,
                    paymentMethod,
                    timestamp: Timestamp.now(),
                    userId: user.uid,
                    userName: user.email || user.uid.slice(0, 5), // Placeholder for staff name
                };
                transaction.set(saleRef, saleRecord);

                // 4. Create Customer Ledger Entry
                const ledgerStatus: LedgerTransaction["status"] = 
                    balance > 0 ? "owing" : 
                    excess > 0 ? "overpaid" : "paid";

                const ledgerEntry: LedgerTransaction = {
                    transactionType: "sale",
                    saleId: saleRef.id,
                    amount: grandTotal,
                    paid: amountPaid,
                    balance: balance,
                    excess: excess,
                    items: saleRecord.items,
                    date: Timestamp.now(),
                    timestamp: serverTimestamp(),
                    userId: user.uid,
                    status: ledgerStatus,
                };
                transaction.set(ledgerRef, ledgerEntry);

                // 5. Update Customer's totalDue/totalExcess field (Optional Indexing field)
                if (balance > 0) {
                    transaction.update(customerRef, { totalDue: increment(balance) });
                }
                
                return saleRecord; // Return the sale record for success message
            });

            setTransactionMessage({ type: 'success', message: `Sale ID ${saleRef.id.slice(0, 8)} completed successfully! Total: ${formatCurrency(grandTotal)}.` });
            clearCart();
            setIsProcessing(false);

        } catch (error: any) {
            console.error("Firestore Transaction failed:", error);
            setTransactionMessage({ type: 'error', message: `Transaction failed: ${error.message || "Unknown error."}` });
            setIsProcessing(false);
        }
    };

    // --- RENDER ---
    if (userRole === 'unknown') {
        return <div style={{ minHeight: '100vh', backgroundColor: LightBg, display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '1.5rem' }}>Loading User Profile...</div>;
    }

    return (
        <div style={{ minHeight: '100vh', backgroundColor: LightBg }}>
            <nav style={{ borderBottom: '1px solid #e5e7eb', backgroundColor: '#fff', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Button
                    variant="default"
                    style={{ backgroundColor: 'transparent', color: PrimaryColor, borderWidth: '1px', borderStyle: 'solid', borderColor: '#ccc' }}
                    onClick={() => navigate(userRole === 'admin' ? '/admin' : '/staff')}
                >
                    ← Dashboard
                </Button>
                <Button variant="destructive" onClick={() => signOut(auth).then(() => navigate('/login'))}>
                    Logout
                </Button>
            </nav>
            <main style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '2rem',
                maxWidth: '1400px',
                margin: '0 auto',
                padding: '2rem 1rem',
                width: '100%'
            }}>
                <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: PrimaryColor }}>Point of Sale ({userRole.toUpperCase()}) <ShoppingCart size={28} style={{ verticalAlign: 'middle' }} /></h1>
                
                {transactionMessage && (
                    <Alert variant={transactionMessage.type === 'error' ? 'destructive' : 'default'} customStyle={{ animation: 'fadeIn 0.5s' }}>
                        <AlertDescription>{transactionMessage.message}</AlertDescription>
                    </Alert>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr', gap: '2rem' }}>
                    
                    {/* LEFT PANE: INVENTORY AND CUSTOMER */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        
                        {/* 1. Customer Search & Selection */}
                        <Card>
                            <CardTitle style={{ marginBottom: '0.5rem', fontSize: '1.25rem' }}>Customer Selection</CardTitle>
                            <div style={{ position: 'relative', marginBottom: '1rem' }}>
                                <Input
                                    type="text"
                                    placeholder="Search customer by name..."
                                    value={customerSearchTerm}
                                    onChange={(e) => setCustomerSearchTerm(e.target.value)}
                                    style={{ paddingLeft: '2.5rem' }}
                                />
                                <Search size={20} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: MutedColor }} />
                            </div>
                            
                            <select
                                style={{ border: '1px solid #ccc', borderRadius: '4px', padding: '0.6rem 0.8rem', width: '100%', height: 40, backgroundColor: 'white' }}
                                value={selectedCustomer?.id || ''}
                                onChange={(e) => {
                                    const customerId = e.target.value;
                                    setSelectedCustomer(customers.find(c => c.id === customerId) || null);
                                    setTransactionMessage(null);
                                }}
                            >
                                <option value="">{selectedCustomer ? `Selected: ${selectedCustomer.name}` : '--- Select Customer ---'}</option>
                                {filteredCustomers.map(c => (
                                    <option key={c.id} value={c.id}>{c.fullName} ({c.name})</option>
                                ))}
                            </select>
                            {!selectedCustomer && (
                                <Alert variant='warning' customStyle={{ marginTop: '1rem', marginBottom: 0 }}>
                                    <AlertDescription>⚠️ Select a customer to begin a transaction.</AlertDescription>
                                </Alert>
                            )}
                        </Card>

                        {/* 2. Inventory Search & List */}
                        <Card style={{ flex: 1, minHeight: '400px' }}>
                            <CardHeader>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <CardTitle style={{ marginBottom: 0, fontSize: '1.25rem' }}>Stock List</CardTitle>
                                    <div style={{ position: 'relative', width: '300px' }}>
                                        <Input
                                            type="text"
                                            placeholder="Search product by name or SKU..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            style={{ paddingLeft: '2.5rem' }}
                                        />
                                        <Search size={20} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: MutedColor }} />
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent style={{ marginTop: '1rem' }}>
                                <div style={{ overflowY: 'auto', maxHeight: '350px', border: '1px solid #eee', borderRadius: '4px' }}>
                                    <Table style={{ border: 'none' }}>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead style={{ width: '45%' }}>Product Name</TableHead>
                                                <TableHead style={{ width: '25%', textAlign: 'right' }}>Price (₦)</TableHead>
                                                <TableHead style={{ width: '15%', textAlign: 'center' }}>Stock</TableHead>
                                                <TableHead style={{ width: '15%' }}>Action</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredInventory.map((item, index) => (
                                                <TableRow 
                                                    key={item.id} 
                                                    style={{ backgroundColor: index % 2 === 1 ? '#f9f9f9' : '#fff' }}
                                                >
                                                    <TableCell style={{ fontWeight: '500', fontSize: '0.9rem' }}>{item.name}</TableCell>
                                                    <TableCell style={{ textAlign: 'right' }}>{formatCurrency(item.unit_price)}</TableCell>
                                                    <TableCell style={{ 
                                                        textAlign: 'center', 
                                                        fontWeight: 'bold', 
                                                        color: item.units_available <= (item.low_stock_threshold || 10) ? WarningColor : SuccessColor,
                                                        fontSize: '0.9rem'
                                                    }}>
                                                        {item.units_available}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Button 
                                                            variant="default" 
                                                            onClick={() => handleAddToCart(item)} 
                                                            disabled={item.units_available <= 0}
                                                            style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                                                        >
                                                            <Plus size={16} /> Add
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            {filteredInventory.length === 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={4} style={{ textAlign: 'center', color: MutedColor, padding: '1rem' }}>
                                                        No stock items found or available.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* RIGHT PANE: CART AND CHECKOUT */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        
                        {/* 3. Sales Cart */}
                        <Card style={{ flex: 1 }}>
                            <CardHeader>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <CardTitle style={{ marginBottom: 0, fontSize: '1.25rem' }}>Shopping Cart ({cart.length})</CardTitle>
                                    <Button variant="ghost" onClick={clearCart} disabled={cart.length === 0} style={{ color: DestructiveColor }}>
                                        <Trash2 size={16} /> Clear
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent style={{ marginTop: '1rem' }}>
                                <div style={{ overflowY: 'auto', maxHeight: '200px' }}>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead style={{ width: '40%' }}>Item</TableHead>
                                                <TableHead style={{ width: '30%', textAlign: 'center' }}>Qty</TableHead>
                                                <TableHead style={{ width: '30%', textAlign: 'right' }}>Subtotal</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {cart.map((item, index) => (
                                                <TableRow key={item.id}>
                                                    <TableCell style={{ fontWeight: '500', fontSize: '0.9rem' }}>{item.name}</TableCell>
                                                    <TableCell style={{ textAlign: 'center' }}>
                                                        <div style={{ display: 'inline-flex', alignItems: 'center', border: '1px solid #ccc', borderRadius: '4px' }}>
                                                            <Button variant="icon" onClick={() => updateCartQuantity(item.id, -1)} style={{ padding: '0.2rem' }}> <Minus size={14} /> </Button>
                                                            <span style={{ padding: '0 0.5rem', minWidth: '20px', textAlign: 'center', fontSize: '0.9rem' }}>{item.quantity}</span>
                                                            <Button variant="icon" onClick={() => updateCartQuantity(item.id, 1)} style={{ padding: '0.2rem' }}> <Plus size={14} /> </Button>
                                                        </div>
                                                    </TableCell>
                                                    {/* ✅ FIX: Corrected item.price to item.unit_price (Error 3 fix) */}
                                                    <TableCell style={{ textAlign: 'right' }}>{formatCurrency(item.unit_price * item.quantity)}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                    {cart.length === 0 && (
                                        <p style={{ textAlign: 'center', color: MutedColor, padding: '1rem' }}>Cart is empty.</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                        
                        {/* 4. Payment & Checkout Summary */}
                        <Card>
                            <CardTitle style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Transaction Summary</CardTitle>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {/* Subtotal */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem' }}>
                                    <span>Subtotal:</span>
                                    <span>{formatCurrency(calculations.subtotal)}</span>
                                </div>
                                {/* Discount Input */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                    <span style={{ color: DestructiveColor }}>Discount:</span>
                                    <Input
                                        type="number"
                                        value={discount > 0 ? discount : ''}
                                        onChange={(e: ChangeEvent<HTMLInputElement>) => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                                        placeholder="0.00"
                                        min="0"
                                        step="1"
                                        style={{ width: '120px', height: '30px', padding: '0.3rem' }}
                                    />
                                </div>
                                
                                {/* Grand Total */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 'bold', borderTop: '1px solid #eee', paddingTop: '0.5rem' }}>
                                    <span>GRAND TOTAL:</span>
                                    <span style={{ color: PrimaryColor }}>{formatCurrency(calculations.grandTotal)}</span>
                                </div>

                                {/* Amount Paid Input */}
                                <div style={{ margin: '1rem 0', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <label style={{ fontSize: '0.875rem', fontWeight: '500', color: MutedColor }}>Amount Paid:</label>
                                    <Input
                                        type="number"
                                        value={amountPaid > 0 ? amountPaid : ''}
                                        onChange={(e: ChangeEvent<HTMLInputElement>) => setAmountPaid(Math.max(0, parseFloat(e.target.value) || 0))}
                                        placeholder={formatCurrency(calculations.grandTotal).replace('₦', '')}
                                        min="0"
                                        step="1"
                                    />
                                </div>
                                
                                {/* Balance/Excess */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: '500' }}>
                                    <span style={{ color: calculations.balance > 0 ? DestructiveColor : MutedColor }}>
                                        {calculations.balance > 0 ? 'Balance Owing:' : 'Excess Change:'}
                                    </span>
                                    <span style={{ color: calculations.balance > 0 ? DestructiveColor : calculations.excess > 0 ? SuccessColor : MutedColor }}>
                                        {calculations.balance > 0 
                                            ? formatCurrency(calculations.balance) 
                                            : formatCurrency(calculations.excess)}
                                    </span>
                                </div>
                                
                                {/* Payment Method */}
                                <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <label style={{ fontSize: '0.875rem', fontWeight: '500', color: MutedColor }}>Payment Method:</label>
                                    <select
                                        style={{ border: '1px solid #ccc', borderRadius: '4px', padding: '0.6rem 0.8rem', width: '100%', height: 40, backgroundColor: 'white' }}
                                        value={paymentMethod}
                                        onChange={(e) => setPaymentMethod(e.target.value as SaleRecord["paymentMethod"])}
                                    >
                                        {PAYMENT_METHODS.map(method => (
                                            <option key={method} value={method}>{method}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            
                            <Button 
                                onClick={handleCheckout} 
                                disabled={!canCheckout || isProcessing}
                                variant={calculations.balance > 0 ? 'destructive' : 'default'}
                                style={{ width: '100%', height: 50, marginTop: '1.5rem' }}
                            >
                                {isProcessing ? (
                                    <><Loader2 size={20} style={{ marginRight: '0.5rem', animation: 'spin 1s linear infinite' }} /> Processing...</>
                                ) : (
                                    <><CreditCard size={20} style={{ marginRight: '0.5rem' }} /> Complete Sale ({calculations.balance > 0 ? 'Debt Sale' : 'Paid'})</>
                                )}
                            </Button>
                        </Card>
                    </div>
                </div> 
            </main>
        </div>
    );
}

export default SalesPage;