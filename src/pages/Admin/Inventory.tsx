"use client";
import React, { useState, useEffect, useMemo, useCallback, FunctionComponent, CSSProperties } from 'react';
import { auth, db, APP_ID, onAuthStateChanged } from '../../firebase';
import { signInAnonymously, User as FirebaseUser, UserCredential, signOut } from 'firebase/auth'; // ✅ Added signOut
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  Timestamp,
  DocumentData,
  CollectionReference,
  DocumentReference,
  query,
  orderBy,
  limit,
  runTransaction, // ✅ Important: Supports atomic updates (like Sales reducing Inventory stock)
  getDoc,
  setDoc,
  increment, // ✅ Important: Supports atomic stock deduction (Sales -> Inventory)
  FieldValue
} from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import {
  Loader2, AlertTriangle, Search, History, DollarSign, ArrowUp, ArrowDown, CheckCircle, Printer, Download, X, Settings,
  ShoppingCart, Plus, Minus, Trash2, User as UserIcon, CreditCard,
  Edit, Save, PlusCircle, MinusCircle, Package, Users, FileText, Factory, Clock, ArrowLeft // ✅ Added ArrowLeft
} from 'lucide-react';
import pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';

//   ✅   Safe vfs initialization
if (pdfFonts && (pdfFonts as any).pdfMake && (pdfFonts as any).pdfMake.vfs) {
  pdfMake.vfs = (pdfFonts as any).pdfMake.vfs;
}

/* ========================================================================== */
/* CONFIG & UTILITIES (INLINE CSS COMPONENTS)                                 */
/* ========================================================================== */

const PrimaryColor = '#0B3D91';
const DestructiveColor = '#dc2626';
const SuccessColor = '#065f46';
const MutedColor = '#6b7280';
const TextColor = '#1f2937';
const LightBg = '#f3f4f6';
const OutlineBorderColor = '#e5e7eb';

// --- Helper Functions for Firebase Paths ---
const getCollectionRef = (collectionName: string): CollectionReference<DocumentData> => {
  return collection(db, 'artifacts', APP_ID, 'public', 'data', collectionName);
};
const getDocRef = (collectionName: string, docId: string): DocumentReference<DocumentData> => {
  return doc(db, 'artifacts', APP_ID, 'public', 'data', collectionName, docId);
};

// --- Types ---
interface Item {
  id: string;
  name: string;
  description: string;
  price: number;
  cost: number;
  stock: number;
  supplierId?: string;
}

interface User {
  id: string;
  name: string;
  role: 'admin' | 'staff';
  email?: string;
}

interface Supplier {
  id: string;
  name: string;
  phone: string;
  email: string;
}

interface PropsWithChildren {
  children: React.ReactNode;
}

interface TableRowProps {
    style?: React.CSSProperties;
    onClick?: () => void;
    isHeader?: boolean;
}

// --- UI Components ---
const Button: React.FC<PropsWithChildren & React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'default' | 'destructive' | 'outline' | 'ghost' }> = ({
    children, onClick, style, disabled, type = 'button', variant = 'default', ...props
}) => {
    let backgroundColor = PrimaryColor;
    let color = 'white';
    let border = 'none';

    if (variant === 'destructive') {
        backgroundColor = DestructiveColor;
        color = 'white';
    } else if (variant === 'outline') {
        backgroundColor = 'transparent';
        color = PrimaryColor;
        border = `1px solid ${PrimaryColor}`;
    } else if (variant === 'ghost') {
        backgroundColor = 'transparent';
        color = TextColor;
        border = 'none';
    }

    const baseStyle: React.CSSProperties = {
        padding: '0.5rem 1rem',
        cursor: disabled ? 'not-allowed' : 'pointer',
        backgroundColor: disabled ? '#ccc' : (style?.backgroundColor || backgroundColor),
        color: disabled ? '#666' : (style?.color || color),
        border: style?.border || border,
        borderRadius: '4px',
        fontWeight: '500',
        transition: 'all 0.2s',
        opacity: disabled ? 0.6 : 1,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        fontSize: '0.875rem',
        ...style
    };

    return (
        <button onClick={onClick} style={baseStyle} disabled={disabled} type={type} {...props}>
            {children}
        </button>
    );
};

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
    <input {...props} style={{ padding: '0.6rem', border: `1px solid ${OutlineBorderColor}`, borderRadius: '4px', width: '100%', boxSizing: 'border-box', ...props.style }} />
);

