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
    const format = searchParams.get("format") || "csv"
    const type = searchParams.get("type") || "summary"
    const category = searchParams.get("category") || "all"
    const status = searchParams.get("status") || "all"

    const db = await getDatabase()
    const products = db.collection("products")

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

    if (format === "csv") {
      const csvHeaders = [
        "Product Name",
        "SKU",
        "Category",
        "Current Stock",
        "Min Stock",
        "Max Stock",
        "Unit Price",
        "Total Value",
        "Status",
      ]

      const csvRows = productList.map((product) => [
        product.nameEn,
        product.sku,
        product.categoryName || "Unknown",
        product.stockQuantity,
        product.minStockLevel,
        product.maxStockLevel,
        product.price,
        product.totalValue,
        product.status,
      ])

      const csvContent = [csvHeaders.join(","), ...csvRows.map((row) => row.join(","))].join("\n")

      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="inventory-report-${new Date().toISOString().split("T")[0]}.csv"`,
        },
      })
    }

    // For PDF format, return JSON data
    return NextResponse.json({
      products: productList,
      summary: {
        totalProducts: productList.length,
        totalValue: productList.reduce((sum, product) => sum + product.totalValue, 0),
        lowStockItems: productList.filter((p) => p.status === "LOW_STOCK").length,
        outOfStockItems: productList.filter((p) => p.status === "OUT_OF_STOCK").length,
      },
    })
  } catch (error) {
    console.error("Error exporting inventory report:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
