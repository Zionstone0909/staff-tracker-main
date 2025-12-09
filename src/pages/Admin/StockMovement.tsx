
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { 
  collection, 
  query, 
  onSnapshot, 
  orderBy, 
  serverTimestamp, 
  addDoc,
  Timestamp
} from 'firebase/firestore';
import { auth, db, APP_ID, initializeAuth, onAuthStateChanged, type User } from '../../firebase';

// Define local placeholder components with inline styles
const PrimaryColor = '#0B3D91';
const DestructiveColor = '#dc2626';
const SuccessColor = '#065f46';
const ErrorColor = '#b91c1c';
const LightBg = '#f3f4f6';
const OutlineBorderColor = '#e5e7eb';
const MutedColor = '#6b7280';

// Icons
const Loader2 = ({ size = 24, style = {} }: { size?: number; style?: React.CSSProperties }) => (
  <svg style={{ animation: 'spin 1s linear infinite', ...style }} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);

const ArrowUp = ({ size = 16, style = {} }: { size?: number; style?: React.CSSProperties }) => (
  <svg width={size} height={size} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="m18 15-6-6-6 6" />
  </svg>
);

const ArrowDown = ({ size = 16, style = {} }: { size?: number; style?: React.CSSProperties }) => (
  <svg width={size} height={size} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="m6 9 6 6 6-6" />
  </svg>
);

const Plus = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

const Package = ({ size = 24, style = {} }: { size?: number; style?: React.CSSProperties }) => (
  <svg width={size} height={size} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="m7.5 4.27 9 5.15M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
    <path d="m3.3 7 8.7 5 8.7-5M12 22V12" />
  </svg>
);

const UserIcon = ({ size = 16, style = {} }: { size?: number; style?: React.CSSProperties }) => (
  <svg width={size} height={size} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const CheckCircle = ({ size = 16, style = {} }: { size?: number; style?: React.CSSProperties }) => (
  <svg width={size} height={size} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

// --- Type Definitions ---
interface Movement {
  id: string;
  productId: string; // ADDED: Link to inventory item
  productName: string;
  quantity: number;
  type: 'IN' | 'OUT';
  timestamp: Timestamp | Date;
  userId?: string;
}

interface InventorySummary {
  productName: string;
  totalStock: number;
  totalIn: number;
  totalOut: number;
}

// ADDED: Inventory item structure
interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  unit_price: number;
  units_available: number;
  total_value: number;
  suppliers: Array<{ id: string; name: string }>;
  description?: string;
  userId?: string;
  date_added: string;
  last_updated: string;
  low_stock_threshold?: number;
}

// --- UI Components ---
const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'default' | 'ghost' | 'destructive' }> = ({ children, onClick, style, disabled, variant = 'default', type = 'button', ...props }) => {
  let backgroundColor = PrimaryColor;
  let color = 'white';
  let border = '1px solid transparent';

  if (variant === 'ghost') {
    backgroundColor = 'transparent';
    color = PrimaryColor;
    border = `1px solid ${OutlineBorderColor}`;
  } else if (variant === 'destructive') {
    backgroundColor = DestructiveColor;
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '0.5rem 1rem',
        cursor: disabled ? 'not-allowed' : 'pointer',
        backgroundColor: disabled ? '#ccc' : backgroundColor,
        color,
        border,
        borderRadius: '4px',
        fontWeight: '500',
        transition: 'background-color 0.2s',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        ...style
      }}
      {...props}
    >
      {children}
    </button>
  );
};

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label?: string }> = ({ label, ...props }) => (
  <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
    {label && <label htmlFor={props.id} style={{ fontSize: '0.875rem', fontWeight: '500', color: MutedColor, marginBottom: '0.25rem' }}>{label}</label>}
    <input {...props} style={{ padding: '0.6rem 0.8rem', border: '1px solid #ccc', borderRadius: '4px', width: '100%', boxSizing: 'border-box', height: 40, ...props.style }} />
  </div>
);

