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
    const role = searchParams.get("role") || "all"
    const type = searchParams.get("type") || "performance"

    const db = await getDatabase()
    const orders = db.collection("orders")
    const users = db.collection("users")
    const loginLogs = db.collection("login_logs")

    // Build user query
    const userQuery: any = { isActive: true }
    if (role !== "all") {
      userQuery.role = role
    }

    const staffList = await users.find(userQuery).toArray()

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
      ])
      .toArray()

    // Get login/logout data for attendance
    const attendanceData = await loginLogs
      .aggregate([
        {
          $match: {
            timestamp: { $gte: dateFrom, $lte: dateTo },
          },
        },
        {
          $group: {
            _id: {
              username: "$username",
              date: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
            },
            loginTime: { $min: { $cond: [{ $eq: ["$action", "login"] }, "$timestamp", null] } },
            logoutTime: { $max: { $cond: [{ $eq: ["$action", "logout"] }, "$timestamp", null] } },
          },
        },
      ])
      .toArray()

    // Calculate summary
    const summary = {
      totalStaff: staffList.length,
      activeStaff: staffList.filter((staff) => staff.isActive).length,
      topPerformer:
        performanceData.length > 0 ? performanceData.sort((a, b) => b.totalSales - a.totalSales)[0]._id : "N/A",
      avgPerformance:
        performanceData.length > 0
          ? performanceData.reduce((sum, staff) => sum + staff.totalSales, 0) / performanceData.length
          : 0,
    }

    // Format performance data
    const performance = performanceData.map((staff) => {
      const staffInfo = staffList.find((s) => s.username === staff._id || s.name === staff._id)
      return {
        staffName: staff._id || "Unknown",
        role: staffInfo?.role || "Unknown",
        totalSales: staff.totalSales,
        orderCount: staff.orderCount,
        avgOrderValue: staff.avgOrderValue,
        hoursWorked: 8, // Default value - would need actual time tracking
        rating: 4.5, // Default value - would need rating system
        lastActive: staffInfo?.lastLogin?.toISOString() || new Date().toISOString(),
      }
    })

    // Format attendance data
    const attendance = attendanceData.map((record) => {
      const staffInfo = staffList.find((s) => s.username === record._id.username)
      const hoursWorked =
        record.loginTime && record.logoutTime
          ? (record.logoutTime.getTime() - record.loginTime.getTime()) / (1000 * 60 * 60)
          : 0

      return {
        staffName: staffInfo?.name || record._id.username,
        role: staffInfo?.role || "Unknown",
        date: record._id.date,
        loginTime: record.loginTime?.toISOString() || "",
        logoutTime: record.logoutTime?.toISOString() || "",
        hoursWorked: Math.round(hoursWorked * 100) / 100,
      }
    })

    // Create rankings
    const rankings = performanceData
      .sort((a, b) => b.totalSales - a.totalSales)
      .map((staff, index) => {
        const staffInfo = staffList.find((s) => s.username === staff._id || s.name === staff._id)
        return {
          staffName: staff._id || "Unknown",
          role: staffInfo?.role || "Unknown",
          totalSales: staff.totalSales,
          rank: index + 1,
        }
      })

    return NextResponse.json({
      summary,
      performance,
      attendance,
      rankings,
    })
  } catch (error) {
    console.error("Error generating staff report:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
