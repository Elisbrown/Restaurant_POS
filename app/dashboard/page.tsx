"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { useLanguage } from "@/contexts/language-context"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Package, ShoppingCart, BarChart3 } from "lucide-react"

export default function DashboardPage() {
  const { user, isLoading } = useAuth()
  const { t } = useLanguage()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    } else if (user?.forcePasswordChange) {
      router.push("/change-password")
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect
  }

  const stats = [
    {
      title: t("staffManagement"),
      value: "12",
      description: "Active staff members",
      icon: Users,
      color: "text-blue-600",
    },
    {
      title: t("inventory"),
      value: "234",
      description: "Products in stock",
      icon: Package,
      color: "text-green-600",
    },
    {
      title: "Sales Today",
      value: "45,000 XAF",
      description: "Total sales today",
      icon: ShoppingCart,
      color: "text-purple-600",
    },
    {
      title: "Orders",
      value: "28",
      description: "Orders processed today",
      icon: BarChart3,
      color: "text-orange-600",
    },
  ]

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{t("dashboard")}</h2>
          <p className="text-muted-foreground">
            {t("welcome")}, {user.name}! Here's what's happening at Platinum Lounge today.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none">New order from Table 5</p>
                    <p className="text-sm text-muted-foreground">2 minutes ago</p>
                  </div>
                  <div className="ml-auto font-medium">12,500 XAF</div>
                </div>
                <div className="flex items-center">
                  <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none">Stock updated: Whiskey</p>
                    <p className="text-sm text-muted-foreground">5 minutes ago</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none">New staff member added</p>
                    <p className="text-sm text-muted-foreground">1 hour ago</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks for your role</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {user.role === "Super Admin" || user.role === "Manager" ? (
                  <>
                    <button className="w-full text-left p-2 hover:bg-gray-100 rounded">Add new staff member</button>
                    <button className="w-full text-left p-2 hover:bg-gray-100 rounded">View sales report</button>
                    <button className="w-full text-left p-2 hover:bg-gray-100 rounded">Manage inventory</button>
                  </>
                ) : null}
                {user.role === "Waitress" ? (
                  <>
                    <button className="w-full text-left p-2 hover:bg-gray-100 rounded">Take new order</button>
                    <button className="w-full text-left p-2 hover:bg-gray-100 rounded">View table status</button>
                  </>
                ) : null}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
