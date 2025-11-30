/**
 * Note: This file has been converted from a multi-file Next.js/Shadcn structure
 * to a single, runnable React component by mocking all external dependencies
 * and replacing the API fetch with local data generation.
 */
"use client"

import React, { useState, useEffect, useCallback } from "react"

// --- MOCK EXTERNAL DEPENDENCIES ---

// Mocking useRouter
const useRouter = () => ({
  push: (path: string) => console.log("Simulated Navigation to:", path),
  back: () => console.log("Simulated Navigation back"),
})

// --- MOCK SHADCN/UI COMPONENTS (Styled with Tailwind CSS) ---

interface ButtonProps {
    children: React.ReactNode;
    onClick?: (event?: React.MouseEvent<HTMLButtonElement>) => void;
    variant?: 'ghost' | 'outline' | 'default';
    className?: string;
    disabled?: boolean;
}
const Button: React.FC<ButtonProps> = ({ children, onClick, className, disabled = false, variant = 'default' }) => {
    let baseStyle = "font-medium rounded-lg px-4 py-2 transition duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed text-center";
    
    if (variant === 'ghost') {
        baseStyle = "hover:bg-gray-100 text-blue-600";
    } else if (variant === 'outline') {
        baseStyle = "border border-gray-300 hover:bg-gray-100 text-gray-700";
    } else { // default
        baseStyle = "bg-blue-600 hover:bg-blue-700 text-white shadow-md";
    }

    return <button className={`${baseStyle} ${className || ''}`} onClick={onClick} disabled={disabled}>{children}</button>
}

interface CardProps { children: React.ReactNode; className?: string; }
const Card: React.FC<CardProps> = ({ children, className }) => 
  <div className={`border rounded-xl bg-white shadow-xl ${className || ''}`}>{children}</div>

interface CardHeaderProps { children: React.ReactNode; }
const CardHeader: React.FC<CardHeaderProps> = ({ children }) => <div className="p-6 border-b border-gray-100">{children}</div>

interface CardTitleProps { children: React.ReactNode; }
const CardTitle: React.FC<CardTitleProps> = ({ children }) => <h2 className="text-2xl font-bold text-gray-800">{children}</h2>

interface CardContentProps { children: React.ReactNode; className?: string; }
const CardContent: React.FC<CardContentProps> = ({ children, className }) => <div className={`p-6 ${className || ''}`}>{children}</div>

interface TableProps { children: React.ReactNode; }
const Table: React.FC<TableProps> = ({ children }) => <table className="min-w-full divide-y divide-gray-200">{children}</table>

interface TableHeaderProps { children: React.ReactNode; }
const TableHeader: React.FC<TableHeaderProps> = ({ children }) => <thead>{children}</thead>

interface TableHeadProps { children: React.ReactNode; }
const TableHead: React.FC<TableHeadProps> = ({ children }) => <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">{children}</th>

interface TableRowProps { children: React.ReactNode; key?: React.Key; }
const TableRow: React.FC<TableRowProps> = ({ children }) => <tr className="hover:bg-blue-50 transition-colors duration-150">{children}</tr>

interface TableBodyProps { children: React.ReactNode; }
const TableBody: React.FC<TableBodyProps> = ({ children }) => <tbody className="bg-white divide-y divide-gray-200">{children}</tbody>

