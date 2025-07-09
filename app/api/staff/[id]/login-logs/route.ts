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
    const logs = db.collection("login_logs")

    // Get staff info
    const staff = await users.findOne({ _id: new ObjectId(params.id) })

    if (!staff) {
      return NextResponse.json({ error: "Staff member not found" }, { status: 404 })
    }

    // Get login logs for this staff member
    const loginLogs = await logs
      .find({
        $or: [{ username: staff.username }, { email: staff.email }],
      })
      .sort({ timestamp: -1 })
      .toArray()

    return NextResponse.json(loginLogs)
  } catch (error) {
    console.error("Error fetching login logs:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
