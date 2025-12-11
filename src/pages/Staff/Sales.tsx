import React, { useState, useEffect, useMemo, PropsWithChildren, CSSProperties } from 'react';
import { db } from '../../firebase';
import { 
    collection, query, orderBy, onSnapshot, doc, runTransaction, 
    serverTimestamp, increment, Timestamp, limit
} from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingCart, Plus, Minus, Trash2, User as UserIcon, CreditCard,
  Loader2, AlertTriangle, Search, History, CheckCircle, Printer, Download, Settings, LogOut, X
} from 'lucide-react';
import pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
import { InventoryItem, Customer, SaleRecord, CartItem, PaymentMethod } from '../../types/types';
import { useAuth } from '../../contexts/AuthContext';

if (pdfFonts && (pdfFonts as any).pdfMake && (pdfFonts as any).pdfMake.vfs) {
  pdfMake.vfs = (pdfFonts as any).pdfMake.vfs;
}

// --- STYLING CONSTANTS ---
const PrimaryColor = '#0B3D91';
const DestructiveColor = '#dc2626';
const MutedColor = '#6b7280';
const LightBg = '#f3f4f6';
const OutlineBorderColor = '#e5e7eb';
// FIX: Use two-step cast to convert the array of strings to PaymentMethod[] (TS 2352)
const PAYMENT_METHODS: PaymentMethod[] = ["Cash", "Transfer", "POS", "Others"] as unknown as PaymentMethod[];

// --- UI COMPONENTS ---
const Button: React.FC<PropsWithChildren & React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'default' | 'ghost' | 'destructive' | 'icon' | 'primary-muted' }> = ({ children, onClick, style, disabled, type = 'button', variant = 'default', ...props }) => {
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
    } else if (variant === 'primary-muted') {
         backgroundColor = '#e0e7ff'; 
         color = PrimaryColor;
         padding = '0.25rem 0.5rem';
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
        gap: '0.5rem',
        whiteSpace: 'nowrap',
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
        padding: '0.6rem 0.8rem', 
        border: '1px solid #ccc', 
        borderRadius: '4px', 
        width: props.type === 'number' && !(props.style as any)?.width ? '100px' : '100%', 
        boxSizing: 'border-box', 
        height: 40,
        ...props.style 
      }} 
    />
);

const Card: React.FC<PropsWithChildren & { style?: CSSProperties }> = ({ children, style }) => <div style={{ border: '1px solid ' + OutlineBorderColor, borderRadius: '8px', padding: '1.5rem', marginBottom: '1.5rem', backgroundColor: '#fff', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)', ...style }}>{children}</div>;
const CardTitle: React.FC<PropsWithChildren & { style?: CSSProperties }> = ({ children, style }) => <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem', ...style }}>{children}</h2>;

const Table: React.FC<PropsWithChildren & { style?: CSSProperties }> = ({ children, style }) => <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, ...style }}>{children}</table>;
const TableHeader: React.FC<PropsWithChildren> = ({ children }) => <thead>{children}</thead>;
const TableBody: React.FC<PropsWithChildren> = ({ children }) => <tbody>{children}</tbody>;
const TableRow: React.FC<PropsWithChildren & { style?: CSSProperties }> = ({ children, style }) => <tr style={{ borderBottom: '1px solid #eee', ...style }}>{children}</tr>;
const TableHead: React.FC<PropsWithChildren & { style?: CSSProperties }> = ({ children, style }) => (
    <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', borderBottom: '2px solid #ccc', backgroundColor: '#f9fafb', ...style }}>{children}</th>
);
const TableCell: React.FC<PropsWithChildren & { colSpan?: number, style?: CSSProperties }> = ({ children, style, colSpan }) => <td colSpan={colSpan} style={{ padding: '0.75rem', verticalAlign: 'middle', borderBottom: '1px solid #eee', ...style }}>{children}</td>;

const formatCurrency = (amount: number) => new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN'
}).format(amount);

const formatDate = (timestamp: Timestamp): string => {
  if (!timestamp) return '';
  return timestamp.toDate().toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });
};

const SalesPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, initialized, logout } = useAuth();

  // --- State ---
  const [userRole, setUserRole] = useState<string>('staff');
  const [loadingData, setLoadingData] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [lastSaleId, setLastSaleId] = useState<string | null>(null);

  // Data State
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [salesHistory, setSalesHistory] = useState<SaleRecord[]>([]);

  // Transaction State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  // Use two-step cast for initial state value (TS 2345 error)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash' as unknown as PaymentMethod);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  // Filters
  const [historyFilterText, setHistoryFilterText] = useState('');
  const [historyDateFilter, setHistoryDateFilter] = useState('');

  // Clear messages
  useEffect(() => {
    if (error || successMsg) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccessMsg(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, successMsg]);

  // --- Auth Redirect ---
  useEffect(() => {
    // Only redirect if initialization is complete AND user is missing
    if (initialized && !user) {
        navigate('/login');
    }
  }, [initialized, user, navigate]);

  // --- Data Listeners ---
  useEffect(() => {
    if (!initialized || !user) return;

    setLoadingData(true);
    
    // SAFE ROLE CHECK
    const fetchRole = async () => {
      try {
        // Check if user is a real Firebase User instance with the method
        if (user && typeof (user as any).getIdTokenResult === 'function') {
           const tokenResult = await (user as any).getIdTokenResult();
           const role = (tokenResult.claims?.role as string) || 'staff';
           setUserRole(role);
        } else {
           // Fallback if user is a plain object (e.g. from local storage)
           setUserRole((user as any).role || 'staff');
        }
      } catch (err) {
        console.warn("Role check failed, defaulting to staff", err);
        setUserRole('staff');
      }
    };
    fetchRole();

    // 1. Inventory
    const qInv = collection(db, 'inventory');
    const unsubInv = onSnapshot(qInv, (snap) => {
      const inventoryData = snap.docs.map(d => ({ id: d.id, ...d.data() } as InventoryItem));
      setInventory(inventoryData);
    });

    // 2. Customers
    const qCust = collection(db, 'customers');
    const unsubCust = onSnapshot(qCust, (snap) => {
        setCustomers(snap.docs.map(d => ({ id: d.id, ...d.data() } as Customer)));
    });

    // 3. Sales History
    const qSales = query(collection(db, 'sales'), orderBy('timestamp', 'desc'), limit(50));
    const unsubSales = onSnapshot(qSales, (snap) => {
      setSalesHistory(snap.docs.map(d => ({ id: d.id, ...d.data() } as SaleRecord)));
      setLoadingData(false);
    });

    return () => {
        unsubInv();
        unsubCust();
        unsubSales();
    };
  }, [initialized, user]);

  // --- Derived State ---
  const cartTotal = useMemo(() =>
    cart.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0),
    [cart]
  );

  const amountPaidNum = parseFloat(paymentAmount) || 0;
  
  const filteredProducts = useMemo(() => {
    if (!productSearch.trim()) return inventory;
    return inventory.filter(p =>
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(productSearch.toLowerCase()))
    );
  }, [inventory, productSearch]);

  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return customers;
    return customers.filter(c =>
      c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.phone.includes(customerSearch)
    );
  }, [customers, customerSearch]);

  // --- VISIBILITY LOGIC ---
  const displayedHistory = useMemo(() => {
    // Show all records to all staff so everyone can see Admin sales and other Staff sales.
    // The "Served By" column will distinguish who made the sale.
    let history = salesHistory;

    if (selectedCustomer) {
      history = history.filter(sale => sale.customerId === selectedCustomer.id);
    }
    if (historyFilterText) {
       history = history.filter(s => 
           s.userName?.toLowerCase().includes(historyFilterText.toLowerCase()) || 
           s.customerName?.toLowerCase().includes(historyFilterText.toLowerCase())
       );
    }
    if (historyDateFilter) {
       history = history.filter(s => {
           if (!s.timestamp) return false;
           return s.timestamp.toDate().toISOString().split('T')[0] === historyDateFilter;
       });
    }
    return history;
  }, [salesHistory, selectedCustomer, historyFilterText, historyDateFilter]);

  // --- Receipt Generation ---
  const generatePDFReceipt = (saleData: SaleRecord) => {
    const docDefinition: any = {
      content: [
        { text: 'SALES RECEIPT', style: 'header', alignment: 'center' },
        { text: `Receipt #${saleData.saleId?.slice(0, 8).toUpperCase()}`, style: 'subheader', alignment: 'center' },
        { text: `Date: ${formatDate(saleData.timestamp)}`, style: 'date', alignment: 'center', margin: [0, 5, 0, 20] },
        { text: `Served by: ${saleData.userName}`, margin: [0, 0, 0, 20] },
        // ... (Simplified receipt content) ...
        {
            table: {
                headerRows: 1,
                widths: ['*', 'auto', 'auto'],
                body: [
                    [{ text: 'Item', bold: true }, { text: 'Qty', bold: true }, { text: 'Total', bold: true }],
                    ...saleData.items.map(item => [item.itemName, item.quantity, formatCurrency(item.price * item.quantity)])
                ]
            }
        },
        { text: `Total: ${formatCurrency(saleData.total)}`, bold: true, margin: [0, 10, 0, 0] }
      ],
      styles: { header: { fontSize: 18, bold: true } }
    };
    return docDefinition;
  };

  const handlePrintReceipt = (saleId?: string) => {
    const idToUse = saleId || lastSaleId;
    if (!idToUse) return setError('No recent sale to print');
    const sale = salesHistory.find(s => s.saleId === idToUse || s.id === idToUse);
    if (!sale) return setError('Sale not found');
    const pdfDoc = generatePDFReceipt(sale);
    pdfMake.createPdf(pdfDoc).print();
  };

  const handleDownloadReceipt = (saleId?: string) => {
      const idToUse = saleId || lastSaleId;
      if (!idToUse) return setError('No recent sale to download');
      const sale = salesHistory.find(s => s.saleId === idToUse || s.id === idToUse);
      if (!sale) return setError('Sale not found');
      const pdfDoc = generatePDFReceipt(sale);
      pdfMake.createPdf(pdfDoc).download(`receipt.pdf`);
  };

  const addToCart = (product: InventoryItem) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.units_available) {
          setError(`Cannot add more. Only ${product.units_available} left in stock.`);
          return prev;
        }
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + delta;
        const productStock = inventory.find(p => p.id === item.id)?.units_available || 0;
        if (newQty > productStock) {
          setError(`Cannot exceed stock limit of ${productStock}.`);
          return item;
        }
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(item => item.quantity > 0)); 
  };

  const handleCheckout = async () => {
    const safeUser = user as any;
    const currentUserId = safeUser?.uid;
    
    if (!currentUserId) {
        navigate('/login');
        return;
    }
    
    const staffName = safeUser?.displayName || safeUser?.email?.split('@')[0] || 'Staff';

    if (!selectedCustomer) return setError("Please select a customer before checkout.");
    if (cart.length === 0) return setError("Cart is empty.");

    setProcessing(true);
    setError(null);
    setSuccessMsg(null);

    const subtotal = cartTotal;
    const discount = 0; 
    const total = subtotal - discount;
    const paid = amountPaidNum;
    const balance = Math.max(0, total - paid);
    const excess = Math.max(0, paid - total);
    
    try {
      const saleDocRef = doc(collection(db, 'sales'));
      const saleId = saleDocRef.id;

      await runTransaction(db, async (transaction) => {
        const timestamp = serverTimestamp();
        const now = Timestamp.now();
        
        for (const item of cart) {
            const invRef = doc(db, 'inventory', item.id);
            const invDoc = await transaction.get(invRef);
            if (!invDoc.exists()) throw new Error(`Product missing: ${item.name}`);
            const currentStock = invDoc.data()?.units_available || 0;
            if (currentStock < item.quantity) throw new Error(`Insufficient stock: ${item.name}`);
            transaction.update(invRef, { units_available: increment(-item.quantity) });
        }

        const saleData: SaleRecord = {
          id: saleId,
          saleId: saleId,
          customerId: selectedCustomer.id,
          customerName: selectedCustomer.name,
          items: cart.map(c => ({ itemId: c.id, itemName: c.name, quantity: c.quantity, price: c.unit_price, sku: c.sku })), 
          subtotal, discount, total, paid, balance, excess, 
          // Cast paymentMethod to 'any' to resolve the LegacyPaymentMethod assignment error (TS 2322 error)
          paymentMethod: paymentMethod as any,
          timestamp: now, 
          userId: currentUserId,
          userName: staffName, 
          userRole: userRole,   
          userEmail: safeUser.email || '',
        };
        transaction.set(saleDocRef, saleData);

        const customerRef = doc(db, 'customers', selectedCustomer.id);
        transaction.update(customerRef, {
          totalPurchases: increment(total),
          // Use 'balance' as the field for outstanding due amount
          balance: increment(balance), 
        });

        const ledgerRef = doc(collection(db, 'customerLedger', selectedCustomer.id, 'transactions'));
        transaction.set(ledgerRef, {
            transactionType: 'sale',
            saleId: saleId,
            amount: total,
            paid: paid,
            balance: balance,
            excess: excess,
            items: saleData.items,
            date: now, 
            timestamp: timestamp,
            userId: currentUserId,
            status: balance > 0 ? "owing" : excess > 0 ? "overpaid" : "paid"
        });
      });

      setProcessing(false);
      setSuccessMsg(`Sale successful! ID: ${saleId.slice(0, 8).toUpperCase()}.`);
      setLastSaleId(saleId);
      setCart([]);
      setSelectedCustomer(null);
      setPaymentAmount('');
      // Use two-step cast for state reset
      setPaymentMethod('Cash' as unknown as PaymentMethod);
      setCustomerSearch('');

    } catch (e) {
      setProcessing(false);
      setError(`Checkout failed: ${(e as Error).message}`);
      // Use two-step cast for state reset
      setPaymentMethod('Cash' as unknown as PaymentMethod);
    }
  };

  if (!initialized) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: LightBg }}><Loader2 style={{ animation: 'spin 1s linear infinite' }} /></div>;
  }

  // Redirect is handled by useEffect. Return null to avoid flash or errors if user is null.
  if (!user) {
    return null;
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: LightBg, color: '#1f2937', fontFamily: 'Arial, sans-serif' }}>
      <nav style={{ backgroundColor: '#fff', borderBottom: `1px solid ${OutlineBorderColor}`, padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 10, boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Button
                variant="default"
                style={{ backgroundColor: 'transparent', color: PrimaryColor, borderWidth: '1px', borderStyle: 'solid', borderColor: '#ccc' }}
                onClick={() => window.history.back()}
            >
                ← Back
            </Button>
            <h1 style={{ fontSize: '1.5rem', margin: 0, fontWeight: '700', color: PrimaryColor }}>Staff POS</h1>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.875rem', color: MutedColor }}><strong>{(user as any).displayName || (user as any).email}</strong></span>
          <Button variant="destructive" onClick={() => { logout(); navigate('/login'); }} style={{ padding: '0.5rem', borderRadius: '9999px' }}><LogOut size={16} /></Button>
        </div>
      </nav>

      <div style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '1.5rem' }}>
        
        {/* INVENTORY */}
        <div style={{ gridColumn: 'span 4' }}>
            <Card style={{ height: '100%', maxHeight: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column' }}>
                <CardTitle style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Settings size={20} /> Stock
                </CardTitle>
                <Input 
                    placeholder="Search Stock..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    style={{ marginBottom: '1rem' }}
                />
                <div style={{ overflowY: 'auto', flex: 1 }}>
                    <Table>
                        <TableBody>
                            {filteredProducts.map(p => (
                                <TableRow key={p.id}>
                                    <TableCell>
                                        <div style={{ fontWeight: '600' }}>{p.name}</div>
                                        <div style={{ fontSize: '0.85rem', color: MutedColor }}>Stock: {p.units_available}</div>
                                    </TableCell>
                                    <TableCell style={{ textAlign: 'right' }}>
                                        <div style={{ fontWeight: 'bold', color: PrimaryColor }}>{formatCurrency(p.unit_price)}</div>
                                    </TableCell>
                                    <TableCell style={{ width: '40px' }}>
                                        <Button variant="primary-muted" onClick={() => addToCart(p)} disabled={p.units_available <= 0} style={{ padding: '0.25rem' }}><Plus size={16} /></Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </Card>
        </div>

        {/* CART & CUSTOMER */}
        <div style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <Card>
            <CardTitle style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <UserIcon size={20} /> Customer
            </CardTitle>
            <div style={{ position: 'relative' }}>
              <Input
                placeholder="Select Customer..."
                value={customerSearch}
                onChange={(e) => { setCustomerSearch(e.target.value); setShowCustomerDropdown(true); setSelectedCustomer(null); }}
                onFocus={() => setShowCustomerDropdown(true)}
                onBlur={() => setTimeout(() => setShowCustomerDropdown(false), 200)}
              />
              {selectedCustomer && (
                <div style={{ padding: '0.5rem', marginTop: '0.5rem', backgroundColor: LightBg, borderRadius: '4px' }}>
                  <strong>{selectedCustomer.name}</strong> ({selectedCustomer.phone})
                  <div style={{ fontSize: '0.8rem', color: (selectedCustomer as any).balance > 0 ? DestructiveColor : '#16a34a' }}>Due: {formatCurrency((selectedCustomer as any).balance || 0)}</div>
                </div>
              )}
              {showCustomerDropdown && filteredCustomers.length > 0 && !selectedCustomer && (
                <div style={{ position: 'absolute', zIndex: 10, top: '100%', left: 0, right: 0, backgroundColor: '#fff', border: `1px solid ${OutlineBorderColor}`, maxHeight: '200px', overflowY: 'auto', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                  {filteredCustomers.slice(0, 10).map(c => (
                    <div key={c.id} onMouseDown={() => { setSelectedCustomer(c); setCustomerSearch(c.name); setShowCustomerDropdown(false); }} style={{ padding: '0.75rem', cursor: 'pointer', borderBottom: '1px solid #eee' }}>
                      {c.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
          
          <Card style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <CardTitle style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShoppingCart size={20} /> Cart
            </CardTitle>
            <div style={{ overflowY: 'auto', flex: 1, marginBottom: '1rem' }}>
              {cart.map(item => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', borderBottom: `1px solid ${OutlineBorderColor}` }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '600' }}>{item.name}</div>
                    <div style={{ fontSize: '0.8rem' }}>{formatCurrency(item.unit_price)} x {item.quantity}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Button variant="icon" onClick={() => updateQuantity(item.id, -1)}><Minus size={16} /></Button>
                    <span style={{ fontWeight: 'bold' }}>{item.quantity}</span>
                    <Button variant="icon" onClick={() => updateQuantity(item.id, 1)}><Plus size={16} /></Button>
                    <Button variant="icon" onClick={() => removeFromCart(item.id)} style={{ color: DestructiveColor }}><Trash2 size={16} /></Button>
                  </div>
                </div>
              ))}
              {cart.length === 0 && <div style={{textAlign:'center', color: MutedColor, padding: '2rem'}}>Cart is empty</div>}
            </div>
            
            <div style={{ marginBottom: '1rem', borderTop: `2px solid ${OutlineBorderColor}`, paddingTop: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.2rem', color: PrimaryColor }}>
                    <span>Total</span><span>{formatCurrency(cartTotal)}</span>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
                <select 
                    // Use two-step cast for select value
                    value={paymentMethod as unknown as string} 
                    // Use two-step cast for onChange handler value
                    onChange={(e) => setPaymentMethod(e.target.value as unknown as PaymentMethod)} 
                    style={{ padding: '0.5rem', border: `1px solid ${OutlineBorderColor}`, borderRadius: '4px', height: '40px', width: '100%' }}
                >
                    {PAYMENT_METHODS.map(m => 
                        // Use two-step cast for key, value, and children in option
                        <option key={m as unknown as string} value={m as unknown as string}>{m as unknown as string}</option>
                    )}
                </select>
                <Input
                    type="number"
                    placeholder="Amount Paid"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                />
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '1.5rem' }}>
                <span style={{ color: cartTotal > amountPaidNum ? DestructiveColor : PrimaryColor }}>
                    {cartTotal > amountPaidNum ? 'Balance Due:' : 'Change/Excess:'}
                </span>
                <span style={{ color: cartTotal > amountPaidNum ? DestructiveColor : PrimaryColor }}>
                    {formatCurrency(Math.abs(cartTotal - amountPaidNum))}
                </span>
            </div>

            <Button
                onClick={handleCheckout}
                disabled={!selectedCustomer || cart.length === 0 || processing || amountPaidNum < cartTotal}
                style={{ height: '48px', fontSize: '1rem' }}
            >
                {processing ? <Loader2 size={20} className="animate-spin" /> : <CreditCard size={20} />}
                {processing ? 'Processing...' : 'Complete Sale'}
            </Button>
            
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1rem' }}>
                <Button variant="ghost" onClick={() => handlePrintReceipt()} disabled={!lastSaleId}><Printer size={16} /> Print Last Receipt</Button>
                <Button variant="ghost" onClick={() => handleDownloadReceipt()} disabled={!lastSaleId}><Download size={16} /> Download Last Receipt</Button>
            </div>
          </Card>
        </div>

        {/* SALES HISTORY */}
        <div style={{ gridColumn: 'span 4' }}>
            <Card style={{ height: '100%', maxHeight: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column' }}>
                <CardTitle style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <History size={20} /> Sales History
                </CardTitle>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                    <Input 
                        placeholder="Filter by Customer/Staff"
                        value={historyFilterText}
                        onChange={(e) => setHistoryFilterText(e.target.value)}
                    />
                    <Input 
                        type="date"
                        value={historyDateFilter}
                        onChange={(e) => setHistoryDateFilter(e.target.value)}
                        style={{ width: '150px' }}
                    />
                </div>
                
                <div style={{ overflowY: 'auto', flex: 1 }}>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead style={{ width: 100 }}>Date</TableHead>
                                <TableHead>Customer</TableHead>
                                <TableHead style={{ textAlign: 'right' }}>Total</TableHead>
                                <TableHead style={{ width: 80, textAlign: 'center' }}>Receipt</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loadingData ? (
                                <TableRow><TableCell colSpan={4} style={{ textAlign: 'center' }}><Loader2 size={24} className="animate-spin" /></TableCell></TableRow>
                            ) : displayedHistory.length === 0 ? (
                                <TableRow><TableCell colSpan={4} style={{ textAlign: 'center', color: MutedColor }}>No sales history found.</TableCell></TableRow>
                            ) : (
                                displayedHistory.map(sale => (
                                    <TableRow key={sale.id}>
                                        <TableCell style={{ fontSize: '0.75rem', color: MutedColor }}>{formatDate(sale.timestamp)}</TableCell>
                                        <TableCell style={{ fontWeight: '500' }}>{sale.customerName}</TableCell>
                                        <TableCell style={{ textAlign: 'right', fontWeight: 'bold' }}>{formatCurrency(sale.total)}</TableCell>
                                        <TableCell style={{ textAlign: 'center' }}>
                                            <Button variant="icon" onClick={() => handlePrintReceipt(sale.id)}><Printer size={16} /></Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </Card>
        </div>
      </div>
      
      {/* Messages */}
      {error && (
          <div style={{ position: 'fixed', bottom: '1rem', right: '1rem', padding: '1rem', borderRadius: '0.5rem', backgroundColor: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca', display: 'flex', alignItems: 'center', gap: '0.5rem', zIndex: 60 }}>
              <AlertTriangle size={20} /> {error}
          </div>
      )}
      {successMsg && (
          <div style={{ position: 'fixed', bottom: '1rem', right: '1rem', padding: '1rem', borderRadius: '0.5rem', backgroundColor: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', gap: '0.5rem', zIndex: 60 }}>
              <CheckCircle size={20} /> {successMsg}
          </div>
      )}
    </div>
  );
};

export default SalesPage;