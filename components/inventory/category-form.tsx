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

interface CategoryFormProps {
  categoryId?: string
  isEdit?: boolean
}

export function CategoryForm({ categoryId, isEdit = false }: CategoryFormProps) {
  const [formData, setFormData] = useState({
    nameEn: "",
    nameFr: "",
    descriptionEn: "",
    descriptionFr: "",
    parentId: "none", // Updated default value to be a non-empty string
    sortOrder: 0,
    isActive: true,
  })
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(isEdit)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const { t, language } = useLanguage()
  const router = useRouter()

  useEffect(() => {
    fetchCategories()
    if (isEdit && categoryId) {
      fetchCategory()
    }
  }, [isEdit, categoryId])

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

  const fetchCategory = async () => {
    try {
      const response = await fetch(`/api/inventory/categories/${categoryId}`)
      if (response.ok) {
        const category = await response.json()
        setFormData({
          nameEn: category.nameEn,
          nameFr: category.nameFr,
          descriptionEn: category.descriptionEn || "",
          descriptionFr: category.descriptionFr || "",
          parentId: category.parentId || "none", // Updated default value to be a non-empty string
          sortOrder: category.sortOrder,
          isActive: category.isActive,
        })
      } else {
        setError("Failed to load category")
      }
    } catch (error) {
      setError("Failed to load category")
    } finally {
      setInitialLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const url = isEdit ? `/api/inventory/categories/${categoryId}` : "/api/inventory/categories"
      const method = isEdit ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(isEdit ? t("categoryUpdated") : t("categoryCreated"))
        setTimeout(() => {
          router.push("/dashboard/inventory/categories")
        }, 2000)
      } else {
        setError(data.error || "Failed to save category")
      }
    } catch (error) {
      setError("Failed to save category")
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const getAvailableParentCategories = () => {
    return categories.filter((cat) => cat._id !== categoryId && !cat.parentId)
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
        <Button variant="ghost" onClick={() => router.push("/dashboard/inventory/categories")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h2 className="text-2xl font-bold">{isEdit ? t("editCategory") : t("addCategory")}</h2>
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
          <CardTitle>{t("categoryDetails")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
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
                <Label htmlFor="parentId">{t("parentCategory")}</Label>
                <Select value={formData.parentId} onValueChange={(value) => handleInputChange("parentId", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select parent category (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem> {/* Updated value prop to be a non-empty string */}
                    {getAvailableParentCategories().map((category) => (
                      <SelectItem key={category._id} value={category._id!}>
                        {language === "fr" ? category.nameFr : category.nameEn}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sortOrder">{t("sortOrder")}</Label>
                <Input
                  id="sortOrder"
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) => handleInputChange("sortOrder", Number.parseInt(e.target.value) || 0)}
                  disabled={loading}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => handleInputChange("isActive", checked)}
                  disabled={loading}
                />
                <Label htmlFor="isActive">{t("active")}</Label>
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/dashboard/inventory/categories")}
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
