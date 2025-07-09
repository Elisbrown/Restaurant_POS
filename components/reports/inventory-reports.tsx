"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useLanguage } from "@/contexts/language-context"
import { Download, Package, TrendingDown, TrendingUp } from "lucide-react"

interface InventoryReportData {
  summary: {
    totalProducts: number
    totalValue: number
    lowStockItems: number
    outOfStockItems: number
  }
  products: {
    productName: string
    sku: string
    category: string
    currentStock: number
    minStock: number
    maxStock: number
    unitPrice: number
    totalValue: number
    status: string
  }[]
  movements: {
    date: string
    productName: string
    type: string
    quantity: number
    reason: string
    performedBy: string
  }[]
  categories: {
    categoryName: string
    productCount: number
    totalValue: number
    lowStockCount: number
  }[]
}

export function InventoryReports() {
  const [data, setData] = useState<InventoryReportData | null>(null)
  const [loading, setLoading] = useState(false)
  const [reportType, setReportType] = useState("summary")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")

  const { t } = useLanguage()

  useEffect(() => {
    generateReport()
  }, [reportType, categoryFilter, statusFilter])

  const generateReport = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        type: reportType,
        category: categoryFilter,
        status: statusFilter,
      })

      const response = await fetch(`/api/reports/inventory?${params}`)
      if (response.ok) {
        const reportData = await response.json()
        setData(reportData)
      }
    } catch (error) {
      console.error("Error generating inventory report:", error)
    } finally {
      setLoading(false)
    }
  }

  const exportReport = async (format: "csv" | "pdf") => {
    try {
      const params = new URLSearchParams({
        type: reportType,
        category: categoryFilter,
        status: statusFilter,
        format,
      })

      const response = await fetch(`/api/reports/inventory/export?${params}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `inventory-report-${new Date().toISOString().split("T")[0]}.${format}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error("Error exporting report:", error)
    }
  }

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString()} XAF`
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "IN_STOCK":
        return <Badge variant="default">In Stock</Badge>
      case "LOW_STOCK":
        return <Badge variant="secondary">Low Stock</Badge>
      case "OUT_OF_STOCK":
        return <Badge variant="destructive">Out of Stock</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getMovementIcon = (type: string) => {
    switch (type) {
      case "IN":
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case "OUT":
      case "SALE":
        return <TrendingDown className="h-4 w-4 text-red-600" />
      default:
        return <Package className="h-4 w-4 text-blue-600" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Inventory Reports</h2>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => exportReport("csv")}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={() => exportReport("pdf")}>
            <Download className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Report Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Report Type</label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="summary">Summary</SelectItem>
                  <SelectItem value="products">Product Details</SelectItem>
                  <SelectItem value="movements">Stock Movements</SelectItem>
                  <SelectItem value="categories">By Category</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="drinks">Drinks</SelectItem>
                  <SelectItem value="food">Food</SelectItem>
                  <SelectItem value="cocktails">Cocktails</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Stock Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="IN_STOCK">In Stock</SelectItem>
                  <SelectItem value="LOW_STOCK">Low Stock</SelectItem>
                  <SelectItem value="OUT_OF_STOCK">Out of Stock</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button onClick={generateReport} disabled={loading} className="w-full">
                {loading ? "Generating..." : "Generate Report"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Content */}
      {data && (
        <>
          {/* Summary Cards */}
          {reportType === "summary" && (
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{data.summary.totalProducts}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Value</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{formatCurrency(data.summary.totalValue)}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">{data.summary.lowStockItems}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{data.summary.outOfStockItems}</div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Product Details Table */}
          {reportType === "products" && (
            <Card>
              <CardHeader>
                <CardTitle>Product Details</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product Name</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Current Stock</TableHead>
                      <TableHead>Min/Max</TableHead>
                      <TableHead>Unit Price</TableHead>
                      <TableHead>Total Value</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.products.map((product, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{product.productName}</TableCell>
                        <TableCell>{product.sku}</TableCell>
                        <TableCell>{product.category}</TableCell>
                        <TableCell>{product.currentStock}</TableCell>
                        <TableCell>
                          {product.minStock}/{product.maxStock}
                        </TableCell>
                        <TableCell>{formatCurrency(product.unitPrice)}</TableCell>
                        <TableCell className="font-medium">{formatCurrency(product.totalValue)}</TableCell>
                        <TableCell>{getStatusBadge(product.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Stock Movements Table */}
          {reportType === "movements" && (
            <Card>
              <CardHeader>
                <CardTitle>Stock Movements</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Performed By</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.movements.map((movement, index) => (
                      <TableRow key={index}>
                        <TableCell>{new Date(movement.date).toLocaleDateString()}</TableCell>
                        <TableCell className="font-medium">{movement.productName}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getMovementIcon(movement.type)}
                            <span>{movement.type}</span>
                          </div>
                        </TableCell>
                        <TableCell>{movement.quantity}</TableCell>
                        <TableCell>{movement.reason}</TableCell>
                        <TableCell>{movement.performedBy}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Category Summary Table */}
          {reportType === "categories" && (
            <Card>
              <CardHeader>
                <CardTitle>Category Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead>Product Count</TableHead>
                      <TableHead>Total Value</TableHead>
                      <TableHead>Low Stock Items</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.categories.map((category, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{category.categoryName}</TableCell>
                        <TableCell>{category.productCount}</TableCell>
                        <TableCell className="font-medium">{formatCurrency(category.totalValue)}</TableCell>
                        <TableCell>
                          {category.lowStockCount > 0 ? (
                            <Badge variant="secondary">{category.lowStockCount}</Badge>
                          ) : (
                            <Badge variant="default">0</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
