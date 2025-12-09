import React, { useState, useEffect, useMemo, PropsWithChildren, CSSProperties } from 'react';
import { 
  collection, 
  onSnapshot, 
  query,
  orderBy
} from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { db, LEDGER_COLLECTION, CUSTOMERS_COLLECTION, auth, getRole } from '../../firebase';
import { Customer, LedgerEntry, CustomerBalance } from '../../types/types';
// @ts-ignore
import pdfMake from 'pdfmake/build/pdfmake';
import { 
  Search, 
  FileText, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  X
} from 'lucide-react';

// --- STYLES & COMPONENTS ---
const PrimaryColor = '#0B3D91';
const DestructiveColor = '#dc2626';
const MutedColor = '#6b7280';
const LightBg = '#f3f4f6';

const Button: React.FC<PropsWithChildren & React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'default' | 'ghost' | 'destructive' | 'icon' }> = ({ children, onClick, style, disabled, type = 'button', variant = 'default', ...props }) => {
    let backgroundColor = PrimaryColor;
    let color = 'white';
    
    if (variant === 'ghost') {
        backgroundColor = 'transparent';
        color = PrimaryColor;
    } else if (variant === 'destructive') {
        backgroundColor = DestructiveColor;
    } else if (variant === 'icon') {
        backgroundColor = 'transparent';
        color = MutedColor;
    }

    const baseStyle: CSSProperties = {
        padding: variant === 'icon' ? '0.2rem' : '0.5rem 1rem',
        cursor: disabled ? 'not-allowed' : 'pointer',
        backgroundColor: disabled ? '#ccc' : backgroundColor,
        color: color,
        border: variant === 'icon' ? 'none' : '1px solid transparent',
        borderRadius: '4px',
        fontWeight: '500',
        transition: 'background-color 0.2s, opacity 0.2s',
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
    <input {...props} style={{ padding: '0.6rem 0.8rem', border: '1px solid #ccc', borderRadius: '4px', width: '100%', boxSizing: 'border-box', ...props.style }} />
);

const Card: React.FC<PropsWithChildren & { style?: CSSProperties }> = ({ children, style }) => <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1.5rem', marginBottom: '1.5rem', backgroundColor: '#fff', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)', ...style }}>{children}</div>;
const CardHeader: React.FC<PropsWithChildren> = ({ children }) => <div style={{ marginBottom: '1rem' }}>{children}</div>;
const CardTitle: React.FC<PropsWithChildren & { style?: CSSProperties }> = ({ children, style }) => <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', ...style }}>{children}</h2>;
const CardContent: React.FC<PropsWithChildren & { style?: CSSProperties }> = ({ children, style }) => <div style={{ ...style }}>{children}</div>;

const Table: React.FC<PropsWithChildren> = ({ children }) => <table style={{ width: '100%', borderCollapse: 'collapse' }}>{children}</table>;
const TableHeader: React.FC<PropsWithChildren> = ({ children }) => <thead>{children}</thead>;
const TableBody: React.FC<PropsWithChildren> = ({ children }) => <tbody>{children}</tbody>;
const TableRow: React.FC<PropsWithChildren & { style?: CSSProperties, onClick?: () => void }> = ({ children, style, onClick }) => <tr onClick={onClick} style={{ borderBottom: '1px solid #eee', cursor: onClick ? 'pointer' : 'default', ...style }}>{children}</tr>;

const TableHead: React.FC<PropsWithChildren & { style?: CSSProperties }> = ({ children, style }) => (
    <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 'bold', borderBottom: '2px solid #ccc', ...style }}>
        {children}
    </th>
);

const TableCell: React.FC<PropsWithChildren & { colSpan?: number, style?: CSSProperties }> = ({ children, style, colSpan }) => <td colSpan={colSpan} style={{ padding: '0.75rem', ...style }}>{children}</td>;

