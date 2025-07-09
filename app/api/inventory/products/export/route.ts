import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"

export async function GET(request: NextRequest) {
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

    const db = await getDatabase()
    const products = db.collection("products")

    const productList = await products.find({}).sort({ nameEn: 1 }).toArray()

    // Create CSV content
    const headers = [
      "nameEn",
      "nameFr",
      "descriptionEn",
      "descriptionFr",
      "sku",
      "barcode",
      "categoryId",
      "price",
      "costPrice",
      "stockQuantity",
      "minStockLevel",
      "maxStockLevel",
      "unit",
      "isActive",
      "isAvailable",
      "tags",
    ]

    const csvRows = [headers.join(",")]

    productList.forEach((product) => {
      const row = [
        `"${product.nameEn || ""}"`,
        `"${product.nameFr || ""}"`,
        `"${product.descriptionEn || ""}"`,
        `"${product.descriptionFr || ""}"`,
        `"${product.sku || ""}"`,
        `"${product.barcode || ""}"`,
        `"${product.categoryId || ""}"`,
        product.price || 0,
        product.costPrice || 0,
        product.stockQuantity || 0,
        product.minStockLevel || 0,
        product.maxStockLevel || 0,
        `"${product.unit || "piece"}"`,
        product.isActive !== false,
        product.isAvailable !== false,
        `"${(product.tags || []).join(",")}"`,
      ]
      csvRows.push(row.join(","))
    })

    const csvContent = csvRows.join("\n")

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": "attachment; filename=products_export.csv",
      },
    })
  } catch (error) {
    console.error("Error exporting products:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
