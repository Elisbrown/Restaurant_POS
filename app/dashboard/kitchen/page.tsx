"use client"

import { useAuth } from "@/contexts/auth-context"
import { KitchenDashboard } from "@/components/kitchen/kitchen-dashboard"
import { redirect } from "next/navigation"

export default function KitchenPage() {
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

  if (!["Cook", "Manager", "Super Admin"].includes(user.role)) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to access the kitchen dashboard.</p>
        </div>
      </div>
    )
  }

  return <KitchenDashboard />
}
