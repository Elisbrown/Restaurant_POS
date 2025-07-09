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
    const user = searchParams.get("user") || "all"
    const activity = searchParams.get("activity") || "all"
    const status = searchParams.get("status") || "all"
    const type = searchParams.get("type") || "activities"
    const search = searchParams.get("search") || ""

    const db = await getDatabase()
    const loginLogs = db.collection("login_logs")
    const users = db.collection("users")
    const adminLogs = db.collection("admin_activity_logs")

    // Build query for login logs
    const loginQuery: any = {
      timestamp: { $gte: dateFrom, $lte: dateTo },
    }

    if (user !== "all") {
      loginQuery.$or = [{ username: user }, { email: user }]
    }

    if (activity !== "all") {
      loginQuery.action = activity
    }

    if (status !== "all") {
      loginQuery.success = status === "success"
    }

    if (search) {
      loginQuery.$or = [
        { username: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { ipAddress: { $regex: search, $options: "i" } },
      ]
    }

    // Get login/logout activities
    const activities = await loginLogs
      .aggregate([
        { $match: loginQuery },
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
        { $limit: 1000 },
      ])
      .toArray()

    // Calculate summary
    const totalLogins = activities.filter((a) => a.action === "login").length
    const failedLogins = activities.filter((a) => a.action === "login" && !a.success).length
    const uniqueUsers = [...new Set(activities.map((a) => a.username))].length

    const summary = {
      totalLogins,
      failedLogins,
      uniqueUsers,
      avgSessionTime: 45, // Default value - would need actual session tracking
    }

    // Format activities
    const formattedActivities = activities.map((activity) => ({
      timestamp: activity.timestamp.toISOString(),
      username: activity.username,
      email: activity.email || "N/A",
      activityType: activity.action,
      status: activity.success ? "Success" : "Failed",
      ipAddress: activity.ipAddress || "Unknown",
      userAgent: activity.userAgent,
      sessionDuration: activity.sessionDuration,
    }))

    // Get user summary
    const userSummaryData = await loginLogs
      .aggregate([
        { $match: loginQuery },
        {
          $group: {
            _id: "$username",
            totalLogins: { $sum: { $cond: [{ $eq: ["$action", "login"] }, 1, 0] } },
            failedAttempts: {
              $sum: { $cond: [{ $and: [{ $eq: ["$action", "login"] }, { $eq: ["$success", false] }] }, 1, 0] },
            },
            lastLogin: { $max: { $cond: [{ $eq: ["$action", "login"] }, "$timestamp", null] } },
          },
        },
      ])
      .toArray()

    const userSummary = await Promise.all(
      userSummaryData.map(async (userData) => {
        const userInfo = await users.findOne({ username: userData._id })
        return {
          username: userData._id,
          email: userInfo?.email || "N/A",
          role: userInfo?.role || "Unknown",
          totalLogins: userData.totalLogins,
          failedAttempts: userData.failedAttempts,
          lastLogin: userData.lastLogin?.toISOString() || "Never",
          avgSessionTime: 45, // Default value
        }
      }),
    )

    // Get security events (from admin logs or failed login attempts)
    const securityEvents = await loginLogs
      .aggregate([
        {
          $match: {
            timestamp: { $gte: dateFrom, $lte: dateTo },
            $or: [{ success: false }, { action: "security_event" }],
          },
        },
        {
          $addFields: {
            eventType: {
              $cond: {
                if: { $eq: ["$success", false] },
                then: "Failed Login",
                else: "Security Event",
              },
            },
            severity: {
              $cond: {
                if: { $eq: ["$success", false] },
                then: "Medium",
                else: "High",
              },
            },
            description: {
              $cond: {
                if: { $eq: ["$success", false] },
                then: "Failed login attempt",
                else: "Security event detected",
              },
            },
          },
        },
        { $sort: { timestamp: -1 } },
        { $limit: 100 },
      ])
      .toArray()

    const formattedSecurityEvents = securityEvents.map((event) => ({
      timestamp: event.timestamp.toISOString(),
      eventType: event.eventType,
      username: event.username,
      ipAddress: event.ipAddress || "Unknown",
      severity: event.severity,
      description: event.description,
    }))

    return NextResponse.json({
      summary,
      activities: formattedActivities,
      userSummary,
      securityEvents: formattedSecurityEvents,
    })
  } catch (error) {
    console.error("Error generating activity report:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
