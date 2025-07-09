"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useLanguage } from "@/contexts/language-context"
import { DollarSign, TrendingUp, Package, Users, ShoppingCart, AlertTriangle, Calendar, Download } from "lucide-react"
import { SalesChart } from "./sales-chart"
import { TopProductsChart } from "./top-products-chart"
import { StaffPerformanceChart } from "./staff-performance-chart"

interface DashboardData {
  kpis: {
    todaySales: number
    weekSales: number
    monthSales: number
    todayOrders: number
    weekOrders: number
    monthOrders: number
    activeStaff: number
    lowStockItems: number
  }
  salesTrend: {
    date: string
    sales: number
    orders: number
  }[]
  topProducts: {
    productName: string
    quantity: number
    revenue: number
  }[]
  staffPerformance: {
    staffName: string
    sales: number
    orders: number
    avgOrderValue: number
  }[]
  lowStockAlerts: {
    productName: string
    currentStock: number
    minStock: number
    category: string
  }[]
}

export function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState("7d")
  const { t } = useLanguage()

  useEffect(() => {
    fetchDashboardData()
  }, [timeRange])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/dashboard/analytics?range=${timeRange}`)
      if (response.ok) {
        const dashboardData = await response.json()
        setData(dashboardData)
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  const exportDashboard = async (format: "csv" | "pdf") => {
    try {
      const response = await fetch(`/api/dashboard/export?format=${format}&range=${timeRange}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `dashboard-report-${new Date().toISOString().split("T")[0]}.${format}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error("Error exporting dashboard:", error)
    }
  }

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString()} XAF`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  if (!data) {
    return <div className="text-center text-gray-500">Failed to load dashboard data</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h2>
          <p className="text-muted-foreground">Comprehensive business insights and performance metrics</p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1d">Today</SelectItem>
              <SelectItem value="7d">7 Days</SelectItem>
              <SelectItem value="30d">30 Days</SelectItem>
              <SelectItem value="90d">90 Days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => exportDashboard("csv")}>
            <Download className="mr-2 h-4 w-4" />
            CSV
          </Button>
          <Button variant="outline" onClick={() => exportDashboard("pdf")}>
            <Download className="mr-2 h-4 w-4" />
            PDF
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Sales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(data.kpis.todaySales)}</div>
            <p className="text-xs text-muted-foreground">{data.kpis.todayOrders} orders today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Weekly Sales</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(data.kpis.weekSales)}</div>
            <p className="text-xs text-muted-foreground">{data.kpis.weekOrders} orders this week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Sales</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{formatCurrency(data.kpis.monthSales)}</div>
            <p className="text-xs text-muted-foreground">{data.kpis.monthOrders} orders this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{data.kpis.lowStockItems}</div>
            <p className="text-xs text-muted-foreground">Items need restocking</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Sales Trend</CardTitle>
            <CardDescription>Daily sales performance over the selected period</CardDescription>
          </CardHeader>
          <CardContent>
            <SalesChart data={data.salesTrend} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Selling Products</CardTitle>
            <CardDescription>Best performing products by revenue</CardDescription>
          </CardHeader>
          <CardContent>
            <TopProductsChart data={data.topProducts} />
          </CardContent>
        </Card>
      </div>

      {/* Staff Performance and Low Stock */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Staff Performance</CardTitle>
            <CardDescription>Individual staff sales performance</CardDescription>
          </CardHeader>
          <CardContent>
            <StaffPerformanceChart data={data.staffPerformance} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Low Stock Alerts
              <Button
                variant="outline"
                size="sm"
                onClick={() => (window.location.href = "/dashboard/inventory/low-stock")}
              >
                View All
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.lowStockAlerts.slice(0, 5).map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{item.productName}</div>
                    <div className="text-sm text-gray-500">{item.category}</div>
                  </div>
                  <div className="text-right">
                    <Badge variant="destructive" className="text-xs">
                      {item.currentStock}/{item.minStock}
                    </Badge>
                  </div>
                </div>
              ))}
              {data.lowStockAlerts.length === 0 && (
                <div className="text-center text-gray-500 py-4">All products are well stocked</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <Button
              className="h-20 flex flex-col items-center justify-center"
              onClick={() => (window.location.href = "/dashboard/reports/sales")}
            >
              <ShoppingCart className="h-6 w-6 mb-2" />
              Sales Reports
            </Button>
            <Button
              variant="outline"
              className="h-20 flex flex-col items-center justify-center bg-transparent"
              onClick={() => (window.location.href = "/dashboard/reports/inventory")}
            >
              <Package className="h-6 w-6 mb-2" />
              Inventory Reports
            </Button>
            <Button
              variant="outline"
              className="h-20 flex flex-col items-center justify-center bg-transparent"
              onClick={() => (window.location.href = "/dashboard/reports/staff")}
            >
              <Users className="h-6 w-6 mb-2" />
              Staff Reports
            </Button>
            <Button
              variant="outline"
              className="h-20 flex flex-col items-center justify-center bg-transparent"
              onClick={() => (window.location.href = "/dashboard/reports/activity")}
            >
              <AlertTriangle className="h-6 w-6 mb-2" />
              Activity Logs
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
