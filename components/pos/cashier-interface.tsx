"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useAuth } from "@/contexts/auth-context"
import { Clock, DollarSign, CreditCard, Smartphone, Building, Receipt, Printer } from "lucide-react"
import type { Order, Payment } from "@/lib/models"

export function CashierInterface() {
  const [pendingOrders, setPendingOrders] = useState<Order[]>([])
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [showReceiptDialog, setShowReceiptDialog] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "MOBILE_MONEY" | "ORANGE_MONEY" | "BANK_TRANSFER">("CASH")
  const [paymentAmount, setPaymentAmount] = useState("")
  const [reference, setReference] = useState("")
  const [discount, setDiscount] = useState(0)
  const [splitPayments, setSplitPayments] = useState<Payment[]>([])
  const [receipt, setReceipt] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const { user } = useAuth()

  useEffect(() => {
    fetchPendingOrders()
    const interval = setInterval(fetchPendingOrders, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const fetchPendingOrders = async () => {
    try {
      const response = await fetch("/api/sales/orders?status=READY&paymentStatus=PENDING")
      if (response.ok) {
        const data = await response.json()
        setPendingOrders(data.orders || [])
      }
    } catch (error) {
      console.error("Error fetching pending orders:", error)
    }
  }

  const markOrderComplete = async (orderId: string) => {
    try {
      const response = await fetch(`/api/sales/orders/${orderId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "COMPLETED" }),
      })

      if (response.ok) {
        fetchPendingOrders()
      }
    } catch (error) {
      console.error("Error updating order status:", error)
    }
  }

  const processPayment = async () => {
    if (!selectedOrder) return

    setLoading(true)
    try {
      const finalAmount = Number.parseFloat(paymentAmount) || selectedOrder.total - discount

      const paymentData = {
        orderId: selectedOrder._id,
        amount: finalAmount,
        method: paymentMethod,
        reference,
        discount,
        processedBy: user?.name,
        transactionId: generateTransactionId(),
      }

      const response = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paymentData),
      })

      if (response.ok) {
        const payment = await response.json()
        setReceipt({
          ...payment,
          order: selectedOrder,
          transactionId: paymentData.transactionId,
        })
        setShowPaymentDialog(false)
        setShowReceiptDialog(true)
        fetchPendingOrders()

        // Update order status to PAID
        await fetch(`/api/sales/orders/${selectedOrder._id}/payment`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentStatus: "PAID", status: "COMPLETED" }),
        })
      }
    } catch (error) {
      console.error("Error processing payment:", error)
    } finally {
      setLoading(false)
    }
  }

  const generateTransactionId = () => {
    return `TXN-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
  }

  const printReceipt = () => {
    window.print()
  }

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case "CASH":
        return <DollarSign className="h-4 w-4" />
      case "MOBILE_MONEY":
        return <Smartphone className="h-4 w-4" />
      case "ORANGE_MONEY":
        return <Smartphone className="h-4 w-4" />
      case "BANK_TRANSFER":
        return <Building className="h-4 w-4" />
      default:
        return <CreditCard className="h-4 w-4" />
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Cashier Dashboard</h2>
        <p className="text-gray-600">Process payments for completed orders</p>
      </div>

      {/* Pending Orders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pendingOrders.map((order) => (
          <Card key={order._id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{order.orderNumber}</CardTitle>
                  <p className="text-sm text-gray-600">
                    Table {order.tableNumber} • {order.waiterName}
                  </p>
                </div>
                <Badge
                  variant={order.status === "READY" ? "default" : "secondary"}
                  className="bg-green-100 text-green-800"
                >
                  {order.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-sm">
                  <p className="font-medium mb-2">Items ({order.items.length}):</p>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex justify-between text-xs">
                        <span>
                          {item.quantity}x {item.productName}
                        </span>
                        <span>{item.totalPrice.toLocaleString()} XAF</span>
                      </div>
                    ))}
                  </div>
                </div>

                {order.notes && (
                  <div className="text-sm">
                    <p className="font-medium">Notes:</p>
                    <p className="text-gray-600 text-xs">{order.notes}</p>
                  </div>
                )}

                <div className="border-t pt-3">
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-bold">Total:</span>
                    <span className="font-bold text-lg">{order.total.toLocaleString()} XAF</span>
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => markOrderComplete(order._id!)}
                      className="flex-1"
                    >
                      <Clock className="mr-2 h-4 w-4" />
                      Mark Complete
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedOrder(order)
                        setPaymentAmount(order.total.toString())
                        setShowPaymentDialog(true)
                      }}
                      className="flex-1"
                    >
                      <DollarSign className="mr-2 h-4 w-4" />
                      Process Payment
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {pendingOrders.length === 0 && (
        <div className="text-center py-12">
          <Clock className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No pending orders</h3>
          <p className="text-gray-600">All orders have been processed</p>
        </div>
      )}

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Process Payment</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Order Summary</h4>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>Order:</span>
                    <span>{selectedOrder.orderNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Table:</span>
                    <span>{selectedOrder.tableNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Items:</span>
                    <span>{selectedOrder.items.length}</span>
                  </div>
                  <div className="flex justify-between font-medium border-t pt-1">
                    <span>Total:</span>
                    <span>{selectedOrder.total.toLocaleString()} XAF</span>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="discount">Discount (XAF)</Label>
                <Input
                  id="discount"
                  type="number"
                  value={discount}
                  onChange={(e) => setDiscount(Number.parseFloat(e.target.value) || 0)}
                  placeholder="0"
                />
              </div>

              <div>
                <Label htmlFor="paymentMethod">Payment Method</Label>
                <Select value={paymentMethod} onValueChange={(value: any) => setPaymentMethod(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CASH">
                      <div className="flex items-center space-x-2">
                        <DollarSign className="h-4 w-4" />
                        <span>Cash</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="MOBILE_MONEY">
                      <div className="flex items-center space-x-2">
                        <Smartphone className="h-4 w-4" />
                        <span>Mobile Money (MTN)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="ORANGE_MONEY">
                      <div className="flex items-center space-x-2">
                        <Smartphone className="h-4 w-4" />
                        <span>Orange Money</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="BANK_TRANSFER">
                      <div className="flex items-center space-x-2">
                        <Building className="h-4 w-4" />
                        <span>Bank Transfer</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="paymentAmount">Payment Amount</Label>
                <Input
                  id="paymentAmount"
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder={(selectedOrder.total - discount).toString()}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Amount due: {(selectedOrder.total - discount).toLocaleString()} XAF
                </p>
              </div>

              {paymentMethod !== "CASH" && (
                <div>
                  <Label htmlFor="reference">Reference Number</Label>
                  <Input
                    id="reference"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    placeholder="Transaction reference"
                  />
                </div>
              )}

              <div className="flex space-x-2 pt-4">
                <Button variant="outline" onClick={() => setShowPaymentDialog(false)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={processPayment} disabled={loading} className="flex-1">
                  {loading ? "Processing..." : "Process Payment"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Receipt Dialog */}
      <Dialog open={showReceiptDialog} onOpenChange={setShowReceiptDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Receipt className="h-5 w-5" />
              <span>Receipt</span>
            </DialogTitle>
          </DialogHeader>
          {receipt && (
            <div className="space-y-4 font-mono text-sm" style={{ width: "210mm" }}>
              {/* Receipt Header */}
              <div className="text-center border-b pb-4">
                <h2 className="font-bold text-lg">PLATINUM LOUNGE</h2>
                <p className="text-xs">123 Main Street, Douala, Cameroon</p>
                <p className="text-xs">Tel: +237 123 456 789</p>
                <p className="text-xs">Email: info@platinumlounge.cm</p>
              </div>

              {/* Transaction Details */}
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>Date:</span>
                  <span>{new Date().toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Transaction ID:</span>
                  <span>{receipt.transactionId}</span>
                </div>
                <div className="flex justify-between">
                  <span>Order Number:</span>
                  <span>{receipt.order.orderNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span>Table:</span>
                  <span>{receipt.order.tableNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span>Waiter:</span>
                  <span>{receipt.order.waiterName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cashier:</span>
                  <span>{receipt.processedBy}</span>
                </div>
              </div>

              {/* Items */}
              <div className="border-t border-b py-2">
                <h4 className="font-medium mb-2 text-xs">ITEMS:</h4>
                {receipt.order.items.map((item: any, index: number) => (
                  <div key={index} className="flex justify-between text-xs mb-1">
                    <span>
                      {item.quantity}x {item.productName}
                    </span>
                    <span>{item.totalPrice.toLocaleString()} XAF</span>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{receipt.order.subtotal.toLocaleString()} XAF</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax (19.25%):</span>
                  <span>{receipt.order.tax.toLocaleString()} XAF</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between">
                    <span>Discount:</span>
                    <span>-{discount.toLocaleString()} XAF</span>
                  </div>
                )}
                <div className="flex justify-between font-bold border-t pt-1">
                  <span>TOTAL:</span>
                  <span>{(receipt.order.total - discount).toLocaleString()} XAF</span>
                </div>
              </div>

              {/* Payment Info */}
              <div className="border-t pt-2 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>Payment Method:</span>
                  <span>{paymentMethod.replace("_", " ")}</span>
                </div>
                <div className="flex justify-between">
                  <span>Amount Paid:</span>
                  <span>{receipt.amount.toLocaleString()} XAF</span>
                </div>
                {reference && (
                  <div className="flex justify-between">
                    <span>Reference:</span>
                    <span>{reference}</span>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="text-center text-xs border-t pt-4">
                <p>Thank you for dining with us!</p>
                <p>Visit us again soon</p>
              </div>

              <div className="flex space-x-2 pt-4">
                <Button onClick={printReceipt} className="flex-1">
                  <Printer className="mr-2 h-4 w-4" />
                  Print Receipt
                </Button>
                <Button variant="outline" onClick={() => setShowReceiptDialog(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
