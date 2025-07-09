import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { logAdminActivity, verifyToken } from "@/lib/auth"
import { ObjectId } from "mongodb"

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
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

    const { isActive } = await request.json()

    const db = await getDatabase()
    const users = db.collection("users")

    // Get staff info before update for logging
    const staff = await users.findOne({ _id: new ObjectId(params.id) })

    if (!staff) {
      return NextResponse.json({ error: "Staff member not found" }, { status: 404 })
    }

    // Prevent deactivation of Super Admin
    if (staff.role === "Super Admin") {
      return NextResponse.json({ error: "Cannot modify Super Admin status" }, { status: 400 })
    }

    const result = await users.updateOne(
      { _id: new ObjectId(params.id) },
      { $set: { isActive, updatedAt: new Date() } },
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Staff member not found" }, { status: 404 })
    }

    // Log the activity
    const clientIP = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"
    const adminUser = await users.findOne({ _id: new ObjectId(decoded.userId) })

    await logAdminActivity({
      timestamp: new Date(),
      adminUser: adminUser?.username || "Unknown",
      adminEmail: adminUser?.email || "Unknown",
      action: isActive ? "ACTIVATE_STAFF" : "DEACTIVATE_STAFF",
      targetUser: staff.username,
      details: `${isActive ? "Activated" : "Deactivated"} staff member: ${staff.name}`,
      ipAddress: clientIP,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating staff status:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
