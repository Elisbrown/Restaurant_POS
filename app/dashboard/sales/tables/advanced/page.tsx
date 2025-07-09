"use client"

import { useAuth } from "@/contexts/auth-context"
import { AdvancedTableManagement } from "@/components/sales/advanced-table-management"
import { redirect } from "next/navigation"

export default function AdvancedTableManagementPage() {
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

  return <AdvancedTableManagement />
}
