import React, { useState, ChangeEvent } from 'react';

// --- Inline SVG Definitions for Icons (FIXED) ---

const IconPlus = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14" />
    <path d="M12 5v14" />
  </svg>
);

const IconEdit = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 3a2.85 2.85 0 0 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
    <path d="M15 5l4 4" />
  </svg>
);

const IconTrash2 = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18" />
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    <line x1="10" x2="10" y1="11" y2="17" />
    <line x1="14" x2="14" y1="11" y2="17" />
  </svg>
);

const IconSearch = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);


// --- Type Definitions ---
interface SupplierLedgerEntry {
  id: string;
  supplier_id: string;
  goods_received: string; 
  quantity: number;
  amount_owed: number;
  amount_paid: number;
  transaction_date: string;
}

interface FormState {
  supplier_id: string;
  goods_received: string;
  quantity: number | '';
  amount_owed: number | '';
  amount_paid: number | '';
  transaction_date: string;
}

// --- Stub Component Interfaces & Implementations ---

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  style?: React.CSSProperties; 
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void; 
  variant?: 'default' | 'primary' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  style?: React.CSSProperties; 
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value: string | number;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  style?: React.CSSProperties; 
}


// Simplified Card components using inline styles
const Card = ({ children, style = {}, ...props }: CardProps) => (
  <div
    style={{
      backgroundColor: 'white',
      padding: '32px', 
      borderRadius: '16px', 
      boxShadow: '0 8px 16px -4px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)', 
      border: '1px solid #e5e7eb', 
      ...style
    }}
    {...props}
  >
    {children}
  </div>
);
const CardHeader = ({ children, style = {}, ...props }: CardProps) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      marginBottom: '16px', 
      ...style
    }}
    {...props}
  >
    {children}
  </div>
);
const CardTitle = ({ children, style = {}, ...props }: CardProps) => (
  <h3
    style={{
      fontSize: '1.5rem', 
      fontWeight: '700',
      lineHeight: '1.2',
      color: '#1f2937', 
      ...style
    }}
    {...props}
  >
    {children}
  </h3>
);
const CardDescription = ({ children, style = {}, ...props }: CardProps) => (
  <p
    style={{
      fontSize: '1rem', 
      color: '#6b7280', 
      marginTop: '4px',
      ...style
    }}
    {...props}
  >
    {children}
  </p>
);
const CardContent = ({ children, style = {}, ...props }: CardProps) => (
  <div
    style={{
      paddingTop: '8px', 
      ...style
    }}
    {...props}
  >
    {children}
  </div>
);

const Button = ({ children, onClick, variant = 'default', size = 'md', style = {}, ...props }: ButtonProps) => {
  const baseStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '10px', 
    fontWeight: '600',
    transition: 'background-color 0.15s ease, transform 0.1s ease',
    cursor: 'pointer',
    outline: 'none',
    boxShadow: '0 2px 4px 0 rgba(0,0,0,0.1)',
    ...style
  };

  let variantStyle: React.CSSProperties;
  if (variant === 'primary') {
    variantStyle = {
      backgroundColor: '#4f46e5', 
      color: 'white',
    };
  } else if (variant === 'destructive') {
    variantStyle = {
      backgroundColor: '#dc2626', 
      color: 'white',
    };
  } else { // default
    variantStyle = {
      backgroundColor: 'white', 
      color: '#1f2937', 
      border: '1px solid #d1d5db', 
    };
  }

  let sizeStyle: React.CSSProperties;
  if (size === 'sm') {
    sizeStyle = { height: '36px', padding: '0 14px', fontSize: '0.875rem' };
  } else if (size === 'lg') {
    sizeStyle = { height: '52px', padding: '0 36px', fontSize: '1.125rem' };
  } else { // 'md'
    sizeStyle = { height: '44px', padding: '0 20px', fontSize: '1rem' }; 
  }

  return (
    <button
      style={{ ...baseStyle, ...variantStyle, ...sizeStyle }}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};

const Input = ({ type = 'text', value, onChange, placeholder, style = {}, ...props }: InputProps) => {
  const inputBaseStyle: React.CSSProperties = {
    display: 'flex',
    height: '44px', 
    width: '100%',
    borderRadius: '10px',
    border: '1px solid #d1d5db', 
    backgroundColor: 'white',
    padding: '10px 14px', 
    fontSize: '1rem', 
    color: '#1f2937', 
    outline: 'none',
    boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.03)', 
    transition: 'border-color 0.15s ease-in-out',
    ...style
  };

  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      style={inputBaseStyle}
      {...props}
    />
  );
};


