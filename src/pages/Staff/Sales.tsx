/**
 * Note: This file uses TypeScript syntax (.tsx) to resolve implicit 'any' errors.
 * It uses mock components to maintain the single-file immersive requirement,
 * with explicit interfaces defined for all props to satisfy TypeScript.
 *
 * FIX: The 'user' state is now used in the navigation bar to fix TS6133 error.
 */
"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
// Mock hook implementations for standalone component demonstration
// In a full Next.js/React environment, these would be imported normally.
const useRouter = () => ({
  push: (path: string) => console.log("Navigating to:", path),
  back: () => console.log("Navigating back"),
})

interface UseReactToPrintConfig {
    content: () => React.RefObject<HTMLDivElement>['current'] | null;
}
const useReactToPrint = (config: UseReactToPrintConfig) => {
  return () => {
    // Check if content() returns an element before accessing properties
    const element = config.content();
    console.log("Simulating print action for ID:", element?.id || 'Unknown');
  };
};

// --- MOCK UI COMPONENTS (Tailwind styled) ---

interface ButtonProps {
    children: React.ReactNode;
    onClick?: (event?: React.MouseEvent<HTMLButtonElement>) => void;
    variant?: 'ghost' | 'outline' | 'default';
    size?: 'sm' | 'default';
    className?: string;
    disabled?: boolean;
}
const Button: React.FC<ButtonProps> = ({ children, onClick, className, disabled = false }) => 
  <button 
    className={`
      font-semibold rounded-lg transition duration-150 
      ${className || 'px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800'}
    `} 
    onClick={onClick} 
    disabled={disabled}
  >
    {children}
  </button>

interface InputProps {
    type: 'text' | 'number';
    placeholder: string;
    value: string | number;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    className?: string;
}
const Input: React.FC<InputProps> = ({ type, placeholder, value, onChange, className }) => 
  <input 
    type={type} 
    placeholder={placeholder} 
    value={value} 
    onChange={onChange} 
    className={`p-3 border rounded-lg focus:ring-blue-500 focus:border-blue-500 w-full ${className}`} 
  />

interface CardProps {
    children: React.ReactNode;
    className?: string;
}
const Card: React.FC<CardProps> = ({ children, className }) => 
  <div className={`border rounded-xl shadow-lg bg-white ${className}`}>{children}</div>

interface CardHeaderProps { children: React.ReactNode; }
const CardHeader: React.FC<CardHeaderProps> = ({ children }) => <div>{children}</div>

interface CardTitleProps { children: React.ReactNode; }
const CardTitle: React.FC<CardTitleProps> = ({ children }) => <h2 className="text-2xl font-bold text-gray-800">{children}</h2>

interface CardContentProps {
    children: React.ReactNode;
    className?: string;
}
const CardContent: React.FC<CardContentProps> = ({ children, className }) => <div className={className}>{children}</div>

interface TableProps { children: React.ReactNode; }
const Table: React.FC<TableProps> = ({ children }) => <table className="w-full border-collapse">{children}</table>

interface TableBodyProps { children: React.ReactNode; }
const TableBody: React.FC<TableBodyProps> = ({ children }) => <tbody>{children}</tbody>

interface TableCellProps {
    children: React.ReactNode;
    className?: string;
    colSpan?: number;
}
const TableCell: React.FC<TableCellProps> = ({ children, className, colSpan }) => 
  <td {...(colSpan !== undefined && { colSpan })} className={`p-4 border-t border-gray-200 ${className}`}>{children}</td>

interface TableHeadProps { children: React.ReactNode; }
const TableHead: React.FC<TableHeadProps> = ({ children }) => <th className="p-4 text-left font-bold text-gray-600 uppercase bg-gray-100">{children}</th>

interface TableHeaderProps { children: React.ReactNode; }
const TableHeader: React.FC<TableHeaderProps> = ({ children }) => <thead>{children}</thead>

interface TableRowProps { 
    children: React.ReactNode; 
    className?: string;
    key?: React.Key;
}
const TableRow: React.FC<TableRowProps> = ({ children, className }) => <tr className={`hover:bg-gray-50 transition duration-100 ${className}`}>{children}</tr>

