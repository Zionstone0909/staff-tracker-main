
'use client'

import React, { useState, useEffect, useCallback, ChangeEvent, ReactNode, PropsWithChildren } from "react"
import type { CSSProperties } from "react"

// Define local placeholder components with inline styles
const PrimaryColor = '#0B3D91';
const DestructiveColor = '#dc2626';
const MutedColor = '#6b7280';
const LightBg = '#f3f4f6';
const OutlineBorderColor = '#e5e7eb';
const MutedTextColor = '#6b7280';

// Additional colors for status badges
const SuccessColor = '#065f46';
const ErrorColor = '#b91c1c';

// ===== Component Interfaces and Types =====
interface Supplier {
  id: number;
  name: string;
  contact_person: string;
  email: string;
  phone: string;
  address: string;
  status: 'Active' | 'Inactive' | 'On Hold';
  total_inventory_items: number;
}

interface NewSupplier {
  name: string;
  contact_person: string;
  email: string;
  phone: string;
  address: string;
  status: 'Active' | 'Inactive' | 'On Hold';
}

const defaultNewSupplier: NewSupplier = {
  name: "", 
  contact_person: "", 
  email: "", 
  phone: "", 
  address: "", 
  status: "Active",
};

// --- LocalStorage Keys ---
const STORAGE_KEYS = {
  SUPPLIERS: 'staff_tracker_suppliers',
};

