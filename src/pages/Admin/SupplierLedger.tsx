import React, { useState, useEffect, ChangeEvent } from "react";
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  where,
  getDocs,
  Timestamp
} from "firebase/firestore";
import {
  auth,
  db,
  SUPPLIER_LEDGER_COLLECTION_SEGMENTS,
  SUPPLIERS_COLLECTION_SEGMENTS,
  INVENTORY_COLLECTION_SEGMENTS,
  getRole
} from "../../firebase";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  CheckCircle, 
  ArrowLeft, 
  Download, 
  Printer, 
  Calendar,
  Check
} from "lucide-react";

// --- Type Definitions ---
interface Supplier {
  id: string; // Firestore ID
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
}

interface SupplierLedgerEntry {
  id: string;
  supplier_id: string;
  supplier_name: string;
  goods_received: string;
  quantity: number;
  unit_price: number;
  amount_owed: number;
  amount_paid: number;
  transaction_date: string; // ISO String YYYY-MM-DD
  created_at?: Timestamp;
}

interface FormState {
  supplier_id: string;
  supplier_name: string;
  goods_received: string;
  quantity: number | "";
  unit_price: number | "";
  amount_owed: number | "";
  amount_paid: number | "";
  transaction_date: string;
}

const initialFormState: FormState = {
  supplier_id: "",
  supplier_name: "",
  goods_received: "",
  quantity: "",
  unit_price: "",
  amount_owed: "",
  amount_paid: "",
  transaction_date: new Date().toISOString().substring(0, 10),
};

