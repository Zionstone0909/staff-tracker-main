// src/pages/Staff/Customers.tsx
"use client"
import React, { useState, useEffect, CSSProperties, PropsWithChildren } from 'react';
import {
    collection,
    onSnapshot,
    addDoc,
    query,
    orderBy,
    DocumentData,
} from 'firebase/firestore';
import {
    db,
    APP_ID,
} from '../../firebase';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
    Search,
    Plus,
    X,
    Save,
    User as UserIcon,
    Phone,
    Loader2,
    FileText,
    Users,
    Mail,
    MapPin,
    FileText as NotesIcon
} from 'lucide-react';

// --- Global Types ---
interface InitiatorUser {
    id: string;
    name: string;
    role: 'admin' | 'staff' | 'user';
}

interface Customer {
    id: string;
    firstName: string; 
    lastName: string; 
    name: string;      
    phone: string;
    email: string;
    address: string;
    notes: string;
    balance: number; 
    totalPurchases: number; 
    createdAt: number;
    updatedAt?: number;
    createdBy: string;
    createdByName: string;
}

interface CustomerFormData {
    firstName: string; 
    lastName: string;  
    phone: string;
    email: string;
    address: string;
    notes: string;
}

// --- Data Paths ---
const getCollectionRef = (col: string) => collection(db, 'artifacts', APP_ID, 'public', 'data', col);
const CUSTOMERS_COLLECTION = 'customers';

// --- Styling Constants ---
const PrimaryColor = '#0B3D91';
const DestructiveColor = '#dc2626';
const LightBg = '#f3f4f6';
const CardBg = '#fff';

// --- UI Components (Optimized for Responsiveness) ---
const Button: React.FC<PropsWithChildren & React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'default' | 'destructive' | 'outline' | 'ghost' }> = ({ children, onClick, style, disabled, type = 'button', variant = 'default', ...props }) => {
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
        padding: '0.6rem 1rem', 
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
        whiteSpace: 'nowrap', 
        ...style
    };

    return (
        <button onClick={onClick} style={baseStyle} disabled={disabled} type={type} {...props}>
            {children}
        </button>
    );
};

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
    <input {...props} style={{ padding: '0.75rem', border: '1px solid #ccc', borderRadius: '4px', width: '100%', boxSizing: 'border-box', transition: 'border-color 0.2s', ...props.style }} 
        onFocus={(e) => e.currentTarget.style.borderColor = PrimaryColor}
        onBlur={(e) => e.currentTarget.style.borderColor = '#ccc'}
    />
);

const TextArea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = (props) => (
    <textarea {...props} style={{ padding: '0.75rem', border: '1px solid #ccc', borderRadius: '4px', width: '100%', boxSizing: 'border-box', resize: 'vertical', transition: 'border-color 0.2s', ...props.style }} 
        onFocus={(e) => e.currentTarget.style.borderColor = PrimaryColor}
        onBlur={(e) => e.currentTarget.style.borderColor = '#ccc'}
    />
);

const Card: React.FC<PropsWithChildren & { style?: CSSProperties }> = ({ children, style }) => (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1.5rem', marginBottom: '1rem', backgroundColor: CardBg, boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)', ...style }}>
        {children}
    </div>
);

const Table: React.FC<PropsWithChildren & { style?: CSSProperties }> = ({ children, style }) => <table style={{ minWidth: '700px', width: '100%', borderCollapse: 'collapse', ...style }}>{children}</table>; 
const TableHeader: React.FC<PropsWithChildren> = ({ children }) => <thead>{children}</thead>;
const TableBody: React.FC<PropsWithChildren> = ({ children }) => <tbody>{children}</tbody>;

const TableRow: React.FC<PropsWithChildren & { style?: CSSProperties, onClick?: () => void }> = ({ children, style, onClick }) => (
    <tr onClick={onClick} style={{ borderBottom: '1px solid #eee', cursor: onClick ? 'pointer' : 'default', transition: 'background-color 0.1s', ...style }} onMouseEnter={(e) => { if(onClick) e.currentTarget.style.backgroundColor = '#f9fafb'}} onMouseLeave={(e) => { if(onClick) e.currentTarget.style.backgroundColor = 'transparent'}}>{children}</tr>
);

