"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { useLanguage } from "@/contexts/language-context"
import { ArrowLeft, Upload, Download, FileText, Loader2 } from "lucide-react"

interface ImportResult {
  success: number
  errors: number
  details: string[]
}

export function CSVImport() {
  const [file, setFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState("")

  const { t } = useLanguage()
  const router = useRouter()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile && selectedFile.type === "text/csv") {
      setFile(selectedFile)
      setError("")
      setResult(null)
    } else {
      setError("Please select a valid CSV file")
      setFile(null)
    }
  }

  const downloadTemplate = async (type: "products" | "categories") => {
    try {
      const response = await fetch(`/api/inventory/${type}/template`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `${type}_template.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error("Error downloading template:", error)
    }
  }

  const handleImport = async (type: "products" | "categories") => {
    if (!file) {
      setError("Please select a file to import")
      return
    }

    setImporting(true)
    setProgress(0)
    setError("")
    setResult(null)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch(`/api/inventory/${type}/import`, {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (response.ok) {
        setResult(data)
        setProgress(100)
      } else {
        setError(data.error || "Import failed")
      }
    } catch (error) {
      setError("Import failed")
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" onClick={() => router.push("/dashboard/inventory")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h2 className="text-2xl font-bold">CSV Import</h2>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {result && (
        <Alert>
          <AlertDescription>
            Import completed: {result.success} successful, {result.errors} errors
            {result.details.length > 0 && (
              <div className="mt-2">
                <details>
                  <summary className="cursor-pointer">View details</summary>
                  <ul className="mt-2 space-y-1">
                    {result.details.map((detail, index) => (
                      <li key={index} className="text-sm">
                        {detail}
                      </li>
                    ))}
                  </ul>
                </details>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Products Import */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Import Products</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="products-file">Select CSV File</Label>
              <Input id="products-file" type="file" accept=".csv" onChange={handleFileChange} disabled={importing} />
            </div>

            <Button
              variant="outline"
              onClick={() => downloadTemplate("products")}
              className="w-full"
              disabled={importing}
            >
              <Download className="mr-2 h-4 w-4" />
              Download Products Template
            </Button>

            <Button onClick={() => handleImport("products")} disabled={!file || importing} className="w-full">
              {importing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Import Products
                </>
              )}
            </Button>

            {importing && (
              <div className="space-y-2">
                <Progress value={progress} className="w-full" />
                <p className="text-sm text-gray-600">Processing... {progress}%</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Categories Import */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Import Categories</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="categories-file">Select CSV File</Label>
              <Input id="categories-file" type="file" accept=".csv" onChange={handleFileChange} disabled={importing} />
            </div>

            <Button
              variant="outline"
              onClick={() => downloadTemplate("categories")}
              className="w-full"
              disabled={importing}
            >
              <Download className="mr-2 h-4 w-4" />
              Download Categories Template
            </Button>

            <Button onClick={() => handleImport("categories")} disabled={!file || importing} className="w-full">
              {importing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Import Categories
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Import Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Import Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Products CSV Format:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• nameEn, nameFr: Product names in English and French (required)</li>
              <li>• descriptionEn, descriptionFr: Product descriptions (optional)</li>
              <li>• sku: Stock Keeping Unit (auto-generated if empty)</li>
              <li>• barcode: Product barcode (optional)</li>
              <li>• categoryId: Category ID (required)</li>
              <li>• price: Selling price in XAF (required)</li>
              <li>• costPrice: Cost price in XAF (optional)</li>
              <li>• stockQuantity: Initial stock quantity (required)</li>
              <li>• minStockLevel: Minimum stock level (optional)</li>
              <li>• unit: Unit of measurement (piece, liter, kg, etc.)</li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium mb-2">Categories CSV Format:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• nameEn, nameFr: Category names in English and French (required)</li>
              <li>• descriptionEn, descriptionFr: Category descriptions (optional)</li>
              <li>• parentId: Parent category ID for subcategories (optional)</li>
              <li>• sortOrder: Display order (optional, defaults to 0)</li>
              <li>• isActive: Active status (true/false, defaults to true)</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
