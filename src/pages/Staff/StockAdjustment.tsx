"use client";

// Removed the explicit import of 'ChangeEvent' as it was unused and caused the linting error.
import React, { useState } from "react";
import { Plus, Trash2 } from "lucide-react";

// ----------------------
// Types & Interfaces for the Adjustment Log
// ----------------------
type Variant = "default" | "ghost" | "outline" | "positive" | "negative";
type ButtonType = "button" | "submit" | "reset";
type AdjustmentType = "received" | "sold" | "damaged" | "canceled";

interface BaseProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}

interface ButtonProps extends BaseProps {
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  variant?: Variant;
  disabled?: boolean;
  type?: ButtonType;
}

interface InputProps {
  type?: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  placeholder: string;
  disabled?: boolean;
  label?: string;
  style?: React.CSSProperties;
  className?: string;
}

interface DisplayComponentProps extends BaseProps {}
interface TableHeadProps extends DisplayComponentProps {}
interface TableCellProps extends DisplayComponentProps {}

interface StockAdjustmentRecord {
  id: number;
  inventory_id: string; // Item ID/SKU being adjusted
  adjustment_type: AdjustmentType;
  quantity: number;
  reason: string;
  adjustment_date: string;
}

interface NewAdjustment {
  inventory_id: string;
  adjustment_type: AdjustmentType;
  quantity: number;
  reason: string;
  adjustment_date: string;
}

// ----------------------
// Utility: Merge Multiple Styles
// ----------------------
const mergeStyles = (...styles: React.CSSProperties[]) => Object.assign({}, ...styles);

// ----------------------
// UI Components (Preserving original inline styles)
// ----------------------
const Button = ({
  children,
  onClick,
  style = {},
  variant = "default",
  disabled = false,
  type = "button",
}: ButtonProps) => {
  const baseStyle: React.CSSProperties = {
    padding: "10px 18px",
    fontSize: "14px",
    fontWeight: 600,
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.6 : 1,
    border: "none",
    transition: "all 0.15s ease-in-out",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  };

  const variantStyles: Record<Variant, React.CSSProperties> = {
    default: { backgroundColor: "#2563EB", color: "#fff" },
    ghost: { backgroundColor: "transparent", color: "#4B5563", boxShadow: "none", border: "1px solid transparent" },
    outline: { backgroundColor: "#fff", color: "#374151", border: "1px solid #D1D5DB" },
    positive: { backgroundColor: "#10B981", color: "#fff" }, // New for positive changes
    negative: { backgroundColor: "#EF4444", color: "#fff" }, // New for negative changes
  };

  return (
    <button onClick={onClick} style={mergeStyles(baseStyle, variantStyles[variant], style)} disabled={disabled} type={type}>
      {children}
    </button>
  );
};

const Input = ({
  type = "text",
  value,
  onChange,
  placeholder,
  disabled = false,
  label,
  style: inputStyle = {},
}: InputProps) => (
  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
    {label && <label style={{ fontSize: "13px", fontWeight: 500, color: "#4B5563" }}>{label}</label>}
    {type === "select" ? (
      <select
        value={value}
        onChange={onChange as (e: React.ChangeEvent<HTMLSelectElement>) => void}
        disabled={disabled}
        style={mergeStyles(
          {
            height: "42px",
            borderRadius: "8px",
            border: "1px solid #D1D5DB",
            padding: "8px 12px",
            fontSize: "14px",
            color: "#111827",
            outline: "none",
            transition: "border-color 0.15s, box-shadow 0.15s",
            backgroundColor: "#fff",
            cursor: disabled ? "not-allowed" : "pointer",
            appearance: "none", // Remove default select arrow
            backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="%234B5563"><path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" /></svg>')`,
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 0.7rem center",
            backgroundSize: "1.5em 1.5em",
          },
          inputStyle
        )}
      >
        {(placeholder && <option value="" disabled>{placeholder}</option>)}
        {label === "Adjustment Type" && (
          <>
            <option value="received">Received (Inflow)</option>
            <option value="sold">Sold (Outflow)</option>
            <option value="damaged">Damaged (Outflow)</option>
            <option value="canceled">Canceled Sale (Inflow)</option>
          </>
        )}
      </select>
    ) : (
      <input
        type={type}
        value={value}
        onChange={onChange as (e: React.ChangeEvent<HTMLInputElement>) => void}
        placeholder={placeholder}
        disabled={disabled}
        style={mergeStyles(
          {
            height: "42px",
            borderRadius: "8px",
            border: "1px solid #D1D5DB",
            padding: "8px 12px",
            fontSize: "14px",
            color: "#111827",
            outline: "none",
            transition: "border-color 0.15s, box-shadow 0.15s",
            backgroundColor: "#fff",
            cursor: disabled ? "not-allowed" : "text",
          },
          inputStyle
        )}
      />
    )}
  </div>
);

