"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/contexts/auth-context"
import { useLanguage } from "@/contexts/language-context"
import { Plus, Minus, ShoppingCart, AlertTriangle, Users, Clock } from "lucide-react"
import type { Product, Table, OrderItem, Category } from "@/lib/models"

export function POSInterface() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [tables, setTables] = useState<Table[]>([])
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedTable, setSelectedTable] = useState<Table | null>(null)
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [orderNotes, setOrderNotes] = useState("")
  const [specialInstructions, setSpecialInstructions] = useState("")
  const [customerName, setCustomerName] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [showTableDialog, setShowTableDialog] = useState(false)
  const [showOrderDialog, setShowOrderDialog] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const { user } = useAuth()
  const { t } = useLanguage()

  useEffect(() => {
    fetchProducts()
    fetchCategories()
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

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/inventory/categories?active=true")
      if (response.ok) {
        const data = await response.json()
        setCategories(data)
      }
    } catch (error) {
      console.error("Error fetching categories:", error)
    }
  }

  const fetchTables = async () => {
    try {
      const response = await fetch(`/api/sales/tables?floor=${user?.assignedFloor || "all"}`)
      if (response.ok) {
        const data = await response.json()
        setTables(
          data.filter(
            (table: Table) =>
              user?.role === "Manager" ||
              user?.role === "Super Admin" ||
              !user?.assignedFloor ||
              table.floor === user.assignedFloor,
          ),
        )
      }
    } catch (error) {
      console.error("Error fetching tables:", error)
    }
  }

  const filteredProducts = products.filter((product) => {
    if (selectedCategory === "all") return true
    return product.categoryId === selectedCategory
  })

  const addToOrder = (product: Product) => {
    if (product.stockQuantity <= 0) {
      setMessage({ type: "error", text: "Product is out of stock" })
      return
    }

    const existingItem = orderItems.find((item) => item.productId === product._id)

    if (existingItem) {
      if (existingItem.quantity >= product.stockQuantity) {
        setMessage({ type: "error", text: "Cannot add more items than available in stock" })
        return
      }

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
        productName: product.nameEn,
        productNameFr: product.nameFr,
        sku: product.sku,
        quantity: 1,
        unitPrice: product.price,
        totalPrice: product.price,
        status: "PENDING",
        notes: "",
      }
      setOrderItems([...orderItems, newItem])
    }
  }

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromOrder(productId)
      return
    }

    const product = products.find((p) => p._id === productId)
    if (product && newQuantity > product.stockQuantity) {
      setMessage({ type: "error", text: "Cannot exceed available stock" })
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

  const updateItemNotes = (productId: string, notes: string) => {
    setOrderItems(orderItems.map((item) => (item.productId === productId ? { ...item, notes } : item)))
  }

  const calculateTotal = () => {
    const subtotal = orderItems.reduce((sum, item) => sum + item.totalPrice, 0)
    const tax = subtotal * 0.1925 // 19.25% VAT in Cameroon
    return { subtotal, tax, total: subtotal + tax }
  }

  const submitOrder = async () => {
    if (!selectedTable) {
      setMessage({ type: "error", text: "Please select a table" })
      return
    }

    if (orderItems.length === 0) {
      setMessage({ type: "error", text: "Please add items to the order" })
      return
    }

    setLoading(true)
    try {
      const { subtotal, tax, total } = calculateTotal()

      const orderData = {
        tableId: selectedTable._id,
        tableNumber: selectedTable.number,
        customerName,
        customerPhone,
        type: "DINE_IN",
        items: orderItems,
        subtotal,
        tax,
        total,
        notes: orderNotes,
        specialInstructions,
        waiterName: user?.name,
        waiterId: user?.id,
        status: "PENDING",
        paymentStatus: "PENDING",
      }

      const response = await fetch("/api/sales/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      })

      if (response.ok) {
        const order = await response.json()
        setMessage({ type: "success", text: `Order ${order.orderNumber} created successfully!` })

        // Reset form
        setOrderItems([])
        setSelectedTable(null)
        setCustomerName("")
        setCustomerPhone("")
        setOrderNotes("")
        setSpecialInstructions("")
        setShowOrderDialog(false)

        // Refresh tables to update status
        fetchTables()

        // Play notification sound for kitchen
        playNotificationSound()
      } else {
        const error = await response.json()
        setMessage({ type: "error", text: error.message || "Failed to create order" })
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to create order" })
    } finally {
      setLoading(false)
    }
  }

  const playNotificationSound = () => {
    const audio = new Audio("/notification-sound.mp3")
    audio.play().catch(console.error)
  }

  const getStockBadge = (product: Product) => {
    if (product.stockQuantity === 0) {
      return (
        <Badge variant="destructive" className="absolute top-2 right-2">
          Out of Stock
        </Badge>
      )
    } else if (product.stockQuantity <= product.minStockLevel) {
      return (
        <Badge variant="secondary" className="absolute top-2 right-2 bg-yellow-100 text-yellow-800">
          Low Stock
        </Badge>
      )
    }
    return null
  }

  const { subtotal, tax, total } = calculateTotal()

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Product Grid */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="mb-4">
          <h2 className="text-2xl font-bold mb-4">Point of Sale</h2>

          {message && (
            <Alert variant={message.type === "error" ? "destructive" : "default"} className="mb-4">
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          )}

          {/* Category Filter */}
          <div className="flex space-x-2 mb-4 overflow-x-auto">
            <Button
              variant={selectedCategory === "all" ? "default" : "outline"}
              onClick={() => setSelectedCategory("all")}
              className="whitespace-nowrap"
            >
              All Categories
            </Button>
            {categories.map((category) => (
              <Button
                key={category._id}
                variant={selectedCategory === category._id ? "default" : "outline"}
                onClick={() => setSelectedCategory(category._id!)}
                className="whitespace-nowrap"
              >
                {category.nameEn}
              </Button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredProducts.map((product) => (
            <Card
              key={product._id}
              className={`cursor-pointer hover:shadow-lg transition-shadow relative ${
                product.stockQuantity <= product.minStockLevel ? "ring-2 ring-yellow-400" : ""
              } ${product.stockQuantity === 0 ? "ring-2 ring-red-400 opacity-50" : ""}`}
              onClick={() => addToOrder(product)}
            >
              <div className="relative">
                <img
                  src={product.images?.[0] || "/placeholder.svg?height=120&width=120"}
                  alt={product.nameEn}
                  className="w-full h-32 object-cover rounded-t-lg"
                  style={{ aspectRatio: "1:1" }}
                />
                {getStockBadge(product)}
                {product.stockQuantity <= product.minStockLevel && product.stockQuantity > 0 && (
                  <AlertTriangle className="absolute top-2 left-2 h-5 w-5 text-yellow-500" />
                )}
              </div>
              <CardContent className="p-3">
                <h3 className="font-medium text-sm mb-1 line-clamp-2">{product.nameEn}</h3>
                <p className="text-xs text-gray-500 mb-2">{product.nameFr}</p>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-green-600">{product.price.toLocaleString()} XAF</span>
                  <Badge variant="outline" className="text-xs">
                    Stock: {product.stockQuantity}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Order Panel */}
      <div className="w-96 bg-white border-l shadow-lg flex flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Current Order</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTableDialog(true)}
              className="flex items-center space-x-2"
            >
              <Users className="h-4 w-4" />
              <span>{selectedTable ? `Table ${selectedTable.number}` : "Select Table"}</span>
            </Button>
          </div>

          {selectedTable && (
            <div className="text-sm text-gray-600 mb-2">
              <p>Floor: {selectedTable.floor}</p>
              <p>Capacity: {selectedTable.capacity} people</p>
            </div>
          )}
        </div>

        {/* Order Items */}
        <div className="flex-1 overflow-y-auto p-4">
          {orderItems.length === 0 ? (
            <div className="text-center text-gray-500 mt-8">
              <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No items in order</p>
            </div>
          ) : (
            <div className="space-y-3">
              {orderItems.map((item) => (
                <Card key={item.productId} className="p-3">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{item.productName}</h4>
                      <p className="text-xs text-gray-500">{item.sku}</p>
                    </div>
                    <span className="font-medium">{item.totalPrice.toLocaleString()} XAF</span>
                  </div>

                  <div className="flex items-center justify-between mb-2">
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
                    </div>
                    <span className="text-sm text-gray-500">{item.unitPrice.toLocaleString()} XAF each</span>
                  </div>

                  <Input
                    placeholder="Item notes..."
                    value={item.notes || ""}
                    onChange={(e) => updateItemNotes(item.productId, e.target.value)}
                    className="text-xs"
                  />
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Order Summary */}
        {orderItems.length > 0 && (
          <div className="border-t p-4">
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>{subtotal.toLocaleString()} XAF</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Tax (19.25%):</span>
                <span>{tax.toLocaleString()} XAF</span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>Total:</span>
                <span>{total.toLocaleString()} XAF</span>
              </div>
            </div>

            <Button
              onClick={() => setShowOrderDialog(true)}
              className="w-full"
              disabled={!selectedTable || orderItems.length === 0}
            >
              <Clock className="mr-2 h-4 w-4" />
              Place Order
            </Button>
          </div>
        )}
      </div>

      {/* Table Selection Dialog */}
      <Dialog open={showTableDialog} onOpenChange={setShowTableDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Select Table</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-4 md:grid-cols-6 gap-4 max-h-96 overflow-y-auto">
            {tables.map((table) => (
              <Card
                key={table._id}
                className={`cursor-pointer hover:shadow-lg transition-shadow ${
                  selectedTable?._id === table._id ? "ring-2 ring-blue-500" : ""
                } ${
                  table.status === "OCCUPIED"
                    ? "bg-red-50 border-red-200"
                    : table.status === "RESERVED"
                      ? "bg-yellow-50 border-yellow-200"
                      : "bg-green-50 border-green-200"
                }`}
                onClick={() => {
                  if (table.status === "AVAILABLE") {
                    setSelectedTable(table)
                    setShowTableDialog(false)
                  }
                }}
              >
                <CardContent className="p-4 text-center">
                  <div className="text-lg font-bold mb-1">Table {table.number}</div>
                  <div className="text-sm text-gray-600 mb-2">{table.name}</div>
                  <div className="text-xs text-gray-500 mb-2">Floor: {table.floor}</div>
                  <Badge
                    variant={
                      table.status === "AVAILABLE"
                        ? "default"
                        : table.status === "OCCUPIED"
                          ? "destructive"
                          : "secondary"
                    }
                    className="text-xs"
                  >
                    {table.status}
                  </Badge>
                  <div className="text-xs text-gray-500 mt-1">Capacity: {table.capacity}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Order Confirmation Dialog */}
      <Dialog open={showOrderDialog} onOpenChange={setShowOrderDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Order</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="customerName">Customer Name (Optional)</Label>
              <Input
                id="customerName"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Customer name"
              />
            </div>

            <div>
              <Label htmlFor="customerPhone">Customer Phone (Optional)</Label>
              <Input
                id="customerPhone"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="Phone number"
              />
            </div>

            <div>
              <Label htmlFor="orderNotes">Order Notes</Label>
              <Textarea
                id="orderNotes"
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                placeholder="General order notes..."
              />
            </div>

            <div>
              <Label htmlFor="specialInstructions">Kitchen Instructions</Label>
              <Textarea
                id="specialInstructions"
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                placeholder="Special cooking instructions..."
              />
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between font-bold text-lg mb-4">
                <span>Total:</span>
                <span>{total.toLocaleString()} XAF</span>
              </div>

              <div className="flex space-x-2">
                <Button variant="outline" onClick={() => setShowOrderDialog(false)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={submitOrder} disabled={loading} className="flex-1">
                  {loading ? "Placing..." : "Confirm Order"}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
