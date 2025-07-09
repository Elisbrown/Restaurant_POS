import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { hashPassword, logAdminActivity, verifyToken } from "@/lib/auth"
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

    const staff = await users.findOne({ _id: new ObjectId(params.id) }, { projection: { password: 0 } })

    if (!staff) {
      return NextResponse.json({ error: "Staff member not found" }, { status: 404 })
    }

    return NextResponse.json(staff)
  } catch (error) {
    console.error("Error fetching staff member:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
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

    const { name, username, email, phone, role, assignedFloor, password } = await request.json()

    if (!name || !username || !email || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const db = await getDatabase()
    const users = db.collection("users")

    // Check if username or email already exists (excluding current user)
    const existingUser = await users.findOne({
      $and: [{ _id: { $ne: new ObjectId(params.id) } }, { $or: [{ username }, { email }] }],
    })

    if (existingUser) {
      return NextResponse.json({ error: "Username or email already exists" }, { status: 400 })
    }

    const updateData: any = {
      name,
      username,
      email,
      phone: phone || "",
      role,
      assignedFloor: role === "Waitress" ? assignedFloor : undefined,
      updatedAt: new Date(),
    }

    // Only update password if provided
    if (password) {
      updateData.password = await hashPassword(password)
      updateData.forcePasswordChange = true
    }

    const result = await users.updateOne({ _id: new ObjectId(params.id) }, { $set: updateData })

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
      action: "UPDATE_STAFF",
      targetUser: username,
      details: `Updated staff member: ${name} (${role})`,
      ipAddress: clientIP,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating staff member:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
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

    // Get staff info before deletion for logging
    const staff = await users.findOne({ _id: new ObjectId(params.id) })

    if (!staff) {
      return NextResponse.json({ error: "Staff member not found" }, { status: 404 })
    }

    // Prevent deletion of Super Admin
    if (staff.role === "Super Admin") {
      return NextResponse.json({ error: "Cannot delete Super Admin" }, { status: 400 })
    }

    const result = await users.deleteOne({ _id: new ObjectId(params.id) })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Staff member not found" }, { status: 404 })
    }

    // Log the activity
    const clientIP = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"
    const adminUser = await users.findOne({ _id: new ObjectId(decoded.userId) })

    await logAdminActivity({
      timestamp: new Date(),
      adminUser: adminUser?.username || "Unknown",
      adminEmail: adminUser?.email || "Unknown",
      action: "DELETE_STAFF",
      targetUser: staff.username,
      details: `Deleted staff member: ${staff.name} (${staff.role})`,
      ipAddress: clientIP,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting staff member:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