const Card = ({ children, style = {} }: DisplayComponentProps) => (
  <div
    style={mergeStyles(
      {
        borderRadius: "12px",
        backgroundColor: "#fff",
        boxShadow: "0 4px 8px rgba(0,0,0,0.05)",
        border: "1px solid #E5E7EB",
      },
      style
    )}
  >
    {children}
  </div>
);

const CardHeader = ({ children, style = {} }: DisplayComponentProps) => (
  <div
    style={mergeStyles(
      {
        padding: "20px 24px",
        borderBottom: "1px solid #F3F4F6",
        display: "flex",
        flexDirection: "column",
        gap: "4px",
      },
      style
    )}
  >
    {children}
  </div>
);

const CardTitle = ({ children, style = {} }: DisplayComponentProps) => (
  <h3 style={mergeStyles({ fontSize: "18px", fontWeight: 700, color: "#111827" }, style)}>{children}</h3>
);

const CardContent = ({ children, style = {} }: DisplayComponentProps) => (
  <div style={mergeStyles({ padding: "24px" }, style)}>{children}</div>
);

// ----------------------
// Table Components
// ----------------------
const Table = ({ children }: DisplayComponentProps) => (
  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>{children}</table>
);
const TableHeader = ({ children }: DisplayComponentProps) => (
  <thead style={{ backgroundColor: "#F9FAFB" }}>{children}</thead>
);
const TableBody = ({ children }: DisplayComponentProps) => <tbody>{children}</tbody>;
const TableRow = ({ children }: DisplayComponentProps) => (
  <tr style={{ borderBottom: "1px solid #E5E7EB", transition: "background-color 0.15s" }}>{children}</tr>
);
const TableHead = ({ children, style = {} }: TableHeadProps) => (
  <th style={mergeStyles({ padding: "12px 16px", textAlign: "left", fontWeight: 600, color: "#6B7280" }, style)}>
    {children}
  </th>
);
const TableCell = ({ children, style = {} }: TableCellProps) => (
  <td style={mergeStyles({ padding: "12px 16px", color: "#374151" }, style)}>{children}</td>
);

// ----------------------
// StockAdjustment Log Component (Refactored)
// ----------------------
const defaultAdjustment: NewAdjustment = {
    inventory_id: "",
    adjustment_type: "received",
    quantity: 0,
    reason: "",
    adjustment_date: new Date().toISOString().substring(0, 10), // Default to today
};

