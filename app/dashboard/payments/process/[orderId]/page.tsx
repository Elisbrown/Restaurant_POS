"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { PaymentProcessing } from "@/components/payments/payment-processing"
import { DashboardLayout } from "@/components/dashboard-layout"
import { useRouter } from "next/navigation"
import type { Order } from "@/lib/models"

export default function ProcessPaymentPage({ params }: { params: { orderId: string } }) {
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && (!user || !["Super Admin", "Manager", "Cashier", "Waitress"].includes(user.role))) {
      router.push("/dashboard")
    }
  }, [user, isLoading, router])

  useEffect(() => {
    fetchOrder()
  }, [params.orderId])

  const fetchOrder = async () => {
    try {
      const response = await fetch(`/api/sales/orders/${params.orderId}`)
      if (response.ok) {
        const data = await response.json()
        setOrder(data)
      } else {
        router.push("/dashboard/payments")
      }
    } catch (error) {
      console.error("Error fetching order:", error)
      router.push("/dashboard/payments")
    } finally {
      setLoading(false)
    }
  }

  const handlePaymentComplete = () => {
    router.push("/dashboard/payments")
  }

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  if (!user || !["Super Admin", "Manager", "Cashier", "Waitress"].includes(user.role)) {
    return null
  }

  if (!order) {
    return (
      <DashboardLayout>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Order Not Found</h1>
          <p className="text-gray-600">The requested order could not be found.</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Process Payment</h1>
          <button onClick={() => router.back()} className="text-purple-600 hover:text-purple-800">
            ← Back
          </button>
        </div>
        <PaymentProcessing order={order} onPaymentComplete={handlePaymentComplete} />
      </div>
    </DashboardLayout>
  )
}
