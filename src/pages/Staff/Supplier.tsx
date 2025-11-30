'use client'

import { useState, useEffect, useCallback, ChangeEvent, ReactNode } from "react"
import type { CSSProperties } from "react"

// Define primary colors for consistency
const primaryColor = '#4f46e5'; // indigo-600
const successColor = '#065f46'; // green-700
const errorColor = '#b91c1c'; // red-700
const grayBackground = '#f3f4f6'; // gray-100
const secondaryColor = '#6366f1'; // indigo-500

// ===== Component Interfaces and Types =====
interface ButtonProps {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
  style?: CSSProperties;
}

interface InputProps {
  type?: "text" | "number" | "date" | "email" | "password";
  placeholder?: string;
  value: string;
  // FIX: Allowing HTMLInputElement or HTMLSelectElement change event for compatibility with generic modal handler
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void; 
  className?: string;
  // FIX: Added 'name' prop to fix TypeScript error 2322
  name?: string; 
}

interface ChildrenProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

type PortalMode = 'supplierList' | 'stockAdjustments';
type AdjustmentType = "received" | "sold" | "damaged" | "canceled"

interface StockAdjustment {
  id: string | number
  inventory_id: number
  adjustment_type: AdjustmentType
  quantity: number
  reason: string
  adjustment_date: string
}

interface NewAdjustment {
  inventory_id: string
  adjustment_type: AdjustmentType
  quantity: string
  reason: string
  adjustment_date: string
}

interface Supplier {
  id: number;
  name: string;
  contact_person: string;
  email: string;
  status: 'Active' | 'Inactive' | 'On Hold';
  total_inventory_items: number;
}

interface NewSupplier {
  name: string;
  contact_person: string;
  email: string;
  status: 'Active' | 'Inactive' | 'On Hold';
}

const defaultAdjustment: NewAdjustment = {
  inventory_id: "", adjustment_type: "received", quantity: "", reason: "",
  adjustment_date: new Date().toISOString().split('T')[0],
}

const defaultNewSupplier: NewSupplier = {
  name: "", contact_person: "", email: "", status: "Active",
};

// ===== Mock Data & API Simulators (using let for mutability) =====
let mockAdjustments: StockAdjustment[] = [
  { id: 1, inventory_id: 101, adjustment_type: "received", quantity: 50, reason: "Initial Stock", adjustment_date: "2024-10-15" },
  { id: 2, inventory_id: 102, adjustment_type: "sold", quantity: -5, reason: "Customer purchase", adjustment_date: "2024-10-16" },
  { id: 3, inventory_id: 101, adjustment_type: "damaged", quantity: -2, reason: "Forklift accident", adjustment_date: "2024-10-17" },
]
let nextAdjustmentId = 4

let mockSuppliers: Supplier[] = [
  { id: 1001, name: "Global Components Inc.", contact_person: "Jane Doe", email: "jane@global.com", status: "Active", total_inventory_items: 500 },
  { id: 1002, name: "Eastern Logistics Corp.", contact_person: "John Smith", email: "john@eastern.com", status: "On Hold", total_inventory_items: 1200 },
  { id: 1003, name: "Western Alloys Ltd.", contact_person: "Sara Connor", email: "sara@western.com", status: "Active", total_inventory_items: 30 },
  { id: 1004, name: "NanoTech Systems", contact_person: "Alex Lee", email: "alex@nano.com", status: "Inactive", total_inventory_items: 0 },
];
let nextSupplierId = 1005;

// API Simulators
const fetchAdjustmentsApi = (): Promise<StockAdjustment[]> => new Promise(resolve => { setTimeout(() => resolve(mockAdjustments), 300) });
const addAdjustmentApi = (adjustment: Omit<StockAdjustment, 'id'>): Promise<StockAdjustment> =>
  new Promise(resolve => {
    setTimeout(() => {
      const newRecord = { ...adjustment, id: nextAdjustmentId++ }
      mockAdjustments.unshift(newRecord)
      resolve(newRecord)
    }, 500)
  })

const fetchSuppliersApi = (): Promise<Supplier[]> => new Promise(resolve => { setTimeout(() => resolve(mockSuppliers), 200) });

const addSupplierApi = (supplier: Omit<Supplier, 'id' | 'total_inventory_items'>): Promise<Supplier> =>
  new Promise(resolve => {
    setTimeout(() => {
      const newRecord = { ...supplier, id: nextSupplierId++, total_inventory_items: 0 }
      mockSuppliers.push(newRecord)
      resolve(newRecord)
    }, 500)
  })


