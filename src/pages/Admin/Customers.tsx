"use client"

import { useState, useEffect, CSSProperties, PropsWithChildren } from "react"
// FIX: Removed the unused import of 'useNavigate' to resolve TS6133 warning.
// import { useNavigate } from "react-router-dom" // <-- This line is removed.

// --- Utility: UUID Generator ---
/**
 * Generates a mock UUID. In a real app, this would come from a backend or a library like 'uuid'.
 */
const generateUUID = (): string => {
    // Simple mock UUID generator
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

// --- Constant Styles ---
const PrimaryColor = '#4f46e5';
const DangerColor = '#ef4444';
const CardBg = '#ffffff';
const BgColor = '#f3f4f6';

/**
 * Helper to apply responsive CSS styles (Tailwind-like grid logic).
 */
const getResponsiveFormStyle = (isDesktop: boolean) => {
    if (isDesktop) {
        return { gridTemplateColumns: 'repeat(2, 1fr)' } as CSSProperties;
    }
    return { gridTemplateColumns: 'repeat(1, 1fr)' } as CSSProperties;
};

// --- Custom Component Definitions ---

type ButtonProps = PropsWithChildren<{ 
    onClick?: () => void, 
    style?: CSSProperties, 
    variant?: 'default' | 'ghost' | 'destructive' | 'info',
    disabled?: boolean 
}> & React.ButtonHTMLAttributes<HTMLButtonElement>;


const Button: React.FC<ButtonProps> = ({ 
    children, 
    onClick, 
    style, 
    variant = 'default', 
    disabled = false, 
    ...rest
}) => {
    let baseStyle: CSSProperties = {
        padding: '0.5rem 1rem',
        borderRadius: '0.375rem',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontWeight: '600',
        transition: 'background-color 0.2s, opacity 0.2s',
        border: 'none',
        fontSize: '0.875rem',
        opacity: disabled ? 0.6 : 1,
        boxSizing: 'border-box',
        whiteSpace: 'nowrap',
    };

    if (variant === 'destructive') {
        baseStyle = { ...baseStyle, backgroundColor: DangerColor, color: '#fff' };
    } else if (variant === 'ghost') {
        baseStyle = { ...baseStyle, backgroundColor: 'transparent', color: PrimaryColor, border: '1px solid transparent' };
    } else if (variant === 'info') {
        baseStyle = { ...baseStyle, backgroundColor: '#3b82f6', color: '#fff', border: '1px solid #3b82f6' };
    } 
    else { // default
        baseStyle = { ...baseStyle, backgroundColor: PrimaryColor, color: '#fff' };
    }

    const handleClick = onClick || (() => {}); 

    return (
        <button 
            onClick={handleClick} 
            style={{ ...baseStyle, ...style }} 
            disabled={disabled} 
            {...rest}
        >
            {children}
        </button>
    );
};

const Card: React.FC<PropsWithChildren<{ style?: CSSProperties }>> = ({ children, style }) => (
    <div style={{ backgroundColor: CardBg, borderRadius: 8, boxShadow: '0 1px 10px rgba(0,0,0,0.08)', ...style }}>
        {children}
    </div>
);
const CardHeader: React.FC<PropsWithChildren<{ style?: CSSProperties }>> = ({ children, style }) => (
    <div style={{ padding: '1rem 1.5rem 0.5rem', borderBottom: '1px solid #e5e7eb', ...style }}>
        {children}
    </div>
);
const CardTitle: React.FC<PropsWithChildren<{ style?: CSSProperties }>> = ({ children, style }) => (
    <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0, ...style }}>
        {children}
    </h2>
);
const CardContent: React.FC<PropsWithChildren<{ style?: CSSProperties }>> = ({ children, style }) => (
    <div style={{ padding: '1.5rem', ...style }}>
        {children}
    </div>
);

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string }> = ({ label, ...props }) => (
    <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem', color: '#374151' }}>{label}</label>
        <input
            {...props}
            style={{
                width: '100%',
                padding: '0.6rem 0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                boxSizing: 'border-box',
                outline: 'none',
                transition: 'border-color 0.2s',
                ...(props.style || {}),
            }}
        />
    </div>
);

// --- Type Definitions (ID changed to string) ---

export interface Customer {
    id: string; // Used for unique ID (UUID)
    name: string;
    phone: string;
    email: string;
    address: string;
    account_status: 'Active' | 'Inactive' | 'Pending'; 
}

