import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { logAdminActivity, verifyToken } from "@/lib/auth"
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
    if (!decoded || !["Super Admin", "Manager", "Stock Manager"].includes(decoded.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const db = await getDatabase()
    const categories = db.collection("categories")

    const categoryList = await categories.find({}).sort({ sortOrder: 1, nameEn: 1 }).toArray()

    return NextResponse.json(categoryList)
  } catch (error) {
    console.error("Error fetching categories:", error)
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
    if (!decoded || !["Super Admin", "Manager", "Stock Manager"].includes(decoded.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { nameEn, nameFr, descriptionEn, descriptionFr, parentId, sortOrder, isActive } = await request.json()

    if (!nameEn || !nameFr) {
      return NextResponse.json({ error: "Name in both languages is required" }, { status: 400 })
    }

    const db = await getDatabase()
    const categories = db.collection("categories")
    const users = db.collection("users")

    // Check if category name already exists
    const existingCategory = await categories.findOne({
      $or: [{ nameEn }, { nameFr }],
    })

    if (existingCategory) {
      return NextResponse.json({ error: "Category name already exists" }, { status: 400 })
    }

    const newCategory = {
      nameEn,
      nameFr,
      descriptionEn: descriptionEn || "",
      descriptionFr: descriptionFr || "",
      parentId: parentId || null,
      sortOrder: sortOrder || 0,
      isActive: isActive !== false,
      createdAt: new Date(),
    }

    const result = await categories.insertOne(newCategory)

    // Log the activity
    const clientIP = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"
    const adminUser = await users.findOne({ _id: new ObjectId(decoded.userId) })

    await logAdminActivity({
      timestamp: new Date(),
      adminUser: adminUser?.username || "Unknown",
      adminEmail: adminUser?.email || "Unknown",
      action: "CREATE_CATEGORY",
      details: `Created category: ${nameEn} / ${nameFr}`,
      ipAddress: clientIP,
    })

    return NextResponse.json({ success: true, id: result.insertedId })
  } catch (error) {
    console.error("Error creating category:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
