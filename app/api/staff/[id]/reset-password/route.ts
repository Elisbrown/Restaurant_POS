import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { hashPassword, generateRandomPassword, logAdminActivity, verifyToken } from "@/lib/auth"
import { ObjectId } from "mongodb"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
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

    // Get staff info before update for logging
    const staff = await users.findOne({ _id: new ObjectId(params.id) })

    if (!staff) {
      return NextResponse.json({ error: "Staff member not found" }, { status: 404 })
    }

    // Generate new password
    const newPassword = await generateRandomPassword()
    const hashedPassword = await hashPassword(newPassword)

    const result = await users.updateOne(
      { _id: new ObjectId(params.id) },
      {
        $set: {
          password: hashedPassword,
          forcePasswordChange: true,
          updatedAt: new Date(),
        },
      },
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
      action: "RESET_PASSWORD",
      targetUser: staff.username,
      details: `Reset password for staff member: ${staff.name}`,
      ipAddress: clientIP,
    })

    return NextResponse.json({ success: true, newPassword })
  } catch (error) {
    console.error("Error resetting password:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
