"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { OrderForm } from "@/components/sales/order-form"
import { useAuth } from "@/contexts/auth-context"
import type { Order } from "@/lib/models"

export default function NewOrderPage() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()

  const tableId = searchParams.get("table")

  if (!user) {
    return <div>Please log in to access this page.</div>
  }

  const handleSubmit = async (orderData: Partial<Order>) => {
    setLoading(true)
    try {
      const response = await fetch("/api/sales/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      })

      if (response.ok) {
        const newOrder = await response.json()
        router.push(`/dashboard/sales/orders/${newOrder._id}`)
      } else {
        const error = await response.json()
        alert(error.error || "Failed to create order")
      }
    } catch (error) {
      console.error("Error creating order:", error)
      alert("Failed to create order")
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    router.back()
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Create New Order</h1>
        <p className="text-gray-600">Add items and customer details for the new order</p>
      </div>

      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-2 text-center">Creating order...</p>
          </div>
        </div>
      )}

      <OrderForm tableId={tableId || undefined} onSubmit={handleSubmit} onCancel={handleCancel} />
    </div>
  )
}
