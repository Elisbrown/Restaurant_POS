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
    const categories = db.collection("categories")

    // Find products where stock is at or below minimum level
    const lowStockProducts = await products
      .find({
        $expr: {
          $lte: ["$stockQuantity", "$minStockLevel"],
        },
        isActive: true,
      })
      .sort({ stockQuantity: 1 })
      .toArray()

    // Get category information for each product
    const categoryMap = new Map()
    const categoryIds = [...new Set(lowStockProducts.map((p) => p.categoryId))]

    const categoryList = await categories.find({ _id: { $in: categoryIds } }).toArray()
    categoryList.forEach((cat) => {
      categoryMap.set(cat._id.toString(), cat)
    })

    // Enhance products with category names
    const enhancedProducts = lowStockProducts.map((product) => {
      const category = categoryMap.get(product.categoryId)
      return {
        ...product,
        categoryName: category ? category.nameEn : "Unknown Category",
      }
    })

    return NextResponse.json(enhancedProducts)
  } catch (error) {
    console.error("Error fetching low stock products:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
