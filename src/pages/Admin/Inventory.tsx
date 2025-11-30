"use client";

import React, { useState, useEffect, useCallback, CSSProperties } from "react";

import { AlertCircle, Package, Plus, Minus, Trash2 } from "lucide-react";

// --- Styling Constants ---
const PrimaryColor = '#3b82f6'; // Blue-600
const DestructiveColor = '#ef4444'; // Red-600
const OutlineBorderColor = '#e5e7eb'; // Gray-200
const HoverBgColor = '#f9fafb'; // Gray-50
const TextColor = '#111827'; // Gray-900
const MutedTextColor = '#6b7280'; // Gray-500
const BackgroundColor = '#f9fafb'; // Gray-50
const CardBg = '#fff';
const WarningBg = '#fef3c7'; // Yellow-100/50 approximation


// --- MOCK UI COMPONENTS WITH INLINE STYLES ---

const Button: React.FC<React.PropsWithChildren<{ onClick: () => void, style?: CSSProperties, variant?: 'destructive' | 'outline' | 'ghost' | 'default', disabled?: boolean, size?: 'sm' | 'default' }>> = ({ children, onClick, style, variant = 'default', disabled = false, size = 'default' }) => {
    let baseStyle: CSSProperties = {
        padding: '0.5rem 1rem',
        fontWeight: 600,
        borderRadius: 8,
        transition: 'all 0.15s ease-in-out',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        fontSize: size === 'sm' ? 12 : 14,
        height: size === 'sm' ? 28 : 40,
    };
    
    switch (variant) {
        case "destructive":
            baseStyle = { ...baseStyle, backgroundColor: DestructiveColor, color: '#fff' };
            break;
        case "outline":
            baseStyle = { ...baseStyle, border: '1px solid ' + OutlineBorderColor, backgroundColor: CardBg, color: MutedTextColor };
            break;
        case "ghost":
            baseStyle = { ...baseStyle, backgroundColor: 'transparent', color: MutedTextColor, boxShadow: 'none' };
            break;
        case "default":
        default:
            baseStyle = { ...baseStyle, backgroundColor: PrimaryColor, color: '#fff' };
            break;
    }

    return (
        <button
            onClick={onClick}
            style={{ ...baseStyle, ...style }}
            disabled={disabled}
        >
            {children}
        </button>
    );
};

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { className?: string }> = ({ value, onChange, placeholder, type = "text", style, disabled, min }) => (
    <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        min={min}
        style={{
            display: 'flex', height: 40, width: '100%', borderRadius: 6, border: '1px solid ' + OutlineBorderColor, 
            backgroundColor: CardBg, padding: '0px 12px', fontSize: 14, outline: 'none', 
            boxShadow: '0 0 0 1px transparent', // Mimic ring offset
            opacity: disabled ? 0.5 : 1, cursor: disabled ? 'not-allowed' : 'auto',
            ...style
        }}
    />
);

const Card: React.FC<React.PropsWithChildren<{ style?: CSSProperties }>> = ({ children, style }) => (
    <div style={{ borderRadius: 12, backgroundColor: CardBg, border: '1px solid ' + OutlineBorderColor, ...style }}>{children}</div>
);
const CardHeader: React.FC<React.PropsWithChildren<{ style?: CSSProperties }>> = ({ children, style }) => (
    <div style={{ display: 'flex', flexDirection: 'column', padding: 24, ...style }}>{children}</div>
);
const CardTitle: React.FC<React.PropsWithChildren<{ style?: CSSProperties }>> = ({ children, style }) => (
    <h3 style={{ fontSize: 24, fontWeight: 600, lineHeight: 1.5, margin: 0, ...style }}>{children}</h3>
);
const CardContent: React.FC<React.PropsWithChildren<{ style?: CSSProperties }>> = ({ children, style }) => (
    <div style={{ padding: 24, paddingTop: 0, ...style }}>{children}</div>
);

