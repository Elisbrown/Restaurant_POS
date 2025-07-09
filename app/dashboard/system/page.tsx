"use client"

import { useAuth } from "@/contexts/auth-context"
import { useLanguage } from "@/contexts/language-context"
import { DashboardLayout } from "@/components/dashboard-layout"
import { SystemDashboard } from "@/components/system/system-dashboard"
import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function SystemPage() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const router = useRouter()

  useEffect(() => {
    // Only Super Admin can access system dashboard
    if (user && user.role !== "Super Admin") {
      router.push("/dashboard")
    }
  }, [user, router])

  if (!user || user.role !== "Super Admin") {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">{t("accessDenied")}</h2>
            <p className="text-gray-600">{t("systemAccessRequired")}</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <SystemDashboard />
    </DashboardLayout>
  )
}
