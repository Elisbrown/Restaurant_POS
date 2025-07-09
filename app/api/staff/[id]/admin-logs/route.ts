import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
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

    const db = await getDatabase()
    const users = db.collection("users")
    const logs = db.collection("admin_activity_logs")

    // Get staff info
    const staff = await users.findOne({ _id: new ObjectId(params.id) })

    if (!staff) {
      return NextResponse.json({ error: "Staff member not found" }, { status: 404 })
    }

    // Get admin activity logs related to this staff member
    const adminLogs = await logs
      .find({
        targetUser: staff.username,
      })
      .sort({ timestamp: -1 })
      .toArray()

    return NextResponse.json(adminLogs)
  } catch (error) {
    console.error("Error fetching admin logs:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
