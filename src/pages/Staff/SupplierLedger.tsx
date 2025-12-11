"use client"
import React, { useState, useEffect, ChangeEvent, PropsWithChildren, CSSProperties, useMemo, FormEvent } from 'react';
// Note: Assuming 'db' and other functions are correctly exported from '../../firebase'
import { db } from '../../firebase';
import { 
  collection, query, orderBy, onSnapshot, doc, runTransaction, 
  Timestamp, where, getDocs, increment 
} from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { Trash2, Search, Edit, ArrowLeft, Save, Loader2 } from 'lucide-react';

// --- STYLING CONSTANTS (Matched to BankDeposit Theme) ---
const PrimaryColor = '#0B3D91';
const DestructiveColor = '#dc2626';
const MutedColor = '#6b7280';
const LightBg = '#f3f4f6';

// --- UI COMPONENTS ---
// Reusing/adapting the structure and style from BankDeposit.tsx source 
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
        // Use the passed style's backgroundColor first, then derived, then disabled gray
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

interface FormState {
  supplier_id: string;
  goods_received: string;
  quantity: number | '';
  amount_owed: number | '';
  amount_paid: number | '';
  transaction_date: string;
}

const initialFormState: FormState = {
  supplier_id: '',
  goods_received: '',
  quantity: '',
  amount_owed: '',
  amount_paid: '',
  transaction_date: new Date().toISOString().substring(0, 10),
};

