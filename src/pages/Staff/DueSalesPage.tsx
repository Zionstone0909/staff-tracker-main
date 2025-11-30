// src/pages/Staff/DueSalesPage.tsx
"use client";

import React, { FC, useEffect, useMemo, useState } from "react";

/** ---------------- Types ---------------- */
export interface Product {
  _id: number;
  name: string;
  stock?: number;
  price?: number;
  category?: string;
}

export interface Sale {
  _id: string;
  customerName: string;
  product: Product;
  quantity: number;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  saleDate: string;
  status: "Pending" | "Completed";
}

/** ------------- Inline Components ------------- */
interface CardProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
}
const Card: FC<CardProps> = ({ children, style }) => (
  <div
    style={{
      borderRadius: 12,
      border: "1px solid #ccc",
      background: "#fff",
      padding: 16,
      boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
      maxWidth: 1100,
      margin: "20px auto",
      ...style,
    }}
  >
    {children}
  </div>
);
const CardHeader: FC<CardProps> = ({ children, style }) => (
  <div style={{ padding: 12, borderBottom: "1px solid #eee", ...style }}>{children}</div>
);
const CardTitle: FC<CardProps> = ({ children, style }) => (
  <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, ...style }}>{children}</h2>
);
const CardContent: FC<CardProps> = ({ children, style }) => (
  <div style={{ padding: 12, ...style }}>{children}</div>
);

const Table: FC<CardProps> = ({ children, style }) => (
  <table style={{ width: "100%", borderCollapse: "collapse", ...style }}>{children}</table>
);
const TableRow: FC<CardProps & { style?: React.CSSProperties }> = ({ children, style }) => (
  <tr style={{ ...style }}>{children}</tr>
);
const TableHeadCell: FC<{ children: React.ReactNode; onClick?: () => void; style?: React.CSSProperties }> = ({
  children,
  onClick,
  style,
}) => (
  <th
    onClick={onClick}
    style={{
      padding: "10px 8px",
      border: "1px solid #cfcfcf",
      textAlign: "left",
      background: "#f5f7fb",
      cursor: onClick ? "pointer" : "default",
      userSelect: "none",
      ...style,
    }}
  >
    {children}
  </th>
);
const TableCell: FC<{ children: React.ReactNode; colSpan?: number; style?: React.CSSProperties }> = ({
  children,
  colSpan,
  style,
}) => (
  <td colSpan={colSpan} style={{ padding: "10px 8px", border: "1px solid #e5e7eb", ...style }}>
    {children}
  </td>
);

const Button: FC<{
  onClick?: (e?: any) => void;
  children: React.ReactNode;
  disabled?: boolean;
  style?: React.CSSProperties;
  type?: "button" | "submit" | "reset";
}> = ({ onClick, children, disabled, style, type = "button" }) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled}
    style={{
      padding: "8px 12px",
      borderRadius: 6,
      border: "none",
      background: disabled ? "#bdbdbd" : "#2563eb",
      color: "#fff",
      cursor: disabled ? "not-allowed" : "pointer",
      ...style,
    }}
  >
    {children}
  </button>
);

const Input: FC<{
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  style?: React.CSSProperties;
  type?: string;
  min?: number;
}> = ({ value, onChange, placeholder, style, type = "text", min }) => (
  <input
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    type={type}
    min={min}
    style={{
      padding: 8,
      borderRadius: 6,
      border: "1px solid #ccc",
      width: "100%",
      ...style,
    }}
  />
);

/** ------------- Utility helpers ------------- */
const generateId = () => Math.random().toString(36).slice(2, 9) + "-" + Date.now().toString(36);
const formatCurrency = (n: number) => `৳${Number(n).toLocaleString()}`;

/** ------------- Component Props ------------- */
interface DueSalesPageProps {
  dueSales?: Sale[];
  currentUserRole?: "Admin" | "Staff";
  apiBase?: string;
}

