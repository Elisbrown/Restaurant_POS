"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useLanguage } from "@/contexts/language-context"
import { AlertTriangle, Package, RefreshCw } from "lucide-react"
import type { Product } from "@/lib/models"

interface LowStockProduct extends Product {
  categoryName: string
}

export function LowStockAlerts() {
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const { t, language } = useLanguage()

  useEffect(() => {
    fetchLowStockProducts()
  }, [])

  const fetchLowStockProducts = async () => {
    try {
      setRefreshing(true)
      const response = await fetch("/api/inventory/low-stock")
      if (response.ok) {
        const data = await response.json()
        setLowStockProducts(data)
      }
    } catch (error) {
      console.error("Error fetching low stock products:", error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const getProductName = (product: LowStockProduct) => {
    return language === "fr" ? product.nameFr : product.nameEn
  }

  const getStockStatus = (product: LowStockProduct) => {
    if (product.stockQuantity === 0) {
      return { status: "out-of-stock", label: t("outOfStock"), variant: "destructive" as const, color: "text-red-600" }
    } else {
      return { status: "low-stock", label: t("lowStock"), variant: "secondary" as const, color: "text-yellow-600" }
    }
  }

  const formatPrice = (price: number) => {
    return `${price.toLocaleString()} XAF`
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
        <div className="flex items-center space-x-2">
          <AlertTriangle className="h-6 w-6 text-yellow-600" />
          <h2 className="text-2xl font-bold">{t("lowStockAlerts")}</h2>
        </div>
        <Button onClick={fetchLowStockProducts} disabled={refreshing}>
          <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {lowStockProducts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-green-600 mb-4" />
            <h3 className="text-lg font-medium text-green-600 mb-2">All Good!</h3>
            <p className="text-gray-600 text-center">No products are currently below their minimum stock levels.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {lowStockProducts.length} product{lowStockProducts.length > 1 ? "s" : ""}{" "}
              {lowStockProducts.length > 1 ? "are" : "is"} below minimum stock level
              {lowStockProducts.length > 1 ? "s" : ""}.
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle>Products Requiring Attention</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("productName")}</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>{t("category")}</TableHead>
                    <TableHead>{t("currentStock")}</TableHead>
                    <TableHead>{t("minStockLevel")}</TableHead>
                    <TableHead>{t("status")}</TableHead>
                    <TableHead>{t("actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lowStockProducts.map((product) => {
                    const stockStatus = getStockStatus(product)
                    return (
                      <TableRow key={product._id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center space-x-2">
                            <AlertTriangle className={`h-4 w-4 ${stockStatus.color}`} />
                            <span>{getProductName(product)}</span>
                          </div>
                        </TableCell>
                        <TableCell>{product.sku}</TableCell>
                        <TableCell>{product.categoryName}</TableCell>
                        <TableCell>
                          <span className={stockStatus.color}>
                            {product.stockQuantity} {product.unit}
                          </span>
                        </TableCell>
                        <TableCell>
                          {product.minStockLevel} {product.unit}
                        </TableCell>
                        <TableCell>
                          <Badge variant={stockStatus.variant}>{stockStatus.label}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                (window.location.href = `/dashboard/inventory/products/${product._id}/stock`)
                              }
                            >
                              Adjust Stock
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                (window.location.href = `/dashboard/inventory/products/${product._id}/edit`)
                              }
                            >
                              Edit
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {lowStockProducts.filter((p) => p.stockQuantity === 0).length}
            </div>
            <p className="text-xs text-muted-foreground">Products with zero stock</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {lowStockProducts.filter((p) => p.stockQuantity > 0 && p.stockQuantity <= p.minStockLevel).length}
            </div>
            <p className="text-xs text-muted-foreground">Products below minimum level</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value at Risk</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatPrice(
                lowStockProducts.reduce((total, product) => total + product.price * product.stockQuantity, 0),
              )}
            </div>
            <p className="text-xs text-muted-foreground">Value of low stock items</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