// ===== Helper Functions and Base Components =====
const getInputValue = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>): string => e.currentTarget.value

const Button: React.FC<ButtonProps> = ({ children, onClick, disabled = false, className = "", style = {} }) => {
  const baseStyle: CSSProperties = {
    padding: '8px 16px', fontWeight: 600, fontSize: '0.875rem', borderRadius: '0.5rem',
    transition: 'background-color 0.2s, box-shadow 0.2s', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    border: 'none', cursor: disabled ? 'not-allowed' : 'pointer', display: 'inline-flex',
    alignItems: 'center', justifyContent: 'center', lineHeight: 1.5,
  };

  const dynamicStyle: CSSProperties = disabled
    ? { backgroundColor: '#9ca3af', color: '#374151', boxShadow: 'none' }
    : { backgroundColor: primaryColor, color: '#ffffff' };

  const customStyles: CSSProperties = className.includes('bg-transparent')
    ? { backgroundColor: 'transparent', color: '#4b5563', boxShadow: 'none' }
    : {};

  const wideStyles: CSSProperties = className.includes('w-full h-12')
    ? { width: '100%', height: '3rem', fontSize: '1.125rem' }
    : {};

  const secondaryStyles: CSSProperties = className.includes('secondary')
    ? { backgroundColor: '#f3f4f6', color: '#4b5563', border: '1px solid #d1d5db' }
    : {};


  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{ ...baseStyle, ...dynamicStyle, ...customStyles, ...wideStyles, ...secondaryStyles, ...style }}
    >
      {children}
    </button>
  );
};

// Input component now accepts the 'name' prop
const Input: React.FC<InputProps> = ({ type = "text", placeholder, value, onChange, className = "", name }) => {
  const style: CSSProperties = {
    width: '100%', padding: '8px 16px', border: '2px solid #d1d5db',
    borderRadius: '0.5rem', boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
    transition: 'all 0.15s ease-in-out', outline: 'none',
  };

  const wideStyle: CSSProperties = className.includes('md:col-span-4')
    ? { gridColumn: '1 / -1' }
    : {};

  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange as any} // Cast needed for flexibility with generic change handlers
      name={name} // Passed down to the native input element
      style={{ ...style, ...wideStyle }}
    />
  );
};

const Card: React.FC<ChildrenProps> = ({ children, style = {} }) => (
  <div
    style={{
      ...style, backgroundColor: '#ffffff', borderRadius: '1rem',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden',
      marginBottom: '2.5rem',
    }}
  >
    {children}
  </div>
);

const CardHeader: React.FC<ChildrenProps> = ({ children }) => (
  <div
    style={{
      padding: '1.25rem', borderBottom: '1px solid #e5e7eb',
      backgroundColor: '#f9fafb', display: 'flex',
      justifyContent: 'space-between', alignItems: 'center',
      flexWrap: 'wrap', // Added for responsiveness
      gap: '1rem',
    }}
  >
    {children}
  </div>
);

const CardTitle: React.FC<ChildrenProps> = ({ children }) => (
  <h2
    style={{
      fontSize: '1.25rem', fontWeight: 'bold', color: '#1f2937', margin: 0,
    }}
  >
    {children}
  </h2>
);