export default function StockAdjustment() {
  const [adjustments, setAdjustments] = useState<StockAdjustmentRecord[]>([]);
  const [newAdjustment, setNewAdjustment] = useState<NewAdjustment>(defaultAdjustment);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>, field: keyof NewAdjustment) => {
    const value = e.target.value;
    setNewAdjustment(prev => ({
      ...prev,
      [field]: field === 'quantity' ? Number(value) : value,
    }));
  };

  const addAdjustment = () => {
    // Basic validation
    if (!newAdjustment.inventory_id || newAdjustment.quantity <= 0 || !newAdjustment.reason || !newAdjustment.adjustment_date) return;

    const newRecord: StockAdjustmentRecord = {
        id: Date.now(),
        ...newAdjustment,
        // Ensure adjustment_type is correctly typed
        adjustment_type: newAdjustment.adjustment_type as AdjustmentType,
    };

    // Add to the top of the list and reset the form
    setAdjustments(prev => [newRecord, ...prev]);
    setNewAdjustment(defaultAdjustment);
  };

  const removeAdjustment = (id: number) => setAdjustments(prev => prev.filter(item => item.id !== id));

  // Helper to determine adjustment sign (Positive for increase, Negative for decrease)
  const isPositiveAdjustment = (type: AdjustmentType) => type === "received" || type === "canceled";
  
  // Helper to format the adjustment quantity display
  const formatQuantity = (type: AdjustmentType, quantity: number) => {
    const sign = isPositiveAdjustment(type) ? "+" : "-";
    return `${sign}${quantity}`;
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "40px 20px",
        fontFamily: "Inter, sans-serif",
        backgroundColor: "#F3F4F6",
        maxWidth: "1100px",
        margin: "0 auto",
      }}
    >
      <h1 style={{ fontSize: "32px", fontWeight: 800, color: "#111827", marginBottom: "28px" }}>
        Stock Adjustment Log
      </h1>

      {/* Record Adjustment Form */}
      <Card style={{ marginBottom: "32px" }}>
        <CardHeader>
          <CardTitle>Record New Stock Adjustment</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "16px",
              alignItems: "end",
            }}
          >
            {/* Inventory ID */}
            <Input
              label="Inventory ID / SKU"
              placeholder="e.g., SKU-1001"
              value={newAdjustment.inventory_id}
              onChange={e => handleInputChange(e, 'inventory_id')}
            />
            {/* Adjustment Type (Select Input) */}
            <Input
              type="select"
              label="Adjustment Type"
              placeholder="Select Type"
              value={newAdjustment.adjustment_type}
              onChange={e => handleInputChange(e, 'adjustment_type')}
            />
            {/* Quantity */}
            <Input
              label="Quantity"
              placeholder="0"
              type="number"
              value={newAdjustment.quantity}
              onChange={e => handleInputChange(e, 'quantity')}
              style={{ minWidth: '100px' }}
            />
            {/* Date */}
            <Input
              label="Adjustment Date"
              placeholder=""
              type="date"
              value={newAdjustment.adjustment_date}
              onChange={e => handleInputChange(e, 'adjustment_date')}
              style={{ minWidth: '150px' }}
            />
            {/* Reason */}
            <div style={{ gridColumn: "span 2" }}>
                <Input
                  label="Reason / Notes"
                  placeholder="Why is this adjustment being made?"
                  value={newAdjustment.reason}
                  onChange={e => handleInputChange(e, 'reason')}
                  style={{ width: '100%' }}
                />
            </div>

            {/* Submit Button */}
            <div style={{ gridColumn: "span 2" }}>
              <Button
                onClick={addAdjustment}
                disabled={!newAdjustment.inventory_id || newAdjustment.quantity <= 0 || !newAdjustment.reason || !newAdjustment.adjustment_date}
                style={{ height: "42px", width: "100%" }}
              >
                <Plus size={18} /> Record Adjustment
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Adjustment Records Table */}
      <Card>
        <CardHeader>
          <CardTitle>Adjustment History</CardTitle>
        </CardHeader>
        <CardContent style={{ padding: 0 }}>
          {adjustments.length === 0 ? (
            <div style={{ padding: "24px", textAlign: "center", color: "#6B7280", fontStyle: "italic" }}>
              No stock adjustments have been recorded yet.
            </div>
          ) : (
            <div style={{ overflowX: "auto", borderRadius: "8px" }}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Inventory ID</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead style={{ textAlign: "right" }}>Quantity</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead style={{ width: "80px", textAlign: "center" }}>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {adjustments.map(adj => (
                    <TableRow key={adj.id}>
                      <TableCell style={{ color: "#9CA3AF" }}>{adj.id}</TableCell>
                      <TableCell style={{ fontWeight: 500 }}>{adj.inventory_id}</TableCell>
                      <TableCell>
                        <span
                          style={{
                            padding: "4px 8px",
                            borderRadius: "6px",
                            fontSize: "12px",
                            fontWeight: 600,
                            backgroundColor: isPositiveAdjustment(adj.adjustment_type) ? "#D1FAE5" : "#FEE2E2",
                            color: isPositiveAdjustment(adj.adjustment_type) ? "#065F46" : "#B91C1C",
                          }}
                        >
                          {adj.adjustment_type.toUpperCase()}
                        </span>
                      </TableCell>
                      <TableCell style={{ 
                        textAlign: "right", 
                        fontWeight: 700,
                        color: isPositiveAdjustment(adj.adjustment_type) ? "#10B981" : "#EF4444"
                      }}>
                        {formatQuantity(adj.adjustment_type, adj.quantity)}
                      </TableCell>
                      <TableCell style={{ maxWidth: "300px", whiteSpace: 'normal', textOverflow: 'ellipsis' }}>
                        {adj.reason}
                      </TableCell>
                      <TableCell style={{ whiteSpace: "nowrap" }}>{adj.adjustment_date}</TableCell>
                      <TableCell style={{ textAlign: "center" }}>
                        <Button
                          variant="outline"
                          onClick={() => removeAdjustment(adj.id)}
                          style={{
                            height: "32px",
                            padding: "4px 8px",
                            fontSize: "12px",
                            borderColor: "#FCA5A5",
                            color: "#EF4444",
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
  );
}