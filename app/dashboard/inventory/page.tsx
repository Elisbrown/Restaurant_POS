"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { useLanguage } from "@/contexts/language-context"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Package, FolderOpen, AlertTriangle, TrendingUp } from "lucide-react"

export default function InventoryPage() {
  const { user, isLoading } = useAuth()
  const { t } = useLanguage()
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

  const inventoryModules = [
    {
      title: t("products"),
      description: "Manage product catalog, pricing, and stock levels",
      icon: Package,
      href: "/dashboard/inventory/products",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: t("categories"),
      description: "Organize products into categories and subcategories",
      icon: FolderOpen,
      href: "/dashboard/inventory/categories",
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: t("lowStockAlerts"),
      description: "Monitor products with low stock levels",
      icon: AlertTriangle,
      href: "/dashboard/inventory/low-stock",
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
    },
    {
      title: t("stockMovements"),
      description: "Track all inventory movements and adjustments",
      icon: TrendingUp,
      href: "/dashboard/inventory/movements",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
  ]

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{t("inventory")}</h2>
          <p className="text-muted-foreground">Manage your product catalog, stock levels, and inventory movements</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
          {inventoryModules.map((module, index) => (
            <Card key={index} className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-medium">{module.title}</CardTitle>
                <div className={`p-2 rounded-lg ${module.bgColor}`}>
                  <module.icon className={`h-6 w-6 ${module.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-4">{module.description}</CardDescription>
                <Button onClick={() => router.push(module.href)} className="w-full">
                  Open {module.title}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">--</div>
              <p className="text-xs text-muted-foreground">Active products in catalog</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Categories</CardTitle>
              <FolderOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">--</div>
              <p className="text-xs text-muted-foreground">Product categories</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">--</div>
              <p className="text-xs text-muted-foreground">Items below minimum level</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">-- XAF</div>
              <p className="text-xs text-muted-foreground">Current inventory value</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
