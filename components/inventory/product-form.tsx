"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useLanguage } from "@/contexts/language-context"
import { ArrowLeft, Loader2 } from "lucide-react"
import type { Category } from "@/lib/models"

interface ProductFormProps {
  productId?: string
  isEdit?: boolean
}

export function ProductForm({ productId, isEdit = false }: ProductFormProps) {
  const [formData, setFormData] = useState({
    nameEn: "",
    nameFr: "",
    descriptionEn: "",
    descriptionFr: "",
    sku: "",
    barcode: "",
    categoryId: "",
    price: 0,
    costPrice: 0,
    stockQuantity: 0,
    minStockLevel: 0,
    maxStockLevel: 0,
    unit: "piece",
    isActive: true,
    isAvailable: true,
    tags: "",
  })
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(isEdit)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const { t, language } = useLanguage()
  const router = useRouter()

  const units = ["piece", "liter", "kilogram", "gram", "bottle", "pack", "box"]

  useEffect(() => {
    fetchCategories()
    if (isEdit && productId) {
      fetchProduct()
    }
  }, [isEdit, productId])

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/inventory/categories")
      if (response.ok) {
        const data = await response.json()
        setCategories(data.filter((cat: Category) => cat.isActive))
      }
    } catch (error) {
      console.error("Error fetching categories:", error)
    }
  }

  const fetchProduct = async () => {
    try {
      const response = await fetch(`/api/inventory/products/${productId}`)
      if (response.ok) {
        const product = await response.json()
        setFormData({
          nameEn: product.nameEn,
          nameFr: product.nameFr,
          descriptionEn: product.descriptionEn || "",
          descriptionFr: product.descriptionFr || "",
          sku: product.sku,
          barcode: product.barcode || "",
          categoryId: product.categoryId,
          price: product.price,
          costPrice: product.costPrice,
          stockQuantity: product.stockQuantity,
          minStockLevel: product.minStockLevel,
          maxStockLevel: product.maxStockLevel,
          unit: product.unit,
          isActive: product.isActive,
          isAvailable: product.isAvailable,
          tags: product.tags.join(", "),
        })
      } else {
        setError("Failed to load product")
      }
    } catch (error) {
      setError("Failed to load product")
    } finally {
      setInitialLoading(false)
    }
  }

  const generateSKU = () => {
    const timestamp = Date.now().toString().slice(-6)
    const random = Math.random().toString(36).substring(2, 5).toUpperCase()
    return `PL${timestamp}${random}`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const url = isEdit ? `/api/inventory/products/${productId}` : "/api/inventory/products"
      const method = isEdit ? "PUT" : "POST"

      const submitData = {
        ...formData,
        tags: formData.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        sku: formData.sku || generateSKU(),
      }

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(isEdit ? t("productUpdated") : t("productCreated"))
        setTimeout(() => {
          router.push("/dashboard/inventory/products")
        }, 2000)
      } else {
        setError(data.error || "Failed to save product")
      }
    } catch (error) {
      setError("Failed to save product")
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" onClick={() => router.push("/dashboard/inventory/products")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h2 className="text-2xl font-bold">{isEdit ? t("editProduct") : t("addProduct")}</h2>
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

      <Card>
        <CardHeader>
          <CardTitle>{t("productDetails")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nameEn">Name (English) *</Label>
                <Input
                  id="nameEn"
                  value={formData.nameEn}
                  onChange={(e) => handleInputChange("nameEn", e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nameFr">Nom (Français) *</Label>
                <Input
                  id="nameFr"
                  value={formData.nameFr}
                  onChange={(e) => handleInputChange("nameFr", e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="descriptionEn">Description (English)</Label>
                <Textarea
                  id="descriptionEn"
                  value={formData.descriptionEn}
                  onChange={(e) => handleInputChange("descriptionEn", e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="descriptionFr">Description (Français)</Label>
                <Textarea
                  id="descriptionFr"
                  value={formData.descriptionFr}
                  onChange={(e) => handleInputChange("descriptionFr", e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sku">SKU</Label>
                <Input
                  id="sku"
                  value={formData.sku}
                  onChange={(e) => handleInputChange("sku", e.target.value)}
                  placeholder="Auto-generated if empty"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="barcode">{t("barcode")}</Label>
                <Input
                  id="barcode"
                  value={formData.barcode}
                  onChange={(e) => handleInputChange("barcode", e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="categoryId">{t("category")} *</Label>
                <Select value={formData.categoryId} onValueChange={(value) => handleInputChange("categoryId", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder={`Select ${t("category").toLowerCase()}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category._id} value={category._id!}>
                        {language === "fr" ? category.nameFr : category.nameEn}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="unit">{t("unit")}</Label>
                <Select value={formData.unit} onValueChange={(value) => handleInputChange("unit", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {units.map((unit) => (
                      <SelectItem key={unit} value={unit}>
                        {t(unit as any)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Pricing */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">{t("price")} (XAF) *</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => handleInputChange("price", Number.parseFloat(e.target.value) || 0)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="costPrice">{t("costPrice")} (XAF)</Label>
                <Input
                  id="costPrice"
                  type="number"
                  value={formData.costPrice}
                  onChange={(e) => handleInputChange("costPrice", Number.parseFloat(e.target.value) || 0)}
                  disabled={loading}
                />
              </div>
            </div>

            {/* Stock Information */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="stockQuantity">{t("stockQuantity")} *</Label>
                <Input
                  id="stockQuantity"
                  type="number"
                  value={formData.stockQuantity}
                  onChange={(e) => handleInputChange("stockQuantity", Number.parseInt(e.target.value) || 0)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="minStockLevel">{t("minStockLevel")}</Label>
                <Input
                  id="minStockLevel"
                  type="number"
                  value={formData.minStockLevel}
                  onChange={(e) => handleInputChange("minStockLevel", Number.parseInt(e.target.value) || 0)}
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxStockLevel">{t("maxStockLevel")}</Label>
                <Input
                  id="maxStockLevel"
                  type="number"
                  value={formData.maxStockLevel}
                  onChange={(e) => handleInputChange("maxStockLevel", Number.parseInt(e.target.value) || 0)}
                  disabled={loading}
                />
              </div>
            </div>

            {/* Additional Information */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tags">Tags (comma separated)</Label>
                <Input
                  id="tags"
                  value={formData.tags}
                  onChange={(e) => handleInputChange("tags", e.target.value)}
                  placeholder="e.g., organic, gluten-free, popular"
                  disabled={loading}
                />
              </div>

              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => handleInputChange("isActive", checked)}
                    disabled={loading}
                  />
                  <Label htmlFor="isActive">{t("active")}</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="isAvailable"
                    checked={formData.isAvailable}
                    onCheckedChange={(checked) => handleInputChange("isAvailable", checked)}
                    disabled={loading}
                  />
                  <Label htmlFor="isAvailable">{t("available")}</Label>
                </div>
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
                  t("save")
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