const Table: React.FC<React.PropsWithChildren<{}>> = ({ children }) => (
    <div style={{ position: 'relative', width: '100%', overflowX: 'auto' }}>
        <table style={{ width: '100%', captionSide: 'bottom', fontSize: 14 }}>{children}</table>
    </div>
);
const TableHeader: React.FC<React.PropsWithChildren<{}>> = ({ children }) => (
    <thead style={{ borderBottom: '1px solid ' + OutlineBorderColor, backgroundColor: HoverBgColor }}>{children}</thead>
);
const TableBody: React.FC<React.PropsWithChildren<{}>> = ({ children }) => (
    <tbody style={{}}>
        {children}
    </tbody>
);
const TableRow: React.FC<React.PropsWithChildren<{ style?: CSSProperties }>> = ({ children, style }) => (
    <tr style={{ borderBottom: '1px solid ' + OutlineBorderColor, transitionProperty: 'background-color', cursor: 'pointer', ...style }}>{children}</tr>
);
const TableHead: React.FC<React.PropsWithChildren<{ style?: CSSProperties }>> = ({ children, style }) => (
    <th style={{ height: 48, padding: '0 16px', textAlign: 'left', verticalAlign: 'middle', fontWeight: 500, color: MutedTextColor, ...style }}>{children}</th>
);
const TableCell: React.FC<React.PropsWithChildren<{ style?: CSSProperties }>> = ({ children, style }) => (
    <td style={{ padding: 16, verticalAlign: 'middle', ...style }}>{children}</td>
);


// --- MOCK ROUTER (Replaces useRouter when running outside Next.js App Router) ---
const useMockRouter = () => ({
    back: () => window.history.back(),
    push: (path: string) => console.log(`Mock navigation to: ${path}`)
});


// ------------------- TYPES -------------------

interface InventoryItem {
    id: number;
    item_name: string;
    quantity: number;
    unit_price: number;
    reorder_level: number;
}

interface CurrentUser {
    userId: number;
    email: string;
    role: "admin" | "staff";
}

// ------------------- COMPONENT -------------------

