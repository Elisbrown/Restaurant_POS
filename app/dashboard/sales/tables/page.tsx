"use client"

import { TableManagement } from "@/components/sales/table-management"
import { useAuth } from "@/contexts/auth-context"

export default function TablesPage() {
  const { user } = useAuth()

  if (!user) {
    return <div>Please log in to access this page.</div>
  }

  return (
    <div className="container mx-auto py-6">
      <TableManagement />
    </div>
  )
}
