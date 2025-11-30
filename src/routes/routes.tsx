// src/routes/routes.tsx
import AdminDashboard from "../pages/AdminDashboard";
import StaffDashboard from "../pages/StaffDashboard";

// Admin pages
import AdminBankDepositsPage from "../pages/Admin/BankDeposit";
import AdminCompanyExpensesPage from "../pages/Admin/CompanyExpenses";
import AdminCustomerLedgerPage from "../pages/Admin/CustomerLedger";
import AdminCustomersPage from "../pages/Admin/Customers";
import AdminDueSalesPage from "../pages/Admin/DueSalesPage";
import AdminInventoryPage from "../pages/Admin/Inventory";
import AdminPaymentMethodsPage from "../pages/Admin/PaymentMethods";
import AdminPayrollPage from "../pages/Admin/Payroll";
import AdminReportsPage from "../pages/Admin/Reports";
import AdminSalesPage from "../pages/Admin/Sales";
import AdminStockAdjustmentPage from "../pages/Admin/StockAdjustment";
import AdminStockMovementPage from "../pages/Admin/StockMovement";
import AdminSupplierLedgerPage from "../pages/Admin/SupplierLedger";
import AdminSuppliersPage from "../pages/Admin/Supplier";
import AdminStockPage from "../pages/Admin/Stock";

// Staff pages
import StaffBankDepositsPage from "../pages/Staff/BankDeposit";
import StaffCompanyExpensesPage from "../pages/Staff/CompanyExpenses";
import StaffCustomerLedgerPage from "../pages/Staff/CustomerLedger";
import StaffCustomersPage from "../pages/Staff/Customers";
import StaffDueSalesPage from "../pages/Staff/DueSalesPage";
import StaffInventoryPage from "../pages/Staff/Inventory";
import StaffPaymentMethodsPage from "../pages/Staff/PaymentMethods";
import StaffPayrollPage from "../pages/Staff/Payroll";
import StaffReportsPage from "../pages/Staff/Reports";
import StaffSalesPage from "../pages/Staff/Sales";
import StaffStockAdjustmentPage from "../pages/Staff/StockAdjustment";
import StaffStockMovementPage from "../pages/Staff/StockMovement";
import StaffSupplierLedgerPage from "../pages/Staff/SupplierLedger";
import StaffSuppliersPage from "../pages/Staff/Supplier";
import StaffStockPage from "../pages/Staff/Stock";

interface RouteItem {
  path: string;
  component: React.FC;
  allowedRoles: ("admin" | "staff")[];
}

export const routeConfig: RouteItem[] = [
  // Admin
  { path: "/admin", component: AdminDashboard, allowedRoles: ["admin"] },
  { path: "/admin/bank-deposits", component: AdminBankDepositsPage, allowedRoles: ["admin"] },
  { path: "/admin/company-expenses", component: AdminCompanyExpensesPage, allowedRoles: ["admin"] },
  { path: "/admin/customer-ledger", component: AdminCustomerLedgerPage, allowedRoles: ["admin"] },
  { path: "/admin/customers", component: AdminCustomersPage, allowedRoles: ["admin"] },
  { path: "/admin/due-sales", component: AdminDueSalesPage, allowedRoles: ["admin"] },
  { path: "/admin/inventory", component: AdminInventoryPage, allowedRoles: ["admin"] },
  { path: "/admin/stock", component: AdminStockPage, allowedRoles: ["admin"] },
  { path: "/admin/payment-methods", component: AdminPaymentMethodsPage, allowedRoles: ["admin"] },
  { path: "/admin/payroll", component: AdminPayrollPage, allowedRoles: ["admin"] },
  { path: "/admin/reports", component: AdminReportsPage, allowedRoles: ["admin"] },
  { path: "/admin/sales", component: AdminSalesPage, allowedRoles: ["admin"] },
  { path: "/admin/stock-adjustment", component: AdminStockAdjustmentPage, allowedRoles: ["admin"] },
  { path: "/admin/stock-movement", component: AdminStockMovementPage, allowedRoles: ["admin"] },
  { path: "/admin/supplier-ledger", component: AdminSupplierLedgerPage, allowedRoles: ["admin"] },
  { path: "/admin/suppliers", component: AdminSuppliersPage, allowedRoles: ["admin"] },

  // Staff
  { path: "/staff", component: StaffDashboard, allowedRoles: ["staff"] },
  { path: "/staff/bank-deposits", component: StaffBankDepositsPage, allowedRoles: ["staff"] },
  { path: "/staff/company-expenses", component: StaffCompanyExpensesPage, allowedRoles: ["staff"] },
  { path: "/staff/customer-ledger", component: StaffCustomerLedgerPage, allowedRoles: ["staff"] },
  { path: "/staff/customers", component: StaffCustomersPage, allowedRoles: ["staff"] },
  { path: "/staff/due-sales", component: StaffDueSalesPage, allowedRoles: ["staff"] },
  { path: "/staff/inventory", component: StaffInventoryPage, allowedRoles: ["staff"] },
  { path: "/staff/stock", component: StaffStockPage, allowedRoles: ["staff"] },
  { path: "/staff/payment-methods", component: StaffPaymentMethodsPage, allowedRoles: ["staff"] },
  { path: "/staff/payroll", component: StaffPayrollPage, allowedRoles: ["staff"] },
  { path: "/staff/reports", component: StaffReportsPage, allowedRoles: ["staff"] },
  { path: "/staff/sales", component: StaffSalesPage, allowedRoles: ["staff"] },
  { path: "/staff/stock-adjustment", component: StaffStockAdjustmentPage, allowedRoles: ["staff"] },
  { path: "/staff/stock-movement", component: StaffStockMovementPage, allowedRoles: ["staff"] },
  { path: "/staff/supplier-ledger", component: StaffSupplierLedgerPage, allowedRoles: ["staff"] },
  { path: "/staff/suppliers", component: StaffSuppliersPage, allowedRoles: ["staff"] },
];