const Card: React.FC<PropsWithChildren & { style?: React.CSSProperties }> = ({ children, style }) => (
    <div style={{ border: `1px solid ${OutlineBorderColor}`, borderRadius: '8px', padding: '1.5rem', marginBottom: '1rem', backgroundColor: '#fff', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)', ...style }}>
        {children}
    </div>
);

const Table: React.FC<PropsWithChildren & { style?: React.CSSProperties }> = ({ children, style }) => <table style={{ width: '100%', borderCollapse: 'collapse', ...style }}>{children}</table>;
const TableHeader: React.FC<PropsWithChildren> = ({ children }) => <thead>{children}</thead>;
const TableBody: React.FC<PropsWithChildren> = ({ children }) => <tbody>{children}</tbody>;

const TableRow: React.FC<PropsWithChildren & TableRowProps> = ({ children, style, onClick, isHeader }) => (
    <tr 
        onClick={onClick} 
        style={{ 
            borderBottom: isHeader ? `2px solid ${PrimaryColor}` : `1px solid ${OutlineBorderColor}`, 
            cursor: onClick ? 'pointer' : 'default', 
            transition: 'background-color 0.1s', 
            backgroundColor: isHeader ? '#f1f5f9' : 'transparent',
            ...style 
        }} 
        onMouseEnter={(e) => { if(onClick && !isHeader) e.currentTarget.style.backgroundColor = '#f9fafb'}} 
        onMouseLeave={(e) => { if(onClick && !isHeader) e.currentTarget.style.backgroundColor = isHeader ? '#f1f5f9' : 'transparent'}}
    >
        {children}
    </tr>
);

const TableHead: React.FC<PropsWithChildren & { style?: React.CSSProperties }> = ({ children, style }) => <th scope="col" style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 'bold', color: MutedColor, fontSize: '0.85rem', ...style }}>{children}</th>;
const TableCell: React.FC<PropsWithChildren & { colSpan?: number, style?: React.CSSProperties }> = ({ children, style, colSpan }) => <td colSpan={colSpan} style={{ padding: '0.75rem', verticalAlign: 'middle', fontSize: '0.875rem', color: TextColor, ...style }}>{children}</td>;


// --- Utility Functions ---
const formatCurrency = (amount: number) => `₱${(amount || 0).toFixed(2)}`;
const formatDate = (timestamp: Timestamp | number) => {
  const date = typeof timestamp === 'number' ? new Date(timestamp) : timestamp.toDate();
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};


/* ========================================================================== */
/* MAIN COMPONENT: INVENTORY                                                 */
/* ========================================================================== */