const mockCustomers: Customer[] = [
    { id: '1a2b3c4d-5e6f-7080-9101-112131415161', name: "Alice Johnson", phone: "555-0101", email: "alice@example.com", address: "45 River Rd", account_status: 'Active' },
    { id: '2b3c4d5e-6f70-8091-0112-131415161718', name: "Bob Smith", phone: "555-0202", email: "bob@example.com", address: "22 Lake Ave", account_status: 'Active' },
    { id: '3c4d5e6f-7080-9101-1121-314151617181', name: "Charlie Brown", phone: "555-0303", email: "charlie@example.com", address: "10 Main St", account_status: 'Pending' },
];

// --- Customer Details Modal Component ---

const CustomerDetailsModal: React.FC<{ customer: Customer, onClose: () => void }> = ({ customer, onClose }) => {
    return (
        <div style={{ 
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', 
            alignItems: 'center', zIndex: 1000, padding: '1rem' 
        }}>
            <Card style={{ 
                width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto', 
                transform: 'translateY(0)', transition: 'transform 0.3s' 
            }}>
                <CardHeader style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <CardTitle>Customer Details: {customer.name}</CardTitle>
                    <Button onClick={onClose} variant="ghost" style={{ fontSize: '1.5rem', padding: '0.25rem 0.5rem', lineHeight: 1 }}>&times;</Button>
                </CardHeader>
                <CardContent style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {/* Display the generated UUID */}
                    <p><strong>Unique ID (UUID):</strong> <span style={{ fontFamily: 'monospace', wordBreak: 'break-all', color: PrimaryColor }}>{customer.id}</span></p>
                    <p><strong>Account Status:</strong> <span style={{ fontWeight: 700, color: customer.account_status === 'Active' ? '#10b981' : customer.account_status === 'Pending' ? '#f59e0b' : DangerColor }}>{customer.account_status}</span></p>
                    <p><strong>Name:</strong> {customer.name}</p>
                    <p><strong>Phone:</strong> {customer.phone}</p>
                    <p><strong>Email:</strong> {customer.email}</p>
                    <p><strong>Address:</strong> {customer.address}</p>
                    
                    <div style={{ marginTop: '1rem', textAlign: 'right' }}>
                        <Button onClick={onClose} variant="default">Close</Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

// --- Customer Form Component ---

const CustomerForm: React.FC<{ onAddCustomer: (c: Omit<Customer, "id" | "account_status">) => Promise<void> }> = ({ onAddCustomer }) => {
    const [formData, setFormData] = useState<Omit<Customer, "id" | "account_status">>({
        name: '',
        phone: '',
        email: '',
        address: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDesktop, setIsDesktop] = useState(false);

    useEffect(() => {
        const checkDesktop = () => setIsDesktop(window.innerWidth >= 768);
        checkDesktop();
        window.addEventListener('resize', checkDesktop);
        return () => window.removeEventListener('resize', checkDesktop);
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting || !formData.name.trim() || !formData.phone.trim()) return; 

        setIsSubmitting(true);
        try {
            await onAddCustomer(formData);
            setFormData({ name: '', phone: '', email: '', address: '' });
        } catch (error) {
            console.error("Submission error:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {/* Responsive grid for desktop/mobile */}
            <div style={{ display: 'grid', gap: '1rem', ...getResponsiveFormStyle(isDesktop) }}>
                <Input label="Customer Name (Required)" name="name" value={formData.name} onChange={handleChange} required />
                <Input label="Phone (Required)" name="phone" type="tel" value={formData.phone} onChange={handleChange} required />
                <Input label="Email" name="email" type="email" value={formData.email} onChange={handleChange} />
                <Input label="Address" name="address" value={formData.address} onChange={handleChange} />
            </div>

            <div style={{ textAlign: 'right', marginTop: '0.5rem' }}>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Adding...' : 'Save New Customer'}
                </Button>
            </div>
        </form>
    );
};

const CustomerTable: React.FC<{ 
    customers: Customer[], 
    loading: boolean, 
    error: string | null,
    isAdmin: boolean,
    onView: (customer: Customer) => void,
    onEdit: (id: string) => void,
    onDelete: (id: string) => void
}> = ({ customers, loading, error, isAdmin, onView, onEdit, onDelete }) => {
    if (loading) return <div style={{ textAlign: 'center', padding: '1rem', color: PrimaryColor }}>Loading customers...</div>;
    if (error) return <div style={{ color: DangerColor, padding: '1rem' }}>Error: {error}</div>;

    return (
        <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px', fontSize: '0.875rem' }}>
                <thead>
                    <tr style={{ backgroundColor: '#eef2ff', fontWeight: 600 }}>
                        <th style={{ padding: '1rem 0.75rem', textAlign: 'left', borderBottom: '2px solid #c7d2fe' }}>Name</th>
                        <th style={{ padding: '1rem 0.75rem', textAlign: 'left', borderBottom: '2px solid #c7d2fe' }}>Phone</th>
                        <th style={{ padding: '1rem 0.75rem', textAlign: 'left', borderBottom: '2px solid #c7d2fe' }}>Status</th>
                        <th style={{ padding: '1rem 0.75rem', textAlign: 'left', borderBottom: '2px solid #c7d2fe' }}>Address</th>
                        <th style={{ padding: '1rem 0.75rem', textAlign: 'center', borderBottom: '2px solid #c7d2fe' }}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {customers.length === 0 ? (
                        <tr>
                            <td colSpan={5} style={{ textAlign: 'center', padding: '1rem', color: '#6b7280' }}>No matching customers found.</td>
                        </tr>
                    ) : (
                        customers.map((c, index) => (
                            <tr key={c.id} style={{ backgroundColor: index % 2 === 0 ? CardBg : BgColor, transition: 'background-color 0.2s' }}>
                                <td style={{ padding: '0.75rem', borderBottom: '1px solid #e5e7eb', fontWeight: 500 }}>{c.name}</td>
                                <td style={{ padding: '0.75rem', borderBottom: '1px solid #e5e7eb' }}>{c.phone}</td>
                                <td style={{ padding: '0.75rem', borderBottom: '1px solid #e5e7eb', fontWeight: 600, color: c.account_status === 'Active' ? '#10b981' : c.account_status === 'Pending' ? '#f59e0b' : DangerColor }}>
                                    {c.account_status}
                                </td>
                                <td style={{ padding: '0.75rem', borderBottom: '1px solid #e5e7eb' }}>{c.address}</td>
                                <td style={{ padding: '0.75rem', borderBottom: '1px solid #e5e7eb', display: 'flex', gap: 8, justifyContent: 'center' }}>
                                    <Button onClick={() => onView(c)} variant="info" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>View</Button>
                                    {isAdmin && (
                                        <>
                                            <Button onClick={() => onEdit(c.id)} variant="ghost" style={{ padding: '0.25rem 0.5rem', border: '1px solid #ccc', fontSize: '0.75rem' }}>Edit</Button>
                                            <Button onClick={() => onDelete(c.id)} variant="destructive" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>Delete</Button>
                                        </>
                                    )}
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
};

// --- Main Page Component ---

export default function CustomersPage() {
    // Retaining the mock navigate function definition
    const navigate = ((path: string | number) => { console.log(`Navigating to: ${path}`); }) as any;
    
    // Simulate user role based on simple state (Admin for demonstration)
    const [role] = useState<'admin' | 'staff'>('admin'); 
    const isAdmin = role === 'admin';

    const [customers, setCustomers] = useState<Customer[]>(mockCustomers);
    const [loading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

    // Filter customers based on search term
    const filteredCustomers = customers.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone.includes(searchTerm) ||
        c.email.toLowerCase().includes(searchTerm.toLowerCase())
    );


    useEffect(() => {
        // Mock navigation logic
    }, [])


    const addCustomer = async (newCustomer: Omit<Customer, "id" | "account_status">) => {
        setMessage(null);
        if (!isAdmin) {
            setError("Access Denied: Only Admins can add customers.");
            return;
        }

        try {
            await new Promise(resolve => setTimeout(resolve, 300));
            
            // *** CORE LOGIC IMPLEMENTATION ***
            const customerWithId: Customer = { 
                id: generateUUID(), // **Generate unique ID**
                ...newCustomer,
                account_status: 'Active' // Default status for a new customer
            };

            setCustomers(prev => [...prev, customerWithId]); // **Add to table/state**

            setMessage({ 
                text: `✅ Successfully added customer: ${customerWithId.name}. Unique ID (UUID): ${customerWithId.id.substring(0, 8)}...`, 
                type: 'success' 
            });
            setError(null);
        } catch (err: any) {
            console.error("[v2] Error adding customer:", err)
            setError("Failed to add customer")
        }
    }

    const editCustomer = (id: string) => {
        setMessage(null);
        if (!isAdmin) {
            setError("Access Denied: Only Admins can edit customers.")
            return;
        }
        setMessage({ text: `⚙️ Admin Action: Prepared to edit customer with UUID ${id.substring(0, 8)}... (Feature Placeholder).`, type: 'success' });
        console.log(`Admin Action: Preparing to edit customer ID ${id}`);
        setError(null);
    };

    const deleteCustomer = (id: string) => {
        setMessage(null);
        if (!isAdmin) {
            setError("Access Denied: Only Admins can delete customers.")
            return;
        }
        
        setCustomers(prev => prev.filter(c => c.id !== id));
        setMessage({ text: `🗑️ Successfully deleted customer with UUID ${id.substring(0, 8)}...`, type: 'success' });
        console.log(`Admin Action: Deleted customer ID ${id}`);
        setError(null);
    };
    
    const handleViewDetails = (customer: Customer) => {
        setSelectedCustomer(customer);
    };


    return (
        <div style={{ minHeight: '100vh', backgroundColor: BgColor, fontFamily: 'Inter, sans-serif' }}>
            <nav style={{ borderBottom: '1px solid #e5e7eb', backgroundColor: CardBg, padding: '1rem 0' }}>
                <div style={{ maxWidth: '1120px', margin: '0 auto', padding: '0 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, color: PrimaryColor }}>Customer Ledger</h1>
                    <Button variant="ghost" onClick={() => navigate(-1)} style={{ color: PrimaryColor }}>
                        ← Back
                    </Button>
                </div>
            </nav>

            <main style={{ maxWidth: '1120px', margin: '0 auto', padding: '2rem 1rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 700, margin: 0, color: '#1f2937' }}>Customer Management ({isAdmin ? "**Admin View**" : "**Staff View**"})</h1>

                {/* Global Message/Alert Display */}
                {message && (
                    <div style={{ 
                        padding: '1rem', 
                        borderRadius: '0.375rem', 
                        backgroundColor: message.type === 'success' ? '#d1fae5' : '#fee2e2', 
                        color: message.type === 'success' ? '#065f46' : '#991b1b', 
                        fontWeight: 600,
                        border: `1px solid ${message.type === 'success' ? '#a7f3d0' : '#fca5a5'}`,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        {message.text}
                        <Button onClick={() => setMessage(null)} variant="ghost" style={{ color: message.type === 'success' ? '#065f46' : '#991b1b', padding: '0.25rem', fontSize: '1rem' }}>&times;</Button>
                    </div>
                )}

                {/* --- ADD NEW CUSTOMER CARD (ADMIN ONLY) --- */}
                {isAdmin && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Create New Customer</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <CustomerForm onAddCustomer={addCustomer} />
                        </CardContent>
                    </Card>
                )}
                
                {/* --- CUSTOMERS LIST (History) --- */}
                <Card>
                    <CardHeader>
                        <CardTitle>Customer History ({filteredCustomers.length} Found)</CardTitle>
                    </CardHeader>
                    <CardContent style={{ paddingTop: 0 }}>
                        {/* Search Bar Feature */}
                        <div style={{ padding: '1rem 0 1.5rem 0' }}>
                            <Input 
                                label="Search Customers by Name, Phone, or Email" 
                                name="search" 
                                value={searchTerm} 
                                onChange={(e) => setSearchTerm(e.target.value)} 
                                style={{ padding: '0.75rem 1rem', fontSize: '1rem', marginBottom: 0 }}
                                placeholder="e.g., Alice Johnson or 555-0101"
                            />
                        </div>
                        {error && <p style={{ color: DangerColor, marginBottom: '1rem', fontWeight: 600 }}>{error}</p>}
                        <CustomerTable
                            customers={filteredCustomers}
                            loading={loading}
                            error={error}
                            isAdmin={isAdmin}
                            onView={handleViewDetails}
                            onEdit={editCustomer}
                            onDelete={deleteCustomer}
                        />
                    </CardContent>
                </Card>

            </main>

            {/* Customer Details Modal */}
            {selectedCustomer && (
                <CustomerDetailsModal
                    customer={selectedCustomer}
                    onClose={() => setSelectedCustomer(null)}
                />
            )}
        </div>
    )
}