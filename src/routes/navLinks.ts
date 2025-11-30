// src/routes/navLinks.ts
export interface NavLinkItem {
  name: string;
  href: string;
  roles?: ("admin" | "staff" | "user")[];
}

export interface NavCategory {
  title: string;
  items: NavLinkItem[];
  roles?: ("admin" | "staff" | "user")[];
}

export const navCategories: NavCategory[] = [
  {
    title: "Sales",
    items: [
      { name: "Sales", href: "/sales" },
      { name: "Staff Sales", href: "/staff-sales" },
    ],
  },
  {
    title: "Inventory",
    items: [
      { name: "Inventory", href: "/inventory" },
      { name: "Stock Adjustment", href: "/stock-adjustment" },
    ],
  },
  {
    title: "Suppliers",
    items: [
      { name: "Suppliers", href: "/suppliers" },
      { name: "Supplier Ledger", href: "/supplier-ledger" },
    ],
  },
  {
    title: "Finance",
    items: [
      { name: "Bank Deposits", href: "/bank-deposits" },
      { name: "Company Expenses", href: "/company-expenses" },
      { name: "Customer Ledger", href: "/customer-ledger" },
      { name: "Expenses", href: "/expenses" },
      { name: "Payment Methods", href: "/payment-methods" },
      { name: "Payroll", href: "/payroll" },
      { name: "Reports", href: "/reports" },
    ],
  },
  {
    title: "Customers",
    items: [{ name: "Customers", href: "/customers" }],
  },
  {
    title: "Staff",
    items: [{ name: "Staff Dashboard", href: "/dashboard" }],
  },
];
