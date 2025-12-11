"use client"
import React, { useState, useEffect, ChangeEvent, PropsWithChildren, CSSProperties, useMemo, FormEvent } from 'react';
import { db } from '../../firebase';
import { 
  collection, query, orderBy, onSnapshot, doc, runTransaction, 
  Timestamp, where, getDocs, increment, QuerySnapshot, DocumentData 
} from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { Trash2, Search, Edit, ArrowLeft, Save, Loader2, Plus, X } from 'lucide-react';

// --- STYLING CONSTANTS ---
const PrimaryColor = '#0B3D91';
const DestructiveColor = '#dc2626';
const MutedColor = '#6b7280';
const LightBg = '#f3f4f6';

// --- UI COMPONENTS ---
const Button: React.FC<PropsWithChildren & React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'default' | 'ghost' | 'destructive' | 'icon' }> = ({ children, onClick, style, disabled, type = 'button', variant = 'default', ...props }) => {
    let backgroundColor = PrimaryColor;
    let color = 'white';
    let border = 'none';
    let padding = '0.5rem 1rem';
    
    if (variant === 'ghost') {
        backgroundColor = 'transparent';
        color = PrimaryColor;
        border = '1px solid #ccc';
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
        backgroundColor: disabled ? '#ccc' : (style?.backgroundColor || backgroundColor),
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
    <input {...props} style={{ padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px', width: '100%', boxSizing: 'border-box', height: 40, ...props.style }} /> 
);

const Card: React.FC<PropsWithChildren & { style?: CSSProperties }> = ({ children, style }) => (
    <div style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '1rem', marginBottom: '1rem', backgroundColor: '#fff', ...style }}> 
        {children}
    </div>
);

const CardHeader: React.FC<PropsWithChildren> = ({ children }) => <div style={{ marginBottom: '0.5rem' }}>{children}</div>; 
const CardTitle: React.FC<PropsWithChildren & { style?: CSSProperties }> = ({ children, style }) => <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0, ...style }}>{children}</h2>; 
const CardContent: React.FC<PropsWithChildren & { style?: CSSProperties }> = ({ children, style }) => <div style={{ paddingTop: '0.5rem', ...style }}>{children}</div>; 

const Table: React.FC<PropsWithChildren> = ({ children }) => <table style={{ width: '100%', borderCollapse: 'collapse' }}>{children}</table>; 
const TableHeader: React.FC<PropsWithChildren> = ({ children }) => <thead>{children}</thead>; 
const TableBody: React.FC<PropsWithChildren> = ({ children }) => <tbody>{children}</tbody>; 
const TableRow: React.FC<PropsWithChildren & { style?: CSSProperties }> = ({ children, style }) => <tr style={{ borderBottom: '1px solid #eee', ...style }}>{children}</tr>; 
const TableHead: React.FC<PropsWithChildren & { style?: CSSProperties }> = ({ children, style }) => (
    <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 'bold', borderBottom: '2px solid #ccc', ...style }}>{children}</th> 
);
const TableCell: React.FC<PropsWithChildren & { colSpan?: number, style?: CSSProperties }> = ({ children, style, colSpan }) => <td colSpan={colSpan} style={{ padding: '0.75rem', verticalAlign: 'middle', ...style }}>{children}</td>; 


// --- LOGIC & TYPES ---

interface SupplierLedgerEntry {
  id: string;
  supplier_id: string;
  goods_received: string; 
  quantity: number;
  amount_owed: number;
  amount_paid: number;
  transaction_date: string;
  timestamp?: Timestamp;
}

interface LedgerItem {
  goods_received: string;
  quantity: number | '';
  amount_owed: number | '';
  amount_paid: number | '';
}

interface FormState {
  supplier_id: string;
  transaction_date: string;
  items: LedgerItem[];
}

interface InventoryItemOption {
  name: string;
  stock: number;
}

const initialFormState: FormState = {
  supplier_id: '',
  transaction_date: new Date().toISOString().substring(0, 10),
  items: [{ goods_received: '', quantity: '', amount_owed: '', amount_paid: '' }],
};

