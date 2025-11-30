// src/components/CustomerForm.tsx
"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Customer } from "@/pages/Staff/Customers"

interface CustomerFormProps {
  onAddCustomer: (customer: Omit<Customer, "id">) => Promise<void>
}

export default function CustomerForm({ onAddCustomer }: CustomerFormProps) {
  const [newCustomer, setNewCustomer] = useState<Omit<Customer, "id">>({
    name: "",
    phone: "",
    email: "",
    address: "",
    account_status: "Active", // Default value
  })

  const [submitting, setSubmitting] = useState(false)

  const handleChange = (field: keyof Omit<Customer, "id">, value: string) => {
    setNewCustomer(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async () => {
    if (!newCustomer.name || !newCustomer.phone) {
      alert("Name and phone are required")
      return
    }

    setSubmitting(true)
    await onAddCustomer(newCustomer)

    // Reset the form including account_status
    setNewCustomer({
      name: "",
      phone: "",
      email: "",
      address: "",
      account_status: "Active",
    })

    setSubmitting(false)
  }

  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <Input
          type="text"
          placeholder="Customer Name"
          value={newCustomer.name}
          onChange={(e) => handleChange("name", e.target.value)}
        />
        <Input
          type="tel"
          placeholder="Phone"
          value={newCustomer.phone}
          onChange={(e) => handleChange("phone", e.target.value)}
        />
        <Input
          type="email"
          placeholder="Email"
          value={newCustomer.email}
          onChange={(e) => handleChange("email", e.target.value)}
        />
        <Input
          type="text"
          placeholder="Address"
          value={newCustomer.address}
          onChange={(e) => handleChange("address", e.target.value)}
        />
        <select
          value={newCustomer.account_status}
          onChange={(e) => handleChange("account_status", e.target.value)}
          className="border rounded px-3 py-2"
        >
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
          <option value="Pending">Pending</option>
        </select>
      </div>
      <Button onClick={handleSubmit} className="w-full" disabled={submitting}>
        {submitting ? "Adding..." : "Add Customer"}
      </Button>
    </div>
  )
}