// --- Main Component Data & Logic (Unchanged) ---

const initialFormState: FormState = {
  supplier_id: '',
  goods_received: '',
  quantity: '',
  amount_owed: '',
  amount_paid: '',
  transaction_date: new Date().toISOString().substring(0, 10),
};

const DUMMY_DATA: SupplierLedgerEntry[] = [
  { id: '1', supplier_id: 'SUP001', goods_received: 'Raw Steel', quantity: 100, amount_owed: 5000, amount_paid: 2000, transaction_date: '2024-10-15' },
  { id: '2', supplier_id: 'SUP002', goods_received: 'Plastic Pellets', quantity: 500, amount_owed: 1500, amount_paid: 1500, transaction_date: '2024-11-01' },
];

const SupplierLedger: React.FC = () => {
  const [entries, setEntries] = useState<SupplierLedgerEntry[]>(DUMMY_DATA);
  const [formState, setFormState] = useState<FormState>(initialFormState);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [currentEntryId, setCurrentEntryId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormState(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || '' : value,
    }));
  };

  const handleAddOrUpdateEntry = async () => {
    if (!formState.supplier_id || !formState.goods_received || formState.quantity === '' || formState.amount_owed === '') {
      console.error("Please fill in all required fields.");
      return;
    }

    const newEntry: SupplierLedgerEntry = {
      id: currentEntryId || String(Date.now()),
      supplier_id: formState.supplier_id,
      goods_received: formState.goods_received,
      quantity: Number(formState.quantity),
      amount_owed: Number(formState.amount_owed),
      amount_paid: Number(formState.amount_paid) || 0,
      transaction_date: formState.transaction_date,
    };

    if (isEditing && currentEntryId) {
      setEntries(entries.map(e => e.id === currentEntryId ? newEntry : e));
      console.log('Entry updated:', newEntry);
    } else {
      setEntries([...entries, newEntry]);
      console.log('New entry added:', newEntry);
    }

    setFormState(initialFormState);
    setIsEditing(false);
    setCurrentEntryId(null);
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
  };

  const handleDelete = (id: string) => {
    setEntries(entries.filter(e => e.id !== id));
    console.log(`Entry ${id} deleted.`);
  };

  const handleClearForm = () => {
    setFormState(initialFormState);
    setIsEditing(false);
    setCurrentEntryId(null);
  };

  const filteredEntries = entries.filter(entry =>
    entry.supplier_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.goods_received.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const calculateTotals = () => {
    return entries.reduce(
      (acc, entry) => {
        acc.totalOwed += entry.amount_owed;
        acc.totalPaid += entry.amount_paid;
        return acc;
      },
      { totalOwed: 0, totalPaid: 0 }
    );
  };

  const { totalOwed, totalPaid } = calculateTotals();
  const balance = totalOwed - totalPaid;

  // --- Layout with Fixed Alignment ---

  // Custom function to determine text alignment for table columns
  const getHeaderAlignment = (index: number) => {
    // 0: Date (Left), 1: Supplier ID (Left), 2: Goods (Left)
    if (index < 3) return 'left';
    // 3: Quantity, 4: Owed ($), 5: Paid ($), 6: Balance ($)
    if (index < 7) return 'right';
    // 7: Actions (Centered for visual balance with icon buttons)
    return 'center';
  };
  
  const getCellAlignment = (index: number) => {
    // 0: Date (Left), 1: Supplier ID (Left), 2: Goods (Left)
    if (index < 3) return 'left';
    // 3: Quantity, 4: Owed ($), 5: Paid ($), 6: Balance ($)
    if (index < 7) return 'right';
    // 7: Actions 
    return 'initial';
  };


  return (
    <div
      style={{
        backgroundColor: '#f9fafb', 
        minHeight: '100vh',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      {/* Centered Content Container */}
      <div
        style={{
          maxWidth: '1200px', 
          margin: '0 auto', 
          padding: '40px 24px', 
        }}
      >
        <h1
          style={{
            fontSize: '2.5rem', 
            fontWeight: '800', 
            marginBottom: '40px', 
            color: '#111827', 
          }}
        >
          Supplier Ledger Dashboard
        </h1>

        {/* Summary Cards */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '30px', 
            marginBottom: '50px', 
            justifyContent: 'space-between',
          }}
        >
          {/* Card 1: Total Amount Owed */}
          <Card
            style={{
              flex: '1 1 300px', 
              minWidth: '280px', 
              boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
            }}
          >
            <CardHeader>
              <CardTitle>Total Amount Owed</CardTitle>
            </CardHeader>
            <CardContent>
              <p
                style={{
                  fontSize: '2.25rem', 
                  fontWeight: '700', 
                  marginTop: '12px', 
                  color: '#ef4444', 
                }}
              >
                ${totalOwed.toFixed(2)}
              </p>
            </CardContent>
          </Card>

          {/* Card 2: Total Amount Paid */}
          <Card
            style={{
              flex: '1 1 300px', 
              minWidth: '280px',
              boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
            }}
          >
            <CardHeader>
              <CardTitle>Total Amount Paid</CardTitle>
            </CardHeader>
            <CardContent>
              <p
                style={{
                  fontSize: '2.25rem',
                  fontWeight: '700',
                  marginTop: '12px',
                  color: '#10b981', 
                }}
              >
                ${totalPaid.toFixed(2)}
              </p>
            </CardContent>
          </Card>

          {/* Card 3: Net Balance */}
          <Card
            style={{
              flex: '1 1 300px', 
              minWidth: '280px',
              boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
            }}
          >
            <CardHeader>
              <CardTitle>Net Balance</CardTitle>
              <CardDescription>Owed - Paid</CardDescription>
            </CardHeader>
            <CardContent>
              <p
                style={{
                  fontSize: '2.25rem',
                  fontWeight: '700',
                  marginTop: '12px',
                  color: balance > 0 ? '#ef4444' : '#4f46e5',
                }}
              >
                ${balance.toFixed(2)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Entry Form */}
        <Card
          style={{
            marginBottom: '50px', 
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', 
          }}
        >
          <CardHeader>
            <CardTitle>{isEditing ? 'Edit Ledger Entry' : 'Add New Ledger Entry'}</CardTitle>
            <CardDescription>
              {isEditing ? 'Modify the details of the selected transaction.' : 'Enter details for a new goods received/payment transaction.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Form Inputs - Clean 2-column grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
                gap: '30px', 
              }}
            >
              {[
                { id: 'supplier_id', label: 'Supplier ID', name: 'supplier_id', placeholder: 'SUP-XXX (Required)', type: 'text', value: formState.supplier_id },
                { id: 'goods_received', label: 'Goods Received', name: 'goods_received', placeholder: 'E.g., Steel, Plastic (Required)', type: 'text', value: formState.goods_received },
                { id: 'quantity', label: 'Quantity', name: 'quantity', placeholder: '0 (Required)', type: 'number', value: formState.quantity },
                { id: 'amount_owed', label: 'Amount Owed ($)', name: 'amount_owed', placeholder: '0.00 (Required)', type: 'number', value: formState.amount_owed },
                { id: 'amount_paid', label: 'Amount Paid ($)', name: 'amount_paid', placeholder: '0.00', type: 'number', value: formState.amount_paid },
                { id: 'transaction_date', label: 'Date', name: 'transaction_date', placeholder: '', type: 'date', value: formState.transaction_date },
              ].map(field => (
                <div key={field.id} style={{ marginBottom: '0' }}>
                  <label htmlFor={field.id} style={{ fontSize: '0.9rem', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '10px' }}> 
                    {field.label}
                  </label>
                  <Input
                    id={field.id}
                    name={field.name}
                    type={field.type}
                    placeholder={field.placeholder}
                    value={field.value}
                    onChange={handleChange}
                  />
                </div>
              ))}
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '20px', 
                marginTop: '40px', 
              }}
            >
              <Button variant="default" size="md" onClick={handleClearForm} disabled={!isEditing && !currentEntryId}>
                Clear
              </Button>
              <Button variant="primary" size="md" onClick={() => handleAddOrUpdateEntry()}>
                <IconPlus style={{ width: '16px', height: '16px', marginRight: '8px' }} /> {/* Icon Plus */}
                {isEditing ? 'Update Entry' : 'Add Entry'}
              </Button>
            </div>
          </CardContent>
        </Card>


        {/* Ledger Table */}
        <Card style={{ boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
          <CardHeader
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px 0',
              borderBottom: '1px solid #e5e7eb',
              marginBottom: '0',
            }}
          >
            <CardTitle style={{ marginBottom: 0 }}>Transaction History</CardTitle>
            <div style={{ position: 'relative', width: '300px' }}>
              <IconSearch
                style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  height: '18px',
                  width: '18px',
                  color: '#9ca3af', 
                }}
              /> {/* Icon Search */}
              <Input
                placeholder="Search by ID or Goods"
                value={searchTerm}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '45px', width: '300px' }} 
              />
            </div>
          </CardHeader>
          <CardContent style={{ padding: '0', paddingTop: '16px' }}>
            <div
              style={{
                overflowX: 'auto',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
              }}
            >
              <table style={{ minWidth: '100%', borderCollapse: 'collapse', tableLayout: 'auto' }}>
                <thead style={{ backgroundColor: '#f3f4f6' }}>
                  <tr>
                    {['Date', 'Supplier ID', 'Goods', 'Quantity', 'Owed ($)', 'Paid ($)', 'Balance ($)', 'Actions'].map((header, index) => (
                      <th
                        key={header}
                        style={{
                          padding: '16px 24px', 
                          // FIX: Set alignment based on content type
                          textAlign: getHeaderAlignment(index),
                          fontSize: '0.8rem', 
                          fontWeight: '600',
                          color: '#4b5563', 
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody style={{ backgroundColor: 'white' }}>
                  {filteredEntries.length > 0 ? (
                    filteredEntries.map((entry, index) => (
                      <tr key={entry.id} style={{ borderBottom: index < filteredEntries.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                        <td style={{ padding: '20px 24px', whiteSpace: 'nowrap', fontSize: '0.9rem', fontWeight: '500', color: '#111827', textAlign: getCellAlignment(0) }}>{entry.transaction_date}</td>
                        <td style={{ padding: '20px 24px', whiteSpace: 'nowrap', fontSize: '0.9rem', color: '#6b7280', textAlign: getCellAlignment(1) }}>{entry.supplier_id}</td>
                        <td style={{ padding: '20px 24px', whiteSpace: 'nowrap', fontSize: '0.9rem', color: '#6b7280', textAlign: getCellAlignment(2) }}>{entry.goods_received}</td>
                        <td style={{ padding: '20px 24px', whiteSpace: 'nowrap', fontSize: '0.9rem', textAlign: getCellAlignment(3), color: '#6b7280' }}>{entry.quantity}</td>
                        <td style={{ padding: '20px 24px', whiteSpace: 'nowrap', fontSize: '0.9rem', textAlign: getCellAlignment(4), fontWeight: '600', color: '#ef4444' }}>${entry.amount_owed.toFixed(2)}</td>
                        <td style={{ padding: '20px 24px', whiteSpace: 'nowrap', fontSize: '0.9rem', textAlign: getCellAlignment(5), fontWeight: '600', color: '#10b981' }}>${entry.amount_paid.toFixed(2)}</td>
                        <td style={{ padding: '20px 24px', whiteSpace: 'nowrap', fontSize: '0.9rem', textAlign: getCellAlignment(6), fontWeight: '700', color: '#4f46e5' }}>${(entry.amount_owed - entry.amount_paid).toFixed(2)}</td>
                        {/* Action Buttons with Centering */}
                        <td style={{ padding: '20px 24px', whiteSpace: 'nowrap', fontSize: '0.9rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
                          <Button
                            variant="default"
                            size="sm"
                            style={{ width: '36px', height: '36px', padding: 0, backgroundColor: 'white', color: '#4f46e5', border: '1px solid #c7d2fe' }}
                            onClick={() => handleEdit(entry)}
                          >
                            <IconEdit style={{ width: '18px', height: '18px' }} /> {/* Icon Edit */}
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            style={{ width: '36px', height: '36px', padding: 0, border: '1px solid #fecaca' }}
                            onClick={() => handleDelete(entry.id)}
                          >
                            <IconTrash2 style={{ width: '18px', height: '18px' }} /> {/* Icon Trash */}
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} style={{ padding: '32px 24px', textAlign: 'center', color: '#6b7280' }}>
                        No ledger entries found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SupplierLedger;