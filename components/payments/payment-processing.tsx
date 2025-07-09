"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/contexts/auth-context"
import { CreditCard, DollarSign, Smartphone, Building, Receipt, Printer, RefreshCw } from "lucide-react"
import type { Order, Payment } from "@/lib/models"

interface PaymentProcessingProps {
  order: Order
  onPaymentComplete: () => void
}

export function PaymentProcessing({ order, onPaymentComplete }: PaymentProcessingProps) {
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "CARD" | "MOBILE_MONEY" | "BANK_TRANSFER">("CASH")
  const [paymentAmount, setPaymentAmount] = useState(order.total.toString())
  const [reference, setReference] = useState("")
  const [notes, setNotes] = useState("")
  const [processing, setProcessing] = useState(false)
  const [showReceiptDialog, setShowReceiptDialog] = useState(false)
  const [receipt, setReceipt] = useState<any>(null)
  const [splitPayment, setSplitPayment] = useState(false)
  const [payments, setPayments] = useState<Payment[]>([])

  const { user } = useAuth()

  useEffect(() => {
    fetchPayments()
  }, [order._id])

  const fetchPayments = async () => {
    try {
      const response = await fetch(`/api/payments/order/${order._id}`)
      if (response.ok) {
        const data = await response.json()
        setPayments(data)
      }
    } catch (error) {
      console.error("Error fetching payments:", error)
    }
  }

  const processPayment = async () => {
    setProcessing(true)
    try {
      const response = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order._id,
          amount: Number.parseFloat(paymentAmount),
          method: paymentMethod,
          reference,
          notes,
          processedBy: user?.name,
        }),
      })

      if (response.ok) {
        const payment = await response.json()
        setReceipt(payment)
        setShowReceiptDialog(true)
        fetchPayments()

        // Check if order is fully paid
        const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0) + Number.parseFloat(paymentAmount)
        if (totalPaid >= order.total) {
          onPaymentComplete()
        }
      }
    } catch (error) {
      console.error("Error processing payment:", error)
    } finally {
      setProcessing(false)
    }
  }

  const processRefund = async (paymentId: string, amount: number) => {
    try {
      const response = await fetch(`/api/payments/${paymentId}/refund`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          processedBy: user?.name,
          reason: "Customer refund request",
        }),
      })

      if (response.ok) {
        fetchPayments()
      }
    } catch (error) {
      console.error("Error processing refund:", error)
    }
  }

  const printReceipt = () => {
    window.print()
  }

  const getPaymentIcon = (method: string) => {
    switch (method) {
      case "CASH":
        return <DollarSign className="h-4 w-4" />
      case "CARD":
        return <CreditCard className="h-4 w-4" />
      case "MOBILE_MONEY":
        return <Smartphone className="h-4 w-4" />
      case "BANK_TRANSFER":
        return <Building className="h-4 w-4" />
      default:
        return <DollarSign className="h-4 w-4" />
    }
  }

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case "CASH":
        return "Cash"
      case "CARD":
        return "Card"
      case "MOBILE_MONEY":
        return "Mobile Money"
      case "BANK_TRANSFER":
        return "Bank Transfer"
      default:
        return method
    }
  }

  const totalPaid = payments.filter((p) => p.status === "COMPLETED").reduce((sum, p) => sum + p.amount, 0)
  const remainingAmount = order.total - totalPaid
  const isFullyPaid = remainingAmount <= 0

  return (
    <div className="space-y-6">
      {/* Order Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Order Summary</span>
            <Badge
              className={
                order.paymentStatus === "PAID" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
              }
            >
              {order.paymentStatus}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Order Number:</span>
              <span className="font-medium">{order.orderNumber}</span>
            </div>
            <div className="flex justify-between">
              <span>Table:</span>
              <span className="font-medium">
                {order.type === "DINE_IN" ? `Table ${order.tableNumber}` : order.type}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Customer:</span>
              <span className="font-medium">{order.customerName || "Walk-in"}</span>
            </div>
            <div className="flex justify-between">
              <span>Items:</span>
              <span className="font-medium">{order.items.length}</span>
            </div>
            <div className="border-t pt-2 space-y-1">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{order.subtotal.toLocaleString()} XAF</span>
              </div>
              <div className="flex justify-between">
                <span>Tax (19.25%):</span>
                <span>{order.tax.toLocaleString()} XAF</span>
              </div>
              <div className="flex justify-between font-bold text-lg">
                <span>Total:</span>
                <span>{order.total.toLocaleString()} XAF</span>
              </div>
              <div className="flex justify-between text-green-600">
                <span>Paid:</span>
                <span>{totalPaid.toLocaleString()} XAF</span>
              </div>
              <div className="flex justify-between text-red-600 font-medium">
                <span>Remaining:</span>
                <span>{remainingAmount.toLocaleString()} XAF</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment History */}
      {payments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Payment History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {payments.map((payment) => (
                <div key={payment._id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getPaymentIcon(payment.method)}
                    <div>
                      <div className="font-medium">{payment.amount.toLocaleString()} XAF</div>
                      <div className="text-sm text-gray-500">
                        {getPaymentMethodLabel(payment.method)} • {new Date(payment.timestamp).toLocaleString()}
                      </div>
                      {payment.reference && <div className="text-xs text-gray-400">Ref: {payment.reference}</div>}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge
                      className={
                        payment.status === "COMPLETED" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                      }
                    >
                      {payment.status}
                    </Badge>
                    {payment.status === "COMPLETED" && (
                      <Button size="sm" variant="outline" onClick={() => processRefund(payment._id!, payment.amount)}>
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Refund
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Form */}
      {!isFullyPaid && (
        <Card>
          <CardHeader>
            <CardTitle>Process Payment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
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
                    <SelectItem value="CARD">
                      <div className="flex items-center space-x-2">
                        <CreditCard className="h-4 w-4" />
                        <span>Card</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="MOBILE_MONEY">
                      <div className="flex items-center space-x-2">
                        <Smartphone className="h-4 w-4" />
                        <span>Mobile Money</span>
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
                <Label htmlFor="paymentAmount">Amount</Label>
                <Input
                  id="paymentAmount"
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  max={remainingAmount}
                />
                <div className="text-sm text-gray-500 mt-1">Maximum: {remainingAmount.toLocaleString()} XAF</div>
              </div>

              {(paymentMethod === "CARD" || paymentMethod === "MOBILE_MONEY" || paymentMethod === "BANK_TRANSFER") && (
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

              <div>
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Payment notes..."
                />
              </div>

              <div className="flex space-x-2">
                <Button
                  onClick={processPayment}
                  disabled={processing || Number.parseFloat(paymentAmount) <= 0}
                  className="flex-1"
                >
                  {processing
                    ? "Processing..."
                    : `Process Payment (${Number.parseFloat(paymentAmount).toLocaleString()} XAF)`}
                </Button>
                <Button variant="outline" onClick={() => setPaymentAmount(remainingAmount.toString())}>
                  Pay Full Amount
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Receipt Dialog */}
      <Dialog open={showReceiptDialog} onOpenChange={setShowReceiptDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Receipt className="h-5 w-5" />
              <span>Payment Receipt</span>
            </DialogTitle>
          </DialogHeader>
          {receipt && (
            <div className="space-y-4">
              <div className="text-center border-b pb-4">
                <h3 className="font-bold text-lg">Platinum Lounge</h3>
                <p className="text-sm text-gray-600">Payment Receipt</p>
                <p className="text-xs text-gray-500">{new Date().toLocaleString()}</p>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Receipt #:</span>
                  <span className="font-medium">{receipt._id}</span>
                </div>
                <div className="flex justify-between">
                  <span>Order #:</span>
                  <span className="font-medium">{order.orderNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span>Payment Method:</span>
                  <span className="font-medium">{getPaymentMethodLabel(receipt.method)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Amount Paid:</span>
                  <span className="font-medium">{receipt.amount.toLocaleString()} XAF</span>
                </div>
                {receipt.reference && (
                  <div className="flex justify-between">
                    <span>Reference:</span>
                    <span className="font-medium">{receipt.reference}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Processed By:</span>
                  <span className="font-medium">{receipt.processedBy}</span>
                </div>
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between font-bold">
                  <span>Order Total:</span>
                  <span>{order.total.toLocaleString()} XAF</span>
                </div>
                <div className="flex justify-between text-green-600">
                  <span>Total Paid:</span>
                  <span>{(totalPaid + Number.parseFloat(paymentAmount)).toLocaleString()} XAF</span>
                </div>
                <div className="flex justify-between text-red-600">
                  <span>Remaining:</span>
                  <span>
                    {Math.max(0, order.total - totalPaid - Number.parseFloat(paymentAmount)).toLocaleString()} XAF
                  </span>
                </div>
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
