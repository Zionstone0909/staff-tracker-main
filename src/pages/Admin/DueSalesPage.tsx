// src/pages/DueSalesPage.tsx
"use client";
import React, { FC, useEffect, useMemo, useState, ChangeEvent } from "react";
import { CSSProperties } from 'react';
// IMPORT FIREBASE/FIRESTORE FUNCTIONS
import { 
    collection, 
    getDocs, 
    query, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    doc, 
    writeBatch,
    orderBy, 
} from 'firebase/firestore';
// Assuming your firebase.tsx is in the project root or accessible via this path
import { db } from '../../firebase'; 

/** ---------------- Types ---------------- */
export interface Product {
    _id: number;
    name: string;
    stock?: number;
    price?: number;
    category?: string;
}
export interface Sale {
    _id: string; // Document ID
    customerName: string;
    customer_id: string; // Added for Firestore linking
    product: Product;
    product_id: number; // Added for Firestore linking
    quantity: number;
    totalAmount: number;
    paidAmount: number;
    dueAmount: number;
    saleDate: string; // ISO String
    status: "Pending" | "Completed";
}

// --- MOCK DATA FOR SIMULATING CUSTOMER/PRODUCT SELECTION (Replace with real Firestore fetches if available) ---
interface MockCustomer { id: string; name: string; balance: number; }
interface MockProduct { _id: number; name: string; price: number; stock: number; }

const MOCK_CUSTOMERS: MockCustomer[] = [
  { id: "cust_123", name: "Rifat Hasan", balance: 5500.00 },
  { id: "cust_456", name: "Jahid Khan", balance: 0.00 },
  { id: "cust_789", name: "Nabila Akhter", balance: 12000.00 },
];
const MOCK_PRODUCTS: MockProduct[] = [
  { _id: 1, name: "Smart Watch X", price: 15000, stock: 50 },
  { _id: 2, name: "Wireless Headphones", price: 4500, stock: 120 },
  { _id: 3, name: "Power Bank 10K", price: 1200, stock: 300 },
];

const SALES_COLLECTION = "dueSales";
const CUSTOMERS_COLLECTION = "customers";
const PRODUCTS_COLLECTION = "products";


/** ------------- Utility helpers ------------- */
const generateId = () => Math.random().toString(36).slice(2, 9) + "-" + Date.now().toString(36);
const formatCurrency = (n: number) => ` ৳ ${Number(n).toLocaleString()}`;


/** ------------- Inline Components ------------- */
interface CardProps { children: React.ReactNode; style?: React.CSSProperties; }
const Card: FC<CardProps> = ({ children, style }) => (<div style={{borderRadius: 12, border: "1px solid #ccc", background: "#fff", padding: 16, boxShadow: "0 2px 6px rgba(0,0,0,0.08)", maxWidth: 1100, margin: "20px auto", ...style,}}>{children}</div>);
const CardHeader: FC<CardProps> = ({ children, style }) => (<div style={{ padding: 12, borderBottom: "1px solid #eee", ...style }}>{children}</div>);
const CardTitle: FC<CardProps> = ({ children, style }) => (<h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, ...style }}>{children}</h2>);
const CardContent: FC<CardProps> = ({ children, style }) => (<div style={{ padding: 12, ...style }}>{children}</div>);
const Table: FC<CardProps> = ({ children, style }) => (<table style={{ width: "100%", borderCollapse: "collapse", ...style }}>{children}</table>);
const TableRow: FC<CardProps & { style?: React.CSSProperties }> = ({ children, style }) => (<tr style={{ ...style }}>{children}</tr>);
const TableHeadCell: FC<{ children: React.ReactNode; onClick?: () => void; style?: React.CSSProperties }> = ({ children, onClick, style, }) => (<th onClick={onClick} style={{ padding: "10px 8px", border: "1px solid #cfcfcf", textAlign: "left", background: "#f5f7fb", cursor: onClick ? "pointer" : "default", userSelect: "none", ...style, }}>{children}</th>);
const TableCell: FC<{ children: React.ReactNode; colSpan?: number; style?: React.CSSProperties }> = ({ children, colSpan, style }) => (<td colSpan={colSpan} style={{ padding: "10px 8px", border: "1px solid #e5e7eb", ...style }}>{children}</td>);
const Button: FC<{ onClick?: (e?: any) => void; children: React.ReactNode; disabled?: boolean; style?: React.CSSProperties; type?: "button" | "submit" | "reset"; }> = ({ onClick, children, disabled, style, type = "button" }) => (<button type={type} onClick={onClick} disabled={disabled} style={{ padding: "8px 12px", borderRadius: 6, border: "none", background: disabled ? "#bdbdbd" : "#2563eb", color: "#fff", cursor: disabled ? "not-allowed" : "pointer", ...style, }}>{children}</button>);

