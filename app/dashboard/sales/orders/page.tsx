"use client"

import { OrderManagement } from "@/components/sales/order-management"
import { useAuth } from "@/contexts/auth-context"

export default function OrdersPage() {
  const { user } = useAuth()

  if (!user) {
    return <div>Please log in to access this page.</div>
  }

  return (
    <div className="container mx-auto py-6">
      <OrderManagement />
    </div>
  )
}
