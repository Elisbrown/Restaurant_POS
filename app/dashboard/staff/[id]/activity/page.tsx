"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ActivityLogs } from "@/components/staff/activity-logs"

export default function StaffActivityPage({ params }: { params: { id: string } }) {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [staffName, setStaffName] = useState("")

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    } else if (user?.forcePasswordChange) {
      router.push("/change-password")
    } else if (user && !["Super Admin", "Manager"].includes(user.role)) {
      router.push("/dashboard")
    } else if (user) {
      fetchStaffName()
    }
  }, [user, isLoading, router])

  const fetchStaffName = async () => {
    try {
      const response = await fetch(`/api/staff/${params.id}`)
      if (response.ok) {
        const staff = await response.json()
        setStaffName(staff.name)
      }
    } catch (error) {
      console.error("Error fetching staff name:", error)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  if (!user || user.forcePasswordChange || !["Super Admin", "Manager"].includes(user.role)) {
    return null // Will redirect
  }

  return (
    <DashboardLayout>
      <ActivityLogs staffId={params.id} staffName={staffName} />
    </DashboardLayout>
  )
}