// --- UI Components (using inline styles) ---
const Button: React.FC<PropsWithChildren & React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'default' | 'ghost' | 'destructive' | 'icon' }> = ({ children, onClick, style, disabled, type = 'button', variant = 'default', className, ...props }) => {
    let backgroundColor = PrimaryColor;
    let color = 'white';
    let border = '1px solid transparent';
    let padding = '0.5rem 1rem';

    if (variant === 'ghost') {
        backgroundColor = 'transparent';
        color = PrimaryColor;
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
    <input {...props} style={{ padding: '0.6rem 0.8rem', border: '1px solid #ccc', borderRadius: '4px', width: '100%', boxSizing: 'border-box', height: 40, ...props.style }} />
);

const Card: React.FC<PropsWithChildren & { style?: CSSProperties }> = ({ children, style }) => <div style={{ border: '1px solid ' + OutlineBorderColor, borderRadius: '8px', padding: '1.5rem', marginBottom: '1.5rem', backgroundColor: '#fff', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)', ...style }}>{children}</div>;

const CardHeader: React.FC<PropsWithChildren> = ({ children }) => <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>{children}</div>;

const CardTitle: React.FC<PropsWithChildren & { style?: CSSProperties }> = ({ children, style }) => <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0', ...style }}>{children}</h2>;

const CardContent: React.FC<PropsWithChildren & { style?: CSSProperties }> = ({ children, style }) => <div style={{ paddingTop: '0.5rem', ...style }}>{children}</div>;

const Alert: React.FC<PropsWithChildren & { variant?: 'default' | 'destructive', customStyle?: CSSProperties }> = ({ children, variant, customStyle }) => {
    let bgColor = '#e0f7fa';
    let borderColor = '#00bcd4';
    let textColor = '#006064';
    if (variant === 'destructive') {
        bgColor = '#f8d7da';
        borderColor = '#f5c6cb';
        textColor = '#721c24';
    } else if (variant === 'default') {
        bgColor = '#d4edda';
        borderColor = '#c3e6cb';
        textColor = '#155724';
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
        </div>
    </th>
);

const TableCell: React.FC<PropsWithChildren & { style?: CSSProperties; colSpan?: number }> = ({ children, style, colSpan }) => (
    <td style={{ padding: '0.75rem', borderBottom: '1px solid #eee', ...style }} colSpan={colSpan}>
        {children}
    </td>
);

// ===== Modal Component =====
interface ModalProps {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}

const Modal: React.FC<ModalProps> = ({ title, isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)', zIndex: 50,
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#ffffff', borderRadius: '1rem', boxShadow: '0 10px 15px rgba(0, 0, 0, 0.3)',
          width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ padding: '1.5rem', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>{title}</h3>
          <button onClick={onClose} style={{ border: 'none', background: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#4b5563' }}>
            &times;
          </button>
        </div>
        <div style={{ padding: '1.5rem' }}>
          {children}
        </div>
      </div>
    </div>
  );
};

// ===== Add Supplier Modal Component =====
interface AddSupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newSupplier: NewSupplier) => Promise<void>;
  isLoading: boolean;
}

const AddSupplierModal: React.FC<AddSupplierModalProps> = ({ isOpen, onClose, onSave, isLoading }) => {
  const [supplier, setSupplier] = useState<NewSupplier>(defaultNewSupplier);

  // FIXED: Use functional updates to prevent cursor jumping
  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSupplier(prev => ({ ...prev, [name]: value as any }));
  };

  const handleSave = () => {
    if (!supplier.name || !supplier.contact_person || !supplier.email || !supplier.phone || !supplier.address) {
      alert("Please fill in all required fields.");
      return;
    }
    onSave(supplier).then(() => {
        setSupplier(defaultNewSupplier);
    }).catch(e => console.error("Save error:", e));
  };

  const isFormValid = supplier.name && supplier.contact_person && supplier.email && supplier.phone && supplier.address;

  return (
    <Modal title="Add New Supplier" isOpen={isOpen} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <Input
          type="text"
          placeholder="Supplier Name (Required)"
          value={supplier.name}
          onChange={handleInputChange}
          name="name"
        />
        <Input
          type="text"
          placeholder="Contact Person (Required)"
          value={supplier.contact_person}
          onChange={handleInputChange}
          name="contact_person"
        />
        <Input
          type="email"
          placeholder="Email Address (Required)"
          value={supplier.email}
          onChange={handleInputChange}
          name="email"
        />
        <Input
          type="tel"
          placeholder="Phone Number (Required)"
          value={supplier.phone}
          onChange={handleInputChange}
          name="phone"
        />
        <Input
          type="text"
          placeholder="Address (Required)"
          value={supplier.address}
          onChange={handleInputChange}
          name="address"
        />
        {/* Status Select */}
        <div style={{ position: 'relative' }}>
            <select
              name="status"
              style={{
                width: '100%', padding: '0.6rem 0.8rem', border: '1px solid #ccc',
                borderRadius: '4px', boxSizing: 'border-box',
                transition: 'all 0.15s ease-in-out', appearance: 'none',
                backgroundColor: 'white', outline: 'none', cursor: 'pointer', height: '40px',
              }}
              value={supplier.status}
              onChange={handleInputChange}
            >
              <option value="Active">Active</option>
              <option value="On Hold">On Hold</option>
              <option value="Inactive">Inactive</option>
            </select>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            <Button variant="ghost" onClick={onClose} disabled={isLoading} style={{ minWidth: '100px' }}>
                Cancel
            </Button>
            <Button onClick={handleSave} disabled={isLoading || !isFormValid} style={{ minWidth: '100px' }}>
                {isLoading ? 'Saving...' : 'Save Supplier'}
            </Button>
        </div>
      </div>
    </Modal>
  );
};

// ===== Supplier List View Component =====
interface SupplierListComponentProps {
  suppliers: Supplier[];
  isLoading: boolean;
  isAdmin: boolean;
  setIsAddingSupplier: React.Dispatch<React.SetStateAction<boolean>>;
}

const SupplierListComponent: React.FC<SupplierListComponentProps> = ({ suppliers, isLoading, isAdmin, setIsAddingSupplier }) => {
  const getStatusStyle = (status: Supplier['status']): CSSProperties => {
    switch (status) {
      case 'Active':
        return { backgroundColor: '#d1fae5', color: SuccessColor, fontWeight: 600, padding: '4px 8px', borderRadius: '9999px', fontSize: '0.75rem', display: 'inline-block' };
      case 'On Hold':
        return { backgroundColor: '#fffbe3', color: '#a16207', fontWeight: 600, padding: '4px 8px', borderRadius: '9999px', fontSize: '0.75rem', display: 'inline-block' };
      case 'Inactive':
        return { backgroundColor: '#fee2e2', color: ErrorColor, fontWeight: 600, padding: '4px 8px', borderRadius: '9999px', fontSize: '0.75rem', display: 'inline-block' };
      default:
        return {};
    }
  };

  return (
    <>
      <h1
        style={{
          fontSize: '1.875rem', fontWeight: 800, color: '#111827', marginBottom: '2rem',
          borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem',
        }}
      >
        👥 Registered Suppliers
      </h1>

      <Card style={{ marginBottom: 0 }}>
        <CardHeader>
          <CardTitle>Supplier Directory ({suppliers.length})</CardTitle>
          {isAdmin && (
            <Button onClick={() => setIsAddingSupplier(true)}>
              <svg style={{ height: '1rem', width: '1rem', marginRight: '0.5rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
              Add New Supplier
            </Button>
          )}
        </CardHeader>
        <CardContent style={{ padding: 0 }}>
          <div style={{ overflowX: 'auto', borderRadius: '0.5rem', border: '1px solid #e5e7eb' }}>
            <Table style={{ minWidth: '900px' }}>
              <TableHeader>
                <TableRow>
                  {['ID', 'Supplier Name', 'Contact', 'Email', 'Phone', 'Address', 'Inventory Count', 'Status'].map(header => (
                    <TableHead key={header}>
                      {header}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {suppliers.length > 0 ? (
                  suppliers.map(supplier => (
                    <TableRow key={supplier.id}>
                      <TableCell style={{ fontWeight: 500, color: PrimaryColor }}>{supplier.id}</TableCell>
                      <TableCell style={{ fontWeight: 600, color: '#111827' }}>{supplier.name}</TableCell>
                      <TableCell style={{ color: '#4b5563' }}>{supplier.contact_person}</TableCell>
                      <TableCell style={{ color: PrimaryColor }}>{supplier.email}</TableCell>
                      <TableCell style={{ color: '#4b5563' }}>{supplier.phone}</TableCell>
                      <TableCell style={{ color: '#4b5563', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{supplier.address}</TableCell>
                      <TableCell style={{ fontWeight: 600, color: '#4b5563' }}>{supplier.total_inventory_items}</TableCell>
                      <TableCell>
                        <span style={getStatusStyle(supplier.status)}>
                          {supplier.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} style={{ textAlign: 'center', padding: '3rem', fontSize: '1.125rem', color: '#6b7280' }}>
                      {isLoading ? "Loading suppliers..." : "No suppliers registered. Click 'Add New Supplier' to get started."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

// ===== Main Application Component =====
export default function SupplierApp() {
  const isAuthenticated = true
  const [isAdmin] = useState(true);
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isAddingSupplier, setIsAddingSupplier] = useState(false);

  const showMessage = (type: 'error' | 'success', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  // FIXED: Load suppliers from localStorage
  const fetchSuppliers = useCallback(() => {
    setIsLoading(true);
    try {
      const loadedSuppliers = JSON.parse(localStorage.getItem(STORAGE_KEYS.SUPPLIERS) || '[]');
      console.log('👥 Loaded suppliers from localStorage:', loadedSuppliers);
      setSuppliers(loadedSuppliers);
    } catch (err) {
      console.error("Error loading suppliers:", err);
      showMessage('error', "Failed to load supplier list.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchSuppliers();
    }
  }, [isAuthenticated, fetchSuppliers]);

  // FIXED: Save new supplier to localStorage
  const handleSaveNewSupplier = async (newSupplierData: NewSupplier) => {
    if (!isAdmin) {
      showMessage('error', "Permission Denied: Only administrators can add new suppliers.");
      return;
    }

    setIsLoading(true);
    try {
      // Get existing suppliers from localStorage
      const existingSuppliers = JSON.parse(localStorage.getItem(STORAGE_KEYS.SUPPLIERS) || '[]');
      
      // Generate new ID
      const maxId = existingSuppliers.length > 0 
        ? Math.max(...existingSuppliers.map((s: Supplier) => s.id)) 
        : 1000;
      
      const newSupplier: Supplier = {
        ...newSupplierData,
        id: maxId + 1,
        total_inventory_items: 0
      };

      // Save to localStorage
      const updatedSuppliers = [...existingSuppliers, newSupplier];
      localStorage.setItem(STORAGE_KEYS.SUPPLIERS, JSON.stringify(updatedSuppliers));
      
      console.log('✅ Supplier saved to localStorage:', newSupplier);
      
      // Update state
      setSuppliers(updatedSuppliers);
      setIsAddingSupplier(false);
      showMessage('success', `Supplier '${newSupplierData.name}' added successfully.`);
    } catch (err) {
      console.error("Error saving new supplier:", err);
      showMessage('error', "Failed to add new supplier.");
    } finally {
      setIsLoading(false);
    }
  }

  if (!isAuthenticated) return <div style={{ textAlign: 'center', padding: '3rem', fontSize: '1.125rem', color: '#ef4444' }}>Redirecting to login... (Simulated)</div>

  return (
    <div style={{ minHeight: '100vh', backgroundColor: LightBg, fontFamily: 'Inter, sans-serif' }}>
      {/* Top Navigation */}
      <nav style={{ borderBottom: '1px solid #e5e7eb', backgroundColor: '#fff', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button
          variant="default"
          style={{ backgroundColor: 'transparent', color: PrimaryColor, borderWidth: '1px', borderStyle: 'solid', borderColor: '#ccc' }}
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

      {/* Main Content */}
      <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem 1rem' }}>
        {/* Message Box */}
        {message && (
          <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
            <AlertDescription>
              <strong>{message.type === 'error' ? 'Error:' : 'Success!'}</strong> {message.text}
            </AlertDescription>
          </Alert>
        )}

        {/* Supplier List */}
        <SupplierListComponent
          suppliers={suppliers}
          isLoading={isLoading}
          isAdmin={isAdmin}
          setIsAddingSupplier={setIsAddingSupplier}
        />
      </main>

      {/* Add Supplier Modal */}
      <AddSupplierModal
        isOpen={isAddingSupplier}
        onClose={() => setIsAddingSupplier(false)}
        onSave={handleSaveNewSupplier}
        isLoading={isLoading}
      />
    </div>
  )
}