const Card: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <div style={{ border: `1px solid ${OutlineBorderColor}`, borderRadius: '8px', padding: '1.5rem', marginBottom: '1.5rem', backgroundColor: '#fff', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)', ...style }}>{children}</div>
);

const CardHeader: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: `1px solid ${OutlineBorderColor}` }}>{children}</div>
);

const CardTitle: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0', color: PrimaryColor, ...style }}>{children}</h2>
);

const CardContent: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <div style={{ paddingTop: '0.5rem', ...style }}>{children}</div>
);

const Table: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, ...style }}>{children}</table>
);

const TableHeader: React.FC<{ children: React.ReactNode }> = ({ children }) => <thead>{children}</thead>;
const TableBody: React.FC<{ children: React.ReactNode }> = ({ children }) => <tbody>{children}</tbody>;
const TableRow: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <tr style={{ borderBottom: '1px solid #eee', ...style }}>{children}</tr>
);

const TableHead: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', borderBottom: '2px solid #ccc', backgroundColor: '#f9fafb', ...style }}>
    {children}
  </th>
);

const TableCell: React.FC<{ children: React.ReactNode; style?: React.CSSProperties; colSpan?: number }> = ({ children, style, colSpan }) => (
  <td colSpan={colSpan} style={{ padding: '0.75rem', borderBottom: '1px solid #eee', ...style }}>{children}</td>
);

// --- Movement Item Component ---
const MovementItem: React.FC<{ movement: Movement }> = ({ movement }) => {
  const isIncoming = movement.type === 'IN';
  const icon = isIncoming ? <ArrowUp size={16} /> : <ArrowDown size={16} />;
  
  const colorStyle = isIncoming 
    ? { backgroundColor: '#f0fdf4', color: SuccessColor, borderLeftColor: '#4ade80' } 
    : { backgroundColor: '#fef2f2', color: ErrorColor, borderLeftColor: '#f87171' };
    
  const iconBg = isIncoming 
    ? { backgroundColor: '#10b981', color: 'white' } 
    : { backgroundColor: '#ef4444', color: 'white' };

  const formattedDate = movement.timestamp instanceof Timestamp
    ? movement.timestamp.toDate().toLocaleString()
    : movement.timestamp instanceof Date
    ? movement.timestamp.toLocaleString()
    : 'Pending...';

  return (
    <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        padding: '1rem', 
        borderLeft: '4px solid', 
        borderRadius: '0.5rem', 
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)', 
        ...colorStyle 
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <span style={{ padding: '0.5rem', borderRadius: '9999px', ...iconBg }}>
          {icon}
        </span>
        <div>
          <p style={{ fontSize: '1rem', fontWeight: '600', color: '#1f2937', margin: 0 }}>{movement.productName}</p>
          <p style={{ fontSize: '0.75rem', color: '#4b5563', margin: 0 }}>
            {isIncoming ? 'Stock In' : 'Stock Out'} - {movement.quantity} units
          </p>
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <p style={{ fontSize: '0.875rem', fontWeight: '500', color: '#4b5563', margin: 0 }}>{formattedDate}</p>
      </div>
    </div>
  );
};

// ADDED: localStorage key for inventory
const INVENTORY_STORAGE_KEY = 'staff_tracker_inventory';