export default function InventoryPage() {
    const router = useMockRouter(); 
    
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
    const [newItem, setNewItem] = useState<Omit<InventoryItem, "id">>({
        item_name: "",
        quantity: 0,
        unit_price: 0,
        reorder_level: 0,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    
    const [editingItemId, setEditingItemId] = useState<number | null>(null);

    // ------------------- FETCH INVENTORY -------------------
    const fetchInventory = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const mockInventory: InventoryItem[] = [
                { id: 1, item_name: "Laptop Pro", quantity: 5, unit_price: 1200.00, reorder_level: 10 },
                { id: 2, item_name: "Mechanical Keyboard", quantity: 50, unit_price: 85.50, reorder_level: 20 },
                { id: 3, item_name: "USB-C Cable (Low Stock)", quantity: 2, unit_price: 5.00, reorder_level: 5 },
                { id: 4, item_name: "Monitor Stand", quantity: 15, unit_price: 45.00, reorder_level: 10 },
            ];
            await new Promise(resolve => setTimeout(resolve, 500)); 
            setInventory(mockInventory);
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Error fetching inventory");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const user = localStorage.getItem("currentUser");
        if (!user) {
            const mockUser: CurrentUser = { userId: 1, email: "admin@example.com", role: "admin" }; 
            setCurrentUser(mockUser);
        } else {
            setCurrentUser(JSON.parse(user));
        }
        fetchInventory();
    }, [fetchInventory]);

    // Helper to check role
    const isAdmin = currentUser?.role === "admin";
    const isStaff = currentUser?.role === "staff";

// --- HANDLERS ---

    const handleInput = (field: keyof typeof newItem) => (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = field === "item_name" ? e.currentTarget.value : Number(e.currentTarget.value);
        setNewItem(prev => ({ ...prev, [field]: value }));
    };

    const handleAddItem = async () => {
        if (!currentUser) return;
        if (newItem.item_name.trim() === "") {
            alert("Item name is required.");
            return;
        }

        if (isStaff && newItem.quantity <= 0) {
            alert("Permission denied. Staff must enter positive initial stock.");
            return;
        }

        try {
            console.log("Adding Item (MOCK):", newItem);
            await new Promise(resolve => setTimeout(resolve, 300));
            
            setInventory(prev => [
                ...prev, 
                { ...newItem, id: Date.now() } 
            ]);

            setNewItem({ item_name: "", quantity: 0, unit_price: 0, reorder_level: 0 });
        } catch (err: any) {
            console.error(err);
            alert(err.message || "Error adding item");
        }
    };

    const handleSaveItem = async (item: InventoryItem) => {
        if (!currentUser) return;
        
        const originalItem = inventory.find(i => i.id === item.id);
        if (!originalItem) return;

        const payload: Partial<InventoryItem> = {
            id: item.id,
            item_name: item.item_name,
            quantity: item.quantity,
        };

        if (isAdmin) {
            payload.unit_price = item.unit_price;
            payload.reorder_level = item.reorder_level;
        } else if (isStaff) {
            payload.unit_price = originalItem.unit_price;
            payload.reorder_level = originalItem.reorder_level;
            
            if (item.unit_price !== originalItem.unit_price || item.reorder_level !== originalItem.reorder_level) {
                alert("Permission denied. Staff cannot update price or reorder level.");
                setInventory(prev => 
                    prev.map(i => (i.id === item.id ? originalItem : i))
                );
                return; 
            }
        }

        try {
            console.log("Updating Item (MOCK):", payload);
            await new Promise(resolve => setTimeout(resolve, 300));
            setEditingItemId(null); 
        } catch (err: any) {
            console.error(err);
            alert(err.message || "Error updating item");
        }
    };
    
    const handleStockAdjustment = async (item: InventoryItem, delta: 1 | -1) => {
        if (!currentUser) return;
        
        const originalItem = inventory.find(i => i.id === item.id);
        if (!originalItem) return;

        const newQuantity = item.quantity + delta;

        if (newQuantity < 0) {
            alert("Stock cannot go below zero.");
            return;
        }

        setInventory(prev => 
            prev.map(i => (i.id === item.id ? { ...i, quantity: newQuantity } : i))
        );
        
        const updatedItem = { ...item, quantity: newQuantity };

        const payload: Partial<InventoryItem> = {
            id: updatedItem.id,
            item_name: updatedItem.item_name,
            quantity: updatedItem.quantity,
            unit_price: originalItem.unit_price, 
            reorder_level: originalItem.reorder_level, 
        };
        
        try {
            console.log(`Stock Adjustment (${delta > 0 ? 'Add' : 'Remove'} 1) (MOCK):`, payload);
            await new Promise(resolve => setTimeout(resolve, 300));
        } catch (err: any) {
            console.error(err);
            alert(err.message || "Error adjusting stock");
            setInventory(prev => prev.map(i => (i.id === item.id ? originalItem : i)));
        }
    };


    const handleDeleteItem = async (itemId: number) => {
        if (!isAdmin) {
            alert("Permission denied. Only Admins can delete items.");
            return;
        }
        
        if (!window.confirm("Are you sure you want to delete this item?")) return;

        try {
            console.log("Deleting Item (MOCK):", itemId);
            await new Promise(resolve => setTimeout(resolve, 300));
            setInventory(prev => prev.filter(item => item.id !== itemId));
        } catch (err: any) {
            console.error(err);
            alert(err.message || "Error deleting item");
        }
    };

    // Helper for rendering editable fields inline
    const renderCell = (item: InventoryItem, field: keyof InventoryItem, type: string = "text") => {
        const isEditing = editingItemId === item.id;
        const isDisabled = isStaff && (field === 'unit_price' || field === 'reorder_level');

        if (!isEditing) {
            const value = item[field];
            if (typeof value === 'number') {
                return field === 'unit_price' ? `₦${value.toLocaleString()}` : value.toLocaleString();
            }
            return value;
        }

        return (
            <Input
                type={type}
                value={item[field] as any}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const newValue = type === 'text' ? e.currentTarget.value : Number(e.currentTarget.value);
                    setInventory(prev => 
                        prev.map(i => (i.id === item.id ? { ...i, [field]: newValue } : i))
                    );
                }}
                disabled={isDisabled}
                style={{ width: 150 }}
            />
        );
    };


    if (!currentUser || loading) {
        return <div style={{ padding: 32, textAlign: 'center', fontSize: 18 }}>Loading inventory data and user context...</div>;
    }

    if (error) {
        return <div style={{ padding: 32, textAlign: 'center', color: DestructiveColor }}>Error: {error}</div>;
    }


    return (
        <div style={{ padding: 16, maxWidth: 1400, margin: '0 auto', backgroundColor: BackgroundColor, minHeight: '100vh', fontFamily: 'sans-serif' }}>
            <div style={{ maxWidth: 1400, margin: '0 auto' }}>
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                    <h1 style={{ fontSize: 36, fontWeight: 800, color: TextColor }}>Inventory Management</h1>
                    <Button onClick={() => router.back()} variant="outline" style={{ display: 'flex', alignItems: 'center' }}>
                        ← Back
                    </Button>
                </header>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24, marginBottom: 32 }}>
                    {/* Responsive grid for large screens */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(1, 1fr)', gap: 24 }}>
                        {/* Add New Item Card */}
                        <Card style={{ gridColumn: 'span 1' }}>
                            <CardHeader>
                                <CardTitle style={{ fontSize: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Package style={{ height: 20, width: 20, color: PrimaryColor }} />
                                    Add New Item
                                </CardTitle>
                            </CardHeader>
                            <CardContent style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                <Input
                                    placeholder="Item Name"
                                    value={newItem.item_name}
                                    onChange={handleInput("item_name")}
                                />
                                <Input
                                    placeholder="Quantity"
                                    type="number"
                                    value={newItem.quantity}
                                    onChange={handleInput("quantity")}
                                    min={isStaff ? 1 : 0} 
                                />
                                <Input
                                    placeholder="Unit Price (₦)"
                                    type="number"
                                    value={newItem.unit_price}
                                    onChange={handleInput("unit_price")}
                                    disabled={isStaff} 
                                />
                                <Input
                                    placeholder="Reorder Level"
                                    type="number"
                                    value={newItem.reorder_level}
                                    onChange={handleInput("reorder_level")}
                                    disabled={isStaff} 
                                />
                                <Button onClick={handleAddItem} style={{ width: '100%' }}>
                                    {isStaff ? "Add Item (Staff View)" : "Add Item"}
                                </Button>
                                {isStaff && <p style={{ fontSize: 12, color: DestructiveColor, marginTop: 8 }}>Staff cannot edit price/reorder levels when adding items.</p>}
                            </CardContent>
                        </Card>

                        {/* Inventory Table Card */}
                        <Card style={{ gridColumn: 'span 2' }}>
                            <CardHeader>
                                <CardTitle style={{ fontSize: 18 }}>Current Stock Levels</CardTitle>
                            </CardHeader>
                            <CardContent style={{ padding: 0 }}>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Item Name</TableHead>
                                            <TableHead>Quantity</TableHead>
                                            <TableHead>Unit Price</TableHead>
                                            <TableHead>Reorder Level</TableHead>
                                            <TableHead style={{ textAlign: 'right' }}>Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {inventory.map((item) => (
                                            <TableRow key={item.id} style={{ backgroundColor: item.quantity <= item.reorder_level ? WarningBg : CardBg }}>
                                                <TableCell>{renderCell(item, 'item_name', 'text')}</TableCell>
                                                <TableCell>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                        {isStaff && editingItemId !== item.id && (
                                                            <Button size="sm" onClick={() => handleStockAdjustment(item, -1)} disabled={item.quantity <= 0}>
                                                                <Minus style={{ height: 12, width: 12 }} />
                                                            </Button>
                                                        )}
                                                        {renderCell(item, 'quantity', 'number')}
                                                        {isStaff && editingItemId !== item.id && (
                                                             <Button size="sm" onClick={() => handleStockAdjustment(item, 1)}>
                                                                <Plus style={{ height: 12, width: 12 }} />
                                                            </Button>
                                                        )}
                                                        {item.quantity <= item.reorder_level && (
                                                            // FIX APPLIED HERE: Wrapped the icon in a span
                                                            <span title="Below reorder level">
                                                                <AlertCircle style={{ height: 16, width: 16, color: '#d97706' }} />
                                                            </span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>{renderCell(item, 'unit_price', 'number')}</TableCell>
                                                <TableCell>{renderCell(item, 'reorder_level', 'number')}</TableCell>
                                                <TableCell style={{ textAlign: 'right', gap: 8, display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                                                    {isAdmin && (
                                                        <>
                                                            {editingItemId === item.id ? (
                                                                <Button size="sm" onClick={() => handleSaveItem(item)}>Save</Button>
                                                            ) : (
                                                                <Button size="sm" variant="outline" onClick={() => setEditingItemId(item.id)}>Edit</Button>
                                                            )}
                                                            <Button size="sm" variant="destructive" onClick={() => handleDeleteItem(item.id)} style={{ padding: '4px 8px' }}>
                                                                <Trash2 style={{ height: 16, width: 16 }} />
                                                            </Button>
                                                        </>
                                                    )}
                                                    {isStaff && editingItemId !== item.id && (
                                                        <span style={{ fontSize: 12, color: MutedTextColor }}>Adjust via +/-</span>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