/** ------------- Main Component ------------- */
export default function DueSalesPage({
  dueSales = [],
  currentUserRole = "Staff",
  apiBase = "/api/sales",
}: DueSalesPageProps) {
  const [sourceData, setSourceData] = useState<Sale[]>(dueSales);
  const [loadedFromApi, setLoadedFromApi] = useState<boolean>(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<keyof Sale | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const blankForm: Partial<Sale> = {
    _id: "",
    customerName: "",
    product: { _id: 0, name: "" },
    quantity: 1,
    totalAmount: 0,
    paidAmount: 0,
    dueAmount: 0,
    saleDate: new Date().toISOString(),
    status: "Pending",
  };
  const [form, setForm] = useState<Partial<Sale>>(blankForm);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editTargetId, setEditTargetId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  /** Fetch API data if needed */
  useEffect(() => {
    let mounted = true;
    async function fetchSales() {
      if (!dueSales.length) {
        try {
          const resp = await fetch(apiBase);
          if (!mounted) return;
          if (resp.ok) {
            const data: Sale[] = await resp.json();
            const normalized = data.map((d) => ({ ...d, _id: d._id ?? generateId() }));
            setSourceData(normalized);
            setLoadedFromApi(true);
          } else setSourceData([]);
        } catch {
          setSourceData([]);
        }
      }
    }
    fetchSales();
    return () => {
      mounted = false;
    };
  }, [dueSales, apiBase]);

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
        if (typeof valA === "number" && typeof valB === "number") return sortOrder === "asc" ? valA - valB : valB - valA;
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

  const tryApi = async (method: "POST" | "PUT" | "DELETE", url: string, body?: any) => {
    try {
      const resp = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
      if (!resp.ok) return { ok: false, status: resp.status, body: null };
      const json = await resp.json().catch(() => null);
      return { ok: true, status: resp.status, body: json };
    } catch {
      return { ok: false, status: 0, body: null };
    }
  };

  const handleAdd = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!form.customerName || !form.product?.name) return alert("Customer and product required.");

    const newSale: Sale = {
      _id: generateId(),
      customerName: String(form.customerName),
      product: { _id: Number(form.product?._id ?? 0), name: String(form.product?.name ?? "") },
      quantity: Number(form.quantity ?? 1),
      totalAmount: Number(form.totalAmount ?? 0),
      paidAmount: Number(form.paidAmount ?? 0),
      dueAmount: Number((form.totalAmount ?? 0) - (form.paidAmount ?? 0)),
      saleDate: form.saleDate ? new Date(form.saleDate).toISOString() : new Date().toISOString(),
      status: (form.status ?? "Pending") as "Pending" | "Completed",
    };

    const result = await tryApi("POST", apiBase, newSale);
    setSourceData(prev => [result.ok ? result.body ?? newSale : newSale, ...prev]);
    setForm(blankForm);
    setCurrentPage(1);
    alert("Added sale (local or via API).");
  };

  const openEdit = (sale: Sale) => {
    setEditTargetId(sale._id);
    setForm({ ...sale, product: { ...sale.product } });
    setIsEditOpen(true);
  };

  const handleSaveEdit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editTargetId) return;

    const updated: Sale = {
      _id: editTargetId,
      customerName: String(form.customerName ?? ""),
      product: { _id: Number(form.product?._id ?? 0), name: String(form.product?.name ?? "") },
      quantity: Number(form.quantity ?? 1),
      totalAmount: Number(form.totalAmount ?? 0),
      paidAmount: Number(form.paidAmount ?? 0),
      dueAmount: Number((form.totalAmount ?? 0) - (form.paidAmount ?? 0)),
      saleDate: form.saleDate ? new Date(form.saleDate).toISOString() : new Date().toISOString(),
      status: (form.status ?? "Pending") as "Pending" | "Completed",
    };

    const result = await tryApi("PUT", `${apiBase}/${editTargetId}`, updated);
    setSourceData(prev => prev.map((p) => (p._id === editTargetId ? (result.ok ? result.body ?? updated : updated) : p)));

    setIsEditOpen(false);
    setEditTargetId(null);
    setForm(blankForm);
    alert("Saved changes (local or via API).");
  };

  const confirmDelete = (id: string) => setConfirmDeleteId(id);
  const handleDelete = async () => {
    if (!confirmDeleteId) return;
    await tryApi("DELETE", `${apiBase}/${confirmDeleteId}`);
    setSourceData(prev => prev.filter((s) => s._id !== confirmDeleteId));
    setConfirmDeleteId(null);
    alert("Deleted (local or via API).");
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
        <div style={{ fontSize: 13, color: "#666" }}>{loadedFromApi ? "Loaded from API" : "Local mode"}</div>
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
            </div>
          </div>

          {/* Add/Edit Form */}
          {isEditOpen && (
            <div style={{ border: "1px solid #dfe7ff", background: "#fbfdff", padding: 12, borderRadius: 10 }}>
              <form onSubmit={(e) => editTargetId ? handleSaveEdit(e) : handleAdd(e)} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
                {/* Customer */}
                <div style={{ gridColumn: "span 1" }}>
                  <label style={{ fontSize: 12 }}>Customer</label>
                  <Input value={form.customerName ?? ""} onChange={(e) => setForm(prev => ({ ...prev, customerName: e.target.value }))} placeholder="Customer name" />
                </div>

                {/* Product */}
                <div>
                  <label style={{ fontSize: 12 }}>Product</label>
                  <Input value={form.product?.name ?? ""} onChange={(e) => setForm(prev => ({ ...prev, product: { ...(prev.product ?? { _id: 0 }), name: e.target.value } }))} placeholder="Product name" />
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

                {/* Sale Date */}
                <div>
                  <label style={{ fontSize: 12 }}>Sale Date</label>
                  <Input
                    type="datetime-local"
                    value={form.saleDate ? new Date(form.saleDate).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16)}
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
                  <Button type="submit">{editTargetId ? "Save Changes" : "Add Sale"}</Button>
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
                {paginatedSales.length ? (
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
                      <TableCell>{sale.status}</TableCell>
                      <TableCell style={{ display: "flex", gap: 4 }}>
                        <Button onClick={() => openEdit(sale)} style={{ background: "#2563eb" }}>Edit</Button>
                        <Button onClick={() => confirmDelete(sale._id)} style={{ background: "#dc2626" }}>Delete</Button>
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
            <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", display: "flex", justifyContent: "center", alignItems: "center" }}>
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
