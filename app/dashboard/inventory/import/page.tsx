"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { DashboardLayout } from "@/components/dashboard-layout"
import { CSVImport } from "@/components/inventory/csv-import"

export default function ImportPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    } else if (user?.forcePasswordChange) {
      router.push("/change-password")
    } else if (user && !["Super Admin", "Manager", "Stock Manager"].includes(user.role)) {
      router.push("/dashboard")
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  if (!user || user.forcePasswordChange || !["Super Admin", "Manager", "Stock Manager"].includes(user.role)) {
    return null // Will redirect
  }

  return (
    <DashboardLayout>
      <CSVImport />
    </DashboardLayout>
  )
}
