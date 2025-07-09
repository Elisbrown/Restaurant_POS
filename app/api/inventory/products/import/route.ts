import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { logAdminActivity, verifyToken } from "@/lib/auth"
import { ObjectId } from "mongodb"

export async function POST(request: NextRequest) {
  try {
    const token =
      request.headers.get("authorization")?.replace("Bearer ", "") ||
      request.cookies.get("platinum-lounge-token")?.value

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || !["Super Admin", "Manager", "Stock Manager"].includes(decoded.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    const csvText = await file.text()
    const lines = csvText.split("\n").filter((line) => line.trim())
    const headers = lines[0].split(",").map((h) => h.replace(/"/g, "").trim())

    const db = await getDatabase()
    const products = db.collection("products")
    const categories = db.collection("categories")
    const stockMovements = db.collection("stock_movements")
    const users = db.collection("users")

    let successCount = 0
    let errorCount = 0
    const details: string[] = []

    // Get all categories for validation
    const categoryList = await categories.find({}).toArray()
    const categoryMap = new Map(categoryList.map((cat) => [cat._id.toString(), cat]))

    for (let i = 1; i < lines.length; i++) {
      try {
        const values = lines[i].split(",").map((v) => v.replace(/"/g, "").trim())
        const row: any = {}

        headers.forEach((header, index) => {
          row[header] = values[index] || ""
        })

        // Validate required fields
        if (!row.nameEn || !row.nameFr || !row.categoryId || !row.price) {
          details.push(`Row ${i + 1}: Missing required fields`)
          errorCount++
          continue
        }

        // Validate category exists
        if (!categoryMap.has(row.categoryId)) {
          details.push(`Row ${i + 1}: Invalid category ID`)
          errorCount++
          continue
        }

        // Generate SKU if not provided
        const sku =
          row.sku || `PL${Date.now().toString().slice(-6)}${Math.random().toString(36).substring(2, 5).toUpperCase()}`

        // Check if SKU already exists
        const existingProduct = await products.findOne({ sku })
        if (existingProduct) {
          details.push(`Row ${i + 1}: SKU already exists`)
          errorCount++
          continue
        }

        const newProduct = {
          nameEn: row.nameEn,
          nameFr: row.nameFr,
          descriptionEn: row.descriptionEn || "",
          descriptionFr: row.descriptionFr || "",
          sku,
          barcode: row.barcode || "",
          categoryId: row.categoryId,
          price: Number.parseFloat(row.price) || 0,
          costPrice: Number.parseFloat(row.costPrice) || 0,
          images: [],
          stockQuantity: Number.parseInt(row.stockQuantity) || 0,
          minStockLevel: Number.parseInt(row.minStockLevel) || 0,
          maxStockLevel: Number.parseInt(row.maxStockLevel) || 0,
          unit: row.unit || "piece",
          isActive: row.isActive !== "false",
          isAvailable: row.isAvailable !== "false",
          tags: row.tags ? row.tags.split(",").map((tag: string) => tag.trim()) : [],
          createdAt: new Date(),
          createdBy: decoded.userId,
        }

        const result = await products.insertOne(newProduct)

        // Create initial stock movement if stock quantity > 0
        if (newProduct.stockQuantity > 0) {
          await stockMovements.insertOne({
            productId: result.insertedId.toString(),
            type: "IN",
            quantity: newProduct.stockQuantity,
            previousStock: 0,
            newStock: newProduct.stockQuantity,
            reason: "Initial stock from CSV import",
            performedBy: decoded.userId,
            timestamp: new Date(),
          })
        }

        successCount++
      } catch (error) {
        details.push(`Row ${i + 1}: ${error instanceof Error ? error.message : "Unknown error"}`)
        errorCount++
      }
    }

    // Log the activity
    const clientIP = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"
    const adminUser = await users.findOne({ _id: new ObjectId(decoded.userId) })

    await logAdminActivity({
      timestamp: new Date(),
      adminUser: adminUser?.username || "Unknown",
      adminEmail: adminUser?.email || "Unknown",
      action: "IMPORT_PRODUCTS",
      details: `Imported ${successCount} products, ${errorCount} errors`,
      ipAddress: clientIP,
    })

    return NextResponse.json({
      success: successCount,
      errors: errorCount,
      details,
    })
  } catch (error) {
    console.error("Error importing products:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
