import React, { useState, CSSProperties, PropsWithChildren, useMemo, FormEvent } from 'react';
import { useData } from '../../contexts/DataContext';
import {
    Search,
    Plus,
    Trash2,
    Edit,
    X,
    Save,
    User,
    Phone,
    Loader2,
    FileText,
    Users,
    Mail,
    MapPin,
    FileText as NotesIcon
} from 'lucide-react';

// --- Styling Constants ---
const PrimaryColor = '#0B3D91';
const DestructiveColor = '#dc2626';
const LightBg = '#f3f4f6';
const CardBg = '#fff';

// --- UI Components ---
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
        padding: '0.5rem 1rem',
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

const Table: React.FC<PropsWithChildren & { style?: CSSProperties }> = ({ children, style }) => <table style={{ width: '100%', borderCollapse: 'collapse', ...style }}>{children}</table>;
const TableHeader: React.FC<PropsWithChildren> = ({ children }) => <thead>{children}</thead>;
const TableBody: React.FC<PropsWithChildren> = ({ children }) => <tbody>{children}</tbody>;

const TableRow: React.FC<PropsWithChildren & { style?: CSSProperties, onClick?: () => void }> = ({ children, style, onClick }) => (
    <tr onClick={onClick} style={{ borderBottom: '1px solid #eee', cursor: onClick ? 'pointer' : 'default', transition: 'background-color 0.1s', ...style }} onMouseEnter={(e) => { if(onClick) e.currentTarget.style.backgroundColor = '#f9fafb'}} onMouseLeave={(e) => { if(onClick) e.currentTarget.style.backgroundColor = 'transparent'}}>{children}</tr>
);

const TableHead: React.FC<PropsWithChildren & { style?: CSSProperties }> = ({ children, style }) => <th scope="col" style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 'bold', borderBottom: '2px solid #ccc', color: '#4b5563', fontSize: '0.85rem', ...style }}>{children}</th>;

const TableCell: React.FC<PropsWithChildren & { colSpan?: number, style?: CSSProperties }> = ({ children, style, colSpan }) => <td colSpan={colSpan} style={{ padding: '0.75rem', verticalAlign: 'middle', fontSize: '0.875rem', ...style }}>{children}</td>;

interface CustomerFormData {
    firstName: string; 
    lastName: string; 
    phone: string;
    email: string;
    address: string;
    notes: string;
}

