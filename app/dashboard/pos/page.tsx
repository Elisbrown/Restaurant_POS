"use client"

import { useAuth } from "@/contexts/auth-context"
import { POSInterface } from "@/components/pos/pos-interface"
import { CashierInterface } from "@/components/pos/cashier-interface"
import { redirect } from "next/navigation"

export default function POSPage() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  if (!user) {
    redirect("/login")
  }

  // Show different interfaces based on role
  if (user.role === "Cashier") {
    return <CashierInterface />
  }

  if (["Waitress", "Manager", "Super Admin"].includes(user.role)) {
    return <POSInterface />
  }

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
        <p className="text-gray-600">You don't have permission to access the POS system.</p>
      </div>
    </div>
  )
}