// --- MAIN COMPONENT ---
const StaffCustomerLedger: React.FC = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);

  useEffect(() => {
    // Check Auth - Staff can only view
    // In a real app, strict role checking would be here.
    if (!auth.currentUser) {
      // console.warn("Access Denied");
    }

    const unsubCustomers = onSnapshot(collection(db, CUSTOMERS_COLLECTION), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer));
      setCustomers(data);
    });

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

  const customerBalances: CustomerBalance[] = useMemo(() => {
    const balances: Record<string, CustomerBalance> = {};

    customers.forEach(c => {
      balances[c.id] = {
        customerId: c.id,
        customerName: c.name,
        totalDebit: 0,
        totalCredit: 0,
        balance: 0,
        lastTransactionDate: null
      };
    });

    ledgerEntries.forEach(entry => {
      if (!balances[entry.customerId]) return;
      
      if (dateRange.start && entry.date < dateRange.start) return;
      if (dateRange.end && entry.date > dateRange.end) return;

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
  }, [customers, ledgerEntries, searchTerm, dateRange]);

  const handleExportPDF = () => {
    const docDefinition = {
      content: [
        { text: 'Customer Ledger Report (Staff View)', style: 'header' },
        { text: `Generated by: Staff | Date: ${new Date().toLocaleDateString()}`, style: 'subheader' },
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
              ])
            ]
          }
        }
      ],
      styles: {
        header: { fontSize: 18, bold: true, margin: [0, 0, 0, 10] },
        subheader: { fontSize: 12, margin: [0, 0, 0, 20], color: 'gray' }
      }
    };
    // @ts-ignore
    pdfMake.createPdf(docDefinition).open();
  };

  const filteredTransactions = useMemo(() => {
    if (!selectedCustomer) return [];
    return ledgerEntries.filter(e => e.customerId === selectedCustomer);
  }, [selectedCustomer, ledgerEntries]);

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center', color: MutedColor }}>Loading Staff Ledger...</div>;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: LightBg }}>
        {/* Navigation */}
        <nav style={{ borderBottom: '1px solid #e5e7eb', backgroundColor: '#fff', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Button variant="ghost" onClick={() => navigate(-1)}>
                ← Back
            </Button>
            <Button variant="default" onClick={handleExportPDF} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileText size={16} /> Export PDF
            </Button>
        </nav>

        <main style={{ maxWidth: '80rem', margin: '0 auto', padding: '2rem 1rem' }}>
            <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Customer Ledger</h1>
            <p style={{ color: MutedColor, marginBottom: '1.5rem' }}>View customer account statuses (Read-Only).</p>

            {/* Filters */}
            <Card>
                <CardContent style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-end' }}>
                        <div style={{ flex: 1, minWidth: '200px' }}>
                            <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: MutedColor, marginBottom: '0.25rem', display: 'block' }}>Search Customer</label>
                            <div style={{ position: 'relative' }}>
                                <Input 
                                    type="text" 
                                    placeholder="Search by name..." 
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    style={{ paddingLeft: '2.5rem' }}
                                />
                                <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                            </div>
                        </div>
                        <div>
                            <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: MutedColor, marginBottom: '0.25rem', display: 'block' }}>Start Date</label>
                            <Input 
                                type="date" 
                                value={dateRange.start}
                                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: MutedColor, marginBottom: '0.25rem', display: 'block' }}>End Date</label>
                            <Input 
                                type="date" 
                                value={dateRange.end}
                                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Ledger Table */}
            <Card>
                <CardHeader>
                    <CardTitle style={{ fontSize: '1.25rem' }}>Account Balances</CardTitle>
                </CardHeader>
                <CardContent style={{ overflowX: 'auto' }}>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Customer</TableHead>
                                <TableHead>Last Tx</TableHead>
                                <TableHead style={{ textAlign: 'right' }}>Debit</TableHead>
                                <TableHead style={{ textAlign: 'right' }}>Credit</TableHead>
                                <TableHead style={{ textAlign: 'right' }}>Balance</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {customerBalances.length > 0 ? (
                                customerBalances.map((customer) => (
                                    <TableRow key={customer.customerId} onClick={() => setSelectedCustomer(customer.customerId)} style={{ cursor: 'pointer', transition: 'background-color 0.2s' }}>
                                        <TableCell style={{ fontWeight: '500', color: '#111827' }}>{customer.customerName}</TableCell>
                                        <TableCell style={{ color: MutedColor, fontSize: '0.875rem' }}>{customer.lastTransactionDate || '-'}</TableCell>
                                        <TableCell style={{ textAlign: 'right', color: '#dc2626', fontWeight: '500' }}>${customer.totalDebit.toFixed(2)}</TableCell>
                                        <TableCell style={{ textAlign: 'right', color: '#16a34a', fontWeight: '500' }}>${customer.totalCredit.toFixed(2)}</TableCell>
                                        <TableCell style={{ textAlign: 'right', fontWeight: 'bold', color: '#111827' }}>${customer.balance.toFixed(2)}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: MutedColor }}>No customers found.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Transaction Details Modal */}
            {selectedCustomer && (
                <div style={{
                    position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 50,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', backdropFilter: 'blur(4px)'
                }}>
                    <div style={{
                        backgroundColor: 'white', borderRadius: '1rem', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                        width: '100%', maxWidth: '56rem', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden'
                    }}>
                        <div style={{ padding: '1.5rem', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f9fafb' }}>
                            <div>
                                <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#111827' }}>
                                    {customers.find(c => c.id === selectedCustomer)?.name}
                                </h2>
                                <p style={{ fontSize: '0.875rem', color: MutedColor }}>Transaction History (Read Only)</p>
                            </div>
                            <button onClick={() => setSelectedCustomer(null)} style={{ color: '#9ca3af', cursor: 'pointer', border: 'none', background: 'transparent' }}>
                                <X size={24} />
                            </button>
                        </div>
                        
                        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead style={{ textAlign: 'right' }}>Amount</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredTransactions.map(txn => (
                                        <TableRow key={txn.id}>
                                            <TableCell style={{ color: '#4b5563' }}>{txn.date}</TableCell>
                                            <TableCell>
                                                <span style={{
                                                    display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                                                    padding: '0.125rem 0.5rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '500',
                                                    backgroundColor: txn.type === 'credit' ? '#dcfce7' : '#fee2e2',
                                                    color: txn.type === 'credit' ? '#15803d' : '#b91c1c'
                                                }}>
                                                    {txn.type === 'credit' ? <ArrowDownCircle size={12} /> : <ArrowUpCircle size={12} />}
                                                    {txn.type.toUpperCase()}
                                                </span>
                                            </TableCell>
                                            <TableCell style={{ color: '#1f2937' }}>{txn.description || '-'}</TableCell>
                                            <TableCell style={{ textAlign: 'right', fontWeight: '500', color: txn.type === 'credit' ? '#16a34a' : '#dc2626' }}>
                                                ${txn.amount.toFixed(2)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {filteredTransactions.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: MutedColor }}>No transactions recorded.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                        <div style={{ padding: '1rem', borderTop: '1px solid #f3f4f6', backgroundColor: '#f9fafb', textAlign: 'right' }}>
                            <Button variant="ghost" onClick={() => setSelectedCustomer(null)} style={{ border: '1px solid #d1d5db', backgroundColor: 'white' }}>
                                Close
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    </div>
  );
};

export default StaffCustomerLedger;
