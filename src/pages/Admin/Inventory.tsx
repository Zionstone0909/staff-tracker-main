"use client";

import React, { useState, useEffect } from "react";
import { db } from "../../firebase";
import { 
    collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, 
    query, orderBy, Timestamp 
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";

// Define local placeholder components with inline styles
const PrimaryColor = '#0B3D91';
const DestructiveColor = '#dc2626';
const SuccessColor = '#065f46';
const LightBg = '#f3f4f6';
const OutlineBorderColor = '#e5e7eb';
const MutedColor = '#6b7280';

// --- Interfaces ---
interface StockItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  price: number;
}

interface User {
  id: string;
  email: string;
  role: "admin" | "staff";
}

// --- Utilities ---
const getInputValue = (e: React.ChangeEvent<HTMLInputElement>): string => e.target.value;

// --- UI Components (using inline styles) ---
interface ButtonProps {
  children: React.ReactNode;
  onClick?: (event?: React.MouseEvent<HTMLButtonElement>) => void;
  variant?: "ghost" | "outline" | "default" | "destructive" | "secondary";
  size?: "sm" | "default";
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  style?: React.CSSProperties;
}

const Button: React.FC<ButtonProps> = ({ 
  children, 
  onClick, 
  disabled = false, 
  variant = "default", 
  size = "default", 
  type = "button", 
  style = {} 
}) => {
  let backgroundColor = PrimaryColor;
  let color = 'white';
  let border = '1px solid transparent';
  let padding = size === "sm" ? '0.25rem 0.75rem' : '0.5rem 1rem';
  let fontSize = size === "sm" ? '0.875rem' : '1rem';

  if (variant === "ghost") {
    backgroundColor = 'transparent';
    color = PrimaryColor;
    border = 'none';
  } else if (variant === "outline") {
    backgroundColor = 'transparent';
    color = PrimaryColor;
    border = `1px solid ${PrimaryColor}`;
  } else if (variant === "destructive") {
    backgroundColor = DestructiveColor;
  } else if (variant === "secondary") {
    backgroundColor = LightBg;
    color = PrimaryColor;
  }

  const baseStyle: React.CSSProperties = {
    padding,
    fontSize,
    cursor: disabled ? 'not-allowed' : 'pointer',
    backgroundColor: disabled ? '#ccc' : backgroundColor,
    color: disabled ? '#666' : color,
    border,
    borderRadius: '4px',
    fontWeight: '500',
    transition: 'background-color 0.2s, opacity 0.2s',
    opacity: disabled ? 0.6 : 1,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    whiteSpace: 'nowrap',
    ...style
  };

  return (
    <button type={type} style={baseStyle} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
};

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({ style = {}, ...props }) => (
  <input
    style={{
      display: 'flex',
      height: '40px',
      width: '100%',
      borderRadius: '4px',
      border: '1px solid #ccc',
      backgroundColor: 'white',
      padding: '0.6rem 0.8rem',
      fontSize: '1rem',
      color: '#1f2937',
      outline: 'none',
      boxSizing: 'border-box',
      transition: 'border-color 0.15s ease-in-out',
      ...style
    }}
    {...props}
  />
);

const Card: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style = {} }) => (
  <div style={{ 
    borderRadius: '8px', 
    backgroundColor: 'white', 
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)', 
    border: `1px solid ${OutlineBorderColor}`, 
    marginBottom: '1.5rem',
    ...style 
  }}>
    {children}
  </div>
);

const CardHeader: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ padding: '1.5rem', borderBottom: `1px solid ${OutlineBorderColor}` }}>
    {children}
  </div>
);

const CardTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: PrimaryColor, margin: 0 }}>
    {children}
  </h2>
);

const CardContent: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style = {} }) => (
  <div style={{ padding: '1.5rem', ...style }}>
    {children}
  </div>
);

const Table: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <table style={{ minWidth: '100%', width: '100%', borderCollapse: 'collapse' }}>
    {children}
  </table>
);

const TableHeader: React.FC<{ children: React.ReactNode }> = ({ children }) => <thead>{children}</thead>;