const CardContent: React.FC<ChildrenProps> = ({ children, style = {} }) => (
  <div
    style={{ ...style, padding: '1.5rem' }}
  >
    {children}
  </div>
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

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSupplier(prev => ({ ...prev, [name]: value as any }));
  };

  const handleSave = () => {
    if (!supplier.name || !supplier.contact_person || !supplier.email) {
      // Custom message box should be used in a real app, keeping simple console log here
      console.error("Please fill in Supplier Name, Contact Person, and Email."); 
      return;
    }
    onSave(supplier).then(() => {
        setSupplier(defaultNewSupplier); // Reset form on successful save
    }).catch(e => console.error("Save error:", e));
  };

  const isFormValid = supplier.name && supplier.contact_person && supplier.email;

  return (
    <Modal title="Add New Supplier" isOpen={isOpen} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <Input
          type="text"
          placeholder="Supplier Name (Required)"
          value={supplier.name}
          onChange={handleInputChange}
          className="w-full"
          name="name" // Fixed error 2322
        />
        <Input
          type="text"
          placeholder="Contact Person (Required)"
          value={supplier.contact_person}
          onChange={handleInputChange}
          className="w-full"
          name="contact_person" // Fixed error 2322
        />
        <Input
          type="email"
          placeholder="Email Address (Required)"
          value={supplier.email}
          onChange={handleInputChange}
          className="w-full"
          name="email" // Fixed error 2322
        />
        {/* Status Select */}
        <div style={{ position: 'relative' }}>
            <select
              name="status"
              style={{
                width: '100%', padding: '8px 16px', border: '2px solid #d1d5db',
                borderRadius: '0.5rem', boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                transition: 'all 0.15s ease-in-out', appearance: 'none',
                backgroundColor: 'white', outline: 'none', cursor: 'pointer', height: '42px',
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
            <Button className="secondary" onClick={onClose} disabled={isLoading} style={{ minWidth: '100px' }}>
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
        return { backgroundColor: '#d1fae5', color: successColor, fontWeight: 600, padding: '4px 8px', borderRadius: '9999px', fontSize: '0.75rem', display: 'inline-block' };
      case 'On Hold':
        return { backgroundColor: '#fffbe3', color: '#a16207', fontWeight: 600, padding: '4px 8px', borderRadius: '9999px', fontSize: '0.75rem', display: 'inline-block' };
      case 'Inactive':
        return { backgroundColor: '#fee2e2', color: errorColor, fontWeight: 600, padding: '4px 8px', borderRadius: '9999px', fontSize: '0.75rem', display: 'inline-block' };
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
        Registered Suppliers
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
          <div
            style={{
              overflowX: 'auto', 
              borderRadius: '0.5rem',
              border: '1px solid #e5e7eb',
            }}
          >
            <table style={{ minWidth: '700px', width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ backgroundColor: '#f9fafb' }}>
                <tr>
                  {['ID', 'Supplier Name', 'Contact', 'Email', 'Inventory Count', 'Status'].map(header => (
                    <th
                      key={header}
                      style={{
                        padding: '12px 24px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 500,
                        color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e5e7eb',
                      }}
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #f3f4f6' }}>
                {suppliers.length > 0 ? (
                  suppliers.map(supplier => (
                    <tr key={supplier.id} style={{ transition: 'background-color 0.15s' }}>
                      <td style={{ padding: '16px 24px', whiteSpace: 'nowrap', fontSize: '0.875rem', fontWeight: 500, color: primaryColor }}>{supplier.id}</td>
                      <td style={{ padding: '16px 24px', whiteSpace: 'nowrap', fontSize: '0.875rem', fontWeight: 600, color: '#111827' }}>{supplier.name}</td>
                      <td style={{ padding: '16px 24px', whiteSpace: 'nowrap', fontSize: '0.875rem', color: '#4b5563' }}>{supplier.contact_person}</td>
                      <td style={{ padding: '16px 24px', whiteSpace: 'nowrap', fontSize: '0.875rem', color: secondaryColor, overflow: 'hidden', textOverflow: 'ellipsis' }}>{supplier.email}</td>
                      <td style={{ padding: '16px 24px', whiteSpace: 'nowrap', fontSize: '0.875rem', color: '#4b5563', fontWeight: 600 }}>{supplier.total_inventory_items}</td>
                      <td style={{ padding: '16px 24px', whiteSpace: 'nowrap', fontSize: '0.875rem' }}>
                        <span style={getStatusStyle(supplier.status)}>
                          {supplier.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', fontSize: '1.125rem', color: '#6b7280' }}>
                      {isLoading ? "Loading suppliers..." : "No suppliers registered."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

// (StockAdjustmentComponent remains the same, included below)
interface StockAdjustmentComponentProps {
  adjustments: StockAdjustment[];
  newAdjustment: NewAdjustment;
  setNewAdjustment: React.Dispatch<React.SetStateAction<NewAdjustment>>;
  handleAddAdjustment: () => Promise<void>;
  isLoading: boolean;
  showMessage: (type: 'error' | 'success', text: string) => void;
}

const StockAdjustmentComponent: React.FC<StockAdjustmentComponentProps> = ({
  adjustments,
  newAdjustment,
  setNewAdjustment,
  handleAddAdjustment,
  isLoading,
}) => {

  const getQuantityDisplay = (quantity: number, type: AdjustmentType) => {
    let color: string = '#374151'; // gray-700
    let sign: string = '';

    if (quantity > 0 && (type === 'received' || type === 'canceled')) {
      color = successColor;
      sign = '+';
    } else if (quantity < 0 || type === 'sold' || type === 'damaged') {
      color = errorColor;
      sign = '';
    }

    return <span style={{ color, fontWeight: 500 }}>{sign}{Math.abs(quantity)}</span>;
  };

  return (
    <>
      <h1
        style={{
          fontSize: '1.875rem',
          fontWeight: 800,
          color: '#111827',
          marginBottom: '2rem',
          borderBottom: '1px solid #e5e7eb',
          paddingBottom: '0.5rem',
        }}
      >
        Inventory Stock Adjustments
      </h1>

      {/* Record Form (Input Card) */}
      <Card>
        <CardHeader>
          <CardTitle>Record New Adjustment</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
            }}
          >
            <Input
              type="number"
              placeholder="Inventory ID (e.g., 101)"
              value={newAdjustment.inventory_id}
              onChange={(e) =>
                setNewAdjustment(prev => ({ ...prev, inventory_id: getInputValue(e) }))
              }
            />
            <div style={{ position: 'relative' }}>
              <select
                style={{
                  width: '100%', padding: '8px 16px', border: '2px solid #d1d5db',
                  borderRadius: '0.5rem', boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                  transition: 'all 0.15s ease-in-out', appearance: 'none',
                  backgroundColor: 'white', outline: 'none', cursor: 'pointer', height: '42px',
                }}
                value={newAdjustment.adjustment_type}
                onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                  setNewAdjustment(prev => ({ ...prev, adjustment_type: getInputValue(e) as AdjustmentType }))
                }
              >
                <option value="received">Goods Received (+)</option>
                <option value="sold">Sold (-)</option>
                <option value="damaged">Damaged (-)</option>
                <option value="canceled">Canceled Sale (+)</option>
              </select>
              <div
                style={{ pointerEvents: 'none', position: 'absolute', top: 0, right: '8px', bottom: 0, display: 'flex', alignItems: 'center', color: '#374151' }}
              >
                <svg style={{ fill: 'currentColor', height: '1rem', width: '1rem' }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
              </div>
            </div>
            <Input
              type="number"
              placeholder="Quantity (e.g., 50)"
              value={newAdjustment.quantity}
              onChange={(e) =>
                setNewAdjustment(prev => ({ ...prev, quantity: getInputValue(e) }))
              }
            />
            <Input
              type="date"
              value={newAdjustment.adjustment_date}
              onChange={(e) => setNewAdjustment(prev => ({ ...prev, adjustment_date: getInputValue(e) }))}
            />
            <Input
              type="text"
              placeholder="Reason (e.g., Q4 delivery, Qty mismatch)"
              value={newAdjustment.reason}
              onChange={(e) => setNewAdjustment(prev => ({ ...prev, reason: getInputValue(e) }))}
              className="md:col-span-4"
            />
          </div>

          <div style={{ paddingTop: '1.5rem' }}>
            <Button
              className="w-full h-12 text-lg font-bold disabled:opacity-70"
              onClick={handleAddAdjustment}
              disabled={isLoading || !newAdjustment.inventory_id || !newAdjustment.quantity || !newAdjustment.reason || !newAdjustment.adjustment_date}
            >
              {isLoading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg style={{ animation: 'spin 1s linear infinite', marginRight: '0.75rem', height: '1.25rem', width: '1.25rem', color: '#ffffff' }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : "Record Adjustment"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Records Table (Display Card) */}
      <Card style={{ marginBottom: 0 }}>
        <CardHeader>
          <CardTitle>Recent Adjustment Records</CardTitle>
        </CardHeader>
        <CardContent style={{ padding: 0 }}>
          <div
            style={{
              overflowX: 'auto', 
              borderRadius: '0.5rem',
              border: '1px solid #e5e7eb',
            }}
          >
            <table style={{ minWidth: '600px', width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ backgroundColor: '#f9fafb' }}>
                <tr>
                  {['Inventory ID', 'Type', 'Change', 'Reason', 'Date'].map(header => (
                    <th
                      key={header}
                      style={{
                        padding: '12px 24px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 500,
                        color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e5e7eb',
                      }}
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #f3f4f6' }}>
                {adjustments.length > 0 ? (
                  adjustments.slice().sort((a, b) => new Date(b.adjustment_date).getTime() - new Date(a.adjustment_date).getTime()).map(adj => (
                    <tr key={adj.id} style={{ transition: 'background-color 0.15s' }}>
                      <td style={{ padding: '16px 24px', whiteSpace: 'nowrap', fontSize: '0.875rem', fontWeight: 500, color: '#111827' }}>{adj.inventory_id}</td>
                      <td style={{ padding: '16px 24px', whiteSpace: 'nowrap', fontSize: '0.875rem', color: '#4b5563', textTransform: 'capitalize' }}>
                        {adj.adjustment_type.replace(/([a-z])([A-Z])/g, '$1 $2')}
                      </td>
                      <td style={{ padding: '16px 24px', whiteSpace: 'nowrap', fontSize: '0.875rem' }}>
                        {getQuantityDisplay(adj.quantity, adj.adjustment_type)}
                      </td>
                      <td style={{ padding: '16px 24px', whiteSpace: 'nowrap', fontSize: '0.875rem', color: '#4b5563', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{adj.reason}</td>
                      <td style={{ padding: '16px 24px', whiteSpace: 'nowrap', fontSize: '0.875rem', color: '#6b7280' }}>{adj.adjustment_date}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', fontSize: '1.125rem', color: '#6b7280' }}>
                      {isLoading ? "Loading adjustments..." : "No adjustments recorded."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </>
  )
}


// ===== Main Application Component =====
export default function SupplierApp() {
  const isAuthenticated = true
  // Mocking admin status. We remove the unused setter 'setIsAdmin' to fix the warning.
  const [isAdmin] = useState(true);

  // General States
  const [mode, setMode] = useState<PortalMode>('supplierList');
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);

  // Supplier List States
  const [suppliers, setSuppliers] = useState<Supplier[]>(mockSuppliers);
  const [isAddingSupplier, setIsAddingSupplier] = useState(false);

  // Adjustment States
  const [adjustments, setAdjustments] = useState<StockAdjustment[]>(mockAdjustments)
  const [newAdjustment, setNewAdjustment] = useState<NewAdjustment>(defaultAdjustment)


  const showMessage = (type: 'error' | 'success', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  // --- Data Fetching ---
  const fetchAdjustments = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await fetchAdjustmentsApi()
      setAdjustments(data)
    } catch (err) {
      console.error("Error fetching adjustments:", err)
      showMessage('error', "Failed to load adjustment history.");
    } finally {
      setIsLoading(false)
    }
  }, [])

  const fetchSuppliers = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await fetchSuppliersApi()
      setSuppliers(data)
    } catch (err) {
      console.error("Error fetching suppliers:", err)
      showMessage('error', "Failed to load supplier list.");
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      fetchAdjustments();
      fetchSuppliers();
    }
  }, [isAuthenticated, fetchAdjustments, fetchSuppliers])

  // --- Core Handlers ---

  const handleDashboardClick = () => {
    setMode('supplierList');
    showMessage('success', "Navigated to Dashboard/Supplier List.");
  };

  const handleAddAdjustment = async () => {
    if (!newAdjustment.inventory_id || !newAdjustment.quantity || !newAdjustment.reason || !newAdjustment.adjustment_date) {
      showMessage('error', "Please fill out all required fields (Inventory ID, Quantity, Reason, Date).");
      return
    }

    const inventoryIdNum = Number(newAdjustment.inventory_id);
    const quantityNum = Number(newAdjustment.quantity);

    if (isNaN(inventoryIdNum) || isNaN(quantityNum) || inventoryIdNum <= 0 || quantityNum <= 0) {
      showMessage('error', "Inventory ID and Quantity must be valid positive numbers.");
      return;
    }

    const payload: Omit<StockAdjustment, 'id'> = {
      inventory_id: inventoryIdNum,
      adjustment_type: newAdjustment.adjustment_type,
      quantity: quantityNum * (['sold', 'damaged'].includes(newAdjustment.adjustment_type) ? -1 : 1),
      reason: newAdjustment.reason,
      adjustment_date: newAdjustment.adjustment_date,
    }

    setIsLoading(true)
    try {
      await addAdjustmentApi(payload)
      setNewAdjustment(defaultAdjustment)
      fetchAdjustments()
      showMessage('success', `Adjustment recorded successfully for Inventory ID ${newAdjustment.inventory_id}.`);
    } catch (err) {
      console.error("Error adding adjustment:", err)
      showMessage('error', "Failed to record adjustment due to an internal error.");
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveNewSupplier = async (newSupplierData: NewSupplier) => {
    if (!isAdmin) {
      showMessage('error', "Permission Denied: Only administrators can add new suppliers.");
      return;
    }

    setIsLoading(true);
    try {
        await addSupplierApi(newSupplierData);
        await fetchSuppliers(); // Re-fetch to update the list
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
    <div style={{ minHeight: '100vh', backgroundColor: grayBackground, fontFamily: 'Inter, sans-serif' }}>
      {/* Top Navigation */}
      <nav
        style={{
          borderBottom: '1px solid #e5e7eb', backgroundColor: '#ffffff',
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)', position: 'sticky', top: 0, zIndex: 10,
        }}
      >
        <div
          style={{
            maxWidth: '1280px', margin: '0 auto', padding: '12px 1rem', display: 'flex',
            justifyContent: 'space-between', alignItems: 'center',
          }}
        >
          <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: primaryColor }}>Supplier Management Portal</h1>
          <Button onClick={handleDashboardClick} className="bg-transparent">
            ← Dashboard
          </Button>
        </div>
      </nav>

      {/* Main Content */}
      <main
        style={{
          maxWidth: '1280px', margin: '0 auto', padding: '2rem 1rem',
        }}
      >
        {/* --- Tab Navigation --- */}
        <div style={{ display: 'flex', borderBottom: '2px solid #e5e7eb', marginBottom: '2rem' }}>
          <button
            onClick={() => setMode('supplierList')}
            style={{
              padding: '10px 15px', fontWeight: 600, border: 'none', backgroundColor: 'transparent',
              borderBottom: mode === 'supplierList' ? `3px solid ${primaryColor}` : '3px solid transparent',
              color: mode === 'supplierList' ? primaryColor : '#6b7280', cursor: 'pointer',
              transition: 'color 0.15s, border-color 0.15s', fontSize: '1rem', outline: 'none', marginBottom: '-2px',
            }}
          >
            Supplier List
          </button>
          <button
            onClick={() => setMode('stockAdjustments')}
            style={{
              padding: '10px 15px', fontWeight: 600, border: 'none', backgroundColor: 'transparent',
              borderBottom: mode === 'stockAdjustments' ? `3px solid ${primaryColor}` : '3px solid transparent',
              color: mode === 'stockAdjustments' ? primaryColor : '#6b7280', cursor: 'pointer',
              transition: 'color 0.15s, border-color 0.15s', fontSize: '1rem', outline: 'none', marginBottom: '-2px',
            }}
          >
            Inventory Adjustments
          </button>
          {/* Admin Tag for visibility */}
          {isAdmin && <span style={{ marginLeft: '1rem', alignSelf: 'center', backgroundColor: '#fcd34d', color: '#78350f', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700 }}>ADMIN MODE</span>}
        </div>

        {/* ===== Message Box (Notifications) ===== */}
        {message && (
          <div
            style={{
              padding: '1rem', marginBottom: '1rem', fontSize: '0.875rem', borderRadius: '0.5rem',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              border: `1px solid ${message.type === 'error' ? '#fecaca' : '#a7f3d0'}`,
              backgroundColor: message.type === 'error' ? '#fee2e2' : '#d1fae5',
              color: message.type === 'error' ? errorColor : successColor,
            }}
          >
            <p style={{ fontWeight: 500 }}>{message.type === 'error' ? 'Error:' : 'Success!'}</p>
            <p>{message.text}</p>
          </div>
        )}

        {/* --- Conditional View Rendering --- */}
        {mode === 'supplierList' ? (
          <SupplierListComponent
            suppliers={suppliers}
            isLoading={isLoading}
            isAdmin={isAdmin}
            setIsAddingSupplier={setIsAddingSupplier}
          />
        ) : (
          <StockAdjustmentComponent
            adjustments={adjustments}
            newAdjustment={newAdjustment}
            setNewAdjustment={setNewAdjustment}
            handleAddAdjustment={handleAddAdjustment}
            isLoading={isLoading}
            showMessage={showMessage}
          />
        )}

      </main>

      {/* Add Supplier Modal */}
      <AddSupplierModal
        isOpen={isAddingSupplier}
        onClose={() => setIsAddingSupplier(false)}
        onSave={handleSaveNewSupplier}
        isLoading={isLoading}
      />

      <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
    </div>
  )
}