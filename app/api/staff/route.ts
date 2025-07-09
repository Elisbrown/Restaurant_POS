import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { hashPassword, generateRandomPassword, logAdminActivity, verifyToken } from "@/lib/auth"
import { ObjectId } from "mongodb"

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

    const db = await getDatabase()
    const users = db.collection("users")

    const staff = await users
      .find(
        {},
        {
          projection: { password: 0 }, // Exclude password from response
        },
      )
      .toArray()

    return NextResponse.json(staff)
  } catch (error) {
    console.error("Error fetching staff:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
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

    const { name, username, email, phone, role, assignedFloor } = await request.json()

    if (!name || !username || !email || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const db = await getDatabase()
    const users = db.collection("users")

    // Check if username or email already exists
    const existingUser = await users.findOne({
      $or: [{ username }, { email }],
    })

    if (existingUser) {
      return NextResponse.json({ error: "Username or email already exists" }, { status: 400 })
    }

    // Generate random password
    const generatedPassword = await generateRandomPassword()
    const hashedPassword = await hashPassword(generatedPassword)

    const newStaff = {
      name,
      username,
      email,
      phone: phone || "",
      password: hashedPassword,
      role,
      assignedFloor: role === "Waitress" ? assignedFloor : undefined,
      isActive: true,
      forcePasswordChange: true,
      createdAt: new Date(),
    }

    const result = await users.insertOne(newStaff)

    // Log the activity
    const clientIP = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"

    // Get admin user info
    const adminUser = await users.findOne({ _id: new ObjectId(decoded.userId) })

    await logAdminActivity({
      timestamp: new Date(),
      adminUser: adminUser?.username || "Unknown",
      adminEmail: adminUser?.email || "Unknown",
      action: "CREATE_STAFF",
      targetUser: username,
      details: `Created new staff member: ${name} (${role})`,
      ipAddress: clientIP,
    })

    return NextResponse.json({
      success: true,
      id: result.insertedId,
      generatedPassword,
    })
  } catch (error) {
    console.error("Error creating staff:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
