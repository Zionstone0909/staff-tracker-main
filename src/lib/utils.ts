// src/lib/utils.ts
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Combines and merges Tailwind classes.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Safely retrieves the value from an input or select event.
 */
export function getInputValue(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
  return e.target.value
}

/**
 * Validates a ledger entry object.
 */
export function validateEntry(entry: {
  supplier_id: string
  goods_received: string
  quantity: number
  amount_owed: number
  amount_paid: number
  transaction_date: string
  status: string
}) {
  if (!entry.supplier_id.trim()) return false
  if (!entry.goods_received.trim()) return false
  if (!entry.transaction_date) return false
  if (entry.quantity < 0 || entry.amount_owed < 0 || entry.amount_paid < 0) return false
  if (!["pending","paid","partial"].includes(entry.status)) return false
  return true
}

/**
 * Validates a supplier object (for Suppliers.tsx).
 */
export function validateSupplier(supplier: { [key: string]: any }): boolean {
  return Object.values(supplier).every(
    (val) => typeof val === "string" && val.trim() !== ""
  )
}
