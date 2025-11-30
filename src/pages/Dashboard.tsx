// src/pages/Dashboard.tsx
import { Navigate } from "react-router-dom";
import { useAuth } from "@/store/auth-store";
import AdminDashboard  from "./AdminDashboard";
import StaffDashboard from "./StaffDashboard";
import { Link } from "react-router-dom";

// Navigation links
const navLinks = [
  { name: "Bank Deposits", href: "/bank-deposits" },
  { name: "Company Expenses", href: "/company-expenses" },
  { name: "Customer Ledger", href: "/customer-ledger" },
  { name: "Customers", href: "/customers" },
  { name: "Expenses", href: "/expenses" },
  { name: "Inventory", href: "/inventory" },
  { name: "Payment Methods", href: "/payment-methods" },
  { name: "Payroll", href: "/payroll" },
  { name: "Reports", href: "/reports" },
  { name: "Sales", href: "/sales" },
  { name: "Staff Sales", href: "/staff-sales" },
  { name: "Stock Adjustment", href: "/stock-adjustment" },
  { name: "Stock Movement", href: "/stock-movement" },
  { name: "Supplier Ledger", href: "/supplier-ledger" },
  { name: "Suppliers", href: "/suppliers" },
];

// Make sure the User type includes "staff"


export function DashboardPage() {
  const { user } = useAuth();

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Render the appropriate dashboard
  let dashboard: React.ReactNode;
  if (user.role === "admin") {
    dashboard = <AdminDashboard />;
  } else if (user.role === "staff") {
    dashboard = <StaffDashboard />;
  } else {
    dashboard = (
      <div>
        <h1 className="text-xl font-bold text-red-600">Unauthorized Role</h1>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      {/* Optional top navigation */}
      <nav className="flex flex-wrap gap-3 mb-4">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            to={link.href}
            className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200 transition"
          >
            {link.name}
          </Link>
        ))}
      </nav>

      {/* Render selected dashboard */}
      {dashboard}
    </div>
  );
}
