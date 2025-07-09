import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { verifyPassword, generateToken, logActivity, createSuperAdmin } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json({ error: "Username and password are required" }, { status: 400 })
    }

    // Ensure super admin exists
    await createSuperAdmin()

    const db = await getDatabase()
    const users = db.collection("users")

    const user = await users.findOne({
      $or: [{ username: username }, { email: username }],
      isActive: true,
    })

    const clientIP = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"

    if (!user) {
      await logActivity({
        username,
        email: username,
        timestamp: new Date(),
        success: false,
        ipAddress: clientIP,
        action: "login",
      })

      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    const isValidPassword = await verifyPassword(password, user.password)

    if (!isValidPassword) {
      await logActivity({
        username: user.username,
        email: user.email,
        timestamp: new Date(),
        success: false,
        ipAddress: clientIP,
        action: "login",
      })

      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Update last login
    await users.updateOne({ _id: user._id }, { $set: { lastLogin: new Date() } })

    // Log successful login
    await logActivity({
      username: user.username,
      email: user.email,
      timestamp: new Date(),
      success: true,
      ipAddress: clientIP,
      action: "login",
    })

    const token = generateToken(user._id.toString(), user.role)

    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json({
      user: userWithoutPassword,
      token,
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
