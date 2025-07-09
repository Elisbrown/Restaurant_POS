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
    if (!decoded || !["Super Admin", "Manager"].includes(decoded.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const range = searchParams.get("range") || "7d"

    const db = await getDatabase()
    const orders = db.collection("orders")
    const products = db.collection("products")
    const users = db.collection("users")

    // Calculate date range
    const now = new Date()
    let startDate: Date

    switch (range) {
      case "1d":
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        break
      case "30d":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case "90d":
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
      default: // 7d
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    }

    // Get KPIs
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

    const [todayOrders, weekOrders, monthOrders] = await Promise.all([
      orders
        .find({
          createdAt: { $gte: today },
          status: "COMPLETED",
        })
        .toArray(),
      orders
        .find({
          createdAt: { $gte: weekAgo },
          status: "COMPLETED",
        })
        .toArray(),
      orders
        .find({
          createdAt: { $gte: monthAgo },
          status: "COMPLETED",
        })
        .toArray(),
    ])

    const kpis = {
      todaySales: todayOrders.reduce((sum, order) => sum + order.total, 0),
      weekSales: weekOrders.reduce((sum, order) => sum + order.total, 0),
      monthSales: monthOrders.reduce((sum, order) => sum + order.total, 0),
      todayOrders: todayOrders.length,
      weekOrders: weekOrders.length,
      monthOrders: monthOrders.length,
      activeStaff: await users.countDocuments({ isActive: true }),
      lowStockItems: await products.countDocuments({
        $expr: { $lte: ["$stockQuantity", "$minStockLevel"] },
        isActive: true,
      }),
    }

    // Get sales trend data
    const salesTrendData = await orders
      .aggregate([
        {
          $match: {
            createdAt: { $gte: startDate },
            status: "COMPLETED",
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
            },
            sales: { $sum: "$total" },
            orders: { $sum: 1 },
          },
        },
        {
          $sort: { _id: 1 },
        },
      ])
      .toArray()

    const salesTrend = salesTrendData.map((item) => ({
      date: item._id,
      sales: item.sales,
      orders: item.orders,
    }))

    // Get top products
    const topProductsData = await orders
      .aggregate([
        {
          $match: {
            createdAt: { $gte: startDate },
            status: "COMPLETED",
          },
        },
        { $unwind: "$items" },
        {
          $group: {
            _id: "$items.productName",
            quantity: { $sum: "$items.quantity" },
            revenue: { $sum: "$items.totalPrice" },
          },
        },
        {
          $sort: { revenue: -1 },
        },
        { $limit: 10 },
      ])
      .toArray()

    const topProducts = topProductsData.map((item) => ({
      productName: item._id,
      quantity: item.quantity,
      revenue: item.revenue,
    }))

    // Get staff performance
    const staffPerformanceData = await orders
      .aggregate([
        {
          $match: {
            createdAt: { $gte: startDate },
            status: "COMPLETED",
          },
        },
        {
          $group: {
            _id: "$waiterName",
            sales: { $sum: "$total" },
            orders: { $sum: 1 },
          },
        },
        {
          $addFields: {
            avgOrderValue: { $divide: ["$sales", "$orders"] },
          },
        },
        {
          $sort: { sales: -1 },
        },
      ])
      .toArray()

    const staffPerformance = staffPerformanceData.map((item) => ({
      staffName: item._id || "Unknown",
      sales: item.sales,
      orders: item.orders,
      avgOrderValue: item.avgOrderValue,
    }))

    // Get low stock alerts
    const lowStockAlerts = await products
      .aggregate([
        {
          $match: {
            $expr: { $lte: ["$stockQuantity", "$minStockLevel"] },
            isActive: true,
          },
        },
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
          },
        },
        {
          $project: {
            productName: "$nameEn",
            currentStock: "$stockQuantity",
            minStock: "$minStockLevel",
            category: "$categoryName",
          },
        },
        { $limit: 10 },
      ])
      .toArray()

    return NextResponse.json({
      kpis,
      salesTrend,
      topProducts,
      staffPerformance,
      lowStockAlerts,
    })
  } catch (error) {
    console.error("Error fetching dashboard analytics:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
