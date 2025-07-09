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
    const format = searchParams.get("format") || "csv"
    const range = searchParams.get("range") || "7d"

    const db = await getDatabase()
    const orders = db.collection("orders")

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

    // Get dashboard data for export
    const dashboardOrders = await orders
      .find({
        createdAt: { $gte: startDate },
        status: "COMPLETED",
      })
      .toArray()

    if (format === "csv") {
      const csvHeaders = ["Order Number", "Date", "Customer", "Waiter", "Table", "Items", "Total", "Payment Method"]

      const csvRows = dashboardOrders.map((order) => [
        order.orderNumber,
        order.createdAt.toISOString().split("T")[0],
        order.customerName || "Walk-in",
        order.waiterName || "Unknown",
        order.tableNumber || "N/A",
        order.items.length,
        order.total,
        order.paymentMethod || "N/A",
      ])

      const csvContent = [csvHeaders.join(","), ...csvRows.map((row) => row.join(","))].join("\n")

      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="dashboard-export-${new Date().toISOString().split("T")[0]}.csv"`,
        },
      })
    }

    // For PDF format, return JSON data that can be processed by frontend
    return NextResponse.json({
      orders: dashboardOrders,
      summary: {
        totalOrders: dashboardOrders.length,
        totalSales: dashboardOrders.reduce((sum, order) => sum + order.total, 0),
        dateRange: { from: startDate, to: now },
      },
    })
  } catch (error) {
    console.error("Error exporting dashboard data:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
