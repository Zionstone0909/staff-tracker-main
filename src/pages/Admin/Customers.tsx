"use client"
import React, { useState, useEffect, CSSProperties, PropsWithChildren } from 'react';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { 
  db, 
  auth, 
  APP_ID,
  onAuthStateChanged
} from '../../firebase';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Plus, 
  Trash2, 
  Edit, 
  X, 
  Save, 
  User, 
  Phone,
  Loader2,
  FileText,
  Users
} from 'lucide-react';

// --- Data Paths ---
const getCollectionRef = (col: string) => collection(db, 'artifacts', APP_ID, 'public', 'data', col);
const CUSTOMERS_COLLECTION = 'customers';

// --- Styling Constants ---
const PrimaryColor = '#0B3D91';
const DestructiveColor = '#dc2626';
const LightBg = '#f3f4f6';
const BorderColor = '#e5e7eb';
const MutedColor = '#6b7280';

// --- UI Components ---
const Button: React.FC<PropsWithChildren & React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'default' | 'destructive' | 'outline' | 'ghost' }> = ({
    children, onClick, style, disabled, type = 'button', variant = 'default', ...props
}) => {
    let backgroundColor = PrimaryColor;
    let color = 'white';
    let border = 'none';

    if (variant === 'destructive') {
        backgroundColor = DestructiveColor;
    } else if (variant === 'outline') {
        backgroundColor = 'transparent';
        color = PrimaryColor;
        border = `1px solid ${PrimaryColor}`;
    } else if (variant === 'ghost') {
        backgroundColor = 'transparent';
        color = '#374151';
        border = 'none';
    }

    const baseStyle: CSSProperties = {
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
    <input {...props} style={{ padding: '0.6rem', border: '1px solid #ccc', borderRadius: '4px', width: '100%', boxSizing: 'border-box', ...props.style }} />
);

const Card: React.FC<PropsWithChildren & { style?: CSSProperties }> = ({ children, style }) => (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1.5rem', marginBottom: '1rem', backgroundColor: '#fff', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)', ...style }}>
        {children}
    </div>
);

const Table: React.FC<PropsWithChildren & { style?: CSSProperties }> = ({ children, style }) => <table style={{ width: '100%', borderCollapse: 'collapse', ...style }}>{children}</table>;
const TableHeader: React.FC<PropsWithChildren> = ({ children }) => <thead>{children}</thead>;
const TableBody: React.FC<PropsWithChildren> = ({ children }) => <tbody>{children}</tbody>;
const TableRow: React.FC<PropsWithChildren & { style?: CSSProperties, onClick?: () => void }> = ({ children, style, onClick }) => (
    <tr onClick={onClick} style={{ borderBottom: '1px solid #eee', cursor: onClick ? 'pointer' : 'default', transition: 'background-color 0.1s', ...style }} onMouseEnter={(e) => { if(onClick) e.currentTarget.style.backgroundColor = '#f9fafb'}} onMouseLeave={(e) => { if(onClick) e.currentTarget.style.backgroundColor = 'transparent'}}>{children}</tr>
);
const TableHead: React.FC<PropsWithChildren & { style?: CSSProperties }> = ({ children, style }) => <th scope="col" style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 'bold', borderBottom: '2px solid #ccc', color: '#4b5563', fontSize: '0.85rem', ...style }}>{children}</th>;
const TableCell: React.FC<PropsWithChildren & { colSpan?: number, style?: CSSProperties }> = ({ children, style, colSpan }) => <td colSpan={colSpan} style={{ padding: '0.75rem', verticalAlign: 'middle', fontSize: '0.875rem', ...style }}>{children}</td>;

// --- Types ---
interface Customer {
  id: string;
  name: string;
  phone: string;
  createdAt?: any;
}