// 🚩 CORRECTED INPUT COMPONENT
const Input: FC<{
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  style?: CSSProperties;
  type?: string;
  min?: number;
  readOnly?: boolean; // ✅ FIX: Added readOnly to component props
}> = ({ value, onChange, placeholder, style, type = "text", min, readOnly }) => ( // ✅ FIX: Destructured readOnly
  <input
    value={value}
    // Set onChange to undefined if readOnly is true to prevent execution
    onChange={readOnly ? (() => {}) as any : onChange} 
    placeholder={placeholder}
    type={type}
    min={min}
    readOnly={readOnly} // ✅ FIX: Applied readOnly attribute
    style={{
      padding: 8,
      borderRadius: 6,
      border: "1px solid #ccc",
      width: "100%",
      background: readOnly ? '#f0f0f0' : undefined,
      ...style,
    }}
  />
);
// END CORRECTED INPUT COMPONENT

const Select: FC<{ value: string | number; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void; options: { value: string | number; label: string }[]; style?: React.CSSProperties; placeholder?: string; disabled?: boolean; }> = ({ value, onChange, options, style, placeholder, disabled = false }) => (<select value={value} onChange={onChange} disabled={disabled} style={{ padding: 8, borderRadius: 6, border: "1px solid #ccc", width: "100%", height: 36, ...style, }}>{placeholder && <option value="" disabled>{placeholder}</option>}{options.map((option) => (<option key={option.value} value={option.value}>{option.label}</option>))}</select>);


