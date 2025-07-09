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

    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type") || "summary"
    const category = searchParams.get("category") || "all"
    const status = searchParams.get("status") || "all"

    const db = await getDatabase()
    const products = db.collection("products")
    const categories = db.collection("categories")
    const stockMovements = db.collection("stock_movements")

    // Build query
    const query: any = { isActive: true }

    if (category !== "all") {
      query.categoryId = category
    }

    if (status !== "all") {
      switch (status) {
        case "IN_STOCK":
          query.$expr = { $gt: ["$stockQuantity", "$minStockLevel"] }
          break
        case "LOW_STOCK":
          query.$expr = { $and: [{ $lte: ["$stockQuantity", "$minStockLevel"] }, { $gt: ["$stockQuantity", 0] }] }
          break
        case "OUT_OF_STOCK":
          query.stockQuantity = 0
          break
      }
    }

    // Get products with category information
    const productList = await products
      .aggregate([
        { $match: query },
        {
          $lookup: {
            from: "categories",
            localField: "categoryId",
            foreignField: "_id",
            as: "category",
          },
        },
        {
          $addFields: {
            categoryName: { $arrayElemAt: ["$category.nameEn", 0] },
            totalValue: { $multiply: ["$stockQuantity", "$price"] },
            status: {
              $cond: {
                if: { $eq: ["$stockQuantity", 0] },
                then: "OUT_OF_STOCK",
                else: {
                  $cond: {
                    if: { $lte: ["$stockQuantity", "$minStockLevel"] },
                    then: "LOW_STOCK",
                    else: "IN_STOCK",
                  },
                },
              },
            },
          },
        },
        { $sort: { nameEn: 1 } },
      ])
      .toArray()

    // Calculate summary
    const summary = {
      totalProducts: productList.length,
      totalValue: productList.reduce((sum, product) => sum + product.totalValue, 0),
      lowStockItems: productList.filter((p) => p.status === "LOW_STOCK").length,
      outOfStockItems: productList.filter((p) => p.status === "OUT_OF_STOCK").length,
    }

    // Format products for response
    const formattedProducts = productList.map((product) => ({
      productName: product.nameEn,
      sku: product.sku,
      category: product.categoryName || "Unknown",
      currentStock: product.stockQuantity,
      minStock: product.minStockLevel,
      maxStock: product.maxStockLevel,
      unitPrice: product.price,
      totalValue: product.totalValue,
      status: product.status,
    }))

    // Get recent stock movements
    const movements = await stockMovements
      .aggregate([
        {
          $lookup: {
            from: "products",
            localField: "productId",
            foreignField: "_id",
            as: "product",
          },
        },
        {
          $addFields: {
            productName: { $arrayElemAt: ["$product.nameEn", 0] },
          },
        },
        { $sort: { timestamp: -1 } },
        { $limit: 100 },
      ])
      .toArray()

    const formattedMovements = movements.map((movement) => ({
      date: movement.timestamp.toISOString(),
      productName: movement.productName || "Unknown",
      type: movement.type,
      quantity: movement.quantity,
      reason: movement.reason,
      performedBy: movement.performedBy,
    }))

    // Get category summary
    const categoryData = await products
      .aggregate([
        { $match: { isActive: true } },
        {
          $lookup: {
            from: "categories",
            localField: "categoryId",
            foreignField: "_id",
            as: "category",
          },
        },
        {
          $addFields: {
            categoryName: { $arrayElemAt: ["$category.nameEn", 0] },
            totalValue: { $multiply: ["$stockQuantity", "$price"] },
            isLowStock: { $lte: ["$stockQuantity", "$minStockLevel"] },
          },
        },
        {
          $group: {
            _id: "$categoryName",
            productCount: { $sum: 1 },
            totalValue: { $sum: "$totalValue" },
            lowStockCount: {
              $sum: { $cond: ["$isLowStock", 1, 0] },
            },
          },
        },
        { $sort: { totalValue: -1 } },
      ])
      .toArray()

    const categoryStats = categoryData.map((cat) => ({
      categoryName: cat._id || "Unknown",
      productCount: cat.productCount,
      totalValue: cat.totalValue,
      lowStockCount: cat.lowStockCount,
    }))

    return NextResponse.json({
      summary,
      products: formattedProducts,
      movements: formattedMovements,
      categories: categoryStats,
    })
  } catch (error) {
    console.error("Error generating inventory report:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
