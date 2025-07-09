import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import {
  verifyPassword,
  hashPassword,
  generateToken,
  validatePassword,
  logAdminActivity,
  verifyToken,
} from "@/lib/auth"
import { ObjectId } from "mongodb"

export async function POST(request: NextRequest) {
  try {
    const { currentPassword, newPassword } = await request.json()

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "Current password and new password are required" }, { status: 400 })
    }

    // Validate new password
    const validation = validatePassword(newPassword)
    if (!validation.isValid) {
      return NextResponse.json({ error: validation.errors.join(", ") }, { status: 400 })
    }

    const token =
      request.headers.get("authorization")?.replace("Bearer ", "") ||
      request.cookies.get("platinum-lounge-token")?.value

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const db = await getDatabase()
    const users = db.collection("users")

    const user = await users.findOne({ _id: new ObjectId(decoded.userId) })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Verify current password
    const isValidPassword = await verifyPassword(currentPassword, user.password)
    if (!isValidPassword) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 })
    }

    // Hash new password
    const hashedNewPassword = await hashPassword(newPassword)

    // Update password and remove force password change flag
    await users.updateOne(
      { _id: new ObjectId(decoded.userId) },
      {
        $set: {
          password: hashedNewPassword,
          forcePasswordChange: false,
          updatedAt: new Date(),
        },
      },
    )

    // Log the activity
    const clientIP = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"

    await logAdminActivity({
      timestamp: new Date(),
      adminUser: user.username,
      adminEmail: user.email,
      action: "CHANGE_PASSWORD",
      targetUser: user.username,
      details: "User changed their own password",
      ipAddress: clientIP,
    })

    // Generate new token
    const newToken = generateToken(user._id.toString(), user.role)

    return NextResponse.json({ success: true, token: newToken })
  } catch (error) {
    console.error("Change password error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
