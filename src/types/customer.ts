// src/types/customer.ts

export interface CustomerPayment {
  id: string;
  amount: number;
  date: number; // Firebase timestamp (seconds)
  notes: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  totalDue: number;
  lastPaymentDate: number | null;
  isFullyPaid: boolean;
  creationDate: number; // Firebase timestamp (seconds)
  createdBy: string;
  createdByName: string;
  payments: CustomerPayment[];
  notes: string;
  // Optional fields that might come from forms
  address?: string;
  account_status?: "Active" | "Inactive" | "Pending";
}

// Type for creating a new customer (without id and some auto-generated fields)
export type NewCustomer = Omit<Customer, 
  'id' | 'creationDate' | 'lastPaymentDate' | 'isFullyPaid' | 'payments' | 'createdByName'
> & {
  // Fields that will be set by the system
  creationDate?: number;
  isFullyPaid?: boolean;
  payments?: CustomerPayment[];
  createdByName?: string;
};

// Type for the form data (simplified version for forms)
export interface CustomerFormData {
  name: string;
  phone: string;
  email: string;
  address?: string;
  account_status?: "Active" | "Inactive" | "Pending";
}

// Type for updating customer
export type CustomerUpdate = Partial<Omit<Customer, 'id' | 'createdBy' | 'creationDate'>>;

// Type for payment recording
export interface PaymentRecord {
  amount: number;
  date: number;
  notes: string;
}

// Type for customer summary/stats
export interface CustomerStats {
  totalCustomers: number;
  totalAmountDue: number;
  customersFullyPaid: number;
  totalPayments: number;
}

// Helper type for sorting
export type CustomerSortKey = 'name' | 'totalDue' | 'lastPaymentDate' | 'creationDate';