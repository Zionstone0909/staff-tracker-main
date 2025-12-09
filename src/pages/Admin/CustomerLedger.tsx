import React, { useState, useEffect, useMemo, CSSProperties, PropsWithChildren } from 'react';
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
  LEDGER_COLLECTION, 
  CUSTOMERS_COLLECTION, 
  auth, 
  getRole 
} from '../../firebase';
import { Customer, LedgerEntry, CustomerBalance } from '../../types/types';
// @ts-ignore
import pdfMake from 'pdfmake/build/pdfmake';
// @ts-ignore
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
  Phone
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

// --- UI Helper Components ---
const Button: React.FC<PropsWithChildren & React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'default' | 'destructive' | 'outline' }> = ({
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
        boxSizing: 'border-box', // Critical for preventing overlap
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
      boxSizing: 'border-box', // Critical for preventing overlap
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
  const [newCustomerData, setNewCustomerData] = useState({ name: '', phone: '' });

  const [formData, setFormData] = useState({
    customerId: '',
    date: new Date().toISOString().split('T')[0],
    type: 'debit' as 'credit' | 'debit',
    amount: '',
    description: ''
  });

  useEffect(() => {
    // Check Auth
    if (auth.currentUser && getRole(auth.currentUser) !== 'admin') {
      console.warn("Access Denied: Admin only");
    }

    // Subscribe to Customers
    const unsubCustomers = onSnapshot(collection(db, CUSTOMERS_COLLECTION), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer));
      setCustomers(data);
    });

    // Subscribe to Ledger Entries
    const q = query(collection(db, LEDGER_COLLECTION), orderBy('date', 'desc'));
    const unsubLedger = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LedgerEntry));
      setLedgerEntries(data);
      setLoading(false);
    });

    return () => {
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
      
      if (entry.type === 'debit') {
        balances[entry.customerId].totalDebit += Number(entry.amount);
      } else {
        balances[entry.customerId].totalCredit += Number(entry.amount);
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

  const handleExportPDF = () => {
    try {
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
      let finalCustomerId = formData.customerId;

      // Handle New Customer Creation
      if (isNewCustomerMode && !editingEntry) {
          if (!newCustomerData.name) {
              alert("Please enter a customer name.");
              return;
          }
          
          const newCustomerPayload = {
              name: newCustomerData.name,
              phone: newCustomerData.phone,
              createdAt: Date.now()
          };

          const docRef = await addDoc(collection(db, CUSTOMERS_COLLECTION), newCustomerPayload);
          finalCustomerId = docRef.id;
      }

      if (!finalCustomerId) {
          alert("Please select or create a customer.");
          return;
      }

      const payload = {
        customerId: finalCustomerId,
        date: formData.date,
        type: formData.type,
        amount: Number(formData.amount),
        description: formData.description,
        createdAt: Date.now(),
        createdBy: auth.currentUser?.uid
      };

      if (editingEntry) {
        await updateDoc(doc(db, LEDGER_COLLECTION, editingEntry.id), payload);
      } else {
        await addDoc(collection(db, LEDGER_COLLECTION), payload);
      }
      
      setIsEntryModalOpen(false);
      setEditingEntry(null);
      setFormData({ customerId: '', date: new Date().toISOString().split('T')[0], type: 'debit', amount: '', description: '' });
      setNewCustomerData({ name: '', phone: '' });
      setIsNewCustomerMode(false);
    } catch (error) {
      console.error("Error saving entry:", error);
      alert("Failed to save entry");
    }
  };

  const handleDeleteEntry = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this transaction?")) {
      try {
        await deleteDoc(doc(db, LEDGER_COLLECTION, id));
      } catch (error) {
        console.error("Error deleting:", error);
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

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center', color: Colors.textMuted }}>Loading Ledger...</div>;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: Colors.background, padding: 0, fontFamily: 'sans-serif', color: Colors.text }}>
      
      {/* Navigation Bar */}
      <nav style={{ borderBottom: '1px solid #e5e7eb', backgroundColor: '#fff', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Button
              variant="default"
              style={{ backgroundColor: 'transparent', color: Colors.primary, borderWidth: '1px', borderStyle: 'solid', borderColor: '#ccc' }}
              onClick={() => window.history.back()}
          >
              ← Back
          </Button>
          <Button variant="destructive" onClick={() => {
              localStorage.removeItem("currentUser");
              window.location.href = "/login";
          }}>
              Logout (Mock)
          </Button>
      </nav>

      <div style={{ padding: '1.5rem' }}>
        {/* Header */}
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

        {/* Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <Card>
            <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: '600', color: Colors.textMuted }}>Total Receivables (Debit)</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: Colors.destructive, marginTop: '0.25rem' }}>${totals.debit.toFixed(2)}</p>
          </Card>
          <Card>
            <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: '600', color: Colors.textMuted }}>Total Received (Credit)</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: Colors.success, marginTop: '0.25rem' }}>${totals.credit.toFixed(2)}</p>
          </Card>
          <Card>
            <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: '600', color: Colors.textMuted }}>Net Balance</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 'bold', marginTop: '0.25rem', color: totals.balance > 0 ? Colors.destructive : Colors.text }}>
              ${totals.balance.toFixed(2)}
            </p>
          </Card>
        </div>

        {/* Filters */}
        <Card style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
          <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-end' }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: '600', color: Colors.textMuted, marginBottom: '0.25rem', display: 'block' }}>Search Customer</label>
              <div style={{ position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: Colors.textMuted }} />
                <Input 
                  type="text" 
                  placeholder="Search by name..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ paddingLeft: '2.5rem' }}
                />
              </div>
            </div>
            <div style={{ width: '100%', maxWidth: '200px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: '600', color: Colors.textMuted, marginBottom: '0.25rem', display: 'block' }}>Start Date</label>
              <Input 
                type="date" 
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              />
            </div>
            <div style={{ width: '100%', maxWidth: '200px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: '600', color: Colors.textMuted, marginBottom: '0.25rem', display: 'block' }}>End Date</label>
              <Input 
                type="date" 
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              />
            </div>
          </div>
        </Card>

        {/* Ledger Table */}
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fafb', borderBottom: `1px solid ${Colors.border}`, color: Colors.textMuted, textTransform: 'uppercase', fontSize: '0.75rem' }}>
                  <th style={{ padding: '1rem 1.5rem', fontWeight: '600' }}>Customer</th>
                  <th style={{ padding: '1rem 1.5rem', fontWeight: '600' }}>Last Transaction</th>
                  <th style={{ padding: '1rem 1.5rem', fontWeight: '600', textAlign: 'right' }}>Debit (Sales)</th>
                  <th style={{ padding: '1rem 1.5rem', fontWeight: '600', textAlign: 'right' }}>Credit (Paid)</th>
                  <th style={{ padding: '1rem 1.5rem', fontWeight: '600', textAlign: 'right' }}>Balance</th>
                  <th style={{ padding: '1rem 1.5rem', fontWeight: '600', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {customerBalances.length > 0 ? (
                  customerBalances.map((customer) => (
                    <tr 
                      key={customer.customerId} 
                      style={{ borderBottom: `1px solid ${Colors.border}`, cursor: 'pointer', transition: 'background-color 0.2s' }}
                      onClick={() => setSelectedCustomer(customer.customerId)}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <td style={{ padding: '1rem 1.5rem', fontWeight: '500', color: '#111827' }}>
                          <div>{customer.customerName}</div>
                          {customer.customerPhone && <div style={{ fontSize: '0.75rem', color: Colors.textMuted }}>{customer.customerPhone}</div>}
                      </td>
                      <td style={{ padding: '1rem 1.5rem', color: Colors.textMuted }}>{customer.lastTransactionDate || '-'}</td>
                      <td style={{ padding: '1rem 1.5rem', textAlign: 'right', color: Colors.destructive, fontWeight: '500' }}>${customer.totalDebit.toFixed(2)}</td>
                      <td style={{ padding: '1rem 1.5rem', textAlign: 'right', color: Colors.success, fontWeight: '500' }}>${customer.totalCredit.toFixed(2)}</td>
                      <td style={{ padding: '1rem 1.5rem', textAlign: 'right', fontWeight: 'bold', color: '#111827' }}>${customer.balance.toFixed(2)}</td>
                      <td style={{ padding: '1rem 1.5rem', textAlign: 'center' }}>
                        <button 
                          onClick={(e) => { e.stopPropagation(); openAddModal(customer.customerId); }}
                          style={{ 
                            color: Colors.primary, 
                            backgroundColor: '#eff6ff', 
                            border: 'none', 
                            padding: '0.25rem 0.75rem', 
                            borderRadius: '9999px', 
                            fontSize: '0.75rem', 
                            fontWeight: '600', 
                            cursor: 'pointer' 
                          }}
                        >
                          + Txn
                        </button>
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

      {/* Customer Details Modal */}
      {selectedCustomer && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', backdropFilter: 'blur(4px)' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', width: '100%', maxWidth: '800px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            <div style={{ padding: '1.5rem', borderBottom: `1px solid ${Colors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f9fafb', borderTopLeftRadius: '12px', borderTopRightRadius: '12px' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0, color: '#111827' }}>
                  {customers.find(c => c.id === selectedCustomer)?.name}
                </h2>
                <p style={{ fontSize: '0.875rem', color: Colors.textMuted, margin: 0 }}>Transaction History</p>
              </div>
              <button onClick={() => setSelectedCustomer(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: Colors.textMuted }}>
                <X size={24} />
              </button>
            </div>
            
            <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${Colors.border}`, color: Colors.textMuted }}>
                    <th style={{ paddingBottom: '0.75rem', fontWeight: '600' }}>Date</th>
                    <th style={{ paddingBottom: '0.75rem', fontWeight: '600' }}>Type</th>
                    <th style={{ paddingBottom: '0.75rem', fontWeight: '600' }}>Description</th>
                    <th style={{ paddingBottom: '0.75rem', fontWeight: '600', textAlign: 'right' }}>Amount</th>
                    <th style={{ paddingBottom: '0.75rem', fontWeight: '600', textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map(txn => (
                    <tr key={txn.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '0.75rem 0', color: '#4b5563' }}>{txn.date}</td>
                      <td style={{ padding: '0.75rem 0' }}>
                        <span style={{ 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: '0.25rem', 
                          padding: '0.125rem 0.5rem', 
                          borderRadius: '4px', 
                          fontSize: '0.75rem', 
                          fontWeight: '500',
                          backgroundColor: txn.type === 'credit' ? Colors.successBg : Colors.errorBg,
                          color: txn.type === 'credit' ? Colors.success : Colors.destructive
                        }}>
                          {txn.type === 'credit' ? <ArrowDownCircle size={12} /> : <ArrowUpCircle size={12} />}
                          {txn.type.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 0', color: Colors.text }}>{txn.description || '-'}</td>
                      <td style={{ padding: '0.75rem 0', textAlign: 'right', fontWeight: '500', color: txn.type === 'credit' ? Colors.success : Colors.destructive }}>
                        ${txn.amount.toFixed(2)}
                      </td>
                      <td style={{ padding: '0.75rem 0', textAlign: 'center' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                          <button onClick={() => openEditModal(txn)} style={{ padding: '0.25rem', color: Colors.textMuted, border: 'none', background: 'none', cursor: 'pointer' }}><Edit size={16} /></button>
                          <button onClick={() => handleDeleteEntry(txn.id)} style={{ padding: '0.25rem', color: Colors.textMuted, border: 'none', background: 'none', cursor: 'pointer' }}><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredTransactions.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: Colors.textMuted }}>No transactions found for this period.</td>
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
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', backdropFilter: 'blur(4px)' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', width: '100%', maxWidth: '500px', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', overflow: 'hidden' }}>
            <div style={{ padding: '1.5rem', borderBottom: `1px solid ${Colors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f9fafb' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', margin: 0, color: '#111827' }}>{editingEntry ? 'Edit Transaction' : 'New Transaction'}</h3>
              <button onClick={() => setIsEntryModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: Colors.textMuted }}><X size={20} /></button>
            </div>
            
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '70vh', overflowY: 'auto' }}>
              
              {/* Customer Selection / Creation Logic */}
              {!editingEntry && (
                <div style={{ border: `1px solid ${Colors.border}`, borderRadius: '8px', padding: '1rem', backgroundColor: '#f9fafb' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                        <button 
                            type="button"
                            onClick={() => setIsNewCustomerMode(false)}
                            style={{ 
                                flex: 1, 
                                padding: '0.5rem', 
                                borderRadius: '6px',
                                border: !isNewCustomerMode ? `2px solid ${Colors.primary}` : `1px solid ${Colors.border}`,
                                fontWeight: !isNewCustomerMode ? 'bold' : 'normal',
                                backgroundColor: !isNewCustomerMode ? '#eff6ff' : 'white',
                                color: !isNewCustomerMode ? Colors.primary : Colors.text,
                                cursor: 'pointer',
                                fontSize: '0.875rem'
                            }}
                        >
                            Select Existing
                        </button>
                        <button 
                            type="button"
                            onClick={() => setIsNewCustomerMode(true)}
                            style={{ 
                                flex: 1, 
                                padding: '0.5rem', 
                                borderRadius: '6px',
                                border: isNewCustomerMode ? `2px solid ${Colors.primary}` : `1px solid ${Colors.border}`,
                                fontWeight: isNewCustomerMode ? 'bold' : 'normal',
                                backgroundColor: isNewCustomerMode ? '#eff6ff' : 'white',
                                color: isNewCustomerMode ? Colors.primary : Colors.text,
                                cursor: 'pointer',
                                fontSize: '0.875rem'
                            }}
                        >
                            Create New
                        </button>
                    </div>

                    {isNewCustomerMode ? (
                        <div style={{ display: 'grid', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><User size={14}/> New Customer Name</span>
                                </label>
                                <Input 
                                    value={newCustomerData.name} 
                                    onChange={(e) => setNewCustomerData({...newCustomerData, name: e.target.value})} 
                                    placeholder="Enter full name"
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Phone size={14}/> Phone (Optional)</span>
                                </label>
                                <Input 
                                    value={newCustomerData.phone} 
                                    onChange={(e) => setNewCustomerData({...newCustomerData, phone: e.target.value})} 
                                    placeholder="Enter phone number"
                                />
                            </div>
                        </div>
                    ) : (
                        <div>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>Select Customer</label>
                            <Select 
                                value={formData.customerId}
                                onChange={(e) => setFormData({...formData, customerId: e.target.value})}
                            >
                                <option value="" disabled>-- Choose a Customer --</option>
                                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </Select>
                        </div>
                    )}
                </div>
              )}
              
              {editingEntry && (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>Customer</label>
                    <Select 
                      value={formData.customerId}
                      onChange={(e) => setFormData({...formData, customerId: e.target.value})}
                      disabled
                    >
                      {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </Select>
                  </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>Date</label>
                  <Input 
                    type="date" 
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>Type</label>
                  <Select 
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value as 'credit' | 'debit'})}
                  >
                    <option value="debit">Debit (Sale)</option>
                    <option value="credit">Credit (Payment)</option>
                  </Select>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>Amount</label>
                <Input 
                  type="number" 
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>Description</label>
                <Input 
                  type="text" 
                  placeholder="Invoice # or Payment Ref"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>
            </div>
            <div style={{ padding: '1.5rem', paddingTop: 0, display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <Button onClick={() => setIsEntryModalOpen(false)} variant="outline" style={{ color: Colors.text }}>Cancel</Button>
              <Button onClick={handleSaveEntry} variant="default">
                <Save size={16} /> Save Transaction
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCustomerLedger;