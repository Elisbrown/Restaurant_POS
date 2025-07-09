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
    const role = searchParams.get("role") || "all"
    const type = searchParams.get("type") || "performance"

    const db = await getDatabase()
    const orders = db.collection("orders")
    const users = db.collection("users")

    // Get staff performance data
    const performanceData = await orders
      .aggregate([
        {
          $match: {
            createdAt: { $gte: dateFrom, $lte: dateTo },
            status: "COMPLETED",
          },
        },
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

    if (format === "csv") {
      const csvHeaders = ["Staff Name", "Total Sales (XAF)", "Order Count", "Average Order Value (XAF)"]

      const csvRows = performanceData.map((staff) => [
        staff._id || "Unknown",
        staff.totalSales,
        staff.orderCount,
        Math.round(staff.avgOrderValue),
      ])

      const csvContent = [
        `Staff Performance Report`,
        `Period: ${dateFrom.toISOString().split("T")[0]} to ${dateTo.toISOString().split("T")[0]}`,
        "",
        csvHeaders.join(","),
        ...csvRows.map((row) => row.join(",")),
      ].join("\n")

      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="staff-report-${dateFrom.toISOString().split("T")[0]}-to-${dateTo.toISOString().split("T")[0]}.csv"`,
        },
      })
    }

    // For PDF format, return JSON data
    return NextResponse.json({
      performance: performanceData,
      summary: {
        totalStaff: performanceData.length,
        totalSales: performanceData.reduce((sum, staff) => sum + staff.totalSales, 0),
        dateRange: { from: dateFrom, to: dateTo },
      },
    })
  } catch (error) {
    console.error("Error exporting staff report:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
