"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { useLanguage } from "@/contexts/language-context"
import { ArrowLeft, Loader2, Package } from "lucide-react"
import type { Product, StockMovement } from "@/lib/models"

interface StockAdjustmentProps {
  productId: string
}

export function StockAdjustment({ productId }: StockAdjustmentProps) {
  const [product, setProduct] = useState<Product | null>(null)
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([])
  const [formData, setFormData] = useState({
    type: "ADJUSTMENT" as const,
    quantity: 0,
    reason: "",
    reference: "",
    notes: "",
  })
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const { t, language } = useLanguage()
  const router = useRouter()

  const movementTypes = [
    { value: "IN", label: t("stockMovementIn") },
    { value: "OUT", label: t("stockMovementOut") },
    { value: "ADJUSTMENT", label: t("stockMovementAdjustment") },
    { value: "WASTE", label: t("stockMovementWaste") },
    { value: "RETURN", label: t("stockMovementReturn") },
  ]

  useEffect(() => {
    fetchProduct()
    fetchStockMovements()
  }, [productId])

  const fetchProduct = async () => {
    try {
      const response = await fetch(`/api/inventory/products/${productId}`)
      if (response.ok) {
        const data = await response.json()
        setProduct(data)
      } else {
        setError("Failed to load product")
      }
    } catch (error) {
      setError("Failed to load product")
    } finally {
      setInitialLoading(false)
    }
  }

  const fetchStockMovements = async () => {
    try {
      const response = await fetch(`/api/inventory/products/${productId}/stock-movements`)
      if (response.ok) {
        const data = await response.json()
        setStockMovements(data)
      }
    } catch (error) {
      console.error("Error fetching stock movements:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    if (!product) {
      setError("Product not found")
      setLoading(false)
      return
    }

    try {
      const response = await fetch(`/api/inventory/products/${productId}/stock-movements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(t("stockUpdated"))
        setFormData({
          type: "ADJUSTMENT",
          quantity: 0,
          reason: "",
          reference: "",
          notes: "",
        })
        fetchProduct()
        fetchStockMovements()
      } else {
        setError(data.error || "Failed to update stock")
      }
    } catch (error) {
      setError("Failed to update stock")
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const getProductName = (product: Product) => {
    return language === "fr" ? product.nameFr : product.nameEn
  }

  const getStockStatus = (product: Product) => {
    if (product.stockQuantity === 0) {
      return { status: "out-of-stock", label: t("outOfStock"), variant: "destructive" as const }
    } else if (product.stockQuantity <= product.minStockLevel) {
      return { status: "low-stock", label: t("lowStock"), variant: "secondary" as const }
    } else {
      return { status: "in-stock", label: t("inStock"), variant: "default" as const }
    }
  }

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleString()
  }

  const getMovementTypeLabel = (type: string) => {
    const movement = movementTypes.find((m) => m.value === type)
    return movement ? movement.label : type
  }

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="text-center">
        <p className="text-red-600">Product not found</p>
      </div>
    )
  }

  const stockStatus = getStockStatus(product)

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" onClick={() => router.push("/dashboard/inventory/products")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h2 className="text-2xl font-bold">{t("adjustStock")}</h2>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Product Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Package className="h-5 w-5" />
            <span>{getProductName(product)}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label className="text-sm text-gray-600">SKU</Label>
              <p className="font-medium">{product.sku}</p>
            </div>
            <div>
              <Label className="text-sm text-gray-600">{t("currentStock")}</Label>
              <p className="font-medium">
                {product.stockQuantity} {product.unit}
              </p>
            </div>
            <div>
              <Label className="text-sm text-gray-600">{t("minStockLevel")}</Label>
              <p className="font-medium">
                {product.minStockLevel} {product.unit}
              </p>
            </div>
            <div>
              <Label className="text-sm text-gray-600">{t("status")}</Label>
              <Badge variant={stockStatus.variant}>{stockStatus.label}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stock Adjustment Form */}
      <Card>
        <CardHeader>
          <CardTitle>{t("stockAdjustment")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Movement Type *</Label>
                <Select value={formData.type} onValueChange={(value) => handleInputChange("type", value as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {movementTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">{t("quantity")} *</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => handleInputChange("quantity", Number.parseInt(e.target.value) || 0)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">{t("reason")} *</Label>
                <Input
                  id="reason"
                  value={formData.reason}
                  onChange={(e) => handleInputChange("reason", e.target.value)}
                  required
                  disabled={loading}
                  placeholder="e.g., Damaged goods, Inventory count correction"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reference">{t("reference")}</Label>
                <Input
                  id="reference"
                  value={formData.reference}
                  onChange={(e) => handleInputChange("reference", e.target.value)}
                  disabled={loading}
                  placeholder="e.g., PO-001, INV-2024-001"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="notes">{t("notes")}</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange("notes", e.target.value)}
                  disabled={loading}
                  placeholder="Additional notes about this stock movement"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/dashboard/inventory/products")}
                disabled={loading}
              >
                {t("cancel")}
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("save")}...
                  </>
                ) : (
                  t("adjustStock")
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Stock Movement History */}
      <Card>
        <CardHeader>
          <CardTitle>{t("stockMovements")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stockMovements.length === 0 ? (
              <p className="text-center text-gray-500">No stock movements found</p>
            ) : (
              stockMovements.map((movement, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">{getMovementTypeLabel(movement.type)}</Badge>
                      <span className="font-medium">
                        {movement.type === "OUT" || movement.type === "WASTE" ? "-" : "+"}
                        {movement.quantity} {product.unit}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">{formatDate(movement.timestamp)}</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                    <div>
                      <span className="text-gray-600">Previous Stock:</span> {movement.previousStock}
                    </div>
                    <div>
                      <span className="text-gray-600">New Stock:</span> {movement.newStock}
                    </div>
                    <div>
                      <span className="text-gray-600">Performed By:</span> {movement.performedBy}
                    </div>
                  </div>
                  <div className="mt-2">
                    <div className="text-sm">
                      <span className="text-gray-600">Reason:</span> {movement.reason}
                    </div>
                    {movement.reference && (
                      <div className="text-sm">
                        <span className="text-gray-600">Reference:</span> {movement.reference}
                      </div>
                    )}
                    {movement.notes && (
                      <div className="text-sm">
                        <span className="text-gray-600">Notes:</span> {movement.notes}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