interface TableCellProps { 
    children: React.ReactNode; 
    className?: string; 
    colSpan?: number;
}
const TableCell: React.FC<TableCellProps> = ({ children, className, colSpan }) => 
  <td {...(colSpan !== undefined && { colSpan })} className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 ${className || ''}`}>{children}</td>


// --- DATA INTERFACES & MOCK DATA ---

interface StaffSale {
  id: number
  staff_name: string
  item_name: string
  quantity: number
  total_amount: number
  profit: number
  sale_date: string
}

const generateMockStaffSales = (): StaffSale[] => [
    {
        id: 1,
        staff_name: "Jane Doe",
        item_name: "Premium Laptop",
        quantity: 1,
        total_amount: 550000,
        profit: 55000,
        sale_date: new Date(Date.now() - 86400000).toISOString(), // Yesterday
    },
    {
        id: 2,
        staff_name: "John Smith",
        item_name: "Mechanical Keyboard",
        quantity: 5,
        total_amount: 75000,
        profit: 15000,
        sale_date: new Date().toISOString(), // Today
    },
    {
        id: 3,
        staff_name: "Jane Doe",
        item_name: "Wireless Mouse",
        quantity: 10,
        total_amount: 30000,
        profit: 10000,
        sale_date: new Date(Date.now() - 172800000).toISOString(), // Day before
    },
    {
        id: 4,
        staff_name: "Alice Johnson",
        item_name: "Budget Smartphone",
        quantity: 2,
        total_amount: 120000,
        profit: -5000, // Example loss
        sale_date: new Date().toISOString(), // Today
    },
]

// --- MAIN COMPONENT ---

export default function StaffSalesPage() {
  const router = useRouter()
  const [staffSales, setStaffSales] = useState<StaffSale[]>([])
  const [loading, setLoading] = useState(true)

  // Use useCallback for stability
  const fetchStaffSales = useCallback(async () => {
    setLoading(true)
    try {
      // --- LOCAL DATA SIMULATION ---
      // Instead of an external fetch, we load mock data immediately
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
      const data = generateMockStaffSales()
      setStaffSales(data)
      // --- END LOCAL DATA SIMULATION ---
    } catch (err) {
      console.error("[StaffSalesPage] Error fetching staff sales:", err)
      // Optionally, set an error state here
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // Mock check for "currentUser" which would normally redirect
    const user = localStorage.getItem("currentUser")
    if (!user) {
      // router.push("/login") // Commenting out actual redirection for local visibility
      console.log("Simulating user login for component visibility.")
    }
    fetchStaffSales()
  }, [fetchStaffSales]) // Include fetchStaffSales as a dependency

  // Summary calculations
  const totalQuantity = staffSales.reduce((sum, sale) => sum + sale.quantity, 0)
  const totalProfit = staffSales.reduce((sum, sale) => sum + sale.profit, 0)

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800">
      <nav className="border-b bg-white p-4 flex justify-between items-center shadow-md">
        <Button variant="ghost" onClick={() => router.back()} className="text-lg">
          ← Back to Dashboard
        </Button>
        <Button variant="outline" onClick={fetchStaffSales} disabled={loading} className="text-md">
          {loading ? "🔄 Refreshing..." : "Refresh Data"}
        </Button>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-8">Staff Sales Performance</h1>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
            <Card className="p-6 border-b-4 border-blue-500">
                <p className="text-sm font-semibold uppercase text-blue-600">Total Items Sold</p>
                <p className="text-4xl font-extrabold mt-1">{totalQuantity.toLocaleString()}</p>
            </Card>
            <Card 
                className={`p-6 border-b-4 ${
                    totalProfit >= 0 ? 'border-green-500' : 'border-red-500'
                }`}
            >
                <p className="text-sm font-semibold uppercase text-gray-600">Total Profit Generated</p>
                <p 
                    className={`text-4xl font-extrabold mt-1 ${
                        totalProfit >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                >
                    ₦{totalProfit.toLocaleString()}
                </p>
            </Card>
        </div>


        <Card>
          <CardHeader>
            <CardTitle>Staff Sales Records</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Staff Name</TableHead>
                    <TableHead>Item Name</TableHead>
                    <TableHead>Quantity Sold</TableHead>
                    <TableHead>Total Amount</TableHead>
                    <TableHead>Profit</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-gray-500 py-12">
                        <div className="flex justify-center items-center space-x-2">
                            {/* Simple loading spinner */}
                            <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span className="text-lg font-medium">Loading data...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : staffSales.length > 0 ? (
                    staffSales.map((sale) => (
                      <TableRow key={sale.id}>
                        <TableCell className="font-semibold text-blue-800">{sale.staff_name}</TableCell>
                        <TableCell className="text-gray-700">{sale.item_name}</TableCell>
                        <TableCell className="text-center font-mono">{sale.quantity}</TableCell>
                        <TableCell className="font-bold text-gray-900">₦{sale.total_amount.toLocaleString()}</TableCell>
                        <TableCell
                          className={
                            sale.profit >= 0 ? "text-green-600 font-extrabold" : "text-red-600 font-extrabold"
                          }
                        >
                          ₦{sale.profit.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-gray-500">
                            {new Date(sale.sale_date).toLocaleDateString("en-US", { year: 'numeric', month: 'short', day: 'numeric' })}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-gray-500 py-12">
                        No sales data available. Try refreshing.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}