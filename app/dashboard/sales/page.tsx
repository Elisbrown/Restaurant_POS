"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { DollarSign, ShoppingCart, Users, Clock, TrendingUp } from "lucide-react"
import type { Order, Table } from "@/lib/models"

export default function SalesDashboard() {
  const [orders, setOrders] = useState<Order[]>([])
  const [tables, setTables] = useState<Table[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const [ordersResponse, tablesResponse] = await Promise.all([
        fetch("/api/sales/orders?limit=100"),
        fetch("/api/sales/tables"),
      ])

      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json()
        setOrders(ordersData.orders || ordersData)
      }

      if (tablesResponse.ok) {
        const tablesData = await tablesResponse.json()
        setTables(tablesData)
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  const today = new Date().toDateString()
  const todayOrders = orders.filter((order) => new Date(order.createdAt).toDateString() === today)
  const completedToday = todayOrders.filter((order) => order.status === "COMPLETED")
  const pendingOrders = orders.filter((order) => ["PENDING", "CONFIRMED", "PREPARING"].includes(order.status))
  const todayRevenue = completedToday.reduce((sum, order) => sum + order.total, 0)

  const tableStats = {
    total: tables.length,
    available: tables.filter((t) => t.status === "AVAILABLE").length,
    occupied: tables.filter((t) => t.status === "OCCUPIED").length,
    reserved: tables.filter((t) => t.status === "RESERVED").length,
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800"
      case "CONFIRMED":
      case "PREPARING":
        return "bg-blue-100 text-blue-800"
      case "READY":
        return "bg-green-100 text-green-800"
      case "COMPLETED":
        return "bg-green-100 text-green-800"
      case "CANCELLED":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Sales Dashboard</h1>
        <div className="flex space-x-2">
          <Button onClick={() => (window.location.href = "/dashboard/sales/orders/new")}>New Order</Button>
          <Button variant="outline" onClick={() => (window.location.href = "/dashboard/sales/tables")}>
            Manage Tables
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{todayRevenue.toLocaleString()} XAF</div>
            <p className="text-xs text-muted-foreground">From {completedToday.length} completed orders</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayOrders.length}</div>
            <p className="text-xs text-muted-foreground">
              {completedToday.length} completed, {pendingOrders.length} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Table Occupancy</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tableStats.occupied}/{tableStats.total}
            </div>
            <p className="text-xs text-muted-foreground">
              {Math.round((tableStats.occupied / tableStats.total) * 100)}% occupied
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingOrders.length}</div>
            <p className="text-xs text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Recent Orders
              <Button variant="outline" size="sm" onClick={() => (window.location.href = "/dashboard/sales/orders")}>
                View All
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {orders.slice(0, 5).map((order) => (
                <div key={order._id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{order.orderNumber}</span>
                      <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                    </div>
                    <div className="text-sm text-gray-500">
                      {order.type === "DINE_IN" ? `Table ${order.tableNumber}` : order.type} •{order.items.length} items
                      •{order.customerName || "Walk-in"}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{order.total.toLocaleString()} XAF</div>
                    <div className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleTimeString()}</div>
                  </div>
                </div>
              ))}
              {orders.length === 0 && <div className="text-center text-gray-500 py-4">No orders yet today</div>}
            </div>
          </CardContent>
        </Card>

        {/* Table Status Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Table Status
              <Button variant="outline" size="sm" onClick={() => (window.location.href = "/dashboard/sales/tables")}>
                Manage Tables
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{tableStats.available}</div>
                  <div className="text-sm text-green-700">Available</div>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{tableStats.occupied}</div>
                  <div className="text-sm text-red-700">Occupied</div>
                </div>
              </div>

              <div className="space-y-2">
                {tables
                  .filter((t) => t.status === "OCCUPIED")
                  .slice(0, 3)
                  .map((table) => (
                    <div key={table._id} className="flex items-center justify-between p-2 bg-red-50 rounded">
                      <span className="font-medium">Table {table.number}</span>
                      <span className="text-sm text-red-600">{table.floor}</span>
                    </div>
                  ))}
                {tableStats.occupied > 3 && (
                  <div className="text-center text-sm text-gray-500">
                    +{tableStats.occupied - 3} more occupied tables
                  </div>
                )}
              </div>
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
          <div className="grid gap-4 md:grid-cols-3">
            <Button
              className="h-20 flex flex-col items-center justify-center"
              onClick={() => (window.location.href = "/dashboard/sales/orders/new")}
            >
              <ShoppingCart className="h-6 w-6 mb-2" />
              New Order
            </Button>
            <Button
              variant="outline"
              className="h-20 flex flex-col items-center justify-center bg-transparent"
              onClick={() => (window.location.href = "/dashboard/sales/tables")}
            >
              <Users className="h-6 w-6 mb-2" />
              Table Management
            </Button>
            <Button
              variant="outline"
              className="h-20 flex flex-col items-center justify-center bg-transparent"
              onClick={() => (window.location.href = "/dashboard/sales/orders")}
            >
              <TrendingUp className="h-6 w-6 mb-2" />
              View All Orders
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