const TableHead: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <th style={{ 
    padding: '0.75rem 1.5rem', 
    textAlign: 'left', 
    fontSize: '0.875rem', 
    fontWeight: '600', 
    color: MutedColor, 
    textTransform: 'uppercase', 
    backgroundColor: '#f9fafb', 
    borderBottom: `2px solid ${OutlineBorderColor}` 
  }}>
    {children}
  </th>
);

const TableRow: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <tr style={{ borderBottom: `1px solid ${OutlineBorderColor}`, transition: 'background-color 0.15s' }}>
    {children}
  </tr>
);

const TableBody: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <tbody style={{ backgroundColor: 'white' }}>{children}</tbody>
);

const TableCell: React.FC<{ 
  children: React.ReactNode; 
  colSpan?: number; 
  style?: React.CSSProperties 
}> = ({ children, colSpan, style = {} }) => (
  <td colSpan={colSpan} style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', color: '#1f2937', ...style }}>
    {children}
  </td>
);

// --- Modal Component ---
interface ModalState {
  type: "error" | "confirm" | "info";
  text: string;
  onConfirm?: () => void;
}

const AlertModal: React.FC<{ modal: ModalState | null; onClose: () => void }> = ({ modal, onClose }) => {
  if (!modal) return null;

  let title = "";
  let buttonText = "OK";
  let buttonColor = PrimaryColor;

  if (modal.type === "error") { 
    title = "Validation Error"; 
    buttonColor = DestructiveColor; 
  } else if (modal.type === "confirm") { 
    title = "Confirm Action"; 
    buttonText = "Delete"; 
    buttonColor = DestructiveColor; 
  } else { 
    title = "Information"; 
  }

  const handleAction = () => { 
    if (modal.type === "confirm" && modal.onConfirm) {
      modal.onConfirm(); 
    }
    onClose(); 
  };

  return (
    <div style={{ 
      position: 'fixed', 
      inset: 0, 
      backgroundColor: 'rgba(0, 0, 0, 0.5)', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      zIndex: 50, 
      padding: '1rem' 
    }}>
      <div style={{ 
        backgroundColor: 'white', 
        borderRadius: '8px', 
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)', 
        maxWidth: '28rem', 
        width: '100%', 
        padding: '1.5rem' 
      }}>
        <h3 style={{ 
          fontSize: '1.5rem', 
          fontWeight: 'bold', 
          marginBottom: '1rem', 
          color: modal.type === "error" ? DestructiveColor : PrimaryColor 
        }}>
          {title}
        </h3>
        <p style={{ color: '#4b5563', marginBottom: '1.5rem' }}>{modal.text}</p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          {modal.type === "confirm" && (
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
          )}
          <Button onClick={handleAction} style={{ backgroundColor: buttonColor }}>{buttonText}</Button>
        </div>
      </div>
    </div>
  );
};

