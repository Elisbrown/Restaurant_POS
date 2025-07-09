import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { logAdminActivity, verifyToken } from "@/lib/auth"
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
    if (!decoded || !["Super Admin", "Manager", "Stock Manager"].includes(decoded.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const db = await getDatabase()
    const categories = db.collection("categories")

    const category = await categories.findOne({ _id: new ObjectId(params.id) })

    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 })
    }

    return NextResponse.json(category)
  } catch (error) {
    console.error("Error fetching category:", error)
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

    // Check if category name already exists (excluding current category)
    const existingCategory = await categories.findOne({
      $and: [{ _id: { $ne: new ObjectId(params.id) } }, { $or: [{ nameEn }, { nameFr }] }],
    })

    if (existingCategory) {
      return NextResponse.json({ error: "Category name already exists" }, { status: 400 })
    }

    const updateData = {
      nameEn,
      nameFr,
      descriptionEn: descriptionEn || "",
      descriptionFr: descriptionFr || "",
      parentId: parentId || null,
      sortOrder: sortOrder || 0,
      isActive: isActive !== false,
      updatedAt: new Date(),
    }

    const result = await categories.updateOne({ _id: new ObjectId(params.id) }, { $set: updateData })

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 })
    }

    // Log the activity
    const clientIP = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"
    const adminUser = await users.findOne({ _id: new ObjectId(decoded.userId) })

    await logAdminActivity({
      timestamp: new Date(),
      adminUser: adminUser?.username || "Unknown",
      adminEmail: adminUser?.email || "Unknown",
      action: "UPDATE_CATEGORY",
      details: `Updated category: ${nameEn} / ${nameFr}`,
      ipAddress: clientIP,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating category:", error)
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
    const categories = db.collection("categories")
    const products = db.collection("products")
    const users = db.collection("users")

    // Check if category has products
    const productsCount = await products.countDocuments({ categoryId: params.id })
    if (productsCount > 0) {
      return NextResponse.json({ error: "Cannot delete category with existing products" }, { status: 400 })
    }

    // Check if category has subcategories
    const subcategoriesCount = await categories.countDocuments({ parentId: params.id })
    if (subcategoriesCount > 0) {
      return NextResponse.json({ error: "Cannot delete category with subcategories" }, { status: 400 })
    }

    // Get category info before deletion for logging
    const category = await categories.findOne({ _id: new ObjectId(params.id) })

    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 })
    }

    const result = await categories.deleteOne({ _id: new ObjectId(params.id) })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 })
    }

    // Log the activity
    const clientIP = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"
    const adminUser = await users.findOne({ _id: new ObjectId(decoded.userId) })

    await logAdminActivity({
      timestamp: new Date(),
      adminUser: adminUser?.username || "Unknown",
      adminEmail: adminUser?.email || "Unknown",
      action: "DELETE_CATEGORY",
      details: `Deleted category: ${category.nameEn} / ${category.nameFr}`,
      ipAddress: clientIP,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting category:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