// --- DATA INTERFACES ---

interface Sale {
  id: number
  customer_name: string
  total_amount: number
  paid_amount: number
  payment_status: 'outstanding' | 'paid'
  payment_method: 'cash' | 'transfer' | 'check'
}

interface NewSale {
  customer_name: string
  total_amount: number
  paid_amount: number
  payment_status: 'outstanding' | 'paid'
  payment_method: 'cash' | 'transfer' | 'check'
}

const LOCAL_STORAGE_KEY = "sales_data_v1"

// Helper to get the next sequential ID
const getNextId = (currentSales: Sale[]): number => {
  if (currentSales.length === 0) return 1
  const maxId = currentSales.reduce((max, sale) => Math.max(max, sale.id), 0)
  return maxId + 1
}

// Explicitly typing the input change event handler function
const getInputValue = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>): string =>
  e.currentTarget.value

export default function SalesPage() {
  const router = useRouter()
  // Corrected Map type for receiptRefs
  const receiptRefs = useRef<Map<number, HTMLDivElement>>(new Map())

  const [sales, setSales] = useState<Sale[]>([])
  // Typed user state
  const [user, setUser] = useState<null | { id: number, name: string }>(null) // State is now used in JSX to fix TS6133
  const [newSale, setNewSale] = useState<NewSale>({
    customer_name: "",
    total_amount: 0,
    paid_amount: 0,
    payment_status: "outstanding",
    payment_method: "cash",
  })
  const [printId, setPrintId] = useState<number | null>(null)

  // --- LOCAL STORAGE FUNCTIONS ---

  const loadSalesFromLocal = useCallback((): Sale[] => {
    try {
      const data = localStorage.getItem(LOCAL_STORAGE_KEY)
      if (data) {
        return JSON.parse(data) as Sale[]
      }
    } catch (error) {
      console.error("Error loading sales from local storage:", error)
    }
    return []
  }, [])

  const saveSalesToLocal = useCallback((currentSales: Sale[]): void => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(currentSales))
      setSales(currentSales) // Update state after successful save
    } catch (error) {
      console.error("Error saving sales to local storage:", error)
    }
  }, [])

  // --- EFFECTS ---

  useEffect(() => {
    // 1. Check user login (simulated check)
    const currentUserStr = localStorage.getItem("currentUser")
    if (!currentUserStr) {
      // router.push("/login") // Commenting out to allow component to run standalone
      console.log("No user found, simulating anonymous login.")
      // Simulate setting a user for demonstration
      setUser({ id: 99, name: "Admin User" })
    } else {
      try {
          // Explicitly cast the parsed user object
          setUser(JSON.parse(currentUserStr) as { id: number, name: string })
      } catch (e) {
          console.error("Failed to parse currentUser from localStorage", e)
          // router.push("/login") // Commenting out to allow component to run standalone
      }
    }
    
    // 2. Load sales data
    const initialSales = loadSalesFromLocal()
    setSales(initialSales)
  }, [loadSalesFromLocal, router])

  // --- HANDLERS ---

  const handleAddSale = (): void => {
    // Basic validation
    if (!newSale.customer_name || newSale.total_amount <= 0) {
      console.log("Validation failed: Customer name or total amount invalid.")
      return
    }

    // 1. Create the new Sale object with a unique ID
    const currentSales = loadSalesFromLocal()
    const newId = getNextId(currentSales)

    const newSaleRecord: Sale = {
      id: newId,
      customer_name: newSale.customer_name,
      total_amount: newSale.total_amount,
      paid_amount: newSale.paid_amount,
      payment_status: newSale.paid_amount >= newSale.total_amount ? "paid" : "outstanding",
      payment_method: newSale.payment_method,
    }

    // 2. Update the array and save
    const updatedSales = [...currentSales, newSaleRecord]
    saveSalesToLocal(updatedSales)

    // 3. Reset form
    setNewSale({
      customer_name: "",
      total_amount: 0,
      paid_amount: 0,
      payment_status: "outstanding",
      payment_method: "cash",
    })
  }

  // Handle print setup (using the provided hook)
  const handlePrint = useReactToPrint({
    // Content function now explicitly returns the correct type
    content: () => (printId !== null ? receiptRefs.current.get(printId) ?? null : null),
  })

  // Print Receipt Component (hidden for printing purposes)
  const Receipt: React.FC<{ sale: Sale }> = ({ sale }) => (
    <div
      id={`receipt-${sale.id}`}
      ref={(el: HTMLDivElement | null) => {
        if (el) receiptRefs.current.set(sale.id, el)
      }}
      // Important: Use position: absolute and visibility: hidden for printing
      style={{ 
        position: "absolute", 
        visibility: "hidden", 
        top: "-9999px", 
        left: "-9999px", 
        padding: '16px', 
        width: '300px', 
        border: '1px dashed #333',
        backgroundColor: '#fff',
        fontFamily: 'monospace'
      }}
    >
      <div id={sale.id.toString()}>
        <h2 style={{fontSize: '18px', marginBottom: '12px', fontWeight: 'bold', borderBottom: '1px solid #ccc', paddingBottom: '8px'}}>
          Sales Receipt (ID: {sale.id})
        </h2>
        <p style={{marginBottom: '4px'}}>Date: {new Date().toLocaleDateString()}</p>
        <p style={{marginBottom: '4px'}}>Customer: {sale.customer_name}</p>
        <hr style={{margin: '12px 0', borderTop: '1px dashed #999'}} />
        <p style={{marginBottom: '4px'}}>Total: <strong style={{float: 'right'}}>₦{sale.total_amount.toFixed(2)}</strong></p>
        <p style={{marginBottom: '4px'}}>Paid: <strong style={{float: 'right'}}>₦{sale.paid_amount.toFixed(2)}</strong></p>
        <p style={{marginBottom: '4px'}}>Status: <strong style={{float: 'right'}}>{sale.payment_status.toUpperCase()}</strong></p>
        <p style={{marginBottom: '4px'}}>Method: <strong style={{float: 'right'}}>{sale.payment_method.toUpperCase()}</strong></p>
        <hr style={{margin: '12px 0', borderTop: '1px dashed #999'}} />
        <p style={{fontSize: '12px', textAlign: 'center', fontWeight: 'bold'}}>Thank you for your business!</p>
      </div>
    </div>
  )

  // Summary calculations
  const totalSales = sales.reduce((sum, sale) => sum + sale.total_amount, 0)
  const totalPaid = sales.reduce((sum, sale) => sum + sale.paid_amount, 0)
  const totalOutstanding = totalSales - totalPaid

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800">
      <nav className="flex items-center justify-between border-b bg-white px-6 py-4 shadow-sm">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="text-blue-600 hover:text-blue-800 transition duration-150 p-2"
        >
          ← Back to Dashboard
        </Button>
        {/* FIX: Used the 'user' state here to resolve the TS6133 warning */}
        {user && (
          <p className="text-lg font-medium text-gray-700 hidden sm:block">
            Welcome, <span className="text-blue-600 font-bold">{user.name}</span>
          </p>
        )}
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-extrabold text-gray-800 mb-8">Sales & POS Dashboard</h1>

        {/* Summary Section */}
        <Card className="mb-8 p-6 border-2 border-gray-100">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 text-center">
            {/* Total Sales */}
            <div className="p-5 bg-green-50 rounded-xl shadow-lg hover:shadow-xl transition duration-300 border-b-4 border-green-500">
              <p className="text-sm font-medium text-green-700 uppercase tracking-wider">Total Sales</p>
              <p className="text-4xl font-extrabold text-green-600 mt-2">₦{totalSales.toFixed(2)}</p>
            </div>
            {/* Total Paid */}
            <div className="p-5 bg-blue-50 rounded-xl shadow-lg hover:shadow-xl transition duration-300 border-b-4 border-blue-500">
              <p className="text-sm font-medium text-blue-700 uppercase tracking-wider">Total Paid</p>
              <p className="text-4xl font-extrabold text-blue-600 mt-2">₦{totalPaid.toFixed(2)}</p>
            </div>
            {/* Total Outstanding */}
            <div className="p-5 bg-red-50 rounded-xl shadow-lg hover:shadow-xl transition duration-300 border-b-4 border-red-500">
              <p className="text-sm font-medium text-red-700 uppercase tracking-wider">Outstanding Balance</p>
              <p className="text-4xl font-extrabold text-red-600 mt-2">₦{totalOutstanding.toFixed(2)}</p>
            </div>
          </div>
        </Card>

        {/* New Sale Form */}
        <Card className="mb-10 p-6">
          <CardHeader>
            <CardTitle>Record New Sale</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Input
                type="text"
                placeholder="Customer Name"
                value={newSale.customer_name}
                onChange={(e) =>
                  setNewSale({ ...newSale, customer_name: getInputValue(e) })
                }
                className="w-full"
              />
              <Input
                type="number"
                placeholder="Total Amount (₦)"
                value={newSale.total_amount === 0 ? "" : newSale.total_amount}
                onChange={(e) => {
                  const total = Number(getInputValue(e as React.ChangeEvent<HTMLInputElement>)) || 0
                  setNewSale((prevSale) => ({
                    ...prevSale,
                    total_amount: total,
                    payment_status:
                      prevSale.paid_amount >= total ? "paid" : "outstanding",
                  }))
                }}
                className="w-full"
              />
              <Input
                type="number"
                placeholder="Amount Paid (₦)"
                value={newSale.paid_amount === 0 ? "" : newSale.paid_amount}
                onChange={(e) => {
                  const paid = Number(getInputValue(e as React.ChangeEvent<HTMLInputElement>)) || 0
                  setNewSale((prevSale) => ({
                    ...prevSale,
                    paid_amount: paid,
                    payment_status:
                      paid >= prevSale.total_amount ? "paid" : "outstanding",
                  }))
                }}
                className="w-full"
              />
              <select
                className="border rounded-lg px-3 py-3 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm w-full"
                value={newSale.payment_method}
                onChange={(e) =>
                  setNewSale({ ...newSale, payment_method: getInputValue(e as React.ChangeEvent<HTMLSelectElement>) as 'cash' | 'transfer' | 'check' })
                }
              >
                <option value="cash">Cash</option>
                <option value="transfer">Transfer</option>
                <option value="check">Check</option>
              </select>
            </div>
            <Button 
              onClick={handleAddSale} 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-3 rounded-xl shadow-lg transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!newSale.customer_name || newSale.total_amount <= 0 || newSale.paid_amount > newSale.total_amount}
            >
              <span className="text-lg">💰 Record New Transaction</span>
            </Button>
          </CardContent>
        </Card>

        {/* Sales Table */}
        <Card className="p-6">
          <CardHeader>
            <CardTitle>Detailed Sales Records</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="overflow-x-auto rounded-lg shadow-inner">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 border-b-2 border-gray-200">
                    <TableHead>ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Total (₦)</TableHead>
                    <TableHead>Paid (₦)</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sales.length > 0 ? (
                    sales.slice().sort((a, b) => b.id - a.id).map((sale) => (
                      <TableRow
                        key={sale.id}
                        className={sale.payment_status === "outstanding" ? "bg-red-50 hover:bg-red-100" : "bg-white"}
                      >
                        <TableCell className="text-gray-500 font-mono">{sale.id}</TableCell>
                        <TableCell className="font-medium">{sale.customer_name}</TableCell>
                        <TableCell className="font-semibold text-gray-700">₦{sale.total_amount.toFixed(2)}</TableCell>
                        <TableCell className="text-blue-600 font-medium">₦{sale.paid_amount.toFixed(2)}</TableCell>
                        <TableCell className="text-gray-600 capitalize">{sale.payment_method}</TableCell>
                        <TableCell
                          className={`font-bold uppercase ${
                            sale.payment_status === "outstanding" ? "text-red-700" : "text-green-600"
                          }`}
                        >
                          {sale.payment_status}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setPrintId(sale.id)
                              handlePrint()
                            }}
                            className="text-sm bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-md px-3 py-1 shadow-md"
                          >
                            🖨️ Print Receipt
                          </Button>
                          <Receipt sale={sale} />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      {/* colSpan is now explicitly provided here to cover all 7 columns */}
                      <TableCell colSpan={7} className="text-center text-gray-500 py-6">
                        No sales recorded yet. Start by adding a new sale above!
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