// --- Main Component ---
export default function InventoryPage() {
  const navigate = useNavigate();
  const [stock, setStock] = useState<StockItem[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [invalidFields, setInvalidFields] = useState<string[]>([]);
  const [modal, setModal] = useState<ModalState | null>(null);
  const [newItem, setNewItem] = useState<Omit<StockItem, "id">>({ 
    name: "", 
    category: "", 
    quantity: 0, 
    price: 0 
  });
  const [loading, setLoading] = useState(true);

  // Load User & Firestore Data
  useEffect(() => {
    // 1. User Logic (Mock for now, replacing localStorage if needed)
    const userString = localStorage.getItem("currentUser");
    const user: User | null = userString 
      ? JSON.parse(userString) 
      : { id: "mock-admin-123", email: "admin@mock.com", role: "admin" };
    setCurrentUser(user);

    // 2. Firestore Listener
    // Maps Firestore fields (units_available, unit_price) to UI fields (quantity, price)
    const q = query(collection(db, 'inventory'), orderBy('name'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
              id: doc.id,
              name: data.name || "Unknown",
              category: data.category || "General",
              quantity: typeof data.units_available === 'number' ? data.units_available : 0,
              price: typeof data.unit_price === 'number' ? data.unit_price : 0
          } as StockItem;
      });
      setStock(items);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const validateStockItem = (item: StockItem | Omit<StockItem, "id">) => {
    const invalid: string[] = [];
    if (!item.name?.trim()) invalid.push("name");
    // Category is optional in some logic, but enforced here if desired. 
    // Commenting out category validation for broader compatibility if simple ledger items are added without it.
    // if (!item.category?.trim()) invalid.push("category");
    if (item.quantity < 0) invalid.push("quantity");
    if (item.price < 0) invalid.push("price");
    return invalid;
  };

  const handleAddItem = async () => {
    if (currentUser?.role !== "admin") {
      setModal({ type: "error", text: "Only administrators can add items." });
      return;
    }

    const invalid = validateStockItem(newItem);
    if (invalid.length > 0) {
      setInvalidFields(invalid);
      setModal({ type: "error", text: `Please correct the following fields: ${invalid.join(", ")}` });
      return;
    }

    setInvalidFields([]);

    try {
        await addDoc(collection(db, 'inventory'), {
            name: newItem.name,
            category: newItem.category || "General",
            units_available: Number(newItem.quantity),
            unit_price: Number(newItem.price),
            created_at: Timestamp.now()
        });
        
        setNewItem({ name: "", category: "", quantity: 0, price: 0 });
        setModal({ type: "info", text: `Item "${newItem.name}" added successfully.` });
    } catch (error) {
        console.error("Error adding item:", error);
        setModal({ type: "error", text: "Failed to save item to database." });
    }
  };

  const handleEditInput = (field: keyof Omit<StockItem, "id">, id: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = getInputValue(e);
    // Optimistic Update locally
    setStock(prev => prev.map(item => {
      if (item.id === id) {
        if (field === "quantity" || field === "price") {
          return { ...item, [field]: Number(val) || 0 };
        }
        return { ...item, [field]: val };
      }
      return item;
    }));
  };

  const handleSave = async (item: StockItem) => {
    const invalid = validateStockItem(item);
    if (invalid.length > 0) {
      setInvalidFields(invalid);
      setModal({ type: "error", text: `Please correct the following fields: ${invalid.join(", ")}` });
      return;
    }

    setInvalidFields([]);
    
    try {
        await updateDoc(doc(db, 'inventory', item.id), {
            name: item.name,
            category: item.category,
            units_available: Number(item.quantity),
            unit_price: Number(item.price)
        });
        
        setEditingId(null);
        setModal({ type: "info", text: `Item "${item.name}" updated successfully.` });
    } catch (error) {
        console.error("Error updating item:", error);
        setModal({ type: "error", text: "Failed to update item." });
    }
  };

  const deleteItemFromStock = async (id: string) => {
    try {
        await deleteDoc(doc(db, 'inventory', id));
        setModal({ type: "info", text: "Item deleted successfully." });
    } catch (error) {
        console.error("Error deleting item:", error);
        setModal({ type: "error", text: "Failed to delete item." });
    }
  };

  const handleDelete = (id: string, name: string) => {
    setModal({ 
      type: "confirm", 
      text: `Are you sure you want to delete "${name}"?`, 
      onConfirm: () => deleteItemFromStock(id) 
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setInvalidFields([]);
    // Re-fetch handled by onSnapshot automatically, but if we mutated local state optimistically, 
    // it will reset on next snapshot update or we can leave it as is if it's annoying.
    // For simplicity, we just clear editing state.
  };

  const showForm = currentUser?.role === "admin";

  return (
    <div style={{ minHeight: '100vh', backgroundColor: LightBg, fontFamily: 'Inter, sans-serif' }}>
      <AlertModal modal={modal} onClose={() => setModal(null)} />

      {/* Top Navigation */}
      <nav style={{ 
        borderBottom: '1px solid #e5e7eb', 
        backgroundColor: '#fff', 
        padding: '1rem', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' 
      }}>
        <Button
          variant="ghost"
          style={{ color: PrimaryColor }}
          onClick={() => navigate(-1)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5"/><path d="m12 19-7-7 7-7"/>
          </svg>
          <span>Back</span>
        </Button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontSize: '0.875rem', color: MutedColor }}>
            Role: <strong style={{ color: PrimaryColor }}>{currentUser?.role || 'Guest'}</strong>
          </span>
          <Button variant="destructive" onClick={() => {
            localStorage.removeItem("currentUser");
            window.location.reload(); // Simple reload to reset state/mock user
          }}>
            Logout
          </Button>
        </div>
      </nav>

      <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem 1rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: PrimaryColor, marginBottom: '2rem' }}>
          Inventory Stock Management
        </h1>

        {/* Add Item Form */}
        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle>Add New Stock Item</CardTitle>
            </CardHeader>
            <CardContent>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                {([
                  ["name", "Name", "text"], 
                  ["category", "Category", "text"], 
                  ["quantity", "Quantity", "number"], 
                  ["price", "Price (₦)", "number"]
                ] as const).map(([field, label, inputType]) => (
                  <div key={field}>
                    <label 
                      htmlFor={field} 
                      style={{ 
                        display: 'block', 
                        fontSize: '0.875rem', 
                        fontWeight: '600', 
                        color: '#374151', 
                        marginBottom: '0.5rem' 
                      }}
                    >
                      {label}
                    </label>
                    <Input
                      id={field}
                      type={inputType}
                      placeholder={`Enter ${label.toLowerCase()}`}
                      min={inputType === "number" ? 0 : undefined}
                      step={field === "price" ? "0.01" : "1"}
                      value={newItem[field] === 0 && (field === "quantity" || field === "price") ? "" : newItem[field]}
                      style={{ borderColor: invalidFields.includes(field) ? DestructiveColor : '#ccc' }}
                      onChange={e => {
                        const val = getInputValue(e);
                        setNewItem(prev => ({ 
                          ...prev, 
                          [field]: field === "quantity" || field === "price" 
                            ? (val === "" ? 0 : Number(val)) 
                            : val 
                        }));
                      }}
                    />
                  </div>
                ))}
              </div>
              <Button onClick={handleAddItem} style={{ marginTop: '1.5rem', width: '100%', backgroundColor: SuccessColor }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5v14M5 12h14"/>
                </svg>
                <span>Add New Item</span>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Stock Table */}
        <Card style={{ marginBottom: 0 }}>
          <CardHeader>
            <CardTitle>Current Stock Items ({stock.length})</CardTitle>
          </CardHeader>
          <CardContent style={{ padding: 0 }}>
            {loading ? (
                 <div style={{ padding: '2rem', textAlign: 'center', color: MutedColor }}>Loading inventory...</div>
            ) : (
            <div style={{ overflowX: 'auto' }}>
              <Table>
                <TableHeader>
                  <TableRow>
                    {["Name", "Category", "Quantity", "Price (₦)", "Actions"].map(h => (
                      <TableHead key={h}>{h}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stock.length > 0 ? stock.map(item => (
                    <TableRow key={item.id}>
                      {(["name", "category", "quantity", "price"] as const).map(field => (
                        <TableCell key={field}>
                          {editingId === item.id ? (
                            <Input
                              type={field === "quantity" || field === "price" ? "number" : "text"}
                              value={item[field]}
                              min={field === "quantity" || field === "price" ? 0 : undefined}
                              step={field === "price" ? "0.01" : "1"}
                              onChange={handleEditInput(field, item.id)}
                              style={{ borderColor: invalidFields.includes(field) ? DestructiveColor : '#ccc' }}
                            />
                          ) : (
                            field === 'price' ? `₦${item.price.toLocaleString('en-NG', { minimumFractionDigits: 2 })}` :
                            field === 'quantity' ? (
                              <span style={{ 
                                fontWeight: '600', 
                                color: item.quantity < 10 ? DestructiveColor : SuccessColor 
                              }}>
                                {item.quantity}
                              </span>
                            ) : item[field]
                          )}
                        </TableCell>
                      ))}
                      <TableCell>
                        {currentUser?.role === "admin" && (
                          editingId === item.id ? (
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                              <Button size="sm" onClick={() => handleSave(item)} style={{ backgroundColor: SuccessColor }}>
                                Save
                              </Button>
                              <Button size="sm" variant="secondary" onClick={handleCancelEdit}>
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                              <Button size="sm" onClick={() => setEditingId(item.id)}>
                                Edit
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => handleDelete(item.id, item.name)}>
                                Delete
                              </Button>
                            </div>
                          )
                        )}
                        {currentUser?.role === "staff" && (
                          <span style={{ color: '#9ca3af', fontStyle: 'italic', fontSize: '0.875rem' }}>
                            View Only
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: MutedColor }}>
                        {showForm 
                          ? "Inventory is empty. Add a new item above!" 
                          : "No stock items available."}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}