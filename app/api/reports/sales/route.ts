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
    const dateFrom = new Date(searchParams.get("dateFrom") || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
    const dateTo = new Date(searchParams.get("dateTo") || new Date())
    const staff = searchParams.get("staff") || "all"
    const category = searchParams.get("category") || "all"
    const type = searchParams.get("type") || "summary"

    const db = await getDatabase()
    const orders = db.collection("orders")

    // Build query
    const query: any = {
      createdAt: { $gte: dateFrom, $lte: dateTo },
      status: "COMPLETED",
    }

    if (staff !== "all") {
      query.waiterName = staff
    }

    // Get orders
    const orderList = await orders.find(query).sort({ createdAt: -1 }).toArray()

    // Calculate summary
    const summary = {
      totalSales: orderList.reduce((sum, order) => sum + order.total, 0),
      totalOrders: orderList.length,
      avgOrderValue:
        orderList.length > 0 ? orderList.reduce((sum, order) => sum + order.total, 0) / orderList.length : 0,
      topProduct: "N/A", // Will be calculated from items
    }

    // Get staff performance
    const staffPerformanceData = await orders
      .aggregate([
        { $match: query },
        {
          $group: {
            _id: "$waiterName",
            totalSales: { $sum: "$total" },
            orderCount: { $sum: 1 },
          },
        },
        {
          $addFields: {
            avgOrderValue: { $divide: ["$totalSales", "$orderCount"] },
          },
        },
        { $sort: { totalSales: -1 } },
      ])
      .toArray()

    const staffPerformance = staffPerformanceData.map((item) => ({
      staffName: item._id || "Unknown",
      totalSales: item.totalSales,
      orderCount: item.orderCount,
      avgOrderValue: item.avgOrderValue,
    }))

    // Get product performance
    const productPerformanceData = await orders
      .aggregate([
        { $match: query },
        { $unwind: "$items" },
        {
          $group: {
            _id: "$items.productName",
            quantitySold: { $sum: "$items.quantity" },
            revenue: { $sum: "$items.totalPrice" },
          },
        },
        {
          $addFields: {
            category: "General", // Default category
          },
        },
        { $sort: { revenue: -1 } },
      ])
      .toArray()

    const productPerformance = productPerformanceData.map((item) => ({
      productName: item._id,
      quantitySold: item.quantitySold,
      revenue: item.revenue,
      category: item.category,
    }))

    // Format orders for detailed view
    const formattedOrders = orderList.map((order) => ({
      orderNumber: order.orderNumber,
      date: order.createdAt.toISOString(),
      customerName: order.customerName || "Walk-in",
      waiterName: order.waiterName || "Unknown",
      items: order.items.length,
      total: order.total,
      status: order.status,
      paymentMethod: order.paymentMethod || "N/A",
    }))

    return NextResponse.json({
      summary,
      orders: formattedOrders,
      staffPerformance,
      productPerformance,
    })
  } catch (error) {
    console.error("Error generating sales report:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