const AdminCustomers: React.FC = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({ name: '', phone: '' });

  useEffect(() => {
    // Auth Check
    const unsubAuth = onAuthStateChanged(auth, (user) => {
        // Auth handled by router generally, but good to have listener
    });

    const q = query(getCollectionRef(CUSTOMERS_COLLECTION), orderBy('name'));
    const unsubCustomers = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => {
          const d = doc.data();
          return { id: doc.id, ...d, name: d.name || d.fullName || 'Unknown' } as Customer;
      });
      setCustomers(data);
      setLoading(false);
    });

    return () => {
      unsubAuth();
      unsubCustomers();
    };
  }, []);

  const handleSaveCustomer = async () => {
    if (!formData.name) {
      alert("Customer name is required.");
      return;
    }

    try {
      const payload = {
        name: formData.name,
        phone: formData.phone,
        updatedAt: Date.now()
      };

      if (editingCustomer) {
        const docRef = doc(db, 'artifacts', APP_ID, 'public', 'data', CUSTOMERS_COLLECTION, editingCustomer.id);
        await updateDoc(docRef, payload);
      } else {
        await addDoc(getCollectionRef(CUSTOMERS_COLLECTION), {
            ...payload,
            createdAt: Date.now()
        });
      }

      setIsModalOpen(false);
      setEditingCustomer(null);
      setFormData({ name: '', phone: '' });
    } catch (e) {
      console.error("Error saving customer:", e);
      alert("Failed to save customer.");
    }
  };

  const handleDeleteCustomer = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this customer? This does not delete their transaction history, but they will be removed from lists.")) {
      try {
        const docRef = doc(db, 'artifacts', APP_ID, 'public', 'data', CUSTOMERS_COLLECTION, id);
        await deleteDoc(docRef);
      } catch (e) {
        console.error("Error deleting customer:", e);
        alert("Failed to delete customer.");
      }
    }
  };

  const openAddModal = () => {
    setEditingCustomer(null);
    setFormData({ name: '', phone: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (customer: Customer, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCustomer(customer);
    setFormData({ name: customer.name, phone: customer.phone });
    setIsModalOpen(true);
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.phone.includes(searchTerm)
  );

  if (loading) {
      return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: LightBg, flexDirection: 'column', color: PrimaryColor }}>
            <Loader2 style={{ animation: 'spin 1s linear infinite', marginBottom: '1rem' }} size={40} />
            <p style={{ fontWeight: 500 }}>Loading Customers...</p>
        </div>
      );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: LightBg, padding: 0, fontFamily: 'sans-serif', color: '#1f2937' }}>
      
      {/* Navigation Bar */}
      <nav style={{ borderBottom: '1px solid #e5e7eb', backgroundColor: '#fff', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Button
                variant="outline"
                style={{ backgroundColor: 'transparent', color: PrimaryColor, borderWidth: '1px', borderStyle: 'solid', borderColor: '#ccc' }}
                onClick={() => navigate('/sales')}
            >
                ← Sales
            </Button>
            <Button
                variant="outline"
                style={{ backgroundColor: 'transparent', color: PrimaryColor, borderWidth: '1px', borderStyle: 'solid', borderColor: '#ccc' }}
                onClick={() => navigate('/admin/customer-ledger')}
            >
                Ledger
            </Button>
          </div>
          <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: PrimaryColor }}>Manage Customers</div>
          <Button variant="destructive" onClick={() => navigate('/login')}>
              Logout
          </Button>
      </nav>

      <div style={{ padding: '1.5rem', maxWidth: '1000px', margin: '0 auto' }}>
        
        {/* Header & Actions */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0, color: PrimaryColor }}>Customers</h1>
            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem' }}>View, add, and update customer profiles.</p>
          </div>
          <Button onClick={openAddModal} variant="default">
            <Plus size={16} /> Add New Customer
          </Button>
        </div>

        {/* Search Bar */}
        <Card style={{ marginBottom: '1.5rem' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#6b7280', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'block' }}>Search</label>
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
            <Input 
              type="text" 
              placeholder="Search by name or phone..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '2.5rem', height: '42px' }}
            />
          </div>
        </Card>

        {/* Customers Table */}
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <Table>
              <TableHeader>
                <TableRow style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                  <TableHead>Customer Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead style={{ textAlign: 'center' }}>Ledger</TableHead>
                  <TableHead style={{ textAlign: 'center' }}>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.length > 0 ? (
                  filteredCustomers.map((customer) => (
                    <TableRow 
                        key={customer.id} 
                        onClick={() => navigate(`/admin/customer-ledger?customerId=${customer.id}`)}
                        style={{ cursor: 'pointer' }}
                    >
                      <TableCell>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                             <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#e0e7ff', color: PrimaryColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold' }}>
                                 {customer.name.charAt(0).toUpperCase()}
                             </div>
                             <div style={{ fontWeight: 600, color: '#111827' }}>{customer.name}</div>
                          </div>
                      </TableCell>
                      <TableCell style={{ color: '#6b7280' }}>{customer.phone || '-'}</TableCell>
                      <TableCell style={{ fontSize: '0.75rem', color: '#9ca3af', fontFamily: 'monospace' }}>{customer.id.slice(0, 6)}...</TableCell>
                      <TableCell style={{ textAlign: 'center' }}>
                         <Button 
                             variant="ghost" 
                             onClick={(e) => { e.stopPropagation(); navigate(`/admin/customer-ledger?customerId=${customer.id}`) }}
                             style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', color: PrimaryColor }}
                         >
                             <FileText size={14} /> View
                         </Button>
                      </TableCell>
                      <TableCell style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                          <Button 
                            variant="ghost" 
                            onClick={(e) => openEditModal(customer, e)} 
                            style={{ padding: '0.25rem', color: '#9ca3af' }}
                            title="Edit"
                          >
                              <Edit size={16} />
                          </Button>
                          <Button 
                            variant="ghost" 
                            onClick={(e) => handleDeleteCustomer(customer.id, e)} 
                            style={{ padding: '0.25rem', color: '#9ca3af' }}
                            title="Delete"
                          >
                              <Trash2 size={16} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>
                         <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <Users size={32} style={{ opacity: 0.5, marginBottom: '0.5rem' }} />
                            <p>No customers found.</p>
                         </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', backdropFilter: 'blur(4px)' }}>
          <Card style={{ width: '100%', maxWidth: '500px', padding: 0, overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: PrimaryColor, color: 'white' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                   {editingCustomer ? <Edit size={20} /> : <Plus size={20} />}
                   {editingCustomer ? 'Edit Customer' : 'New Customer'}
              </h3>
              <Button variant="ghost" onClick={() => setIsModalOpen(false)} style={{ padding: '0.25rem', color: 'rgba(255,255,255,0.8)' }}>
                  <X size={20} />
              </Button>
            </div>
            
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 'bold', color: '#374151', marginBottom: '0.25rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><User size={14}/> Name</span>
                </label>
                <Input 
                    value={formData.name} 
                    onChange={(e) => setFormData({...formData, name: e.target.value})} 
                    placeholder="Enter customer name"
                    style={{ padding: '0.75rem' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 'bold', color: '#374151', marginBottom: '0.25rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Phone size={14}/> Phone</span>
                </label>
                <Input 
                    value={formData.phone} 
                    onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                    placeholder="Enter phone number"
                    style={{ padding: '0.75rem' }}
                />
              </div>
            </div>

            <div style={{ padding: '1.5rem', paddingTop: 0, display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <Button onClick={() => setIsModalOpen(false)} variant="outline" style={{ color: '#1f2937', backgroundColor: 'white' }}>Cancel</Button>
              <Button onClick={handleSaveCustomer} variant="default" style={{ display: 'flex', gap: '0.5rem' }}>
                <Save size={16} /> Save Customer
              </Button>
            </div>
          </Card>
        </div>
      )}

    </div>
  );
};

export default AdminCustomers;