import { Timestamp } from "firebase/firestore";

/* ------------------------- Utility Types ------------------------- */

export type LegacyPaymentMethod = "Cash" | "Transfer" | "POS" | "Others"; // Renamed existing type to avoid conflict

export type ViewState = 'DASHBOARD' | 'CUSTOMERS' | 'SALES' | 'LEDGER' | 'PAYMETHOD' | 'REPORTS' | 'STOCK_MOVEMENT'; // Added STOCK_MOVEMENT for completeness

/* ------------------------- Inventory Types ------------------------- */

export interface InventoryItem {
    id: string;
    name: string;
    sku?: string;
    units_available: number;
    unit_price: number;
    low_stock_threshold?: number;
}

export interface CartItem extends InventoryItem {
    quantity: number;
}

/* ------------------------- Customer Types (CONSOLIDATED) ------------------------- */

export interface Customer {
    id: string;
    firstName: string; // New: Added from requested interface
    lastName: string; // New: Added from requested interface
    name: string; // Combined name (Kept existing use for display simplicity)
    email: string; // New: Kept existing, made non-optional as per new interface
    phone: string;
    address: string;
    notes: string; // New: Added from requested interface
    balance: number; // New: Total amount owing (replaces totalDue, but totalDue semantics apply)
    totalPurchases: number; // Kept existing field
    
    // Audit Fields - Using Timestamp for Firebase consistency
    createdAt: Timestamp; // Changed from string/number to Timestamp
    createdBy?: string;
    createdByName?: string; // New: Added from context
    updatedAt?: Timestamp; // Changed from string/number to Timestamp
}

/* ------------------------- Sales Types ------------------------- */

export interface SaleItem {
    itemId: string;
    itemName: string;
    quantity: number;
    price: number; // Price per unit at the time of sale
    sku?: string;
}

// SaleRecord is detailed record used for internal transaction
export interface SaleRecord {
    id?: string;
    saleId: string;
    customerId: string;
    customerName: string;
    items: SaleItem[];
    subtotal: number;
    discount: number;
    total: number;
    paid: number;
    balance: number;
    excess: number;
    paymentMethod: LegacyPaymentMethod; // Using the existing utility type
    timestamp: Timestamp;
    userId: string;
    userEmail?: string;
    userRole?: string;
    userName: string;
}

// Sale is a simpler interface used in the new structure (likely for ledger/reports)
export interface Sale { // NEW: Added from requested interface
    id: string;
    customerId: string;
    amount: number;
    description: string;
    date: string; // Using string (YYYY-MM-DD) for report/ledger consistency
    status: 'Completed' | 'Pending' | 'Cancelled';
}

/* ------------------------- Payment Method Types (CONSOLIDATED) ------------------------- */

// This is the structure for the document stored in the 'payment-methods' collection
export interface PaymentMethod { // NEW: Added from requested interface, replacing type alias
    id: string;
    name: string; // e.g., "Credit Card", "Cash", "Bank Transfer"
    isActive: boolean;
}

// Note: The previous 'LegacyPaymentMethod' type alias is kept for backwards compatibility in SaleRecord.

/* ------------------------- Payment Types (NEW) ------------------------- */

export interface Payment { // NEW: Added from requested interface
    id: string;
    customerId: string;
    amount: number;
    methodId: string;
    date: string; // Using string (YYYY-MM-DD) for report/ledger consistency
    reference?: string;
}

/* ------------------------- Ledger & Transaction Types (CONSOLIDATED) ------------------------- */

// NEW: Interface for detailed ledger transactions, often tied to a sale or payment
export interface LedgerTransaction {
    transactionType: 'sale' | 'payment' | 'credit' | 'debit' | 'edit_correction';
    saleId?: string; // Optional, links to SaleRecord
    paymentId?: string; // Optional, links to Payment record
    amount: number; // Total amount of the sale/payment/credit/debit
    paid: number; // Amount paid during a sale (for transactionType: 'sale')
    balance: number; // Remaining balance (owing) after this transaction
    excess: number; // Excess payment after this transaction
    items?: SaleItem[]; // Items involved in the sale (for transactionType: 'sale')
    date: Timestamp; // Date of the transaction (Firestore Timestamp)
    timestamp: any; // Server Timestamp for ordering (use any since it's a special type)
    userId: string;
    status: 'paid' | 'owing' | 'overpaid' | 'correction' | 'N/A';
    note?: string;
}

export interface LedgerEntry { // Existing detailed entry
    id: string;
    customerId: string;
    date: string; 
    type: "credit" | "debit";
    amount: number;
    description: string;
    createdAt: number; 
    createdBy?: string;
}

export interface Transaction { // NEW: Added from requested interface (Likely a simplified Ledger view)
    id: string;
    date: string;
    type: 'Sale' | 'Payment';
    amount: number;
    description: string;
}

export interface CustomerBalance { // Existing balance summary
    customerId: string;
    customerName: string;
    customerPhone?: string;
    totalDebit: number;
    totalCredit: number;
    balance: number;
    lastTransactionDate: string | null;
}

/* ------------------------- History & Activity Log Types ------------------------- */

export interface HistoryLog {
    id?: string;
    action: "edit" | "delete";
    saleId: string;
    previousData?: SaleRecord;
    updatedData?: SaleRecord;
    performedBy: string;
    role: "admin";
    timestamp: Timestamp;
}

export interface ActivityItem {
    id: string;
    description: string;
    timestamp: Date;
    type: string;
}

/* ------------------------- Dashboard Types ------------------------- */

export interface DashboardStats {
    totalRevenue: number;
    todayRevenue: number;
    totalInventoryValue: number;
    totalSales: number; 
    todaySales: number; 
    totalCustomers: number;
    customersWithDebt: number;
    totalOutstanding: number; 
    lowStockCount: number;
}