const SupplierLedger: React.FC = () => {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<SupplierLedgerEntry[]>([]);
  const [formState, setFormState] = useState<FormState>(initialFormState);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [currentEntryId, setCurrentEntryId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [loading, setLoading] = useState(false);
  
  // Autocomplete Data
  const [inventoryItems, setInventoryItems] = useState<InventoryItemOption[]>([]);
  const [supplierOptions, setSupplierOptions] = useState<string[]>([]);

  // Fetch Inventory & Suppliers for Autocomplete
  useEffect(() => {
    // 1. Fetch Inventory Items
    const qInv = query(collection(db, 'inventory'));
    const unsubInv = onSnapshot(qInv, (snapshot: QuerySnapshot<DocumentData>) => {
      const items = snapshot.docs
        .map(doc => {
            const data = doc.data() as any;
            // Support both 'name' and 'itemName' if schema varies, default to 'name'
            const name = data.name || data.itemName;
            return { name: name as string, stock: Number(data.units_available || data.stock || 0) };
        })
        .filter(item => item.name && typeof item.name === 'string');
      
      // Deduplicate by name and sort
      const uniqueMap = new Map<string, number>();
      items.forEach(i => uniqueMap.set(i.name, i.stock));
      const uniqueItems = Array.from(uniqueMap.entries())
        .map(([name, stock]) => ({ name, stock }))
        .sort((a, b) => a.name.localeCompare(b.name));

      setInventoryItems(uniqueItems);
    });

    // 2. Fetch Suppliers (from 'suppliers' collection and history)
    const qSuppliers = query(collection(db, 'suppliers'));
    const qLedger = query(collection(db, 'supplier_ledger'));
    
    // We'll maintain a set of options
    const updateSupplierOptions = (supplierDocs: DocumentData[], ledgerDocs: DocumentData[]) => {
        const options = new Set<string>();

        // Add from Suppliers Collection (Name + Phone)
        supplierDocs.forEach(d => {
            const data = d.data();
            const name = data.name || data.supplierName || '';
            const phone = data.phone || data.phoneNumber || '';
            
            if (name && phone) options.add(`${name} [${phone}]`);
            else if (name) options.add(name);
            else if (phone) options.add(phone);
        });

        // Add historical IDs from Ledger (in case they don't exist in suppliers collection)
        ledgerDocs.forEach(d => {
            const data = d.data();
            if (data.supplier_id && typeof data.supplier_id === 'string') {
                options.add(data.supplier_id);
            }
        });

        setSupplierOptions(Array.from(options).sort());
    };

    // Listen to Suppliers
    const unsubSuppliers = onSnapshot(qSuppliers, (supSnap) => {
        // We also need ledger data to merge, but we can't nest async listeners easily without state.
        // For simplicity, we'll fetch ledger snapshot once here or rely on separate listener.
        // Let's rely on the separate ledger listener to update 'supplierOptions' via a combined state or just fetch once.
        // To keep it reactive, let's just use the main ledger listener to trigger updates if needed, 
        // but cleaner is to just store them separately and merge in render or a 3rd effect.
        // simplified: Just fetch ledger once for historical options or let the user type them.
        // better: just listen to suppliers here.
        
        const supDocs = supSnap.docs;
        
        // Fetch ledger one-off to backfill history
        getDocs(qLedger).then(ledgerSnap => {
            updateSupplierOptions(supDocs, ledgerSnap.docs);
        });
    });

    return () => {
        unsubInv();
        unsubSuppliers();
    };
  }, []);

  // Fetch Ledger Entries for the Table
  useEffect(() => {
    const q = query(collection(db, 'supplier_ledger'), orderBy('transaction_date', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as any)
      })) as SupplierLedgerEntry[];
      setEntries(data);
    });
    return () => unsubscribe();
  }, []);

  // --- Form Handlers ---

  const handleGlobalChange = (e: ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setFormState(prev => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (index: number, field: keyof LedgerItem, value: any) => {
      setFormState(prev => {
          const newItems = [...prev.items];
          newItems[index] = { ...newItems[index], [field]: value };
          return { ...prev, items: newItems };
      });
  };

  const handleAddItem = () => {
      setFormState(prev => ({
          ...prev,
          items: [...prev.items, { goods_received: '', quantity: '', amount_owed: '', amount_paid: '' }]
      }));
  };

  const handleRemoveItem = (index: number) => {
      if (formState.items.length <= 1) return;
      setFormState(prev => ({
          ...prev,
          items: prev.items.filter((_, i) => i !== index)
      }));
  };

  const handleClearForm = () => {
    setFormState(initialFormState);
    setIsEditing(false);
    setCurrentEntryId(null);
  };

  const handleAddOrUpdateEntry = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Basic Validation
    if (!formState.supplier_id) {
        alert("Please enter a Supplier.");
        setLoading(false);
        return;
    }
    for (const item of formState.items) {
        if (!item.goods_received || item.quantity === '' || item.amount_owed === '') {
            alert("Please complete all Goods, Quantity, and Amount fields.");
            setLoading(false);
            return;
        }
    }

    try {
      // 1. Resolve Inventory IDs for all items involved
      const uniqueGoods = Array.from(new Set(formState.items.map(i => i.goods_received)));
      const inventoryMap = new Map<string, string>(); // Name -> DocID

      // Look up existing inventory items by name
      await Promise.all(uniqueGoods.map(async (name) => {
          const q = query(collection(db, 'inventory'), where('name', '==', name));
          const snap = await getDocs(q);
          if (!snap.empty) {
              inventoryMap.set(name, snap.docs[0].id);
          }
      }));

      await runTransaction(db, async (transaction) => {
        // If Editing, we process only the single item (assuming length 1 for edit mode simplicity)
        if (isEditing && currentEntryId) {
             const item = formState.items[0];
             const ledgerRef = doc(db, 'supplier_ledger', currentEntryId as string);
             
             // Get old data to adjust stock correctly
             const oldDoc = await transaction.get(ledgerRef);
             if (!oldDoc.exists()) throw new Error("Entry not found");
             
             const oldData = oldDoc.data() as Record<string, any>;
             const oldQty = Number(oldData.quantity || 0);
             const oldGoods = String(oldData.goods_received || '');
             
             // Calculate difference
             const qtyDiff = Number(item.quantity) - oldQty;

             // Update Ledger
             transaction.update(ledgerRef, {
                 supplier_id: formState.supplier_id,
                 goods_received: item.goods_received,
                 quantity: Number(item.quantity),
                 amount_owed: Number(item.amount_owed),
                 amount_paid: Number(item.amount_paid) || 0,
                 transaction_date: formState.transaction_date,
             });

             // Update Inventory Logic
             // If goods name changed, this logic is complex (deduct old, add new).
             // For simplicity, we assume robust users or we handle the 'same item' stock update.
             // If item name matches, update stock.
             if (oldGoods === item.goods_received) {
                 const invId = inventoryMap.get(item.goods_received);
                 if (invId) {
                     const invRef = doc(db, 'inventory', invId);
                     transaction.update(invRef, { units_available: increment(qtyDiff) });
                 }
             } else {
                 // Name changed: Revert old stock, add new stock
                 // 1. Revert Old
                 const qOld = query(collection(db, 'inventory'), where('name', '==', oldGoods));
                 const snapOld = await getDocs(qOld);
                 if (!snapOld.empty) {
                     const oldInvRef = doc(db, 'inventory', snapOld.docs[0].id);
                     transaction.update(oldInvRef, { units_available: increment(-oldQty) });
                 }
                 // 2. Add New
                 const invId = inventoryMap.get(item.goods_received);
                 if (invId) {
                     const invRef = doc(db, 'inventory', invId);
                     transaction.update(invRef, { units_available: increment(Number(item.quantity)) });
                 } else {
                     // Create new if name changed to something non-existent
                     const newInvRef = doc(collection(db, 'inventory'));
                     transaction.set(newInvRef, {
                         name: item.goods_received,
                         units_available: Number(item.quantity),
                         created_at: Timestamp.now(),
                         category: 'General'
                     });
                 }
             }
        } 
        else {
            // Batch Create
            for (const item of formState.items) {
                const newLedgerRef = doc(collection(db, 'supplier_ledger'));
                
                transaction.set(newLedgerRef, {
                    supplier_id: formState.supplier_id,
                    goods_received: item.goods_received,
                    quantity: Number(item.quantity),
                    amount_owed: Number(item.amount_owed),
                    amount_paid: Number(item.amount_paid) || 0,
                    transaction_date: formState.transaction_date,
                    timestamp: Timestamp.now()
                });

                const invId = inventoryMap.get(item.goods_received);
                if (invId) {
                    // Update existing inventory stock
                    const invRef = doc(db, 'inventory', invId);
                    transaction.update(invRef, { units_available: increment(Number(item.quantity)) });
                } else {
                    // Create new inventory item
                    const newInvRef = doc(collection(db, 'inventory'));
                    transaction.set(newInvRef, {
                        name: item.goods_received,
                        units_available: Number(item.quantity),
                        unit_price: 0,
                        sku: '',
                        category: 'General',
                        created_at: Timestamp.now()
                    });
                }
            }
        }
      });

      handleClearForm();
    } catch (error) {
      console.error("Error saving entry:", error);
      alert("Failed to save entry. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (entry: SupplierLedgerEntry) => {
    setFormState({
      supplier_id: entry.supplier_id,
      transaction_date: entry.transaction_date,
      items: [{
          goods_received: entry.goods_received,
          quantity: entry.quantity,
          amount_owed: entry.amount_owed,
          amount_paid: entry.amount_paid
      }]
    });
    setCurrentEntryId(entry.id);
    setIsEditing(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string, entryQuantity: number, goodsName: string) => {
    if(!window.confirm("Are you sure? Deleting this entry will deduct the associated stock from inventory.")) return;
    setLoading(true);
    try {
        const q = query(collection(db, 'inventory'), where('name', '==', goodsName));
        const snap = await getDocs(q);
        
        await runTransaction(db, async (transaction) => {
             const ledgerRef = doc(db, 'supplier_ledger', id);
             transaction.delete(ledgerRef);

             if (!snap.empty) {
                 const invRef = doc(db, 'inventory', snap.docs[0].id);
                 transaction.update(invRef, { units_available: increment(-entryQuantity) });
             }
        });
    } catch (error) {
        console.error("Error deleting:", error);
    } finally {
        setLoading(false);
    }
  };

  const filteredEntries = useMemo(() => {
    return entries.filter(entry =>
        entry.supplier_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.goods_received.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [entries, searchTerm]);

  const { totalOwed, totalPaid, balance } = useMemo(() => {
    return entries.reduce(
      (acc, entry) => ({
        totalOwed: acc.totalOwed + entry.amount_owed,
        totalPaid: acc.totalPaid + entry.amount_paid,
        balance: acc.balance + (entry.amount_owed - entry.amount_paid)
      }),
      { totalOwed: 0, totalPaid: 0, balance: 0 }
    );
  }, [entries]);
  
  const formatDollar = (amount: number) => `$${amount.toFixed(2)}`;

  // --- RENDER ---
  return (
    <div style={{ minHeight: '100vh', backgroundColor: LightBg, fontFamily: 'Arial, sans-serif' }}> 
        <nav style={{ borderBottom: '1px solid #e5e7eb', backgroundColor: '#fff', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}> 
            <Button variant="ghost" onClick={() => navigate(-1)}>
                <ArrowLeft size={16} /> Back
            </Button>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: PrimaryColor }}>
                Supplier Ledger
            </h1>
            <div></div>
        </nav>

        <main style={{ maxWidth: '80rem', margin: '0 auto', padding: '2rem 1rem' }}> 
            
            {/* SUMMARY */}
            <Card style={{ backgroundColor: '#e3f2fd', marginBottom: '2rem' }}>
                <CardTitle style={{ fontSize: '1.25rem', marginBottom: '1rem', color: PrimaryColor }}>
                    📊 Financial Summary
                </CardTitle>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                    <Card style={{ padding: '1.5rem', marginBottom: 0 }}>
                        <div style={{ fontSize: '0.875rem', color: MutedColor }}>Total Amount Owed</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: '700', color: DestructiveColor }}>{formatDollar(totalOwed)}</div>
                    </Card>
                    <Card style={{ padding: '1.5rem', marginBottom: 0 }}>
                        <div style={{ fontSize: '0.875rem', color: MutedColor }}>Total Amount Paid</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#10b981' }}>{formatDollar(totalPaid)}</div>
                    </Card>
                    <Card style={{ padding: '1.5rem', marginBottom: 0 }}>
                        <div style={{ fontSize: '0.875rem', color: MutedColor }}>Net Balance</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: '700', color: balance > 0 ? DestructiveColor : PrimaryColor }}>{formatDollar(balance)}</div>
                    </Card>
                </div>
            </Card>

            {/* FORM */}
            <Card style={{ marginBottom: '2rem' }}> 
                <CardHeader> 
                    <CardTitle>{isEditing ? 'Edit Ledger Entry' : 'New Transaction'}</CardTitle>
                    <div style={{ fontSize: '0.875rem', color: MutedColor }}>
                        {isEditing ? 'Update transaction details.' : 'Add items to stock and record debt.'}
                    </div>
                </CardHeader>
                <CardContent> 
                    <form onSubmit={handleAddOrUpdateEntry} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}> 
                        
                        {/* Top Section: Supplier & Date */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem', fontWeight: '500' }}>Supplier (Name or Phone)</label>
                                <Input 
                                    name="supplier_id" 
                                    placeholder="Search by Name or Phone..." 
                                    value={formState.supplier_id} 
                                    onChange={handleGlobalChange} 
                                    disabled={loading} 
                                    list="supplier-options"
                                    required 
                                    autoComplete="off"
                                />
                                <datalist id="supplier-options">
                                    {supplierOptions.map((opt, i) => <option key={i} value={opt} />)}
                                </datalist>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem', fontWeight: '500' }}>Transaction Date</label>
                                <Input name="transaction_date" type="date" value={formState.transaction_date} onChange={handleGlobalChange} disabled={loading} required />
                            </div>
                        </div>

                        {/* Items Section */}
                        <div style={{ backgroundColor: '#f9fafb', padding: '1rem', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', alignItems: 'center' }}>
                                <label style={{ fontSize: '0.875rem', fontWeight: '600', color: PrimaryColor }}>Goods & Payment Details</label>
                                {!isEditing && (
                                    <Button variant="ghost" onClick={handleAddItem} style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}>
                                        <Plus size={14} /> Add Line Item
                                    </Button>
                                )}
                            </div>

                            {formState.items.map((item, index) => (
                                <div key={index} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', marginBottom: '0.75rem' }}>
                                    <div style={{ flex: 3 }}>
                                        <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '2px' }}>Goods Received</label>
                                        <Input 
                                            placeholder="Item Name" 
                                            value={item.goods_received} 
                                            onChange={(e) => handleItemChange(index, 'goods_received', e.target.value)} 
                                            list="inventory-options"
                                            required
                                            autoComplete="off"
                                        />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '2px' }}>Qty</label>
                                        <Input 
                                            type="number" placeholder="0" 
                                            value={item.quantity} 
                                            onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || '')} 
                                            required min="0" 
                                        />
                                    </div>
                                    <div style={{ flex: 1.5 }}>
                                        <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '2px' }}>Cost (Owed)</label>
                                        <Input 
                                            type="number" placeholder="0.00" 
                                            value={item.amount_owed} 
                                            onChange={(e) => handleItemChange(index, 'amount_owed', parseFloat(e.target.value) || '')} 
                                            required min="0" step="0.01" 
                                        />
                                    </div>
                                    <div style={{ flex: 1.5 }}>
                                        <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '2px' }}>Paid Now</label>
                                        <Input 
                                            type="number" placeholder="0.00" 
                                            value={item.amount_paid} 
                                            onChange={(e) => handleItemChange(index, 'amount_paid', parseFloat(e.target.value) || '')} 
                                            min="0" step="0.01" 
                                        />
                                    </div>
                                    {!isEditing && formState.items.length > 1 && (
                                        <Button 
                                            variant="icon" 
                                            onClick={() => handleRemoveItem(index)}
                                            style={{ color: DestructiveColor, marginBottom: '5px' }}
                                            title="Remove line"
                                        >
                                            <X size={20} />
                                        </Button>
                                    )}
                                </div>
                            ))}
                            
                            {!isEditing && (
                                <div style={{ marginTop: '0.5rem' }}>
                                    <Button variant="ghost" onClick={handleAddItem} style={{ width: '100%', borderStyle: 'dashed' }}>
                                        <Plus size={16} /> + Goods
                                    </Button>
                                </div>
                            )}
                            
                            {/* Datalist for Items shared across inputs */}
                            <datalist id="inventory-options">
                                {inventoryItems.map((item, i) => (
                                    <option key={i} value={item.name}>{`Stock: ${item.stock}`}</option>
                                ))}
                            </datalist>
                        </div>
                          
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                            <Button type="button" variant="ghost" onClick={handleClearForm} disabled={loading}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={loading}> 
                                {loading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={16} />}
                                {isEditing ? 'Update Entry' : 'Save Transaction'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* TABLE */}
            <Card> 
                <CardHeader>
                    <CardTitle>Transaction History</CardTitle>
                </CardHeader>
                <CardContent> 
                    <div style={{ position: 'relative', marginBottom: '1rem', maxWidth: '400px' }}>
                        <Input
                            type="text"
                            placeholder="Search Supplier or Goods..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ paddingLeft: '2.5rem' }} 
                        />
                        <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: MutedColor }} />
                    </div>

                    <div style={{ overflowX: 'auto' }}> 
                        <Table> 
                            <TableHeader> 
                                <TableRow> 
                                    <TableHead>Date</TableHead> 
                                    <TableHead>Supplier</TableHead> 
                                    <TableHead>Goods</TableHead>
                                    <TableHead style={{ textAlign: 'center' }}>Qty</TableHead>
                                    <TableHead style={{ textAlign: 'right' }}>Owed ($)</TableHead>
                                    <TableHead style={{ textAlign: 'right' }}>Paid ($)</TableHead>
                                    <TableHead style={{ textAlign: 'center' }}>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody> 
                                {filteredEntries.length > 0 ? (
                                    filteredEntries.map((entry) => (
                                        <TableRow key={entry.id}> 
                                            <TableCell>{entry.transaction_date}</TableCell>
                                            <TableCell style={{ fontWeight: '600', color: PrimaryColor }}>{entry.supplier_id}</TableCell>
                                            <TableCell>{entry.goods_received}</TableCell>
                                            <TableCell style={{ textAlign: 'center' }}>{entry.quantity}</TableCell>
                                            <TableCell style={{ textAlign: 'right', color: DestructiveColor }}>{formatDollar(entry.amount_owed)}</TableCell>
                                            <TableCell style={{ textAlign: 'right', color: '#10b981' }}>{formatDollar(entry.amount_paid)}</TableCell>
                                            <TableCell style={{ textAlign: 'center' }}>
                                                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                                                    <Button variant="icon" onClick={() => handleEdit(entry)}><Edit size={16} /></Button>
                                                    <Button variant="icon" onClick={() => handleDelete(entry.id, entry.quantity, entry.goods_received)} style={{ color: DestructiveColor }}><Trash2 size={16} /></Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: MutedColor }}>No entries found.</TableCell>
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

export default SupplierLedger;