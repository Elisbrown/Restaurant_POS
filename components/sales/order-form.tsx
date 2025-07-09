"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useLanguage } from "@/contexts/language-context"
import { useAuth } from "@/contexts/auth-context"
import { Plus, Minus, Trash2, Search } from "lucide-react"
import type { Order, OrderItem, Product, Table } from "@/lib/models"

interface OrderFormProps {
  order?: Order
  tableId?: string
  onSubmit: (orderData: Partial<Order>) => void
  onCancel: () => void
}

export function OrderForm({ order, tableId, onSubmit, onCancel }: OrderFormProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [tables, setTables] = useState<Table[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [orderItems, setOrderItems] = useState<OrderItem[]>(order?.items || [])
  const [formData, setFormData] = useState({
    tableId: order?.tableId || tableId || "",
    customerName: order?.customerName || "",
    customerPhone: order?.customerPhone || "",
    type: order?.type || "DINE_IN",
    notes: order?.notes || "",
    specialInstructions: order?.specialInstructions || "",
  })

  const { t } = useLanguage()
  const { user } = useAuth()

  const orderTypes = [
    { value: "DINE_IN", label: "Dine In" },
    { value: "TAKEAWAY", label: "Takeaway" },
    { value: "DELIVERY", label: "Delivery" },
  ]

  useEffect(() => {
    fetchProducts()
    fetchTables()
  }, [])

  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/inventory/products?active=true&available=true")
      if (response.ok) {
        const data = await response.json()
        setProducts(data)
      }
    } catch (error) {
      console.error("Error fetching products:", error)
    }
  }

  const fetchTables = async () => {
    try {
      const response = await fetch("/api/sales/tables?status=AVAILABLE")
      if (response.ok) {
        const data = await response.json()
        setTables(data)
      }
    } catch (error) {
      console.error("Error fetching tables:", error)
    }
  }

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.nameEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase())

    return matchesSearch && product.stockQuantity > 0
  })

  const addToOrder = (product: Product) => {
    const existingItem = orderItems.find((item) => item.productId === product._id)

    if (existingItem) {
      setOrderItems(
        orderItems.map((item) =>
          item.productId === product._id
            ? { ...item, quantity: item.quantity + 1, totalPrice: (item.quantity + 1) * item.unitPrice }
            : item,
        ),
      )
    } else {
      const newItem: OrderItem = {
        productId: product._id!,
        productName: product.name,
        productNameFr: product.nameFr,
        sku: product.sku,
        quantity: 1,
        unitPrice: product.price,
        totalPrice: product.price,
        status: "PENDING",
      }
      setOrderItems([...orderItems, newItem])
    }
  }

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromOrder(productId)
      return
    }

    setOrderItems(
      orderItems.map((item) =>
        item.productId === productId
          ? { ...item, quantity: newQuantity, totalPrice: newQuantity * item.unitPrice }
          : item,
      ),
    )
  }

  const removeFromOrder = (productId: string) => {
    setOrderItems(orderItems.filter((item) => item.productId !== productId))
  }

  const calculateTotals = () => {
    const subtotal = orderItems.reduce((sum, item) => sum + item.totalPrice, 0)
    const tax = subtotal * 0.1925 // 19.25% VAT in Cameroon
    const total = subtotal + tax

    return { subtotal, tax, total }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (orderItems.length === 0) {
      alert("Please add at least one item to the order")
      return
    }

    const { subtotal, tax, total } = calculateTotals()

    const orderData: Partial<Order> = {
      ...formData,
      items: orderItems,
      subtotal,
      tax,
      discount: 0,
      total,
      status: "PENDING",
      paymentStatus: "PENDING",
      waiterName: user?.name,
    }

    onSubmit(orderData)
  }

  const { subtotal, tax, total } = calculateTotals()

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Product Selection */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Select Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Search className="h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="max-h-96 overflow-y-auto space-y-2">
                {filteredProducts.map((product) => (
                  <div
                    key={product._id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => addToOrder(product)}
                  >
                    <div className="flex-1">
                      <h4 className="font-medium">{product.name}</h4>
                      <p className="text-sm text-gray-500">{product.nameEn}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="outline">{product.sku}</Badge>
                        <span className="text-xs text-gray-500">Stock: {product.stockQuantity}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{product.price.toLocaleString()} XAF</div>
                      <Button size="sm" variant="outline">
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Order Details */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Order Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="type">Order Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {orderTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formData.type === "DINE_IN" && (
                <div>
                  <Label htmlFor="tableId">Table</Label>
                  <Select
                    value={formData.tableId}
                    onValueChange={(value) => setFormData({ ...formData, tableId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select table" />
                    </SelectTrigger>
                    <SelectContent>
                      {tables.map((table) => (
                        <SelectItem key={table._id} value={table._id!}>
                          Table {table.number} - {table.name} ({table.floor})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <Label htmlFor="customerName">Customer Name</Label>
                <Input
                  id="customerName"
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  placeholder="Optional"
                />
              </div>

              <div>
                <Label htmlFor="customerPhone">Customer Phone</Label>
                <Input
                  id="customerPhone"
                  value={formData.customerPhone}
                  onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                  placeholder="Optional"
                />
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Order notes..."
                />
              </div>

              <div>
                <Label htmlFor="specialInstructions">Special Instructions</Label>
                <Textarea
                  id="specialInstructions"
                  value={formData.specialInstructions}
                  onChange={(e) => setFormData({ ...formData, specialInstructions: e.target.value })}
                  placeholder="Kitchen instructions..."
                />
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Order Items */}
        <Card>
          <CardHeader>
            <CardTitle>Order Items ({orderItems.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {orderItems.map((item) => (
                <div key={item.productId} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium">{item.productName}</h4>
                    <p className="text-sm text-gray-500">{item.sku}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center">{item.quantity}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                    <div className="w-20 text-right font-medium">{item.totalPrice.toLocaleString()} XAF</div>
                    <Button size="sm" variant="ghost" onClick={() => removeFromOrder(item.productId)}>
                      <Trash2 className="h-3 w-3 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}

              {orderItems.length === 0 && (
                <div className="text-center text-gray-500 py-8">No items added to order yet</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Order Summary */}
        {orderItems.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{subtotal.toLocaleString()} XAF</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax (19.25%):</span>
                  <span>{tax.toLocaleString()} XAF</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Total:</span>
                  <span>{total.toLocaleString()} XAF</span>
                </div>
              </div>

              <div className="flex space-x-2 mt-4">
                <Button type="button" variant="outline" onClick={onCancel} className="flex-1 bg-transparent">
                  Cancel
                </Button>
                <Button onClick={handleSubmit} className="flex-1">
                  {order ? "Update" : "Create"} Order
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
