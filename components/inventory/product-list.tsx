"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useLanguage } from "@/contexts/language-context"
import { useAuth } from "@/contexts/auth-context"
import { Search, Plus, Edit, Trash2, Package, AlertTriangle, Download, Upload } from "lucide-react"
import type { Product, Category } from "@/lib/models"

export function ProductList() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")
  const [stockFilter, setStockFilter] = useState("")
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState<Product | null>(null)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const { t, language } = useLanguage()
  const { user } = useAuth()

  useEffect(() => {
    fetchProducts()
    fetchCategories()
  }, [])

  useEffect(() => {
    let filtered = products

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter((product) => {
        const name = language === "fr" ? product.nameFr : product.nameEn
        return (
          name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (product.barcode && product.barcode.toLowerCase().includes(searchTerm.toLowerCase()))
        )
      })
    }

    // Category filter
    if (categoryFilter) {
      filtered = filtered.filter((product) => product.categoryId === categoryFilter)
    }

    // Stock filter
    if (stockFilter) {
      filtered = filtered.filter((product) => {
        switch (stockFilter) {
          case "in-stock":
            return product.stockQuantity > product.minStockLevel
          case "low-stock":
            return product.stockQuantity <= product.minStockLevel && product.stockQuantity > 0
          case "out-of-stock":
            return product.stockQuantity === 0
          default:
            return true
        }
      })
    }

    setFilteredProducts(filtered)
  }, [products, searchTerm, categoryFilter, stockFilter, language])

  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/inventory/products")
      if (response.ok) {
        const data = await response.json()
        setProducts(data)
      }
    } catch (error) {
      console.error("Error fetching products:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/inventory/categories")
      if (response.ok) {
        const data = await response.json()
        setCategories(data)
      }
    } catch (error) {
      console.error("Error fetching categories:", error)
    }
  }

  const handleDelete = async (product: Product) => {
    setActionLoading(product._id!)
    try {
      const response = await fetch(`/api/inventory/products/${product._id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setMessage({ type: "success", text: t("productDeleted") })
        fetchProducts()
      } else {
        const data = await response.json()
        setMessage({ type: "error", text: data.error || "Failed to delete product" })
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to delete product" })
    } finally {
      setActionLoading(null)
      setShowDeleteDialog(null)
    }
  }

  const exportProducts = async () => {
    try {
      const response = await fetch("/api/inventory/products/export")
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = "products.csv"
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error("Error exporting products:", error)
    }
  }

  const getCategoryName = (categoryId: string) => {
    const category = categories.find((cat) => cat._id === categoryId)
    if (!category) return "Unknown"
    return language === "fr" ? category.nameFr : category.nameEn
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
        <h2 className="text-2xl font-bold">{t("productList")}</h2>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={exportProducts}>
            <Download className="mr-2 h-4 w-4" />
            {t("export")}
          </Button>
          <Button variant="outline" onClick={() => (window.location.href = "/dashboard/inventory/products/import")}>
            <Upload className="mr-2 h-4 w-4" />
            {t("import")}
          </Button>
          <Button onClick={() => (window.location.href = "/dashboard/inventory/products/add")}>
            <Plus className="mr-2 h-4 w-4" />
            {t("addProduct")}
          </Button>
        </div>
      </div>

      {message && (
        <Alert variant={message.type === "error" ? "destructive" : "default"}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-gray-400" />
              <Input
                placeholder={`${t("search")} products...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder={`${t("filter")} by ${t("category").toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-categories">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category._id} value={category._id!}>
                    {language === "fr" ? category.nameFr : category.nameEn}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={stockFilter} onValueChange={setStockFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder={`${t("filter")} by stock`} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-stock-levels">All Stock Levels</SelectItem>
                <SelectItem value="in-stock">{t("inStock")}</SelectItem>
                <SelectItem value="low-stock">{t("lowStock")}</SelectItem>
                <SelectItem value="out-of-stock">{t("outOfStock")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("productName")}</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>{t("category")}</TableHead>
                <TableHead>{t("price")}</TableHead>
                <TableHead>{t("stockQuantity")}</TableHead>
                <TableHead>{t("status")}</TableHead>
                <TableHead>{t("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => {
                const stockStatus = getStockStatus(product)
                return (
                  <TableRow key={product._id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center space-x-2">
                        <Package className="h-4 w-4" />
                        <div>
                          <div>{getProductName(product)}</div>
                          {product.barcode && <div className="text-xs text-gray-500">{product.barcode}</div>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{product.sku}</TableCell>
                    <TableCell>{getCategoryName(product.categoryId)}</TableCell>
                    <TableCell>{formatPrice(product.price)}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <span>{product.stockQuantity}</span>
                        <span className="text-gray-500">{product.unit}</span>
                        {stockStatus.status === "low-stock" && <AlertTriangle className="h-4 w-4 text-yellow-500" />}
                        {stockStatus.status === "out-of-stock" && <AlertTriangle className="h-4 w-4 text-red-500" />}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Badge variant={stockStatus.variant}>{stockStatus.label}</Badge>
                        <Badge variant={product.isActive ? "default" : "secondary"}>
                          {product.isActive ? t("active") : t("inactive")}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => (window.location.href = `/dashboard/inventory/products/${product._id}/edit`)}
                          disabled={actionLoading === product._id}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => (window.location.href = `/dashboard/inventory/products/${product._id}/stock`)}
                          disabled={actionLoading === product._id}
                        >
                          <Package className="h-4 w-4" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowDeleteDialog(product)}
                          disabled={actionLoading === product._id}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
              {filteredProducts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-gray-500">
                    No products found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!showDeleteDialog} onOpenChange={() => setShowDeleteDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t("delete")} {t("products")}
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{showDeleteDialog && getProductName(showDeleteDialog)}"? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(null)}>
              {t("cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={() => showDeleteDialog && handleDelete(showDeleteDialog)}
              disabled={!!actionLoading}
            >
              {t("delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