// --- Main Component ---
const StockMovement: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState(''); // CHANGED: Now select from inventory
  const [quantity, setQuantity] = useState<string>('');
  const [type, setType] = useState<'IN' | 'OUT'>('IN');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [inventorySummary, setInventorySummary] = useState<InventorySummary[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]); // ADDED: Load inventory

  // ADDED: Load inventory from localStorage
  useEffect(() => {
    const loadInventory = () => {
      const savedInventory = localStorage.getItem(INVENTORY_STORAGE_KEY);
      if (savedInventory) {
        const items = JSON.parse(savedInventory);
        console.log('📦 Loaded inventory items:', items);
        setInventoryItems(items);
      }
    };
    
    loadInventory();
    
    // Listen for localStorage changes from other tabs/components
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === INVENTORY_STORAGE_KEY) {
        loadInventory();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Auto-hide messages
  useEffect(() => {
    if (errorMessage || successMessage) {
      const timer = setTimeout(() => {
        setErrorMessage(null);
        setSuccessMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage, successMessage]);

  // Initialize auth
  useEffect(() => {
    initializeAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // Subscribe to movements
  useEffect(() => {
    if (!isAuthReady || !user) return;

    const movementsPath = collection(db, 'artifacts', APP_ID, 'users', user.uid, 'stock_movements');
    const q = query(movementsPath, orderBy('timestamp', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newMovements: Movement[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data() as Omit<Movement, 'id'>
      }));
      setMovements(newMovements);

      // Calculate inventory summary
      const summary: { [key: string]: { totalIn: number; totalOut: number } } = {};
      newMovements.forEach(movement => {
        const productKey = movement.productName.toLowerCase();
        if (!summary[productKey]) {
          summary[productKey] = { totalIn: 0, totalOut: 0 };
        }
        if (movement.type === 'IN') {
          summary[productKey].totalIn += movement.quantity;
        } else {
          summary[productKey].totalOut += movement.quantity;
        }
      });

      const summaryArray: InventorySummary[] = Object.keys(summary).map(key => ({
        productName: key.charAt(0).toUpperCase() + key.slice(1),
        totalStock: summary[key].totalIn - summary[key].totalOut,
        totalIn: summary[key].totalIn,
        totalOut: summary[key].totalOut
      })).sort((a, b) => b.totalStock - a.totalStock);

      setInventorySummary(summaryArray);
    }, (error) => {
      console.error("Error fetching stock movements:", error);
      setErrorMessage("Failed to load stock movements. Please refresh the page.");
    });

    return () => unsubscribe();
  }, [isAuthReady, user]);

  // ADDED: Function to update inventory in localStorage
  const updateInventoryStock = (productId: string, quantityChange: number, isIncoming: boolean) => {
    const savedInventory = localStorage.getItem(INVENTORY_STORAGE_KEY);
    if (!savedInventory) {
      console.warn('No inventory found in localStorage');
      return false;
    }

    const items: InventoryItem[] = JSON.parse(savedInventory);
    const itemIndex = items.findIndex(item => item.id === productId);

    if (itemIndex === -1) {
      console.error('Product not found in inventory');
      return false;
    }

    const item = items[itemIndex];
    const adjustment = isIncoming ? quantityChange : -quantityChange;
    const newQuantity = item.units_available + adjustment;

    if (newQuantity < 0) {
      setErrorMessage(`Cannot remove ${quantityChange} units. Only ${item.units_available} available in stock.`);
      return false;
    }

    // Update inventory
    items[itemIndex] = {
      ...item,
      units_available: newQuantity,
      total_value: item.unit_price * newQuantity,
      last_updated: new Date().toISOString()
    };

    localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(items));
    setInventoryItems(items); // Update local state
    console.log(`📦 Inventory updated: ${item.name} - ${isIncoming ? '+' : '-'}${quantityChange} units. New stock: ${newQuantity}`);
    return true;
  };

  const handleAddMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    const quantityNum = parseInt(quantity, 10);

    if (!selectedProductId) {
      setErrorMessage("Please select a product from inventory.");
      return;
    }

    if (!quantityNum || quantityNum <= 0) {
      setErrorMessage("Please enter a valid quantity (minimum 1).");
      return;
    }

    if (!user) {
      setErrorMessage("You must be logged in to add movements.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const selectedProduct = inventoryItems.find(item => item.id === selectedProductId);
      if (!selectedProduct) {
        setErrorMessage("Selected product not found in inventory.");
        return;
      }

      // ADDED: Update inventory FIRST (this validates stock levels for OUT movements)
      const inventoryUpdated = updateInventoryStock(selectedProductId, quantityNum, type === 'IN');
      
      if (!inventoryUpdated) {
        // Error message already set by updateInventoryStock
        return;
      }

      // Record movement in Firebase
      const movementData = {
        productId: selectedProductId,
        productName: selectedProduct.name,
        quantity: quantityNum,
        type: type,
        timestamp: serverTimestamp(),
        userId: user.uid,
      };

      const movementsPath = collection(db, 'artifacts', APP_ID, 'users', user.uid, 'stock_movements');
      await addDoc(movementsPath, movementData);

      setSuccessMessage(`✅ ${type === 'IN' ? 'Stock added' : 'Stock removed'}: ${quantityNum} units of ${selectedProduct.name}. Inventory updated.`);
      setSelectedProductId('');
      setQuantity('');
      setType('IN');
    } catch (error) {
      console.error("Error adding stock movement:", error);
      setErrorMessage("Failed to add movement. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ADDED: Get selected product details
  const selectedProduct = useMemo(() => 
    inventoryItems.find(item => item.id === selectedProductId),
    [inventoryItems, selectedProductId]
  );

  if (!isAuthReady) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: LightBg }}>
        <Loader2 size={32} style={{ color: PrimaryColor, marginRight: '0.5rem' }} />
        <span style={{ color: MutedColor }}>Loading Stock Tracker...</span>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: LightBg, fontFamily: 'Inter, sans-serif' }}>
      <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>

      {/* Navigation */}
      <nav style={{ borderBottom: '1px solid #e5e7eb', backgroundColor: '#fff', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
        <Button variant="ghost" onClick={() => window.history.back()}>
          ← Back
        </Button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: MutedColor }}>
            <UserIcon size={16} />
            <span>User: <strong style={{ color: PrimaryColor }}>{user?.uid.slice(0, 8) || 'Guest'}</strong></span>
          </div>
          <Button variant="destructive" onClick={() => {
            localStorage.removeItem("currentUser");
            window.location.href = "/login";
          }}>
            Logout
          </Button>
        </div>
      </nav>

      <main style={{ maxWidth: '80rem', margin: '0 auto', padding: '2rem 1rem' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: PrimaryColor, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', margin: 0 }}>
            <Package size={32} />
            Stock Movement Tracker
          </h1>
          <p style={{ fontSize: '0.875rem', color: MutedColor, marginTop: '0.5rem' }}>Track stock IN/OUT and automatically update inventory</p>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div style={{ padding: '1rem', marginBottom: '1.5rem', backgroundColor: '#ecfdf5', border: `1px solid ${SuccessColor}`, borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle size={20} style={{ color: SuccessColor }} />
            <p style={{ margin: 0, fontWeight: '500', color: SuccessColor }}>{successMessage}</p>
          </div>
        )}

        {/* Error Message */}
        {errorMessage && (
          <div style={{ padding: '1rem', marginBottom: '1.5rem', backgroundColor: '#fee2e2', border: `1px solid ${ErrorColor}`, borderRadius: '4px', color: ErrorColor }}>
            <p style={{ margin: 0, fontWeight: '500' }}>{errorMessage}</p>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
          {/* === Stock Movement Form === */}
          <Card>
            <CardHeader>
              <CardTitle>Record Movement</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddMovement} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* CHANGED: Product Dropdown from Inventory */}
                <div>
                  <label htmlFor="productSelect" style={{ fontSize: '0.875rem', fontWeight: '500', color: MutedColor, marginBottom: '0.5rem', display: 'block' }}>
                    Select Product from Inventory *
                  </label>
                  <select
                    id="productSelect"
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    required
                    style={{ 
                      padding: '0.6rem 0.8rem', 
                      border: '1px solid #ccc', 
                      borderRadius: '4px', 
                      width: '100%', 
                      boxSizing: 'border-box', 
                      height: 40,
                      fontSize: '1rem'
                    }}
                  >
                    <option value="">-- Select a product --</option>
                    {inventoryItems.map(item => (
                      <option key={item.id} value={item.id}>
                        {item.name} (SKU: {item.sku}) - {item.units_available} units available
                      </option>
                    ))}
                  </select>
                  {inventoryItems.length === 0 && (
                    <p style={{ fontSize: '0.75rem', color: ErrorColor, marginTop: '0.5rem', margin: '0.5rem 0 0 0' }}>
                      ⚠️ No inventory items found. Please add items to inventory first.
                    </p>
                  )}
                </div>

                {/* ADDED: Show selected product details */}
                {selectedProduct && (
                  <div style={{ padding: '0.75rem', backgroundColor: '#f9fafb', borderRadius: '4px', border: `1px solid ${OutlineBorderColor}` }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.875rem' }}>
                      <div>
                        <span style={{ color: MutedColor }}>Current Stock:</span>
                        <strong style={{ color: PrimaryColor, marginLeft: '0.25rem' }}>{selectedProduct.units_available} units</strong>
                      </div>
                      <div>
                        <span style={{ color: MutedColor }}>Unit Price:</span>
                        <strong style={{ color: PrimaryColor, marginLeft: '0.25rem' }}>₦{selectedProduct.unit_price.toLocaleString()}</strong>
                      </div>
                      <div>
                        <span style={{ color: MutedColor }}>Category:</span>
                        <strong style={{ marginLeft: '0.25rem' }}>{selectedProduct.category}</strong>
                      </div>
                      <div>
                        <span style={{ color: MutedColor }}>SKU:</span>
                        <strong style={{ marginLeft: '0.25rem' }}>{selectedProduct.sku}</strong>
                      </div>
                    </div>
                  </div>
                )}

                <Input
                  label="Quantity"
                  id="quantity"
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="Minimum 1"
                  min="1"
                  required
                />

                {/* ADDED: Preview after movement */}
                {selectedProduct && quantity && parseInt(quantity) > 0 && (
                  <div style={{ padding: '0.75rem', backgroundColor: type === 'IN' ? '#ecfdf5' : '#fef2f2', borderRadius: '4px', border: `1px solid ${type === 'IN' ? SuccessColor : ErrorColor}` }}>
                    <div style={{ fontSize: '0.875rem', color: type === 'IN' ? SuccessColor : ErrorColor, fontWeight: '600' }}>
                      After this movement:
                    </div>
                    <div style={{ fontSize: '1rem', fontWeight: '700', marginTop: '0.25rem', color: type === 'IN' ? SuccessColor : ErrorColor }}>
                      {selectedProduct.units_available} {type === 'IN' ? '+' : '-'} {parseInt(quantity)} = {selectedProduct.units_available + (type === 'IN' ? parseInt(quantity) : -parseInt(quantity))} units
                    </div>
                    {type === 'OUT' && selectedProduct.units_available < parseInt(quantity) && (
                      <div style={{ fontSize: '0.75rem', color: ErrorColor, marginTop: '0.5rem', fontWeight: '600' }}>
                        ⚠️ Insufficient stock! Available: {selectedProduct.units_available} units
                      </div>
                    )}
                  </div>
                )}

                {/* Type Selection */}
                <div>
                  <label style={{ fontSize: '0.875rem', fontWeight: '500', color: MutedColor, marginBottom: '0.5rem', display: 'block' }}>Movement Type</label>
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button
                      type="button"
                      onClick={() => setType('IN')}
                      style={{
                        flexGrow: 1,
                        padding: '0.5rem',
                        borderRadius: '0.5rem',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        transition: 'all 0.15s ease-in-out',
                        border: type === 'IN' ? `2px solid ${SuccessColor}` : '1px solid #d1d5db',
                        backgroundColor: type === 'IN' ? '#16a34a' : '#f3f4f6',
                        color: type === 'IN' ? 'white' : '#4b5563',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.25rem'
                      }}
                    >
                      <ArrowUp size={16} /> Stock In (Receive)
                    </button>
                    <button
                      type="button"
                      onClick={() => setType('OUT')}
                      style={{
                        flexGrow: 1,
                        padding: '0.5rem',
                        borderRadius: '0.5rem',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        transition: 'all 0.15s ease-in-out',
                        border: type === 'OUT' ? `2px solid ${ErrorColor}` : '1px solid #d1d5db',
                        backgroundColor: type === 'OUT' ? '#dc2626' : '#f3f4f6',
                        color: type === 'OUT' ? 'white' : '#4b5563',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.25rem'
                      }}
                    >
                      <ArrowDown size={16} /> Stock Out (Issue/Sell)
                    </button>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  disabled={isSubmitting || !selectedProductId || !quantity || parseInt(quantity, 10) <= 0 || inventoryItems.length === 0} 
                  style={{ marginTop: '1rem', width: '100%' }}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Plus size={16} />
                      Record Movement & Update Inventory
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* === Current Inventory Summary === */}
          <Card>
            <CardHeader>
              <CardTitle>Movement Summary ({inventorySummary.length} Products)</CardTitle>
            </CardHeader>
            <CardContent style={{ padding: 0 }}>
              {inventorySummary.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: LightBg, borderRadius: '0.5rem', color: MutedColor, fontStyle: 'italic' }}>
                  No movements recorded yet. Add a movement to get started.
                </div>
              ) : (
                <div style={{ overflowX: 'auto', borderRadius: '0.5rem', border: `1px solid ${OutlineBorderColor}` }}>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product Name</TableHead>
                        <TableHead style={{ textAlign: 'right' }}>Total In</TableHead>
                        <TableHead style={{ textAlign: 'right' }}>Total Out</TableHead>
                        <TableHead style={{ textAlign: 'right' }}>Net Stock</TableHead>
                        <TableHead style={{ textAlign: 'center' }}>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {inventorySummary.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell style={{ fontWeight: '600', color: '#111827' }}>{item.productName}</TableCell>
                          <TableCell style={{ textAlign: 'right', color: SuccessColor, fontWeight: '500' }}>
                            +{item.totalIn}
                          </TableCell>
                          <TableCell style={{ textAlign: 'right', color: ErrorColor, fontWeight: '500' }}>
                            -{item.totalOut}
                          </TableCell>
                          <TableCell style={{ textAlign: 'right', fontWeight: '700', fontSize: '1.125rem', color: PrimaryColor }}>
                            {item.totalStock}
                          </TableCell>
                          <TableCell style={{ textAlign: 'center' }}>
                            <span style={{
                              backgroundColor: item.totalStock > 10 ? '#d1fae5' : item.totalStock > 0 ? '#fef3c7' : '#fee2e2',
                              color: item.totalStock > 10 ? SuccessColor : item.totalStock > 0 ? '#92400e' : ErrorColor,
                              fontWeight: 600,
                              padding: '4px 12px',
                              borderRadius: '9999px',
                              fontSize: '0.75rem',
                              display: 'inline-block'
                            }}>
                              {item.totalStock > 10 ? 'In Stock' : item.totalStock > 0 ? 'Low Stock' : 'Out of Stock'}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* === Recent Movements List === */}
        <Card style={{ marginTop: '1.5rem' }}>
          <CardHeader>
            <CardTitle>Recent Movements ({movements.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {movements.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: LightBg, borderRadius: '0.5rem', color: MutedColor, fontStyle: 'italic' }}>
                No stock movements recorded yet. Record your first movement using the form above.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '60vh', overflowY: 'auto', paddingRight: '0.5rem' }}>
                {movements.map((movement) => (
                  <MovementItem key={movement.id} movement={movement} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default StockMovement;
