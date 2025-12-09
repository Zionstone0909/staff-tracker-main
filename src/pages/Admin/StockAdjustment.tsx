
"use client";

import React, { useState, useEffect } from "react";

// ===== Color Constants =====
const PrimaryColor = '#0B3D91';
const DestructiveColor = '#dc2626';
const SuccessColor = '#065f46';
const ErrorColor = '#b91c1c';
const LightBg = '#f3f4f6';
const OutlineBorderColor = '#e5e7eb';
const MutedColor = '#6b7280';

// ===== Type Definitions =====
type AdjustmentType = "received" | "sold" | "damaged" | "canceled";

interface StockAdjustmentRecord {
  id: number;
  inventory_id: string;
  adjustment_type: AdjustmentType;
  quantity: number;
  reason: string;
  adjustment_date: string;
}

interface NewAdjustment {
  inventory_id: string;
  adjustment_type: AdjustmentType;
  quantity: string;
  reason: string;
  adjustment_date: string;
}

interface InventoryItem {
  id: string;
  name: string;
  category?: string;
  unitPrice: number;
  quantity: number;
  description?: string;
  userId?: string;
}

interface StockItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  price: number;
}

// ===== Storage Keys =====
const ADJUSTMENT_STORAGE_KEY = 'staff_tracker_adjustments';
const INVENTORY_STORAGE_KEY = 'staff_tracker_inventory';
const STOCK_STORAGE_KEY = 'staff_tracker_stock';

// ===== Utility Functions =====
const mergeStyles = (...styles: React.CSSProperties[]): React.CSSProperties => 
  Object.assign({}, ...styles);

// ===== Icon Components =====
interface IconProps {
  size?: number;
  style?: React.CSSProperties;
}

const Plus: React.FC<IconProps> = ({ size = 16, style = {} }) => (
  <svg width={size} height={size} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

const Trash2: React.FC<IconProps> = ({ size = 16, style = {} }) => (
  <svg width={size} height={size} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
  </svg>
);

const AlertCircle: React.FC<IconProps> = ({ size = 20, style = {} }) => (
  <svg width={size} height={size} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const CheckCircle: React.FC<IconProps> = ({ size = 20, style = {} }) => (
  <svg width={size} height={size} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const ArrowLeft: React.FC<IconProps> = ({ size = 20, style = {} }) => (
  <svg width={size} height={size} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
);

// ===== UI Components =====
interface ButtonProps {
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  variant?: "default" | "ghost" | "outline" | "destructive";
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  style?: React.CSSProperties;
}

const Button: React.FC<ButtonProps> = ({ 
  children, 
  onClick, 
  disabled = false, 
  variant = "default", 
  type = "button", 
  style = {} 
}) => {
  let backgroundColor = PrimaryColor;
  let color = 'white';
  let border = '1px solid transparent';

  if (variant === "ghost") {
    backgroundColor = 'transparent';
    color = PrimaryColor;
    border = `1px solid ${OutlineBorderColor}`;
  } else if (variant === "outline") {
    backgroundColor = '#fff';
    color = '#374151';
    border = `1px solid ${OutlineBorderColor}`;
  } else if (variant === "destructive") {
    backgroundColor = DestructiveColor;
  }

  const baseStyle: React.CSSProperties = {
    padding: "0.5rem 1rem",
    fontSize: "14px",
    fontWeight: 600,
    borderRadius: "8px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.6 : 1,
    border,
    transition: "all 0.15s ease-in-out",
    boxShadow: variant === "ghost" || variant === "outline" ? "none" : "0 1px 3px rgba(0,0,0,0.1)",
    backgroundColor: disabled ? '#ccc' : backgroundColor,
    color: disabled ? '#666' : color,
    ...style
  };

  return (
    <button onClick={onClick} style={baseStyle} disabled={disabled} type={type}>
      {children}
    </button>
  );
};

interface InputProps {
  type?: "text" | "number" | "date" | "select";
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  placeholder?: string;
  disabled?: boolean;
  label?: string;
  style?: React.CSSProperties;
  list?: string;
  min?: number;
  step?: string;
  options?: Array<{ value: string; label: string }>;
}

const Input: React.FC<InputProps> = ({
  type = "text",
  value,
  onChange,
  placeholder = "",
  disabled = false,
  label,
  style: inputStyle = {},
  list,
  min,
  step,
  options = []
}) => {
  const baseInputStyle: React.CSSProperties = {
    height: "42px",
    width: "100%",
    borderRadius: "8px",
    border: `1px solid ${OutlineBorderColor}`,
    padding: "8px 12px",
    fontSize: "14px",
    color: "#111827",
    outline: "none",
    transition: "border-color 0.15s, box-shadow 0.15s",
    backgroundColor: "#fff",
    cursor: disabled ? "not-allowed" : type === "select" ? "pointer" : "text",
    boxSizing: "border-box",
  };

  const selectStyle: React.CSSProperties = {
    ...baseInputStyle,
    appearance: "none",
    backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="%234B5563"><path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" /></svg>')`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 0.7rem center",
    backgroundSize: "1.5em 1.5em",
    paddingRight: "2.5rem",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      {label && (
        <label style={{ fontSize: "13px", fontWeight: 500, color: "#4B5563" }}>
          {label}
        </label>
      )}
      {type === "select" ? (
        <select
          value={value}
          onChange={onChange}
          disabled={disabled}
          style={mergeStyles(selectStyle, inputStyle)}
        >
          {placeholder && <option value="" disabled>{placeholder}</option>}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          list={list}
          min={min}
          step={step}
          style={mergeStyles(baseInputStyle, inputStyle)}
        />
      )}
    </div>
  );
};

interface CardProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
}

const Card: React.FC<CardProps> = ({ children, style = {} }) => (
  <div
    style={mergeStyles(
      {
        borderRadius: "12px",
        backgroundColor: "#fff",
        boxShadow: "0 4px 8px rgba(0,0,0,0.05)",
        border: `1px solid ${OutlineBorderColor}`,
        overflow: "hidden",
      },
      style
    )}
  >
    {children}
  </div>
);

const CardHeader: React.FC<CardProps> = ({ children, style = {} }) => (
  <div
    style={mergeStyles(
      {
        padding: "20px 24px",
        borderBottom: `1px solid ${LightBg}`,
      },
      style
    )}
  >
    {children}
  </div>
);

const CardTitle: React.FC<CardProps> = ({ children, style = {} }) => (
  <h3 style={mergeStyles({ fontSize: "18px", fontWeight: 700, color: PrimaryColor, margin: 0 }, style)}>
    {children}
  </h3>
);

const CardDescription: React.FC<CardProps> = ({ children, style = {} }) => (
  <p style={mergeStyles({ fontSize: "0.875rem", color: MutedColor, margin: "4px 0 0 0" }, style)}>
    {children}
  </p>
);

const CardContent: React.FC<CardProps> = ({ children, style = {} }) => (
  <div style={mergeStyles({ padding: "24px" }, style)}>{children}</div>
);

const Table: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
    {children}
  </table>
);

const TableHeader: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <thead style={{ backgroundColor: LightBg }}>{children}</thead>
);

