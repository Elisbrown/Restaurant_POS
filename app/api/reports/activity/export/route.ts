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
    const type = searchParams.get("type") || "activities"

    const db = await getDatabase()
    const loginLogs = db.collection("login_logs")
    const users = db.collection("users")

    // Get login/logout activities
    const activities = await loginLogs
      .aggregate([
        {
          $match: {
            timestamp: { $gte: dateFrom, $lte: dateTo },
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "username",
            foreignField: "username",
            as: "userInfo",
          },
        },
        {
          $addFields: {
            email: { $arrayElemAt: ["$userInfo.email", 0] },
          },
        },
        { $sort: { timestamp: -1 } },
      ])
      .toArray()

    if (format === "csv") {
      const csvHeaders = ["Timestamp", "Username", "Email", "Activity Type", "Status", "IP Address"]

      const csvRows = activities.map((activity) => [
        activity.timestamp.toISOString(),
        activity.username,
        activity.email || "N/A",
        activity.action,
        activity.success ? "Success" : "Failed",
        activity.ipAddress || "Unknown",
      ])

      const csvContent = [
        `Login/Logout Activity Report`,
        `Period: ${dateFrom.toISOString().split("T")[0]} to ${dateTo.toISOString().split("T")[0]}`,
        "",
        csvHeaders.join(","),
        ...csvRows.map((row) => row.join(",")),
      ].join("\n")

      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="activity-report-${dateFrom.toISOString().split("T")[0]}-to-${dateTo.toISOString().split("T")[0]}.csv"`,
        },
      })
    }

    // For PDF format, return JSON data
    return NextResponse.json({
      activities,
      summary: {
        totalActivities: activities.length,
        totalLogins: activities.filter((a) => a.action === "login").length,
        failedLogins: activities.filter((a) => a.action === "login" && !a.success).length,
        dateRange: { from: dateFrom, to: dateTo },
      },
    })
  } catch (error) {
    console.error("Error exporting activity report:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
