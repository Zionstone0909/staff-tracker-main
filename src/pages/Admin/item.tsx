
"use client"
import React, { useState, useEffect, PropsWithChildren, CSSProperties, useMemo } from 'react';
import { db } from '../../firebase';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import { useNavigate } from 'react-router-dom';
import { 
    Plus, Edit, Trash2, Search, X, Package, ArrowLeft, LogOut, CheckCircle, AlertTriangle, Save, RotateCcw
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

// --- STYLING CONSTANTS ---
const PrimaryColor = '#0B3D91';
const DestructiveColor = '#dc2626';
const LightBg = '#f3f4f6';
const OutlineBorderColor = '#e5e7eb';

// --- TYPES ---
interface InventoryItem {
    id: string;
    name: string;
    sku?: string;
    category?: string;
    unit_price: number;
    units_available: number;
}

const defaultItem: Omit<InventoryItem, 'id'> = {
    name: '',
    sku: '',
    category: '',
    unit_price: 0,
    units_available: 0
};

// --- UI COMPONENTS ---
const Button: React.FC<PropsWithChildren & React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'default' | 'ghost' | 'destructive' | 'icon' }> = ({ children, onClick, style, disabled, type = 'button', variant = 'default', ...props }) => {
    let backgroundColor = PrimaryColor;
    let color = 'white';
    let border = 'none';
    let padding = '0.5rem 1rem';

    if (variant === 'ghost') {
        backgroundColor = 'transparent';
        color = PrimaryColor;
        border = `1px solid ${PrimaryColor}`;
    } else if (variant === 'destructive') {
        backgroundColor = DestructiveColor;
    } else if (variant === 'icon') {
        backgroundColor = 'transparent';
        color = '#6b7280';
        padding = '0.4rem';
        border = 'none';
    }

    return (
        <button
            onClick={onClick}
            style={{
                padding,
                cursor: disabled ? 'not-allowed' : 'pointer',
                backgroundColor: disabled ? '#ccc' : backgroundColor,
                color: color,
                border,
                borderRadius: '4px',
                fontWeight: '500',
                transition: 'all 0.2s',
                opacity: disabled ? 0.6 : 1,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                whiteSpace: 'nowrap',
                ...style
            }}
            disabled={disabled}
            type={type}
            {...props}
        >
            {children}
        </button>
    );
};

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
    <input {...props} style={{ padding: '0.6rem', border: '1px solid #ccc', borderRadius: '4px', width: '100%', boxSizing: 'border-box', height: '40px', ...props.style }} />
);