const SupplierLedger: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [entries, setEntries] = useState<SupplierLedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [formState, setFormState] = useState<FormState>(initialFormState);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [currentEntryId, setCurrentEntryId] = useState<string | null>(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [error, setError] = useState<string>("");

  // Auth Check
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      const role = getRole(user);
      if (role !== "admin") {
        // Redirect logic - normally you'd use react-router navigate here
        // For now, we'll show a basic alert or assume parent handles routing
        // window.location.href = "/login"; 
      }
    });
    return () => unsubscribe();
  }, []);

  // Fetch Suppliers
  useEffect(() => {
    const q = query(collection(db, ...SUPPLIERS_COLLECTION_SEGMENTS), orderBy("name"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedSuppliers = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Supplier[];
      setSuppliers(fetchedSuppliers);
    });
    return () => unsubscribe();
  }, []);

  // Fetch Ledger Entries
  useEffect(() => {
    const q = query(
      collection(db, ...SUPPLIER_LEDGER_COLLECTION_SEGMENTS),
      orderBy("transaction_date", "desc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedEntries = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as SupplierLedgerEntry[];
      setEntries(fetchedEntries);
      setLoading(false);
    }, (err) => {
      console.error("Error fetching ledger:", err);
      setError("Failed to load ledger data.");
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Auto-hide messages
  useEffect(() => {
    if (successMessage || error) {
      const timer = setTimeout(() => {
        setSuccessMessage("");
        setError("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, error]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    if (name === "supplier_id") {
      const selectedSupplier = suppliers.find((s) => s.id === value);
      setFormState((prev) => ({
        ...prev,
        supplier_id: value,
        supplier_name: selectedSupplier ? selectedSupplier.name : "",
      }));
    } else if (name === "quantity" || name === "unit_price") {
      setFormState((prev) => {
        const updatedForm = {
          ...prev,
          [name]: parseFloat(value) || "",
        };
        // Auto-calculate amount_owed
        if (updatedForm.quantity !== "" && updatedForm.unit_price !== "") {
          updatedForm.amount_owed =
            Number(updatedForm.quantity) * Number(updatedForm.unit_price);
        }
        return updatedForm;
      });
    } else {
      setFormState((prev) => ({
        ...prev,
        [name]: type === "number" ? parseFloat(value) || "" : value,
      }));
    }
  };

  // Inventory Integration
  const updateInventory = async (
    goodsName: string,
    quantity: number,
    unitPrice: number,
    supplierId: string,
    supplierName: string
  ) => {
    try {
      const inventoryRef = collection(db, ...INVENTORY_COLLECTION_SEGMENTS);
      // Simple check by name (case insensitive ideally, but strict here for Firestore)
      const q = query(inventoryRef, where("name", "==", goodsName));
      const querySnapshot = await getDocs(q);

      const now = new Date().toISOString();

      if (!querySnapshot.empty) {
        // Update existing item
        const itemDoc = querySnapshot.docs[0];
        const itemData = itemDoc.data();
        const newQuantity = (itemData.units_available || 0) + quantity;
        
        // Append supplier if not present
        const currentSuppliers = itemData.suppliers || [];
        const supplierExists = currentSuppliers.some((s: any) => s.id === supplierId);
        const updatedSuppliers = supplierExists 
            ? currentSuppliers 
            : [...currentSuppliers, { id: supplierId, name: supplierName }];

        await updateDoc(doc(db, ...INVENTORY_COLLECTION_SEGMENTS, itemDoc.id), {
          units_available: newQuantity,
          total_value: unitPrice * newQuantity,
          last_updated: now,
          suppliers: updatedSuppliers
        });
      } else {
        // Create new item
        await addDoc(inventoryRef, {
          name: goodsName,
          sku: `SKU-${Date.now().toString().slice(-6)}`,
          category: "General",
          unit_price: unitPrice,
          units_available: quantity,
          total_value: unitPrice * quantity,
          suppliers: [{ id: supplierId, name: supplierName }],
          description: "Added from Supplier Ledger",
          date_added: now,
          last_updated: now,
          low_stock_threshold: 5,
        });
      }
    } catch (err) {
      console.error("Error updating inventory:", err);
      // We don't block the UI flow for this, but log it
    }
  };

  const handleAddOrUpdateEntry = async () => {
    if (
      !formState.supplier_id ||
      !formState.goods_received ||
      formState.quantity === "" ||
      formState.unit_price === ""
    ) {
      setError("Please fill in Supplier, Goods Received, Quantity, and Unit Price.");
      return;
    }

    setLoading(true);
    try {
      const entryData = {
        supplier_id: formState.supplier_id,
        supplier_name: formState.supplier_name,
        goods_received: formState.goods_received,
        quantity: Number(formState.quantity),
        unit_price: Number(formState.unit_price),
        amount_owed:
          Number(formState.amount_owed) ||
          Number(formState.quantity) * Number(formState.unit_price),
        amount_paid: Number(formState.amount_paid) || 0,
        transaction_date: formState.transaction_date,
        updated_at: Timestamp.now(),
      };

      if (isEditing && currentEntryId) {
        await updateDoc(
          doc(db, ...SUPPLIER_LEDGER_COLLECTION_SEGMENTS, currentEntryId),
          entryData
        );
        setSuccessMessage("Entry updated successfully.");
      } else {
        await addDoc(
          collection(db, ...SUPPLIER_LEDGER_COLLECTION_SEGMENTS),
          { ...entryData, created_at: Timestamp.now() }
        );
        
        // Only update inventory on NEW entries to avoid double counting edits
        await updateInventory(
          formState.goods_received,
          Number(formState.quantity),
          Number(formState.unit_price),
          formState.supplier_id,
          formState.supplier_name
        );
        
        setSuccessMessage("Ledger entry added and inventory updated.");
      }

      setFormState(initialFormState);
      setIsEditing(false);
      setCurrentEntryId(null);
    } catch (err) {
      console.error(err);
      setError("Operation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this entry?")) return;
    try {
      await deleteDoc(doc(db, ...SUPPLIER_LEDGER_COLLECTION_SEGMENTS, id));
      setSuccessMessage("Entry deleted successfully.");
    } catch (err) {
      console.error(err);
      setError("Failed to delete entry.");
    }
  };

  const handleMarkAsPaid = async (entry: SupplierLedgerEntry) => {
    if (!window.confirm("Are you sure you want to mark this transaction as fully paid? This will update the 'Amount Paid' to match the total amount owed.")) return;
    try {
      await updateDoc(doc(db, ...SUPPLIER_LEDGER_COLLECTION_SEGMENTS, entry.id), {
        amount_paid: entry.amount_owed,
        updated_at: Timestamp.now(),
      });
      setSuccessMessage("Transaction marked as fully paid.");
    } catch (err) {
      console.error(err);
      setError("Failed to update payment status.");
    }
  };

  const handleEdit = (entry: SupplierLedgerEntry) => {
    setFormState({
      supplier_id: entry.supplier_id,
      supplier_name: entry.supplier_name,
      goods_received: entry.goods_received,
      quantity: entry.quantity,
      unit_price: entry.unit_price,
      amount_owed: entry.amount_owed,
      amount_paid: entry.amount_paid,
      transaction_date: entry.transaction_date,
    });
    setCurrentEntryId(entry.id);
    setIsEditing(true);
    // Scroll to top
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleClearForm = () => {
    setFormState(initialFormState);
    setIsEditing(false);
    setCurrentEntryId(null);
  };

  // Filter Logic
  const filteredEntries = entries.filter((entry) => {
    const matchesSearch =
      entry.supplier_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.goods_received.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesDate = true;
    if (dateFrom) matchesDate = matchesDate && entry.transaction_date >= dateFrom;
    if (dateTo) matchesDate = matchesDate && entry.transaction_date <= dateTo;

    return matchesSearch && matchesDate;
  });

  // Calculate Totals
  const totalOwed = filteredEntries.reduce((sum, e) => sum + (e.amount_owed || 0), 0);
  const totalPaid = filteredEntries.reduce((sum, e) => sum + (e.amount_paid || 0), 0);
  const balance = totalOwed - totalPaid;

  // Export to CSV
  const handleExport = () => {
    const headers = ["Date,Supplier,Goods,Quantity,Unit Price,Owed,Paid,Balance"];
    const rows = filteredEntries.map(e => 
      `${e.transaction_date},"${e.supplier_name}","${e.goods_received}",${e.quantity},${e.unit_price},${e.amount_owed},${e.amount_paid},${e.amount_owed - e.amount_paid}`
    );
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `supplier_ledger_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      {/* Top Navigation */}
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10">
        <button
          onClick={() => window.history.back()}
          className="flex items-center text-blue-900 font-medium hover:text-blue-700 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" /> Back
        </button>
        <div className="text-xl font-bold text-gray-800 hidden md:block">
          Staff Tracker Admin
        </div>
        <button
          onClick={() => auth.signOut()}
          className="text-red-600 font-medium hover:bg-red-50 px-4 py-2 rounded transition-colors"
        >
          Logout
        </button>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <h1 className="text-3xl font-extrabold text-gray-900">
            Supplier Ledger
          </h1>
          <div className="flex gap-2">
            <button 
              onClick={() => window.print()}
              className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <Printer className="w-4 h-4 mr-2" /> Print
            </button>
            <button 
              onClick={handleExport}
              className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <Download className="w-4 h-4 mr-2" /> Export CSV
            </button>
          </div>
        </div>

        {/* Alerts */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3 animate-fade-in">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-green-800 font-medium">{successMessage}</span>
          </div>
        )}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 animate-fade-in">
            <span className="text-red-800 font-medium">⚠️ {error}</span>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider">Total Owed</h3>
            <p className="text-3xl font-bold text-red-600 mt-2">${totalOwed.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider">Total Paid</h3>
            <p className="text-3xl font-bold text-emerald-600 mt-2">${totalPaid.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider">Net Balance</h3>
            <p className={`text-3xl font-bold mt-2 ${balance > 0 ? 'text-red-600' : 'text-blue-600'}`}>
              ${balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
            <span className="text-xs text-gray-400">Positive = Outstanding Debt</span>
          </div>
        </div>

        {/* Input Form */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 mb-10 overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-800">
              {isEditing ? "Edit Transaction" : "New Transaction"}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {isEditing ? "Modify selected entry" : "Record goods received or payments"}
            </p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Supplier *</label>
                <select
                  name="supplier_id"
                  value={formState.supplier_id}
                  onChange={handleChange}
                  className="w-full h-11 px-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                >
                  <option value="">Select Supplier</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Goods / Description *</label>
                <input
                  type="text"
                  name="goods_received"
                  placeholder="e.g. Steel Rods"
                  value={formState.goods_received}
                  onChange={handleChange}
                  className="w-full h-11 px-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Quantity *</label>
                <input
                  type="number"
                  name="quantity"
                  placeholder="0"
                  value={formState.quantity}
                  onChange={handleChange}
                  className="w-full h-11 px-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Unit Price ($) *</label>
                <input
                  type="number"
                  name="unit_price"
                  placeholder="0.00"
                  step="0.01"
                  value={formState.unit_price}
                  onChange={handleChange}
                  className="w-full h-11 px-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Total Owed ($)</label>
                <div className="relative">
                  <input
                    type="number"
                    name="amount_owed"
                    value={formState.amount_owed}
                    onChange={handleChange}
                    readOnly={formState.quantity !== "" && formState.unit_price !== ""}
                    className={`w-full h-11 px-3 rounded-lg border border-gray-300 outline-none ${
                      formState.quantity !== "" && formState.unit_price !== "" 
                      ? "bg-gray-100 text-gray-500 cursor-not-allowed" 
                      : "focus:ring-2 focus:ring-blue-500"
                    }`}
                  />
                  {(formState.quantity !== "" && formState.unit_price !== "") && (
                    <span className="absolute right-3 top-3 text-xs text-gray-400">Auto</span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Amount Paid ($)</label>
                <input
                  type="number"
                  name="amount_paid"
                  placeholder="0.00"
                  step="0.01"
                  value={formState.amount_paid}
                  onChange={handleChange}
                  className="w-full h-11 px-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Date</label>
                <input
                  type="date"
                  name="transaction_date"
                  value={formState.transaction_date}
                  onChange={handleChange}
                  className="w-full h-11 px-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-gray-100">
              <button
                onClick={handleClearForm}
                className="px-6 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors"
              >
                Clear
              </button>
              <button
                onClick={handleAddOrUpdateEntry}
                disabled={loading}
                className="flex items-center px-6 py-2 bg-blue-900 text-white font-medium rounded-lg hover:bg-blue-800 transition-colors shadow-md disabled:opacity-50"
              >
                {loading ? "Processing..." : (
                  <>
                    <Plus className="w-5 h-5 mr-2" />
                    {isEditing ? "Update Entry" : "Add Entry"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Ledger Table Section */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h2 className="text-xl font-bold text-gray-800">Ledger History</h2>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
               {/* Date Filters */}
               <div className="flex items-center gap-2 bg-gray-50 px-3 rounded-lg border border-gray-200">
                 <Calendar className="w-4 h-4 text-gray-400" />
                 <input 
                   type="date" 
                   value={dateFrom} 
                   onChange={(e) => setDateFrom(e.target.value)} 
                   className="bg-transparent border-none text-sm py-2 focus:ring-0 w-32"
                 />
                 <span className="text-gray-400">-</span>
                 <input 
                   type="date" 
                   value={dateTo} 
                   onChange={(e) => setDateTo(e.target.value)} 
                   className="bg-transparent border-none text-sm py-2 focus:ring-0 w-32"
                 />
               </div>

               {/* Search */}
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search Supplier or Goods..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Supplier</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Goods</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Qty</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Unit ($)</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Owed</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Paid</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Balance</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-8 text-center text-gray-500">Loading ledger data...</td>
                  </tr>
                ) : filteredEntries.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-8 text-center text-gray-500">No entries found matching your criteria.</td>
                  </tr>
                ) : (
                  filteredEntries.map((entry) => {
                    const entryBalance = entry.amount_owed - entry.amount_paid;
                    return (
                      <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">
                          {entry.transaction_date}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-semibold text-gray-900">{entry.supplier_name}</div>
                          <div className="text-xs text-gray-400 hidden lg:block">{entry.supplier_id.substring(0,8)}...</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate" title={entry.goods_received}>
                          {entry.goods_received}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 text-right">{entry.quantity}</td>
                        <td className="px-6 py-4 text-sm text-blue-900 font-medium text-right">
                          ${entry.unit_price.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-sm text-red-600 font-semibold text-right">
                          ${entry.amount_owed.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-sm text-emerald-600 font-semibold text-right">
                          ${entry.amount_paid.toFixed(2)}
                        </td>
                        <td className={`px-6 py-4 text-sm font-bold text-right ${entryBalance > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                          ${entryBalance.toFixed(2)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-center gap-2">
                            {entryBalance > 0 && (
                              <button
                                onClick={() => handleMarkAsPaid(entry)}
                                className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded border border-emerald-200 hover:border-emerald-300 transition-colors"
                                title="Mark as Fully Paid"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => handleEdit(entry)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded border border-blue-200 hover:border-blue-300 transition-colors"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(entry.id)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded border border-red-200 hover:border-red-300 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 text-sm text-gray-500">
            Showing {filteredEntries.length} entries
          </div>
        </div>
      </div>
      
      {/* CSS for print media to hide nav and buttons */}
      <style>{`
        @media print {
          nav, button, .no-print { display: none !important; }
          body { background: white; }
          .shadow-lg, .shadow-sm { box-shadow: none !important; }
          input, select { border: none !important; appearance: none; }
        }
      `}</style>
    </div>
  );
};

export default SupplierLedger;