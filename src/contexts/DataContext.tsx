import React, { createContext, useContext, useState, ReactNode } from 'react';
// We will define the types here for a self-contained context file.

// Utility to mock Firestore Timestamp for local mock data consistency
// Retaining 'any' cast as the actual Timestamp object is not imported here.
const mockTimestamp = (date: Date = new Date()) => ({
    toDate: () => date,
    seconds: Math.floor(date.getTime() / 1000),
    nanoseconds: 0,
}) as any; 

// --- Core Types (Usually defined in src/types/types.ts) ---
export interface Customer {
    id: string;
    firstName: string; 
    lastName: string; 
    name: string;
    email: string;
    phone: string;
    address: string;
    notes: string;
    balance: number;
    totalPurchases: number; 
    createdAt: any; // Using 'any' for mockTimestamp compatibility
    updatedAt?: any;
    createdBy?: string; 
    createdByName?: string;
}

export interface Sale {
    id: string;
    customerId: string;
    amount: number;
    description: string;
    date: string; // ISO string for mock
}

export interface Payment {
    id: string;
    customerId: string;
    amount: number;
    methodId: string;
    date: string; // ISO string for mock
}

export interface PaymentMethod {
    id: string;
    name: string;
    isActive: boolean;
}
// -----------------------------------------------------------

interface DataContextType {
    customers: Customer[];
    sales: Sale[];
    payments: Payment[];
    paymentMethods: PaymentMethod[];
    addCustomer: (customer: Omit<Customer, 'id' | 'createdAt' | 'balance' | 'name' | 'createdBy' | 'createdByName' | 'totalPurchases'>) => void;
    updateCustomer: (id: string, data: Partial<Customer>) => void;
    deleteCustomer: (id: string) => void;
    addSale: (sale: Omit<Sale, 'id' | 'date'>) => void;
    addPayment: (payment: Omit<Payment, 'id' | 'date'>) => void;
    addPaymentMethod: (name: string) => void;
    togglePaymentMethod: (id: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Mock initial data
const INITIAL_CUSTOMERS: Customer[] = [
    { 
        id: '1', 
        firstName: 'Acme',
        lastName: 'Corp',
        name: 'Acme Corp', 
        email: 'contact@acme.com', 
        phone: '555-0101', 
        address: '123 Business Rd',
        notes: 'Key account',
        balance: 500, 
        totalPurchases: 2500,
        createdAt: mockTimestamp(new Date(Date.now() - 86400000)) ,
        createdBy: 'admin-user',
        createdByName: 'Admin User'
    },
    { 
        id: '2', 
        firstName: 'Jane',
        lastName: 'Doe',
        name: 'Jane Doe', 
        email: 'jane@example.com', 
        phone: '555-0102', 
        address: '456 Lane',
        notes: '',
        balance: 0, 
        totalPurchases: 1200,
        createdAt: mockTimestamp(),
        createdBy: 'admin-user',
        createdByName: 'Admin User'
    },
];

const INITIAL_METHODS: PaymentMethod[] = [
    { id: '1', name: 'Cash', isActive: true },
    { id: '2', name: 'Credit Card', isActive: true },
    { id: '3', name: 'Bank Transfer', isActive: true },
];

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS);
    const [sales, setSales] = useState<Sale[]>([]);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(INITIAL_METHODS);

    // Using Date.now().toString() as a simple mock ID generator
    const generateId = () => Date.now().toString() + Math.random().toString(36).substring(2, 9);

    const addCustomer = (data: Omit<Customer, 'id' | 'createdAt' | 'balance' | 'name' | 'createdBy' | 'createdByName' | 'totalPurchases'>) => {
        const combinedName = `${data.firstName} ${data.lastName}`.trim();
        const newCustomer: Customer = {
            ...data,
            name: combinedName,
            id: generateId(),
            createdAt: mockTimestamp(),
            balance: 0,
            totalPurchases: 0, 
            createdBy: 'current-user',
            createdByName: 'Admin User'
        };
        setCustomers(prev => [...prev, newCustomer]);
    };

    const updateCustomer = (id: string, data: Partial<Customer>) => {
        setCustomers(prev => prev.map(c => {
            if (c.id === id) {
                const updated = { ...c, ...data };
                // Reconstruct name if first/last changed
                if (data.firstName !== undefined || data.lastName !== undefined) {
                    updated.name = `${updated.firstName || c.firstName} ${updated.lastName || c.lastName}`.trim();
                }
                
                // Update updatedAt field
                updated.updatedAt = mockTimestamp(); 
                return updated;
            }
            return c;
        }));
    };

    const deleteCustomer = (id: string) => {
        setCustomers(prev => prev.filter(c => c.id !== id));
    };

    const addSale = (data: Omit<Sale, 'id' | 'date'>) => {
        const newSale: Sale = {
            ...data,
            id: generateId(),
            date: new Date().toISOString(),
        };
        setSales(prev => [...prev, newSale]);
        
        // Update customer balance and totalPurchases
        setCustomers(prev => prev.map(c => 
            c.id === data.customerId 
                ? { ...c, 
                    balance: c.balance + data.amount,
                    totalPurchases: c.totalPurchases + data.amount
                }
                : c
        ));
    };

    const addPayment = (data: Omit<Payment, 'id' | 'date'>) => {
        const newPayment: Payment = {
            ...data,
            id: generateId(),
            date: new Date().toISOString(),
        };
        setPayments(prev => [...prev, newPayment]);

        // Update customer balance (decrease)
        setCustomers(prev => prev.map(c => 
            c.id === data.customerId 
                ? { ...c, balance: c.balance - data.amount }
                : c
        ));
    };

    const addPaymentMethod = (name: string) => {
        const newMethod: PaymentMethod = {
            id: generateId(),
            name,
            isActive: true
        };
        setPaymentMethods(prev => [...prev, newMethod]);
    };

    const togglePaymentMethod = (id: string) => {
        setPaymentMethods(prev => prev.map(m => 
            m.id === id ? { ...m, isActive: !m.isActive } : m
        ));
    };

    return (
        <DataContext.Provider value={{
            customers,
            sales,
            payments,
            paymentMethods,
            addCustomer,
            updateCustomer,
            deleteCustomer,
            addSale,
            addPayment,
            addPaymentMethod,
            togglePaymentMethod
        }}>
            {children}
        </DataContext.Provider>
    );
};

export const useData = () => {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
};