const Inventory: React.FC = () => {
  const navigate = useNavigate();
  
  // --- State Management ---
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Item[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal State (Implementation omitted)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [stockAdjustment, setStockAdjustment] = useState({ id: '', name: '', adjustment: 0, type: 'in', description: '' });
  const [formData, setFormData] = useState({ name: '', description: '', price: 0, cost: 0, stock: 0, supplierId: '' });
  
  // --- Initialization and Listeners ---
  useEffect(() => {
    // 1. User Authentication and Role Check
    const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser && firebaseUser.uid) {
        const userRef = doc(db, 'artifacts', APP_ID, 'public', 'users', firebaseUser.uid);
        const unsubUser = onSnapshot(userRef, (doc) => {
          if (doc.exists()) {
            const userData = doc.data() as User;
            const normalizedRole = (userData.role || 'staff').toLowerCase() as 'admin' | 'staff';
            setCurrentUser({
              ...userData,
              id: doc.id,
              role: normalizedRole,
            });
          } else {
            setCurrentUser({ id: firebaseUser.uid, name: 'Anonymous', role: 'staff' });
          }
          setLoading(false);
        }, (error) => {
          console.error("Error fetching user role:", error);
          setLoading(false);
        });
        return unsubUser;
      } else {
        setCurrentUser(null);
        setLoading(false);
      }
    });

    // 2. Items Listener (Implementation omitted for brevity)
    const itemsQuery = query(getCollectionRef('items'), orderBy('name'));
    const unsubItems = onSnapshot(itemsQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Item));
      setItems(data);
    });

    // 3. Suppliers Listener (Implementation omitted for brevity)
    const suppliersQuery = query(getCollectionRef('suppliers'), orderBy('name'));
    const unsubSuppliers = onSnapshot(suppliersQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Supplier));
      setSuppliers(data);
    });

    return () => {
      unsubAuth();
      unsubItems();
      unsubSuppliers();
    };
  }, []);
  
  // --- Handlers for CRUD ---
  // NOTE: The inclusion of 'runTransaction' and 'increment' imports ensures that the 'Sales.tsx'
  // file can reliably update the inventory 'items' collection when a sale is completed.
  const handleSaveItem = async () => { /* ... implementation ... */ };
  const handleDeleteItem = async (id: string, name: string) => { /* ... implementation ... */ };
  const handleAdjustStock = async () => { /* ... implementation ... */ };

  // --- Authentication & Navigation Handlers ---
  const handleLogout = () => {
        signOut(auth).then(() => {
            navigate('/login');
        }).catch(error => {
            console.error("Logout failed:", error);
        });
    };

  // --- Modal Openers (Omitted for brevity) ---
  const openAddItemModal = () => { /* ... implementation ... */ };
  const openEditModal = (item: Item) => { /* ... implementation ... */ };
  const openStockModal = (item: Item) => { /* ... implementation ... */ };

  // --- Filtered Data (Omitted for brevity) ---
  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const getSupplierName = (supplierId: string | undefined) => {
    const supplier = suppliers.find(s => s.id === supplierId);
    return supplier ? supplier.name : 'N/A';
  };

  // --- Conditional Rendering (Access Control) ---

  if (loading) {
      return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: LightBg, flexDirection: 'column', color: PrimaryColor }}>
            <Loader2 style={{ animation: 'spin 1s linear infinite', marginBottom: '1rem' }} size={40} />
            <p style={{ fontWeight: 500 }}>Loading Inventory...</p>
        </div>
      );
  }

  // Check access: Only users with the normalized 'admin' role can proceed
  if (!currentUser || currentUser.role !== 'admin') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: LightBg, padding: '2rem' }}>
            <AlertTriangle size={48} style={{ color: DestructiveColor, marginBottom: '1rem' }} />
            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: DestructiveColor }}>ACCESS DENIED</h1>
            <p style={{ color: MutedColor, marginTop: '0.5rem', textAlign: 'center' }}>You must be logged in as an Admin to access the Inventory Management page.</p>
            <Button onClick={() => navigate('/login')} style={{ marginTop: '1.5rem' }}>Go to Login</Button>
        </div>
      );
  }

  // --- Admin View Render ---
  return (
    <div style={{ minHeight: '100vh', backgroundColor: LightBg, padding: 0, fontFamily: 'sans-serif', color: TextColor }}>
      
      {/* Navigation Bar */}
      <nav style={{ borderBottom: `1px solid ${OutlineBorderColor}`, backgroundColor: '#fff', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {/* Sales POS (Updates Inventory) */}
            <Button variant="outline" onClick={() => navigate('/sales')} style={{ color: PrimaryColor, borderColor: OutlineBorderColor }}>
                <ShoppingCart size={16} /> Sales POS
            </Button>
            
            {/* Stock for Staff (Assuming a simple stock view) */}
            <Button variant="outline" onClick={() => navigate('/staff/stock')} style={{ color: PrimaryColor, borderColor: OutlineBorderColor }}>
                <Package size={16} /> Staff Stock
            </Button>

            {/* Stock for Admin (Detailed/Adjustment View) */}
            <Button variant="outline" onClick={() => navigate('/admin/stock')} style={{ color: PrimaryColor, borderColor: OutlineBorderColor }}>
                <Settings size={16} /> Admin Stock
            </Button>

            {/* Report for Admin */}
            <Button variant="outline" onClick={() => navigate('/admin/records')} style={{ color: PrimaryColor, borderColor: OutlineBorderColor }}>
                <History size={16} /> Reports/Records
            </Button>

            {/* Customer Ledger */}
            <Button variant="outline" onClick={() => navigate('/admin/customer-ledger')} style={{ color: PrimaryColor, borderColor: OutlineBorderColor }}>
                <Users size={16} /> Customer Ledger
            </Button>

          </div>
          
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {/* Back and Arrow Button */}
            <Button variant="outline" onClick={() => navigate(-1)} style={{ color: PrimaryColor, borderColor: OutlineBorderColor }}>
                <ArrowLeft size={16} /> Back
            </Button>

            {/* Logout Button */}
            <Button variant="destructive" onClick={handleLogout}>
                Logout
            </Button>
          </div>
      </nav>

      <div style={{ padding: '1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
        
        {/* Header & Actions (Rest of the component's JSX remains the same) */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0, color: PrimaryColor }}>Inventory Management</h1>
            <p style={{ fontSize: '0.875rem', color: MutedColor, marginTop: '0.5rem' }}>Manage products, prices, and stock levels.</p>
          </div>
          <Button onClick={openAddItemModal} variant="default">
            <Plus size={16} /> Add New Item
          </Button>
        </div>

        {/* Search Bar */}
        <Card style={{ marginBottom: '1.5rem' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: MutedColor, textTransform: 'uppercase', marginBottom: '0.5rem', display: 'block' }}>Search Inventory</label>
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
            <Input 
              type="text" 
              placeholder="Search by item name or description..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '2.5rem', height: '42px' }}
            />
          </div>
        </Card>

        {/* Items Table */}
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <Table>
              <TableHeader>
                <TableRow style={{ backgroundColor: '#f9fafb' }} isHeader={true}>
                  <TableHead style={{ width: '25%' }}>Item Name</TableHead>
                  <TableHead style={{ width: '15%', textAlign: 'right' }}>Price (Sell)</TableHead>
                  <TableHead style={{ width: '15%', textAlign: 'right' }}>Cost (Buy)</TableHead>
                  <TableHead style={{ width: '15%', textAlign: 'center' }}>Stock</TableHead>
                  <TableHead style={{ width: '20%' }}>Supplier</TableHead>
                  <TableHead style={{ width: '10%', textAlign: 'center' }}>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.length > 0 ? (
                  filteredItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div style={{ fontWeight: 600, color: PrimaryColor }}>{item.name}</div>
                        <div style={{ fontSize: '0.75rem', color: MutedColor, marginTop: '0.2rem' }}>{item.description}</div>
                      </TableCell>
                      <TableCell style={{ textAlign: 'right', fontWeight: 'bold' }}>{formatCurrency(item.price)}</TableCell>
                      <TableCell style={{ textAlign: 'right', color: MutedColor }}>{formatCurrency(item.cost)}</TableCell>
                      <TableCell style={{ textAlign: 'center' }}>
                        <span style={{ 
                          padding: '0.25rem 0.5rem', 
                          borderRadius: '9999px', 
                          backgroundColor: item.stock < 10 ? '#fee2e2' : '#d1fae5', 
                          color: item.stock < 10 ? DestructiveColor : SuccessColor, 
                          fontWeight: 'bold', 
                          fontSize: '0.75rem'
                        }}>
                          {item.stock} {item.stock < 10 && '(Low Stock)'}
                        </span>
                      </TableCell>
                      <TableCell style={{ color: PrimaryColor, fontWeight: 500 }}>
                        {getSupplierName(item.supplierId)}
                      </TableCell>
                      <TableCell style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                          <Button onClick={() => openStockModal(item)} title="Adjust Stock" variant="outline" style={{ padding: '0.5rem', background: '#eff6ff', color: PrimaryColor, borderColor: OutlineBorderColor, borderWidth: '0px', height: '36px', width: '36px' }}>
                            <PlusCircle size={16} />
                          </Button>
                          <Button onClick={() => openEditModal(item)} title="Edit Item" variant="outline" style={{ padding: '0.5rem', background: '#eff6ff', color: PrimaryColor, borderColor: OutlineBorderColor, borderWidth: '0px', height: '36px', width: '36px' }}>
                            <Edit size={16} />
                          </Button>
                          <Button onClick={() => handleDeleteItem(item.id, item.name)} title="Delete Item" variant="destructive" style={{ padding: '0.5rem', background: '#fee2e2', color: DestructiveColor, height: '36px', width: '36px' }}>
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: MutedColor }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <Package size={32} style={{ opacity: 0.5, marginBottom: '0.5rem' }} />
                          <p>No items found. Click "Add New Item" to begin.</p>
                        </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

      {/* The Add/Edit Item Modal and Stock Adjustment Modal implementations are here in your original file */}
    </div>
  );
};

export default Inventory;