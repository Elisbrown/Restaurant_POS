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
    const suppliers = db.collection("suppliers")

    const supplier = await suppliers.findOne({ _id: new ObjectId(params.id) })

    if (!supplier) {
      return NextResponse.json({ error: "Supplier not found" }, { status: 404 })
    }

    return NextResponse.json(supplier)
  } catch (error) {
    console.error("Error fetching supplier:", error)
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

    const { name, contactPerson, email, phone, address, city, country, paymentTerms, isActive } = await request.json()

    if (!name || !contactPerson || !email || !phone || !city || !country) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const db = await getDatabase()
    const suppliers = db.collection("suppliers")
    const users = db.collection("users")

    // Check if email already exists (excluding current supplier)
    const existingSupplier = await suppliers.findOne({
      $and: [{ _id: { $ne: new ObjectId(params.id) } }, { email }],
    })

    if (existingSupplier) {
      return NextResponse.json({ error: "Supplier with this email already exists" }, { status: 400 })
    }

    const updateData = {
      name,
      contactPerson,
      email,
      phone,
      address: address || "",
      city,
      country,
      paymentTerms: paymentTerms || "",
      isActive: isActive !== false,
      updatedAt: new Date(),
    }

    const result = await suppliers.updateOne({ _id: new ObjectId(params.id) }, { $set: updateData })

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Supplier not found" }, { status: 404 })
    }

    // Log the activity
    const clientIP = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"
    const adminUser = await users.findOne({ _id: new ObjectId(decoded.userId) })

    await logAdminActivity({
      timestamp: new Date(),
      adminUser: adminUser?.username || "Unknown",
      adminEmail: adminUser?.email || "Unknown",
      action: "UPDATE_SUPPLIER",
      details: `Updated supplier: ${name}`,
      ipAddress: clientIP,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating supplier:", error)
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
    const suppliers = db.collection("suppliers")
    const purchaseOrders = db.collection("purchase_orders")
    const users = db.collection("users")

    // Check if supplier has purchase orders
    const poCount = await purchaseOrders.countDocuments({ supplierId: params.id })
    if (poCount > 0) {
      return NextResponse.json({ error: "Cannot delete supplier with existing purchase orders" }, { status: 400 })
    }

    // Get supplier info before deletion for logging
    const supplier = await suppliers.findOne({ _id: new ObjectId(params.id) })

    if (!supplier) {
      return NextResponse.json({ error: "Supplier not found" }, { status: 404 })
    }

    const result = await suppliers.deleteOne({ _id: new ObjectId(params.id) })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Supplier not found" }, { status: 404 })
    }

    // Log the activity
    const clientIP = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"
    const adminUser = await users.findOne({ _id: new ObjectId(decoded.userId) })

    await logAdminActivity({
      timestamp: new Date(),
      adminUser: adminUser?.username || "Unknown",
      adminEmail: adminUser?.email || "Unknown",
      action: "DELETE_SUPPLIER",
      details: `Deleted supplier: ${supplier.name}`,
      ipAddress: clientIP,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting supplier:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
