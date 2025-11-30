// src/components/forms/CustomerForm.tsx
"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
    account_status: "Active", // default
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
    try {
      await onAddCustomer(newCustomer)
      setNewCustomer({
        name: "",
        phone: "",
        email: "",
        address: "",
        account_status: "Active", // reset to default
      })
    } catch (error) {
      console.error("Failed to add customer:", error)
      alert("Failed to add customer. Please try again.")
    } finally {
      setSubmitting(false)
    }
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
        {/* Account Status Dropdown */}
        <Select
          value={newCustomer.account_status}
          onValueChange={(value) => handleChange("account_status", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select Account Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Inactive">Inactive</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button onClick={handleSubmit} className="w-full" disabled={submitting}>
        {submitting ? "Adding..." : "Add Customer"}
      </Button>
    </div>
  )
}