const SupplierLedger: React.FC = () => {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<SupplierLedgerEntry[]>([]);
  const [formState, setFormState] = useState<FormState>(initialFormState);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [currentEntryId, setCurrentEntryId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Fetch Entries
  useEffect(() => {
    const q = query(collection(db, 'supplier_ledger'), orderBy('transaction_date', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SupplierLedgerEntry[];
      setEntries(data);
    });
    return () => unsubscribe();
  }, []);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormState(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || '' : value,
    }));
  };

  const handleClearForm = () => {
    setFormState(initialFormState);
    setIsEditing(false);
    setCurrentEntryId(null);
  };

  const handleAddOrUpdateEntry = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!formState.supplier_id || !formState.goods_received || formState.quantity === '' || formState.amount_owed === '') {
      alert("Please fill in all required fields: Supplier ID, Goods, Quantity, and Amount Owed.");
      return;
    }

    setLoading(true);

    try {
      const inventoryQuery = query(collection(db, 'inventory'), where('name', '==', formState.goods_received));
      const inventorySnap = await getDocs(inventoryQuery);
      let inventoryDocId: string | null = null;
      
      if (!inventorySnap.empty) {
        inventoryDocId = inventorySnap.docs[0].id;
      }

      await runTransaction(db, async (transaction) => {
        const ledgerRef = isEditing && currentEntryId 
            ? doc(db, 'supplier_ledger', currentEntryId)
            : doc(collection(db, 'supplier_ledger'));
        
        const invRef = inventoryDocId 
            ? doc(db, 'inventory', inventoryDocId) 
            : doc(collection(db, 'inventory'));

        let quantityChange = Number(formState.quantity);
        if (isEditing && currentEntryId) {
            const currentLedgerDoc = await transaction.get(ledgerRef);
            if (!currentLedgerDoc.exists()) throw new Error("Ledger entry not found");
            const oldQuantity = currentLedgerDoc.data().quantity || 0;
            quantityChange = Number(formState.quantity) - oldQuantity;
        }

        transaction.set(ledgerRef, {
            supplier_id: formState.supplier_id,
            goods_received: formState.goods_received,
            quantity: Number(formState.quantity),
            amount_owed: Number(formState.amount_owed),
            amount_paid: Number(formState.amount_paid) || 0,
            transaction_date: formState.transaction_date,
            timestamp: Timestamp.now()
        }, { merge: true });

        // Update Inventory stock
        if (inventoryDocId) {
            transaction.update(invRef, {
                units_available: increment(quantityChange)
            });
        } else {
            // Create new inventory item if not found
            transaction.set(invRef, {
                name: formState.goods_received,
                units_available: Number(formState.quantity),
                unit_price: 0, // Default for new item
                sku: '', // Default for new item
                category: 'General', // Default for new item
                created_at: Timestamp.now()
            });
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
      goods_received: entry.goods_received,
      quantity: entry.quantity,
      amount_owed: entry.amount_owed,
      amount_paid: entry.amount_paid,
      transaction_date: entry.transaction_date,
    });
    setCurrentEntryId(entry.id);
    setIsEditing(true);
    // Smoothly scroll to the top of the page (where the form is)
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string, entryQuantity: number, goodsName: string) => {
    if(!window.confirm("Are you sure? Deleting this entry will deduct the associated stock from inventory. This action cannot be undone.")) return;
    setLoading(true);
    try {
        const inventoryQuery = query(collection(db, 'inventory'), where('name', '==', goodsName));
        const inventorySnap = await getDocs(inventoryQuery);
        
        await runTransaction(db, async (transaction) => {
             const ledgerRef = doc(db, 'supplier_ledger', id);
             // Delete the ledger entry
             transaction.delete(ledgerRef);

             // Deduct stock from inventory
             if (!inventorySnap.empty) {
                 const invRef = doc(db, 'inventory', inventorySnap.docs[0].id);
                 transaction.update(invRef, {
                     units_available: increment(-entryQuantity)
                 });
             }
        });
    } catch (error) {
        console.error("Error deleting:", error);
        alert("Delete failed. Check console for details.");
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
    const totals = entries.reduce(
      (acc, entry) => {
        acc.totalOwed += entry.amount_owed;
        acc.totalPaid += entry.amount_paid;
        return acc;
      },
      { totalOwed: 0, totalPaid: 0 }
    );
    return { ...totals, balance: totals.totalOwed - totals.totalPaid };
  }, [entries]);
  
  // Helper to format currency (assuming USD for non-NGN context, using toFixed for display)
  const formatDollar = (amount: number) => `$${amount.toFixed(2)}`;

  // --- RENDER ---
  return (
    <div style={{ minHeight: '100vh', backgroundColor: LightBg, fontFamily: 'Arial, sans-serif' }}> 
        {/* NAV BAR */}
        <nav style={{ borderBottom: '1px solid #e5e7eb', backgroundColor: '#fff', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}> 
            <Button 
                variant="ghost" 
                onClick={() => navigate(-1)} 
                style={{ backgroundColor: 'transparent', color: PrimaryColor, border: '1px solid #ccc' }} 
            >
                <ArrowLeft size={16} /> Back
            </Button>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: PrimaryColor }}>
                Supplier Ledger
            </h1>
            <div>{/* Spacer for alignment */}</div>
        </nav>

        <main style={{ maxWidth: '80rem', margin: '0 auto', padding: '2rem 1rem' }}> 
            
            {/* SUMMARY CARDS */}
            <Card style={{ backgroundColor: '#e3f2fd', marginBottom: '2rem' }}>
                <CardTitle style={{ fontSize: '1.25rem', marginBottom: '1rem', color: PrimaryColor }}>
                    📊 Financial Summary
                </CardTitle>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                    <Card style={{ padding: '1.5rem', backgroundColor: '#fff', border: '1px solid #ccc', marginBottom: 0 }}>
                        <div style={{ fontSize: '0.875rem', color: MutedColor, marginBottom: '0.5rem' }}>Total Amount Owed</div>
                        <div style={{ fontSize: '2rem', fontWeight: '700', color: DestructiveColor }}>
                            {formatDollar(totalOwed)}
                        </div>
                    </Card>

                    <Card style={{ padding: '1.5rem', backgroundColor: '#fff', border: '1px solid #ccc', marginBottom: 0 }}>
                        <div style={{ fontSize: '0.875rem', color: MutedColor, marginBottom: '0.5rem' }}>Total Amount Paid</div>
                        <div style={{ fontSize: '2rem', fontWeight: '700', color: '#10b981' }}>
                            {formatDollar(totalPaid)}
                        </div>
                    </Card>

                    <Card style={{ padding: '1.5rem', backgroundColor: '#fff', border: '1px solid #ccc', marginBottom: 0 }}>
                        <div style={{ fontSize: '0.875rem', color: MutedColor, marginBottom: '0.5rem' }}>Net Balance</div>
                        <div style={{ fontSize: '2rem', fontWeight: '700', color: balance > 0 ? DestructiveColor : PrimaryColor }}>
                            {formatDollar(balance)}
                        </div>
                    </Card>
                </div>
            </Card>

            {/* FORM CARD */}
            <Card style={{ marginBottom: '2rem' }}> 
                <CardHeader> 
                    <CardTitle>{isEditing ? 'Edit Ledger Entry' : 'Add New Entry'}</CardTitle>
                    <div style={{ fontSize: '0.875rem', color: MutedColor, marginTop: '0.25rem' }}>
                        {isEditing ? 'Updating this entry will adjust inventory stock.' : 'Adding an entry will automatically increase inventory stock.'}
                    </div>
                </CardHeader>
                <CardContent style={{ padding: '0.5rem 0 0 0' }}> 
                    <form onSubmit={handleAddOrUpdateEntry} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}> 
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}> 
                            {/* Input fields */}
                            <div>
                                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem', fontWeight: '500' }}>Supplier ID</label>
                                <Input name="supplier_id" placeholder="SUP-001" value={formState.supplier_id} onChange={handleChange} disabled={loading} required />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem', fontWeight: '500' }}>Goods Received</label>
                                <Input name="goods_received" placeholder="Item Name (Exact Match)" value={formState.goods_received} onChange={handleChange} disabled={loading} required />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem', fontWeight: '500' }}>Quantity</label>
                                <Input name="quantity" type="number" placeholder="0" value={formState.quantity} onChange={handleChange} disabled={loading} required min="0" />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem', fontWeight: '500' }}>Amount Owed ($)</label>
                                <Input name="amount_owed" type="number" placeholder="0.00" value={formState.amount_owed} onChange={handleChange} disabled={loading} required min="0" step="0.01" />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem', fontWeight: '500' }}>Amount Paid ($)</label>
                                <Input name="amount_paid" type="number" placeholder="0.00" value={formState.amount_paid} onChange={handleChange} disabled={loading} min="0" step="0.01" />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem', fontWeight: '500' }}>Transaction Date</label>
                                <Input name="transaction_date" type="date" value={formState.transaction_date} onChange={handleChange} disabled={loading} required />
                            </div>
                          </div>
                         
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '0.5rem' }}>
                            <Button type="button" variant="ghost" onClick={handleClearForm} disabled={loading}>
                                Cancel / Clear
                            </Button>
                            <Button type="submit" disabled={loading}> 
                                {loading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={16} />}
                                {isEditing ? 'Update Entry' : 'Save Entry'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* TABLE CARD */}
            <Card> 
                <CardHeader>
                    <CardTitle>Transaction History</CardTitle>
                </CardHeader>
                <CardContent> 
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', alignItems: 'center' }}>
                        <div style={{ position: 'relative', flexGrow: 1, maxWidth: '400px' }}>
                            <Input
                                type="text"
                                placeholder="Search Supplier ID or Goods..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{ paddingLeft: '2.5rem' }} 
                            />
                            <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: MutedColor }} />
                        </div>
                    </div>

                    <div style={{ overflowX: 'auto' }}> 
                        <Table> 
                            <TableHeader> 
                                <TableRow> 
                                    <TableHead>Date</TableHead> 
                                    <TableHead style={{ backgroundColor: '#e0f7fa' }}>Supplier</TableHead> {/* ADDED STYLE */}
                                    <TableHead>Goods</TableHead>
                                    <TableHead style={{ textAlign: 'center' }}>Qty</TableHead>
                                    <TableHead style={{ textAlign: 'right' }}>Owed ($)</TableHead>
                                    <TableHead style={{ textAlign: 'right' }}>Paid ($)</TableHead>
                                    <TableHead style={{ textAlign: 'right' }}>Balance ($)</TableHead>
                                    <TableHead style={{ textAlign: 'center' }}>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody> 
                                {filteredEntries.length > 0 ? (
                                    filteredEntries.map((entry) => (
                                        <TableRow key={entry.id}> 
                                            <TableCell>{entry.transaction_date}</TableCell>
                                            <TableCell style={{ fontWeight: '700', color: PrimaryColor, backgroundColor: '#f5f5f5' }}>{entry.supplier_id}</TableCell> {/* ADDED STYLE */}
                                            <TableCell>{entry.goods_received}</TableCell>
                                            <TableCell style={{ textAlign: 'center' }}>{entry.quantity}</TableCell>
                                            <TableCell style={{ textAlign: 'right', color: DestructiveColor }}>{formatDollar(entry.amount_owed)}</TableCell>
                                            <TableCell style={{ textAlign: 'right', color: '#10b981' }}>{formatDollar(entry.amount_paid)}</TableCell>
                                            <TableCell style={{ textAlign: 'right', fontWeight: 'bold' }}>{formatDollar(entry.amount_owed - entry.amount_paid)}</TableCell>
                                            <TableCell style={{ textAlign: 'center' }}>
                                                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                                                    <Button variant="icon" onClick={() => handleEdit(entry)} style={{ color: PrimaryColor }}>
                                                        <Edit size={16} />
                                                    </Button>
                                                    <Button variant="icon" onClick={() => handleDelete(entry.id, entry.quantity, entry.goods_received)} style={{ color: DestructiveColor }}>
                                                        <Trash2 size={16} />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={8} style={{ textAlign: 'center', color: MutedColor, padding: '2rem' }}>
                                            No ledger entries found.
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

export default SupplierLedger;