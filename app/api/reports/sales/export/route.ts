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
    const dateFrom = new Date(searchParams.get("dateFrom") || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
    const dateTo = new Date(searchParams.get("dateTo") || new Date())
    const staff = searchParams.get("staff") || "all"
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

    const orderList = await orders.find(query).sort({ createdAt: -1 }).toArray()

    if (format === "csv") {
      let csvContent = ""

      if (type === "detailed") {
        const csvHeaders = [
          "Order Number",
          "Date",
          "Customer Name",
          "Waiter Name",
          "Items Count",
          "Total Amount",
          "Status",
          "Payment Method",
        ]

        const csvRows = orderList.map((order) => [
          order.orderNumber,
          order.createdAt.toISOString().split("T")[0],
          order.customerName || "Walk-in",
          order.waiterName || "Unknown",
          order.items.length,
          order.total,
          order.status,
          order.paymentMethod || "N/A",
        ])

        csvContent = [csvHeaders.join(","), ...csvRows.map((row) => row.join(","))].join("\n")
      } else {
        // Summary format
        const totalSales = orderList.reduce((sum, order) => sum + order.total, 0)
        const totalOrders = orderList.length
        const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0

        csvContent = [
          "Sales Report Summary",
          `Period: ${dateFrom.toISOString().split("T")[0]} to ${dateTo.toISOString().split("T")[0]}`,
          "",
          "Metric,Value",
          `Total Sales,${totalSales} XAF`,
          `Total Orders,${totalOrders}`,
          `Average Order Value,${avgOrderValue.toFixed(2)} XAF`,
          "",
          "Top Staff Performance",
          "Staff Name,Total Sales,Order Count",
        ].join("\n")

        // Add staff performance data
        const staffData = await orders
          .aggregate([
            { $match: query },
            {
              $group: {
                _id: "$waiterName",
                totalSales: { $sum: "$total" },
                orderCount: { $sum: 1 },
              },
            },
            { $sort: { totalSales: -1 } },
            { $limit: 10 },
          ])
          .toArray()

        const staffRows = staffData.map((staff) => `${staff._id || "Unknown"},${staff.totalSales},${staff.orderCount}`)

        csvContent += "\n" + staffRows.join("\n")
      }

      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="sales-report-${dateFrom.toISOString().split("T")[0]}-to-${dateTo.toISOString().split("T")[0]}.csv"`,
        },
      })
    }

    // For PDF format, return JSON data
    return NextResponse.json({
      orders: orderList,
      summary: {
        totalOrders: orderList.length,
        totalSales: orderList.reduce((sum, order) => sum + order.total, 0),
        dateRange: { from: dateFrom, to: dateTo },
      },
    })
  } catch (error) {
    console.error("Error exporting sales report:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