const TableHead: React.FC<PropsWithChildren & { style?: CSSProperties }> = ({ children, style }) => <th scope="col" style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 'bold', borderBottom: '2px solid #ccc', color: '#4b5563', fontSize: '0.85rem', ...style }}>{children}</th>;

const TableCell: React.FC<PropsWithChildren & { colSpan?: number, style?: CSSProperties }> = ({ children, style, colSpan }) => <td colSpan={colSpan} style={{ padding: '0.75rem', verticalAlign: 'middle', fontSize: '0.875rem', ...style }}>{children}</td>;


const StaffCustomers: React.FC = () => {
    const navigate = useNavigate();
    const { user, loading: authLoading, isLoggedIn } = useAuth();
    
    // Simple hook simulation for responsiveness
    const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
    const isMobile = windowWidth < 768;

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    // End Responsive Helper

    const [customers, setCustomers] = useState<Customer[]>([]);
    const [dataLoading, setDataLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [formData, setFormData] = useState<CustomerFormData>({
        firstName: '',
        lastName: '',
        phone: '',
        email: '',
        address: '',
        notes: ''
    });

    const isFormValid = formData.firstName.trim() !== '' && formData.email.trim() !== '';

    useEffect(() => {
        if (!authLoading && !isLoggedIn) {
             navigate('/login');
             return;
        }

        if (!isLoggedIn) {
            return;
        }
        
        const q = query(getCollectionRef(CUSTOMERS_COLLECTION), orderBy('name'));
        const unsubCustomers = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => {
                const d = doc.data() as DocumentData;
                return {
                    id: doc.id,
                    ...d,
                    firstName: d.firstName || '',  
                    lastName: d.lastName || '',    
                    name: d.name || `${d.firstName || ''} ${d.lastName || ''}`.trim() || 'Unknown', 
                    email: d.email || '',
                    address: d.address || '',
                    phone: d.phone || '',
                    notes: d.notes || '',
                    balance: d.balance || 0, 
                    totalPurchases: d.totalPurchases || 0, 
                    createdBy: d.createdBy || 'unknown',
                    createdByName: d.createdByName || 'Unknown User',
                    createdAt: d.createdAt || 0
                } as Customer;
            });
            setCustomers(data);
            setDataLoading(false);
        });

        return () => {
            unsubCustomers();
        };
    }, [isLoggedIn, authLoading, navigate]);

    const handleSaveCustomer = async (e: React.FormEvent) => {
        e.preventDefault(); 

        if (!isFormValid || !user) {
            alert("Customer first name and email are required, or authentication failed.");
            return;
        }

        try {
            const nowInSeconds = Math.floor(Date.now() / 1000);
            const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim();

            const basePayload = {
                name: fullName,
                firstName: formData.firstName.trim(),
                lastName: formData.lastName.trim(),
                phone: formData.phone,
                email: formData.email,
                address: formData.address,
                notes: formData.notes,
            };

            await addDoc(getCollectionRef(CUSTOMERS_COLLECTION), {
                ...basePayload,
                balance: 0, 
                totalPurchases: 0, 
                createdAt: nowInSeconds,
                createdBy: user.id,
                createdByName: user.email, 
            });

            // FIX CONFIRMED: This closes the modal and resets the form after successful save.
            setIsModalOpen(false); 
            setFormData({ firstName: '', lastName: '', phone: '', email: '', address: '', notes: '' });
            
        } catch (e) {
            console.error("Error saving customer:", e);
            alert("Failed to save customer.");
        }
    };

    const openAddModal = () => {
        setFormData({ firstName: '', lastName: '', phone: '', email: '', address: '', notes: '' });
        setIsModalOpen(true);
    };

    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone.includes(searchTerm) ||
        c.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (authLoading || dataLoading || !isLoggedIn || !user) { 
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: LightBg, flexDirection: 'column', color: PrimaryColor }}>
                <Loader2 style={{ animation: 'spin 1s linear infinite', marginBottom: '1rem' }} size={40} />
                <p style={{ fontWeight: 500 }}>Loading Customers...</p>
            </div>
        );
    }

    const formatDate = (timestamp: number) => {
        if (!timestamp) return '-';
        return new Date(timestamp * 1000).toLocaleDateString();
    };

    const formatCurrency = (amount: number) => {
        return `$${amount.toFixed(2)}`;
    };

    return (
        <div style={{ minHeight: '100vh', backgroundColor: LightBg, padding: 0, fontFamily: 'sans-serif', color: '#1f2937' }}>
            
            {/* Navigation Bar */}
            <nav style={{ borderBottom: '1px solid #e5e7eb', backgroundColor: '#fff', padding: '1rem', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <Button
                        variant="outline"
                        style={{ backgroundColor: 'transparent', color: PrimaryColor, borderWidth: '1px', borderStyle: 'solid', borderColor: '#ccc' }}
                        onClick={() => navigate('/staff/dashboard')}
                    >
                        ← Dashboard
                    </Button>
                    <Button
                        variant="outline"
                        style={{ backgroundColor: 'transparent', color: PrimaryColor, borderWidth: '1px', borderStyle: 'solid', borderColor: '#ccc' }}
                        onClick={() => navigate('/staff/customer-ledger')}
                    >
                        Ledger
                    </Button>
                </div>
                <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: PrimaryColor }}>Staff Customer Management</div>
                <Button variant="destructive" onClick={() => navigate('/login')}>
                    Logout
                </Button> 
            </nav>


            {/* Main Content Area */}
            <div style={{ padding: isMobile ? '1rem' : '1.5rem', width: '100%', maxWidth: '1200px', margin: '0 auto' }}>

                {/* Header & Actions */}
                <div style={{ display: 'flex', flexWrap: isMobile ? 'wrap' : 'nowrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', gap: '1rem' }}>
                    <div>
                        <h1 style={{ fontSize: isMobile ? '1.75rem' : '2rem', fontWeight: 'bold', margin: 0, color: PrimaryColor }}>Customers</h1>
                        <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem' }}>View and add customer profiles.</p>
                    </div>
                    <Button onClick={openAddModal} variant="default" style={isMobile ? { width: '100%' } : {}}>
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
                            placeholder="Search by name, email, or phone..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ paddingLeft: '2.5rem', height: '42px' }}
                        />
                    </div>
                </Card>

                {/* Customers Table */}
                <Card style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}> 
                        <Table>
                            <TableHeader>
                                <TableRow style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                                    <TableHead>First Name</TableHead>
                                    <TableHead>Last Name</TableHead>
                                    <TableHead>Phone / Email</TableHead>
                                    <TableHead>Created By</TableHead>
                                    <TableHead>Created Date</TableHead>
                                    <TableHead style={{ textAlign: 'right' }}>Balance</TableHead>
                                    <TableHead style={{ textAlign: 'center' }}>Ledger</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredCustomers.length > 0 ? (
                                    filteredCustomers.map((customer) => (
                                        <TableRow
                                            key={customer.id}
                                            onClick={() => navigate(`/staff/customer-ledger?customerId=${customer.id}`)}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <TableCell>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#e0e7ff', color: PrimaryColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold', flexShrink: 0 }}>
                                                        {customer.firstName.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div style={{ fontWeight: 600, color: '#111827' }}>{customer.firstName || '-'}</div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div style={{ fontWeight: 600, color: '#111827' }}>{customer.lastName || '-'}</div>
                                            </TableCell>
                                            <TableCell style={{ color: '#6b7280' }}>
                                                <div>{customer.phone || '-'}</div>
                                                <div style={{ fontSize: '0.75rem' }}>{customer.email || '-'}</div>
                                            </TableCell>

                                            <TableCell style={{ color: customer.createdBy === user.id ? PrimaryColor : '#374151', fontWeight: customer.createdBy === user.id ? 600 : 400 }}>
                                                {customer.createdByName}
                                            </TableCell>
                                            <TableCell style={{ color: '#6b7280' }}>
                                                {formatDate(customer.createdAt)}
                                            </TableCell>
                                            <TableCell style={{ textAlign: 'right', fontWeight: 600, color: customer.balance > 0 ? DestructiveColor : '#10b981' }}>
                                                {formatCurrency(customer.balance)}
                                            </TableCell>
                                            <TableCell style={{ textAlign: 'center' }}>
                                                <Button
                                                    variant="ghost"
                                                    onClick={(e) => { e.stopPropagation(); navigate(`/staff/customer-ledger?customerId=${customer.id}`) }}
                                                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', color: PrimaryColor }}
                                                >
                                                    <FileText size={14} /> View
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>
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

            {/* Add Modal */}
            {isModalOpen && (
                <div style={{ 
                    position: 'fixed', 
                    inset: 0, 
                    backgroundColor: 'rgba(0, 0, 0, 0.6)', 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    zIndex: 1000, 
                    padding: '1rem' 
                }}>
                    <div style={{ 
                        backgroundColor: CardBg, 
                        borderRadius: '8px', 
                        width: isMobile ? '100%' : '90%', 
                        maxWidth: '850px', 
                        maxHeight: '90vh', 
                        overflowY: 'auto', 
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' 
                    }}>
                        
                        <div style={{ borderBottom: '1px solid #e5e7eb', padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0, color: PrimaryColor }}>
                                Add New Customer
                            </h2>
                            <Button variant="ghost" onClick={() => setIsModalOpen(false)} style={{ color: '#9ca3af', padding: '0.25rem' }}>
                                <X size={20} />
                            </Button>
                        </div>

                        <form onSubmit={handleSaveCustomer}>
                            {/* Responsive Form Grid */}
                            <div style={{ 
                                padding: '1.5rem', 
                                display: 'grid', 
                                gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', 
                                gap: '1rem' 
                            }}>
                                
                                {/* First Name */}
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 'bold', color: '#374151', marginBottom: '0.25rem' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><UserIcon size={14}/> First Name*</span>
                                    </label>
                                    <Input
                                        value={formData.firstName}
                                        onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                                        placeholder="Enter first name"
                                        required
                                    />
                                </div>
                                
                                {/* Last Name */}
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 'bold', color: '#374151', marginBottom: '0.25rem' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><UserIcon size={14}/> Last Name</span>
                                    </label>
                                    <Input
                                        value={formData.lastName}
                                        onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                                        placeholder="Enter last name"
                                    />
                                </div>
                                
                                {/* Email */}
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 'bold', color: '#374151', marginBottom: '0.25rem' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Mail size={14}/> Email*</span>
                                    </label>
                                    <Input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                                        placeholder="Enter email address"
                                        required
                                    />
                                </div>
                                
                                {/* Phone */}
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 'bold', color: '#374151', marginBottom: '0.25rem' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Phone size={14}/> Phone</span>
                                    </label>
                                    <Input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                        placeholder="Enter phone number"
                                    />
                                </div>
                            </div>
                            
                            {/* Address - Full Width */}
                            <div style={{ padding: isMobile ? '0 1.5rem 1rem 1.5rem' : '0 1.5rem 1rem 1.5rem' }}>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 'bold', color: '#374151', marginBottom: '0.25rem' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><MapPin size={14}/> Address</span>
                                </label>
                                <Input
                                    value={formData.address}
                                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                                    placeholder="Enter address"
                                />
                            </div>

                            {/* Notes - Full Width */}
                            <div style={{ padding: isMobile ? '0 1.5rem 1.5rem 1.5rem' : '0 1.5rem 1.5rem 1.5rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 'bold', color: '#374151', marginBottom: '0.25rem' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><NotesIcon size={14}/> Notes</span>
                                    </label>
                                    <TextArea
                                        value={formData.notes}
                                        onChange={(e) => setFormData({...formData, notes: e.target.value})}
                                        placeholder="Add any additional notes about the customer..."
                                        rows={3}
                                    />
                                </div>
                            </div>
                            
                            {/* Modal Footer (Action Buttons) */}
                            <div style={{ borderTop: '1px solid #e5e7eb', padding: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
                                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} style={isMobile ? { order: 2, width: '100%' } : {}}>
                                    <X size={16} /> Cancel
                                </Button>
                                <Button type="submit" disabled={!isFormValid} style={isMobile ? { order: 1, width: '100%' } : {}}>
                                    <Save size={16} /> Create Customer
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StaffCustomers;