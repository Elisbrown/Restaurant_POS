"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { Clock, ChefHat, CheckCircle, AlertCircle } from "lucide-react"
import type { Order } from "@/lib/models"

interface KitchenOrder extends Order {
  estimatedTime?: number
  priority?: "LOW" | "MEDIUM" | "HIGH"
}

export function KitchenDashboard() {
  const [orders, setOrders] = useState<{
    pending: KitchenOrder[]
    processing: KitchenOrder[]
    complete: KitchenOrder[]
  }>({
    pending: [],
    processing: [],
    complete: [],
  })
  const [draggedOrder, setDraggedOrder] = useState<KitchenOrder | null>(null)
  const [notification, setNotification] = useState<string | null>(null)

  const { user } = useAuth()

  useEffect(() => {
    fetchOrders()
    const interval = setInterval(fetchOrders, 10000) // Refresh every 10 seconds
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    // Listen for new orders
    const eventSource = new EventSource("/api/kitchen/orders/stream")

    eventSource.onmessage = (event) => {
      const newOrder = JSON.parse(event.data)
      if (newOrder.type === "NEW_ORDER") {
        playNotificationSound()
        setNotification(`New order for Table ${newOrder.order.tableNumber}`)
        fetchOrders()

        // Clear notification after 5 seconds
        setTimeout(() => setNotification(null), 5000)
      }
    }

    return () => eventSource.close()
  }, [])

  const fetchOrders = async () => {
    try {
      const response = await fetch("/api/kitchen/orders")
      if (response.ok) {
        const data = await response.json()
        setOrders(data)
      }
    } catch (error) {
      console.error("Error fetching kitchen orders:", error)
    }
  }

  const playNotificationSound = () => {
    const audio = new Audio("/notification-sound.mp3")
    audio.play().catch(console.error)
  }

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/kitchen/orders/${orderId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          updatedBy: user?.name,
        }),
      })

      if (response.ok) {
        fetchOrders()

        // Notify waitress if order is ready
        if (newStatus === "READY") {
          await fetch("/api/notifications/order-ready", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderId }),
          })
        }
      }
    } catch (error) {
      console.error("Error updating order status:", error)
    }
  }

  const handleDragStart = (order: KitchenOrder) => {
    setDraggedOrder(order)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent, newStatus: string) => {
    e.preventDefault()
    if (draggedOrder) {
      updateOrderStatus(draggedOrder._id!, newStatus)
      setDraggedOrder(null)
    }
  }

  const getOrderPriority = (order: KitchenOrder): "LOW" | "MEDIUM" | "HIGH" => {
    const orderTime = new Date(order.createdAt).getTime()
    const now = Date.now()
    const minutesAgo = (now - orderTime) / (1000 * 60)

    if (minutesAgo > 30) return "HIGH"
    if (minutesAgo > 15) return "MEDIUM"
    return "LOW"
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "HIGH":
        return "bg-red-100 border-red-300"
      case "MEDIUM":
        return "bg-yellow-100 border-yellow-300"
      default:
        return "bg-green-100 border-green-300"
    }
  }

  const formatOrderTime = (createdAt: string) => {
    const orderTime = new Date(createdAt)
    const now = new Date()
    const diffMinutes = Math.floor((now.getTime() - orderTime.getTime()) / (1000 * 60))

    if (diffMinutes < 1) return "Just now"
    if (diffMinutes === 1) return "1 minute ago"
    return `${diffMinutes} minutes ago`
  }

  const OrderCard = ({ order, status }: { order: KitchenOrder; status: string }) => {
    const priority = getOrderPriority(order)

    return (
      <Card
        className={`mb-4 cursor-move hover:shadow-lg transition-shadow ${getPriorityColor(priority)}`}
        draggable
        onDragStart={() => handleDragStart(order)}
      >
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg">{order.orderNumber}</CardTitle>
              <p className="text-sm text-gray-600">
                Table {order.tableNumber} • {order.waiterName}
              </p>
            </div>
            <div className="flex flex-col items-end space-y-1">
              <Badge variant={priority === "HIGH" ? "destructive" : priority === "MEDIUM" ? "secondary" : "default"}>
                {priority}
              </Badge>
              <span className="text-xs text-gray-500">{formatOrderTime(order.createdAt)}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="text-sm">
              <p className="font-medium mb-1">Items ({order.items.length}):</p>
              <div className="space-y-1">
                {order.items.map((item, index) => (
                  <div key={index} className="flex justify-between text-xs">
                    <span className="font-medium">
                      {item.quantity}x {item.productName}
                    </span>
                    {item.notes && <span className="text-gray-500 italic">"{item.notes}"</span>}
                  </div>
                ))}
              </div>
            </div>

            {order.specialInstructions && (
              <div className="bg-yellow-50 p-2 rounded text-xs">
                <p className="font-medium text-yellow-800">Special Instructions:</p>
                <p className="text-yellow-700">{order.specialInstructions}</p>
              </div>
            )}

            {order.notes && (
              <div className="bg-blue-50 p-2 rounded text-xs">
                <p className="font-medium text-blue-800">Order Notes:</p>
                <p className="text-blue-700">{order.notes}</p>
              </div>
            )}

            {/* Quick Action Buttons */}
            <div className="flex space-x-2 pt-2">
              {status === "PENDING" && (
                <Button size="sm" onClick={() => updateOrderStatus(order._id!, "PROCESSING")} className="flex-1">
                  <ChefHat className="mr-1 h-3 w-3" />
                  Start Cooking
                </Button>
              )}
              {status === "PROCESSING" && (
                <Button size="sm" onClick={() => updateOrderStatus(order._id!, "READY")} className="flex-1">
                  <CheckCircle className="mr-1 h-3 w-3" />
                  Mark Ready
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="p-6 h-screen bg-gray-50">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Kitchen Dashboard</h2>
        <p className="text-gray-600">Manage order preparation and cooking status</p>
      </div>

      {/* New Order Notification */}
      {notification && (
        <div className="fixed top-4 right-4 bg-red-500 text-white p-4 rounded-lg shadow-lg z-50 animate-pulse">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5" />
            <span className="font-medium">{notification}</span>
          </div>
        </div>
      )}

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
        {/* Pending Column */}
        <div
          className="bg-white rounded-lg shadow-sm border-2 border-dashed border-gray-200 p-4"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, "PENDING")}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center">
              <Clock className="mr-2 h-5 w-5 text-orange-500" />
              Pending ({orders.pending.length})
            </h3>
            <Badge variant="secondary" className="bg-orange-100 text-orange-800">
              New Orders
            </Badge>
          </div>
          <div className="space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
            {orders.pending.map((order) => (
              <OrderCard key={order._id} order={order} status="PENDING" />
            ))}
            {orders.pending.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No pending orders</p>
              </div>
            )}
          </div>
        </div>

        {/* Processing Column */}
        <div
          className="bg-white rounded-lg shadow-sm border-2 border-dashed border-gray-200 p-4"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, "PROCESSING")}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center">
              <ChefHat className="mr-2 h-5 w-5 text-blue-500" />
              Processing ({orders.processing.length})
            </h3>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              Cooking
            </Badge>
          </div>
          <div className="space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
            {orders.processing.map((order) => (
              <OrderCard key={order._id} order={order} status="PROCESSING" />
            ))}
            {orders.processing.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                <ChefHat className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No orders being processed</p>
              </div>
            )}
          </div>
        </div>

        {/* Complete Column */}
        <div
          className="bg-white rounded-lg shadow-sm border-2 border-dashed border-gray-200 p-4"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, "READY")}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center">
              <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
              Ready ({orders.complete.length})
            </h3>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              Ready to Serve
            </Badge>
          </div>
          <div className="space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
            {orders.complete.map((order) => (
              <OrderCard key={order._id} order={order} status="READY" />
            ))}
            {orders.complete.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No completed orders</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