/** ------------- Main Component ------------- */
export default function DueSalesPage({
currentUserRole = "Staff",
}: { dueSales?: Sale[]; currentUserRole?: "Admin" | "Staff"; }) {
    const [sourceData, setSourceData] = useState<Sale[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [customers] = useState<MockCustomer[]>(MOCK_CUSTOMERS);
    const [products] = useState<MockProduct[]>(MOCK_PRODUCTS);

    const [searchTerm, setSearchTerm] = useState("");
    const [sortField, setSortField] = useState<keyof Sale | null>("saleDate");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 6;
    
    const blankForm: Partial<Sale> = {
        _id: "",
        customer_id: "",
        customerName: "",
        product: { _id: 0, name: "" },
        product_id: 0,
        quantity: 1,
        totalAmount: 0,
        paidAmount: 0,
        dueAmount: 0,
        saleDate: new Date().toISOString().slice(0, 16),
        status: "Pending",
    };

    const [form, setForm] = useState<Partial<Sale>>(blankForm);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editTargetId, setEditTargetId] = useState<string | null>(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

    /** Fetch Firestore Data */
    useEffect(() => {
        const fetchSales = async () => {
            setIsLoading(true);
            try {
                // Fetch sales ordered by date
                const q = query(collection(db, SALES_COLLECTION), orderBy('saleDate', 'desc'));
                const querySnapshot = await getDocs(q);
                
                const fetchedSales: Sale[] = querySnapshot.docs.map(doc => ({
                    _id: doc.id,
                    ...doc.data() as Omit<Sale, '_id'>
                }));
                
                setSourceData(fetchedSales);
            } catch (error) {
                console.error("Error fetching due sales:", error);
                // In a production app, handle authentication/permission errors
            } finally {
                setIsLoading(false);
            }
        };

        fetchSales(); 

    }, []);

    /** Filtering & Sorting */
    const filteredSales = useMemo(() => {
        const s = searchTerm.trim().toLowerCase();
        let data = [...sourceData];
        if (s)
            data = data.filter(
                (item) =>
                item._id.toLowerCase().includes(s) ||
                item.customerName.toLowerCase().includes(s) ||
                item.product?.name.toLowerCase().includes(s)
            );
        if (sortField)
            data.sort((a, b) => {
                const valA = a[sortField] ?? "";
                const valB = b[sortField] ?? "";
                if (typeof valA === "number" && typeof valB === "number") return sortOrder === "asc" ?
                valA - valB : valB - valA;
                return sortOrder === "asc" ? String(valA).localeCompare(String(valB)) : String(valB).localeCompare(String(valA));
            });
        return data;
    }, [sourceData, searchTerm, sortField, sortOrder]);


    const totalPages = Math.max(1, Math.ceil(filteredSales.length / itemsPerPage));
    const paginatedSales = filteredSales.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    /** Handlers */
    const handleSort = (field: keyof Sale) => {
        if (sortField === field) setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
        else {
            setSortField(field);
            setSortOrder("asc");
        }
    };

    // Firestore: handleAdd uses Firestore addDoc and Batch
    const handleAdd = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        
        const selectedCustomer = customers.find(c => c.id === form.customer_id);
        const selectedProduct = products.find(p => p._id === form.product_id);

        if (!selectedCustomer || !selectedProduct) return alert("Customer and product selection required.");

        const newSaleData = {
            customer_id: selectedCustomer.id,
            customerName: selectedCustomer.name,
            product_id: selectedProduct._id,
            product: { _id: selectedProduct._id, name: selectedProduct.name },
            quantity: Number(form.quantity ?? 1),
            totalAmount: Number(form.totalAmount ?? 0),
            paidAmount: Number(form.paidAmount ?? 0),
            dueAmount: Number((form.totalAmount ?? 0) - (form.paidAmount ?? 0)),
            saleDate: new Date(form.saleDate!).toISOString(),
            status: (form.status ?? "Pending") as "Pending" | "Completed",
        };

        try {
            const batch = writeBatch(db);
            const saleRef = doc(collection(db, SALES_COLLECTION));
            
            // 1. Add new Sale document
            batch.set(saleRef, newSaleData);
            
            // 2. Update Customer Balance (customer.tsx integration - Placeholder)
            // const customerRef = doc(db, CUSTOMERS_COLLECTION, selectedCustomer.id);
            // batch.update(customerRef, { /* update balance field here */ }); 

            // 3. Update Product Stock (Sales.tsx inventory integration - Placeholder)
            // const productRef = doc(db, PRODUCTS_COLLECTION, String(selectedProduct._id));
            // batch.update(productRef, { /* update stock field here */ }); 

            await batch.commit();

            const newSale: Sale = { _id: saleRef.id, ...newSaleData };
            setSourceData((prev) => [newSale, ...prev]);
            setForm(blankForm);
            setCurrentPage(1);
            alert("Sale recorded successfully.");

        } catch (error) {
            console.error("Error adding sale:", error);
            alert("Failed to add sale. Check console.");
        }
    };

    // openEdit to map customer name/product name back to IDs
    const openEdit = (sale: Sale) => {
        setEditTargetId(sale._id);
        // Map customer name/product name back to ID for the Select component
        const customerId = customers.find(c => c.name === sale.customerName)?.id ?? sale.customer_id ?? "";
        const productId = sale.product?._id ?? sale.product_id ?? 0;

        setForm({ 
            ...sale, 
            customer_id: customerId, 
            product_id: productId,
            saleDate: new Date(sale.saleDate).toISOString().slice(0, 16),
        }); 
        setIsEditOpen(true);
    };

    // Firestore: handleSaveEdit uses Firestore updateDoc
    const handleSaveEdit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!editTargetId) return;

        const selectedCustomer = customers.find(c => c.id === form.customer_id);
        const selectedProduct = products.find(p => p._id === form.product_id);
        
        if (!selectedCustomer || !selectedProduct) return alert("Customer and product selection required.");

        const updatedData = {
            customer_id: selectedCustomer.id,
            customerName: selectedCustomer.name,
            product_id: selectedProduct._id,
            product: { _id: selectedProduct._id, name: selectedProduct.name },
            quantity: Number(form.quantity ?? 1),
            totalAmount: Number(form.totalAmount ?? 0),
            paidAmount: Number(form.paidAmount ?? 0),
            dueAmount: Number((form.totalAmount ?? 0) - (form.paidAmount ?? 0)),
            saleDate: new Date(form.saleDate!).toISOString(),
            status: (form.status ?? "Pending") as "Pending" | "Completed",
        };

        const saleRef = doc(db, SALES_COLLECTION, editTargetId);

        try {
            // Include logic for customer balance/product stock reversal/update here.
            
            await updateDoc(saleRef, updatedData);

            const updatedSale: Sale = { _id: editTargetId, ...updatedData };
            setSourceData((prev) => prev.map((p) => (p._id === editTargetId ? updatedSale : p)));
            setIsEditOpen(false);
            setEditTargetId(null);
            setForm(blankForm);
            alert("Sale updated successfully.");
        } catch (error) {
            console.error("Error updating sale:", error);
            alert("Failed to update sale. Check console.");
        }
    };

    const confirmDelete = (id: string) => setConfirmDeleteId(id);
    
    // Firestore: handleDelete uses Firestore deleteDoc
    const handleDelete = async () => {
        if (!confirmDeleteId) return;

        const saleRef = doc(db, SALES_COLLECTION, confirmDeleteId);
        try {
            await deleteDoc(saleRef);
            setSourceData((prev) => prev.filter((s) => s._id !== confirmDeleteId));
            setConfirmDeleteId(null);
            alert("Sale deleted successfully.");
        } catch (error) {
            console.error("Error deleting sale:", error);
            alert("Failed to delete sale. Check console.");
        }
    };

    const updateFormNumber = (key: keyof Sale, value: number | string) => {
        setForm((prev) => {
            const copy = { ...prev } as any;
            copy[key] = Number(value);
            copy.dueAmount = Number((copy.totalAmount ?? 0) - (copy.paidAmount ?? 0));
            return copy;
        });
    };

    /** -------------- Render -------------- */
    return (
        <Card>
            <CardHeader style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <CardTitle>Due Sales - {currentUserRole}</CardTitle>
                <div style={{ fontSize: 13, color: "#666" }}>Data Source: **Firebase/Firestore**</div>
            </CardHeader>
            <CardContent>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {/* Search + Add */}
                    <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                        <div style={{ minWidth: 260, maxWidth: 520, width: "100%" }}>
                            <Input value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} placeholder="Search by ID, customer, or product..." />
                        </div>
                        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                            <Button onClick={() => { setForm(blankForm); setIsEditOpen(true); setEditTargetId(null); }}>+ Add Sale</Button>
                            <Button onClick={() => alert("Simulating Export to CSV/PDF...")} style={{ background: "#6b7280" }}>Export</Button>
                        </div>
                    </div>
                    {/* Add/Edit Form */}
                    {isEditOpen && (
                        <div style={{ border: "1px solid #dfe7ff", background: "#fbfdff", padding: 12, borderRadius: 10 }}>
                            <form onSubmit={(e) => editTargetId ? handleSaveEdit(e) : handleAdd(e)} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
                                {/* Customer */}
                                <div>
                                    <label style={{ fontSize: 12 }}>Customer</label>
                                    <Select
                                        value={form.customer_id ?? ""}
                                        onChange={(e) => setForm(prev => ({ ...prev, customer_id: e.target.value as string }))}
                                        options={customers.map(c => ({ value: c.id, label: `${c.name} (Due: ${formatCurrency(c.balance)})` }))}
                                        placeholder="Select Customer"
                                    />
                                </div>
                                {/* Product */}
                                <div>
                                    <label style={{ fontSize: 12 }}>Product</label>
                                    <Select
                                        value={form.product_id ?? ""}
                                        onChange={(e) => {
                                            const productId = Number(e.target.value);
                                            const selectedProduct = products.find(p => p._id === productId);
                                            setForm(prev => ({ 
                                                ...prev, 
                                                product_id: productId,
                                                product: selectedProduct ? { _id: selectedProduct._id, name: selectedProduct.name } : { _id: 0, name: "" } 
                                            }));
                                        }}
                                        options={products.map(p => ({ value: p._id, label: `${p.name} (Stock: ${p.stock})` }))}
                                        placeholder="Select Product"
                                    />
                                </div>
                                {/* Quantity */}
                                <div>
                                    <label style={{ fontSize: 12 }}>Quantity</label>
                                    <Input type="number" min={1} value={String(form.quantity ?? 1)} onChange={(e) => updateFormNumber("quantity", e.target.value)} />
                                </div>
                                {/* Total Amount */}
                                <div>
                                    <label style={{ fontSize: 12 }}>Total Amount</label>
                                    <Input type="number" min={0} value={String(form.totalAmount ?? 0)} onChange={(e) => updateFormNumber("totalAmount", e.target.value)} />
                                </div>
                                {/* Paid Amount */}
                                <div>
                                    <label style={{ fontSize: 12 }}>Paid Amount</label>
                                    <Input type="number" min={0} value={String(form.paidAmount ?? 0)} onChange={(e) => updateFormNumber("paidAmount", e.target.value)} />
                                </div>
                                {/* Due Amount (Read-only) */}
                                <div>
                                    <label style={{ fontSize: 12 }}>Due Amount</label>
                                    {/* The corrected Input component allows readOnly={true} */}
                                    <Input 
                                        value={formatCurrency(form.dueAmount ?? 0)} 
                                        onChange={() => {}} // dummy handler for readOnly field
                                        readOnly={true} // Fixed TypeScript error here
                                        style={{ background: '#f0f0f0' }} 
                                    />
                                </div>
                                {/* Sale Date */}
                                <div>
                                    <label style={{ fontSize: 12 }}>Sale Date</label>
                                    <Input
                                        type="datetime-local"
                                        value={form.saleDate ? form.saleDate.slice(0, 16) : new Date().toISOString().slice(0, 16)}
                                        onChange={(e) => setForm(prev => ({ ...prev, saleDate: new Date(e.target.value).toISOString() }))}
                                    />
                                </div>
                                {/* Status */}
                                <div>
                                    <label style={{ fontSize: 12 }}>Status</label>
                                    <select value={form.status ?? "Pending"} onChange={(e) => setForm(prev => ({ ...prev, status: e.target.value as "Pending" | "Completed" }))} style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ccc" }}>
                                        <option value="Pending">Pending</option>
                                        <option value="Completed">Completed</option>
                                    </select>
                                </div>
                                {/* Buttons */}
                                <div style={{ display: "flex", gap: 8, alignItems: "center", gridColumn: "1 / -1", marginTop: 6 }}>
                                    <Button type="submit" disabled={currentUserRole === "Staff" && !!editTargetId}>{editTargetId ? "Save Changes" : "Add Sale"}</Button>
                                    <Button onClick={() => { setIsEditOpen(false); setForm(blankForm); setEditTargetId(null); }} style={{ background: "#6b7280" }}>Cancel</Button>
                                </div>
                            </form>
                        </div>
                    )}
                    {/* Table */}
                    <div style={{ border: "1px solid #d1d5db", borderRadius: 12, overflowX: "auto" }}>
                        <Table style={{ minWidth: 900 }}>
                            <thead>
                                <TableRow>
                                    <TableHeadCell>#</TableHeadCell>
                                    <TableHeadCell onClick={() => handleSort("customerName")}>Customer</TableHeadCell>
                                    <TableHeadCell onClick={() => handleSort("product")}>Product</TableHeadCell>
                                    <TableHeadCell onClick={() => handleSort("quantity")}>Qty</TableHeadCell>
                                    <TableHeadCell onClick={() => handleSort("totalAmount")}>Total</TableHeadCell>
                                    <TableHeadCell onClick={() => handleSort("paidAmount")}>Paid</TableHeadCell>
                                    <TableHeadCell onClick={() => handleSort("dueAmount")}>Due</TableHeadCell>
                                    <TableHeadCell onClick={() => handleSort("saleDate")}>Date</TableHeadCell>
                                    <TableHeadCell>Status</TableHeadCell>
                                    <TableHeadCell>Action</TableHeadCell>
                                </TableRow>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={10} style={{ textAlign: "center", padding: 20 }}>Loading sales data from Firestore...</TableCell>
                                    </TableRow>
                                ) : paginatedSales.length ? (
                                    paginatedSales.map((sale, idx) => (
                                        <TableRow key={sale._id}>
                                            <TableCell>{(currentPage - 1) * itemsPerPage + idx + 1}</TableCell>
                                            <TableCell>{sale.customerName}</TableCell>
                                            <TableCell>{sale.product?.name ?? "-"}</TableCell>
                                            <TableCell>{sale.quantity}</TableCell>
                                            <TableCell>{formatCurrency(sale.totalAmount)}</TableCell>
                                            <TableCell>{formatCurrency(sale.paidAmount)}</TableCell>
                                            <TableCell>{formatCurrency(sale.dueAmount)}</TableCell>
                                            <TableCell>{new Date(sale.saleDate).toLocaleString()}</TableCell>
                                            {/* Status Styling */}
                                            <TableCell>
                                                <span style={{
                                                    padding: '4px 8px',
                                                    borderRadius: 4,
                                                    fontWeight: 'bold',
                                                    fontSize: 12,
                                                    color: sale.status === "Pending" ? "#9a3412" : "#166534",
                                                    background: sale.status === "Pending" ? "#fef3c7" : "#dcfce7",
                                                    border: sale.status === "Pending" ? "1px solid #fcd34d" : "1px solid #86efac",
                                                }}>{sale.status}</span>
                                            </TableCell>
                                            <TableCell style={{ display: "flex", gap: 4 }}>
                                                {/* Role-Based Access */}
                                                <Button 
                                                    onClick={() => openEdit(sale)} 
                                                    disabled={currentUserRole === "Staff"} 
                                                    style={{ background: currentUserRole === "Staff" ? "#bdbdbd" : "#2563eb" }}
                                                >Edit</Button>
                                                <Button 
                                                    onClick={() => confirmDelete(sale._id)} 
                                                    disabled={currentUserRole === "Staff"} 
                                                    style={{ background: currentUserRole === "Staff" ? "#bdbdbd" : "#dc2626" }}
                                                >Delete</Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={10} style={{ textAlign: "center", padding: 20 }}>No due sales found.</TableCell>
                                    </TableRow>
                                )}
                            </tbody>
                        </Table>
                    </div>
                    {/* Pagination */}
                    <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 12 }}>
                        <Button disabled={currentPage === 1} onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}>Prev</Button>
                        <span style={{ alignSelf: "center" }}>{currentPage} / {totalPages}</span>
                        <Button disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}>Next</Button>
                    </div>
                    {/* Confirm Delete Modal */}
                    {confirmDeleteId && (
                        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 100 }}>
                            <div style={{ background: "#fff", padding: 20, borderRadius: 12, minWidth: 320 }}>
                                <p>Are you sure you want to delete this sale?</p>
                                <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 12 }}>
                                    <Button onClick={handleDelete} style={{ background: "#dc2626" }}>Yes, Delete</Button>
                                    <Button onClick={() => setConfirmDeleteId(null)} style={{ background: "#6b7280" }}>Cancel</Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}