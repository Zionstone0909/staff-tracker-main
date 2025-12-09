// src/components/ui/CustomerForm.tsx

"use client"

import { useState } from "react"
// NOTE: Assuming '@/components/ui/input' and '@/components/ui/button' exist.
// Replaced with generic HTML elements and basic inline styles for compilation safety.

// ----------------------------------------------------------------------
// FIX: Type definitions were missing. Define them here locally, 
// but they should be moved to a shared file like "@/types/customer.ts"
// or exported from "@/pages/Staff/Customers" for a clean import.
// ----------------------------------------------------------------------

interface Payment {
    date: number; // Unix timestamp
    amount: number;
    // ... add other payment fields (e.g., method, refId)
}

// Define the comprehensive customer type based on fields used in the form
interface CustomerRecord {
    id: string; 
    name: string;
    email: string;
    phone: string;
    totalDue: number; 
    lastPaymentDate: number | null; 
    isFullyPaid: boolean; 
    creationDate: number; 
    createdBy: string; // Staff ID
    createdByName: string; // Staff name
    payments: Payment[]; 
    notes: string;
}

// REMOVED THE FAULTY IMPORT LINE: 
// import { CustomerRecord } from "@/pages/Staff/Customers"

// ----------------------------------------------------------------------

interface CustomerFormProps {
    onAddCustomer: (customer: Omit<CustomerRecord, "id">) => Promise<void>
}

export default function CustomerForm({ onAddCustomer }: CustomerFormProps) {
    // Initial state matching the CustomerRecord structure
    const [newCustomer, setNewCustomer] = useState<Omit<CustomerRecord, "id">>({
        name: "",
        email: "",
        phone: "",
        totalDue: 0,
        lastPaymentDate: null,
        isFullyPaid: true,
        creationDate: Date.now() / 1000,
        createdBy: "",
        createdByName: "",
        payments: [],
        notes: "",
    })

    const [submitting, setSubmitting] = useState(false)

    // Improved handleChange to handle type changes more robustly
    const handleChange = (field: keyof Omit<CustomerRecord, "id">, value: string | number) => {
        let parsedValue: string | number | boolean | null | Payment[] = value;

        // Special handling for number fields that come from string inputs
        if (field === 'totalDue') {
            parsedValue = parseFloat(value as string) || 0;
        }

        setNewCustomer(prev => ({ ...prev, [field]: parsedValue }))
    }

    const handleSubmit = async () => {
        if (!newCustomer.name || !newCustomer.phone) {
            alert("Name and phone are required")
            return
        }

        setSubmitting(true)
        try {
            await onAddCustomer(newCustomer)
        } catch (error) {
            console.error("Error adding customer:", error);
            alert("Failed to add customer.");
        }


        // Reset the form
        setNewCustomer({
            name: "",
            email: "",
            phone: "",
            totalDue: 0,
            lastPaymentDate: null,
            isFullyPaid: true,
            creationDate: Date.now() / 1000,
            createdBy: "",
            createdByName: "",
            payments: [],
            notes: "",
        })

        setSubmitting(false)
    }

    // Using generic HTML tags and inline styles to replace Tailwind/UI components
    const inputStyle: React.CSSProperties = { 
        padding: '0.5rem', 
        border: '1px solid #ccc', 
        borderRadius: '4px', 
        width: '100%' 
    };
    
    const buttonStyle: React.CSSProperties = {
        padding: '0.75rem', 
        backgroundColor: submitting ? '#9ca3af' : '#4f46e5', 
        color: 'white', 
        borderRadius: '4px', 
        width: '100%', 
        fontWeight: 600,
        cursor: submitting ? 'not-allowed' : 'pointer',
        border: 'none',
        transition: 'background-color 0.2s'
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                <input
                    type="text"
                    placeholder="Customer Name"
                    value={newCustomer.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    style={inputStyle}
                />
                <input
                    type="tel"
                    placeholder="Phone"
                    value={newCustomer.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    style={inputStyle}
                />
                <input
                    type="email"
                    placeholder="Email"
                    value={newCustomer.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    style={inputStyle}
                />
                <input
                    type="number"
                    placeholder="Total Due"
                    value={newCustomer.totalDue}
                    onChange={(e) => handleChange("totalDue", e.target.value)}
                    style={inputStyle}
                />
                <input
                    type="text"
                    placeholder="Notes"
                    value={newCustomer.notes}
                    onChange={(e) => handleChange("notes", e.target.value)}
                    style={inputStyle}
                />
            </div>
            <button onClick={handleSubmit} style={buttonStyle} disabled={submitting}>
                {submitting ? "Adding..." : "Add Customer"}
            </button>
        </div>
    )
}