const TableBody: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <tbody>{children}</tbody>
);

const TableRow: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <tr style={{ borderBottom: `1px solid ${OutlineBorderColor}`, transition: "background-color 0.15s" }}>
    {children}
  </tr>
);

const TableHead: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ 
  children, 
  style = {} 
}) => (
  <th style={mergeStyles({ padding: "12px 16px", textAlign: "left", fontWeight: 600, color: MutedColor }, style)}>
    {children}
  </th>
);

const TableCell: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ 
  children, 
  style = {} 
}) => (
  <td style={mergeStyles({ padding: "12px 16px", color: "#374151" }, style)}>
    {children}
  </td>
);

interface AlertProps {
  variant: "success" | "error";
  children: React.ReactNode;
  onClose?: () => void;
}

const Alert: React.FC<AlertProps> = ({ variant, children, onClose }) => {
  const isSuccess = variant === "success";
  return (
    <div
      style={{
        padding: "1rem",
        borderRadius: "8px",
        marginBottom: "1rem",
        backgroundColor: isSuccess ? "#ecfdf5" : "#fef2f2",
        border: `1px solid ${isSuccess ? SuccessColor : ErrorColor}`,
        display: "flex",
        alignItems: "flex-start",
        gap: "0.75rem",
      }}
    >
      <div style={{ paddingTop: "2px" }}>
        {isSuccess ? (
          <CheckCircle size={20} style={{ color: SuccessColor }} />
        ) : (
          <AlertCircle size={20} style={{ color: ErrorColor }} />
        )}
      </div>
      <div style={{ flex: 1, color: isSuccess ? SuccessColor : ErrorColor, fontSize: "0.875rem", fontWeight: 500 }}>
        {children}
      </div>
      {onClose && (
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: isSuccess ? SuccessColor : ErrorColor,
            fontSize: "1.25rem",
            lineHeight: 1,
            padding: 0,
          }}
        >
          ×
        </button>
      )}
    </div>
  );
};