const Card: React.FC<PropsWithChildren & { style?: CSSProperties }> = ({ children, style }) => (
    <div style={{ border: `1px solid ${OutlineBorderColor}`, borderRadius: '8px', padding: '1.5rem', marginBottom: '1.5rem', backgroundColor: '#fff', boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)', ...style }}>
        {children}
    </div>
);

const Table: React.FC<PropsWithChildren> = ({ children }) => <table style={{ width: '100%', borderCollapse: 'collapse' }}>{children}</table>;
const TableHeader: React.FC<PropsWithChildren> = ({ children }) => <thead>{children}</thead>;
const TableBody: React.FC<PropsWithChildren> = ({ children }) => <tbody>{children}</tbody>;
const TableRow: React.FC<PropsWithChildren & { style?: CSSProperties }> = ({ children, style }) => <tr style={{ borderBottom: '1px solid #eee', ...style }}>{children}</tr>;
const TableHead: React.FC<PropsWithChildren & { style?: CSSProperties }> = ({ children, style }) => <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', borderBottom: '2px solid #e5e7eb', backgroundColor: '#f9fafb', color: '#374151', ...style }}>{children}</th>;
const TableCell: React.FC<PropsWithChildren & { colSpan?: number, style?: CSSProperties }> = ({ children, style, colSpan }) => <td colSpan={colSpan} style={{ padding: '0.75rem', verticalAlign: 'middle', color: '#1f2937', ...style }}>{children}</td>;

// --- MAIN COMPONENT ---
const ItemsPage: React.FC = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    
    // State
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Form State (No Modal)
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<Omit<InventoryItem, 'id'>>(defaultItem);

    // Fetch Items
    useEffect(() => {
        // Cast db to any to avoid 'Property collection does not exist' error with Compat syntax
        const q = (db as any).collection('inventory').orderBy('name');
        const unsubscribe = q.onSnapshot((snap: any) => {
            setItems(snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as InventoryItem)));
        });
        return () => unsubscribe();
    }, []);

    // Clear message timer
    useEffect(() => {
        if (message) {
            const t = setTimeout(() => setMessage(null), 4000);
            return () => clearTimeout(t);
        }
    }, [message]);

    const filteredItems = useMemo(() => {
        const lower = searchTerm.toLowerCase();
        return items.filter(i => 
            i.name.toLowerCase().includes(lower) || 
            (i.sku && i.sku.toLowerCase().includes(lower)) ||
            (i.category && i.category.toLowerCase().includes(lower))
        );
    }, [items, searchTerm]);

    const handleEdit = (item: InventoryItem) => {
        setFormData({
            name: item.name,
            sku: item.sku || '',
            category: item.category || '',
            unit_price: item.unit_price,
            units_available: item.units_available
        });
        setEditingId(item.id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancel = () => {
        setEditingId(null);
        setFormData(defaultItem);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this item? This action cannot be undone.')) return;
        try {
            await (db as any).collection('inventory').doc(id).delete();
            setMessage({ type: 'success', text: 'Item deleted successfully.' });
            // If deleting the item currently being edited, reset form
            if (editingId === id) {
                handleCancel();
            }
        } catch (error: any) {
            setMessage({ type: 'error', text: 'Failed to delete item: ' + error.message });
        }
    };

    const handleSave = async () => {
        if (!formData.name) {
            setMessage({ type: 'error', text: 'Item Name is required.' });
            return;
        }
        setIsLoading(true);
        try {
            if (editingId) {
                // Update
                await (db as any).collection('inventory').doc(editingId).update({ ...formData });
                setMessage({ type: 'success', text: 'Item updated successfully.' });
            } else {
                // Create
                await (db as any).collection('inventory').add({
                    ...formData,
                    // Cast firebase to any to avoid type errors with compat namespace
                    created_at: (firebase as any).firestore.Timestamp.now()
                });
                setMessage({ type: 'success', text: 'Item created successfully.' });
            }
            // Reset form but stay on page
            setEditingId(null);
            setFormData(defaultItem);
        } catch (error: any) {
            setMessage({ type: 'error', text: 'Failed to save item: ' + error.message });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', backgroundColor: LightBg, fontFamily: 'Arial, sans-serif' }}>
             {/* NAV */}
             <nav style={{ borderBottom: `1px solid ${OutlineBorderColor}`, backgroundColor: '#fff', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 10 }}>
                <Button variant="ghost" onClick={() => navigate('/admin/supplier-ledger')}>
                    <ArrowLeft size={16} /> Back to Ledger
                </Button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: PrimaryColor, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Package size={24} /> Item Master
                    </h1>
                </div>
                <Button variant="destructive" onClick={() => { logout(); navigate('/login'); }} style={{ borderRadius: '9999px', padding: '0.5rem' }}>
                    <LogOut size={16} />
                </Button>
            </nav>

            <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem 1rem' }}>
                
                {message && (
                    <div style={{ 
                        padding: '1rem', borderRadius: '4px', marginBottom: '1rem', 
                        backgroundColor: message.type === 'success' ? '#dcfce7' : '#fee2e2',
                        color: message.type === 'success' ? '#166534' : '#991b1b',
                        border: `1px solid ${message.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
                        display: 'flex', alignItems: 'center', gap: '0.5rem'
                    }}>
                        {message.type === 'success' ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
                        {message.text}
                    </div>
                )}

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'flex-start' }}>
                    
                    {/* LEFT COLUMN: FORM */}
                    <div style={{ flex: '1 1 350px', minWidth: '300px' }}>
                        <Card style={{ position: 'sticky', top: '90px' }}>
                            <div style={{ paddingBottom: '1rem', borderBottom: `1px solid ${OutlineBorderColor}`, marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{editingId ? 'Edit Item Details' : 'Add New Item'}</h2>
                                {editingId && (
                                    <Button variant="ghost" onClick={handleCancel} style={{ padding: '0.4rem' }}>
                                        <X size={16} />
                                    </Button>
                                )}
                            </div>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.9rem' }}>Item Name <span style={{color: DestructiveColor}}>*</span></label>
                                    <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Cement Bag 50kg" />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.9rem' }}>SKU (Optional)</label>
                                        <Input value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} placeholder="e.g. SKU-1001" />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.9rem' }}>Category</label>
                                        <Input value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} placeholder="e.g. Building Materials" />
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.9rem' }}>Selling Price (₦)</label>
                                        <Input type="number" value={formData.unit_price} onChange={e => setFormData({...formData, unit_price: Number(e.target.value)})} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.9rem' }}>Current Stock</label>
                                        <Input type="number" value={formData.units_available} onChange={e => setFormData({...formData, units_available: Number(e.target.value)})} />
                                        <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>Update via Ledger recommended</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
                                <Button variant="ghost" onClick={handleCancel} style={{ flex: 1, justifyContent: 'center' }}>
                                    <RotateCcw size={16} /> {editingId ? 'Cancel' : 'Clear'}
                                </Button>
                                <Button onClick={handleSave} disabled={isLoading} style={{ flex: 1, justifyContent: 'center' }}>
                                    {isLoading ? 'Saving...' : (editingId ? <><Save size={16}/> Update Item</> : <><Plus size={16}/> Add Item</>)}
                                </Button>
                            </div>
                        </Card>
                    </div>

                    {/* RIGHT COLUMN: LIST */}
                    <div style={{ flex: '2 1 500px', minWidth: '300px' }}>
                        <Card>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Inventory List</h3>
                                <div style={{ position: 'relative', width: '100%', maxWidth: '300px' }}>
                                    <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                                    <Input 
                                        placeholder="Search items..." 
                                        style={{ paddingLeft: '2.5rem' }}
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div style={{ overflowX: 'auto', border: `1px solid ${OutlineBorderColor}`, borderRadius: '6px' }}>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Item Name</TableHead>
                                            <TableHead>Category</TableHead>
                                            <TableHead style={{ textAlign: 'right' }}>Price</TableHead>
                                            <TableHead style={{ textAlign: 'center' }}>Stock</TableHead>
                                            <TableHead style={{ textAlign: 'center' }}>Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredItems.map(item => (
                                            <TableRow key={item.id} style={{ backgroundColor: editingId === item.id ? '#eff6ff' : 'transparent' }}>
                                                <TableCell style={{ fontWeight: '600' }}>
                                                    {item.name}
                                                    <div style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 'normal' }}>{item.sku}</div>
                                                </TableCell>
                                                <TableCell style={{ color: '#6b7280', fontSize: '0.9rem' }}>
                                                    {item.category && <span style={{ backgroundColor: '#f3f4f6', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem' }}>{item.category}</span>}
                                                </TableCell>
                                                <TableCell style={{ textAlign: 'right', fontFamily: 'monospace' }}>₦{item.unit_price?.toLocaleString()}</TableCell>
                                                <TableCell style={{ textAlign: 'center' }}>
                                                    <span style={{ 
                                                        fontWeight: 'bold', 
                                                        color: item.units_available < 10 ? '#ea580c' : '#16a34a' 
                                                    }}>
                                                        {item.units_available}
                                                    </span>
                                                </TableCell>
                                                <TableCell style={{ textAlign: 'center' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                                                        <Button variant="icon" onClick={() => handleEdit(item)} style={{ color: PrimaryColor, backgroundColor: editingId === item.id ? '#dbeafe' : 'transparent' }}>
                                                            <Edit size={16} />
                                                        </Button>
                                                        <Button variant="icon" onClick={() => handleDelete(item.id)} style={{ color: DestructiveColor }}>
                                                            <Trash2 size={16} />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {filteredItems.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>
                                                    No items found matching your search.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ItemsPage;
