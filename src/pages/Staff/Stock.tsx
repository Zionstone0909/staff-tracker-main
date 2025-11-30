"use client";

import React, { useState, useEffect } from "react";

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

const useRouter = () => ({
  push: (path: string) => console.log("Simulated Navigation to:", path),
  back: () => console.log("Simulated Navigation back"),
});

// --- Mock Data ---
const initialStockData: StockItem[] = [
  { id: "s1", name: "Premium Laptop X", category: "Electronics", quantity: 15, price: 1200000 },
  { id: "s2", name: "Wireless Keyboard", category: "Accessories", quantity: 5, price: 35000 },
  { id: "s3", name: "Office Chair Pro", category: "Furniture", quantity: 8, price: 180000 },
  { id: "s4", name: "External SSD 1TB", category: "Storage", quantity: 30, price: 65000 },
];

// --- Components ---
interface ButtonProps {
  children: React.ReactNode;
  onClick?: (event?: React.MouseEvent<HTMLButtonElement>) => void;
  variant?: "ghost" | "outline" | "default" | "destructive" | "secondary";
  size?: "sm" | "default";
  className?: string;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
}

const Button: React.FC<ButtonProps> = ({ children, onClick, className = "", disabled = false, variant = "default", size = "default", type = "button" }) => {
  let baseStyle = "font-semibold rounded-xl transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transform hover:scale-[1.02] active:scale-[0.98]";
  let sizeStyle = size === "sm" ? "px-3 py-1 text-sm" : "px-5 py-2.5 text-base";
  if (variant === "ghost") baseStyle += " hover:bg-gray-100 text-gray-700 shadow-none";
  else if (variant === "outline") baseStyle += " border border-indigo-300 hover:bg-indigo-50 text-indigo-700 shadow-md";
  else if (variant === "destructive") baseStyle += " bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/30";
  else if (variant === "secondary") baseStyle += " bg-indigo-100 hover:bg-indigo-200 text-indigo-800 shadow-sm";
  else baseStyle += " bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/50";

  return (
    <button type={type} className={`${baseStyle} ${sizeStyle} ${className}`} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
};

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { className?: string }> = ({ className = "", ...props }) => (
  <input
    className={`flex h-11 w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-2 text-base placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    {...props}
  />
);

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => (
  <div className={`rounded-2xl bg-white shadow-2xl border border-gray-100 ${className}`}>{children}</div>
);
const CardHeader: React.FC<{ children: React.ReactNode }> = ({ children }) => <div className="p-6 border-b border-gray-100">{children}</div>;
const CardTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => <h2 className="text-2xl font-bold text-indigo-800">{children}</h2>;
const CardContent: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => <div className={`p-6 ${className}`}>{children}</div>;

const Table: React.FC<{ children: React.ReactNode }> = ({ children }) => <table className="min-w-full divide-y divide-gray-200">{children}</table>;
const TableHeader: React.FC<{ children: React.ReactNode }> = ({ children }) => <thead>{children}</thead>;
const TableHead: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider bg-indigo-50">{children}</th>
);
const TableRow: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <tr className="even:bg-gray-50 hover:bg-indigo-100/50 transition-colors duration-200 border-b last:border-b-0">{children}</tr>
);
const TableBody: React.FC<{ children: React.ReactNode }> = ({ children }) => <tbody className="bg-white divide-y divide-gray-200">{children}</tbody>;
const TableCell: React.FC<{ children: React.ReactNode; className?: string; colSpan?: number }> = ({ children, className = "", colSpan }) => (
  <td colSpan={colSpan} className={`px-6 py-4 text-base text-gray-800 ${className}`}>{children}</td>
);

// --- Modal ---
interface ModalState {
  type: "error" | "confirm" | "info";
  text: string;
  onConfirm?: () => void;
}

const AlertModal: React.FC<{ modal: ModalState | null; onClose: () => void }> = ({ modal, onClose }) => {
  if (!modal) return null;

  let title = "";
  let buttonText = "OK";
  let style = "bg-indigo-600 hover:bg-indigo-700";

  if (modal.type === "error") { title = "Validation Error"; style = "bg-red-600 hover:bg-red-700"; }
  else if (modal.type === "confirm") { title = "Confirm Action"; buttonText = "Delete"; style = "bg-red-600 hover:bg-red-700"; }
  else { title = "Information"; }

  const handleAction = () => { if (modal.type === "confirm" && modal.onConfirm) modal.onConfirm(); onClose(); };

  return (
    <div style={{ backdropFilter: "blur(5px)" }} className="fixed inset-0 bg-gray-900 bg-opacity-40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-3xl max-w-sm w-full p-6 transform transition-all duration-300 scale-100">
        <h3 className={`text-2xl font-extrabold mb-3 ${modal.type === "error" ? "text-red-700" : "text-indigo-800"}`}>{title}</h3>
        <p className="text-gray-700 mb-6">{modal.text}</p>
        <div className="flex justify-end space-x-3">
          {modal.type === "confirm" && <Button variant="secondary" onClick={onClose}>Cancel</Button>}
          <Button onClick={handleAction} className={style}>{buttonText}</Button>
        </div>
      </div>
    </div>
  );
};

// --- Main Component ---
export default function StockPage() {
  const router = useRouter();
  const [stock, setStock] = useState<StockItem[]>(initialStockData);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [invalidFields, setInvalidFields] = useState<string[]>([]);
  const [modal, setModal] = useState<ModalState | null>(null);
  const [newItem, setNewItem] = useState<Omit<StockItem, "id">>({ name: "", category: "", quantity: 0, price: 0 });

  useEffect(() => {
    const userString = localStorage.getItem("currentUser");
    const user: User | null = userString ? JSON.parse(userString) : { id: "mock-admin-123", email: "admin@mock.com", role: "admin" };
    setCurrentUser(user);
  }, []);

  const validateStockItem = (item: StockItem | Omit<StockItem, "id">) => {
    const invalid: string[] = [];
    if (!item.name?.trim()) invalid.push("name");
    if (!item.category?.trim()) invalid.push("category");
    if (item.quantity < 0) invalid.push("quantity");
    if (item.price < 0) invalid.push("price");
    return invalid;
  };

  const handleAddItem = () => {
    if (currentUser?.role !== "admin") return;
    const invalid = validateStockItem(newItem);
    if (invalid.length > 0) {
      setInvalidFields(invalid);
      setModal({ type: "error", text: "Please correct fields: " + invalid.join(", ") });
      return;
    }
    setInvalidFields([]);
    const id = Date.now().toString();
    setStock(prev => [...prev, { ...newItem, id }]);
    setNewItem({ name: "", category: "", quantity: 0, price: 0 });
    setModal({ type: "info", text: `Item "${newItem.name}" added successfully.` });
  };

  const handleEditInput = (field: keyof Omit<StockItem, "id">, id: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = getInputValue(e);
    setStock(prev => prev.map(item => (item.id === id ? { ...item, [field]: field === "quantity" || field === "price" ? Number(val) : val } : item)));
  };

  const handleSave = (item: StockItem) => {
    const invalid = validateStockItem(item);
    if (invalid.length > 0) {
      setInvalidFields(invalid);
      setModal({ type: "error", text: "Please correct fields: " + invalid.join(", ") });
      return;
    }
    setInvalidFields([]);
    setEditingId(null);
    setModal({ type: "info", text: `Item "${item.name}" updated successfully.` });
  };

  const deleteItemFromStock = (id: string) => {
    setStock(prev => prev.filter(item => item.id !== id));
    setModal({ type: "info", text: "Item deleted successfully." });
  };

  const handleDelete = (id: string, name: string) => setModal({ type: "confirm", text: `Delete "${name}"?`, onConfirm: () => deleteItemFromStock(id) });

  const showForm = currentUser?.role === "admin";

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <AlertModal modal={modal} onClose={() => setModal(null)} />

      <nav className="border-b border-indigo-200 bg-white p-4 flex justify-between items-center shadow-lg sticky top-0 z-10">
        <Button variant="ghost" onClick={() => router.back()} className="text-xl text-indigo-700 hover:text-indigo-900 px-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
            <path d="M19 12H5"/><path d="m12 19-7-7 7-7"/>
          </svg>
          <span className="hidden sm:inline">Back to Dashboard</span>
        </Button>
        <div className="text-gray-600 text-sm italic">
          User Role: <span className="font-bold text-indigo-600 bg-indigo-100 px-3 py-1 rounded-full">{currentUser?.role || 'Guest'}</span>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-5xl font-extrabold text-indigo-900 mb-10 tracking-tight">Inventory Stock Management</h1>

        {/* Add Item Form */}
        {showForm && (
          <Card className="mb-12 shadow-xl shadow-indigo-100/50">
            <CardHeader><CardTitle>Add New Stock Item</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {(["name", "category", "quantity", "price"] as const).map(field => (
                  <div key={field}>
                    <label htmlFor={field} className="block text-sm font-medium text-gray-700 mb-1 capitalize">{field}</label>
                    <Input
                      id={field}
                      type={field === "quantity" || field === "price" ? "number" : "text"}
                      placeholder={`Enter ${field}`}
                      min={0}
                      value={newItem[field] === 0 && (field === "quantity" || field === "price") ? "" : newItem[field]}
                      className={invalidFields.includes(field) ? "border-red-500 focus:ring-red-500" : ""}
                      onChange={e => {
                        const val = getInputValue(e);
                        setNewItem(prev => ({ ...prev, [field]: field === "quantity" || field === "price" ? (val === "" ? 0 : Number(val)) : val }));
                      }}
                    />
                  </div>
                ))}
              </div>
              <Button onClick={handleAddItem} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl shadow-emerald-500/50 py-3 text-lg">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
                <span>Add New Item</span>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Stock Table */}
        <Card className="shadow-2xl shadow-gray-200">
          <CardHeader><CardTitle>Current Stock Items ({stock.length})</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto rounded-b-2xl">
              <Table>
                <TableHeader>
                  <TableRow>{["Name", "Category", "Quantity", "Price (₦)", "Actions"].map(h => <TableHead key={h}>{h}</TableHead>)}</TableRow>
                </TableHeader>
                <TableBody>
                  {stock.length > 0 ? stock.map(item => (
                    <TableRow key={item.id}>
                      {(["name","category","quantity","price"] as const).map(field => (
                        <TableCell key={field} className={field==='quantity'||field==='price'?'font-mono':''}>
                          {editingId === item.id && (field==='name' || field==='category' || field==='quantity' || field==='price') ? (
                            <Input
                              type={field === "quantity" || field === "price" ? "number" : "text"}
                              value={item[field]}
                              onChange={handleEditInput(field, item.id)}
                            />
                          ) : (
                            field === 'price' ? `₦${item.price.toLocaleString()}` :
                            field === 'quantity' ? <span className={item.quantity < 10 ? "font-extrabold text-red-600" : "font-semibold text-green-700"}>{item.quantity}</span> :
                            item[field]
                          )}
                        </TableCell>
                      ))}
                      <TableCell className="space-x-2 w-full text-right">
                        {currentUser?.role === "admin" && (
                          editingId === item.id ? (
                            <>
                              <Button size="sm" onClick={()=>handleSave(item)} className="bg-emerald-600 hover:bg-emerald-700 shadow-md">Save</Button>
                              <Button size="sm" variant="secondary" onClick={()=>{setEditingId(null); setInvalidFields([])}}>Cancel</Button>
                            </>
                          ) : (
                            <>
                              <Button size="sm" onClick={()=>setEditingId(item.id)}>Edit</Button>
                              <Button size="sm" variant="destructive" onClick={()=>handleDelete(item.id,item.name)}>Delete</Button>
                            </>
                          )
                        )}
                        {currentUser?.role === "staff" && editingId !== item.id && <span className="text-gray-400 italic text-sm">View Only</span>}
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-gray-500 py-12 text-lg">
                        Inventory is empty. Add a new item above!
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
}