// ===== Main Component =====
const defaultAdjustment: NewAdjustment = {
  inventory_id: "",
  adjustment_type: "received",
  quantity: "",
  reason: "",
  adjustment_date: new Date().toISOString().substring(0, 10),
};

export default function StockAdjustment() {
  const [adjustments, setAdjustments] = useState<StockAdjustmentRecord[]>([]);
  const [newAdjustment, setNewAdjustment] = useState<NewAdjustment>(defaultAdjustment);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [stock, setStock] = useState<StockItem[]>([]);
  const [alertMessage, setAlertMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Load all data from localStorage
  useEffect(() => {
    const savedAdjustments = localStorage.getItem(ADJUSTMENT_STORAGE_KEY);
    if (savedAdjustments) {
      try {
        setAdjustments(JSON.parse(savedAdjustments));
      } catch (error) {
        console.error("Error loading adjustments:", error);
      }
    }

    const savedInventory = localStorage.getItem(INVENTORY_STORAGE_KEY);
    if (savedInventory) {
      try {
        setInventory(JSON.parse(savedInventory));
      } catch (error) {
        console.error("Error loading inventory:", error);
      }
    }

    const savedStock = localStorage.getItem(STOCK_STORAGE_KEY);
    if (savedStock) {
      try {
        setStock(JSON.parse(savedStock));
      } catch (error) {
        console.error("Error loading stock:", error);
      }
    }
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    field: keyof NewAdjustment
  ) => {
    const value = e.target.value;
    setNewAdjustment((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const updateInventoryStock = (itemId: string, adjustmentQty: number, adjustmentType: AdjustmentType) => {
    const isPositive = adjustmentType === "received" || adjustmentType === "canceled";
    const finalAdjustment = isPositive ? adjustmentQty : -adjustmentQty;

    // Find and update in inventory
    let inventoryUpdated = false;
    const updatedInventory = inventory.map((item) => {
      if (item.id === itemId || item.name.toLowerCase() === itemId.toLowerCase()) {
        const newQuantity = item.quantity + finalAdjustment;
        if (newQuantity < 0) {
          throw new Error(`Adjustment would result in negative inventory for ${item.name}`);
        }
        inventoryUpdated = true;
        return { ...item, quantity: newQuantity };
      }
      return item;
    });

    // Find and update in stock
    let stockUpdated = false;
    const updatedStock = stock.map((item) => {
      if (item.id === itemId || item.name.toLowerCase() === itemId.toLowerCase()) {
        const newQuantity = item.quantity + finalAdjustment;
        if (newQuantity < 0) {
          throw new Error(`Adjustment would result in negative stock for ${item.name}`);
        }
        stockUpdated = true;
        return { ...item, quantity: newQuantity };
      }
      return item;
    });

    if (!inventoryUpdated && !stockUpdated) {
      throw new Error(`Item "${itemId}" not found in inventory or stock`);
    }

    // Save to localStorage
    if (inventoryUpdated) {
      localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(updatedInventory));
      setInventory(updatedInventory);
    }

    if (stockUpdated) {
      localStorage.setItem(STOCK_STORAGE_KEY, JSON.stringify(updatedStock));
      setStock(updatedStock);
    }
  };

  const addAdjustment = () => {
    // Validation
    const qty = Number(newAdjustment.quantity);
    
    if (!newAdjustment.inventory_id.trim()) {
      setAlertMessage({ type: "error", text: "Please enter an item name or ID" });
      return;
    }

    if (!newAdjustment.quantity || qty <= 0 || isNaN(qty)) {
      setAlertMessage({ type: "error", text: "Please enter a valid quantity greater than 0" });
      return;
    }

    if (!newAdjustment.reason.trim()) {
      setAlertMessage({ type: "error", text: "Please provide a reason for this adjustment" });
      return;
    }

    if (!newAdjustment.adjustment_date) {
      setAlertMessage({ type: "error", text: "Please select an adjustment date" });
      return;
    }

    try {
      // Update inventory and stock
      updateInventoryStock(newAdjustment.inventory_id, qty, newAdjustment.adjustment_type);

      // Create new adjustment record
      const newRecord: StockAdjustmentRecord = {
        id: Date.now(),
        inventory_id: newAdjustment.inventory_id,
        adjustment_type: newAdjustment.adjustment_type,
        quantity: qty,
        reason: newAdjustment.reason,
        adjustment_date: newAdjustment.adjustment_date,
      };

      // Add to adjustments and save
      const updatedAdjustments = [newRecord, ...adjustments];
      setAdjustments(updatedAdjustments);
      localStorage.setItem(ADJUSTMENT_STORAGE_KEY, JSON.stringify(updatedAdjustments));

      // Reset form
      setNewAdjustment(defaultAdjustment);
      setAlertMessage({
        type: "success",
        text: `Stock adjustment recorded successfully! Inventory and stock updated for "${newAdjustment.inventory_id}".`,
      });

      // Auto-hide success message after 4 seconds
      setTimeout(() => setAlertMessage(null), 4000);
    } catch (error: any) {
      setAlertMessage({ type: "error", text: error.message || "Failed to apply adjustment" });
    }
  };

  const removeAdjustment = (id: number) => {
    if (!window.confirm("Are you sure you want to delete this adjustment record? This will NOT revert the inventory changes.")) {
      return;
    }

    const updatedAdjustments = adjustments.filter((item) => item.id !== id);
    setAdjustments(updatedAdjustments);
    localStorage.setItem(ADJUSTMENT_STORAGE_KEY, JSON.stringify(updatedAdjustments));
    setAlertMessage({ type: "success", text: "Adjustment record deleted (inventory not reverted)" });
    setTimeout(() => setAlertMessage(null), 3000);
  };

  const isPositiveAdjustment = (type: AdjustmentType) => type === "received" || type === "canceled";

  const formatQuantity = (type: AdjustmentType, quantity: number) => {
    const sign = isPositiveAdjustment(type) ? "+" : "-";
    return `${sign}${quantity}`;
  };

  // Get available inventory items for autocomplete
  const availableItems = [...new Set([...inventory.map((i) => i.name), ...stock.map((s) => s.name)])];

  const adjustmentTypeOptions = [
    { value: "received", label: "Received (Inflow +)" },
    { value: "sold", label: "Sold (Outflow -)" },
    { value: "damaged", label: "Damaged (Outflow -)" },
    { value: "canceled", label: "Canceled Sale (Inflow +)" },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "1.5rem",
        fontFamily: "Inter, sans-serif",
        backgroundColor: LightBg,
      }}
    >
      {/* Top Navigation */}
      <nav
        style={{
          borderBottom: "1px solid #e5e7eb",
          backgroundColor: "#fff",
          padding: "1rem",
          marginBottom: "1.5rem",
          borderRadius: "8px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
        }}
      >
        <Button variant="ghost" style={{ color: PrimaryColor }} onClick={() => window.history.back()}>
          <ArrowLeft size={20} />
          Back
        </Button>
        <Button
          variant="destructive"
          onClick={() => {
            localStorage.removeItem("currentUser");
            window.location.href = "/login";
          }}
        >
          Logout
        </Button>
      </nav>

      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: 800, color: PrimaryColor, marginBottom: "0.5rem" }}>
          Stock Adjustment Log
        </h1>
        <p style={{ fontSize: "0.875rem", color: MutedColor, marginBottom: "1.5rem" }}>
          Record stock adjustments that automatically update inventory and stock levels
        </p>

        {/* Alert Messages */}
        {alertMessage && (
          <Alert variant={alertMessage.type} onClose={() => setAlertMessage(null)}>
            {alertMessage.text}
          </Alert>
        )}

        {/* Summary Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "1rem",
            marginBottom: "1.5rem",
          }}
        >
          <Card>
            <CardContent style={{ padding: "1.25rem" }}>
              <div style={{ fontSize: "0.875rem", color: MutedColor, marginBottom: "0.25rem" }}>
                Total Adjustments
              </div>
              <div style={{ fontSize: "1.75rem", fontWeight: "bold", color: PrimaryColor }}>
                {adjustments.length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent style={{ padding: "1.25rem" }}>
              <div style={{ fontSize: "0.875rem", color: MutedColor, marginBottom: "0.25rem" }}>
                Inventory Items
              </div>
              <div style={{ fontSize: "1.75rem", fontWeight: "bold", color: SuccessColor }}>
                {inventory.length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent style={{ padding: "1.25rem" }}>
              <div style={{ fontSize: "0.875rem", color: MutedColor, marginBottom: "0.25rem" }}>
                Stock Items
              </div>
              <div style={{ fontSize: "1.75rem", fontWeight: "bold", color: SuccessColor }}>
                {stock.length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Record Adjustment Form */}
        <Card style={{ marginBottom: "2rem" }}>
          <CardHeader>
            <CardTitle>Record New Stock Adjustment</CardTitle>
            <CardDescription>
              Adjustments automatically update both inventory and stock levels in real-time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "1rem",
                alignItems: "end",
              }}
            >
              {/* Inventory ID with autocomplete */}
              <div>
                <Input
                  label="Item Name / ID"
                  placeholder="e.g., Laptop or SKU-1001"
                  value={newAdjustment.inventory_id}
                  onChange={(e) => handleInputChange(e, "inventory_id")}
                  list="available-items"
                />
                <datalist id="available-items">
                  {availableItems.map((item, idx) => (
                    <option key={idx} value={item} />
                  ))}
                </datalist>
              </div>

              {/* Adjustment Type */}
              <Input
                type="select"
                label="Adjustment Type"
                placeholder="Select Type"
                value={newAdjustment.adjustment_type}
                onChange={(e) => handleInputChange(e, "adjustment_type")}
                options={adjustmentTypeOptions}
              />

              {/* Quantity */}
              <Input
                label="Quantity"
                placeholder="0"
                type="number"
                value={newAdjustment.quantity}
                onChange={(e) => handleInputChange(e, "quantity")}
                min={0}
                step="1"
              />

              {/* Date */}
              <Input
                label="Adjustment Date"
                type="date"
                value={newAdjustment.adjustment_date}
                onChange={(e) => handleInputChange(e, "adjustment_date")}
              />

              {/* Reason - Full width */}
              <div style={{ gridColumn: "1 / -1" }}>
                <Input
                  label="Reason / Notes"
                  placeholder="Why is this adjustment being made?"
                  value={newAdjustment.reason}
                  onChange={(e) => handleInputChange(e, "reason")}
                />
              </div>

              {/* Submit Button - Full width */}
              <div style={{ gridColumn: "1 / -1" }}>
                <Button
                  onClick={addAdjustment}
                  disabled={
                    !newAdjustment.inventory_id ||
                    !newAdjustment.quantity ||
                    Number(newAdjustment.quantity) <= 0 ||
                    !newAdjustment.reason ||
                    !newAdjustment.adjustment_date
                  }
                  style={{ height: "42px", width: "100%", backgroundColor: SuccessColor }}
                >
                  <Plus size={18} /> Record Adjustment & Update Stock
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Adjustment Records Table */}
        <Card>
          <CardHeader>
            <CardTitle>Adjustment History ({adjustments.length} records)</CardTitle>
            <CardDescription>View all recorded stock adjustments</CardDescription>
          </CardHeader>
          <CardContent style={{ padding: 0 }}>
            {adjustments.length === 0 ? (
              <div
                style={{
                  padding: "3rem",
                  textAlign: "center",
                  color: MutedColor,
                  fontStyle: "italic",
                }}
              >
                No stock adjustments have been recorded yet. Add your first adjustment above to get started.
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead style={{ width: "80px" }}>ID</TableHead>
                      <TableHead>Item Name/ID</TableHead>
                      <TableHead style={{ width: "140px" }}>Type</TableHead>
                      <TableHead style={{ textAlign: "right", width: "100px" }}>Quantity</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead style={{ width: "120px" }}>Date</TableHead>
                      <TableHead style={{ width: "80px", textAlign: "center" }}>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {adjustments.map((adj) => (
                      <TableRow key={adj.id}>
                        <TableCell style={{ color: MutedColor, fontSize: "0.8125rem" }}>
                          #{adj.id}
                        </TableCell>
                        <TableCell style={{ fontWeight: 500, color: PrimaryColor }}>
                          {adj.inventory_id}
                        </TableCell>
                        <TableCell>
                          <span
                            style={{
                              padding: "4px 10px",
                              borderRadius: "6px",
                              fontSize: "12px",
                              fontWeight: 600,
                              backgroundColor: isPositiveAdjustment(adj.adjustment_type)
                                ? "#D1FAE5"
                                : "#FEE2E2",
                              color: isPositiveAdjustment(adj.adjustment_type) ? SuccessColor : ErrorColor,
                              display: "inline-block",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {adj.adjustment_type.toUpperCase()}
                          </span>
                        </TableCell>
                        <TableCell
                          style={{
                            textAlign: "right",
                            fontWeight: 700,
                            fontSize: "0.9375rem",
                            color: isPositiveAdjustment(adj.adjustment_type) ? SuccessColor : ErrorColor,
                          }}
                        >
{formatQuantity(adj.adjustment_type, adj.quantity)}
                        </TableCell>
                        <TableCell style={{ maxWidth: "300px" }}>{adj.reason}</TableCell>
                        <TableCell style={{ whiteSpace: "nowrap", color: MutedColor }}>
                          {adj.adjustment_date}
                        </TableCell>
                        <TableCell style={{ textAlign: "center" }}>
                          <Button
                            variant="outline"
                            onClick={() => removeAdjustment(adj.id)}
                            style={{
                              height: "32px",
                              padding: "4px 10px",
                              fontSize: "12px",
                              borderColor: "#FCA5A5",
                              color: ErrorColor,
                            }}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
