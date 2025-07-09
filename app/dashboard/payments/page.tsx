"use client"

import { useAuth } from "@/contexts/auth-context"
import { PaymentDashboard } from "@/components/payments/payment-dashboard"
import { DashboardLayout } from "@/components/dashboard-layout"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function PaymentsPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && (!user || !["Super Admin", "Manager", "Cashier"].includes(user.role))) {
      router.push("/dashboard")
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  if (!user || !["Super Admin", "Manager", "Cashier"].includes(user.role)) {
    return null
  }

  return (
    <DashboardLayout>
      <PaymentDashboard />
    </DashboardLayout>
  )
}
