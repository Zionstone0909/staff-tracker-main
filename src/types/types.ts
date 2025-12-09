import { Timestamp } from "firebase/firestore";

/* ------------------------- Inventory Types ------------------------- */
export interface InventoryItem {
  id: string;
  name: string;
  sku?: string;
  units_available: number;
  unit_price: number;
  low_stock_threshold?: number;
}

/* ------------------------- Sales Types ------------------------- */
export interface SaleRecord {
  id: string;
  customerId: string;
  customerName: string;
  totalAmount: number;
  paymentMethod: string;
  date: Timestamp; // Firestore date
}

/* ------------------------- Customer Types ------------------------- */
export interface Customer {
  id: string;
  name: string;            // Display name
  fullName?: string;       // Optional full name
  phone?: string;
  email?: string;
  address?: string;
  totalDue: number;        // Amount customer is owing
  createdAt?: Timestamp;
  createdBy?: string;
}

/* ------------------------- Ledger Types ------------------------- */
export interface LedgerEntry {
  id: string;
  customerId: string;
  date: string;            // Use ISO YYYY-MM-DD for filtering
  type: "credit" | "debit";
  amount: number;
  description: string;
  createdAt: number;       // UNIX timestamp
  createdBy?: string;
}

export interface CustomerBalance {
  customerId: string;
  customerName: string;
  customerPhone?: string;
  totalDebit: number;      // Loans or sales (they owe)
  totalCredit: number;     // Payments they made
  balance: number;         // debit - credit
  lastTransactionDate: string | null;
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

/* ------------------------- Activity Log Types ------------------------- */
export interface ActivityItem {
  id: string;
  description: string;
  timestamp: Date;
  type: string; // e.g. "sale", "update", "inventory", "customer"
}