const Customers: React.FC = () => {
    const { customers, addCustomer, updateCustomer, deleteCustomer } = useData();
    const [searchTerm, setSearchTerm] = useState('');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    // Use 'any' for editingCustomer to match the DataContext Customer type
    const [editingCustomer, setEditingCustomer] = useState<any | null>(null);

    const [formData, setFormData] = useState<CustomerFormData>({ firstName: '', lastName: '', phone: '', email: '', address: '', notes: '' });

    const isFormValid = useMemo(() => {
        return (
            formData.firstName.trim() !== '' &&
            formData.lastName.trim() !== '' &&
            formData.email.trim() !== ''
        );
    }, [formData]);

    const handleSaveCustomer = async (e: FormEvent) => {
        e.preventDefault();

        if (!isFormValid) {
            alert("Customer first name, last name, and email are required.");
            return;
        }

        try {
            if (editingCustomer) {
                await updateCustomer(editingCustomer.id, {
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    phone: formData.phone,
                    email: formData.email,
                    address: formData.address,
                    notes: formData.notes,
                });
            } else {
                await addCustomer({
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    phone: formData.phone,
                    email: formData.email,
                    address: formData.address,
                    notes: formData.notes,
                });
            }

            // FIX CONFIRMED: This closes the modal and resets the form after successful save.
            setIsModalOpen(false);
            setEditingCustomer(null);
            setFormData({ firstName: '', lastName: '', phone: '', email: '', address: '', notes: '' });
        } catch (error) {
            console.error("Error saving customer:", error);
            alert("Failed to save customer.");
        }
    };

    const handleDeleteCustomer = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (window.confirm("Are you sure you want to delete this customer?")) {
            deleteCustomer(id);
        }
    };

    const openAddModal = () => {
        setEditingCustomer(null);
        setFormData({ firstName: '', lastName: '', phone: '', email: '', address: '', notes: '' });
        setIsModalOpen(true);
    };

    const openEditModal = (customer: any, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingCustomer(customer);
        setFormData({
            firstName: customer.firstName,
            lastName: customer.lastName,
            phone: customer.phone,
            email: customer.email,
            address: customer.address || '',
            notes: customer.notes || ''
        });
        setIsModalOpen(true);
    };

    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        c.phone.includes(searchTerm) ||
        c.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    /**
     * Handles Firebase Timestamp objects or standard date formats for display.
     */
    const formatDate = (timestampValue: any) => {
        if (!timestampValue) return '-';

        let date: Date;
        
        // Check if it's a Firebase Timestamp object
        if (typeof timestampValue === 'object' && 'toDate' in timestampValue) {
            date = timestampValue.toDate();
        } 
        // Fallback for string, number, or Date object
        else {
            try {
                date = new Date(timestampValue);
            } catch {
                return '-';
            }
        }
        
        if (isNaN(date.getTime())) {
            return '-';
        }

        return date.toLocaleDateString();
    };


    return (
        <div style={{ minHeight: '100vh', backgroundColor: LightBg, padding: 0, fontFamily: 'sans-serif', color: '#1f2937' }}>
            
            <div style={{ padding: '1.5rem', maxWidth: '1000px', margin: '0 auto' }}>

                {/* Header & Actions */}
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', gap: '1rem' }}>
                    <div>
                        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0, color: PrimaryColor }}>Customers</h1>
                        <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem' }}>View, add, edit, and delete customer profiles.</p>
                    </div>
                    <Button onClick={openAddModal} variant="default">
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
                    <div style={{ overflowX: 'auto' }}>
                        <Table>
                            <TableHeader>
                                <TableRow style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                                    <TableHead>First Name</TableHead>
                                    <TableHead>Last Name</TableHead>
                                    <TableHead>Phone / Email</TableHead>
                                    <TableHead>Created By</TableHead>
                                    <TableHead>Created Date</TableHead>
                                    <TableHead style={{ textAlign: 'center' }}>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredCustomers.length > 0 ? (
                                    filteredCustomers.map((customer) => (
                                        <TableRow
                                            key={customer.id}
                                            onClick={() => {}} // Navigation handled by sidebar mainly, simplified here
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <TableCell>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <div style={{ flexShrink: 0, width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#e0e7ff', color: PrimaryColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold' }}>
                                                        {customer.firstName ? customer.firstName.charAt(0).toUpperCase() : '?'}
                                                    </div>
                                                    <div style={{ fontWeight: 600, color: '#111827' }}>{customer.firstName}</div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div style={{ fontWeight: 600, color: '#111827' }}>{customer.lastName}</div>
                                            </TableCell>
                                            <TableCell style={{ color: '#6b7280' }}>
                                                <div>{customer.phone || '-'}</div>
                                                <div style={{ fontSize: '0.75rem' }}>{customer.email || '-'}</div>
                                            </TableCell>

                                            <TableCell style={{ color: '#374151' }}>
                                                {customer.createdByName || 'System'}
                                            </TableCell>
                                            <TableCell style={{ color: '#6b7280' }}>
                                                {formatDate(customer.createdAt)}
                                            </TableCell>
                                            <TableCell style={{ textAlign: 'center' }}>
                                                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                                                    <Button
                                                        variant="ghost"
                                                        onClick={(e) => openEditModal(customer, e)}
                                                        style={{ padding: '0.25rem', color: PrimaryColor }}
                                                        title="Edit"
                                                    >
                                                        <Edit size={16} />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        onClick={(e) => handleDeleteCustomer(customer.id, e)}
                                                        style={{ padding: '0.25rem', color: DestructiveColor }}
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={16} />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>
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

            {/* Add/Edit Modal (Professional and Responsive Layout) */}
            {isModalOpen && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '1rem' }}>
                    <div style={{ backgroundColor: CardBg, borderRadius: '8px', width: '90%', maxWidth: '850px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', transition: 'transform 0.3s ease-out' }}>
                        
                        <div style={{ borderBottom: '1px solid #e5e7eb', padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0, color: PrimaryColor }}>
                                {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
                            </h2>
                            <Button variant="ghost" onClick={() => setIsModalOpen(false)} style={{ color: '#9ca3af', padding: '0.25rem' }}>
                                <X size={20} />
                            </Button>
                        </div>
                        
                        <form onSubmit={handleSaveCustomer}>
                            <div style={{ padding: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '1rem 1.5rem' }}>
                                
                                {/* Row 1: First Name & Last Name (Responsive Half-Width) */}
                                <div style={{ flex: '1 1 calc(50% - 0.75rem)' }}>
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 'bold', color: '#374151', marginBottom: '0.25rem' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><User size={14}/> First Name*</span>
                                    </label>
                                    <Input
                                        value={formData.firstName}
                                        onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                                        placeholder="Enter customer first name"
                                        required 
                                    />
                                </div>
                                <div style={{ flex: '1 1 calc(50% - 0.75rem)' }}>
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 'bold', color: '#374151', marginBottom: '0.25rem' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><User size={14}/> Last Name*</span>
                                    </label>
                                    <Input
                                        value={formData.lastName}
                                        onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                                        placeholder="Enter customer last name"
                                        required
                                    />
                                </div>

                                {/* Row 2: Phone & Email (Responsive Half-Width) */}
                                <div style={{ flex: '1 1 calc(50% - 0.75rem)' }}>
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
                                <div style={{ flex: '1 1 calc(50% - 0.75rem)' }}>
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
                                
                                {/* Row 3: Address (Full Width) */}
                                <div style={{ flex: '1 1 100%' }}>
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 'bold', color: '#374151', marginBottom: '0.25rem' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><MapPin size={14}/> Address</span>
                                    </label>
                                    <Input
                                        value={formData.address}
                                        onChange={(e) => setFormData({...formData, address: e.target.value})}
                                        placeholder="Enter full address"
                                    />
                                </div>

                                {/* Row 4: Notes (Full Width) */}
                                <div style={{ flex: '1 1 100%' }}>
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
                            <div style={{ borderTop: '1px solid #e5e7eb', padding: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                                    <X size={16} /> Cancel
                                </Button>
                                <Button type="submit" disabled={!isFormValid}>
                                    <Save size={16} /> {editingCustomer ? 'Update Customer' : 'Create Customer'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

// FIX: Added default export for compatibility with routes.tsx
export default Customers;