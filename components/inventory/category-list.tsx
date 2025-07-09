"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
import { Search, Plus, Edit, Trash2, FolderOpen, Folder } from "lucide-react"
import type { Category } from "@/lib/models"

export function CategoryList() {
  const [categories, setCategories] = useState<Category[]>([])
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState<Category | null>(null)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const { t, language } = useLanguage()
  const { user } = useAuth()

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    const filtered = categories.filter((category) => {
      const name = language === "fr" ? category.nameFr : category.nameEn
      const description = language === "fr" ? category.descriptionFr : category.descriptionEn
      return (
        name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (description && description.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    })
    setFilteredCategories(filtered)
  }, [categories, searchTerm, language])

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/inventory/categories")
      if (response.ok) {
        const data = await response.json()
        setCategories(data)
      }
    } catch (error) {
      console.error("Error fetching categories:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (category: Category) => {
    setActionLoading(category._id!)
    try {
      const response = await fetch(`/api/inventory/categories/${category._id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setMessage({ type: "success", text: t("categoryDeleted") })
        fetchCategories()
      } else {
        const data = await response.json()
        setMessage({ type: "error", text: data.error || "Failed to delete category" })
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to delete category" })
    } finally {
      setActionLoading(null)
      setShowDeleteDialog(null)
    }
  }

  const getParentCategoryName = (parentId: string) => {
    const parent = categories.find((cat) => cat._id === parentId)
    if (!parent) return "-"
    return language === "fr" ? parent.nameFr : parent.nameEn
  }

  const getCategoryName = (category: Category) => {
    return language === "fr" ? category.nameFr : category.nameEn
  }

  const getCategoryDescription = (category: Category) => {
    return language === "fr" ? category.descriptionFr : category.descriptionEn
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
        <h2 className="text-2xl font-bold">{t("categoryList")}</h2>
        <Button onClick={() => (window.location.href = "/dashboard/inventory/categories/add")}>
          <Plus className="mr-2 h-4 w-4" />
          {t("addCategory")}
        </Button>
      </div>

      {message && (
        <Alert variant={message.type === "error" ? "destructive" : "default"}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-gray-400" />
            <Input
              placeholder={`${t("search")} categories...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("categoryName")}</TableHead>
                <TableHead>{t("description")}</TableHead>
                <TableHead>{t("parentCategory")}</TableHead>
                <TableHead>{t("sortOrder")}</TableHead>
                <TableHead>{t("status")}</TableHead>
                <TableHead>{t("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCategories.map((category) => (
                <TableRow key={category._id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center space-x-2">
                      {category.parentId ? <Folder className="h-4 w-4" /> : <FolderOpen className="h-4 w-4" />}
                      <span>{getCategoryName(category)}</span>
                    </div>
                  </TableCell>
                  <TableCell>{getCategoryDescription(category) || "-"}</TableCell>
                  <TableCell>{category.parentId ? getParentCategoryName(category.parentId) : "-"}</TableCell>
                  <TableCell>{category.sortOrder}</TableCell>
                  <TableCell>
                    <Badge variant={category.isActive ? "default" : "secondary"}>
                      {category.isActive ? t("active") : t("inactive")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => (window.location.href = `/dashboard/inventory/categories/${category._id}/edit`)}
                        disabled={actionLoading === category._id}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowDeleteDialog(category)}
                        disabled={actionLoading === category._id}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredCategories.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-500">
                    No categories found
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
              {t("delete")} {t("category")}
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{showDeleteDialog && getCategoryName(showDeleteDialog)}"? This action
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
